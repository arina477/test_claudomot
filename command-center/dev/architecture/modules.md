# Architecture Branch: Modules / Reusable Elements

branch: modules
version: v6
status: draft
last_updated: 2026-06-26
authors: v6 architecture pass

---

## Summary

StudyHall is a dark-themed desktop communication app (Discord-shaped, academically wedged) delivered as an installable PWA backed by NestJS + Postgres, with Socket.IO realtime and LiveKit voice/video. The defining architectural constraint is **offline-first reliability**: the app must remain readable and writable without a network connection, and must reconcile local edits to server state on reconnect without user intervention or data loss. Every module below is sized and contracted with that constraint in mind.

This branch catalogs every reusable module — backend (NestJS) and frontend (React SPA) — with explicit input/output contracts, horizon classification (MVP vs H2/H3), and cross-references to the services, databases, SDKs, and security concerns each module touches. It is the primary input to the services branch and the locked source for `module-list.md`.

Horizon key:
- **MVP** — required for a usable self-use-mvp (H1, features 1–16)
- **H2** — medium-term feature horizon
- **H3** — moat / long-term

---

## Inventory

### Backend Modules (NestJS)

Each NestJS module exposes a controller (REST), a service (business logic), and optional Socket.IO event handlers. Shared Zod schemas in `@studyhall/shared` bridge to NestJS DTOs via `@anatine/zod-nestjs`; every input type is validated at the transport boundary before it reaches service logic.

---

#### 1. Auth Module — MVP

**Purpose:** Account lifecycle — signup, login, email verification, session issuance, token refresh, logout. Wraps SuperTokens Core (self-hosted on Railway) via the SuperTokens Node.js SDK. Exposes NestJS guards consumed by every other module.

**Inputs:**
- `POST /auth/signup` — `{ email, password }` → validates against `SignupSchema` (Zod, shared)
- `POST /auth/login` — `{ email, password }`
- `POST /auth/verify-email` — `{ token }` (email link)
- `POST /auth/refresh` — cookie-carried refresh token
- `POST /auth/logout` — access token in Authorization header
- `POST /auth/forgot-password` / `POST /auth/reset-password/:token`

**Outputs:**
- HTTP 200 + Set-Cookie (access + refresh tokens, HttpOnly, Secure, SameSite=Strict)
- `AuthGuard` (NestJS guard, applied globally or per-route)
- `CurrentUser` decorator — injects `{ userId, email, sessionId }` into route handlers
- Emits internal event `user.verified` consumed by Notification Module

**State owned:** Session store in SuperTokens Core (Postgres-backed). No app-level session table — all session state lives in SuperTokens.

**Security surface:** Password hashing via SuperTokens (bcrypt). JWT access tokens, short-lived (15 min). Refresh token rotation on each use. Rate-limiting on login/signup applied at module level (NestJS throttler). CSRF token for cookie-based auth.

**Feature coverage:** F1 (1, 16)

---

#### 2. User / Profile Module — MVP

**Purpose:** User identity beyond auth — display name, username, avatar, theme color, profile visibility. CRUD for the `users` and `profiles` tables.

**Inputs:**
- `GET /users/me` → returns own profile
- `PATCH /users/me/profile` — `{ displayName?, username?, avatarUrl?, color? }`
- `GET /users/:id/profile` — public profile (respects visibility setting from Privacy Controls)
- Internal: `createUser({ userId, email })` — called by Auth Module on signup completion

**Outputs:**
- `UserProfileDto` — `{ id, username, displayName, avatarUrl, color, createdAt }`
- `UserSummaryDto` — `{ id, username, displayName, avatarUrl }` (embedded in messages, member lists)
- Internal: `getUserById(id): UserSummaryDto` — consumed by Messaging, Member, Notification modules

**State owned:** `users` table (id, email, created_at, updated_at), `profiles` table (user_id FK, display_name, username, avatar_url, color, visibility_setting).

**Feature coverage:** F1 (2, 16)

---

#### 3. Server + Membership Module — MVP

**Purpose:** Study-server CRUD (create, read, update, delete), member join/leave, member listing. A "server" is the top-level grouping concept (equiv. to a Discord guild). Membership rows join users to servers with a role assignment.

**Inputs:**
- `POST /servers` — `{ name, icon?, templateId? }` (owner creates)
- `GET /servers/:id` — server metadata + channel list (member-only)
- `PATCH /servers/:id` — `{ name?, icon? }` (owner/admin only — RBAC check)
- `DELETE /servers/:id` — owner only, cascades channels + membership
- `GET /servers/:id/members` — paginated member roster
- `POST /servers/:id/members/:userId/kick` — remove member (RBAC)
- `POST /servers/:id/members/:userId/ban` — ban member (RBAC)
- Internal: `joinServer({ serverId, userId, roleId })` — called by Invite Module on code redemption

**Outputs:**
- `ServerDto` — `{ id, name, iconUrl, ownerId, createdAt, channelCount, memberCount }`
- `MemberDto` — `{ userId, serverId, roleId, joinedAt, UserSummaryDto }`
- Internal: `isMember(userId, serverId): boolean` — consumed by messaging guards
- Internal: `getServerMembers(serverId): MemberDto[]` — consumed by Presence + Notification

**State owned:** `servers` table, `server_members` table (user_id, server_id, role_id FK, joined_at, banned_at).

**Feature coverage:** F7, F2, F8 (5, 6, 11)

---

#### 4. Channel Management Module — MVP

**Purpose:** Channel and category CRUD within a server. Channels carry a type (text | voice) and an ordered position within a category. Consumed by messaging and voice-room routing.

**Inputs:**
- `POST /servers/:id/channels` — `{ name, type, categoryId?, position? }` (RBAC: manage_channels)
- `PATCH /servers/:id/channels/:channelId` — `{ name?, topic?, position? }`
- `DELETE /servers/:id/channels/:channelId`
- `POST /servers/:id/categories` — `{ name, position? }`
- `PATCH /servers/:id/categories/:catId`
- `DELETE /servers/:id/categories/:catId`
- `GET /servers/:id/channels` — ordered channel+category tree (cached, invalidated on mutation)

**Outputs:**
- `ChannelDto` — `{ id, serverId, name, type, categoryId, position, topic?, slowModeSeconds? }`
- `ChannelTreeDto` — nested `{ categories: [{ id, name, channels: ChannelDto[] }] }`
- Internal: `getChannel(id): ChannelDto` — consumed by Messaging, RBAC, Voice routing

**State owned:** `channels` table (id, server_id FK, category_id FK, name, type enum, position, topic, slow_mode_seconds), `categories` table.

**Feature coverage:** F7 (5, 7)

---

#### 5. Messaging Service — MVP

**Purpose:** Message persistence, retrieval, fan-out, threading, reactions, edits, deletes, mentions. The core text-channel data plane. Works in concert with the Offline Sync Engine (client) and Socket.IO namespace (server).

**Inputs:**
- `POST /channels/:id/messages` — `{ content, attachments?, replyToId? }` + auth (also consumed via Socket.IO `message:send` event for lower-latency path)
- `GET /channels/:id/messages` — paginated history (`cursor`, `limit`; before/after cursor) — used for initial load and offline catch-up
- `PATCH /channels/:id/messages/:msgId` — `{ content }` (author only)
- `DELETE /channels/:id/messages/:msgId` — author or RBAC `manage_messages`
- `POST /channels/:id/messages/:msgId/reactions` — `{ emoji }`
- `DELETE /channels/:id/messages/:msgId/reactions/:emoji`
- Socket.IO inbound: `message:send`, `message:edit`, `message:delete`, `message:react`

**Outputs:**
- `MessageDto` — `{ id, channelId, authorId, content, attachments[], replyToId?, reactions{}, editedAt?, deletedAt?, createdAt, nonce? }`
- Socket.IO outbound: `message:new`, `message:updated`, `message:deleted`, `message:reaction` — fanned out to all online channel members via namespace room
- Pagination envelope: `{ items: MessageDto[], nextCursor, prevCursor, hasMore }`
- Internal: emits `message:mention` event to Notification Module when `@username` parsed in content

**State owned:** `messages` table (id, channel_id FK, author_id FK, content, reply_to_id self-FK, edited_at, deleted_at, created_at, nonce), `message_attachments` table, `message_reactions` table (message_id, user_id, emoji — composite PK).

**Offline contract:** Accepts `nonce` field on inbound — idempotency key from client outbox. Server deduplicates by `(channel_id, author_id, nonce)`. Returns the persisted `MessageDto` with server-assigned `id` and `createdAt`; client replaces optimistic row by nonce.

**Feature coverage:** F3 (7, 8, 9, 12)

---

#### 6. Presence Service — MVP

**Purpose:** Track online/away/offline status per user per server, typing indicators per channel, voice-room occupancy. Served over Socket.IO; not persisted to Postgres (ephemeral in-process map, or Redis when fan-out scales — see Risk).

**Inputs:**
- Socket.IO `presence:connect` — on authenticated socket join, user is marked online for all their servers
- Socket.IO `typing:start` / `typing:stop` — `{ channelId }`
- Socket.IO `presence:disconnect` — on socket disconnect (or TTL expiry)
- Internal: `markInVoiceRoom(userId, channelId)` / `markLeftVoiceRoom(userId, channelId)` — called by Voice module

**Outputs:**
- Socket.IO outbound: `presence:update` — `{ userId, status, serverId }` — broadcast to server members
- Socket.IO outbound: `typing:update` — `{ userId, channelId, isTyping }` — broadcast to channel members
- Internal: `getPresenceMap(serverId): Map<userId, 'online'|'away'|'offline'>` — consumed by Member List UI hydration on connect
- Internal: `getVoiceRoomOccupancy(channelId): userId[]`

**State owned:** In-process ephemeral map only. No Postgres table. TTL: presence entry expires 30s after last heartbeat.

**Scaling note:** In-process map breaks across multiple NestJS instances. When Railway scales to >1 pod, presence state must migrate to Redis pub/sub. Flagged as Risk #1 below.

**Feature coverage:** F3, F4 (7, 13)

---

#### 7. RBAC Module — MVP

**Purpose:** Role definitions, permission assignment, and enforcement. Roles are server-scoped. Permissions are channel-level overrides on top of role defaults. Exposes a `PermissionGuard` NestJS guard used by Messaging, Channel, Member, and Assignment modules.

**Inputs:**
- `POST /servers/:id/roles` — `{ name, color, permissions: PermissionSet }` (owner/admin)
- `PATCH /servers/:id/roles/:roleId`
- `DELETE /servers/:id/roles/:roleId`
- `POST /servers/:id/members/:userId/roles` — assign role
- `DELETE /servers/:id/members/:userId/roles/:roleId`
- `PATCH /channels/:id/permissions` — per-channel role overrides
- Internal: `can(userId, permission, context): boolean` — the core check; context is `{ serverId, channelId? }`

**Outputs:**
- `RoleDto` — `{ id, serverId, name, color, permissions: PermissionSet, isDefault }`
- `PermissionSet` — bitmask or named-key map: `{ read_messages, send_messages, manage_messages, manage_channels, manage_roles, kick_members, ban_members, manage_server }`
- `PermissionGuard` — NestJS guard, requires `@RequirePermission(perm)` decorator; throws 403 on fail
- Internal: `getEffectivePermissions(userId, channelId): PermissionSet`

**State owned:** `roles` table (id, server_id FK, name, color, permissions_bitfield, is_default, position), `role_assignments` table (user_id, server_id, role_id — composite PK), `channel_permission_overrides` table (channel_id, role_id, allow_bitfield, deny_bitfield).

**Owner safeguard:** The server owner's userId is always resolved to full permissions regardless of role assignment; cannot be kicked or demoted by anyone.

**Feature coverage:** F8 (10, 11)

---

#### 8. Offline Sync Engine (Server Side) — MVP

**Purpose:** Server-side counterpart to the client Offline Sync Engine. Accepts outbox flush payloads from reconnecting clients, deduplicates via nonce, reconciles ordering, and returns a catch-up delta. This is a first-class module, not glue code — it is the wedge's server half.

**Inputs:**
- `POST /sync/outbox` — `{ messages: OutboxEntryDto[] }` where `OutboxEntryDto = { channelId, content, attachments[], replyToId?, nonce, clientTimestamp }`
- `GET /sync/catchup` — `{ channelId, since: ISOTimestamp, limit }` — returns messages the client missed while offline
- Socket.IO `sync:outbox_flush` — same payload as HTTP POST (used on reconnect for lower latency)

**Outputs:**
- `POST /sync/outbox` response: `{ accepted: [{ nonce, serverId, serverTimestamp }], rejected: [{ nonce, reason }] }`
- `GET /sync/catchup` response: `{ messages: MessageDto[], nextCursor }` — ordered by server timestamp
- Socket.IO outbound: `sync:ack` — per-message ack `{ nonce, serverId, serverTimestamp }` after dedup+persist

**Deduplication contract:** On receiving an outbox entry, server checks `(channel_id, author_id, nonce)` uniqueness against the `messages` table (nonce column, indexed). Duplicates return an ack with the existing `serverId` — client merges silently. Nonces are UUIDs generated by the client at compose time.

**Ordering:** Server timestamp wins for display order. Client may show optimistic messages with a local `clientTimestamp` until the ack arrives; after ack, the row is updated with `serverTimestamp` and the optimistic indicator removed.

**Conflict policy (MVP):** Last-write-wins by server receipt order. No three-way merge. Conflict UI deferred to H3.

**Feature coverage:** F5 (12)

---

#### 9. Invite System — MVP

**Purpose:** Invite link generation, validation, expiry, max-uses tracking, and preview (pre-auth server info). Links are the primary server onboarding path.

**Inputs:**
- `POST /invites` — `{ serverId, maxUses?, expiresIn? }` (RBAC: create_invite) → creates invite record
- `GET /invites/:code` — public (no auth required) → returns server preview + validity
- `POST /invites/:code/redeem` — authed → calls `Server+Membership.joinServer`; enforces max-uses and expiry
- `GET /servers/:id/invites` — list active invites (RBAC: manage_server)
- `DELETE /invites/:code` — revoke (RBAC: manage_server)

**Outputs:**
- `InviteDto` — `{ code, serverId, creatorId, maxUses, usesCount, expiresAt, isValid }`
- `InvitePreviewDto` — `{ code, server: { name, iconUrl, memberCount }, isValid, expiredReason? }` (public, no auth)
- Internal: `redeemInvite(code, userId)` — returns `{ serverId }` on success; throws on invalid/expired/banned

**State owned:** `invites` table (code PK, server_id FK, creator_id FK, max_uses, uses_count, expires_at, created_at).

**Feature coverage:** F2, F8 (6, 11)

---

#### 10. Notification Module — MVP

**Purpose:** Dispatch in-app notifications (mentions, assignment reminders) and transactional email (verify, invite). Consumes events from Messaging and Assignment modules; fan-out over Socket.IO for in-app; Resend (transactional email) for email notifications.

**Inputs:**
- Internal event `message:mention` — `{ mentionedUserId, messageId, channelId, serverId }`
- Internal event `user.verified` — from Auth on email confirm (used to trigger welcome)
- Internal event `assignment:due_soon` — from Assignment cron job
- `GET /notifications` — paginated notification history for current user
- `POST /notifications/:id/read` — mark read
- `POST /notifications/read-all`

**Outputs:**
- Socket.IO outbound: `notification:new` — `{ id, type, payload, createdAt }` — to the mentioned/notified user's socket
- `NotificationDto` — `{ id, userId, type: 'mention'|'assignment_reminder'|'system', payload: object, readAt, createdAt }`
- Transactional email via Resend SDK: invite email, verification email (HTML templates in `apps/api/src/notifications/templates/`)

**State owned:** `notifications` table (id, user_id FK, type, payload JSONB, read_at, created_at).

**Feature coverage:** F3, F6 (14)

---

#### 11. File Upload Module — MVP

**Purpose:** Pre-signed upload URL generation for Railway Buckets (S3-compatible, Tigris-backed). Validates file type and size before issuing URL. Handles avatar uploads (profile) and message attachments.

**Inputs:**
- `POST /uploads/presign` — `{ filename, contentType, purpose: 'avatar'|'attachment', serverId? }` → returns pre-signed PUT URL
- `POST /uploads/confirm` — `{ uploadKey }` → validates that the object exists in bucket, returns canonical URL
- Internal: `getPresignedUrl(key, expiresIn): string` — consumed by Profile module for avatar display

**Outputs:**
- `PresignDto` — `{ uploadUrl, key, expiresAt }`
- `ConfirmDto` — `{ publicUrl }`
- Stored object URLs are persisted by the calling module (Profile saves to `profiles.avatar_url`; Messaging saves to `message_attachments.url`)

**Validation:** Content-type allowlist: `image/jpeg`, `image/png`, `image/gif`, `image/webp` for avatars; extended with `application/pdf`, `video/*` for attachments (configurable). Max sizes: 4 MB avatars, 25 MB attachments (MVP).

**State owned:** No dedicated table. Keys/URLs stored by consuming modules.

**Feature coverage:** F1, F3 (2, 9)

---

#### 12. Assignment Module (Light) — MVP

**Purpose:** Assignment CRUD, due-date tracking, and student-side status (to-do / done). Academic tooling wedge — intentionally light; no submission collection, no grading.

**Inputs:**
- `POST /servers/:id/assignments` — `{ title, description?, dueAt?, channelId? }` (RBAC: manage_assignments — educator/admin)
- `GET /servers/:id/assignments` — list, ordered by due date (member-visible)
- `PATCH /servers/:id/assignments/:asgId` — update (RBAC)
- `DELETE /servers/:id/assignments/:asgId` (RBAC)
- `POST /servers/:id/assignments/:asgId/status` — `{ status: 'todo'|'done' }` — per-user status toggle (any member)

**Outputs:**
- `AssignmentDto` — `{ id, serverId, title, description, dueAt, creatorId, createdAt }`
- `AssignmentStatusDto` — `{ assignmentId, userId, status, updatedAt }`
- Internal: fires event `assignment:due_soon` (cron, 24h before `dueAt`) → consumed by Notification Module

**State owned:** `assignments` table (id, server_id FK, creator_id FK, title, description, due_at, channel_id FK nullable, created_at), `assignment_statuses` table (assignment_id, user_id, status enum, updated_at — composite PK).

**Feature coverage:** F6, F9 (15)

---

#### 13. Privacy Controls Module — MVP

**Purpose:** User-configurable privacy settings — profile visibility, who-can-DM (H2), account data access. Read by User Profile and (future) DM module.

**Inputs:**
- `GET /settings/privacy` — returns current settings for authed user
- `PATCH /settings/privacy` — `{ profileVisibility: 'everyone'|'server_members'|'nobody', whoCanDm?: '...' }`

**Outputs:**
- `PrivacySettingsDto` — `{ userId, profileVisibility, whoCanDm, updatedAt }`
- Internal: `getVisibility(userId): PrivacySettings` — consumed by User Profile module on `GET /users/:id/profile` to gate public access

**State owned:** `privacy_settings` table (user_id PK, profile_visibility enum, who_can_dm enum, updated_at).

**Feature coverage:** F1 (16)

---

### Frontend Modules (React SPA — Vite)

Frontend modules are organized as feature slices under `apps/web/src/features/<name>/`. Each slice owns its components, hooks, state, and Zod types. Shared primitives live in `apps/web/src/shared/`.

---

#### 14. Auth Context / Guards — MVP

**Purpose:** Global session state (current user, loading, error), login/logout actions, and route guards (PrivateRoute, PublicOnlyRoute). Wraps SuperTokens JS SDK.

**Inputs:** SuperTokens session on mount; `AuthContext` provider wraps the app root.
**Outputs:** `useAuth()` hook — `{ user, isAuthenticated, isLoading, login, logout }`; `<PrivateRoute>` / `<PublicOnlyRoute>` wrappers for React Router.

**Horizon:** MVP

---

#### 15. User Profile Feature — MVP

**Purpose:** Profile display and edit (display name, username, avatar upload, color picker). Consumes File Upload pre-sign flow.

**Inputs:** `useCurrentUser()`, `useUpdateProfile()` (React Query mutations).
**Outputs:** `<ProfileEditor>`, `<UserAvatar size>`, `<UserBadge>` (avatar + name inline, used in message list and member list).

**Horizon:** MVP

---

#### 16. Server Rail — MVP

**Purpose:** Left-side vertical icon rail listing joined servers. Click navigates to last-visited channel in that server. Shows unread badge per server. Houses "Add server" and "Direct messages" entry points (DMs stub in MVP).

**Inputs:** `useServerList()` — list of servers the current user belongs to (cached via React Query + IndexedDB layer).
**Outputs:** `<ServerRail>` — the leftmost column of the 3-pane shell.

**Horizon:** MVP

---

#### 17. Channel Sidebar — MVP

**Purpose:** Second pane — channel and category tree for the active server. Includes channel type icons, unread indicators, voice-room occupancy count. Server name header with settings link.

**Inputs:** `useChannelTree(serverId)`, `usePresence(serverId)`, active channel from router params.
**Outputs:** `<ChannelSidebar>`, `<ChannelItem>`, `<CategoryGroup>`.

**Horizon:** MVP

---

#### 18. Message List + Composer — MVP

**Purpose:** Core chat surface. Infinite-scroll message history (virtualized), optimistic message rendering, typing indicator, reply threading UI, reaction picker, edit/delete actions. Composer with markdown-lite, mention autocomplete, attachment upload trigger.

**Inputs:**
- `useMessages(channelId)` — paginated + cached + offline-readable
- `useSendMessage(channelId)` — writes to outbox first (offline sync), then Socket.IO
- `useTypingIndicator(channelId)`
- `usePresence(channelId)`

**Outputs:** `<MessageList>`, `<MessageItem>`, `<MessageComposer>`, `<ReactionPicker>`, `<ThreadPreview>`.

**Offline contract:** `useSendMessage` writes to the IndexedDB outbox before any network call. `<MessageItem>` accepts a `pending` flag rendered as muted/italic until server ack arrives. On reconnect, `useOfflineSync` drains the outbox; acked messages replace optimistic rows by nonce.

**Horizon:** MVP

---

#### 19. Member List — MVP

**Purpose:** Right-pane roster of server members. Groups by role. Shows presence indicator (online/away/offline dot). Clicking a member opens a profile popover.

**Inputs:** `useServerMembers(serverId)`, `usePresence(serverId)`.
**Outputs:** `<MemberList>`, `<MemberItem>`, `<ProfilePopover>`.

**Horizon:** MVP

---

#### 20. Voice-Room UI — MVP

**Purpose:** Voice/video study room surface. Grid of participant tiles (video or avatar fallback), mic/cam toggle controls, screen-share button, leave button. Wraps LiveKit React SDK (`@livekit/components-react`).

**Inputs:** LiveKit room token from `GET /rooms/:channelId/token`; `useVoiceRoom(channelId)` hook wraps `LiveKitRoom`.
**Outputs:** `<VoiceRoomView>`, `<ParticipantTile>`, `<RoomControls>`.

**Horizon:** MVP

---

#### 21. Offline Sync Engine (Client Side) — MVP

**Purpose:** The wedge's client half. Manages the IndexedDB cache (message history, channel metadata, server list), the outbox queue (unsent messages), reconnect reconciliation, and connection-state exposure. This is the most complex frontend module — it must be correct under all network transitions.

**Architecture:** Three-layer design:
1. **Cache layer** (`OfflineCache`) — IndexedDB store via Dexie. Stores: `messages`, `channels`, `servers`, `members`. Write-through on every inbound `message:new` Socket.IO event and every HTTP history page load. Readable synchronously from the UI even when offline.
2. **Outbox layer** (`OutboxQueue`) — IndexedDB store: `outbox_entries { id, channelId, content, attachments, replyToId, nonce, clientTimestamp, status: 'pending'|'flushing'|'acked'|'failed' }`. `useSendMessage` appends here before touching the network. On reconnect, `OutboxQueue.flush()` POSTs to `POST /sync/outbox` and marks entries `acked` or `failed` per server response.
3. **Reconciliation layer** (`SyncReconciler`) — on socket reconnect event: (a) flush outbox, (b) call `GET /sync/catchup?channelId=X&since=<lastSeenAt>` for each channel the user has open, (c) merge server delta into the cache (deduplicate by message id), (d) emit `sync:complete` event for the UI to refresh.

**Inputs:**
- Socket.IO connection state events (`connect`, `disconnect`, `reconnect`)
- `useSendMessage(channelId, content, ...)` — the compose API
- Background: `syncOnReconnect()` — triggered by socket `connect` event

**Outputs:**
- `useMessages(channelId)` — reads from IndexedDB cache; React Query invalidated after sync
- `useConnectionState()` — `'online'|'reconnecting'|'offline'` — consumed by Connection-State Indicator
- `useOutboxState(channelId)` — `{ pendingCount }` — consumed by Message Composer to show queue badge
- `syncOnReconnect(): Promise<SyncResult>` — called internally on reconnect

**Conflict resolution (MVP):** Server timestamp is authoritative for ordering. Outbox entries with `status: 'failed'` are surfaced in the UI as a "failed to send" banner with a retry action; no silent discard.

**Horizon:** MVP (H3 deepens to full-content sync + offline media + conflict UI per feature 26)

---

#### 22. Connection-State Indicator — MVP

**Purpose:** Persistent UI element showing current sync/connection state. Drives user trust in the offline-first promise.

**Inputs:** `useConnectionState()` from Offline Sync Engine.
**Outputs:** `<ConnectionStateBar>` — renders as a slim banner or status dot: "Connected", "Reconnecting… (N messages queued)", "Offline — reading from cache". Hidden when online + synced.

**Horizon:** MVP

---

#### 23. Notification Bell + Toast System — MVP

**Purpose:** In-app notification bell (badge count, dropdown list) + toast layer for ephemeral alerts (message send failure, server join success, etc.). Toasts are distinct from push notifications.

**Inputs:**
- Socket.IO `notification:new` events
- `useNotifications()` — React Query + IndexedDB cache of notification history

**Outputs:** `<NotificationBell>`, `<NotificationDropdown>`, `<Toast>` / `<ToastProvider>` (Radix UI primitives via shadcn/ui).

**Horizon:** MVP

---

#### 24. Invite Flow UI — MVP

**Purpose:** Invite preview page (`/invite/:code`) and invite-link generator modal inside server settings. Handles pre-auth preview, redirect-to-login, and post-auth auto-redeem.

**Inputs:** `useInvitePreview(code)`, `useRedeemInvite()`.
**Outputs:** `<InvitePreviewPage>`, `<InviteGeneratorModal>`.

**Horizon:** MVP

---

#### 25. Server Settings Shell — MVP

**Purpose:** Multi-tab settings surface for server owner/admin: Overview (name, icon), Channels, Roles, Members, Invites. Routes to `/servers/:id/settings`.

**Inputs:** RBAC-gated tab visibility via `usePermissions(serverId)`.
**Outputs:** `<ServerSettingsShell>`, `<SettingsNav>`, tab-specific sub-components (`<OverviewTab>`, `<RolesTab>`, `<MembersTab>`, `<InvitesTab>`).

**Horizon:** MVP

---

#### 26. Assignment Panel — MVP

**Purpose:** Assignment list for a server — sorted by due date, student-side to-do/done toggle, creator-side create/edit form. Rendered at `/servers/:id/assignments`.

**Inputs:** `useAssignments(serverId)`, `useAssignmentStatus(assignmentId)`, `useCreateAssignment()`.
**Outputs:** `<AssignmentPanel>`, `<AssignmentItem>`, `<AssignmentForm>`.

**Horizon:** MVP

---

#### 27. Design Tokens + Theme System — MVP

**Purpose:** Single source of truth for color, spacing, typography, radius, and shadow scales. Dark theme only at MVP. Tailwind config extends the token set; shadcn/ui components reference CSS variables aligned to the token scale.

**Inputs:** `design/DESIGN-SYSTEM.md` (once authored at D-block).
**Outputs:** `apps/web/src/shared/tokens/` — CSS custom properties file + Tailwind config extension. Referenced by every UI component.

**Horizon:** MVP

---

#### 28. Modal / Sheet / Form Primitives — MVP

**Purpose:** Cross-cutting dialog management (modal stack, sheet/drawer, form field primitives with error states). Based on Radix UI via shadcn/ui; wrapped with project-specific default styles and accessible behavior.

**Outputs:** `<Modal>`, `<Sheet>`, `<FormField>`, `<Input>`, `<Button>`, `<Select>`, `<Checkbox>`, `<Avatar>`, `<Badge>` — all in `apps/web/src/shared/ui/`.

**Horizon:** MVP

---

#### 29. Privacy Settings Feature — MVP

**Purpose:** `/settings/privacy` page. Profile visibility selector and who-can-DM controls (DM toggle is a stub in MVP — control rendered, DM feature is H2).

**Inputs:** `usePrivacySettings()`, `useUpdatePrivacySettings()`.
**Outputs:** `<PrivacySettingsPage>`.

**Horizon:** MVP

---

### H2 Modules

#### 30. Direct Messages Module — H2
**Purpose:** 1:1 and group DM channels outside server context. Shares Messaging Service internals; adds a DM-specific channel type and conversation list.

#### 31. Educator / Facilitator Role Module — H2
**Purpose:** Promoted role with moderation tooling (warn, timeout, bulk delete). Extends RBAC with educator-specific permission flags.

#### 32. Deeper Assignment Management — H2
**Purpose:** Assignment submission collection (file upload per student), return flow. No grading — output is submitted artifacts.

#### 33. Class Scheduling / Calendar Integration — H2
**Purpose:** Server-level event calendar. Google Calendar / iCal sync. Assignment due dates surface here.

#### 34. Study-Group Tools — H2
**Purpose:** Shared Pomodoro timer, study session tracking, optional whiteboard canvas (tldraw or equivalent).

#### 35. Freemium Billing Module — H2
**Purpose:** Stripe integration for paid server/school tiers. Storage quotas, voice call participant limits, admin tooling. Stripe CLI not installed until this horizon.

#### 36. Server Discovery — H2
**Purpose:** Public server directory. Servers opt in to listing. Tag-based search.

#### 37. Compliance Module — H2
**Purpose:** Privacy-rights UI (GDPR/CCPA data export + delete), consent management, audit log. Stubbed in MVP (`/privacy`, `/terms` pages). Promoted to H1 if a paying school/partner requires it before H2.

#### 38. Message Search — H2
**Purpose:** Full-text search across channels the user can read. Postgres `tsvector` index or Meilisearch depending on index size.

---

### H3 Modules

#### 39. Advanced Offline Sync — H3
**Purpose:** Full-content sync (all media, all channels since last online), conflict resolution UI, offline media playback.

#### 40. Cross-Server Academic Identity — H3
**Purpose:** Portable study profile + academic record linkable across servers/institutions.

#### 41. Institution Admin Console — H3
**Purpose:** B2B2C admin surface for school IT teams — bulk user provisioning, aggregate analytics, SSO.

#### 42. E2E Encryption Layer — H3
**Purpose:** End-to-end encrypted DMs and private channels as a privacy differentiator over Discord/Telegram.

---

## Conventions

**NestJS module naming:** `<Domain>Module` (e.g., `MessagingModule`). Each module lives at `apps/api/src/<domain>/`. Exports its primary service class for injection by dependent modules. No circular dependencies — enforced by barrel exports.

**Shared Zod types:** All request/response shapes defined in `packages/shared/src/schemas/<domain>.ts`. DTOs in NestJS are generated from these schemas via `@anatine/zod-nestjs`. Frontend uses the same Zod types for form validation and React Query type safety.

**Frontend feature slices:** `apps/web/src/features/<name>/` containing `index.ts` (public exports), `components/`, `hooks/`, `types.ts`. No cross-feature imports except via `apps/web/src/shared/`. Features communicate through URL state (React Router), React Query cache, and global context (Auth, OfflineSync).

**API versioning:** All REST endpoints prefixed `/api/v1/`. No versioning strategy needed beyond this for MVP — a single-team self-use project. Breaking changes bump the prefix at H2 when external integrations emerge.

**Pagination:** All list endpoints use cursor-based pagination (opaque `cursor` string, `limit` param, `nextCursor` in response envelope). No offset pagination — incompatible with real-time message insertion.

**Socket.IO namespaces:** `/messaging` (message events, typing), `/presence` (online status, voice room), `/sync` (outbox ack, catchup). Authenticated via middleware that validates the SuperTokens access token on handshake.

**Error responses:** All HTTP errors follow `{ statusCode, error, message, requestId }`. `requestId` is a per-request UUID logged server-side (structured JSON via NestJS Logger + Pino in prod). Frontend displays user-facing message from `message` field; logs `requestId` for support.

**Offline-first invariant:** Any component that reads messages MUST read from the IndexedDB cache layer first, even when online. Direct fetch-only paths for message display are not permitted. This ensures the offline and online code paths are identical and continuously tested.

---

## Reusability principles

1. **Module boundaries follow domain ownership, not feature ownership.** The Messaging Service does not own offline behavior — it owns persistence and fan-out. The Offline Sync Engine owns the offline contract. Features wire them together.

2. **Shared contracts over shared implementations.** `@studyhall/shared` owns Zod schemas, types, and constants. NestJS and the React SPA both import from this package. No copy-pasted type definitions across apps.

3. **One outbox, one reconciler.** The Offline Sync Engine is the only module that writes to the outbox or calls the catch-up endpoint. Other modules (Messaging, Notification) trigger through the sync engine's public API, never bypass it.

4. **RBAC is a cross-cutting concern, not an inline check.** Every permission check routes through `RBAC.can(userId, permission, context)`. No ad-hoc `if (user.role === 'owner')` checks in controller logic.

5. **Frontend primitives have no business logic.** `apps/web/src/shared/ui/` components are display-only. Business logic lives in hooks. Hooks live in feature slices. This boundary is enforced at code review.

6. **Socket.IO events are typed end-to-end.** Event names and payloads are defined in `@studyhall/shared` as discriminated unions. No untyped `socket.emit('string', any)` calls.

7. **No module directly writes to another module's state table.** Inter-module data flow uses service method calls or internal events (NestJS EventEmitter2). Foreign-key constraints enforce this at the DB level.

---

## Cross-references

Which other architecture branches each module group consumes or produces:

| Module group | Consumes (other branches) | Produces (for other branches) |
|---|---|---|
| Auth Module | SDKs: SuperTokens Node SDK; Security: session/token management | Services: AuthGuard + CurrentUser decorator (consumed by all) |
| User / Profile | Databases: `users`, `profiles` tables; SDKs: Railway Buckets (avatar) | Services: `UserSummaryDto` (embedded everywhere) |
| Server + Membership | Databases: `servers`, `server_members` | Services: membership check API consumed by RBAC, Messaging |
| Channel Management | Databases: `channels`, `categories` | Services: channel tree consumed by Messaging, Voice, Sidebar |
| Messaging Service | Databases: `messages`, `message_attachments`, `message_reactions`; SDKs: Socket.IO; Services: RBAC guard, User summary | Services: message fan-out events consumed by Notification; `nonce` contract consumed by Offline Sync |
| Presence Service | SDKs: Socket.IO (ephemeral, no DB); Services: Voice module (occupancy) | Services: presence map consumed by Member List, Channel Sidebar |
| RBAC Module | Databases: `roles`, `role_assignments`, `channel_permission_overrides` | Services: `PermissionGuard` + `can()` consumed by Messaging, Channel, Member, Assignment |
| Offline Sync Engine (server) | Databases: `messages` (nonce dedup index); SDKs: Socket.IO | Services: catch-up delta consumed by client Offline Sync Engine |
| Offline Sync Engine (client) | SDKs: Dexie (IndexedDB), Socket.IO client; Services: `/sync/outbox`, `/sync/catchup`, `message:new` events | Frontend: `useMessages`, `useConnectionState`, `useOutboxState` consumed by Message List, Composer, Connection Indicator |
| Invite System | Databases: `invites`; Services: Server+Membership `joinServer` | Services: invite preview consumed by Invite Flow UI |
| Notification Module | Databases: `notifications`; SDKs: Resend (email), Socket.IO; Services: internal events from Messaging + Assignment | Frontend: notification events consumed by Notification Bell |
| File Upload Module | SDKs: Railway Buckets (S3 presign); Security: content-type allowlist | Services: presigned URLs consumed by Profile + Messaging |
| Assignment Module | Databases: `assignments`, `assignment_statuses`; Services: RBAC guard, Notification events | Frontend: assignment data consumed by Assignment Panel |
| Privacy Controls | Databases: `privacy_settings`; Services: User Profile (visibility gate) | Frontend: privacy settings consumed by Privacy Settings page |
| Voice-Room UI | SDKs: LiveKit React SDK (`@livekit/components-react`); Services: LiveKit token endpoint | Frontend: room state consumed by Presence Service (occupancy) |
| Design Tokens | Design: `design/DESIGN-SYSTEM.md` (input) | Frontend: all UI components (output) |

---

## Stack-specific decisions

**Dexie vs raw IndexedDB:** Dexie 4.x is selected as the IndexedDB abstraction for the Offline Sync Engine client. Rationale: typed schema declarations, Dexie LiveQuery for reactive UI updates from the cache, and a well-maintained transaction API. The alternative (a full local-first sync engine like PowerSync or ElectricSQL) is over-engineered for MVP's scope — the outbox pattern is sufficient until H3's advanced offline feature demands bidirectional CRDT sync.

**Socket.IO over raw WebSocket:** Socket.IO is already locked in the stack for its automatic reconnection, room management, and namespace multiplexing. The Offline Sync Engine's reconnect hook (`socket.on('connect', syncOnReconnect)`) directly leverages Socket.IO's built-in reconnect event rather than reimplementing connection lifecycle.

**React Query + Dexie cache integration:** React Query is the server-state cache on the frontend. The Offline Sync Engine writes into Dexie, and `useMessages` reads from Dexie first (Dexie LiveQuery triggers re-render on IndexedDB mutation). React Query's `staleTime: Infinity` is set for message queries — freshness is driven by Socket.IO events and sync completion, not by polling intervals.

**Nonce-based deduplication over optimistic IDs:** The Messaging Service uses the `nonce` field (UUID generated at compose time, stored in the outbox entry) as the idempotency key. This avoids a two-round-trip optimistic-ID scheme. The server's `UNIQUE(channel_id, author_id, nonce)` index ensures exactly-once insertion under concurrent flush.

**In-process presence vs Redis (MVP decision):** Presence state is stored in-process for MVP (single Railway pod). This is a known limitation — flagged in Risk. The `PresenceService` interface is designed so the storage backend can be swapped to Redis pub/sub without changing the Socket.IO event shape.

**LiveKit token issuance:** The NestJS API issues LiveKit room tokens via `GET /rooms/:channelId/token` (authed). The LiveKit Node SDK signs JWTs using the LiveKit API secret (env var). The client connects directly to the LiveKit server (self-hosted on Railway or LiveKit Cloud — confirmed at v6 SDK branch). NestJS is not in the media path.

**Resend for transactional email:** Resend is promoted to MVP (as anticipated in stack-decisions.md) for email verification (feature 1) and invite emails (feature 6). SDK at `apps/api/src/notifications/email/resend.client.ts`. HTML templates compiled at build time.

---

## Risk / open items

**Risk 1 — Presence Service does not scale horizontally (HIGH for MVP, DEFERRED).** In-process presence map breaks when Railway scales to >1 NestJS pod. Mitigation for MVP: Railway is configured with a single pod; horizontal scaling is an H2 concern. When scaling, presence migrates to Redis pub/sub (add Redis to the stack at that point per stack-decisions.md § "Not in the baseline yet"). The `PresenceService` interface abstracts the storage backend to make this migration a swap, not a rewrite.

**Risk 2 — Outbox flush ordering under concurrent reconnects (MEDIUM).** If a user reconnects on two browser tabs simultaneously, both may attempt to flush the same outbox entries. Mitigation: `outbox_entries.status = 'flushing'` is set atomically (Dexie transaction) before the HTTP call; the second flush checks status and skips entries already in `flushing` state. Server-side nonce dedup provides the final safety net.

**Risk 3 — Dexie schema migrations (MEDIUM, ongoing).** IndexedDB schema changes require Dexie version bumps and migration callbacks. Any addition to the `messages`, `outbox_entries`, or `channels` store schema must include a Dexie `upgrade()` migration. This is a discipline requirement — enforced at code review. Forgetting a migration causes silent data loss on schema change.

**Risk 4 — LiveKit self-host vs LiveKit Cloud cost (OPEN — resolve at v6 SDK branch).** The choice between self-hosting LiveKit on Railway (infra cost) and using LiveKit Cloud (per-minute cost) is deferred to the SDK branch. The NestJS Voice module's token issuance code is identical for both options; only the `LIVEKIT_URL` env var changes.

**Risk 5 — Resend email deliverability for invite links (LOW, monitor).** Invite emails arriving in spam kill the F2 onboarding flow. Resend provides DKIM/SPF configuration; domain verification must be completed at C-2 (config stage) before first invite send.

**Risk 6 — Assignment Module scope creep into LMS territory (LOW, boundary risk).** The Assignment module is intentionally light (no submission collection, no grading). Any H2 deepening must stay within "collect/return artifacts" scope. Grading and LMS integration are permanently out of scope per the v0 brief.

**Open item A — Dexie vs PowerSync decision.** Confirmed Dexie for MVP above. Revisit at H3 if advanced offline sync (feature 26) demands bidirectional CRDT sync — PowerSync or ElectricSQL become candidates then.

**Open item B — Notification push (browser Push API).** The Notification module uses in-app Socket.IO delivery only in MVP. Browser push notifications (for when the app is backgrounded or the PWA is closed) require a Service Worker + Web Push setup. Deferred to H2 alongside DMs (feature 21) which is the primary driver.

**Open item C — Catch-up delta scope on reconnect.** `GET /sync/catchup` fetches messages since `lastSeenAt` per channel. For a user offline for >24h with high-traffic channels, this payload may be large. MVP: no cap — full catch-up. H2: add a `limit` + "you were away for X messages — load more?" UI affordance.
