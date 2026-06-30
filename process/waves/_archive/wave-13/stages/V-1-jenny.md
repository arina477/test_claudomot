# V-1 jenny — semantic-spec verification (wave-13 M3 message lifecycle)

**Verdict: APPROVE**

Spec `wave-13-m3-message-lifecycle` (3 specs) vs LIVE state (main @ `427d5d6`, PR #24; api `https://api-production-b93e.up.railway.app`). Read live code + migration + shared schemas + C-2 deliverable. Every AC traces to shipped code; no drift, no over-reach.

---

## Block e12886d7 — Message edit + delete (soft-delete) + realtime — MATCHES

- **Migration** (`apps/api/drizzle/migrations/0006_wave13_message_lifecycle.sql:10-13`): `is_edited bool default false`, `edited_at tstz null`, `is_deleted bool default false`, `deleted_at tstz null` — exactly per `_library L153`. Committed (no auto-migrate). Soft-delete only; no DROP/hard-delete. Applied to prod pre-cutover (C-2:12-17, verified via direct pg query). MATCHES.
- **PATCH edit author-only** (`messages.service.ts:228-281`): `@UseGuards(AuthGuard, ChannelMessageGuard)` (controller:92-93); `userId` from `req.session.getUserId()` (controller:106); `message.author_id !== userId → ForbiddenException(403)` (service:245-247); sets `content + is_edited=true + edited_at=now()` (service:257); returns `MessageResponse` with `isEdited/editedAt` (rowToDto:109-110). Deleted message → `ConflictException(409)` (service:250-252). MATCHES.
- **DELETE author||moderator soft-delete** (`messages.service.ts:300-356`): author OR `rbacService.can(userId, serverId, 'manage_channels')` (service:330-340), **serverId resolved server-side from `channels.server_id`** (service:317-327) — never from request; soft-delete `is_deleted=true, deleted_at, content=''` (service:345), `rowToDto` returns `content:null` for tombstone (service:107); 204 (controller:125); idempotent — already-deleted returns early (service:312-314). MATCHES.
- **Realtime room-only fan-out**: `message.updated`/`message.deleted` emitted (service:278/355) → gateway fans `message:updated`/`message:deleted` to `server.to('channel:id')` ONLY (gateway:228-246). list/get reflect `is_edited/is_deleted`; tombstone payload (content:null), not old content. MATCHES.
- **Authz boundary**: cross-user → 403 (service:246/339); unauthed → 401 (AuthGuard; C-2:33 confirms PATCH/DELETE → 401 live); non-channel-access → 403 (ChannelMessageGuard). Live round-trip + two-client realtime confirmed in C-2:34-41. MATCHES.

## Block d78df376 — Reactions (toggle + realtime) — MATCHES

- **Migration** (`0006_*.sql:1-16`): `message_reactions(id uuid pk, message_id uuid→messages ON DELETE cascade, user_id text→users.id, emoji text notNull, created_at)` + `UNIQUE(message_id,user_id,emoji)` — exactly per `_library L142`. Cascade present (line 14). MATCHES.
- **POST toggle idempotent** (`messages.service.ts:369-447`): `@UseGuards(AuthGuard, ChannelMessageGuard)` (controller:142); exists→DELETE→`{reacted:false}` (service:401-419), else INSERT (with `onConflictDoNothing` on the UNIQUE)→`{reacted:true}` (service:420-444); userId from session (controller:155). True→false toggle confirmed live (C-2:36). MATCHES.
- **Aggregated reactions** in list/get: `[{emoji, count, reactedByMe}]` grouped in `rowToDto` (service:79-100); `reactedByMe` derived per caller's `viewerUserId` (service:85,89); single batched query, no N+1 (service:535-547). emoji validated (`ReactionToggleSchema`, `messaging.ts:72-78`, 1-64 chars trimmed — the "reasonable shape" the AC allows). MATCHES.
- **Realtime**: `reaction.added`/`reaction.removed` emitted (service:414/438) → gateway fans `reaction:added`/`reaction:removed` to channel room ONLY (gateway:255-276). Live 87ms, no-leak (C-2:39-40). MATCHES.
- **Edge — react to deleted message**: minor partial — service checks message exists + belongs to channel (service:376-384) but does NOT block a reaction on an `is_deleted` row (it reads `is_deleted` into the select but never gates on it). The AC phrases this as "blocked/no-op", and the UI never renders reaction affordances on a tombstone (MessageList:462 early-returns before pills), so it is not reachable through the product. Non-blocking; noted for L-2. (cascade-delete-on-message-delete satisfied by FK.) MATCHES (with note).

## Block f323a71f — Message UI (edit / tombstone / reaction pills + reconcile) — MATCHES

- **Edit/delete affordances** (`MessageList.tsx`): own-message inline edit (textarea + Save/Cancel + Enter/Esc, `inline-edit-form`:372; save→`onEdit`→PATCH:545); `(edited)` indicator (header:9-12); delete affordance own OR moderator-on-others (`RowActions`:315-320, label switches "Delete your message"/"Delete message (moderator)") → confirm → DELETE → tombstone "This message was deleted" (`tombstone-`:462-482, no content/reactions/actions). Per design. MATCHES.
- **Reaction pills** (`MessageList.tsx:178-235`): pill row (emoji+count, highlighted if reactedByMe:192-206), add-reaction popover (110-178), click pill → toggle (205). Optimistic + reconcile in `useMessages.ts` (toggleReaction:328-392 with in-flight dedup of socket echoes:60,158). MATCHES.
- **Realtime live<1s** (`useMessages.ts:126-180`): `message:updated`→re-render, `message:deleted`→tombstone, `reaction:added/removed`→update pills; own optimistic actions reconciled against incoming events to avoid double-flip. Measured <1s in C-2:39. MATCHES.

---

## Scope discipline — right-sized, no creep

- Grep of all new backend + frontend code: **zero** thread / mention / attachment / presence / typing / member-list surface. Confirmed deferred per spec `note` + prose. No new namespace — reuses wave-12 `/messaging` gateway + `ChannelMessageGuard` exactly as specced (gateway:75-81; controller:55,74,93,124,142). No gold-plating: emoji validation is a bounded-length shape (not an over-built allowlist), reaction fetch is batched not N+1, single-pod in-memory adapter (no premature Redis).
- **Matches M3 prose + the bet**: completes M3 conversational basics (edit/delete/react, all real-time). **M3 is NOT closeable** — presence/typing and later slices remain; this lands the stable message-lifecycle contract M4 (offline-first wedge) builds on. No milestone over-claim.

## Findings (non-blocking, for L-2 / triage)
- **Low**: `toggleReaction` does not server-side block a reaction on a soft-deleted message (AC edge-case "blocked/no-op"). Unreachable via UI (tombstone hides pills), but a direct API caller could react on a tombstone. Suggest a `409/no-op` guard on `message.is_deleted` for defence-in-depth. Not a spec-drift blocker.

**APPROVE** — all 3 blocks MATCH; completes M3's conversational basics without over-reach.
