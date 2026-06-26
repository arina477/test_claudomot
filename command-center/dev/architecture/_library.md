# Architecture Library — StudyHall

## How to use this doc

This unified reference integrates architecture across all domains (modules, services, databases, SDKs, tools, security, DevOps, test) for StudyHall, a dark-themed desktop communication app for remote students. **This document wins on any conflict across branches.** Each section below is authoritative for its domain; branch files at `command-center/dev/architecture/` provide expanded detail. Read this at the start of any multi-domain wave; branch files are reference material once the decision is locked here.

## Table of contents

1. [Stack](#stack)
2. [Modules / Reusable elements](#modules--reusable-elements)
3. [Services](#services)
4. [Databases](#databases)
5. [SDKs](#sdks)
6. [Tools](#tools)
7. [Security](#security)
8. [DevOps](#devops)
9. [Test](#test)
10. [Cross-domain interactions](#cross-domain-interactions)
11. [Open items and risks](#open-items-and-risks)

---

## Stack

**Monorepo:** Turborepo + pnpm (v9), workspace protocol for internal packages  
**Backend:** NestJS 10 (Node.js, TypeScript strict)  
**Frontend:** Vite 5 + React 19 SPA (PWA), no SSR  
**Shared contracts:** Zod schemas in `@studyhall/shared`, bridged to NestJS DTOs via `@anatine/zod-nestjs`  
**Database:** PostgreSQL (Railway-managed) + Drizzle ORM; migrations committed as SQL files  
**Realtime:** Socket.IO (two locked namespaces: `/messaging` and `/presence`)  
**Offline-first / local store:** IndexedDB via Dexie (v4.x) + custom sync engine (outbox pattern + reconnect reconciliation)  
**Voice/video:** LiveKit (self-hosted on Railway OR LiveKit Cloud — decision gate at v6 SDK branch)  
**Auth:** SuperTokens Core (self-hosted on Railway, private network only) + session-based auth (httpOnly cookies for browser, short-lived JWT for WS/LiveKit)  
**Storage:** Railway Buckets (Tigris S3-compatible) for avatars + message attachments  
**Email:** Resend (transactional email — verification, password reset, invites, reminders)  
**Hosting:** Railway (multi-service topology: api, web, postgres, supertokens, livekit-optional)  
**CI/CD:** GitHub Actions (lint + typecheck + test + build parallel; deploy via Railway GitHub app)  
**Lint/format:** Biome (single tool, no ESLint/Prettier)  
**Testing:** Vitest (unit + integration) + Supertest (HTTP) + React Testing Library (components) + Playwright MCP (live E2E)  
**Node:** v20.15.0 (pinned via `.nvmrc` + `engines` + GitHub Actions setup)  
**TypeScript:** Strict mode, `composite: true` for project references, incremental compilation via `tsc --build`  

**Deferred to H2:** Stripe (billing), Redis (realtime scaling, queues, rate-limit store), Sentry (error tracking — added at first deploy)

---

## Modules / Reusable elements

### Backend (NestJS)

Thirteen modules own the business logic, grouped by domain. Each module: exports service(s) for injection, owns its Drizzle schema files, handles RBAC-gated actions, and emits typed domain events via `EventEmitter2` for cross-module fan-out.

**MVP modules (H1 features 1–16):**

1. **AuthModule** — SuperTokens session lifecycle (signup, email verify, login, password reset, refresh). Owns no tables (SuperTokens Core manages the session store). Exports `JwtAuthGuard` + `CurrentUser` decorator used globally.
2. **UsersModule** — User profiles (display name, avatar, theme color, privacy flags). Owns `users` table; delegates avatar pre-signing to FilesModule.
3. **ServersModule** — Study servers (CRUD), categories, channels, invite link generation + redemption, member roster, bans. Owns `servers`, `server_members`, `channels`, `categories`, `invites`, `bans` tables.
4. **RbacModule** — Role CRUD + permission rules + channel-level overrides. Single entry point: `can(userId, action, context)`. Owns `roles`, `role_permissions`, `channel_permission_overrides` tables.
5. **MessagingModule** — Message persistence, delivery, reactions, threads, edits, deletes. Core text-channel data plane. Owns `messages`, `message_reactions`, `message_attachments`, `threads` tables. Emits `message.created`, `message.mention` events.
6. **RealtimeGatewayModule** — Socket.IO server, namespace management, presence tracking, typing indicators, message fan-out. Two namespaces: `/messaging` (messages, reactions, typing) + `/presence` (online status, voice-room occupancy). No Postgres table ownership.
7. **VoiceModule** — LiveKit room + token issuance for voice/video. Thin service — StudyHall does not run media. Issues short-lived JWT access tokens after RBAC check. Owns `voice_sessions` table (presence only, no media state).
8. **AssignmentsModule** — Assignment CRUD + per-student status tracking (to-do/done). Light academic tooling. Owns `assignments`, `assignment_statuses` tables. Emits `assignment.due_soon` cron events for reminders.
9. **NotificationsModule** — In-app notification dispatch (mentions, reminders) + transactional email (Resend). Owns `notifications` table. Consumes events from Messaging + Assignments.
10. **FilesModule** — Pre-signed URL generation (Railway Buckets), file type/size validation, post-upload confirmation. No dedicated table; URLs stored by consuming modules.
11. **OfflineSyncEngine** (server-side) — Accepts outbox flush payloads from reconnecting clients, deduplicates by `idempotency_key`, reconciles ordering, returns catch-up delta. Exposes `/sync/outbox` endpoint + Socket.IO `sync:outbox_flush` event.
12. **PrivacyControlsModule** — User-configurable privacy settings (profile visibility, who-can-DM). Owns `privacy_settings` table. Read by User Profile + future DM module.

**H2 modules:** Direct Messages (feature 21), Educator Role (moderation tooling), Deeper Assignment (submission collection), Calendar, Study Groups, Billing (Stripe), Server Discovery, Compliance (GDPR/CCPA).

### Frontend (React SPA — Vite)

Thirty feature slices under `apps/web/src/features/<name>/`. Organized as: index (public exports), components/, hooks/, types.ts. Shared primitives (UI, auth context, offline-sync provider) at `apps/web/src/shared/`.

**Core slices (MVP):**

- **Auth Context** — global session state + guards + login/logout actions
- **User Profile** — profile display + avatar upload + display name edit
- **Server Rail** — left-side vertical icon rail + joined servers + unread badges
- **Channel Sidebar** — channel tree + category groups + online indicators
- **Message List + Composer** — virtualized message history, optimistic rendering, reply threading, reaction picker, mention autocomplete, offline outbox badge
- **Member List** — server roster grouped by role + presence indicators
- **Voice-Room UI** — LiveKit participant grid + mic/cam toggles + screen share
- **Offline Sync Engine** (client-side) — IndexedDB cache layer (Dexie stores: `channels`, `messages`, `servers`, `server_members`), outbox queue, reconnect reconciliation, conflict resolution (last-write-wins by server timestamp)
- **Connection-State Indicator** — persistent banner showing online/reconnecting/offline status
- **Notification Bell + Toast System** — in-app notification dropdown + ephemeral alert toasts
- **Invite Flow UI** — pre-auth invite preview + post-auth auto-redeem
- **Server Settings Shell** — multi-tab admin surface (roles, members, invites, channels)
- **Assignment Panel** — assignment list + to-do/done toggle + create/edit form
- **Privacy Settings** — profile visibility + who-can-DM controls (stub in MVP)
- **Design Tokens + Theme System** — single source of truth for color/spacing/radius/shadow; dark theme only at MVP
- **Modal / Sheet / Primitives** — Radix UI wrapped via shadcn/ui

---

## Services

**Backend is a NestJS modular monolith** (single Railway service, one Postgres instance, one Socket.IO server). Module boundaries are drawn so any module can be extracted to its own Railway service in H2 without refactors — contracts are already interface-typed and go through explicit service injection, not cross-module DB queries.

All REST routes prefixed `/api/v1`. HTTP semantics: `GET` read, `POST` create/action, `PATCH` partial update, `DELETE` hard delete, `204 No Content` on DELETE, `201 Created` on POST.

**Request/response validation:** Every endpoint uses Zod schemas from `@studyhall/shared`. NestJS DTOs derived via `@anatine/zod-nestjs`. Invalid payloads return `400` with `{ statusCode, code, message, details[] }`.

**Error responses:** All errors return `{ statusCode, code, message }`. Error codes are string enums in `@studyhall/shared/errors.ts`. Correlation ID (`X-Request-ID`, generated per request) logged on every line.

**Authentication:** `JwtAuthGuard` applied globally on protected routes. SuperTokens refresh handled transparently by client SDK. Public allowlist: landing, auth endpoints, `/invite/:code` preview.

**RBAC guard composition:** Routes use `@UseGuards(JwtAuthGuard, ChannelPermissionGuard)` where the permission guard calls `RbacService.can()`. Guard reads `serverId`/`channelId` from route params, never body.

**Pagination:** Cursor-based only (opaque cursor, limit, nextCursor response). No offset pagination — degrades under concurrent message inserts.

**Idempotency keys:** Message creates carry `idempotency_key` (client-generated UUID). Server deduplicates on `UNIQUE (channel_id, idempotency_key)`. Retry-safe.

**Rate limiting:** `@nestjs/throttler`: 100 req/min per IP globally, 10 req/min on auth endpoints, 5 concurrent WS connections per user. Tighter limits on auth paths; enforced at module level.

**Socket.IO authentication:** `io.use()` middleware validates SuperTokens session/JWT on **upgrade** (not first message). Unauthenticated sockets rejected immediately. Three namespaces:
- `/messaging` — message delivery, edits, deletes, reactions, thread updates
- `/presence` — online/away/offline status, voice-room participant list
- (Note: `/typing` merged into `/messaging` per v6b conflict resolution)

**Offline outbox flush protocol:** Reconnecting client sends `flush_outbox` event with `{ idempotency_key, channel_id, content, sent_at_client }[]` ordered by `sent_at_client`. Server: (1) upsert each via `MessagingService.createFromOutbox()`, (2) emit `message.created` event for non-duplicates to the channel room, (3) return ack list with `{ nonce, server_timestamp }` for client reconciliation. Deduplication: server checks `(channel_id, author_id, nonce)` UNIQUE constraint.

**Catch-up on reconnect:** Reuse `GET /api/channels/:id/messages?after=<cursor>` with keyset pagination (composite cursor on `created_at` + `id` to handle millisecond ties). No dedicated `/sync/catchup` endpoint — standard message history fetch with cursor.

---

## Databases

### Server-side (Postgres + Drizzle)

Fifteen tables, one Drizzle schema file per table at `apps/api/src/db/schema/<table>.ts`. Relations defined co-located. Single Drizzle `schema/index.ts` re-export point.

**Core tables:**

| Table | Ownership | Hot-path index |
|-------|-----------|-----------------|
| `users` | UsersModule | `UNIQUE (username)` |
| `servers` | ServersModule | `INDEX (owner_id)` |
| `server_members` | ServersModule | `UNIQUE (server_id, user_id)`, `INDEX (server_id, banned)` |
| `channels` | ServersModule | `INDEX (server_id, position)` (ordered tree) |
| `messages` | MessagingModule | `INDEX (channel_id, created_at DESC)` (primary history hot path) |
| `message_attachments` | MessagingModule | `INDEX (message_id)` |
| `reactions` | MessagingModule | `UNIQUE (message_id, user_id, emoji)` |
| `roles` | RbacModule | `INDEX (server_id, position DESC)` |
| `permissions` | RbacModule | `UNIQUE (channel_id, role_id)`, `INDEX (channel_id)` |
| `invites` | ServersModule | `UNIQUE (code)`, `INDEX (server_id)` |
| `assignments` | AssignmentsModule | `INDEX (server_id, due_at ASC)` |
| `assignment_statuses` | AssignmentsModule | `UNIQUE (assignment_id, user_id)`, `INDEX (user_id, status)` |
| `notifications` | NotificationsModule | `INDEX (recipient_id, is_read, created_at DESC)` (unread + list hot path) |
| `privacy_settings` | PrivacyControlsModule | `PK (user_id)` |
| `voice_sessions` | VoiceModule | `INDEX (channel_id)` (occupancy tracking) |

**Message table design** (canonical from databases.md):
- `id` (uuid PK), `channel_id` (FK), `author_id` (FK), `content` (text), `thread_parent_id` (self-FK for replies), `is_edited` (bool), `edited_at`, `is_deleted` (soft-delete), `deleted_at`, `idempotency_key` (UNIQUE for dedup), `created_at` (server timestamp, authoritative for ordering)
- Soft-deletes only (no hard delete at MVP) — content replaced with `[deleted]` at query layer
- `content_snapshot` (JSONB) — author display name + avatar at send time (prevents tombstones on account delete)

**Naming conventions:**
- Tables: lowercase snake_case plural (`messages`, `server_members`)
- Columns: lowercase snake_case (`channel_id`, `created_at`)
- FKs: `<referenced_table_singular>_id` pattern
- Indexes: Drizzle auto-names; manually override only when ambiguous
- PKs: all UUIDs via `gen_random_uuid()` (no sequential IDs — avoids enumeration)

**Migrations:** `drizzle-kit generate` produces SQL files committed to `apps/api/drizzle/migrations/`. Applied explicitly via `drizzle-kit migrate` (never auto-migrate on startup). Migration history is the source of truth — no manual schema edits on Railway Postgres.

### Client-side (IndexedDB + Dexie)

**Five object stores**, schema versioned via Dexie `version().stores()`:

| Store | Key | Contents | Retention |
|-------|-----|----------|-----------|
| `channels` | `id` | channel metadata (id, server_id, name, type, position, is_private) | full set for joined servers |
| `messages` | `id` | message history (id, channel_id, author_id, content, content_snapshot, thread_parent_id, is_edited, is_deleted, created_at, attachments[]) | last 200 per channel (LRU on created_at) |
| `servers` | `id` | server metadata (id, name, icon_url) | full set for joined servers |
| `server_members` | composite `[server_id, user_id]` | member info (server_id, user_id, display_name, avatar_url, role_id) | full set for joined servers |
| `outbox` | `idempotency_key` | pending sends (idempotency_key, channel_id, content, attachments[], state, created_at, retry_count) | until acked; max 7 days age before surfaced as failed |

**Outbox message lifecycle:**
```
pending → flushing → acked
                  ├→ failed (transient, retry with backoff)
                  └→ rejected (4xx, surface error, clear)
```

**Reconciliation on reconnect:**
1. Flush outbox (ordered by `created_at ASC`). POST each to `/api/messages` with `idempotency_key`. Mark `flushing`; 2xx/409 → `acked`; 4xx → `rejected`; 5xx/network → `failed` (retry up to 3x with exponential backoff).
2. Catch-up per channel: `GET /api/channels/:id/messages?after=<last_seen_created_at>`. Merge into cache (max 50 rows per call; if `has_more=true`, user can load more but doesn't auto-fetch).
3. Refresh channel + member lists: diff + apply upserts.
4. Refresh unread notification count.

Steps 1 and 2 sequential (flush before read, avoid seeing own messages as missing). Steps 3–4 parallel after step 1 completes.

**Conflict policy (MVP):** last-write-wins by server timestamp. Client never overwrites server-side message body. Edited messages in reconnect delta replace local copy in full.

---

## SDKs

Seven external SDKs integrated across the stack.

| SDK | Module | Auth mechanism | Credential type | Cost (MVP) |
|-----|--------|-----------------|-----------------|-----------|
| SuperTokens | AuthModule | API key (Core private network) + session cookie (browser) | Self-generated at Core deploy | Self-hosted: ~$5–10/mo (Railway service) |
| LiveKit | VoiceModule | API key + API secret (JWT signing) | Self-generated (self-host) OR account-issued (Cloud) | Self-host: ~$5–15/mo; Cloud free tier (100 min/mo) |
| Socket.IO | RealtimeGatewayModule | library (no external auth) | none | Embedded infrastructure cost |
| Railway Buckets / AWS S3 | FilesModule | AWS SigV4 (S3 client with endpoint override) | Railway-issued (auto-provisioned) | ~$0.021/GB-month + free egress |
| Resend | NotificationsModule | API key (bearer token) | Account-issued (founder must create account) | Free tier: 100 emails/day, 3k/month |
| Stripe | (BillingModule — H2) | API key + webhook secret | Account-issued | 2.9% + $0.30 per transaction |
| Sentry | (AppModule bootstrap) | DSN (project-specific URL) | Account-issued (founder creates project at first deploy) | Free tier: 5k errors/month |

**SDK integration principles:**
1. One module owns one SDK; single NestJS provider initialization.
2. SDK clients are `@Injectable()` providers initialized with env vars via `ConfigService`.
3. Error mapping at the SDK boundary — SDK-native errors translated to StudyHall error codes (`@studyhall/shared/errors.ts`). Callers receive typed errors, never SDK internals.
4. Auth-critical email (verification, password reset) delegated to SuperTokens Core config; `NotificationsModule` handles StudyHall-native emails (invites, reminders) via Resend.
5. No other module imports an SDK package directly — they call the owning module's exported service.

**Env vars:**
- All follow `<SDK_NAME>_<VAR>` pattern (e.g., `LIVEKIT_API_KEY`, `RESEND_API_KEY`)
- AWS SDK uses conventional `AWS_*` prefix (required by the SDK)
- All listed in `.env.example` (committed, no secret values)
- Generated secrets created via `openssl rand -base64 32`; account-issued credentials requested from founder at relevant milestone

---

## Tools

**Monorepo structure:**

```
studyhall/
├── apps/
│   ├── web/           # Vite + React 19 SPA → dist/ (static)
│   └── api/           # NestJS → dist/ (Node.js)
├── packages/
│   ├── shared/        # @studyhall/shared: Zod schemas, TS types, enums
│   └── ui/            # @studyhall/ui: deferred (seeded when 2nd consumer exists)
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
├── tsconfig.base.json
├── .nvmrc (20.15.0)
├── package.json       # root scripts + engines
├── drizzle.config.ts  # in apps/api
└── .env.example       # committed; secrets in platform env vars only
```

**pnpm 9** (pinned via `packageManager` + `corepack`). Workspace protocol for internal deps: `"@studyhall/shared": "workspace:*"`.

**Node v20.15.0** pinned via `.nvmrc` + root `engines` field. CI uses `actions/setup-node@v4` with `node-version-file: .nvmrc` + pnpm caching.

**TypeScript strict mode:** `strict: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true` (offline sync state handling is complex). Per-workspace `tsconfig.json` extends `tsconfig.base.json`; `composite: true` for `tsc --build` project references (incremental compilation).

**Biome** (single tool, no ESLint/Prettier):
- Config: `biome.json` at root (all workspaces inherit)
- Rules: `noExplicitAny: error`, `useExhaustiveDependencies: error` (offline sync hooks), `noConsoleLog: warn`, `noNonNullAssertion: warn` (Drizzle patterns)
- Formatter: 2-space indent, 100-char line width, single quotes, trailing commas, always semicolons
- Run: `biome ci .` (read-only CI), `biome check --apply` (local fix)

**Turborepo task graph** (`turbo.json`):
- `build` — depends on `^build` (packages before apps); caches outputs
- `typecheck` — depends on `^build`; incremental via project references; caches
- `lint` — independent; caches (Biome is fast, but cache helps CI)
- `test` — depends on `^build`; caches
- `dev` — `persistent: true`, `cache: false` (no termination)
- `db:generate`, `db:migrate` — `cache: false` (filesystem/DB mutations)

Remote caching via Turborepo Cloud (optional at MVP; one-line addition + GitHub Actions secret if needed).

**Vite config** (`apps/web/vite.config.ts`):
- Plugins: `@vitejs/plugin-react`, `vite-tsconfig-paths`, `vite-plugin-pwa`
- `manualChunks` splits vendor bundles: `vendor-react` (React), `vendor-socket` (Socket.IO client), `vendor-livekit` (LiveKit SDK)
- Workbox `NetworkFirst` strategy for `/api/` routes (network timeout: 5s, fallback to cache — first-layer offline read before full IndexedDB)
- PWA manifest: dark theme (`#0f0f0f`), standalone display, 192x512 icons
- Dev server proxy: `/api` → `http://localhost:3001`, `/socket.io` → `http://localhost:3001` with WS upgrade

**Drizzle Kit** (`apps/api/drizzle.config.ts`):
- Schema: `./src/db/schema/index.ts` (re-exports all domain tables)
- Migrations: `./drizzle/migrations/` (SQL files, committed, applied explicitly)
- `verbose: true`, `strict: true` (requires confirmation for destructive changes)
- Commands: `db:generate` (produce SQL), `db:migrate` (apply), `db:studio` (browser explorer)

**Root scripts** (feed `project.yaml: commands[]` at v6b):
```
pnpm dev          # turbo run dev --parallel (all workspaces)
pnpm build        # turbo run build
pnpm typecheck    # turbo run typecheck
pnpm lint         # biome ci .
pnpm lint:fix     # biome check --apply .
pnpm test         # turbo run test
pnpm test:watch   # turbo run test -- --watch
pnpm db:generate  # turbo run db:generate --filter=@studyhall/api
pnpm db:migrate   # turbo run db:migrate --filter=@studyhall/api
pnpm db:studio    # cd apps/api && drizzle-kit studio
pnpm clean        # turbo run clean && rimraf node_modules
```

**Vitest** (unit + integration):
- Shared preset at `packages/shared/vitest.preset.ts` (globals: true, environment: node — overridden to jsdom in `apps/web`)
- Coverage threshold: 80% branch on Tier-1 packages (Auth, RBAC, offline-sync)
- Per-workspace config extends preset + workspace-specific overrides

---

## Security

**MVP security mode: one identity provider, verified server-side at every door.**

**SuperTokens Core** is the single source of truth. No other provider. Session JWT + rotating refresh token; access tokens short-lived (15 min). Client SDK (`supertokens-auth-react`) manages httpOnly+Secure+SameSite cookies automatically. Recipes: EmailPassword + EmailVerification + Session.

**Trust boundaries** (where verification happens):
1. **REST API** — NestJS `verifySession()` guard validates session → `userId` on request context
2. **Realtime (Socket.IO)** — `io.use()` middleware validates session/JWT on **upgrade** (not first message); unauthenticated sockets rejected immediately
3. **Voice/video** — NestJS endpoint verifies session, checks RBAC, mints scoped LiveKit JWT server-side (client never holds the secret)
4. **File upload** — NestJS pre-sign endpoint validates session + RBAC + file metadata (type/size cap) before issuing pre-signed URL

**Authorization: RBAC, server-side only.** Single entry point: `RbacService.can(userId, action, context)`. Membership check every message send, channel join, settings update. Owner safeguard: server owner cannot be demoted/removed.

**Validation:** Zod schemas in `@studyhall/shared` are the single contract. `@anatine/zod-nestjs` for REST DTOs. Socket.IO handlers call `schema.parse()` before side effects. Same schema client-side (UX form validation). Reject on parse failure with typed error — never coerce.

**File uploads:** Pre-signed PUT to Railway Buckets. Server validates session + RBAC + MIME allowlist + size cap (2 MB avatars, 10 MB attachments), generates server-controlled object key, issues single-use expiring URL. Downloads served with `Content-Type` + `Content-Disposition` headers (no inline execution).

**Secrets:** Generated with `openssl rand -base64 32`, set in platform env vars, never committed. Account-issued credentials (Resend API key, LiveKit Cloud credentials if self-host not used) provisioned by founder.

**Privacy controls (feature 16):** server-enforced authorization rules, not UI-only.
- Profile-field visibility checked at the query layer; hidden fields not sent over the wire.
- Who-can-DM preference stored; enforcement at DM-create boundary (H2).
- Account-data read endpoint scoped to the requesting session's own `userId`.

**Deferred to H2:** full STRIDE threat model, data-residency matrix, consent architecture, M2M least-privilege, audit-log schema, advanced rate limiting.

---

## DevOps

**Railway** (single hosting platform): five services in one project — api (NestJS), web (Vite static), postgres (Railway-managed), supertokens (Core), livekit (optional self-host).

**Private network:** Railway private DNS (`railway.internal`) connects api → postgres, api → supertokens, api → livekit (self-hosted). No intra-service traffic crosses public internet.

**Environments:**
- **Local dev:** `pnpm dev` (Turborepo starts all services concurrently)
- **PR preview:** Railway ephemeral services on PR branch (GitHub app auto-deploy). Shares prod Postgres at self-use-mvp (risk: see R-1).
- **Production:** Railway persistent services on push to `main` (after CI passes)

No dedicated staging environment at MVP. PR previews serve that function.

**GitHub Actions CI** (`.github/workflows/ci.yml`):
- Four parallel jobs: `lint`, `typecheck`, `test`, `build`
- All run on `push` to any branch + `pull_request` to `main`
- `lint` — `biome ci .`
- `typecheck` — `tsc --noEmit`
- `test` — Postgres v16 service; `pnpm test` filtered to API + offline tests
- `build` — `turbo run build`
- All jobs: least-privilege `permissions: contents: read`
- Node cache via `actions/setup-node@v4` with `cache: pnpm`

**Deploy workflow** (`.github/workflows/deploy.yml`):
- Triggers on push to `main` after CI passes (needs all CI jobs)
- Uses Railway GitHub app (push-to-deploy) OR `railway up` CLI
- **Deploy verification** — NOT `/healthz`; uses Railway deployment state endpoint: `railway deployment list --json --service api | jq -e '.[0].status == "SUCCESS"'` (only state check that avoids stale-cache races)
- Timeout: 900 seconds (15 minutes)

**Env vars** (Railway dashboard or `mcp__Railway__set-variable`):

```
# Database
DATABASE_URL=postgres://...
DATABASE_POOL_SIZE=10

# SuperTokens
SUPERTOKENS_CONNECTION_URI=http://supertokens:3567  # private network
SUPERTOKENS_API_KEY=<generated>
SUPERTOKENS_COOKIE_DOMAIN=.studyhall.up.railway.app

# App
API_DOMAIN=https://api.studyhall.up.railway.app
WEB_DOMAIN=https://studyhall.up.railway.app
ALLOWED_ORIGINS=https://studyhall.up.railway.app

# LiveKit
LIVEKIT_API_KEY=<self-host-generated or Cloud-issued>
LIVEKIT_API_SECRET=<self-host-generated or Cloud-issued>
LIVEKIT_URL=wss://livekit.studyhall.up.railway.app  # or LiveKit Cloud URL

# Railway Buckets
AWS_ACCESS_KEY_ID=<Railway-issued>
AWS_SECRET_ACCESS_KEY=<Railway-issued>
AWS_ENDPOINT_URL=https://fly.storage.tigris.dev
AWS_REGION=auto
STORAGE_BUCKET_NAME=studyhall

# Resend
RESEND_API_KEY=<founder-issued>
RESEND_FROM_ADDRESS=noreply@studyhall.app

# Sentry (added at first deploy)
SENTRY_DSN=<founder-issued>
SENTRY_ENVIRONMENT=production

# Runtime
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

**Vite client env vars** (prefixed `VITE_`, embedded at build time):
```
VITE_API_URL=https://api.studyhall.up.railway.app
VITE_LIVEKIT_URL=wss://livekit.studyhall.up.railway.app  # or Cloud URL
VITE_SENTRY_DSN=<same as SENTRY_DSN>
```

**Secrets strategy:**
1. **Railway env vars** — production secrets. Scoped per service (web doesn't receive DB creds).
2. **GitHub Actions secrets** — CI only. `RAILWAY_TOKEN` (if not using push-to-deploy), `SENTRY_AUTH_TOKEN` (source map upload).
3. **`.env.example`** — committed, no secrets. Local dev loads from `.env` (gitignored).

**Observability:**
- Railway native logs (`railway logs --service api`) + structured JSON via Pino
- Sentry for error tracking (free tier at MVP)
- No structured alerting at MVP (founder is the sole user; will notice crashes)

**No Redis at MVP.** Single api process doesn't need Redis adapter (Socket.IO in-memory suffices). Three H2 upgrade triggers: (a) multi-replica api, (b) notification queue volume exceeds in-process, (c) distributed rate-limit store. Flag for introduction at H2 scaling milestone.

---

## Test

**Five test layers (T-1 through T-9):**

| Layer | Tool | Scope | Trigger |
|-------|------|-------|---------|
| T-1 | Biome + `tsc` | Lint + type-check all packages | Every push |
| T-2 | Vitest | Unit: pure functions, service logic, React component render + interaction | Code changes |
| T-3 | Vitest + Zod parse | Contract: Zod schema parse-valid/parse-invalid | Code changes |
| T-4 | Vitest + Supertest + real Postgres | Integration: NestJS service/controller/DB round-trips, offline sync state transitions | Service/schema touched |
| T-5 | Playwright MCP | E2E: full user flows F1–F9 against deployed/local-full-stack | Block-dispatcher trigger |
| T-6 | Playwright screenshot | Layout: dark-theme critical component visual regression | Block-dispatcher trigger |
| T-7 | Vite bundle-size + Playwright perf | Perf: bundle size budget, messaging channel TTI | Block-dispatcher trigger |
| T-8 | Vitest + Supertest | Security: RBAC guards, IDOR, JWT lifecycle, rate-limit smoke | Block-dispatcher trigger |
| T-9 | Playwright MCP + manual | Journey: regenerate user-journey-map.md, scenario smoke across all 16 pages | Block-dispatcher trigger |

**Coverage targets:**
- `packages/api` (NestJS) — every service method ≥1 happy + error path; 80% branch on Auth, RBAC, offline-sync
- `packages/web` (React SPA) — every exported component ≥1 render + interaction; 80% branch on offline store + connection-state machine
- `packages/shared` (Zod) — 100% schemas parse-valid + parse-invalid (cheap, must be complete)
- `packages/offline-sync` (client engine) — 80% branch (Tier-1, the wedge)

**Conventions:**
- File naming: co-located `.unit.test.ts` / `.unit.test.tsx` with source; integration tests at `packages/api/tests/integration/`; E2E at `packages/web/tests/e2e/`
- AAA structure: explicit `// Arrange`, `// Act`, `// Assert` comment blocks
- Mock policy: unit mocks at outermost boundary (data-access, external SDKs); integration uses real Postgres (transaction rollback per test); components mock API boundary only
- Component queries: `getByRole` / `getByLabelText` / `getByText` only (no `getByTestId` — doubles as accessibility check)
- NestJS tests: `TestingModule` via `NestFactory.create(AppModule)`, assert HTTP status + response shape (not call counts)

**Offline-first testing (Tier-1, hardest surface):**
- **Cache reads:** Vitest + `fake-indexeddb` (deterministic, fast, no browser needed)
- **Outbox queue:** unit tests verify pending state persists when disconnected; integration tests verify flush on reconnect
- **Reconnect sync:** integration tests with two commits (can't use transaction rollback), verify ack + catch-up + idempotency
- **Conflict resolution:** pure-function tests via transition matrix (local-edit + no-server-edit → local wins, etc.)
- Helper: `offline-harness.ts` exports `createOfflineEngine()`, `dropConnection()`, `assertOutboxLength()`

**Realtime (Socket.IO) testing:**
- Two-client verification mandatory (anti-pattern: one client "sees its own message" ≠ real-time works)
- Unit tests verify emit shape; integration tests verify reception + no replay; E2E tests verify cross-client delivery + WebSocket network instrumentation

**Voice/video (LiveKit) testing:**
- Media plane (ICE, DTLS, tracks) is **not E2E-testable** in headless Playwright
- Unit tests mock SDK, verify token issuance + room names; component tests render the provider + controls (stub `@livekit/components-react`); E2E verifies DOM presence + control rendering
- Explicit exclusion: media track state, SFU routing, screen-share capture (LiveKit's test suite owns those)

**Test database:**
- Dedicated Postgres instance (`studyhall_test`) distinct from dev/prod
- Migrations applied via `pnpm db:migrate:test` before integration suite
- CI spins up Postgres v16 via GitHub Actions `services:` block
- Transaction rollback per test (default); `truncateAll()` for tests requiring committed state

**Playwright E2E:**
- Swarm: 5 parallel MCP instances (one per tester agent), persona-partitioned
- Never `browser_close` mid-swarm (kills MCP for subsequent agents)
- Network panel instrumentation for Socket.IO / LiveKit signaling tests
- Config: `apps/web/playwright.config.ts`; base URL via `BASE_URL` env var

**Vitest configuration:**
- Shared preset at `packages/shared/vitest.preset.ts`; per-workspace extends + overrides
- Unit tests: `pool: threads`, `environment: node` (or jsdom for `apps/web`)
- Integration tests: `pool: forks` (process isolation for real DB connections)
- Coverage: v8 provider, 80% branch on Tier-1 packages

---

## Cross-domain interactions

### Offline-first dataflow (feature 12 — the wedge)

1. **Compose (offline or online):** `useSendMessage(channelId, content)` writes to IndexedDB outbox first (optimistic local ID assigned immediately; message rendered as pending/muted).
2. **Online path:** outbox entry POSTed immediately to `/api/messages` with `idempotency_key`. Server inserts (or deduplicates on UNIQUE conflict). Response: `{ id, createdAt }`. Client replaces optimistic row by nonce, removes pending indicator.
3. **Offline path:** outbox entry stays pending. Socket emits nothing. User sees local-only message with unsent indicator.
4. **Reconnect:** Socket emits `connect`. Sync engine: (a) flush outbox (POST `/api/messages` for each entry, ordered by `created_at`), (b) mark `flushing`, (c) on 2xx → mark `acked` (server timestamp returned), (d) on 409 (duplicate nonce) → mark `acked` (idempotent), (e) on 4xx → mark `rejected` (surface error, clear entry), (f) on 5xx → mark `failed` (retry up to 3x exponential backoff). (g) Call `GET /api/channels/:id/messages?after=<last_seen>` per channel. (h) Merge new rows into local cache. (i) Refresh channels + members. (j) Refresh unread count.
5. **Conflict resolution (MVP):** server timestamp is authoritative. Outbox entries with `status: failed` surfaced in UI as "failed to send" banner with retry action.

**End-to-end example:**
- User composes message while offline. Outbox: `{ idempotency_key: uuid1, channel_id: ch1, content: "hello", state: pending }`. Message bubble rendered locally as muted (pending indicator).
- Network returns. Socket `connect` fires. Sync engine flushes outbox. `POST /api/messages { idempotency_key: uuid1, channel_id: ch1, content: "hello" }`. Server inserts into messages table with server-assigned `id` and `created_at`. Response: `{ id: msg123, createdAt: 2026-06-26T12:00:00Z }`. Client updates outbox entry to `state: acked`. Message bubble re-rendered with permanent `id: msg123`, bold (sent indicator).
- A second user in the same channel (online the whole time) receives the message via Socket.IO `message:new` event (fan-out from server to `/messaging` room).
- Second user sees the message with the same `id` and `createdAt`.

### Auth dataflow (end-to-end)

**Signup:**
1. User fills `/signup` form (email, password).
2. `POST /api/auth/signup` with Zod-validated payload.
3. NestJS calls `supertokens-node` `EmailPassword.signUp(email, password)`.
4. SuperTokens Core hashes password (Argon2 default), stores user, returns `user_id`.
5. StudyHall `UsersModule` creates row in `users` table with matching `id`.
6. SuperTokens sends verification email via Resend (configured on Core).
7. Frontend redirects to `/verify` stub (polls for email open or manual link click).

**Email verification:**
1. User clicks link in email: `https://studyhall.up.railway.app/verify?token=<token>`.
2. `POST /api/auth/verify-email { token }` via the route handler.
3. NestJS calls `supertokens-node` `EmailVerification.verifyEmailUsingToken(token)`.
4. SuperTokens Core validates token, flips `email_verified` claim.
5. Frontend redirects to `/login` or auto-logs-in (depending on implementation choice at B-block).

**Login:**
1. User fills `/login` form (email, password).
2. `POST /api/auth/login` with Zod-validated payload.
3. NestJS calls `supertokens-node` `EmailPassword.signIn(email, password)`.
4. SuperTokens Core returns `user_id` + creates session.
5. `supertokens-auth-react` SDK sets httpOnly+Secure+SameSite cookie automatically.
6. Frontend redirects to `/servers` (server list).

**WS / LiveKit handshake:**
1. Browser REST calls are cookie-based (httpOnly cookies attached automatically).
2. WebSocket doesn't attach cookies cleanly in some contexts (PWA, cross-origin).
3. Frontend calls `GET /api/auth/session` to get a short-lived JWT (access token extracted from SuperTokens session).
4. Frontend opens Socket.IO connection with `auth: { token: jwt }` in handshake.
5. Socket.IO middleware calls `verifySession(token)` → extracts `userId` → attaches to `socket.data.userId`.
6. Similar flow for LiveKit: `GET /api/v1/channels/:id/voice/token` → NestJS verifies session → RBAC check → issues scoped LiveKit JWT → client passes to LiveKit SDK.

### RBAC enforcement (server-side flow)

Example: user tries to post a message in a private channel.

1. `POST /api/v1/channels/:id/messages` with `content: "hello"`.
2. NestJS guard: `JwtAuthGuard` verifies session → extracts `userId`.
3. NestJS guard: `ChannelPermissionGuard` calls `RbacService.can(userId, 'send_message', { channelId: id })`.
4. `RbacService` queries `server_members` (userId, serverId FK via channelId) → finds `role_id`.
5. `RbacService` queries `roles` (role_id) → finds permission bitfield / boolean columns.
6. `RbacService` queries `permissions` (channel_id, role_id) for overrides.
7. Resolves: `can_send === true` at channel + role? → allow; false? → deny.
8. Guard throws 403 if denied; allows handler to proceed if allowed.
9. `MessagingService.createMessage()` persists message to DB + emits `message.created` event.
10. `RealtimeGatewayModule` listens for event, broadcasts to `/messaging` namespace room for the channel.
11. All online channel members receive `message:new` Socket.IO event.

**Socket.IO room membership:** when user joins channel, the server adds the socket to a Socket.IO room named `channel:${channelId}`. The broadcast `server.to(room).emit()` is the delivery mechanism for real-time fan-out. No direct socket tracking per module — the room is the abstraction.

---

## Resolved cross-branch decisions (v6b)

A v6b conflict scan identified 20 cross-branch drifts. All are resolved below as the canonical decisions — this document reflects the resolved truth; conflicts are not re-surfaced.

| # | Decision | Ownership | Rationale |
|---|----------|-----------|-----------|
| 1 | Message idempotency key field name: `idempotency_key` (not `nonce`); dedup via `UNIQUE (channel_id, idempotency_key)`. Outbox uses same field. | databases.md + services.md | Consistent naming across server message table + IndexedDB outbox. Composite UNIQUE prevents duplicate inserts on flush retry. |
| 2 | ServersModule owns: servers, server_members, channels, categories, bans. Channels are NOT a separate module. | modules.md + services.md | Tight cohesion: channel is scoped to server; channel CRUD and server management are co-located. Reduces inter-module coupling. |
| 3 | `invites` table owned by ServersModule (no standalone Invite module). | modules.md + services.md | Invites are scoped to servers; co-locating with server ownership simplifies schema + logic. |
| 4 | Two-tier invite model (canonical): permanent `servers.invite_code` + ad-hoc `invites` table (time/use-limited). Invite preview resolves both. | modules.md + databases.md | Permanent link for easy sharing (no expiry); ad-hoc links for time-bound access control. Single preview endpoint handles both by checking invite type. |
| 5 | Privacy/profile: single `users` table — `profile_visibility` + `who_can_dm` columns on `users`, owned by UsersModule. No separate `profiles`/`privacy_settings` tables. | databases.md + modules.md | Denormalization reduces joins on hot-path profile reads. PrivacyControls is a UsersModule sub-feature, not a separate domain. |
| 6 | Roles: single-role-per-member (`server_members.role_id` FK) + `roles` table + channel-level `permissions` (boolean columns) + `channel_permission_overrides`. No many-to-many role join tables. | modules.md + databases.md | Simpler model: one role per member + channel overrides. Discord-aligned. Many-to-many would over-engineer MVP. |
| 7 | Message table naming (canonical): `thread_parent_id`, `reactions`, `attachments` (not `reply_to_id`, `emoji_reactions`, `files`). | databases.md | Precise names avoid ambiguity. Consistent with industry terminology. |
| 8 | WS/LiveKit auth (PRIMARY): SuperTokens session cookie validated on Socket.IO upgrade (`withCredentials: true`, same-origin on Railway shared domain). DOCUMENTED FALLBACK: short-lived JWT in handshake `auth` payload for cross-origin/PWA. LiveKit room tokens issued by API after session check. | services.md + security.md + devops.md | Cookie-first for browser (safest against XSS); JWT fallback for PWA/cross-origin (clean bridge). LiveKit tokens always server-issued (secret never leaves API). |
| 9 | Email ownership: SuperTokens Core owns verify + password-reset emails. NotificationsModule owns ONLY invite + reminder emails. Two Resend API keys (optional clarity; one key works but reduces attribution). | sdks.md + modules.md | Separation of concerns: auth-critical emails delegated to Core; StudyHall-native emails (invites, reminders) via NotificationsModule. |
| 10 | Offline outbox flush: replays as normal `POST /api/messages` with idempotency keys over `/messaging` namespace. No dedicated `/sync` namespace/endpoint for flush. | modules.md + services.md | Reuses standard message creation logic + RBAC. Simpler than a separate flush endpoint. Idempotency keys ensure dedup across retries. |
| 11 | Catch-up on reconnect: reuse `GET /api/channels/:id/messages?after=<cursor>` (keyset pagination on `created_at` + `id`). No `/sync/catchup` endpoint. | modules.md + databases.md | Single message history endpoint; no duplication. Keyset cursor handles millisecond ties + new inserts during pagination. |
| 12 | Offline-sync engine is a feature slice at `apps/web/src/features/sync` (NOT a standalone workspace package). Test paths use `apps/api` / `apps/web`. | modules.md + test.md + tools.md | Co-location in the frontend app simplifies imports + builds. Workspace package over-complicates at MVP. Test imports from core packages. |
| 13 | CI runs web + api + e2e + offline test jobs. devDeps include `fake-indexeddb`, `msw`, `wait-on`. | devops.md + test.md | Offline tests require fake-IndexedDB (deterministic). MSW for mocking HTTP (optional at MVP; considered for SDK mocking). `wait-on` for service readiness polling. |
| 14 | Root scripts: `db:generate`, `db:migrate`, `db:migrate:test`, `db:seed`, `test`, `test:ci`, `dev`, `build`, `lint`, `typecheck`. Test Postgres image: `postgres:16`. | tools.md + devops.md | Script inventory captures the CLI surface. Postgres v16 is current stable; Railway supports it. |
| 15 | File caps: 2 MB avatar / 10 MB attachment (authoritative in security domain). | security.md + sdks.md | MVP size limits prevent unbounded storage cost. Enforced server-side at pre-sign endpoint. |
| 16 | Storage env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL`, `STORAGE_BUCKET_NAME` (AWS S3 SDK needs AWS_* for default cred resolution). | sdks.md + devops.md | AWS SDK v3 requires exact env var names for credential chain. Tigris S3-compatible endpoint requires explicit override. |
| 17 | Session cookie `SameSite=Lax` (not Strict; Strict breaks invite-link→login→auto-redeem top-level navigation). | security.md | Lax allows top-level navigation from invite email link → login. Strict would require user action on the logged-in page. MVP prioritizes UX. |
| 18 | CI adds gitleaks secret-scan step now. Sentry-PII lint guard deferred to H2 (consistent with self-use-mvp security scope). | devops.md + security.md | Gitleaks is low-cost, high-value (prevents accidental secret commits). Sentry-PII guards are stricter and can be enforced at code-review scale later. |
| 19 | No SDK overlap. Resend has two consumers (SuperTokens Core + NotificationsModule) → two keys recommended (or one key if founder prefers). | sdks.md | Two keys improve cost attribution + rotate independently. One key is simpler. No architecture dependency either way. |
| 20 | Socket.IO namespaces locked to TWO: `/messaging` (messages, typing, reactions) and `/presence` (online presence + voice-room occupancy). SPA opens 2 WS connections. | services.md + modules.md | Consolidated namespaces reduce connection overhead + boilerplate. Two is sufficient for MVP's feature set. Typed event discriminated unions in shared schemas. |

---

## Open items and risks

### High priority (blocks shipping)

- **LiveKit self-host vs cloud decision (R-SDK-1)** — self-hosting adds TURN/STUN complexity + UDP port exposure on Railway (R-3); LiveKit Cloud free tier (100 participant-minutes/month) removes ops burden but adds cost. **Resolution gate: v6 SDK branch.** Decision recorded in `command-center/product/product-decisions.md`.
- **Resend domain verification (R-SDK-2)** — founder must add SPF/DKIM/MX records to the sending domain. Temporary fallback: `onboarding@resend.dev`, but must be replaced before external cohort onboarding.
- **SuperTokens Core email configuration (R-SDK-3)** — Core must be configured with Resend (or SMTP) as the email provider for verification + password reset. This is a Core service-side config, not a `supertokens-node` code change. **Documented in SuperTokens SDK deep-doc at B-block.**
- **Offline-sync package library (test.md R-7)** — exact library (Dexie + custom vs. full sync engine) chosen at v6. Test harness design above is library-agnostic. **Reconciliation contract is fixed; only implementation library varies.**

### Medium priority (watch for H2/cohort scaling)

- **Presence store in-process (services.md R-1)** — single Railway pod fine at MVP. Multi-pod requires `@socket.io/redis-adapter` + Redis presence store. Presence flickers on service restart; acceptable at cohort scale.
- **WebSocket sticky sessions (devops.md R-2)** — single `api` pod guarantees all connections land on same process. Multiple pods require sticky sessions via `X-Railway-Request-ID` (interim) or Redis adapter (H2).
- **Offline-sync reconnect ordering (services.md R-2)** — concurrent outbox flushes across two browser tabs may produce out-of-order messages in the UI. Mitigation: outbox entry status (`flushing`) set atomically; server-side nonce dedup provides final safety. Acceptable for self-use-mvp.
- **PR preview environments share prod Postgres (devops.md R-1)** — at founder-only stage, acceptable (no other users' data). **Before cohort onboarding: add a preview Postgres instance scoped to ephemeral preview services.**
- **Dexie schema migrations (modules.md Risk-3)** — IndexedDB schema changes require Dexie version bumps + migration callbacks. Discipline required: forgetting a migration causes silent data loss. **Enforce at code review.**

### Low priority (known, deferred, or accepted)

- **Outbox flush ordering under concurrent reconnects (services.md R-4)** — last-writer-wins by server clock correct for consistency but may surprise users. H2: add `client_seq` secondary sort for better UX.
- **Hard-delete not supported (databases.md R-5)** — before compliance feature 24 lands (H2), add soft-delete + deletion event log if needed.
- **No structured alerting (devops.md R-6)** — at founder-only MVP, founder notices crashes. Add Slack webhook before cohort onboarding.
- **Vite env var embedding (devops.md R-7)** — `VITE_API_URL` baked into build. Stable custom domain avoids re-deploys on Railway URL changes.
- **Sentry source maps security (devops.md R-8)** — ensure Railway does not serve `.map` files from api service.
- **LiveKit media plane not E2E-testable (test.md Risk-5)** — documented scope exclusion. Boundary mock + SDK ownership of media concerns.
- **Connection limit on Railway starter plan (devops.md R-5)** — Socket.IO persistent connections per tab. At cohort scale < 30 concurrent users, within limits. Monitor metrics.

### Explicitly deferred to H2 / later

- Full STRIDE threat model → data-residency matrix → consent architecture → M2M least-privilege → audit-log schema → advanced rate-limiting
- Billing (feature 22, Stripe) — deferred with feature flag
- DMs (feature 21) — scaffold only; enforcement at H2
- Server discovery (feature 23) — H2
- Compliance (feature 24) — H2
- Institution admin console (feature 41) — H3
- E2E encryption (feature 42) — H3
