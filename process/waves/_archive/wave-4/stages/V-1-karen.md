# V-1 Karen — Source-claim verification (wave-4: profile customization)

**Verdict: APPROVE**

Scope: verify wave-4 source claims against the LIVE deployed state.
- main @ `a57b2fe` (local repo on main; PRs #10 + #11 merged).
- Live API: `https://api-production-b93e.up.railway.app`
- Live web: `https://web-production-bce1a8.up.railway.app`
- Verified: 2026-06-29

Every claim below was checked against running code (Read) and live behaviour (curl against prod). No fake-but-claimed completions found. No gold-plating found. The three deferrals named in the prompt are real `todo` rows in the `tasks` table and are NOT counted against this wave.

---

## Per-claim results

### Claim 1 — Files exist on main — VERIFIED
All claimed files present on `main`:
- `apps/api/src/files/files.service.ts` ✓
- `apps/api/src/files/files.controller.ts` ✓
- `apps/api/src/files/files.module.ts` ✓
- `apps/api/src/users/users.service.ts` ✓ (updateProfile + cause-chain unwrap present)
- `apps/api/src/profile/profile.controller.ts` ✓ (extended: GET + PATCH)
- `apps/api/drizzle/migrations/0001_graceful_vin_gonzales.sql` ✓
- `packages/shared/src/profile.ts` ✓ (extended + AvatarPresignResponse)
- `apps/web/src/pages/ProfilePage.tsx`, `apps/web/src/shell/ProfileContext.tsx`, `apps/web/src/auth/api.ts` ✓

### Claim 2 — Migration applied live + behaviour — VERIFIED
Migration `0001` adds `username` / `avatar_url` / `accent_color` and creates the case-insensitive unique index `users_username_lower_idx ON users USING btree (lower("username"))` — exactly the case-fold uniqueness the spec AC requires.

Live behaviour (header-token auth mode — the deployed API runs SuperTokens in header transfer mode; `antiCsrfToken: null`, tokens returned via `st-access-token` response header, sent back as `Authorization: Bearer`. Prompt assumed cookie+anti-csrf mode; the live config is header mode, which is equivalent and correct — anti-csrf is N/A in header mode):
- signup → `200`, user created (`/auth/signup` formFields shape).
- `GET /profile` (authed) → `200` `{displayName:null, username:null, avatarUrl:null, accentColor:null}` — all 4 fields present. ✓
- `PATCH /profile {username, accentColor:"#7C3AED"}` → `200`, returned `{username:"vuser…", accentColor:"#7C3AED"}`. ✓
- `GET /profile` after PATCH → reflects both fields. ✓
- 2nd user `PATCH` same username → **`409 {"message":"username_taken","error":"Conflict"}`** — NOT 500. ✓ (this is PR #11's fix working in prod)
- `PATCH {username:"x"}` (too short) → `400`. ✓
- unauthenticated `GET /profile` and `POST .../presign` → `401`. ✓

### Claim 3 — Avatar path graceful (uploads deferred) — VERIFIED
- `POST /profile/avatar/presign` (authed, bucket unprovisioned) → **`503 {"code":"STORAGE_NOT_CONFIGURED"}`** — graceful, no crash. ✓
- `POST /profile/avatar/confirm {key:"avatars/some-other-user/abc.png"}` → **`400`** "key must be a valid avatar key scoped to the requesting user". ✓
- Real upload correctly DEFERRED (task `84e09891` — bucket creds = founder-supplied). Path exists + degrades gracefully, as claimed. ✓

### Claim 4 — The two fix-forwards are real — VERIFIED
- **PR #11 fix** (`users.service.ts:23-38`): `isUniqueViolation` walks `err.cause?.code` AND `err.cause.cause.code` to find PG `23505` inside the DrizzleQueryError wrapper, maps to `ConflictException` → 409. Confirmed in code AND live (409 above). ✓
- **f7b205a** (`files.controller.ts:88`): confirm validates `key.startsWith(\`avatars/${userId}/\`)` (session-derived userId), not the loose `avatars/` prefix — prevents confirming another user's key. Confirmed in code AND live (400 above). Commit message + 12-test spec confirmed. ✓
- PRs #10 (`f28cda0`) and #11 (`8537f0c`) are real MERGED PRs per `gh`. ✓

### Claim 5 — Antipatterns — NONE
- No claimed-but-fake: every claim backed by live evidence.
- No gold-plating: grep for `sharp`/`resize`/`transcode`/`thumbnail`/`cdn`/`ContentLengthRange` in `apps/api/src/files/` and `packages/shared/src/profile.ts` finds NONE in production code. (`cdn.example.com` appears only as an arbitrary mock URL in `files.controller.spec.ts` — not prod.) Storage contract held: presigned PUT, server-controlled user-scoped key, MIME allowlist, no resize/CDN/multi-size — matches the P-0 HOLD-SCOPE lock.

---

## Minor observations (NOT blockers)

1. **FilesModule "purpose" param absent.** Spec AC reads `FilesModule shared-shaped (purpose: 'avatar' | 'attachment')`. The literal `purpose` enum param is not present — `FilesService` is avatar-specific. However it IS cleanly `exports`-ed from the module, so M3 messaging reuses it without rework (the AC's stated intent). Acceptable for self-use-mvp; flag for M3 to add the discriminator then. Severity: **Low**.
2. **Presign 2MB cap is advisory, not enforced.** `files.service.ts:90-99` documents (honestly, in a code comment) that `ContentLengthRange` is presigned-POST-only; for presigned PUT the size cap is advisory + client-side. Spec edge-case wanted server-side 2MB rejection. Currently this would only be enforced by a bucket policy (bucket not yet provisioned). Since real uploads are deferred to `84e09891`, the enforcement gap rides along with that deferral — verify bucket-policy size limit when creds land. Severity: **Low** (deferred-adjacent; honestly documented, not hidden).
3. **Live auth is header-token mode, not cookie mode** as the prompt assumed. This is a correct/equivalent SuperTokens config (anti-csrf N/A in header mode). No defect — noting so downstream curl harnesses use `Authorization: Bearer` not cookies.

---

## Deferrals confirmed legitimate (DB-tracked, not flagged)
- `84e09891` — "Set Railway Bucket creds + verify avatar upload live" (`todo`) — avatar storage creds.
- `c51589cd` — "Add CI browser E2E job (Playwright + chromium)" (`todo`).
- `839af17f` — "Add rate limiting to auth endpoints (@nestjs/throttler)" (`todo`).

All three are real rows in `tasks`, status `todo`. None block this wave.

---

## Bottom line
Every wave-4 source claim is VERIFIED against live prod. The two fix-forwards (409 mapping, confirm key-scoping) are real and working in production. Avatar storage is deferred correctly with a graceful 503 path. No fake completions, no gold-plating. **APPROVE.**
