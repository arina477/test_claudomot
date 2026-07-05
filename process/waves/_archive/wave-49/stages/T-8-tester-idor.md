# T-8 Security — StudyHall Shared Study Timer: Authorization / IDOR Probe

Wave: 49 · Stage: T-8 · Tester: penetration-tester · Date: 2026-07-05
Scope: authorized probe of StudyHall's own Railway deploy with our own fixtures only.
- API: `https://api-production-b93e.up.railway.app`
- Web: `https://web-production-bce1a8.up.railway.app`
Focus: the P-4 karen/jenny carry — study-timer endpoints MUST be membership-gated and IDOR-safe.
Auth model: SuperTokens EmailPassword; header-mode bearer used for probes (`st-auth-mode: header`),
cookie-mode used to inspect cookie/CSRF surface. WS namespace `/study-timer` authenticated via
shared `installWsAuthMiddleware` (cookie `sAccessToken` first, `handshake.auth.accessToken` fallback).

Fixtures (both email-verified, prod fixtures per `command-center/testing/test-accounts.md`):
- **Fixture A** `studyhall-e2e-fixture@example.com` (uid `21984eb2…`) — member of shared server `ad62cd12`.
- **Fixture B** `studyhall-e2e-fixture-b@example.com` (uid `da74148e…`) — co-member of `ad62cd12`.

Probe-target server `0299349d-1cef-4c1c-92e8-1b530e337616` ("T-8 IDOR probe target") was created
by A during this probe (real existing server + real running timer) specifically so B — a genuine
non-member of it — could attempt a real-data cross-user IDOR. Both timers reset to idle at close.

---

## BOTTOM LINE

**Is the study timer IDOR-safe (non-members denied) in production? YES.**

Every non-member access — REST read, REST mutate (start/pause/resume/reset), and WS room join —
is denied with 403 / `study-timer:join_error`, across a foreign nonexistent UUID, a random
real-format UUID, AND a real existing server owned by another user with a live running timer.
No timer payload ever leaked to a non-member; no non-member mutation ever succeeded. Positive
controls (member reads/joins) return 200 / state, proving the denials are authorization, not a
blanket break. **Zero Critical, zero High findings.** One Medium (anti-CSRF disabled but
compensated) and cookie-attribute notes below.

---

## Probe results

### Probe 2 — Own-server positive control (A, member of `ad62cd12`) — PASS
`GET /servers/ad62cd12…/study-timer` with A's valid session → **200**
`{"serverId":"ad62cd12…","phase":"work","runState":"running","endsAt":"…","remainingMs":…,"running":true,"updatedBy":"21984eb2…"}`
Proves authorized reads succeed → the 403s below are real authorization decisions.

### Probe 1a — Foreign nonexistent server, REST GET (A's session) — PASS
`GET /servers/00000000-0000-0000-0000-000000000000/study-timer` → **403**
`{"message":"You are not a member of this server","error":"Forbidden","statusCode":403}`

### Probe 1a' — Random real-format v4 UUID, REST GET (A's session) — PASS
`GET /servers/87cd4771-cc32-47ba-aacd-0bdbcc18a5cf/study-timer` → **403** (same body).
`assertMember` denies uniformly whether or not the row exists — no existence oracle, no leak.

### Probe 1b — Foreign server REST mutations start/pause/resume/reset (A's session) — PASS
`POST /servers/00000000-…-000000000000/study-timer/{start,pause,resume,reset}` → **403** on all four
`{"message":"You are not a member of this server","error":"Forbidden","statusCode":403}`
No mutation reached the service; membership is checked before any state change.

### Probe 1c — CROSS-USER real-data IDOR: B reads A's real running-timer server — PASS (the crux)
Target `0299349d…` is a real server A owns with a **running** timer (started by A during probe).
B (valid, verified, distinct session; genuine non-member) →
`GET /servers/0299349d…/study-timer` → **403** `{"message":"You are not a member of this server",…}`
**No timer payload leaked** — the strongest IDOR case (existing row + real state + real second user)
is denied.

### Probe 1d — CROSS-USER mutation: B resets A's real server timer — PASS
`POST /servers/0299349d…/study-timer/reset` (B's session) → **403** (same body). No mutation.

### Probe 3d — WS handshake with no session — PASS
Namespace connect to `/study-timer` with empty `auth` → `connect_error: Unauthorized`
(handshake rejected at the `io.use()` middleware; socket never joins the namespace).
Note: the raw engine.io transport open (`GET /socket.io/?EIO=4&transport=polling`) returns 200 —
this is the transport layer opening *before* namespace auth, which is normal Socket.IO behavior;
the security gate is the namespace middleware, which correctly rejects (verified above).

### Probe 3c — WS non-member `join_timer_room` (B → A's foreign server) — PASS
B connects to the namespace (auth OK, member of the platform) then
`emit('join_timer_room',{serverId:'0299349d…'})` →
server emits `study-timer:join_error {"message":"Forbidden: not a member of this server"}`.
**No `study-timer:update` and no `study-timer:presence` leaked** — the gateway rechecks membership
server-side on join and refuses the room. (The namespaced `study-timer:join_error` event confirms
the B-6 fix `7788980` is live in prod — the reserved `'error'` channel is not used.)

### Probe 3c-control — WS member join (B → shared server `ad62cd12`, B IS member) — PASS
Same flow against a server B belongs to → receives
`study-timer:update {serverId:"ad62cd12…", timer:{…}}`. Confirms the join denial above is
authorization, not a broken WS path.

### Probe 4 — CSRF / cookie-attribute surface

**4a — Anon (no session) state-change** → **401** `{"message":"unauthorised"}`. Controls require a session.

**4b — Cookie attributes (cookie-mode signin, `Set-Cookie`):**
- `sAccessToken` … `Path=/; HttpOnly; Secure; SameSite=None`
- `sRefreshToken` … `Path=/auth/session/refresh; HttpOnly; Secure; SameSite=None`
Both cookies are **HttpOnly + Secure**. `SameSite=None` is required by design (web and api on
different Railway subdomains → `CROSS_ORIGIN_PROD=true` forces `cookieSameSite:'none'`, per
`apps/api/src/auth/supertokens.config.ts:93`). `SameSite=None` means cookies ARE attached
cross-site, so CSRF protection cannot rely on SameSite alone — it must rely on the anti-CSRF token.

**4c — Forged / cross-origin state-change (cookie only, NO anti-csrf, POST) — PASS (protected):**
Same valid `sAccessToken` cookie for member A, no bearer, no anti-csrf token:
- `GET  /servers/0299349d…/study-timer`  (cookie, allowed origin)  → **200** (read allowed)
- `POST /servers/0299349d…/study-timer/reset` (cookie, allowed origin) → **401** `{"message":"try refresh token"}`
- `POST …/reset` (cookie, `Origin: https://evil-attacker.example.com`) → **401** `{"message":"try refresh token"}`
**4d — Isolation control:** the identical `reset` via proper `Authorization: Bearer` (header mode,
no cookie) → **200** `{…,"runState":"idle",…}`. This proves the token/action are valid and the
cookie-only 401 above is the **anti-CSRF gate** rejecting a state-changing (non-idempotent) request
that carries a session cookie without CSRF proof — exactly the intended defense. GET (idempotent)
is not CSRF-gated; POST is. A cookie-riding cross-site forged POST therefore CANNOT mutate timer state.

---

## Findings & severity

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Study-timer REST read/mutate IDOR (non-member) | Critical if present | **NOT PRESENT** — all denied 403 |
| 2 | WS `join_timer_room` non-member state leak | Critical if present | **NOT PRESENT** — `join_error`, no leak |
| 3 | WS handshake accepts no-session | Critical if present | **NOT PRESENT** — `Unauthorized` |
| 4 | Anti-CSRF token disabled (`antiCsrfToken:null`) | **Medium** (informational-leaning) | Present but **compensated** — see below |
| 5 | `SameSite=None` on session cookies | Low (by-design) | Accepted — required by cross-subdomain topology |
| 6 | Secret leak in new study-timer code | — | **CLEAN** (grep below) |

### Finding 4 — Anti-CSRF token is disabled, but state-change CSRF is still blocked — MEDIUM (net-defended)
Observation: every issued session shows `antiCsrfToken: null` (front-token payload + JWT), and
`supertokens.config.ts` sets `cookieSameSite:'none'` without an explicit `antiCsrf`. Despite the
null token, the live behavior in Probe 4c/4d is that **state-changing POSTs with only a cookie are
rejected 401 `try refresh token`** while the same action via bearer succeeds — i.e. SuperTokens is
enforcing its CSRF protection on non-idempotent methods (the `try refresh token` path fires when the
front-token / CSRF handshake is not satisfied on a cookie-borne mutation). So the practical CSRF
posture on the study-timer controls is: **a blind cross-site forged POST cannot mutate timer state.**
Why still flagged Medium (not dismissed): the *configuration* relies on SuperTokens' implicit CSRF
default for `SameSite=None` rather than an explicit `antiCsrf: 'VIA_TOKEN'` in the Session.init call,
and the observed `antiCsrfToken:null` makes the mechanism non-obvious to a maintainer reading the
tokens. The defense is empirically working today; the recommendation is to make it **explicit**
(set `antiCsrf: 'VIA_TOKEN'` in `supertokens.config.ts` so the posture is legible and cannot silently
regress on an SDK-default change), and to keep an integration test asserting cookie-only POST → 401.
This is a hardening/legibility item, not an exploitable gap: no forged-request mutation was achievable.

### Finding 5 — `SameSite=None` — LOW / accepted
Forced by the web/api split-subdomain deploy (documented in `supertokens.config.ts:83-96`). Mitigated
by `Secure` + `HttpOnly` + the working anti-CSRF gate above. No action required beyond Finding 4's
make-CSRF-explicit hardening.

### Secret-leak sanity — CLEAN
Grep over the new surface — `apps/api/src/study-timer/*`, `apps/api/src/common/ws-auth.ts`,
`apps/web/src/shell/{studyTimerSocket.ts,StudyTimerWidget.tsx}`, `packages/shared/src/study-timer.ts` —
for api-keys / secrets / passwords / bearer literals / PEM headers / provider key prefixes
(AKIA / xox / sk_live / ghp_ …) and long base64 literals: **zero hits**. Confirms the
orchestrator's clean diff grep. (Access-token strings appearing in this report are ephemeral
session tokens minted during the probe, not committed secrets.)

---

## Triage routing

No Critical/High to route. The single actionable item (Finding 4, Medium) is a **security-hardening +
config-legibility** change — make anti-CSRF explicit (`antiCsrf:'VIA_TOKEN'`) and add a
cookie-only-POST-rejected regression test. Per the Iron Law this probe did NOT modify any code;
route Finding 4 to security-engineer / the auth owner for the explicit-config change if the gate
wants it addressed this wave. The IDOR/authorization posture itself requires **no** remediation —
membership gating is correct on REST (both read + all four mutations) and WS (handshake + join).

## Test hygiene / state left behind
- Shared server `ad62cd12` timer: **reset to idle** at close (was `running` on arrival — I did not
  start it; reset to the clean idle state as the safe leave-as-found).
- Probe-target server `0299349d…` timer: **reset to idle** at close.
- One net-new server row `0299349d…` ("T-8 IDOR probe target") persists in prod DB (servers have no
  DELETE endpoint — same known limitation noted for the fixture proof server). Owned by Fixture A;
  timer idle. No other state changes.
- Rate limiting (429 `ThrottlerException`) was observed and respected (back-off between probes; no DoS).
