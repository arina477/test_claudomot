/**
 * outbox.ts — durable send queue for offline-first message delivery.
 *
 * Contracts:
 *   1. enqueue()  — generate a STABLE idempotencyKey ONCE (at enqueue time,
 *                   never regenerated on retry). Write the outbox row with
 *                   state=pending. Returns the generated key so the caller
 *                   can track the optimistic message.
 *
 *   2. drain()    — query pending items OLDEST-FIRST via [state+createdAt],
 *                   then POST each item SEQUENTIALLY (await each — NOT
 *                   Promise.all). On success: delete the row. On failure:
 *                   increment attempts; mark failed after MAX_ATTEMPTS.
 *                   Exactly-once: the server's ON CONFLICT(channel_id,
 *                   idempotency_key) deduplicates replayed sends.
 *
 *   3. loadPending() — read all pending rows for cold-start hydration
 *                      (inject into optimistic state so user sees them
 *                      as still-pending across page reload).
 *
 * Gotcha (SDK-doc): do NOT await non-Dexie promises inside db.transaction()
 * — IDB transactions auto-commit when no IDB request is pending.
 * All network I/O happens outside the Dexie transaction scope here.
 */

import type { StudyHallDB } from './db';
import type { OutboxItem, OutboxTarget } from './types';

// POST callback type — dispatches by target kind.
//
// Wave-46 M8 generalization: SendFn now accepts an OutboxTarget discriminator
// instead of a bare channelId. Callers supply either:
//   {kind:'channel', channelId} → POST /channels/:channelId/messages
//   {kind:'dm', conversationId} → POST /dm/conversations/:conversationId/messages
//
// The body shape is identical in both cases (content + idempotencyKey + optional
// attachments). Channel send behaviour is UNCHANGED — callers that previously
// passed a string channelId now pass {kind:'channel', channelId} instead.
export type SendFn = (
  target: OutboxTarget,
  body: {
    content: string;
    idempotencyKey: string;
    attachments?: Array<{
      key: string;
      filename: string;
      contentType: string;
      sizeBytes: number;
    }>;
  },
) => Promise<{ id: string; [key: string]: unknown }>;

// After how many attempts does a pending item become failed.
const MAX_ATTEMPTS = 3;

// ── Enqueue ───────────────────────────────────────────────────────────────────

/**
 * Enqueue a new message in the durable outbox.
 *
 * Wave-46: accepts an OutboxTarget discriminator (channel | dm).
 * Channel enqueues pass {kind:'channel', channelId}; DM enqueues pass
 * {kind:'dm', conversationId}. The legacy `channelId` field is populated
 * for backwards compat with the Dexie index; DM items use '' as sentinel.
 *
 * - Generates a stable idempotencyKey (UUID) ONCE here.
 * - Does NOT check for duplicates — callers are responsible for not
 *   double-enqueueing the same compose action.
 * - Returns { id (outbox PK), idempotencyKey } so the caller can wire the
 *   optimistic message row.
 */
export async function enqueue(
  store: StudyHallDB,
  target: OutboxTarget,
  content: string,
  attachments?: OutboxItem['attachments'],
): Promise<{ id: number; idempotencyKey: string }> {
  const idempotencyKey = crypto.randomUUID();
  const now = new Date().toISOString();

  // Populate the legacy channelId field for backwards compat / Dexie index.
  const legacyChannelId = target.kind === 'channel' ? target.channelId : '';

  const item: Omit<OutboxItem, 'id'> = {
    target,
    channelId: legacyChannelId,
    idempotencyKey,
    content,
    state: 'pending',
    createdAt: now,
    attempts: 0,
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
  };

  const id = await store.outbox.add(item);
  return { id: id as number, idempotencyKey };
}

// ── Load pending (cold-start hydration) ──────────────────────────────────────

import Dexie from 'dexie';

/**
 * Return all pending outbox items oldest-first.
 * Used on mount to hydrate optimistic state from the durable queue.
 */
export async function loadPending(store: StudyHallDB): Promise<OutboxItem[]> {
  return store.outbox
    .where('[state+createdAt]')
    .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
    .toArray();
}

// ── Drain ─────────────────────────────────────────────────────────────────────

/**
 * Module-level re-entrancy guard for drain().
 *
 * Only ONE drain may execute at a time. Concurrent callers (e.g. socket
 * 'connect' and window 'online' firing together on reconnect) previously
 * received the in-flight promise back, silently dropping their callbacks.
 *
 * Fix 3 (wave-58): instead of dropping a concurrent caller's callbacks,
 * we queue a follow-up drain with those callbacks so they fire after the
 * current drain completes. This closes the re-entrancy hole where the
 * composer-triggered drain()'s onDelivered (which removes the optimistic
 * row and seeds confirmedIdToKeyRef) was silently dropped when a
 * mount-time drain was already in-flight.
 *
 * Invariant: at most ONE drain executes network I/O at a time (no double-
 * POSTs, in-order guaranteed). The follow-up drain re-snapshots the
 * pending set AFTER the in-flight drain completes, so items already
 * deleted by the first drain are not re-sent.
 */
let _drainInFlight: Promise<void> | null = null;

/** Pending follow-up drains queued while a drain was in-flight. */
type DrainCall = {
  store: StudyHallDB;
  send: SendFn;
  onDelivered: (idempotencyKey: string, confirmedId: string) => void;
  onFailed: (idempotencyKey: string) => void;
  /** Resolves the promise returned to the concurrent caller after the follow-up drain completes. */
  resolveFollowUp: () => void;
  /** Rejects the promise returned to the concurrent caller if the follow-up drain throws. */
  rejectFollowUp: (e: unknown) => void;
};
const _drainQueue: DrainCall[] = [];

/**
 * Drain all pending outbox items: POST each SEQUENTIALLY (oldest-first),
 * delete on success, increment attempts / mark failed on error.
 *
 * onDelivered — called after each successful POST so useMessages can
 *               reconcile the optimistic row with the server-confirmed message.
 * onFailed    — called when an item exceeds MAX_ATTEMPTS so useMessages
 *               can flip the optimistic row to 'failed'.
 *
 * Sequential AND stop-on-failure — if a send fails the drain halts
 * immediately, leaving the failed item and ALL later items pending.
 * This guarantees IN-ORDER delivery: a later message can NEVER be sent
 * ahead of an earlier un-sent one. The failed item is retried first on
 * the next drain call (after attempts++; at MAX_ATTEMPTS it becomes
 * state='failed', which blocks later items until the user calls
 * retryOutboxItem() or discards it).
 *
 * Concurrent callers no longer lose their callbacks: they are queued and
 * run in a follow-up drain after the current one finishes. This preserves
 * in-order delivery while ensuring every caller's onDelivered/onFailed
 * callbacks fire for the items delivered in their context.
 *
 * M2: items with the same createdAt are broken by id (auto-increment
 * integer) so the drain order is fully deterministic.
 */
export function drain(
  store: StudyHallDB,
  send: SendFn,
  onDelivered: (idempotencyKey: string, confirmedId: string) => void,
  onFailed: (idempotencyKey: string) => void,
): Promise<void> {
  // Re-entrancy guard: if a drain is already running, queue the caller's
  // callbacks for a follow-up drain instead of silently dropping them.
  //
  // The returned promise resolves/rejects after the follow-up drain for this
  // caller completes (not just after the in-flight drain). This ensures callers
  // that await drain() see their onDelivered callbacks fire before the promise
  // settles.
  if (_drainInFlight !== null) {
    // Wrap in a promise whose resolve/reject is stored alongside the callbacks
    // so the .finally() flush can settle it after the follow-up drain runs.
    let resolveFollowUp!: () => void;
    let rejectFollowUp!: (e: unknown) => void;
    const followUp = new Promise<void>((res, rej) => {
      resolveFollowUp = res;
      rejectFollowUp = rej;
    });
    _drainQueue.push({ store, send, onDelivered, onFailed, resolveFollowUp, rejectFollowUp });
    return followUp;
  }

  _drainInFlight = _drainImpl(store, send, onDelivered, onFailed).finally(async () => {
    _drainInFlight = null;
    // Flush any callers that queued while this drain was in-flight.
    // Each entry runs its own _drainImpl (re-snapshots the pending set)
    // so it delivers any items enqueued after the first drain's snapshot.
    const queued = _drainQueue.splice(0);
    for (const entry of queued) {
      // Sequential — preserves in-order guarantee across follow-ups.
      try {
        await _drainImpl(entry.store, entry.send, entry.onDelivered, entry.onFailed);
        entry.resolveFollowUp();
      } catch (e) {
        entry.rejectFollowUp(e);
      }
    }
  });

  return _drainInFlight;
}

async function _drainImpl(
  store: StudyHallDB,
  send: SendFn,
  onDelivered: (idempotencyKey: string, confirmedId: string) => void,
  onFailed: (idempotencyKey: string) => void,
): Promise<void> {
  // Snapshot pending items oldest-first before the loop.
  // Primary sort: createdAt (from compound index [state+createdAt]).
  // Secondary sort: id (auto-increment integer) — tiebreak for same-millisecond enqueues.
  const unsorted = await store.outbox
    .where('[state+createdAt]')
    .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
    .toArray();

  const pending = unsorted.slice().sort((a, b) => {
    if (a.createdAt < b.createdAt) return -1;
    if (a.createdAt > b.createdAt) return 1;
    // Same createdAt — break tie by auto-increment id (always present after add()).
    return (a.id as number) - (b.id as number);
  });

  for (const item of pending) {
    // id is assigned by Dexie auto-increment — always present after add().
    const outboxId = item.id as number;

    try {
      // Resolve the routing target for this item.
      // Pre-wave-46 rows lack `target` — fall back to legacy channelId field.
      const resolvedTarget: import('./types').OutboxTarget = item.target ?? {
        kind: 'channel',
        channelId: item.channelId,
      };

      const confirmed = await send(resolvedTarget, {
        content: item.content,
        idempotencyKey: item.idempotencyKey,
        ...(item.attachments && item.attachments.length > 0
          ? { attachments: item.attachments }
          : {}),
      });

      // Success — remove from outbox, notify caller to reconcile.
      await store.outbox.delete(outboxId);
      onDelivered(item.idempotencyKey, confirmed.id as string);
    } catch {
      const newAttempts = item.attempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        await store.outbox.update(outboxId, { state: 'failed', attempts: newAttempts });
        onFailed(item.idempotencyKey);
      } else {
        await store.outbox.update(outboxId, { attempts: newAttempts });
      }
      // STOP-ON-FAILURE: halt the drain here. The failed item (and all later
      // items) remain pending. A later message NEVER sends ahead of an
      // earlier un-sent one — in-order guarantee is preserved.
      return;
    }
  }
}

// ── Retry a failed item ───────────────────────────────────────────────────────

/**
 * Re-queue a failed outbox item for the next drain.
 * Resets state=pending and attempts=0 so it gets another MAX_ATTEMPTS rounds.
 */
export async function retryOutboxItem(store: StudyHallDB, idempotencyKey: string): Promise<void> {
  const items = await store.outbox.where('idempotencyKey').equals(idempotencyKey).toArray();
  const item = items[0];
  if (!item || item.id === undefined) return;
  await store.outbox.update(item.id, { state: 'pending', attempts: 0 });
}
