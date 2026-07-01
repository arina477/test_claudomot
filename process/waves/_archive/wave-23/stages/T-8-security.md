# T-8 Security — wave-23 (delegated assignment-organizer authz)

**Target:** LIVE prod — api `https://api-production-b93e.up.railway.app`, web `https://web-production-bce1a8.up.railway.app`
**Date:** 2026-07-01
**Method:** HTTP-level authed probes via real SuperTokens `/auth/signin` (`rid: emailpassword`, `st-auth-mode: header` → `Authorization: Bearer <st-access-token>`), following T-5 tester A's working pattern. Browser layer is chrome-blocked; all probes here are HTTP-level and succeeded.
**Fixtures (prod, non-real):**
- A = `studyhall-e2e-fixture@example.com` (`21984eb2-…`) — **owner** of test server.
- B = `studyhall-e2e-fixture-b@example.com` (`da74148e-…`) — **non-owner member** of the same server, baseline all-false permissions.
**Test server:** `ad62cd12-b78e-4a85-a214-042cf176b16c` ("Fixture Proof Server", owner = A).

---

## BOTTOM LINE

**The delegated-organizer authz boundary is AIRTIGHT on LIVE prod.** All three doors hold:
- **Write door** (`manage_assignments` gate): non-privileged member → 403; owner → 201; **manage_channels-only member → 403** (the swap is complete — the old key no longer grants); member holding `manage_assignments` → 201.
- **Read door** (`/me/permissions`): session-derived only, IDOR-safe both directions, non-member → 403, unauth → 401.
- **Escalation door** (role writes): every self-grant path is `manage_roles`/`manage_members`-gated → 403.

**Critical: 0. High: 0. Medium: 0. Low: 4** (all pre-existing / non-blocking; none in the wave's authz surface).

Full gate truth-table verified end-to-end on prod: `{no perm→403, manage_channels-only→403, manage_assignments→201, owner→201}`. All test state was restored (B back to no-role, test role deleted, 3 throwaway assignments soft-deleted).

---

## Per-probe result table

| # | Probe | Expected | Observed | Verdict |
|---|-------|----------|----------|---------|
| 1 | B (member, no `manage_assignments`) `POST /servers/:id/assignments` | 403 | 403 `Insufficient permissions: organizer (manage_assignments) required` | PASS |
| 1b | B `POST …/assignments/attachments/presign` | 403 | 403 (same envelope) | PASS |
| 2 | A (owner) `POST …/assignments` (superuser path) | 201 | 201, valid Assignment DTO | PASS |
| 3 | B `PATCH /assignments/:id` (edit owner's assignment) | 403 | 403 | PASS |
| 3b | B `DELETE /assignments/:id` | 403 | 403 | PASS |
| 4 | B `POST /servers/:id/roles` granting self `manage_assignments` | 403 | 403 `manage_roles required` | PASS |
| 4b | B `PATCH /servers/:id/members/:userId/role` (self-assign) | 403 | 403 `manage_members required` | PASS |
| 5 | B `PATCH /servers/:id/roles/:roleId` set `manage_assignments=true` | 403 | 403 `manage_roles required` | PASS |
| 6 | B with **`manage_channels`-only** role `POST …/assignments` | 403 (swap complete) | 403 | PASS |
| 7 | B with **`manage_assignments`** role `POST …/assignments` (positive control) | 201 | 201 | PASS |
| 8 | IDOR: A `GET …/me/permissions?userId=<B>` | reflects CALLER (owner:true) | owner:true — injected id ignored | PASS |
| 8b | IDOR reverse: B `GET …/me/permissions?userId=<A owner>` | reflects CALLER (owner:false) | owner:false — no escalation | PASS |
| 9 | Unauth `GET …/me/permissions` (no token) | 401 | 401 `{"message":"unauthorised"}` | PASS |
| 10 | Non-member `GET …/me/permissions` (valid non-member UUID) | 403 | 403 `Server not found or access denied` | PASS |
| 11 | `POST …/assignments` well-formed non-existent server UUID (B) | 403 default-deny | 403 | PASS |
| 12 | Malformed (non-UUID) `:serverId` on POST + `/me/permissions` | 400/404 | **500** generic envelope (both endpoints) | LOW-1 |
| 13 | Cookie attrs on fresh `/login` | HttpOnly+Secure+SameSite unchanged | HttpOnly ✓ Secure ✓ SameSite=None | PASS |
| 14 | Rate-limit `/me/permissions` ~30x | record behavior | 429 after ~10 req (ThrottlerGuard active), `retry-after` set | PASS (control present) |
| 15 | Error envelopes leak internal state? | no stack/SQL/redis | generic envelopes only, no leak | PASS |

---

## The swap is verifiably complete (the wave's core assertion)

Verified live by mutating B's role as owner A and re-probing, then restoring:

```
B no role        → /me/permissions all-false → POST assignment → 403
B manage_channels→ manage_channels:true, manage_assignments:false → POST assignment → 403  ← proves old key no longer grants
B manage_assignments → manage_assignments:true → POST assignment → 201                    ← proves new key grants
A owner          → owner:true → POST assignment → 201
```

This is the definitive proof that `assertOrganizer` now gates on `manage_assignments` (not `manage_channels`) and that owner superuser still passes. Source confirmation: `apps/api/src/assignments/assignments.service.ts:61` → `can(userId, serverId, 'manage_assignments')`.

---

## Cookie attributes (fresh cookie-mode signin)

```
sAccessToken=…;  Path=/;                       HttpOnly; Secure; SameSite=None
sRefreshToken=…; Path=/auth/session/refresh;   HttpOnly; Secure; SameSite=None
```

- **HttpOnly ✓, Secure ✓** — unchanged, no regression (wave touched no session/cookie code).
- **SameSite=None** — expected and correct for this split-origin deploy (web and api are distinct Railway subdomains → cross-site cookies require `SameSite=None; Secure`). CSRF risk is mitigated by SuperTokens' anti-CSRF token + header-token mode. Not a regression.

---

## Rate-limit behavior (informational, as requested)

`/me/permissions` IS rate-limited by a global NestJS `ThrottlerGuard` (`app.module.ts`: in-memory, `ttl: 60_000`, ~10 req/window). Observed: 30 concurrent requests → 4×200 / 26×429; `retry-after: 60` (decrementing). 429 body: `"ThrottlerException: Too Many Requests"`. The wave added no new policy — the endpoint simply inherits the existing global throttle. This is a **positive** control (basic brute-force/enumeration protection is present). Note: in-memory throttler is single-pod only (no Redis) — horizontal scale would weaken it, but that is out of scope for this wave.

---

## Findings (all LOW — none in the wave's authz surface, none blocking)

### LOW-1 — Malformed (non-UUID) `:serverId` path param → 500 instead of 400/404
`POST /servers/not-a-uuid/assignments` and `GET /servers/not-a-uuid/me/permissions` both return `500 {"statusCode":500,"message":"Internal server error"}`. Root cause: the path param is passed straight into `db.select().where(eq(servers.id, <param>))`, and Postgres rejects the non-UUID literal (SQLSTATE 22P02) → uncaught → 500. A **well-formed** non-existent UUID correctly returns 403 (default-deny), so this is **not an authz bypass and not an information leak** (envelope is generic). It is a pre-existing input-validation/robustness gap unrelated to this wave. 
**Remediation:** validate UUID path params at the edge — a Nest `ParseUUIDPipe` on `:serverId`/`:id` (or a zod param guard) returns a clean 400 before the DB call. Low priority; noisy-500 hygiene only.

### LOW-2 — Stale/incorrect security comments still say `manage_channels`
`apps/api/src/assignments/assignments.controller.ts:45-47` and `:221`, plus `assignments.service.ts:56` docblock, still describe the organizer gate as `can(userId, serverId, 'manage_channels')` even though the code (line 61) correctly uses `manage_assignments`. The runtime is correct; the comments are not. 
**Risk:** a future maintainer trusting the comment could "restore consistency" by reverting the key → silent CRITICAL regression (this exact swap). 
**Remediation:** update the three docblocks to `manage_assignments`. Documentation-only fix.

### LOW-3 — No `Strict-Transport-Security` header on API responses
No HSTS header observed on `/auth/signin` or API responses. Pre-existing, platform-level (Railway edge may terminate TLS without adding it). 
**Remediation:** add `Strict-Transport-Security: max-age=31536000; includeSubDomains` via the API's response middleware or platform config. Defense-in-depth; not wave-related.

### LOW-4 — 429 envelope exposes framework exception class name
The throttle 429 body is the raw string `"ThrottlerException: Too Many Requests"`, leaking the framework/guard class name. No sensitive data, but inconsistent with the clean JSON envelopes elsewhere and mildly fingerprints the stack (alongside `x-powered-by: Express`). 
**Remediation:** normalize the throttle response to the standard `{statusCode,message}` envelope and drop `x-powered-by`. Cosmetic hardening.

---

## Error-envelope hygiene (no leaks)

All negative responses returned clean, generic envelopes — no stack traces, no raw SQL, no redis keys, no internal paths:
- 401 → `{"message":"unauthorised"}`
- 403 → `{"message":"…","error":"Forbidden","statusCode":403}`
- 500 → `{"statusCode":500,"message":"Internal server error"}`
- 429 → `"ThrottlerException: Too Many Requests"` (framework class name only — see LOW-4)

---

## Cleanup ledger (all restored)

| Action taken during test | Reverted |
|---|---|
| Created throwaway assignment (A, owner) `39f13da9-…` | soft-deleted (204) |
| Created throwaway assignment (B, positive-control) `f3aa6f0d-…` | soft-deleted (204) |
| Created temp role `T8-channels-only` (`76c0af2a-…`) | deleted (204) |
| Assigned temp role to B | B restored to `role_id=null` (204); `/me/permissions` re-confirmed all-false |

No residual prod state changes. (Note: DELETE on assignments is a soft-delete per the schema; rows are tombstoned, not hard-removed — consistent with app behavior.)

---

## Verdict

**Delegated-organizer authz boundary is airtight LIVE.** No Critical/High/Medium findings. The `manage_channels → manage_assignments` swap is complete and correct on prod; owner superuser preserved; read door session-derived + IDOR-safe; escalation doors `manage_roles`/`manage_members`-gated. The 4 Low items are pre-existing hygiene/robustness notes outside this wave's scope (input-validation 500, doc drift, HSTS, 429 envelope) — recommend a follow-up cleanup task, none block the T-block gate.
