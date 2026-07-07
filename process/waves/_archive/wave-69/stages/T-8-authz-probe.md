# T-8 — Live Authz Probe: Moderation Report Action-Loop (PRODUCTION)

**Wave:** 69 · **Stage:** T-8 Security · **Target:** https://api-production-b93e.up.railway.app (DEPLOYED prod revision)
**Auth:** SuperTokens EmailPassword, header-token transfer mode (`Authorization: Bearer <st-access-token>`)
**Probe date:** 2026-07-07 · **Authorization:** owner-authorized pre-launch security gate, prod-clean rule observed.

## Verdict

**ALL 4 LOAD-BEARING AUTHZ PATHS HOLD LIVE ON THE DEPLOYED REVISION. No auth-bypass finding. Authz boundary PROVEN LIVE.**

| # | Path | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | no-IDOR (reporter_id from session, not spoofable) | spoof ignored, reporter_id = real session uid | 201, reporter_id = A's real uid | **PASS** |
| 2 | moderate_members gate | owner 200 / non-mod 403 | 200 (A) / 403 (B) | **PASS** |
| 3 | rank-guard (cannot timeout an owner) | 403, report stays open, no mute | 403 "Cannot moderate yourself", report open | **PASS** |
| 4 | cross-server tamper guard (target_server_id === route serverId) | 404, no side effect | 404 "Report ... not found", report still open | **PASS** |

## Environment / fixtures

- **Fixture A** `studyhall-e2e-fixture@example.com` — signin 200, real userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2`. Owner of `Fixture Proof Server` (`ad62cd12-b78e-4a85-a214-042cf176b16c`); GET /servers returned 578 servers, all ownerId = A.
- **Fixture B** `studyhall-e2e-fixture-b@example.com` — signin 200, userId `da74148e-132e-4faf-a526-a34c28e7481b`. Not a moderator on ad62cd12 (used for P2 negative).
- Second server (P4 route-through): `eefbe99b-dca9-4dd7-bf0c-d4d85b8f00c8` (A owns).

## Per-path evidence

### Probe 1 — no-IDOR — PASS
`POST /reports` body included `"reporter_id":"HACKER-SPOOF-ID"`. Response **201**; created report `1bbb0739-0e8e-474c-a8eb-180e51a12bfd` persisted with `reporter_id":"21984eb2-...` (A's real session uid). Re-read via `GET /servers/ad62cd12.../reports?status=open` confirmed the persisted reporter_id = real uid, NOT the spoof. Server derives reporter_id from the session, ignores the client-supplied field. No IDOR.

### Probe 2 — moderate_members gate — PASS (both directions live)
- Owner A: `GET /servers/ad62cd12.../reports` → **200**.
- Non-moderator B (re-run live this probe, not just cited from T-5): `GET /servers/ad62cd12.../reports` → **403** `{"message":"Insufficient permissions: moderate_members required","error":"Forbidden","statusCode":403}`.

### Probe 3 — rank-guard — PASS
Filed member report `320f98b3-c549-4d68-9a6b-a83c15e571c3` targeting the OWNER (A's uid = owner rank). `POST /servers/ad62cd12.../reports/<id>/resolve {"action":"timeout"}` → **403** `{"message":"Cannot moderate yourself",...}`. The self-branch of the rank guard fires first (actor A is also the owner-target). Report verified still `status:open`, `resolved_at`/`resolved_by` null — no side effect, no mute.
  - **Coverage note:** because the only moderate_members holder on this fixture is the owner themself, the reachable owner-rank branch here is the *self* guard. The distinct "different actor times out an owner" branch cannot be exercised on this fixture (a non-owner with moderate_members would be needed) — proven in CI integration per T-5; the live owner-rank rejection + no-side-effect is confirmed here.

### Probe 4 — cross-server tamper guard — PASS
Took report `1bbb0739...` (target_server_id = ad62cd12) and called `POST /servers/eefbe99b.../reports/1bbb0739.../resolve {"action":"dismiss"}` (route serverId != report's target_server_id) → **404** `{"message":"Report 1bbb0739... not found",...}`. Report lookup is scoped by route serverId, so mismatch 404s before any mutation. Verified report still `status:open` after the 404 (no side effect).

## Session cookie / header observations (Action 3 light session check)

- Prod runs SuperTokens **header-token transfer mode**: signin returns tokens in `st-access-token` / `st-refresh-token` / `front-token` **response headers**, NOT `Set-Cookie`. No httpOnly session cookie is emitted on this revision — token transport is header-based (`Authorization: Bearer`), so httpOnly/SameSite/Secure cookie attributes are N/A for this deployment. (The browser client stores tokens per SuperTokens frontend SDK; XSS-hardening of that storage is a frontend concern, out of scope for this API probe.)
- CORS is correctly locked: `access-control-allow-origin: https://web-production-bce1a8.up.railway.app` (single origin, not `*`), `access-control-allow-credentials: true`, exposed headers limited to `front-token, st-access-token, st-refresh-token`.
- Report endpoints (POST /reports, GET/POST resolve) leak **no internal state** in headers — only standard `x-powered-by: Express`, `server: railway-hikari`, `x-railway-*` infra ids. No stack traces, DB errors, or internal identifiers in any error body; error responses are clean JSON `{message,error,statusCode}`.

## INFO (non-blocking)

- **Report submission rate limit — present, not absent.** POST /reports and GET /servers both returned `x-ratelimit-limit: 10 / remaining / reset: 60`. (Task noted "no rate limit" as a known deferred; the deployed revision DOES apply a 10/60s limiter on these endpoints — the deferred gap does not reproduce here. Recording as INFO.)
- `x-powered-by: Express` header is exposed — minor fingerprinting surface, standard hardening would strip it. Non-blocking.

## Cleanup (prod-clean rule — satisfied)

Reports created by probes and their disposition:
- `1bbb0739-0e8e-474c-a8eb-180e51a12bfd` (P1) → **dismissed** (200).
- `320f98b3-c549-4d68-9a6b-a83c15e571c3` (P3) → **dismissed** (200).
- P4 reused the P1 report (no new report), P2 read-only (no report).

Final check: `GET reports?status=open` filtered on `authz-probe` reason → **0 probe reports remain open**. No member timed out, no message deleted, open queue restored. Dismiss is non-destructive.
