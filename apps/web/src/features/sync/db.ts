/**
 * StudyHallDB — Dexie subclass for wave-20 offline-first storage.
 *
 * Tables:
 *   messages  — cached channel messages (read cache + catch-up seed)
 *   channels  — cached channel descriptors (sidebar offline render)
 *   outbox    — durable send queue (pending/failed outbound messages)
 *
 * Constructor accepts optional idbFactory + idbKeyRange for per-test isolation
 * with fake-indexeddb. Per Dexie SDK-doc: both `indexedDB` AND `IDBKeyRange`
 * must be co-injected; passing only IDBFactory causes a MissingAPIError in Node.
 *
 * The idbKeyRange parameter is typed as `typeof IDBKeyRange` (the static class
 * itself, not an instance) — this is what Dexie's constructor options expect.
 * In tests, pass the `IDBKeyRange` export from fake-indexeddb.
 * The production singleton passes no overrides (uses browser globals).
 *
 * Lazy/guarded singleton: `db` is null when IndexedDB is unavailable
 * (Vite build analysis, Node without fake-indexeddb). In the browser
 * (pure Vite SPA) it is always non-null at runtime.
 */

import Dexie, { type EntityTable } from 'dexie';
import type {
  CachedAssignment,
  CachedAttachmentBlob,
  CachedChannel,
  CachedDmConversation,
  CachedDmMessage,
  CachedMessage,
  CachedScheduledSession,
  CachedServer,
  CachedServerDetail,
  OutboxItem,
  StoredKeypair,
} from './types';

export class StudyHallDB extends Dexie {
  messages!: EntityTable<CachedMessage, 'id'>;
  channels!: EntityTable<CachedChannel, 'id'>;
  outbox!: EntityTable<OutboxItem, 'id'>;
  dmConversations!: EntityTable<CachedDmConversation, 'id'>;
  dmMessages!: EntityTable<CachedDmMessage, 'id'>;
  cachedAssignments!: EntityTable<CachedAssignment, 'id'>;
  cachedScheduledSessions!: EntityTable<CachedScheduledSession, 'id'>;
  cachedAttachmentBlobs!: EntityTable<CachedAttachmentBlob, 'id'>;
  cachedServers!: EntityTable<CachedServer, 'id'>;
  cachedServerDetails!: EntityTable<CachedServerDetail, 'id'>;
  encryptionKeys!: EntityTable<StoredKeypair, 'id'>;

  constructor(
    idbFactory?: IDBFactory,
    // typeof IDBKeyRange — the static class itself, not an instance.
    // In tests: pass `IDBKeyRange` from fake-indexeddb.
    idbKeyRange?: typeof IDBKeyRange,
  ) {
    if (idbFactory && idbKeyRange) {
      super('studyhall', { indexedDB: idbFactory, IDBKeyRange: idbKeyRange });
    } else {
      super('studyhall');
    }

    /**
     * v1 schema — wave-20 initial shape.
     *
     * messages:
     *   id                    — primary key (string UUID from server)
     *   channelId             — filter by channel
     *   [channelId+createdAt] — compound index for ordered channel reads (oldest-first)
     *   createdAt             — global time-based queries + cache eviction
     *
     * channels:
     *   id       — primary key
     *   serverId — filter by server
     *
     * outbox:
     *   ++id                — auto-increment integer PK
     *   channelId           — filter by channel
     *   idempotencyKey      — dedup check before enqueue
     *   state               — filter pending vs failed
     *   [state+createdAt]   — compound index for oldest-first drain of pending items
     */
    this.version(1).stores({
      messages: 'id, channelId, [channelId+createdAt], createdAt',
      channels: 'id, serverId',
      outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]',
    });

    /**
     * v2 schema — wave-62 DM offline cache addition.
     *
     * CRITICAL: v1 tables are re-stated VERBATIM (Dexie cumulative-declarative —
     * omitting a table in a later version deletes it and all its data).
     *
     * dmConversations:
     *   id            — primary key (string UUID from server)
     *   createdAt     — tie-break for ordering when lastMessage is null;
     *                   JS-side sort produces last-activity DESC (see cache.ts)
     *
     * dmMessages:
     *   id                         — primary key (string UUID from server)
     *   conversationId             — filter by conversation
     *   [conversationId+createdAt] — compound index for ordered thread reads (oldest-first)
     *                                mirrors messages.[channelId+createdAt] exactly
     *   createdAt                  — global time-based queries + cache eviction
     */
    this.version(2).stores({
      messages: 'id, channelId, [channelId+createdAt], createdAt',
      channels: 'id, serverId',
      outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]',
      dmConversations: 'id, createdAt',
      dmMessages: 'id, conversationId, [conversationId+createdAt], createdAt',
    });

    /**
     * v3 schema — wave-63 academic offline cache addition.
     *
     * CRITICAL: ALL FIVE v1+v2 tables are re-stated VERBATIM below.
     * (Dexie cumulative-declarative — omitting ANY table in a later version
     * deletes it and ALL its data on upgrade. Zero tolerance for omissions.)
     *
     * cachedAssignments:
     *   id       — primary key (string UUID from server)
     *   serverId — filter by server (mirrors channels: 'id, serverId' pattern)
     *
     * cachedScheduledSessions:
     *   id        — primary key (string UUID of the expanded occurrence)
     *   serverId  — filter by server
     *   windowKey — composite string `${serverId}|${from}|${to}` for window-
     *               scoped retrieval; the get/put helpers use this index to
     *               serve only the exact previously-fetched [from,to] window.
     *               A query for a different (from,to) window returns [] cold
     *               rather than serving a mismatched expansion.
     */
    this.version(3).stores({
      messages: 'id, channelId, [channelId+createdAt], createdAt',
      channels: 'id, serverId',
      outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]',
      dmConversations: 'id, createdAt',
      dmMessages: 'id, conversationId, [conversationId+createdAt], createdAt',
      cachedAssignments: 'id, serverId',
      cachedScheduledSessions: 'id, serverId, windowKey',
    });

    /**
     * v4 schema — wave-64 attachment media blob cache addition.
     *
     * CRITICAL: ALL SEVEN v1+v2+v3 tables are re-stated VERBATIM below.
     * (Dexie cumulative-declarative — omitting ANY table in a later version
     * deletes it and ALL its data on upgrade. Zero tolerance for omissions.)
     *
     * cachedAttachmentBlobs:
     *   id       — primary key (attachment id from the server descriptor)
     *   cachedAt — ISO timestamp for cache-age queries / eviction ordering
     *
     * Blob values are stored directly; IndexedDB structured-clone supports them.
     * Only blobs at or below MAX_CACHED_BLOB_BYTES (10 MiB) are ever written
     * (enforced by putCachedAttachmentBlob in cache.ts).
     */
    this.version(4).stores({
      messages: 'id, channelId, [channelId+createdAt], createdAt',
      channels: 'id, serverId',
      outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]',
      dmConversations: 'id, createdAt',
      dmMessages: 'id, conversationId, [conversationId+createdAt], createdAt',
      cachedAssignments: 'id, serverId',
      cachedScheduledSessions: 'id, serverId, windowKey',
      cachedAttachmentBlobs: 'id, cachedAt',
    });

    /**
     * v5 schema — wave-65 server list + detail offline cache addition.
     *
     * CRITICAL: ALL EIGHT v1+v2+v3+v4 tables are re-stated VERBATIM below.
     * (Dexie cumulative-declarative — omitting ANY table in a later version
     * deletes it and ALL its data on upgrade. Zero tolerance for omissions.
     * BUILD-PRINCIPLES rule 11 is MANDATORY AND LOAD-BEARING.)
     *
     * cachedServers:
     *   id — primary key (server id string)
     *
     * cachedServerDetails:
     *   id — primary key (server id string — matches the wrapped detail.server.id)
     */
    this.version(5).stores({
      messages: 'id, channelId, [channelId+createdAt], createdAt',
      channels: 'id, serverId',
      outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]',
      dmConversations: 'id, createdAt',
      dmMessages: 'id, conversationId, [conversationId+createdAt], createdAt',
      cachedAssignments: 'id, serverId',
      cachedScheduledSessions: 'id, serverId, windowKey',
      cachedAttachmentBlobs: 'id, cachedAt',
      cachedServers: 'id',
      cachedServerDetails: 'id',
    });

    /**
     * v6 schema — wave-79 E2E DM encryption keypair store.
     *
     * CRITICAL: ALL TEN v1..v5 tables are re-stated VERBATIM below.
     * (Dexie cumulative-declarative — omitting ANY table in a later version
     * deletes it and ALL its data on upgrade. Zero tolerance for omissions.
     * BUILD-PRINCIPLES rule 11 is MANDATORY AND LOAD-BEARING.)
     *
     * encryptionKeys:
     *   id — primary key. Singleton store: the row is keyed by the constant
     *        'self' so exactly one active keypair exists per device/origin.
     *        The CryptoKey pair is stored directly; IndexedDB structured-clone
     *        supports non-extractable CryptoKey values natively — so the PRIVATE
     *        key material is NEVER serialized to bytes and NEVER leaves the
     *        browser. Only the PUBLIC key is exported (base64 SPKI) for registry.
     */
    this.version(6).stores({
      messages: 'id, channelId, [channelId+createdAt], createdAt',
      channels: 'id, serverId',
      outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]',
      dmConversations: 'id, createdAt',
      dmMessages: 'id, conversationId, [conversationId+createdAt], createdAt',
      cachedAssignments: 'id, serverId',
      cachedScheduledSessions: 'id, serverId, windowKey',
      cachedAttachmentBlobs: 'id, cachedAt',
      cachedServers: 'id',
      cachedServerDetails: 'id',
      encryptionKeys: 'id',
    });
  }
}

/**
 * Production singleton — guarded so build-time / SSR analysis does not throw.
 * In a pure browser Vite SPA (this project) it is always non-null at runtime.
 */
export const db: StudyHallDB | null = typeof indexedDB !== 'undefined' ? new StudyHallDB() : null;
