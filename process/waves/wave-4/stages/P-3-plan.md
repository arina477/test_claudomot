# Wave 4 — P-3 Plan

## Approach
### Architecture deltas
- **Drizzle users schema:** +`username text UNIQUE` (case-insensitive — expression unique index on lower(username), nullable until set), +`avatar_url text` null, +`accent_color text` null. Migration applies at deploy.
- **ProfileModule (extend, wave-3):** GET /profile returns the 4 fields; PATCH /profile accepts {displayName?,username?,accentColor?} (Zod) — username validated (3-20, [a-z0-9_], lowercased) + uniqueness via DB constraint (catch unique-violation → 409 field error). UsersService gains updateProfile(id, partial) + setAvatarUrl(id, url).
- **FilesModule (new, SHARED):** S3 client (@aws-sdk/client-s3) over Railway Buckets/Tigris (AWS_* env); `POST /profile/avatar/presign` (authed, SessionNoVerifyGuard) → presigned PUT URL (server-controlled key `avatars/{userId}/{uuid}.{ext}`, content-type allowlist image/png|jpeg|webp, 2MB cap via the presign conditions, short TTL). Shape it with `purpose: 'avatar'|'attachment'` so M3 attachments reuse. api NEVER streams the binary (client PUTs direct). On upload-complete, PATCH /profile (or a confirm endpoint) records avatar_url from the server-controlled key. Graceful: if AWS_* unset, presign → handled 503 (no boot crash).
- **Frontend (settings-profile):** wire the 'coming soon' controls — username field (debounced availability check via GET or PATCH-error feedback), avatar upload (request presign → PUT file → confirm; client-side 2MB/type pre-check), accent-color picker; render avatar + accent in the app shell.
- Alt considered: multipart upload through the api (rejected — _library presign pattern is LOCKED; avoids streaming binaries through NestJS + the 2MB→10MB attachment path).

### Data model
users +username(unique, lower-index)/avatar_url/accent_color (nullable). Migration offline (nullable adds, no backfill).

### API contracts
GET /profile → {displayName,username,avatarUrl,accentColor}; PATCH /profile {displayName?,username?,accentColor?} → 200|400|409|401; POST /profile/avatar/presign → {uploadUrl,key}|401|503.

### Deps
`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (api). MIT/Apache. (Frontend: no new dep — fetch PUT.)

### Storage credential (P-0 flag — plan now)
At **B-0**: attempt to provision a Railway Bucket via the project token (like Postgres) — if creatable, self-provision + set AWS_*/STORAGE_BUCKET_NAME on the api service. If Railway Buckets requires console/account-issued S3 keys → **founder-ask** (rule 6): request AWS_ACCESS_KEY_ID/SECRET/ENDPOINT/bucket from the founder (like the Resend key). Plan: surface the ask at B-0 so C-2/T don't block late. The rest of the wave (username/accent + schema + API) does NOT need storage creds — only avatar upload does.

## Plan (by B-stage)
- **B-0** (devops + orchestrator): branch wave-4-profile-customization; `pnpm --filter @studyhall/api add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`; Drizzle migration (users 3 cols); **storage provisioning / founder-credential ask**.
- **B-1** (typescript-pro): shared profile.ts extend + AvatarPresignResponse Zod.
- **B-2** (backend-developer [profile API + username uniqueness + UsersService] + a storage-capable agent [FilesModule/S3 presign]): ProfileModule extend, FilesModule, presign endpoint.
- **B-3** (react-specialist): settings-profile wiring (username/avatar/accent) + shell avatar/accent render.
- **B-4** wiring (FilesModule into AppModule, env), **B-5** verify, **B-6** review.

## Specialist routing (validate AGENTS.md): backend-developer ✓, react-specialist ✓, typescript-pro ✓, devops-engineer ✓, postgres-pro ✓ (migration). FilesModule/S3 → backend-developer (or devops for provisioning).

## Parallelization: B-1 ∥ (B-0 migration). B-2 backend before B-3 frontend. Within B-2: profile-API ∥ FilesModule.

## Self-consistency: 10 ACs → steps (schema→B-0; profile API+username→B-2; presign/FilesModule→B-2; frontend wiring→B-3; graceful-no-creds→B-2). design_gap_flag=false. Contracts concrete. Deps justified. Storage-cred plan explicit. Security (T-8): file-upload surface — server-controlled key (no path traversal), MIME+size limits, presign TTL.
