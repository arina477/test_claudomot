# P-4 Phase 2 — Source-Claim Verification (Karen)
**Wave 13 — M3 message lifecycle (edit/delete + reactions), PRE-build, security-tightened**

## VERDICT: APPROVE

Every load-bearing source claim the spec/plan depend on is VERIFIED against live wave-12 code. No claimed-but-fake substrate. One table-name disposition resolved (keep `message_reactions`, override recorded). No gold-plating; deferrals explicit.

---

## Per-claim findings

### Claim 1 — author_id + event/fan-out pattern to extend — VERIFIED
- `messages.author_id` exists: `apps/api/src/db/schema/messages.ts:17` (`author_id text notNull → users.id`). The author-only edit check (`session.getUserId() === message.author_id`) has a real column. NOTE: `author_id` is `text` (not uuid) — author check is string-equality, correct.
- Event pattern: `messages.service.ts:51` injects `EventEmitter2`; `:141` `this.eventEmitter.emit('message.created', dto)` after DB write. Cleanly extensible to `message.updated`/`message.deleted`/`reaction.added`/`reaction.removed`.
- Gateway @OnEvent→room fan-out: `messaging.gateway.ts:207-209` `@OnEvent('message.created')` → `this.server.to('channel:'+message.channelId).emit('message:new', message)`. ROOM-ONLY (`:30`, `:203` comments confirm "never broadcast-all"). The exact pattern the plan extends. No new namespace needed.

### Claim 2 — RBAC moderator-delete path — VERIFIED
- `RbacService.can(userId, serverId, permission)`: `rbac.service.ts:46`, SERVER-SIDE.
- `manage_channels` IS a valid `Permission`: `rbac.service.ts:29` `type Permission = 'manage_server'|'manage_roles'|'manage_channels'|'manage_members'`. The moderator-delete check `can(userId, serverId, 'manage_channels')` is type-valid.
- serverId resolvable from message→channel→`channels.server_id`: `canViewChannelById` (`:344-353`) already does exactly this resolution (`select channels.server_id ... canViewChannel(...)`). The delete service can reuse the same `channels.server_id` lookup to feed `can()`. NOTE: plan must resolve serverId itself (a one-line `select server_id from channels where id=channelId`) — `can()` takes serverId, not channelId. This is straightforward; substrate present.

### Claim 3 — soft-delete cols + reactions UNIQUE match _library — VERIFIED
- `_library` L153 (Message table design): `is_edited`, `edited_at`, `is_deleted`, `deleted_at` — matches the ALTER in spec AC + P-3 B-0 verbatim. Cols do NOT yet exist on the live `messages` table (confirmed: schema only has id/channel_id/author_id/content/created_at/idempotency_key) → migration is genuinely needed, not redundant. Correct.
- `_library` L142 reactions index: `UNIQUE (message_id, user_id, emoji)` — matches the toggle/idempotency spec exactly.

### Claim 4 — ChannelMessageGuard reusable on new routes — VERIFIED
- `channel-message.guard.ts:48` reads `req.params.channelId` (ROUTE PARAMS only, never body — `:22` IDOR-safe), param key `'channelId'` (`:24`), delegates to `canViewChannelById` (`:53`). The new `PATCH/DELETE/POST /channels/:channelId/messages/:messageId[/reactions]` routes all carry `:channelId` in @Param → guard drops in unchanged. Existing controller (`messages.controller.ts:42` `@Controller('channels/:channelId/messages')`, `:47/:66` `@UseGuards(AuthGuard, ChannelMessageGuard)`) is the exact template to extend.

### Claim 5 — idempotent reaction toggle + aggregated counts — VERIFIED (implementable)
- `UNIQUE(message_id,user_id,emoji)` makes the toggle (INSERT…ON CONFLICT → if-existed-delete-else-insert) atomic and idempotent. Aggregated `[{emoji,count,reactedByMe}]` is a standard GROUP BY + per-caller LEFT JOIN — no missing primitive. `listMessages` (`messages.service.ts`) already exists to extend with the join.

### Claim 6 — TABLE NAME disposition — RESOLVED: keep `message_reactions`
- Conflict confirmed: `_library` L142 says `reactions`; spec + P-3 plan say `message_reactions`.
- **CALL: keep `message_reactions`, record the override.** Rationale: (1) more descriptive / namespaced — avoids a bare `reactions` table colliding with future non-message reactions; (2) `_library` is a guidance index, not a binding migration, and has self-contradicted before (wave-10 `channel_permission_overrides`), so it is not authoritative on naming; (3) the spec AC, P-3 plan, and shared-type extension all already say `message_reactions` — flipping to `reactions` now would desync three downstream artifacts for zero functional gain. **Action for B-block:** note the deliberate override in the migration comment + a one-line `_library` reconcile at L-1 so the index stops contradicting shipped reality. This is a naming override, not a blocker.

### Claim 7 — specialists in AGENTS.md — VERIFIED (one minor naming note)
- `postgres-pro` `AGENTS.md:81`, `backend-developer` `:70`, `head-designer` `:44`, `react-specialist` `:82` — all present.
- MINOR: P-3 line 24 writes "database-administrator/postgres-pro"; `database-administrator` is NOT registered in AGENTS.md, but `postgres-pro` (the actual Drizzle/Postgres B-0 agent) IS. Spawn `postgres-pro` for B-0; drop the `database-administrator/` prefix to avoid an invent-an-agent violation at B-block. Non-blocking.
- No new WebSocket specialist needed — gateway is reused (verified Claim 1). Correct.

### Claim 8 — antipatterns — CLEAN
- No gold-plating: threads/mentions/attachments/presence/typing all explicitly DEFERRED (spec note + P-3 §sequencing). Soft-delete is row-level tombstone only — NO thread machinery pulled in, despite `messages` having an unused `thread_parent_id` design slot in _library (correctly NOT introduced this wave).
- No claimed-but-fake: every "reuse X" claim (event emitter, gateway room fan-out, guard, RBAC `can`, author_id) maps to real, located code — not aspirational.
- Scope is tight: edit (author-only), delete (author||moderator), reactions (toggle) + realtime + UI. Matches M3 conversational-core framing; lands before M4 on a stable contract as stated.

---

## Security substrate (T-8 load-bearing) — all present
- author-only edit: real `author_id` column ✓
- author||moderator delete: `can(_, _, 'manage_channels')` real + typed ✓
- channel-access gate: `ChannelMessageGuard` + `canViewChannelById` real, IDOR-safe (params-only) ✓
- room-only fan-out: `server.to('channel:id')` real, "never broadcast-all" enforced in wave-12 ✓
- idempotent toggle: `UNIQUE` constraint design real ✓
- Two-client / wave-11 fixture verification (T-8/C-2) is the right gate to prove room-scoping — flagged in plan ✓

## Non-blocking carry-forwards for B-block
1. Delete service must resolve `serverId` from `channels.server_id` before calling `can()` (one extra select; `can()` is serverId-keyed, not channelId-keyed).
2. Migration comment must record the `message_reactions` override vs _library L142 `reactions`; reconcile _library at L-1.
3. Spawn `postgres-pro` (not `database-administrator`) at B-0.
4. Guard `req.params.channelId` works on the new routes only because they keep `:channelId` in the path — keep the bare-path `/channels/:channelId/messages/:messageId` shape (spec already does).
