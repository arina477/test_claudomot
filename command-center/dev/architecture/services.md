# Architecture Branch: Services

branch: services
authored: 2026-06-26
stage: self-use-mvp
stack_lock: NestJS · Postgres/Drizzle · Socket.IO · LiveKit · SuperTokens · Railway

---

## Summary

StudyHall's backend is a **NestJS modular monolith** for the self-use-mvp stage. All product modules live in a single deployable process on Railway, sharing one Postgres instance (Railway-managed) and one Socket.IO server. Module boundaries are drawn tightly enough that any single module can be extracted to its own Railway service in H2 without cross-cutting refactors — the contracts between them are already interface-typed and go through explicit service injection, not direct cross-module DB queries.

**Why monolith, not microservices, at this stage.** The cohort is one class; traffic is single-digit concurrent users at launch. Microservices would introduce distributed tracing, inter-service auth, independent deploy pipelines, and network latency on every cross-cutting operation (e.g. permission checks that span `users` + `servers` + `channels` + `rbac`) — all cost with zero scale benefit. A modular monolith gives clean separation while keeping operational surface minimal. The right H2 split points are identified in the Risk section below.

---

## Inventory

Nine NestJS modules, each owning its own Drizzle schema files, controllers, services, and guards. No cross-module direct table access — foreign-key lookups that cross module boundaries go through the owning module's exported `Service` class.

### 1. AuthModule

**Responsibility:** SuperTokens session lifecycle. Signup, login, email verification, password reset, JWT issuance and refresh. SuperTokens Core runs as a sidecar Railway service communicating over Railway's private network; this module wraps its Node SDK and exposes NestJS guards (`JwtAuthGuard`, `SessionGuard`) consumed by every other module.

**Routes:** `/api/v1/auth/*` (proxied to SuperTokens SDK handlers via `supertokens-node` middleware registration in `AppModule`).

**Owns:** `sessions` table (SuperTokens-managed schema), no additional Drizzle schema. Exports `CurrentUser` decorator + `JwtAuthGuard`.

**Key dependency:** SuperTokens Core on Railway private network (`SUPERTOKENS_CONNECTION_URI`).

### 2. UsersModule

**Responsibility:** User profile CRUD, avatar management, display name, color, privacy settings (feature 2, 16). Issues pre-signed upload URLs for avatar uploads (delegates to FilesModule). Controls profile visibility and who-can-DM flags.

**Routes:** `/api/v1/users/me`, `/api/v1/users/:id` (public profile, visibility-filtered).

**Owns:** `users` table (id, supertokens_user_id FK, username, display_name, avatar_url, color, privacy_flags, created_at).

### 3. ServersModule

**Responsibility:** Server CRUD, categories, channel ordering within a server, invite link generation and redemption, member roster management, ban list (features 5, 6, 11). Owns the join/leave/ban lifecycle. Does not own permissions — delegates permission reads to RbacModule via exported `PermissionService`.

**Routes:** `/api/v1/servers`, `/api/v1/servers/:id`, `/api/v1/servers/:id/members`, `/api/v1/servers/:id/channels`, `/api/v1/invites/:code`.

**Owns:** `servers`, `server_members`, `channels`, `categories`, `invites`, `bans` tables.

**Exports:** `ChannelService` (consumed by MessagingModule, VoiceModule, AssignmentsModule for channel existence checks), `MembershipService` (consumed by RbacModule for role lookups).

### 4. RbacModule

**Responsibility:** Role CRUD, permission rules, channel-level overrides, owner safeguards (feature 10). Exposes a single `can(userId, action, channelId | serverId)` method used as a NestJS guard factory. No HTTP routes of its own beyond the settings sub-resource.

**Routes:** `/api/v1/servers/:id/roles`, `/api/v1/servers/:id/roles/:roleId`.

**Owns:** `roles`, `role_permissions`, `member_roles`, `channel_permission_overrides` tables.

**Exports:** `RbacService.can()` — the single permission-check entry point used by `MessagingModule`, `ServersModule`, `VoiceModule`.

### 5. MessagingModule

**Responsibility:** Message persistence and delivery for text channels (features 7, 8, 9). Handles send, edit, delete, reactions, replies/threads, mentions. Persists every message to Postgres with an idempotency key. Attachment metadata stored here; binary upload is pre-signed via FilesModule. Message fan-out to connected sockets is delegated to the RealtimeGateway via an internal event emitter (see Inter-module communication below).

**Routes:** `/api/v1/channels/:id/messages` (GET paginated history, POST create), `/api/v1/messages/:id` (PATCH edit, DELETE), `/api/v1/messages/:id/reactions`.

**Owns:** `messages`, `message_reactions`, `message_attachments`, `threads` tables.

**Key design:** messages carry an `idempotency_key` column (client-generated UUID, unique per channel). This is the anchor for offline outbox flush deduplication — if the client retransmits a message after reconnect, the UNIQUE constraint on `(channel_id, idempotency_key)` silently absorbs the duplicate and returns the existing row.

### 6. RealtimeGatewayModule

**Responsibility:** Socket.IO server, namespace management, presence tracking, typing indicators, real-time message delivery (features 7, 8, 12, 14). This is the single socket entry point — all other modules emit domain events to it via NestJS's `EventEmitter2`; it translates those to socket broadcasts.

**No HTTP routes.** Exposes three Socket.IO namespaces:

| Namespace | Purpose |
|-----------|---------|
| `/messaging` | Message delivery, edits, deletes, reactions, thread updates |
| `/presence` | Online/away/offline status, voice-room participant list |
| `/typing` | Typing indicator fan-out (ephemeral, not persisted) |

**Presence store:** In-memory `Map<userId, socketId[]>` for MVP (sufficient for a single process + single-digit concurrent users). Flagged for Redis migration at H2 (see Risk).

**Offline outbox flush protocol:** When a client reconnects, it sends a `flush_outbox` event carrying an array of `{ idempotency_key, channel_id, content, attachments[], sent_at_client }` records ordered by `sent_at_client` ascending. The gateway:

1. Passes each record to `MessagingService.createFromOutbox()`, which does an upsert keyed on `(channel_id, idempotency_key)`.
2. `createFromOutbox` returns `{ message_id, was_duplicate: boolean }` for each record.
3. After all records are processed, the gateway emits a `flush_ack` back to the reconnecting socket with the full resolution list so the client can reconcile its local outbox state.
4. For each non-duplicate message, a `message.created` event is emitted to the `/messaging` namespace room for that channel, delivering to other online members.

**Conflict resolution:** last-writer-wins by server receive timestamp (`created_at` set by the server, not the client). The client's `sent_at_client` is stored for display ordering within the same reconnect batch but does not override server ordering for other members. No operational transform or CRDT at MVP — simple append with idempotency is sufficient for text messaging.

**Ordering guarantee:** Within a channel, messages are ordered by `(created_at, id)` (Postgres ULID/serial). Outbox-flushed messages land with the server's `created_at` at flush time, which may be later than their client timestamp. The client local cache re-orders on `sent_at_client` for the composing user's own view until the flush ack arrives, then adopts server ordering.

### 7. VoiceModule

**Responsibility:** LiveKit room and token issuance for voice/video study rooms (feature 13). Thin service — StudyHall does not run media; LiveKit handles that. This module creates/closes LiveKit rooms via the LiveKit Server SDK, issues short-lived JWT access tokens scoped to a room + participant identity, and enforces RBAC before issuing.

**Routes:** `/api/v1/channels/:id/voice/token` (POST — returns LiveKit JWT + ws URL), `/api/v1/channels/:id/voice/room` (GET room metadata, participant list).

**Owns:** `voice_sessions` table (channel_id, user_id, joined_at, left_at — for presence tracking only; no media state).

**LiveKit configuration:** `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` env vars. Room names are namespaced as `server_{serverId}_channel_{channelId}`. Token TTL: 4 hours (refreshed client-side before expiry). LiveKit runs either on Railway (self-hosted) or LiveKit Cloud — the SDK call is identical; only the URL env var changes. The H2 decision on self-host vs cloud is flagged in Risk.

### 8. AssignmentsModule

**Responsibility:** Assignment CRUD, due-date tracking, per-student status (to-do/done) (features 15, F6, F9). Light academic tooling — no submission/grading. Cron job for due-date reminders lives in this module (scheduled via NestJS `@Cron`).

**Routes:** `/api/v1/servers/:id/assignments` (GET list, POST create), `/api/v1/assignments/:id` (PATCH, DELETE), `/api/v1/assignments/:id/status` (PATCH — student marks to-do/done).

**Owns:** `assignments`, `assignment_statuses` tables.

**Background job:** `DueReminderJob` — cron `0 8 * * *` (daily at 08:00 UTC). Queries assignments due within 24h, emits notification events to `NotificationsModule` for each member who has not marked done.

### 9. NotificationsModule

**Responsibility:** In-app notification dispatch for mentions, assignment reminders (feature 14). For MVP: persists notification rows and delivers them over Socket.IO via the RealtimeGateway's `/presence` namespace. Transactional email (Resend) is wired here for assignment reminders + invite notifications; Resend promotion to MVP is confirmed (feature 1 email verify, feature 6 invites).

**Routes:** `/api/v1/notifications` (GET unread list), `/api/v1/notifications/:id/read` (PATCH).

**Owns:** `notifications` table (user_id, type, payload JSONB, read, created_at).

**Background job:** `NotificationDispatchJob` — processes the notification queue emitted from MessagingModule (mention events) and AssignmentsModule (reminder events). At MVP this runs synchronously in-process via `EventEmitter2`. Redis-backed BullMQ queue is the H2 upgrade path.

### 10. FilesModule

**Responsibility:** Pre-signed upload URL issuance against Railway Buckets (Tigris S3-compatible), size/type validation, post-upload metadata confirmation (features 2, 9). Does not store files — coordinates between client and Railway Buckets directly.

**Routes:** `/api/v1/files/upload-url` (POST — returns pre-signed PUT URL + object key), `/api/v1/files/:key/confirm` (POST — validates object exists, returns CDN URL, stores metadata).

**Owns:** `file_metadata` table (key, uploader_id, size, mime_type, created_at).

---

## Conventions

**API versioning.** All REST routes are prefixed `/api/v1`. No content-negotiation versioning — URI versioning is explicit and survives proxies. When a breaking change requires v2, the new controller lives in a separate `v2/` subfolder under the same module; v1 routes remain alive until all clients migrate. At self-use-mvp scale this is a one-founder decision.

**HTTP semantics.**
- `GET` for reads (idempotent, no body).
- `POST` for creates and non-idempotent actions (token issuance, flush).
- `PATCH` for partial updates (message edit, assignment status).
- `DELETE` for hard deletes at MVP (soft-delete is an H2 concern for compliance).
- `204 No Content` on successful DELETE. `201 Created` on POST creates. `200 OK` on PATCH.

**Request/response validation.** Every endpoint has a Zod schema in `@studyhall/shared/schemas/`. NestJS DTOs are derived from those schemas via `@anatine/zod-nestjs`. Validation pipe is global (`useGlobalPipes(new ZodValidationPipe())`). Invalid payloads return `400` with a structured error body: `{ code, message, details[] }`.

**Structured error responses.** All error responses follow:
```json
{ "statusCode": 403, "code": "CHANNEL_PERMISSION_DENIED", "message": "human-readable" }
```
Error codes are string enums in `@studyhall/shared/errors.ts`.

**Authentication on every protected route.** `JwtAuthGuard` applied globally except the auth routes and `/invite/:code` preview. SuperTokens refresh is handled transparently by the client SDK.

**RBAC guard composition.** Routes that need permission checks use `@UseGuards(JwtAuthGuard, ChannelPermissionGuard)` where `ChannelPermissionGuard` calls `RbacService.can()`. The guard reads `serverId`/`channelId` from route params, not the request body.

**Pagination.** All list endpoints use cursor-based pagination: `?before=<message_id>&limit=50` (messages) or `?cursor=<id>&limit=20` (members, assignments). No offset pagination — it degrades under concurrent inserts in message streams.

**Idempotency keys.** Every message create carries `X-Idempotency-Key` (HTTP header) mirroring the body `idempotency_key` field. The MessagingModule deduplicates on the DB UNIQUE constraint; if the key already exists, it returns `200` with the existing row (not `201`).

**Correlation IDs.** Every request is assigned a `X-Request-ID` (generated if absent). Logged on every log line via NestJS async-local-storage context. Socket.IO events carry a `trace_id` field for the same purpose.

**Structured logging.** Pino logger (NestJS Pino integration), JSON output, log level from `LOG_LEVEL` env var (`info` default, `debug` in development). No `console.log` in production paths.

**CORS.** `ALLOWED_ORIGINS` env var (comma-separated). In development: `http://localhost:5173`. In production: the Railway-deployed frontend URL. Credentials: `true` (required for SuperTokens cookie session).

**Rate limiting.** `@nestjs/throttler` applied globally: 100 requests/minute per IP. Tighter limits on auth endpoints: 10 requests/minute. Socket.IO connections: 5 concurrent connections per user (enforced in connection middleware).

---

## Reusability principles

1. **Module exports only service classes, never repositories.** Other modules call `ServersModule`'s `ChannelService.findById()`, not the Drizzle `channelsTable` directly. This keeps schema migrations isolated to the owning module.

2. **Shared Zod schemas in `@studyhall/shared` are the single source of truth for wire types.** Both NestJS DTOs and the React client use the same schema package. Any type mismatch is a build error, not a runtime surprise.

3. **`EventEmitter2` for intra-process domain events.** When `MessagingModule` persists a message, it emits `message.created` with a typed payload. `RealtimeGatewayModule` and `NotificationsModule` subscribe independently. This decouples persistence from delivery and is the seam for extracting to a queue in H2 without changing the publisher.

4. **`RbacService.can()` is the only permission-check entry point.** No module inspects role tables directly. This makes the permission model auditable from a single file and is the right extraction unit for an H2 authorization service.

5. **LiveKit token issuance is a pure function of `(userId, channelId, serverId)` plus env vars.** No shared state. This means `VoiceModule` can be moved to a separate service (or a Cloudflare Worker edge function) with zero logic changes — only the HTTP client call site moves.

6. **Background jobs are co-located with their owning module at MVP.** `DueReminderJob` lives in `AssignmentsModule`, `NotificationDispatchJob` in `NotificationsModule`. When a job needs to scale independently (e.g. media processing under H2 storage load), it moves to a dedicated worker service that shares the same Postgres connection. The `EventEmitter2` publish/subscribe contract remains unchanged; the subscriber moves, not the publisher.

7. **All file I/O goes through `FilesModule`.** No other module talks to Railway Buckets directly. This isolates the S3 client credential and makes storage provider swaps (e.g. to Cloudflare R2) a single-file change.

---

## Cross-references

| Topic | File |
|-------|------|
| Stack lock (NestJS, Postgres, Socket.IO, LiveKit, SuperTokens, Railway) | `command-center/dev/stack-decisions.md` |
| Feature list with H1/H2/H3 classification | `command-center/product/feature-list.md` |
| Module inventory first pass | `command-center/product/tools-modules-map.md` |
| All routes cross-referenced to pages and flows | `command-center/artifacts/user-journey-map.md` |
| Offline-first client-side design (outbox, IndexedDB, reconnect UI) | `command-center/dev/architecture/offline-sync.md` (to be authored — v6 Modules branch) |
| Database schema (Drizzle table definitions, indexes, migration policy) | `command-center/dev/architecture/database.md` (to be authored — v6 DB branch) |
| DevOps (Railway service topology, env vars, CI shape, Redis flag) | `command-center/dev/architecture/devops.md` (to be authored — v6 DevOps branch) |
| SDK integrations (LiveKit self-host vs cloud, Resend, SuperTokens) | `command-center/dev/SDK-Docs/` (to be populated — v6 SDK branch) |

---

## Stack-specific decisions

**NestJS module boundaries map to Railway services (future).** NestJS's `DynamicModule` + `forRoot/forFeature` pattern is used throughout. When a module is extracted, its `forRoot()` config (DB connection, env vars) becomes the new service's `AppModule` bootstrap. No architectural rework needed.

**Drizzle schema files live inside their owning module.** `src/modules/messaging/schema.ts` owns `messages`, `message_reactions`, etc. A single `src/db/migrate.ts` script imports all schema files and runs `drizzle-kit migrate`. This avoids a god-schema file while keeping migrations a single CLI command.

**Socket.IO adapter at MVP: in-memory (default).** No Redis adapter for MVP — single process, single Railway instance. When horizontal scaling is needed (H2), drop in `@socket.io/redis-adapter` against a Railway Redis instance. The `RealtimeGatewayModule` initialization is the only change point.

**SuperTokens session mode: cookie-based (httpOnly).** The NestJS backend sets `supertokens-node` in `COOKIE_DOMAIN` mode. The React SPA uses `supertokens-auth-react` which handles cookie attachment automatically. This avoids token storage in `localStorage` (XSS surface).

**LiveKit room lifetime: created on first join, closed on last leave.** `VoiceModule` checks participant count via the LiveKit Server SDK on `leave` events forwarded from the client. Empty rooms are deleted via `RoomServiceClient.deleteRoom()` to avoid stale room state on LiveKit. Room names are deterministic (`server_{id}_channel_{id}`) so re-entry is idempotent.

**Postgres connection pool:** `pg` pool via Drizzle's `node-postgres` driver. Pool size `DATABASE_POOL_SIZE` env var (default `10` for MVP single-instance). Railway Postgres supports up to 97 connections on the starter plan; `10` leaves headroom for migrations and ad-hoc queries.

**No Redis at MVP.** The stack-decisions note flags Redis for H2. The three places Redis would be needed: (a) Socket.IO multi-instance adapter, (b) BullMQ for background job queues, (c) rate-limit store for distributed instances. All three are single-process non-issues at MVP scale.

**Resend (transactional email) promoted to MVP.** Required for feature 1 (email verification) and feature 6 (invite emails). `RESEND_API_KEY` added to `.env.example`. `NotificationsModule` owns the Resend client and is the sole email sender.

**Background job runner: NestJS `@Cron` (node-cron) at MVP.** No BullMQ or external scheduler. Two cron jobs: `DueReminderJob` (daily) and a `StaleVoiceSessionCleaner` (every 30 min — closes `voice_sessions` rows where `left_at IS NULL` and LiveKit confirms no active participant). Sufficient for self-use-mvp. BullMQ migration path is documented in Risk.

---

## Risk / open items

| ID | Item | Severity | H2 action |
|----|------|----------|-----------|
| R-1 | **Presence store is in-memory.** A Railway service restart drops all presence state. At self-use-mvp (single instance, low traffic) this is a brief flicker. For any multi-instance or HA deploy, a Redis presence store is required. | Low (MVP) / High (scale) | Add `@socket.io/redis-adapter` + Redis presence store on first multi-instance deploy. |
| R-2 | **Background jobs run in-process.** A long-running cron (e.g. mass due-date reminder batch) blocks the Node event loop. At cohort scale (< 50 assignments) this is negligible. | Low (MVP) | Extract to BullMQ worker process (separate Railway service) at H2 when assignment volume grows or media processing (avatar resize, attachment thumbnail) is added. |
| R-3 | **LiveKit self-host vs cloud decision deferred.** Self-hosting on Railway adds operational overhead (LiveKit server Railway service, port config, TURN server). LiveKit Cloud removes that but adds per-minute cost. Decision gate: confirm at v6 SDK branch before first voice room milestone. | Medium | V6 SDK branch decision: benchmark Railway self-host cost vs LiveKit Cloud free tier for a 5-person study room. |
| R-4 | **Outbox flush ordering under concurrent reconnects.** If two clients flush outboxes for the same channel simultaneously, server `created_at` timestamps may interleave their messages in an order neither client expects. Last-writer-wins by server clock is correct for consistency but may surprise users who typed messages "before" the other person. | Low (self-use) | Acceptable at MVP. H2: add a `client_seq` column (monotonic int per client session) as a secondary sort key within a flush batch for better UX ordering. |
| R-5 | **No soft-delete at MVP.** Messages and assignments are hard-deleted. Compliance (feature 24, H2) requires audit logs and data-export support, which need soft-delete + event sourcing or at minimum a deletion log. | Low (H2 compliance) | Before promoting feature 24 to H1 (e.g. if a paying school requires it), add `deleted_at` column + deletion event log to `messages` and `users`. |
| R-6 | **`EventEmitter2` is synchronous in-process.** If `RealtimeGatewayModule`'s listener throws during a `message.created` event, it can surface into the `MessagingModule` publisher's request cycle. | Low | Wrap all `EventEmitter2` listeners in try/catch with structured logging. H2: replace with BullMQ for true async fan-out isolation. |
| R-7 | **H2 service-split candidates.** The modules most likely to need extraction: `VoiceModule` (LiveKit token service — stateless, good edge candidate), `NotificationsModule` + `AssignmentsModule` background jobs (worker process), `RealtimeGatewayModule` (Socket.IO — multi-instance requires Redis adapter anyway). `AuthModule` stays in the monolith (SuperTokens sidecar handles the heavy lifting). | — | Document split contracts at each H2 milestone. Module interfaces are already the split seam. |
| R-8 | **No DMs at MVP.** Direct messages (feature 21) are H2. The `channels` table schema should include a `type` enum (`text | voice | dm | group_dm`) now so adding DM channels later is a data migration rather than a schema change. | Low | Add `channel_type` enum column at schema authoring time even though DM logic is not implemented. |
