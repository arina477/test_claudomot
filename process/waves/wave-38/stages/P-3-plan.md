# Wave 38 — P-3 Plan

## Approach section

### Architecture deltas

**Avatar render path (the crux) — migrate to presigned-GET via a stable redirect endpoint.**

Empirically determined against the real Tigris bucket `studyhall-avatars-ngavql0` (endpoint `https://t3.storageapi.dev`) using the founder-supplied creds:
- Bucket is **PRIVATE**: anonymous GET of a static object URL → **HTTP 403**.
- `PutBucketPolicy` → **NotImplemented** (Tigris does not support S3 bucket policies).
- Per-object `x-amz-acl: public-read` → **ignored** (still 403 anonymously).
- Presigned GET → **HTTP 200**. ✅

So the static-public-URL avatar render (`resolvePublicUrl`) cannot work, and the bucket cannot be made public via any S3 API I control (making it public would require a Tigris console action + is architecturally wrong — it co-locates public avatars with private attachments). **Chosen approach:** serve avatars through a stable, unauthenticated redirect endpoint that resolves a fresh presigned GET per hit.

- `POST /profile/avatar/confirm` stops persisting a raw static URL. Instead it persists the object **key** (new `users.avatar_key`) AND a **stable app URL** `users.avatar_url = <PUBLIC_API_URL>/users/<userId>/avatar?v=<8-char key hash>`. The `?v=` cache-buster changes whenever the avatar changes so `<img>` clients refetch.
- New `GET /users/:userId/avatar` (public, unauthenticated): look up the user's `avatar_key`; null → 404; else resolve a presigned GET (`resolveAvatarUrl`, mirroring the proven `resolveAttachmentUrl`) → **302 redirect** to the presigned URL, with `Cache-Control: public, max-age=300` (< presign TTL so browsers never cache a stale/expired target).
- `<img src={avatarUrl}>` follows the 302 transparently → **zero frontend change**; all 6+ API DTO consumers keep reading the stable `avatar_url` string → **zero consumer change**.

**Why redirect-endpoint over per-DTO presigning:** presigned URLs expire, so persisting one as `avatar_url` breaks. Resolving a presigned URL inside every user-serialization site (servers roster, profile, account-data export, message author, users.service) is a 6+-site async blast radius that changes URL semantics everywhere. The redirect keeps a stable persisted URL and confines the change to confirm + one new endpoint. Trade-off accepted: one extra app hop per avatar render (mitigated by `Cache-Control` on the 302 and by the browser caching the presigned target).

**Why NOT make the bucket public:** empirically impossible via S3 API (above); a Tigris-console public-bucket recreation is founder-gated and mixes public avatars with private channel attachments in one bucket (privacy smell). Presigned-GET keeps one private bucket for everything.

**Attachment path — no code change.** `resolveAttachmentUrl` already uses presigned-GET (verified 200 against the live bucket). Attachments only need the creds wired + an E2E verify. `headAttachment`/`checkAttachmentSize` 10MB cap already shipped.

**Server-side 2MB avatar cap — no code change.** `checkAvatarSize` (HeadObject) already implemented + unit-tested; verify live only.

**New unauthenticated surface (security note for T-8 + P-4 security-scope-tightened gate):** `GET /users/:userId/avatar` is a new public endpoint. Low-risk (serves public avatar images; must be public because cross-origin `<img>` sends no auth cookies), but T-8 confirms: object key is server-derived (no client-controlled path), 404 for no-avatar users, presigned TTL short, and add a coarse rate-limit to blunt enumeration/DoS. IDOR-safe: avatars are public content by design.

### Data model

- **Add `users.avatar_key TEXT NULL`** (Drizzle migration). Stores the S3 object key so the redirect endpoint can re-sign per request.
- `users.avatar_url TEXT NULL` — unchanged column; semantics change from "raw static URL" to "stable app redirect URL".
- **No backfill:** storage was never wired, so `presignAvatarUpload` always 503'd, so `confirm` was never reachable, so **no row has a non-null `avatar_url` today** (verify with a COUNT at B-0). Online migration, additive nullable column, zero downtime.

### API contracts (concrete)

- `POST /profile/avatar/confirm {key}` (authed, existing) → 200 `{avatarUrl: string}` where avatarUrl is now the stable app URL; persists `avatar_key` + `avatar_url`. Errors unchanged: 413 AVATAR_TOO_LARGE, 503 STORAGE_NOT_CONFIGURED, 400 bad key.
- `GET /users/:userId/avatar` (**public, unauthenticated**, NEW) → 302 redirect to presigned GET | 404 no-avatar | 503 storage-unset. `Cache-Control: public, max-age=300`.
- `POST /profile/avatar/presign` (authed, existing) → unchanged.
- Attachment endpoints (existing wave-19) → unchanged.

### Dependency list

None new. Uses installed `@aws-sdk/client-s3` (`GetObjectCommand`) + `@aws-sdk/s3-request-presigner` (`getSignedUrl`) — already imported in files.service.ts.

### SDK pre-build checklist

Not a new SDK. `resolveAvatarUrl` is a copy of the already-shipped, already-tested `resolveAttachmentUrl` (same S3 presign call, avatar TTL). No external-SDK-integration-rules pre-build needed.

## Plan section

### File-level steps (grouped by B-stage)

**B-1 Schema**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/api/src/db/schema/users.ts | modify | add `avatar_key: text('avatar_key')` | node-specialist | first |
| apps/api/drizzle/00XX_avatar_key.sql (generated) | create | `ALTER TABLE users ADD COLUMN avatar_key text` | node-specialist | after schema edit (drizzle-kit generate) |

**B-3 Backend**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/api/src/files/files.service.ts | modify | add `resolveAvatarUrl(key): Promise<string\|null>` (presigned GET, mirror resolveAttachmentUrl; ~5min TTL) | node-specialist | parallel-B3 |
| apps/api/src/users/users.service.ts | modify | `setAvatar(userId, key, url)` persists avatar_key + avatar_url; expose avatar_key lookup for redirect | node-specialist | parallel-B3 |
| apps/api/src/files/files.controller.ts | modify | confirm: persist key + build stable app URL (PUBLIC_API_URL + `/users/:id/avatar?v=<hash>`); return it | node-specialist | after users.service |
| apps/api/src/users/users.controller.ts | modify/create | add public `GET /users/:userId/avatar` → 302 presigned redirect / 404 / 503 + Cache-Control + rate-limit | node-specialist | after files.service.resolveAvatarUrl |

**B-5 Wiring**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/api env (PUBLIC_API_URL) | verify | confirm the api knows its public base URL for building avatar_url (reuse existing env/pattern; if absent, add) | node-specialist | with confirm change |

**C-block (creds + deploy)** — head-ci-cd: set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_ENDPOINT_URL / STORAGE_BUCKET_NAME on the `api` service via railway CLI, `railway up --service api`, verify deployment-state SUCCESS + served-bundle + no 503.

**Tests (T-block + B-5 verify)**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/api/src/files/files.service.spec.ts | modify | unit: resolveAvatarUrl returns presigned URL / null when unconfigured | node-specialist | with impl |
| apps/api/test/integration/avatar-render.spec.ts | create | integration: confirm persists key+url; GET /users/:id/avatar → 302 to a URL that GETs 200; no-avatar → 404 | node-specialist | T-4 |

### Specialist routing (validated against AGENTS.md)
- **node-specialist** — all backend/schema/test work (NestJS + Drizzle + @aws-sdk). Confirmed in catalog.
- **head-ci-cd** — C-block creds + deploy + verify.
- No frontend specialist needed (zero frontend change).

### Parallelization map
- B-1: serial (schema edit → drizzle generate).
- B-3: `files.service.resolveAvatarUrl` ∥ `users.service` (independent); then `files.controller` (needs users.service) and `users.controller` (needs files.service) serialize after their deps.
- Single specialist (node-specialist) executes B-1→B-3→B-5 as an ordered chain per head-builder sequencing; no cross-file parallel-batch conflicts.

### Self-consistency sweep
1. Every P-2 AC → ≥1 step: AC1 presign→C-block creds; AC2 confirm→files.controller; **AC3 crux render→GET /users/:id/avatar endpoint + integration test**; AC4 2MB→verify-only (checkAvatarSize, existing); AC5 allowlist→existing; AC6 attachment→C-block creds + T-4 verify (no code); AC7 no-503→C-block deploy verify. ✅
2. Every step has a specialist. ✅
3. No file in multiple parallel batches. ✅
4. design_gap_flag=false referenced. ✅
5. Architecture deltas name alternative (per-DTO presign, public-bucket) + trade-offs. ✅
6. Data/API contracts concrete, no TBD. ✅
7. No new deps. ✅
8. No new SDK (resolveAvatarUrl mirrors shipped resolveAttachmentUrl). ✅

Sweep clean.
