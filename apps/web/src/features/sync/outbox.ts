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
import type { OutboxItem } from './types';

// POST callback type — matches api.sendMessage signature without binding api.
export type SendFn = (
  channelId: string,
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
 * - Generates a stable idempotencyKey (UUID) ONCE here.
 * - Does NOT check for duplicates — callers are responsible for not
 *   double-enqueueing the same compose action.
 * - Returns { id (outbox PK), idempotencyKey } so the caller can wire the
 *   optimistic message row.
 */
export async function enqueue(
  store: StudyHallDB,
  channelId: string,
  content: string,
  attachments?: OutboxItem['attachments'],
): Promise<{ id: number; idempotencyKey: string }> {
  const idempotencyKey = crypto.randomUUID();
  const now = new Date().toISOString();

  const item: Omit<OutboxItem, 'id'> = {
    channelId,
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
 * Drain all pending outbox items: POST each SEQUENTIALLY (oldest-first),
 * delete on success, increment attempts / mark failed on error.
 *
 * onDelivered — called after each successful POST so useMessages can
 *               reconcile the optimistic row with the server-confirmed message.
 * onFailed    — called when an item exceeds MAX_ATTEMPTS so useMessages
 *               can flip the optimistic row to 'failed'.
 *
 * Sequential by design — prevents out-of-order delivery on the server.
 */
export async function drain(
  store: StudyHallDB,
  send: SendFn,
  onDelivered: (idempotencyKey: string, confirmedId: string) => void,
  onFailed: (idempotencyKey: string) => void,
): Promise<void> {
  // Snapshot pending items oldest-first before the loop.
  const pending = await store.outbox
    .where('[state+createdAt]')
    .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
    .toArray();

  for (const item of pending) {
    // id is assigned by Dexie auto-increment — always present after add().
    const outboxId = item.id as number;

    try {
      const confirmed = await send(item.channelId, {
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
      // Continue draining next item even on failure — partial drain.
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
