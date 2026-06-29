# P-4 Phase 2 — Karen source-claim verification (wave-4: profile customization)

**Scope:** PRE-build verification of spec (task `2a655960`) + P-3 plan against live code reality. Verdict on whether every load-bearing claim is grounded in actual source, not asserted.

**VERDICT: APPROVE**

Every load-bearing claim checked resolves to real source. The "extend" / "new" / "add" framing is honest — none of it duplicates work that already exists. Two minor drifts noted (non-blocking, flagged for B-block awareness). No fabricated APIs, no architecture-blind moves, no gold-plating.

---

## Per-claim findings

### Claim 1 — Backend truth (current state is display_name-only) → VERIFIED

- **users table is id/email/display_name only.** `apps/api/src/db/schema/users.ts:4-11` — columns are exactly `id`, `email`, `display_name`, `created_at`, `updated_at`. No `username` / `avatar_url` / `accent_color`. So the migration adding those 3 columns is a **real** schema delta, not duplicative. VERIFIED.
- **GET/PATCH /profile are display_name-only.** `apps/api/src/profile/profile.controller.ts:31` returns `{ displayName: user.display_name ?? null }`; PATCH at line 53 only calls `updateDisplayName`. The 4-field extension is real. VERIFIED.
- **ProfileResponse is display_name-only.** `packages/shared/src/profile.ts:3-5` — `ProfileResponseSchema = z.object({ displayName })`; `UpdateProfileSchema` = `{ displayName }` only. Extending to `{username, avatarUrl, accentColor}` + `AvatarPresignResponse` is real. VERIFIED.
- **SessionNoVerifyGuard exists and is reusable.** `apps/api/src/auth/session-no-verify.guard.ts:11` defines it; exported from `auth.module.ts:18`; already consumed by `profile.controller.ts:29/42` and `me.controller.ts:28`. The new presign route reusing it is grounded. VERIFIED.
- **UsersService surface.** `apps/api/src/users/users.service.ts` has `createUserIfNotExists` / `findById` / `updateDisplayName`. The plan's `updateProfile(id, partial)` + `setAvatarUrl(id, url)` are genuinely new methods. VERIFIED.

### Claim 2 — Architecture fidelity → VERIFIED

- **Presign pattern matches _library.** `_library.md:321` (Security § File uploads): "Pre-signed PUT to Railway Buckets. Server validates session + RBAC + MIME allowlist + size cap (2 MB avatars...), generates **server-controlled object key**, issues single-use expiring URL." The plan's `avatars/{userId}/{uuid}.{ext}` server-controlled key + MIME allowlist + 2MB + api-never-streams matches exactly. VERIFIED.
- **Resolution #15 (file caps).** `_library.md:582` — "2 MB avatar / 10 MB attachment ... Enforced server-side at pre-sign endpoint." Plan's 2MB cap honored. VERIFIED.
- **Resolution #16 (env names).** `_library.md:583` + DevOps env block `_library.md:386-390` — `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL`, `STORAGE_BUCKET_NAME` (+ `AWS_REGION=auto`). Spec/plan use exactly these names. VERIFIED. **Note:** spec sdk line writes `AWS_*/ENDPOINT/STORAGE_BUCKET_NAME` shorthand; the canonical full name is `AWS_ENDPOINT_URL` (and `AWS_REGION=auto` exists in the env block) — B-0 must use the exact names, not the shorthand. Minor, non-blocking.
- **Resolution #5 (single users table).** `_library.md:572` — profile fields live on `users`, no separate `profiles`/`privacy_settings` table. Plan puts `username` on `users`, not a new table. Honored. VERIFIED.
- **FilesModule shape.** `_library.md:64` describes FilesModule as pre-signed URL generation + type/size validation + post-upload confirmation, "URLs stored by consuming modules." Plan's `purpose: 'avatar'|'attachment'` shared shape + UsersModule storing the URL matches the documented module. The `'attachment'` purpose maps to the M3 message-attachment reuse (10MB cap, `message_attachments` table at `_library.md:141`). VERIFIED.

### Claim 3 — Specialists in AGENTS.md → VERIFIED

`backend-developer` (AGENTS.md:70), `react-specialist` (:82), `typescript-pro` (:83), `devops-engineer` (:85), `postgres-pro` (:81) all present in the catalog. VERIFIED. The plan's "FilesModule/S3 → backend-developer" routing is sound — no S3-specialist agent exists in the catalog, and backend-developer is the correct closest match (no agent-creator install needed).

### Claim 4 — SDK plausibility → VERIFIED

- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` are the correct, current AWS SDK v3 libraries for S3 presigned URLs against an S3-compatible endpoint (Tigris/Railway Buckets via `AWS_ENDPOINT_URL` override). Presigned PUT (`getSignedUrl(client, new PutObjectCommand(...))`) is a real, standard pattern; `s3-request-presigner` is the dedicated presign package. VERIFIED.
- **Not yet installed.** `apps/api/package.json` dependencies (verified): `@anatine/zod-nestjs`, `@nestjs/*`, `drizzle-orm`, `pg`, `resend`, `supertokens-node`, `zod` — **no `@aws-sdk/*`**. So adding them at B-0 is real work. VERIFIED.
- _library.md:206 confirms FilesModule auth mechanism = "AWS SigV4 (S3 client with endpoint override)" — consistent.

### Claim 5 — Mockup grounds the "wire coming soon controls" claim → VERIFIED (with drift note)

`design/settings-profile.html` contains all three real controls:
- **Avatar** — Section at line 308; `<input type="file" id="avatar-upload" accept="image/png, image/jpeg, image/webp">` at line 338 (MIME allowlist matches the spec's `image/png|jpeg|webp` exactly); offline-avatar-badge at 326; preview img at 316.
- **Username** — Section "Identity" at 345; `<input id="username">` at 357 with live hint ("Unique across StudyHall. Used for mentions.", line 378) + char counter (line 379) — directly grounds the "taken/available feedback" AC.
- **Accent Color** — Section "Appearance" at 403; `role="radiogroup"` swatch picker at 413; `--user-accent` CSS var (line 79) drives the live theming the spec calls "render across the app."

So "replace wave-3 'coming soon' stubs" is grounded in a real mockup. VERIFIED.

**DRIFT (minor, non-blocking):** the mockup username counter reads `10/32` (line 379), implying a 32-char max; the spec specifies **3-20 chars, [a-z0-9_], lowercased**. The mockup also shows a mixed-case-ish handle `alex_study` (fine) but the length ceiling disagrees. B-3 must implement the spec's 3-20 contract (the spec is the source of truth per always-on rule 7), and either adjust the mockup counter or accept the spec value. Flag to react-specialist at B-3. This is a spec-vs-mockup mismatch, not a fake claim.

### Claim 6 — Antipatterns → ABSENT (clean)

- **Claimed-but-fake:** none. Every "extend/add/new" maps to a real gap (claims 1-5).
- **Architecture-blind:** none. Presign pattern, env names, single-table, caps, FilesModule shape all trace to _library resolutions #5/#15/#16 and the Security/SDK sections. The plan explicitly cites the LOCKED presign contract and rejects the multipart-through-api alternative (P-3 plan line 9) — architecture-aware.
- **Gold-plating:** ABSENT and explicitly excluded. Spec body: "NO image resize/transcode/multi-size/CDN." P-3 plan line 5 repeats the exclusion. No resize/thumbnail/transcode/CDN/multi-size language anywhere. Correctly scoped to MVP.

---

## Legitimate deferrals (NOT flagged as fake)

- **Storage creds account-issued → founder at B-0** — grounded in always-on rule 6 + _library.md:206/222. Plan correctly stages the founder-ask at B-0 (P-3 line 20-21) so C/T don't block late. The self-provision-if-Railway-token-allows fallback is reasonable. Legit.
- **Orphan-object cleanup deferred** — spec edge-case explicitly marks it "deferred hardening, not a blocker" for self-use-mvp. Legit (matches _library's self-use-mvp posture).
- **Security-scope-tightened gate does NOT apply** — CONFIRMED. This wave touches file upload only; it adds **no auth/session/cookie/CSRF/rate-limit change** (reuses the existing SessionNoVerifyGuard unchanged, `session-no-verify.guard.ts`). The P-4 security-scope gate fires on auth/payments/user-creation/cookies/CSRF/rate-limits/sessions — none are modified. T-8 still covers the file-upload surface (server-controlled key / MIME / size / TTL) per P-3 line 34, which is the right layer. Correctly assessed.

---

## Summary table

| # | Claim | Finding |
|---|-------|---------|
| 1 | Backend currently display_name-only (migration/extension real) | VERIFIED |
| 2 | Presign pattern / env names / single-table / FilesModule match _library #5/#15/#16 | VERIFIED |
| 3 | All 5 specialists in AGENTS.md | VERIFIED |
| 4 | aws-sdk client-s3 + s3-request-presigner correct + not yet installed | VERIFIED |
| 5 | Mockup has username/avatar/accent controls | VERIFIED (username length 32 vs spec 3-20 drift) |
| 6 | No fake / architecture-blind / gold-plating | ABSENT (clean) |

**Action items for B-block (non-blocking, advisory):**
1. B-0: use exact env names `AWS_ENDPOINT_URL` (not `AWS_ENDPOINT`) + include `AWS_REGION=auto` per _library.md:386-390.
2. B-3: implement the spec's username contract (3-20, `[a-z0-9_]`, lowercased) — reconcile the mockup's `10/32` counter to the spec value.
