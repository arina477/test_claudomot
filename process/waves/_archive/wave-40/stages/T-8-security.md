# T-8 Security re-verify — wave-40 avatar hardening

Target: `https://api-production-b93e.up.railway.app` (StudyHall prod, self-owned). Non-destructive authed re-verify of wave-40 avatar 500→4xx hardening. Date: 2026-07-03. Fixture userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2` (header-based SuperTokens; Bearer access token).

## Probe 1 — control/NUL-byte userId → 400 (not 500) — PASS
`GET /users/:userId/avatar` with control bytes in the id:
- `%00` (bare NUL) → **400** `{"message":"Bad Request","error":"Bad Request","statusCode":400}`
- `abc%00def` (embedded NUL) → **400**
- `abc%01def` (SOH) → **400**
- `abc%1fdef` (US, 0x1f) → **400**
- `abc%7fdef` (DEL, 0x7f) → **400**

Boundary guard rejects all C0 + DEL control bytes with 400. No 500 observed.

## Probe 2 — REGRESSION: valid non-UUID id NOT rejected — PASS
- `GET /users/st-user-nonexistent-abc123/avatar` → **404** `{"message":"User has no avatar",...}` (NOT 400 — guard imposes no UUID shape)
- `GET /users/21984eb2-8029-4c1b-9e73-bc586a0be4d2/avatar` (fixture, has avatar) → **302** redirect to presigned storage URL

Guard is a control-byte filter only; arbitrary printable ids still resolve normally.

## Probe 3 — confirm never-uploaded key → 404 (authed) — PASS
- `POST /profile/avatar/presign {contentType:image/png}` → 200, returned own-scoped key `avatars/21984eb2-.../8c983bc3-...png`
- `POST /profile/avatar/confirm {key}` WITHOUT any prior PUT → **404** `{"message":"Avatar object not found","error":"Not Found","statusCode":404}` (was 500 uncaught HeadObject NoSuchKey)
- Post-confirm `GET /profile` → avatarUrl UNCHANGED (`?v=309451ad`, the pre-existing value) → not persisted on failed confirm. CONFIRMED.

## Probe 4 — no data leak — PASS
All 4xx bodies are generic; no stack trace, no internal path/SQL/S3/bucket/key-provider detail:
- 400 body: `{"message":"Bad Request","error":"Bad Request","statusCode":400}`
- 404 (no avatar): `{"message":"User has no avatar",...}`
- 404 (NoSuchKey): `{"message":"Avatar object not found",...}`
- Headers expose only `server: railway-hikari`, `x-powered-by: Express` (framework banner — informational, pre-existing, not wave-40 scope).

## Probe 5 — happy path intact + unauth guard — PASS
- unauth `POST /profile/avatar/confirm` (no token) → **401** `{"message":"unauthorised"}`
- presign → PUT 1x1 PNG (HTTP 200) → `POST /profile/avatar/confirm {key}` → **200** `{"avatarUrl":".../avatar?v=f3089d2f"}`; `GET /profile` reflects updated avatarUrl. Full round-trip healthy.

## Notes
- Header-based SuperTokens: signin returns `st-access-token` header (not Set-Cookie). Authed probes used `Authorization: Bearer <token>`.
- Fixture avatar was legitimately rotated to a valid 1x1 PNG (`?v=f3089d2f`) by probe 5 — expected sanity mutation on the dedicated e2e fixture, non-destructive.

---
```yaml
applicable_probes:
  - id: 1
    name: control-byte userId -> 400 not 500
  - id: 2
    name: regression non-UUID id not rejected
  - id: 3
    name: confirm NoSuchKey -> 404 authed
  - id: 4
    name: no data leak in error bodies
  - id: 5
    name: happy path 200 + unauth 401
results:
  probe_1_controlbyte_400: PASS   # %00,%01,%1f,%7f,embedded all 400; no 500
  probe_2_nonuuid_regression: PASS # non-UUID -> 404, fixture -> 302
  probe_3_nosuchkey_404: PASS      # confirm-never-uploaded -> 404; avatar_url not persisted
  probe_4_no_data_leak: PASS       # generic bodies; no stack/path/S3/SQL
  probe_5_happy_path: PASS         # presign->PUT->confirm 200; unauth confirm 401
secret_grep_findings: []
findings:
  - severity: informational
    id: SH-W40-INFO-1
    title: Express framework banner disclosure
    detail: Responses carry `x-powered-by: Express` and `server: railway-hikari`. Pre-existing, out of wave-40 scope; low value to attacker. Optional: disable x-powered-by (app.disable('x-powered-by')).
overall: PASS
regressions: none
