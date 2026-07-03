# V-1 Semantic-Spec Verification (jenny) — wave-40 Avatar Endpoint Hardening

**Verdict: APPROVE**
**Target:** DEPLOYED production API `https://api-production-b93e.up.railway.app` (api b4a6396b)
**Spec:** `tasks.description` of 7525b759 (YAML head ACs) + pointer `process/waves/wave-40/stages/P-2-spec.md`
**Method:** live probe of deployed behavior (spec INTENT), not source-claim. Fixture `studyhall-e2e-fixture@example.com`, userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2` (UUID-shaped; already had an avatar).

Every AC's intent is satisfied against the live deployment. Detail below.

---

## AC1 — GET /users/:userId/avatar with NUL/control byte → 400 (not 500), no leak. **PASS**
Probed 5 control-byte variants; all clean 400 with a **generic** body (`{"message":"Bad Request","error":"Bad Request","statusCode":400}` — no internal/stack/SQL leak):
- `%00` (NUL) → 400
- `%01` (C0) → 400
- `%0A` (newline) → 400
- `%7f` (DEL) → 400
- `%09` (tab) → 400

Zero 500s observed. Matches AC1 + edge-case "userId = %00 / other control chars → 400 (fix#1)".

## AC2 — REGRESSION GUARD: valid non-UUID id → 302/404, NEVER 400. **PASS**
- `some-random-nonuuid-id-123` (valid-shaped, opaque, no avatar) → **404** ("User has no avatar"), NOT 400. The boundary guard imposes no UUID shape — a legitimate non-UUID SuperTokens id is not rejected.
- Real fixture id `21984eb2-...` (has avatar) → **302**.
- `11111111-...` (UUID, no avatar) → **404**.
Confirms the ParseUUIDPipe trap is avoided; malformed-input rejection does not reject legitimate ids. Matches the wave-33 global-filter decision and the P-0 REFRAME.

## AC3 — POST /profile/avatar/confirm, never-uploaded own-scoped key → 404 (not 500), no persist. **PASS**
- Freshly presigned-but-never-PUT key (`avatars/<self>/95ac6c6c-...png`) → **404** ("Avatar object not found"). Authed presign→confirm-without-PUT reproduced the exact F-T8-2 path.
- Fabricated own-scoped key (`avatars/<self>/000...0.png`) → **404**.
- **No persist**: profile `avatarUrl` unchanged (`?v=f3089d2f`) after both 404s.
Matches AC3 + edge-case "confirm key never uploaded → 404/400, no persist". No 500.

## AC4 — Existing behavior preserved. **PASS** (all probed)
- **Valid round-trip**: presign → PUT 1×1 PNG (200) → confirm → **200** with new `avatarUrl (?v=212e6748)`; render `GET /users/:id/avatar` → **302**. Happy path + persist + render intact.
- **>2MB**: presign → PUT 3 MB → confirm → **413** `{"code":"AVATAR_TOO_LARGE","message":"Avatar must be ≤ 2 MB. Uploaded file is 3072 KB."}`; **did not persist** (avatarUrl still `?v=212e6748`).
- **Unauth**: presign 401, confirm 401 (`{"message":"unauthorised"}`).
- **No-avatar user** → 404; **has-avatar user** → 302 (both above).

---

## Spec drift / map accuracy / new unhandled state

- **Journey map v0.27 wave-40 changelog (line 25)** accurately and precisely describes the F-T8-1/F-T8-2 resolution: control-byte guard `/[\x00-\x1f\x7f]/`→400, P-0 REFRAME off ParseUUIDPipe, confirm NoSuchKey→404, regression guard non-UUID→302/404. Deployed behavior matches this narrative exactly.
- **LOW — doc drift, non-blocking (not a functional gap):** the canonical route-table rows still carry only the wave-38 states and were not extended with the new wave-40 4xx behavior:
  - `command-center/artifacts/user-journey-map.md:93` (`GET /users/:userId/avatar`) lists "404 no-avatar / 503 storage-unset" but omits the NEW **400-on-NUL/control-byte**.
  - `command-center/artifacts/user-journey-map.md:92` (`/profile/avatar/confirm`) omits the NEW **404-on-never-uploaded-key**.
  The wave-40 changelog line captures both, so the map is not wrong — just not fully denormalized into the route rows. Cosmetic; safe to fold at next regen. Not a V-block blocker.
- **No new unhandled state found.** Control bytes, valid non-UUID ids, never-uploaded keys, >2MB, unauth, no-avatar, has-avatar all resolve to intended 4xx/2xx/3xx. No 500 reproduced on any probed path. Error bodies are generic (no leak).

**Recommendation:** APPROVE at V-1. Optional: fold the two new 4xx states into map rows 92–93 at the next journey regen (LOW).
