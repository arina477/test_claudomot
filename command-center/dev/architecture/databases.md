# Architecture — Databases

**Branch:** databases
**Last updated:** 2026-06-26
**Stage:** self-use-mvp
**Stack:** PostgreSQL (Railway-managed) + Drizzle ORM + IndexedDB (client-side local store)

---

## Summary

StudyHall runs two data stores that must be kept coherent:

1. **Server-side PostgreSQL** — the system of record. Managed on Railway; accessed exclusively through Drizzle ORM. All persistent, authoritative state lives here.
2. **Client-side IndexedDB** — the offline-first wedge (feature 12). A structured local cache + outbox queue that lets the SPA read recent messages and queue sends without a network connection. On reconnect, the client and server execute a reconciliation protocol to merge state.

Both stores are first-class architecture concerns. A change to the Postgres schema that touches messages, channels, or membership must be evaluated for its effect on the IndexedDB shape and the reconciliation contract, and vice versa.

SuperTokens manages its own Postgres schema (`supertokens` schema / separate DB service on Railway). The auth tables are opaque to Drizzle — StudyHall models reference the SuperTokens `user_id` (UUID string) as a foreign key but never JOIN into SuperTokens internals.

---

## Inventory

### Server-side tables (Postgres / Drizzle)

All tables live in the `public` schema unless noted. Column types use Drizzle / Postgres conventions. Indexes are listed per table; composite indexes are noted explicitly.

---

#### `users`

Thin profile mirror of the SuperTokens identity. Created on first successful login via a post-auth hook.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK default `gen_random_uuid()` | Matches SuperTokens `user_id` |
| `username` | `text` NOT NULL UNIQUE | URL-safe handle |
| `display_name` | `text` NOT NULL | Display-only, non-unique |
| `avatar_url` | `text` | Railway Buckets URL; null until set |
| `avatar_color` | `text` | Hex fallback when no avatar |
| `bio` | `text` | |
| `profile_visibility` | `text` NOT NULL DEFAULT `'everyone'` | enum: `everyone` / `server_members` |
| `who_can_dm` | `text` NOT NULL DEFAULT `'everyone'` | enum: `everyone` / `server_members` / `nobody` |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `UNIQUE (username)`, `INDEX (created_at DESC)` for admin queries.

Drizzle schema file: `apps/api/src/db/schema/users.ts`

---

#### `servers`

A "study server" — the top-level community container.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `name` | `text` NOT NULL | |
| `description` | `text` | |
| `icon_url` | `text` | Railway Buckets URL |
| `owner_id` | `uuid` NOT NULL → `users.id` | Server owner; protected by owner-safeguard logic at app layer |
| `invite_code` | `text` UNIQUE | Default invite slug; regeneratable |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `UNIQUE (invite_code)`, `INDEX (owner_id)`.

Drizzle schema file: `apps/api/src/db/schema/servers.ts`

---

#### `server_members`

Many-to-many join between users and servers. Carries the member's active role.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `server_id` | `uuid` NOT NULL → `servers.id` ON DELETE CASCADE | |
| `user_id` | `uuid` NOT NULL → `users.id` ON DELETE CASCADE | |
| `role_id` | `uuid` → `roles.id` | NULL = implicit `@everyone` role |
| `nickname` | `text` | Per-server display name override |
| `joined_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `banned` | `boolean` NOT NULL DEFAULT `false` | Soft ban flag |
| `banned_at` | `timestamptz` | |

Indexes: `UNIQUE (server_id, user_id)`, `INDEX (server_id, banned)` for membership lookups, `INDEX (user_id)` for "servers I'm in" queries.

Hot path: membership check on every message send and channel permission gate — keep this index tight.

Drizzle schema file: `apps/api/src/db/schema/server-members.ts`

---

#### `channels`

Text or voice channels within a server. Categories are represented as channels with `type = 'category'` and no messages.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `server_id` | `uuid` NOT NULL → `servers.id` ON DELETE CASCADE | |
| `parent_id` | `uuid` → `channels.id` | Category parent; null = top-level |
| `name` | `text` NOT NULL | |
| `type` | `text` NOT NULL DEFAULT `'text'` | enum: `text` / `voice` / `category` |
| `topic` | `text` | Channel description |
| `position` | `integer` NOT NULL DEFAULT `0` | Sort order within category/server |
| `is_private` | `boolean` NOT NULL DEFAULT `false` | Private channels require explicit permission override |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `INDEX (server_id, position)` for ordered channel list, `INDEX (parent_id)` for category tree walk.

Drizzle schema file: `apps/api/src/db/schema/channels.ts`

---

#### `messages`

Core message store. Supports threading (replies), soft-delete, and edit history via in-place mutation + `edited_at`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `channel_id` | `uuid` NOT NULL → `channels.id` ON DELETE CASCADE | |
| `author_id` | `uuid` NOT NULL → `users.id` | Retained on soft-delete; author data denormalized into snapshot (see below) |
| `thread_parent_id` | `uuid` → `messages.id` | NULL = top-level message; set = reply in thread |
| `content` | `text` | Nullable when message is attachment-only |
| `content_snapshot` | `jsonb` | Snapshot of `{authorDisplayName, authorAvatarUrl}` at send time — prevents tombstones when user deletes account |
| `is_edited` | `boolean` NOT NULL DEFAULT `false` | |
| `edited_at` | `timestamptz` | |
| `is_deleted` | `boolean` NOT NULL DEFAULT `false` | Soft-delete: content replaced by `[deleted]` at query layer; row retained |
| `deleted_at` | `timestamptz` | |
| `idempotency_key` | `text` UNIQUE | Client-assigned UUID from outbox; prevents duplicate inserts on flush |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes:
- `INDEX (channel_id, created_at DESC)` — primary message history hot path (paginated by cursor)
- `INDEX (thread_parent_id, created_at ASC)` — thread reply list
- `UNIQUE (idempotency_key)` — outbox flush deduplication

Hot path note: `channel_id + created_at DESC` is the single highest-frequency read in the application. Keep this index and avoid any filter that breaks index-only scans on it (e.g., no `WHERE is_deleted = false` unless partial index is added).

Drizzle schema file: `apps/api/src/db/schema/messages.ts`

---

#### `attachments`

File metadata for message attachments (and avatars, which go through `users.avatar_url` instead). One message can have multiple attachments.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `message_id` | `uuid` NOT NULL → `messages.id` ON DELETE CASCADE | |
| `uploader_id` | `uuid` NOT NULL → `users.id` | |
| `storage_key` | `text` NOT NULL | Railway Buckets object key |
| `public_url` | `text` NOT NULL | CDN-served URL |
| `filename` | `text` NOT NULL | Original filename |
| `content_type` | `text` NOT NULL | MIME type |
| `size_bytes` | `bigint` NOT NULL | |
| `width` | `integer` | For images |
| `height` | `integer` | For images |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `INDEX (message_id)`.

Drizzle schema file: `apps/api/src/db/schema/attachments.ts`

---

#### `reactions`

Per-user emoji reactions on messages.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `message_id` | `uuid` NOT NULL → `messages.id` ON DELETE CASCADE | |
| `user_id` | `uuid` NOT NULL → `users.id` ON DELETE CASCADE | |
| `emoji` | `text` NOT NULL | Unicode emoji or custom slug |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `UNIQUE (message_id, user_id, emoji)` — one reaction per user per emoji per message, `INDEX (message_id)` for reaction summary aggregation.

Drizzle schema file: `apps/api/src/db/schema/reactions.ts`

---

#### `roles`

Named roles within a server. Each server always has a synthetic `@everyone` role at the app layer; stored roles supplement it.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `server_id` | `uuid` NOT NULL → `servers.id` ON DELETE CASCADE | |
| `name` | `text` NOT NULL | |
| `color` | `text` | Hex color for role badge |
| `position` | `integer` NOT NULL DEFAULT `0` | Higher position = higher precedence |
| `is_owner_role` | `boolean` NOT NULL DEFAULT `false` | Owner role; protected from deletion |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `INDEX (server_id, position DESC)`.

Drizzle schema file: `apps/api/src/db/schema/roles.ts`

---

#### `permissions`

Channel-level permission overrides for a role. Absence of a row = inherit server default. Permissions are modeled as an allow/deny bitmask or discrete columns (chosen at B-block; likely discrete boolean columns for readability at MVP scale).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `channel_id` | `uuid` NOT NULL → `channels.id` ON DELETE CASCADE | |
| `role_id` | `uuid` NOT NULL → `roles.id` ON DELETE CASCADE | |
| `can_view` | `boolean` | NULL = inherit |
| `can_send` | `boolean` | NULL = inherit |
| `can_manage` | `boolean` | NULL = inherit — edit/delete others' messages, pins |
| `can_attach` | `boolean` | NULL = inherit |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `UNIQUE (channel_id, role_id)`, `INDEX (channel_id)` for permission resolution sweep.

Drizzle schema file: `apps/api/src/db/schema/permissions.ts`

---

#### `invites`

Invite links to servers. Separate from `servers.invite_code` (which is the permanent default link); this table holds time-limited or use-limited ad-hoc invites.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `code` | `text` NOT NULL UNIQUE | URL slug |
| `server_id` | `uuid` NOT NULL → `servers.id` ON DELETE CASCADE | |
| `creator_id` | `uuid` NOT NULL → `users.id` | |
| `max_uses` | `integer` | NULL = unlimited |
| `use_count` | `integer` NOT NULL DEFAULT `0` | |
| `expires_at` | `timestamptz` | NULL = never expires |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `UNIQUE (code)`, `INDEX (server_id)`.

Drizzle schema file: `apps/api/src/db/schema/invites.ts`

---

#### `assignments`

Assignments posted by server admins/instructors into an assignments channel or panel. Light academic tooling (feature 15); no grading.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `server_id` | `uuid` NOT NULL → `servers.id` ON DELETE CASCADE | |
| `channel_id` | `uuid` → `channels.id` | Optional — assignment pinned to a channel |
| `creator_id` | `uuid` NOT NULL → `users.id` | |
| `title` | `text` NOT NULL | |
| `description` | `text` | |
| `due_at` | `timestamptz` | |
| `is_deleted` | `boolean` NOT NULL DEFAULT `false` | Soft-delete |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `INDEX (server_id, due_at ASC)` for assignment list sorted by due date, `INDEX (creator_id)`.

Drizzle schema file: `apps/api/src/db/schema/assignments.ts`

---

#### `assignment_status`

Per-student tracking row for an assignment. Created lazily on first interaction (to-do) or on assignment creation for all current members — chosen at B-block.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `assignment_id` | `uuid` NOT NULL → `assignments.id` ON DELETE CASCADE | |
| `user_id` | `uuid` NOT NULL → `users.id` ON DELETE CASCADE | |
| `status` | `text` NOT NULL DEFAULT `'todo'` | enum: `todo` / `done` |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `UNIQUE (assignment_id, user_id)`, `INDEX (user_id, status)` for "my assignments" query.

Drizzle schema file: `apps/api/src/db/schema/assignment-status.ts`

---

#### `notifications`

Persistent notification records — mentions, assignment reminders. In-app notifications (read/unread); push dispatch is handled at the application layer (feature 14).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `recipient_id` | `uuid` NOT NULL → `users.id` ON DELETE CASCADE | |
| `type` | `text` NOT NULL | enum: `mention` / `reply` / `assignment_reminder` / `invite` |
| `reference_id` | `uuid` | ID of the referenced entity (message, assignment, invite) |
| `reference_type` | `text` | enum: `message` / `assignment` / `invite` |
| `server_id` | `uuid` → `servers.id` | For navigation context |
| `channel_id` | `uuid` → `channels.id` | For navigation context |
| `body_snapshot` | `jsonb` | Denormalized preview text at notification-send time |
| `is_read` | `boolean` NOT NULL DEFAULT `false` | |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `INDEX (recipient_id, is_read, created_at DESC)` — primary unread-count and notification list hot path.

Drizzle schema file: `apps/api/src/db/schema/notifications.ts`

---

### SuperTokens tables (opaque)

SuperTokens manages its own schema on its Railway Postgres service. The `users.id` FK in all StudyHall tables maps to SuperTokens' `user_id`. StudyHall code never reads or writes SuperTokens tables directly.

---

## Client-side IndexedDB store

The IndexedDB store is the offline-first wedge (feature 12, flow F5). It is a second data store — not a mirror, not a cache-only layer — and has its own schema that must be maintained in sync with the Postgres schema for the subset of entities it stores. Any B-block wave touching `messages`, `channels`, or `server_members` must evaluate whether the IndexedDB object store schemas need a corresponding update.

### Object stores

| Object store | Key | Contents | Purpose |
|---|---|---|---|
| `channels` | `id` | `{id, server_id, name, type, position, is_private}` | Channel list for sidebar (readable offline) |
| `messages` | `id` | `{id, channel_id, author_id, content, content_snapshot, thread_parent_id, is_edited, is_deleted, created_at, attachments[]}` | Recent message history per channel |
| `outbox` | `idempotency_key` | `{idempotency_key, channel_id, content, attachments[], state, created_at, retry_count}` | Pending sends queued while offline |
| `server_members` | composite `[server_id, user_id]` | `{server_id, user_id, display_name, avatar_url, role_id}` | Membership + display info for mentions and member list |
| `servers` | `id` | `{id, name, icon_url}` | Server list for rail navigation |

### Retention policy (IndexedDB)

- `messages`: retain last 200 messages per channel (LRU eviction keyed on `created_at`). Older messages require a server round-trip.
- `channels`, `servers`, `server_members`: full set for joined servers; evicted on server leave.
- `outbox`: retained until successfully flushed to server and ACKed; max age 7 days after which stale entries are surfaced as failed sends in the UI.

### Outbox message states

```
pending → flushing → acked
                  └→ failed (transient — retry with backoff)
                  └→ rejected (server returned 4xx — surface error, clear entry)
```

`idempotency_key` is a client-generated UUIDv4 written into both the outbox row and the `messages.idempotency_key` column on the server. On flush, the server performs an `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING` and returns the canonical row. This prevents duplicate messages from network retries.

### Reconciliation contract (reconnect)

When the Socket.IO connection transitions from `disconnected` to `connected`, the sync engine executes the following sequence:

1. **Outbox flush** — iterate `outbox` where `state IN ('pending', 'failed')`, ordered by `created_at ASC`. POST each to `/api/messages` with `idempotency_key`. Mark `flushing`; on 2xx → `acked`; on 409 (already exists) → `acked`; on 4xx → `rejected`; on 5xx / network → `failed` (retry with exponential backoff, max 3 retries before surfacing error).

2. **Message catch-up** — for each channel with a cached `messages` entry, call `GET /api/channels/:id/messages?after=<last_seen_created_at>`. Merge new rows into IndexedDB. Server returns at most 50 rows per call; if `has_more=true`, the UI shows a "load more" affordance but does not auto-fetch (avoids burst on reconnect with many channels).

3. **Membership + channel refresh** — fetch current channel list and member list for each server; diff against IndexedDB and apply upserts.

4. **Notification count refresh** — fetch unread notification count from `/api/notifications/unread-count`.

Steps 1 and 2 are sequential (flush before reading, to avoid seeing your own messages as missing). Steps 3 and 4 are parallel with step 2 after step 1 completes.

**Conflict resolution policy (MVP):** last-write-wins on the server for message content. The client never overwrites a server-side message body. Edited messages received during reconciliation replace the local copy in full. This is intentionally simple for self-use-mvp; H3 feature 26 deepens conflict handling.

---

## Conventions

### Drizzle schema organization

- One file per table: `apps/api/src/db/schema/<table>.ts`
- All schema files re-exported from `apps/api/src/db/schema/index.ts`
- Relations defined in a co-located `<table>.relations.ts` or at the bottom of the schema file (team choice at B-block; one convention, never mixed)
- Drizzle config at `apps/api/drizzle.config.ts`; migrations output to `apps/api/src/db/migrations/`

### Naming

- Tables: lowercase `snake_case` plural (`messages`, `server_members`)
- Columns: lowercase `snake_case`
- Indexes: `idx_<table>_<columns>` (Drizzle auto-names; override only when the default is ambiguous)
- Foreign keys: `<referenced_table_singular>_id` pattern (e.g., `channel_id`, `author_id`)

### Timestamps

- All tables carry `created_at timestamptz NOT NULL DEFAULT now()`
- Mutable tables add `updated_at timestamptz NOT NULL DEFAULT now()`; maintained by application layer (Drizzle query) not a DB trigger, to keep migrations portable
- No timezone conversion at the DB layer — all timestamps stored as UTC, converted at the client

### Soft deletes

- `messages` and `assignments` use `is_deleted boolean NOT NULL DEFAULT false` + `deleted_at`
- Deleted message content is replaced with `[deleted]` at the query/serialization layer; the row is retained for thread integrity and reaction counts
- Hard delete is not supported at MVP; H2 compliance work (feature 24) will add a data-deletion pipeline

### UUIDs

- All PKs use `gen_random_uuid()` (Postgres 13+ built-in, available on Railway)
- No sequential integer PKs — avoids enumeration attacks and simplifies distributed outbox key generation on the client

---

## Reusability principles

1. **Schema boundary = module boundary.** Each NestJS module owns exactly the Drizzle schema files for its tables. The messaging module owns `messages` and `attachments`; the RBAC module owns `roles` and `permissions`; the server module owns `servers`, `server_members`, and `channels`. Cross-module reads go through the owning module's service, never a direct cross-module Drizzle import.

2. **IndexedDB shape mirrors the API response shape, not the DB row shape.** The client store caches the serialized API response (e.g., `MessageDto`), not raw DB columns. This means schema changes require a DTO update before an IndexedDB shape update — the DTO is the contract surface.

3. **Idempotency keys are the client's responsibility.** The server's `ON CONFLICT DO NOTHING` on `messages.idempotency_key` is the dedup guarantee. Any client feature that sends a message (online path, outbox flush, retry) MUST generate and attach an idempotency key.

4. **Hot-path indexes are declared in the schema file, not added ad-hoc.** The indexes listed in the Inventory above are the initial set; adding a new index requires a migration (never a manual `CREATE INDEX` on Railway) and a comment in the schema file explaining the query it serves.

5. **Pagination is cursor-based (`created_at` + `id`) for all message queries.** Offset pagination is forbidden on `messages` — the table will grow unboundedly. Cursor shape: `?before=<ISO-timestamp>&before_id=<uuid>` (composite cursor handles same-millisecond ties).

---

## Cross-references

| Topic | File |
|-------|------|
| Stack decisions (locked) | `command-center/dev/stack-decisions.md` |
| Feature list (feature numbers referenced above) | `command-center/product/feature-list.md` |
| Module inventory | `command-center/product/tools-modules-map.md` |
| User journey map (routes + flows) | `command-center/artifacts/user-journey-map.md` |
| Founder stage | `command-center/product/founder-stage.md` |
| Offline sync engine module | `command-center/product/tools-modules-map.md` § "Offline sync engine" |
| Build principles (code conventions) | `command-center/principles/BUILD-PRINCIPLES.md` |

---

## Stack-specific decisions

### Drizzle Kit migrations

- **Migration strategy:** `drizzle-kit generate` produces SQL migration files committed to the repo. Applied via `drizzle-kit migrate` in CI (after `build`) and at Railway deploy via a pre-deploy command. No auto-migration at server startup.
- **Migration files:** committed under `apps/api/src/db/migrations/`. Numbered sequentially by Drizzle Kit; never hand-edited after generation.
- **Zero-downtime approach (MVP):** Railway restarts are brief and the app is single-instance at self-use-mvp stage; full zero-downtime migration patterns (shadow columns, multi-phase) are deferred until team-scale or H2 paid tiers introduce significant traffic.
- **Rollback:** Drizzle Kit does not auto-generate rollback migrations. For MVP, rollback is a new forward migration that reverts the change. The migration history is the source of truth; no manual schema edits on Railway Postgres.

### Railway Postgres backups

- **Automated backups:** Railway managed Postgres includes daily automated backups (retained 7 days on free/hobby tier; verify retention on the founder's plan at first deploy — upgrade if < 7 days).
- **Point-in-time recovery (PITR):** available on Railway Pro plan. Not configured at self-use-mvp stage; flag for upgrade when the app has external users (first class cohort onboarding).
- **Backup testing:** manual restore test before onboarding the first external cohort. Document the restore procedure in the runbook at that point.
- **RPO/RTO (self-use-mvp):** RPO ~24h (daily backup cadence); RTO ~1h (Railway restore workflow). Acceptable for solo founder stage; tighten to RPO <5 min / RTO <1h when external users arrive.

### Data retention

- **Messages:** retained indefinitely (soft-delete only). No automated purge at MVP.
- **Notifications:** retain 90 days; cron job (or manual sweep) added at H2.
- **Assignment status:** retained for audit; no TTL.
- **Outbox (IndexedDB):** 7-day max age for unacknowledged entries; surfaced as UI error, not silently dropped.

### Seed data entry-point

Seed entry-point: `apps/api/src/db/seed.ts` (Drizzle).

This file is **not authored now**. It will be generated during the relevant B-block stage from the v3 personas and the module list. The seed MUST be in place before `pnpm dev` validation at T-5, as the test fixture users and servers are required to exercise the messaging, membership, and assignment flows without manual setup. The seed script runs via `pnpm db:seed` (command added to `package.json` at that B-block stage).

---

## Risk / open items

| # | Risk | Severity | Mitigation / resolution point |
|---|------|----------|-------------------------------|
| 1 | IndexedDB schema version mismatch after a Drizzle migration changes the DTO shape | High | IndexedDB versioned migrations (Dexie `version().stores()` or manual `onupgradeneeded`) must be authored alongside every DTO change that affects a cached entity. Enforce at B-block code review. |
| 2 | Outbox flush ordering: a flush during an active Socket.IO session could race with real-time delivery, producing out-of-order messages in the UI | Medium | Server assigns canonical `created_at` at insert time; client sorts all message lists by server `created_at`, not insertion order. Idempotency key prevents duplicates. |
| 3 | `messages` table growth — no archival or partitioning strategy at MVP | Medium | Postgres table will grow linearly with usage. At self-use-mvp scale this is fine. Flag for range partitioning by `created_at` (monthly) when approaching 10M rows or if query latency degrades. |
| 4 | SuperTokens user deletion leaves orphan `users` rows | Low | Add a SuperTokens post-delete webhook that triggers `DELETE FROM users WHERE id = $user_id` (cascades to all FK children). Implement before first external cohort. |
| 5 | Railway Postgres backup retention on hobby/free plan may be < 7 days | Medium | Verify at first deploy. Upgrade to Pro plan or add pg_dump export to Railway Buckets as a belt-and-suspenders backup if retention is insufficient. |
| 6 | Offline sync library not yet locked (Dexie + custom vs. sync engine) | Medium | Deferred to v6 per `stack-decisions.md`. The reconciliation contract above is library-agnostic and must be preserved regardless of library choice. The B-block stage implementing feature 12 locks the library. |
| 7 | `permissions` table uses nullable booleans for inherit semantics — can be confusing | Low | Document the three-value logic clearly in the schema file. Revisit with a proper enum (`allow` / `deny` / `inherit`) at first permissions bug. |
