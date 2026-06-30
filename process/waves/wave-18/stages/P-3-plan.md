# Wave 18 — P-3 Plan

## Approach

### Architecture deltas
**MessagingModule += thread-reply sub-system (apps/api/src/messaging/).** Reuses the wave-13 message persistence + idempotency + tombstone rules + the wave-12 /messaging gateway. A reply IS a message with `thread_parent_id` set — same `messages` table, same channel as its parent.

- **createReply** (messages.service): one TRANSACTION — (a) validate the parent: same channel as the request, `thread_parent_id IS NULL` on the parent (one-level — reject reply-of-reply), parent not soft-deleted (reject new replies to a tombstone); (b) insert the reply (a message row with `thread_parent_id = parentId`, idempotency ON CONFLICT like top-level); (c) `UPDATE messages SET reply_count = reply_count + 1, last_reply_at = <reply.created_at> WHERE id = parentId` — IN THE SAME TXN so the count is atomic. On idempotent retry (ON CONFLICT DO NOTHING hit), do NOT double-count.
  - *Alternative considered:* count-on-read (COUNT(*) per parent in the channel list). Rejected (P-0) — N+1 across the list; the denormalized transactional counter is the read-optimized choice.
- **deleteReply / soft-delete** (extend wave-13 deleteMessage): when the deleted message is a reply (`thread_parent_id` set), in the same txn decrement the parent `reply_count` and recompute `last_reply_at` (MAX(created_at) of remaining live replies, or NULL).
- **listThreadReplies** (messages.service): `SELECT … WHERE thread_parent_id = $parent AND is_deleted-excluded ORDER BY created_at ASC` cursor-paginated → ThreadRepliesResponse. (Tombstoned replies: render per wave-13 — include with content null, or exclude; spec says exclude soft-deleted from the list — follow spec.)
- **Realtime**: emit a THREAD-scoped event (`message.reply.created` → gateway `thread:reply` or similar) to the channel room `channel:<id>` over the EXISTING /messaging namespace, carrying `{parentId, channelId, reply}` — DISTINCT from top-level `message.created` so clients update the affordance + an open panel without confusing it with a top-level message. (Reply does NOT appear in the top-level channel list — only in the thread.)
- **DTO**: `MessageResponse += threadParentId?, replyCount?, lastReplyAt?` (top-level messages carry replyCount/lastReplyAt for the affordance; replies carry threadParentId).

**Frontend (apps/web/src/shell/).**
- `ThreadPanel.tsx` — side panel (against the D-block-adopted design): parent message pinned at top + replies (oldest-first via GET replies) + a reply composer at foot. Live-appends on the thread realtime event for its parent.
- Thread affordance in `MessageList.tsx` — on a parent row with `replyCount > 0`, render a cue (reply count + last-reply timestamp); click opens ThreadPanel for that parent. Updates live on the thread event.
- `useThread.ts` (or extend useMessages) — fetch/subscribe replies for the open parent; the thread realtime store.
- **Outbox parity** (0b728319): the panel composer's reply send goes through the SAME optimistic outbox as top-level (reuse useMessages/messagingSocket's pending/failed/idempotency machinery) — optimistic pending row → reconcile on ack via idempotency_key → retryable failed. No separate reply-send path.

### Data model
**migration 0008 (additive):** `messages += reply_count integer NOT NULL DEFAULT 0`, `last_reply_at timestamptz NULL`; index `(thread_parent_id, created_at)` for listThreadReplies + the affordance. `thread_parent_id` self-FK already declared (no FK change). Backfill: existing messages get reply_count=0 / last_reply_at=NULL (defaults — no data backfill needed). Drizzle schema in apps/api/src/db/schema/messages.ts.

### API / deps
- POST reply (thread_parent_id on the message create, OR a /messages/:parentId/replies route — implementer picks, document), GET /messages/:parentId/replies, realtime thread event. No new dep (Drizzle + Socket.IO + React existing). No new SDK.

## Plan

### File-level steps (by B-stage)
**B-1 Schema** (postgres-pro / database-administrator)
| apps/api/drizzle/migrations/0008_*.sql | create (drizzle-generate) | messages += reply_count, last_reply_at + index(thread_parent_id, created_at) |
| apps/api/src/db/schema/messages.ts | modify | reply_count, last_reply_at columns |

**B-2 Contracts** (typescript-pro)
| packages/shared/src/messaging.ts | modify | MessageResponse += threadParentId/replyCount/lastReplyAt; ThreadRepliesResponse; thread realtime event payload |

**B-3 Backend** (backend-developer + node-specialist)
| apps/api/src/messaging/messages.service.ts | modify | createReply (txn: validate one-level + same-channel + parent-not-deleted, insert reply, count++), deleteReply count--/recompute, listThreadReplies, rowToDto threadParentId/replyCount/lastReplyAt |
| apps/api/src/messaging/messages.controller.ts | modify | POST reply + GET /messages/:parentId/replies |
| apps/api/src/messaging/messaging.gateway.ts | modify | emit thread:reply (message.reply.created) to channel room |

**B-4 Frontend** (react-specialist + frontend-developer; against D-block design)
| apps/web/src/shell/ThreadPanel.tsx | create | parent pinned + replies + composer; live-append |
| apps/web/src/shell/useThread.ts | create | fetch/subscribe replies; thread store |
| apps/web/src/shell/MessageList.tsx | modify | thread affordance (reply_count + last_reply_at) → open panel |
| apps/web/src/shell/MainColumn.tsx (or AppShell) | modify | mount ThreadPanel slot |
| apps/web/src/shell/useMessages.ts / messagingSocket.ts | modify | thread realtime event + outbox-parity reply send (idempotency) |
| apps/web/src/auth/api.ts | modify | api.postReply, api.getThreadReplies |

**B-5 Wiring**: repo typecheck + route registration + boot-probe.

### Specialist routing (validated vs AGENTS.md)
postgres-pro/database-administrator, typescript-pro, backend-developer, node-specialist, react-specialist, frontend-developer — all present.

### Parallelization
- B-1 → B-2 serial (schema → contracts).
- B-3 chain: service (createReply/deleteReply/list) → controller + gateway (parallel after service).
- B-4 after B-3 + D-block: ThreadPanel ∥ affordance ∥ outbox-parity → MainColumn mount serial last.

### Self-consistency sweep
1. Every AC → step: one-level/same-channel/transactional-count (service+migration); realtime (gateway); GET replies (controller); panel+affordance (ThreadPanel+MessageList); outbox parity (useMessages). ✓
2. Specialist on each step. ✓ 3. No file in two parallel batches. ✓ 4. design_gap=true → B-4 surfaces depend on D-block-adopted thread panel/affordance. ✓ 5. Architecture alt named (denormalized count vs count-on-read). ✓ 6. Contracts concrete (no TBD). ✓ 7. No new dep. ✓ 8. SDK n/a. ✓
