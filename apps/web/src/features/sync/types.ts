/**
 * Dexie store row types for the wave-20 offline-first sync layer.
 *
 * CachedMessage and CachedChannel are the read-cache tables.
 * OutboxItem is the durable send queue.
 *
 * Type-only imports from @studyhall/shared — no CJS runtime values.
 */

import type { MessageResponse } from '@studyhall/shared';

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

// ── Outbox table ──────────────────────────────────────────────────────────────

/**
 * OutboxItem — a pending or failed outbound message held in the durable queue.
 *
 * `id` is an auto-incremented integer assigned by Dexie (PK `++id`).
 * `idempotencyKey` is a client-generated UUID created ONCE at enqueue time
 * and carried through all replay attempts — exactly-once via
 * ON CONFLICT(channel_id, idempotency_key) on the server.
 */
export type OutboxItem = {
  /** Auto-increment integer PK — absent on `add()` input. */
  id?: number;
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
