# Wave 13 — P-3 Plan (M3 message lifecycle, multi-spec)

## Data model (B-0, database-administrator/postgres-pro) — one migration
- ALTER `messages` ADD is_edited boolean default false notNull, edited_at timestamptz null, is_deleted boolean default false notNull, deleted_at timestamptz null.
- `message_reactions` (id uuid pk, message_id uuid→messages onDelete cascade, user_id text→users.id, emoji text notNull, created_at default now(); UNIQUE(message_id, user_id, emoji); INDEX(message_id)).
- Drizzle schema (extend messages.ts + add reactions) + migration. No backfill.

## Backend (B-2, backend-developer) — extend MessagingModule
- e12886d7 edit/delete:
  - messages.service editMessage(channelId, messageId, userId, content) — load message; AUTHOR-ONLY (message.author_id === userId else ForbiddenException 403); not-deleted (else 409/404); UPDATE content+is_edited+edited_at; emit `message.updated`. deleteMessage(channelId, messageId, userId) — author OR `rbacService.canChannelById/can(manage_channels)` via the server (resolve server from channel) else 403; soft-delete is_deleted+deleted_at+content tombstone; idempotent; emit `message.deleted`.
  - controller PATCH/DELETE /channels/:channelId/messages/:messageId (@UseGuards(AuthGuard, ChannelMessageGuard) + the authorship/role check in the service). 200/204.
- d78df376 reactions:
  - reactions in messages.service (or a reactions.service): toggleReaction(channelId, messageId, userId, emoji) — INSERT ON CONFLICT(message_id,user_id,emoji) → if existed delete (toggle off) else inserted; return {reacted}. emit `reaction.added`/`reaction.removed`. listMessages now LEFT JOINs reactions → aggregated [{emoji,count,reactedByMe}] per message (reactedByMe from caller).
  - controller POST /channels/:channelId/messages/:messageId/reactions (@UseGuards(AuthGuard, ChannelMessageGuard)).
- Gateway (extend wave-12 messaging.gateway.ts): @OnEvent('message.updated'/'message.deleted'/'reaction.added'/'reaction.removed') → server.to('channel:'+channelId).emit('message:updated'/'message:deleted'/'reaction:added'/'reaction:removed', payload). ROOM-ONLY (reuse the wave-12 pattern). No new namespace/auth.
- shared: extend messaging.ts (MessageResponse + isEdited/isDeleted/reactions; ReactionToggle; EditMessage). Build shared FIRST.

## Design (D-block, head-designer) — design_gap_flag TRUE-delta
- server-channel-view.html → add: edit-in-place (own message), delete→tombstone, reaction-pills (emoji+count, reactedByMe highlight) + add-reaction. Component-level delta.

## Frontend (B-3, react-specialist) — extend the message UI
- message-row: edit affordance (own → inline edit → PATCH), delete (own OR moderator → confirm → DELETE → tombstone), reaction-pills (toggle via POST) + add-reaction. Realtime: message:updated→re-render, message:deleted→tombstone, reaction:added/removed→update pills (optimistic+reconcile). Per the D design. api: editMessage, deleteMessage, toggleReaction.

## Specialists (AGENTS.md ✓): database-administrator/postgres-pro, backend-developer, head-designer, react-specialist. (No new WS specialist — reuses the wave-12 gateway.)
## Security (T-8 heavy): edit author-only; delete author||moderator(can manage_channels); both server-side + ChannelMessageGuard; reaction idempotent UNIQUE; room-only fan-out (message:updated/deleted, reaction events); soft-delete tombstone. live-probe via wave-11 fixture + TWO-CLIENT (edit/delete/react appear <1s cross-client). C-2: apply migration + verify two-client edit/delete/reaction realtime.
## Sequencing: B-0 schema → B-1 shared → B-2 edit/delete + reactions + gateway events (commit-per-spec) → [D] → B-3 UI → B-4/5/6. PUSH after each.
