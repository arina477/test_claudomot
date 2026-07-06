/**
 * Dexie store row types for the wave-20 offline-first sync layer.
 *
 * CachedMessage and CachedChannel are the read-cache tables.
 * OutboxItem is the durable send queue.
 *
 * Type-only imports from @studyhall/shared — no CJS runtime values.
 */

import type {
  Assignment,
  DmConversation,
  DmMessage,
  MessageResponse,
  ScheduledSession,
} from '@studyhall/shared';

// ── Cache tables ──────────────────────────────────────────────────────────────

/**
 * CachedMessage — a MessageResponse persisted to local IDB.
 * `cachedAt` is added client-side for TTL / staleness decisions.
 */
export type CachedMessage = MessageResponse & {
  /** ISO timestamp of when the client stored this row. */
  cachedAt: string;
};

/**
 * CachedChannel — minimal channel descriptor stored locally.
 * Sourced from ChannelSummary — just enough to render the sidebar offline.
 */
export type CachedChannel = {
  id: string;
  serverId: string;
  name: string;
  type: string;
  isPrivate: boolean;
  position: number;
  cachedAt: string;
};

/**
 * CachedDmConversation — a DmConversation persisted to local IDB.
 * `cachedAt` is added client-side for TTL / staleness decisions.
 * DTO-intersection pattern: mirrors CachedMessage (NOT the hand-picked-subset
 * CachedChannel pattern) so all server-returned fields are preserved.
 */
export type CachedDmConversation = DmConversation & {
  /** ISO timestamp of when the client stored this row. */
  cachedAt: string;
};

/**
 * CachedDmMessage — a DmMessage persisted to local IDB.
 * `cachedAt` is added client-side for TTL / staleness decisions.
 * DTO-intersection pattern: mirrors CachedMessage exactly in shape.
 */
export type CachedDmMessage = DmMessage & {
  /** ISO timestamp of when the client stored this row. */
  cachedAt: string;
};

// ── Academic cache tables ─────────────────────────────────────────────────────

/**
 * CachedAssignment — an Assignment persisted to local IDB.
 * `cachedAt` is added client-side for TTL / staleness decisions.
 * DTO-intersection pattern: mirrors CachedDmConversation/CachedDmMessage in shape.
 */
export type CachedAssignment = Assignment & {
  /** ISO timestamp of when the client stored this row. */
  cachedAt: string;
};

/**
 * CachedScheduledSession — a ScheduledSession persisted to local IDB.
 * `cachedAt` is added client-side for TTL / staleness decisions.
 * DTO-intersection pattern: mirrors CachedAssignment in shape.
 *
 * Sessions are fetched as server-expanded weekly occurrences for a [from,to]
 * window. The cache is window-keyed via `cachedScheduledSessions` rows that
 * each carry a composite `windowKey` (`${serverId}|${from}|${to}`) so that
 * a query for a different window never returns stale data.
 */
export type CachedScheduledSession = ScheduledSession & {
  /** ISO timestamp of when the client stored this row. */
  cachedAt: string;
  /**
   * Window key: `${serverId}|${from}|${to}` — composite string used as the
   * Dexie index to scope retrievals to the exact fetch window. The cache.ts
   * helpers use this for put/get; callers must never query cross-window.
   */
  windowKey: string;
};

// ── Outbox table ──────────────────────────────────────────────────────────────

// ── Outbox routing key (wave-46 M8) ──────────────────────────────────────────

/**
 * OutboxTarget — discriminated union for the send destination.
 *
 * channel: the outbox item targets a server channel.
 *          SendFn dispatches to POST /channels/:channelId/messages.
 * dm:      the outbox item targets a DM conversation.
 *          SendFn dispatches to POST /dm/conversations/:conversationId/messages.
 *
 * Pre-M8 items in IDB will have a `channelId` field but no `target`.
 * The drain implementation handles this gracefully: if `target` is absent it
 * falls back to `{kind:'channel', channelId: item.channelId}`.
 */
export type OutboxTarget =
  | { kind: 'channel'; channelId: string }
  | { kind: 'dm'; conversationId: string };

/**
 * OutboxItem — a pending or failed outbound message held in the durable queue.
 *
 * `id` is an auto-incremented integer assigned by Dexie (PK `++id`).
 * `idempotencyKey` is a client-generated UUID created ONCE at enqueue time
 * and carried through all replay attempts — exactly-once via
 * ON CONFLICT(channel_id, idempotency_key) / ON CONFLICT(conversation_id, idempotency_key).
 *
 * Wave-46 addition: `target` discriminator replaces the `channelId`-only model.
 * `channelId` is kept as a legacy field so existing IDB rows decode cleanly.
 * New rows written by enqueue() always set `target`; callers should prefer
 * the `target` field. The drain() fallback handles rows where `target` is absent.
 */
export type OutboxItem = {
  /** Auto-increment integer PK — absent on `add()` input. */
  id?: number;
  /**
   * Wave-46: routing key discriminator — channel or DM.
   * Absent on pre-wave-46 rows (drain falls back to channelId).
   */
  target?: OutboxTarget;
  /**
   * Legacy channel send destination. Still used as primary field for channel
   * items (kept for backwards compat with pre-wave-46 IDB rows + the Dexie
   * index `channelId`). For DM items this is set to an empty string sentinel.
   */
  channelId: string;
  /** Stable UUID generated once at compose-time; never regenerated on retry. */
  idempotencyKey: string;
  content: string;
  /** ValidatedAttachment[] descriptors. Undefined when no attachments. */
  attachments?: Array<{
    key: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
  }>;
  /** 'pending' while queued; 'failed' after max-attempts exceeded. */
  state: 'pending' | 'failed';
  /** ISO timestamp of original enqueue — drain order anchor (oldest first). */
  createdAt: string;
  /** Delivery attempt count (starts at 0, increments on each attempt). */
  attempts: number;
};
