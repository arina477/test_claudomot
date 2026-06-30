# Wave 18 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-18/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

All M3-threads load-bearing claims hold against the source. The data plane is the
heart of the wave and it is correct: `createReply` (messages.service.ts:694-800)
runs the reply insert + `reply_count + 1` + `last_reply_at` in a single
`db.transaction` (the createServer atomic pattern, NOT createMessage's
non-transactional sequential awaits), and the count increment is fenced behind
`isNewInsert` — derived from `ON CONFLICT(channel_id, idempotency_key) DO NOTHING
RETURNING` being non-empty — so an idempotent retry returns the existing reply
without a second increment (no double-count) and without a second row (no
double-insert). One-level enforcement is complete and correctly coded before any
write: reply-of-reply → 400 (parent.thread_parent_id !== null), cross-channel →
400 (parent.channel_id !== channelId), deleted parent → 409, missing parent → 404.
Tail-only recompute in `deleteMessage` (messages.service.ts:585-652) is exactly to
spec — `reply_count` ALWAYS decrements via `GREATEST(reply_count - 1, 0)`,
`last_reply_at` is recomputed `MAX(created_at)` over remaining live replies ONLY
when the deleted reply was the tail (created_at === parent.last_reply_at),
otherwise left untouched, and resolves to NULL when no live replies remain — all
inside one transaction. Realtime is distinct: `createReply` emits
`thread.reply.created` → gateway fans out `thread:reply:created` to
`channel:<id>` (messaging.gateway.ts:235-241), a separate event name from
`message:new`, so replies never pollute the top-level stream. Migration 0008 is
purely additive (3 ADD COLUMN + self-FK + composite index, no table rewrite) and
the self-FK is correct. WS auth is validated on upgrade via `installWsAuthMiddleware`
(unchanged from prior waves); the new ThreadsController routes carry `@UseGuards(AuthGuard)`
and the service re-derives the parent's channel transitively rather than trusting
the client — no unguarded door. Outbox parity (0b728319) is genuine reuse:
`useThread.sendReply` (useThread.ts:127-162) uses the identical optimistic
machinery as `useMessages.sendMessage` — client-generated idempotencyKey, a
pending optimistic row, `api.postReply`, confirm-then-remove-by-key + dedup-by-id,
a `failed` state on error, and `retryReply` re-sending the SAME idempotencyKey
(server ON CONFLICT → single row, single count). The closed-panel affordance
live-update works because `useMessages` separately subscribes `thread:reply:created`
and bumps the parent row's replyCount/lastReplyAt (useMessages.ts:197-215),
independent of any open panel. All five D-block a11y carries land: focus-trap at
overlay (≤1024), Esc + focus-restore via triggerRef, affordance hidden when
replyCount===0 (MessageList.tsx:791 gates `(msg.replyCount ?? 0) > 0`),
`<ol role="list">`/`<li>` semantics, and aria-live="polite" on the replies list.
The CJS trap is avoided (type-only `@studyhall/shared` import + local
`'thread:reply:created'` literal). Scope held to one-level threads + affordance +
panel + outbox parity; no nesting, notifications, unread, Redis, or multi-replica
gold-plating. Repo is green (typecheck 4/4, build 3/3, lint 0-errors, api 305 / web 142).

One Medium-severity, non-blocking finding is routed to Phase 2 (below) — a dead
socket-echo reconcile branch with a factually wrong comment. It does not break the
contract because reconciliation is fully achieved at the server-ack layer; flagging
it for `/review` rather than gating on it.

## Findings routed to Phase 2 /review (Medium — non-blocking)

- **apps/web/src/shell/useThread.ts:114-121** — The socket-echo
  reconcile-by-idempotency_key branch is dead code. It reads
  `(incoming as MessageResponse & { idempotencyKey?: string }).idempotencyKey`, but
  the server DTO (`rowToDto`, messages.service.ts:140-159) never echoes
  `idempotencyKey` onto the response — `MessageResponse` (packages/shared/src/messaging.ts)
  has no such field. So `key` is always `undefined` and the
  `setOptimisticReplies(...filter...)` never fires on the socket path. The inline
  comment ("The server echoes the idempotency_key back on the reply DTO") is
  factually wrong. **Why it is not a correctness defect:** the optimistic row is
  already removed on the API-confirm path (useThread.ts:149), and the socket echo is
  de-duped against `replies` by `id` (useThread.ts:110) — exactly matching how
  top-level `useMessages` reconciles (API-ack removes the optimistic row; socket
  echo deduped by id; no idempotency-key socket reconcile there either). The spec's
  "reconciles on server ack via idempotency_key" requirement is satisfied at the
  load-bearing layer (server ON CONFLICT + the HTTP ack), which prevents
  double-insert / double-count. Recommended Phase-2 disposition: delete the dead
  branch + the incorrect comment (cheap same-branch fix), OR if true socket-only
  reconcile is wanted, have `rowToDto` echo `idempotencyKey` and add it to
  `MessageResponseSchema` — but that is gold-plating for the single-pod MVP and not
  required by the contract.

## Rework instructions  (only if REWORK)

n/a — APPROVED.

### Cascade

n/a — no rework triggered.

- **Stages that must re-run:** none
- **Stages that stay untouched:** B-0, B-1, B-2, B-3, B-4, B-5

## Escalation  (only if ESCALATE)

n/a — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
