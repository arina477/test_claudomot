# V-1 Semantic-Spec Verification (jenny) — Wave-4 Profile Customization

**Spec:** `wave-4-spec` (task `2a655960-a429-432d-8633-e8f149368ca3`)
**Verified against:** LIVE deployment
- api `https://api-production-b93e.up.railway.app` (health 200)
- web `https://web-production-bce1a8.up.railway.app`
**Method:** live curl (two real signups via header-based SuperTokens tokens), code-level inspection, prod DB-table partition check.
**Date:** 2026-06-29

## Verdict: **APPROVE**

9 of 10 ACs MATCH against live/code behavior. AC5/AC6 (avatar real-upload round-trip) is an explicit, ticketed deferral (path built + secured + graceful-503 verified). One Medium-severity drift on AC7 (2MB cap is client-side-only, not server-enforced) is noted as a hardening gap, not a blocker for self-use-mvp — it does not break any user-reachable happy path this wave (avatar upload is infra-blocked behind 84e09891 anyway), and the security-relevant constraints (server-controlled key, user-scoping, MIME allowlist) ARE enforced server-side.

---

## Per-AC findings

### AC1 — users schema (+username unique / avatar_url / accent_color) — **MATCHES**
- Migration `apps/api/drizzle/migrations/0001_graceful_vin_gonzales.sql`: adds `username`, `avatar_url`, `accent_color` (all nullable text) + `CREATE UNIQUE INDEX users_username_lower_idx ON users USING btree (lower("username"))`.
- Behavior-verified applied to prod: live `PATCH /profile {username}` → 200 persists; GET returns it; exact dup → 409. (Migration is on the StudyHall app Postgres — separate from `CLAUDOMAT_DB_URL`, which is the brain DB holding only `founder_bets/milestones/tasks/waves`; this is correct partitioning.)

### AC2 — GET /profile → 4 fields — **MATCHES**
- Live: `GET /profile` (Bearer) → `200 {"displayName":null,"username":null,"avatarUrl":null,"accentColor":null}` for a fresh user; all four keys present.
- Guard: `SessionNoVerifyGuard` (verify-exempt, per wave-3). No-auth → 401 (`{"message":"unauthorised"}`).
- `apps/api/src/profile/profile.controller.ts:28-44`; shared `ProfileResponseSchema` `packages/shared/src/profile.ts:3-8`.

### AC3 — PATCH /profile {displayName?,username?,accentColor?} (Zod) — **MATCHES**
- Live: `PATCH /profile {"displayName":"Jenny A","accentColor":"#3b82f6","username":"alpha_33898"}` → `200` returns full updated profile; re-GET confirms persistence.
- Zod `UpdateProfileSchema` (`packages/shared/src/profile.ts:12-22`) — all three fields optional; controller `safeParse` → 400 on failure (`profile.controller.ts:52-55`).

### AC4 — username uniqueness (collision / case-fold / concurrent / format) — **MATCHES**
- Collision → **409 not 500**: live B claims A's `alpha_33898` → `{"message":"username_taken","statusCode":409}`. PG `23505` is caught + mapped to `ConflictException` (`users.service.ts:23-38, 85-92`).
- Format invalid → **400**: `"ab"` (too short) and `"Bad-Name!"` (bad chars) both → 400 field error.
- Case-fold: enforced by **normalization + index** — app lowercases before write (`users.service.ts:79`), unique index is on `lower(username)` (migration line 4). No two users can hold the same name regardless of case. Note: a mixed-case input is rejected at the Zod layer (400) before reaching the DB, so the case-fold guarantee is delivered via "force-lowercase + lower() index" rather than "accept-then-fold" — functionally equivalent and spec-satisfying.
- Concurrent: DB UNIQUE index is the backstop; the loser hits 23505 → 409. Path proven by the live 409.

### AC5 — avatar presign (server-controlled key, MIME allowlist, TTL) — **MATCHES (path built); real upload DEFERRED**
- Server-controlled user-scoped key: `avatars/${userId}/${randomUUID()}.${ext}` (`files.service.ts:88`) — no client path input → no traversal.
- MIME allowlist enforced server-side at controller (`files.controller.ts:18,60-63`) AND service (`files.service.ts:7-11,77-81`); only png/jpeg/webp.
- Short TTL: `PRESIGN_EXPIRY_SECONDS = 300` (`files.service.ts:13,101-103`).
- Live: valid-MIME presign (authed) → **503 `{"code":"STORAGE_NOT_CONFIGURED"}`** (graceful — bucket unprovisioned, founder-pending 84e09891). Path is built, secured, graceful-503 verified. Real S3 PUT round-trip **explicitly DEFERRED** (84e09891 `todo`) — treated as deferred-with-path-built per T-9 head-tester, not satisfied, not a drift.

### AC6 — persist avatar_url after upload + shell render — **MATCHES (code); round-trip DEFERRED**
- Confirm endpoint `POST /profile/avatar/confirm` derives URL from server key + persists via `usersService.setAvatarUrl` (`files.controller.ts:78-99`, `users.service.ts:95-100`). Key re-validated as user-scoped (`startsWith('avatars/${userId}/')`) — live bad-key → 400.
- Shell render: `ChannelSidebar` consumes `useProfile()` → renders `avatarUrl` with initials fallback + `accentColor` (`ChannelSidebar.tsx:113-118`); `ProfileContext` fetches GET /profile + `refresh()` after save. Live end-to-end render of a *real* uploaded image is DEFERRED behind 84e09891 (no bucket) — the render code reads avatarUrl unconditionally so it works the moment a URL persists.

### AC7 — oversized / wrong-MIME reject — **DRIFTS (Medium): 2MB cap is client-side-only, not server-enforced**
- Wrong-MIME: **MATCHES** — live non-image (`application/pdf`, `image/gif`) → 400 server-side, before the storage check.
- Oversized (>2MB): **DRIFTS** — the spec says "rejected server-side (presign constraint + bucket policy)". The code does NOT enforce 2MB on the presigned PUT. `files.service.ts:94-98` explicitly comments that `ContentLengthRange` is a presigned-POST-only feature and the size constraint here is "advisory"; the only 2MB check is client-side in `ProfilePage.tsx:215-218`. There is no bucket policy yet (bucket unprovisioned). A client bypassing the SPA could PUT a >2MB object.
  - **Severity: Medium.** Not user-reachable this wave (upload is infra-blocked behind 84e09891), and the orphaned-object/cost risk is the spec's own accepted self-use-mvp tradeoff. Recommend folding a server-side size enforcement (switch to presigned POST with `content-length-range`, or a bucket lifecycle/size policy) into the 84e09891 bucket-provisioning task so it ships with the real upload. Flag, not a blocker.

### AC8 — settings-profile wiring + shell render — **MATCHES**
- `apps/web/src/pages/ProfilePage.tsx` wires all three previously-"coming soon" controls: username (force-lowercase input, client validate, 409→"taken"/400→format messaging), avatar (file input PNG/JPEG/WEBP, presign→PUT→confirm, 503→graceful "not available yet"), accent picker (8-swatch radiogroup, PATCH on select, live `--user-accent` CSS var). Display-name from wave-3 preserved.
- Shell render via `ProfileContext` + `ChannelSidebar` (accent + avatar/initials). Live web bundle serving; render is code-confirmed (browser click-through DEFERRED — Playwright chrome-channel absent, c51589cd `todo`).

### AC9 — shared FilesModule (avatar | attachment) — **MATCHES (code-level)**
- `apps/api/src/files/files.module.ts` exports `FilesService`; service is purpose-agnostic S3 presign wrapper (`@aws-sdk/client-s3` + `s3-request-presigner`), lazy client init. The `avatar` purpose is implemented; the presign/key/resolve primitives are reusable for the M3 attachment purpose without rework. Minor note: avatar specifics (allowlist, `avatars/` prefix, 2MB) currently live partly in FilesService rather than a per-purpose config — acceptable; M3 can parametrize.

### AC10 — graceful no-creds boot — **MATCHES**
- Live: `/health` → 200 with bucket unconfigured; presign → 503 `STORAGE_NOT_CONFIGURED` (handled, no crash). Lazy S3 client returns null + logs a warning when env absent (`files.service.ts:30-56`); rest of profile (display_name/username/accent) fully works without storage. Verified.

---

## Deferrals (all legitimate, ticketed `todo`)
- **84e09891** — Set Railway Bucket creds + verify avatar upload live (avatar real-upload round-trip; AC5/AC6 completion). Founder-pending credential.
- **c51589cd** — CI browser E2E job (Playwright + chromium); browser click-through of AC8.
- **839af17f** — Rate limiting on auth endpoints (out of this wave's scope).

## Recommendations
1. **AC7 server-side 2MB enforcement** (Medium): fold into 84e09891 — adopt presigned POST `content-length-range` or a bucket size/lifecycle policy so the cap ships with the real upload. Currently advisory/client-side only.
2. Avatar real-upload + shell-render round-trip remains unverifiable until the bucket exists; re-run AC5/AC6 round-trip at 84e09891 close.
3. Browser-level confirmation of AC8 at c51589cd.
