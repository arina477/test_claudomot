/**
 * cache.ts — read-through cache helpers for messages and channels.
 *
 * All functions are no-ops (return empty / void) when the Dexie singleton
 * is null (build time, Node without IDB shim). Callers fall through to
 * network as normal.
 *
 * Write-through contract:
 *   - After a successful GET, call putCachedMessages / putCachedChannel.
 *   - On offline / fetch-fail, call getCachedMessages / getCachedChannel
 *     to serve the last-seen snapshot rather than a blank view.
 */

import Dexie from 'dexie';
import type { StudyHallDB } from './db';
import type { CachedChannel, CachedMessage } from './types';

// ── Message cache ─────────────────────────────────────────────────────────────

/**
 * Read cached messages for a channel, ordered oldest-first.
 * Returns [] when IDB is unavailable or the channel has no cached rows.
 */
export async function getCachedMessages(
  store: StudyHallDB,
  channelId: string,
): Promise<CachedMessage[]> {
  return store.messages
    .where('[channelId+createdAt]')
    .between([channelId, Dexie.minKey], [channelId, Dexie.maxKey])
    .toArray();
}

/**
 * Write-through: upsert a batch of messages received from the server.
 * Each item is stamped with `cachedAt = now` before storage.
 */
export async function putCachedMessages(
  store: StudyHallDB,
  messages: CachedMessage[],
): Promise<void> {
  if (messages.length === 0) return;
  await store.messages.bulkPut(messages);
}

/**
 * Upsert a single message (e.g. from a socket message:new event).
 */
export async function putCachedMessage(store: StudyHallDB, message: CachedMessage): Promise<void> {
  await store.messages.put(message);
}

// ── Channel cache ─────────────────────────────────────────────────────────────

/**
 * Read a cached channel descriptor by id.
 * Returns undefined when not cached.
 */
export async function getCachedChannel(
  store: StudyHallDB,
  channelId: string,
): Promise<CachedChannel | undefined> {
  return store.channels.get(channelId);
}

/**
 * Write-through: upsert a channel descriptor received from the server.
 */
export async function putCachedChannel(store: StudyHallDB, channel: CachedChannel): Promise<void> {
  await store.channels.put(channel);
}
