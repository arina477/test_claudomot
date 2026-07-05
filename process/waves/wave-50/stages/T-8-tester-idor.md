# T-8 Security — Study-Timer Config Endpoint IDOR / Authz Probe

**Wave:** 50 · **Layer:** T-8 Security · **Tester:** tester-idor
**Target (LIVE prod):** `https://api-production-b93e.up.railway.app`
**Endpoint under test:** `PATCH /servers/:serverId/study-timer/config` — body `{workMinutes:1-120, breakMinutes:1-60}`
**Session:** Fixture A `studyhall-e2e-fixture@example.com` (userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2`), signed in live via `POST /auth/signin` (`rid: emailpassword`, `st-auth-mode: header`), bearer access token on every request.
**Server (own, member):** Fixture Proof Server `ad62cd12-b78e-4a85-a214-042cf176b16c`
**Authorization:** StudyHall's own deploy + our own fixtures only. No infra attack, no DoS, no real users. Rate-limit (429) respected with cooldowns.

---

## HEADLINE ANSWER

**Is the study-timer config endpoint IDOR-safe (non-members denied) AND idle-guarded in production? — YES.**

- A valid, authenticated NON-member session cannot mutate (or read) another server's timer config — every foreign-server attempt returns **403** with no state change. No 200-mutation of a foreign server was achievable. **No IDOR.**
- The idle-only state guard returns **409** on both `running` and `paused` states, server-side, and cannot be bypassed by hitting the raw endpoint directly (the wave-49 client-side input-lock is only the first of two layers; the server backstop holds).
- Auth is enforced: anon / forged-token / cookie-only-without-anti-csrf all **401**.
- Input validation (Zod) rejects out-of-range, negative, overflow, float, string, null, and missing fields with **400**; mass-assignment (injected `serverId`/`updated_by` body fields) is **ignored** — serverId is route-derived, userId is session-derived.

No FAILs. No findings above informational. Iron Law honored — no production code modified.

---

## VERDICT SUMMARY

| Probe | Scenario | Expected | Observed | Result |
|---|---|---|---|---|
| 1 | Authenticated NON-member IDOR (crux) | 403 / no mutation | **403** ×3 (2 foreign PATCH + 1 foreign GET) | **PASS** |
| 2 | Own-server positive control (member, idle) | 200 + update | **200**, durations updated 45/12 | **PASS** |
| 3 | Idle-only guard while running / paused | 409 / unchanged | **409** both; durations unchanged | **PASS** |
| 4 | Validation battery (400 + injection) | 400 / no mutation | **400** all bad inputs; injection ignored | **PASS** |
| 5 | Anon + forged + cookie-only CSRF | 401 | **401** all three | **PASS** |
| — | Cleanup | 25/5 idle | 25/5, idle, running=false | **DONE (clean)** |

---

## PROBE 1 — Authenticated NON-member IDOR (the crux) — PASS

With A's genuine valid bearer session, PATCH the config of servers A is NOT a member of.

- **1a** foreign UUID `00000000-0000-4000-8000-000000000001`, body `{workMinutes:99,breakMinutes:42}`:
  `{"message":"You are not a member of this server","error":"Forbidden","statusCode":403}` → **HTTP 403**
- **1b** foreign UUID `deadbeef-0000-4000-8000-c0ffee000001`, same body: **HTTP 403**, same "not a member" body.
- **1c** foreign GET `/servers/00000000-.../study-timer` (read-side membership check): **HTTP 403**.

Enumeration note: `GET /servers` (attempted to discover a real foreign server A doesn't own) returned ONLY servers where `ownerId == A` — the list endpoint is correctly membership-scoped and does not leak foreign servers. A cannot discover a server it doesn't belong to via the API, so the synthetic well-formed foreign UUID is the valid IDOR probe. `assertMember()` gates on a `server_members` row (serverId from route, userId from session) — a non-member is uniformly 403'd whether or not the target server exists (no membership row → 403 before any existence disclosure; no enumeration oracle).

**A non-member changing a server's durations = NOT possible. No IDOR.**

## PROBE 2 — Own-server positive control (member, idle) — PASS

Same session, PATCH `/config` on `ad62cd12` (A IS a member — confirmed present in A's `GET /servers` list) while IDLE, body `{workMinutes:45,breakMinutes:12}`:
`{...,"runState":"idle","workDurationMs":2700000,"breakDurationMs":720000,"updatedBy":"21984eb2-..."}` → **HTTP 200**.
Durations updated (2700000ms=45min / 720000ms=12min). This proves the 403s in Probe 1 are genuine per-membership discrimination, not a blanket-broken endpoint.

## PROBE 3 — Idle-only state guard (409) — PASS

Started the timer (`POST .../start` → 200, runState `running`), then PATCH `/config` `{workMinutes:33,breakMinutes:7}`:
`{"message":"Reset the timer to change durations","error":"Conflict","statusCode":409}` → **HTTP 409**.
Post-block GET: `runState=running, work_ms=2700000, break_ms=720000` — **durations unchanged** (the 33/7 never landed).
Also paused (`POST .../pause` → 200) then PATCH `{workMinutes:11,breakMinutes:3}` → **HTTP 409**, same conflict body.

This is the authz-adjacent guard verification: the wave-49 UI removes the Apply button while running (client-side lock), so a normal browser never fires this PATCH. Hitting the raw endpoint directly bypasses that client lock — and the **server-side guard still holds** (`study-timer.service.ts:731` — `run_state !== 'idle' → ConflictException`). Guard cannot be bypassed. Timer then reset to idle.

## PROBE 4 — Validation / injection / overflow (400) — PASS

All against own server (member, idle). Zod `StudyTimerConfigSchema` (`workMinutes int 1-120`, `breakMinutes int 1-60`):

| Body | Result |
|---|---|
| `{workMinutes:200,breakMinutes:0}` (spec case) | **400** — "less than or equal to 120" / "greater than or equal to 1" |
| `{workMinutes:-5,breakMinutes:-1}` | **400** — both "greater than or equal to 1" |
| `{workMinutes:1e15,breakMinutes:9999999}` (overflow) | **400** — both max-bound errors (no overflow, no huge ms persisted) |
| `{workMinutes:25.5,breakMinutes:5.5}` (float) | **400** — "Expected integer, received float" |
| `{workMinutes:"25",breakMinutes:"5"}` (string) | **400** — "Expected number, received string" (no coercion) |
| `{}` (missing) | **400** — both "Required" |
| `{workMinutes:null,breakMinutes:null}` | **400** — "Expected number, received null" |
| `{workMinutes:1,breakMinutes:1}` (boundary low) | 200 (valid) |
| `{workMinutes:120,breakMinutes:60}` (boundary high) | 200 (valid) |
| **injection** `{workMinutes:25,breakMinutes:5,serverId:"deadbeef",updated_by:"admin"}` | **200** — extra fields IGNORED: response `serverId=ad62cd12` (route-derived, NOT body), `updatedBy=21984eb2-...` (session-derived, NOT body "admin"). **No mass-assignment.** |

No injection, overflow, or coercion vector found. Bad values never mutate state.

## PROBE 5 — Auth required + CSRF — PASS

| Attempt | Result |
|---|---|
| Anon PATCH (no auth) | `{"message":"unauthorised"}` → **HTTP 401** |
| Forged/garbage Bearer token | `{"message":"unauthorised"}` → **HTTP 401** |
| Cookie-only PATCH (`sAccessToken` cookie, NO bearer, NO anti-csrf) | `{"message":"try refresh token"}` → **HTTP 401** |

CSRF note: the deploy runs SuperTokens in **header/bearer auth mode** (`st-auth-mode: header`; signin returns `st-access-token` in a response header and the `anti-csrf` response header was empty). In header mode the session travels as an `Authorization: Bearer` token that a browser does NOT attach automatically to cross-site requests, so a classic cookie-riding CSRF is structurally not possible for this endpoint; the cookie-only attempt (the CSRF shape) was rejected 401. No CSRF exposure on the non-idempotent PATCH.

## Rate limiting (defense-in-depth, informational)

The endpoint is behind a NestJS ThrottlerGuard — mid-battery requests returned `"ThrottlerException: Too Many Requests"` → **HTTP 429**. I honored the 429 backoff (60s+ cooldowns, 8s spacing) and completed all cases without DoS. Rate limiting present = positive hardening signal.

## Secret-leak sanity note

Grep of the wave-50 config-introducing commit `34b4b83` (`apps/api/src/study-timer` + `packages/shared/src/study-timer.ts`, 358 changed lines) for `apikey|api_key|secret|password|bearer|private key|connectionURI|supertokens_api|db_url` on added lines → **no matches**. Diff clean (matches orchestrator's clean grep). No hardcoded secrets in the endpoint code. Ephemeral session tokens used during testing were written only to `/tmp` and deleted at end.

## Findings classification

**No findings.** No critical IDOR, no high missing-guard, no medium hardening gap, no low. The endpoint is membership-gated (403 non-member), idle-guarded (409 non-idle, server-side, unbypassable), auth-required (401), input-validated (400), mass-assignment-safe, rate-limited, and CSRF-safe by header-mode design.

## Iron-Law note

No FAILs → no triage needed. Zero production code modified. All mutations against own server `ad62cd12` were restored: **left at 25/5 (workDurationMs 1500000 / breakDurationMs 300000), runState idle, running=false** — verified clean via final GET.
