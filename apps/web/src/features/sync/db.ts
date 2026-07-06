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
  CachedChannel,
  CachedDmConversation,
  CachedDmMessage,
  CachedMessage,
  OutboxItem,
} from './types';

export class StudyHallDB extends Dexie {
  messages!: EntityTable<CachedMessage, 'id'>;
  channels!: EntityTable<CachedChannel, 'id'>;
  outbox!: EntityTable<OutboxItem, 'id'>;
  dmConversations!: EntityTable<CachedDmConversation, 'id'>;
  dmMessages!: EntityTable<CachedDmMessage, 'id'>;

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
  }
}

/**
 * Production singleton — guarded so build-time / SSR analysis does not throw.
 * In a pure browser Vite SPA (this project) it is always non-null at runtime.
 */
export const db: StudyHallDB | null = typeof indexedDB !== 'undefined' ? new StudyHallDB() : null;
