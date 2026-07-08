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
  ServerDetail,
  ServerSummary,
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

// ── Server cache ──────────────────────────────────────────────────────────────

/**
 * CachedServer — a ServerSummary persisted to local IDB.
 * `cachedAt` is added client-side for TTL / staleness decisions.
 * DTO-intersection pattern: mirrors CachedAssignment/CachedDmConversation in shape.
 */
export type CachedServer = ServerSummary & {
  /** ISO timestamp of when the client stored this row. */
  cachedAt: string;
};

/**
 * CachedServerDetail — a ServerDetail (categories + channels) persisted to local IDB.
 *
 * ServerDetail does NOT carry a top-level `id` field (its shape is
 * `{ server: ServerSummaryWithInvite; categories: CategoryWithChannels[] }`),
 * so the detail is wrapped in a container that provides the primary key.
 * The `id` matches the server id (i.e. detail.server.id).
 */
export type CachedServerDetail = {
  /** Server id — primary key. Matches detail.server.id. */
  id: string;
  /** Full server detail payload (categories + channels). */
  detail: ServerDetail;
  /** ISO timestamp of when the client stored this row. */
  cachedAt: string;
};

// ── Attachment media blob cache ───────────────────────────────────────────────

/**
 * CachedAttachmentBlob — a binary attachment payload persisted to local IDB.
 *
 * The Blob is stored directly; Dexie/IndexedDB supports structured-clone of
 * Blob values natively. `sizeBytes` is stored alongside so the per-item cap
 * check in putCachedAttachmentBlob can be enforced at read-time as well.
 *
 * Only blobs at or below MAX_CACHED_BLOB_BYTES (10 MiB) are ever written.
 * The put helper enforces this: oversized records are silently dropped.
 */
export type CachedAttachmentBlob = {
  /** Attachment id — primary key, matches the server attachment descriptor. */
  id: string;
  /** Raw binary payload. */
  blob: Blob;
  /** MIME type string (e.g. "image/png"). */
  contentType: string;
  /** Original filename as returned by the server. */
  filename: string;
  /** Size of the blob in bytes. Stored for cap enforcement + diagnostics. */
  sizeBytes: number;
  /** ISO timestamp of when the client stored this row. */
  cachedAt: string;
};

// ── E2E DM encryption keypair store (wave-79) ─────────────────────────────────

/**
 * StoredKeypair — the device-local ECDH-P256 keypair for E2E DM encryption.
 *
 * Singleton store keyed by the constant id 'self'. The PRIVATE key is a
 * non-extractable CryptoKey held directly in IndexedDB (structured-clone
 * supports CryptoKey) so its raw bytes NEVER leave the browser and can never
 * be serialized into a network request. Only `publicKeyBase64` (the exported
 * SPKI public material) is ever transmitted — via PUT /profile/encryption-key.
 */
export type StoredKeypair = {
  /** Singleton primary key — always the literal 'self'. */
  id: 'self';
  /** Non-extractable ECDH-P256 private key — device-local, never exported. */
  privateKey: CryptoKey;
  /** ECDH-P256 public key handle (kept for local re-derivation convenience). */
  publicKey: CryptoKey;
  /** Base64 SPKI export of the public key — the value registered server-side. */
  publicKeyBase64: string;
  /** ISO timestamp of keypair generation. */
  createdAt: string;
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
