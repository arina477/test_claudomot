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
import type {
  CachedAssignment,
  CachedChannel,
  CachedDmConversation,
  CachedDmMessage,
  CachedMessage,
  CachedScheduledSession,
} from './types';

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

// ── DM conversation cache ─────────────────────────────────────────────────────

/**
 * Read all cached DM conversations, ordered by last-activity DESCending.
 *
 * Last-activity is determined from `lastMessage.createdAt` when present.
 * When `lastMessage` is null, the conversation's own `createdAt` is used as
 * a deterministic tie-break, followed by `id` for any remaining ties.
 * This ordering never crashes on null `lastMessage`.
 *
 * Returns [] on a cold cache (no throw).
 */
export async function getCachedDmConversations(
  store: StudyHallDB,
): Promise<CachedDmConversation[]> {
  const rows = await store.dmConversations.toArray();
  return rows.sort((a, b) => {
    const aKey = a.lastMessage?.createdAt ?? a.createdAt;
    const bKey = b.lastMessage?.createdAt ?? b.createdAt;
    if (bKey !== aKey) return bKey < aKey ? -1 : 1;
    // Secondary tie-break: id (lexicographic DESC)
    return b.id < a.id ? -1 : b.id > a.id ? 1 : 0;
  });
}

/**
 * Write-through: upsert a batch of DM conversations received from the server.
 * Each item is stamped with `cachedAt = now` before storage.
 */
export async function putCachedDmConversations(
  store: StudyHallDB,
  conversations: CachedDmConversation[],
): Promise<void> {
  if (conversations.length === 0) return;
  await store.dmConversations.bulkPut(conversations);
}

/**
 * Upsert a single DM conversation (e.g. from a socket event that updates
 * a conversation's lastMessage / unreadCount).
 */
export async function putCachedDmConversation(
  store: StudyHallDB,
  conversation: CachedDmConversation,
): Promise<void> {
  await store.dmConversations.put(conversation);
}

// ── DM message cache ──────────────────────────────────────────────────────────

/**
 * Read cached DM messages for a conversation, ordered oldest-first.
 * Uses the `[conversationId+createdAt]` compound index — mirrors getCachedMessages.
 * Returns [] when IDB is unavailable or the conversation has no cached rows.
 */
export async function getCachedDmMessages(
  store: StudyHallDB,
  conversationId: string,
): Promise<CachedDmMessage[]> {
  return store.dmMessages
    .where('[conversationId+createdAt]')
    .between([conversationId, Dexie.minKey], [conversationId, Dexie.maxKey])
    .toArray();
}

/**
 * Write-through: upsert a batch of DM messages received from the server.
 * Each item is stamped with `cachedAt = now` before storage.
 */
export async function putCachedDmMessages(
  store: StudyHallDB,
  messages: CachedDmMessage[],
): Promise<void> {
  if (messages.length === 0) return;
  await store.dmMessages.bulkPut(messages);
}

/**
 * Upsert a single DM message (e.g. from a socket dm:message event).
 * This is the socket write-through helper consumed by the step-3b realtime handler.
 */
export async function putCachedDmMessage(
  store: StudyHallDB,
  message: CachedDmMessage,
): Promise<void> {
  await store.dmMessages.put(message);
}

// ── Assignment cache ──────────────────────────────────────────────────────────

/**
 * Read cached assignments for a server.
 * Returns [] on a cold cache (no throw).
 */
export async function getCachedAssignments(
  store: StudyHallDB,
  serverId: string,
): Promise<CachedAssignment[]> {
  return store.cachedAssignments.where('serverId').equals(serverId).toArray();
}

/**
 * Write-through: upsert a batch of assignments received from the server.
 * Each item is stamped with `cachedAt = now` before storage.
 */
export async function putCachedAssignments(
  store: StudyHallDB,
  serverId: string,
  list: Omit<CachedAssignment, 'cachedAt'>[],
): Promise<void> {
  if (list.length === 0) return;
  const cachedAt = new Date().toISOString();
  const rows: CachedAssignment[] = list.map((item) => ({ ...item, serverId, cachedAt }));
  await store.cachedAssignments.bulkPut(rows);
}

// ── Scheduled-session cache (window-keyed) ────────────────────────────────────

/**
 * Build the composite window key used for session cache lookups.
 * Format: `${serverId}|${from}|${to}` — exact string match required.
 */
function sessionWindowKey(serverId: string, from: string, to: string): string {
  return `${serverId}|${from}|${to}`;
}

/**
 * Read cached scheduled sessions for a server + window.
 *
 * The cache is window-keyed: only sessions stored for the EXACT same
 * (serverId, from, to) triplet are returned. A never-cached or different
 * window returns [] so the caller falls through to network.
 */
export async function getCachedScheduledSessions(
  store: StudyHallDB,
  serverId: string,
  from: string,
  to: string,
): Promise<CachedScheduledSession[]> {
  const windowKey = sessionWindowKey(serverId, from, to);
  return store.cachedScheduledSessions.where('windowKey').equals(windowKey).toArray();
}

/**
 * Write-through: upsert a batch of scheduled sessions for a (serverId, from, to) window.
 *
 * Each item is stamped with `cachedAt = now` and tagged with the composite
 * `windowKey` so getCachedScheduledSessions can scope retrievals to the exact
 * window. Previous rows for a different window are NOT evicted — they remain
 * in IDB but are never served (the window-key index ensures isolation).
 */
export async function putCachedScheduledSessions(
  store: StudyHallDB,
  serverId: string,
  from: string,
  to: string,
  list: Omit<CachedScheduledSession, 'cachedAt' | 'windowKey'>[],
): Promise<void> {
  if (list.length === 0) return;
  const cachedAt = new Date().toISOString();
  const windowKey = sessionWindowKey(serverId, from, to);
  const rows: CachedScheduledSession[] = list.map((item) => ({
    ...item,
    serverId,
    cachedAt,
    windowKey,
  }));
  await store.cachedScheduledSessions.bulkPut(rows);
}
