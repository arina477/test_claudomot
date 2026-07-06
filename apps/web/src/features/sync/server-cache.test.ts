/**
 * server-cache.test.ts — unit tests for the wave-65 server list + detail
 * offline cache substrate.
 *
 * Uses per-test IDBFactory injection from fake-indexeddb for hard isolation.
 * No shared state between tests — each gets a fresh in-memory IDB instance.
 *
 * Covers:
 *   - v4→v5 AND full v1→v5 upgrade PRESERVATION (named exit criterion):
 *       seed a row into each prior table on a v4-shaped DB, close, reopen at
 *       v5 on a SHARED IDBFactory, assert every prior table's ROWS survive
 *       (not just table existence — rows).
 *   - put→get round-trip for cachedServers + cachedServerDetails.
 *   - putCachedServers replace-semantics: a server present in the first list
 *     but absent from the second is pruned from cache.
 */

import type { ServerDetail, ServerSummary } from '@studyhall/shared';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getCachedServerDetail,
  getCachedServers,
  putCachedServerDetail,
  putCachedServers,
} from './cache';
import { StudyHallDB } from './db';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeServerSummary(overrides: Partial<ServerSummary> = {}): ServerSummary {
  return {
    id: 'srv-1',
    name: 'Test Server',
    ownerId: 'user-1',
    ...overrides,
  };
}

function makeServerDetail(serverId: string): ServerDetail {
  return {
    server: {
      id: serverId,
      name: 'Test Server',
      ownerId: 'user-1',
      inviteCode: null,
    },
    categories: [
      {
        id: 'cat-1',
        name: 'General',
        position: 0,
        channels: [
          {
            id: 'ch-1',
            name: 'general',
            type: 'text',
            isPrivate: false,
            position: 0,
          },
        ],
      },
    ],
  };
}

// ── round-trip: cachedServers ─────────────────────────────────────────────────

describe('StudyHallDB — cachedServers cache (round-trip)', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(() => {
    db.close();
  });

  it('writes and reads back a server list', async () => {
    const servers = [
      makeServerSummary({ id: 'srv-1', name: 'Alpha' }),
      makeServerSummary({ id: 'srv-2', name: 'Beta' }),
    ];
    await putCachedServers(db, servers);

    const result = await getCachedServers(db);
    expect(result).toHaveLength(2);
    const names = result.map((s) => s.name).sort();
    expect(names).toEqual(['Alpha', 'Beta']);
  });

  it('returns [] on a cold cache (no throw)', async () => {
    const result = await getCachedServers(db);
    expect(result).toEqual([]);
  });

  it('stamps cachedAt on write', async () => {
    const before = Date.now();
    await putCachedServers(db, [makeServerSummary()]);
    const result = await getCachedServers(db);
    expect(result[0]?.cachedAt).toBeDefined();
    const stamped = new Date(result[0]?.cachedAt ?? '').getTime();
    expect(stamped).toBeGreaterThanOrEqual(before);
  });

  it('upserts (put replaces existing row)', async () => {
    await putCachedServers(db, [makeServerSummary({ id: 'srv-1', name: 'Original' })]);
    await putCachedServers(db, [makeServerSummary({ id: 'srv-1', name: 'Updated' })]);
    const result = await getCachedServers(db);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Updated');
  });
});

// ── replace-semantics: pruning ────────────────────────────────────────────────

describe('putCachedServers — replace-semantics (LOAD-BEARING)', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(() => {
    db.close();
  });

  it('prunes a server absent from the second list', async () => {
    const list1 = [
      makeServerSummary({ id: 'srv-1', name: 'Alpha' }),
      makeServerSummary({ id: 'srv-2', name: 'Beta' }),
    ];
    await putCachedServers(db, list1);

    // Second put: srv-2 removed (user left the server).
    const list2 = [makeServerSummary({ id: 'srv-1', name: 'Alpha' })];
    await putCachedServers(db, list2);

    const result = await getCachedServers(db);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('srv-1');
  });

  it('a server added in the second put is present', async () => {
    await putCachedServers(db, [makeServerSummary({ id: 'srv-1', name: 'Alpha' })]);
    await putCachedServers(db, [
      makeServerSummary({ id: 'srv-1', name: 'Alpha' }),
      makeServerSummary({ id: 'srv-3', name: 'Gamma' }),
    ]);

    const result = await getCachedServers(db);
    expect(result).toHaveLength(2);
    const ids = result.map((s) => s.id).sort();
    expect(ids).toEqual(['srv-1', 'srv-3']);
  });
});

// ── round-trip: cachedServerDetails ──────────────────────────────────────────

describe('StudyHallDB — cachedServerDetails cache (round-trip)', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(() => {
    db.close();
  });

  it('writes and reads back a server detail', async () => {
    const detail = makeServerDetail('srv-1');
    await putCachedServerDetail(db, 'srv-1', detail);

    const result = await getCachedServerDetail(db, 'srv-1');
    expect(result).toBeDefined();
    expect(result?.id).toBe('srv-1');
    expect(result?.detail.server.name).toBe('Test Server');
    expect(result?.detail.categories).toHaveLength(1);
    expect(result?.detail.categories[0]?.channels).toHaveLength(1);
  });

  it('returns undefined on a cold cache (no throw)', async () => {
    const result = await getCachedServerDetail(db, 'srv-no-exist');
    expect(result).toBeUndefined();
  });

  it('stamps cachedAt on write', async () => {
    const before = Date.now();
    await putCachedServerDetail(db, 'srv-1', makeServerDetail('srv-1'));
    const result = await getCachedServerDetail(db, 'srv-1');
    expect(result?.cachedAt).toBeDefined();
    const stamped = new Date(result?.cachedAt ?? '').getTime();
    expect(stamped).toBeGreaterThanOrEqual(before);
  });

  it('upserts (put replaces existing row)', async () => {
    const detail1 = makeServerDetail('srv-1');
    const detail2: ServerDetail = {
      ...detail1,
      server: { ...detail1.server, name: 'Renamed Server' },
    };

    await putCachedServerDetail(db, 'srv-1', detail1);
    await putCachedServerDetail(db, 'srv-1', detail2);

    const result = await getCachedServerDetail(db, 'srv-1');
    expect(result?.detail.server.name).toBe('Renamed Server');
  });
});

// ── v4→v5 UPGRADE PRESERVATION (named exit criterion) ────────────────────────
//
// CRITICAL: seed a row into each of the eight prior tables on a v4-shaped DB,
// close, reopen at v5 on a SHARED IDBFactory, assert every prior table's ROWS
// survive intact (not just table existence — actual row data must be present).
// This is the rule-11 named exit criterion for wave-65 B-3.

describe('StudyHallDB — v4→v5 upgrade preservation (LOAD-BEARING)', () => {
  let factory: IDBFactory;

  beforeEach(() => {
    factory = new IDBFactory();
  });

  it('all eight v4 table rows survive the v4→v5 migration', async () => {
    // ── Step 1: Seed data (v4 snapshot) ──────────────────────────────────────
    // Open db1. Dexie runs all migrations v1→v5. We write one row into each of
    // the eight pre-v5 tables, then close and re-open with db2 to verify no
    // data loss.
    const db1 = new StudyHallDB(factory, IDBKeyRange);

    // v1 tables
    await db1.channels.put({
      id: 'ch-v5-preserve',
      serverId: 'srv-v5',
      name: 'preserve-chan',
      type: 'text',
      isPrivate: false,
      position: 0,
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.messages.put({
      id: 'msg-v5-preserve',
      channelId: 'ch-v5-preserve',
      authorId: 'user-v5',
      content: 'hello wave-65',
      createdAt: '2026-07-01T10:00:00.000Z',
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      reactions: [],
      mentions: [],
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.outbox.add({
      channelId: 'ch-v5-preserve',
      idempotencyKey: 'idem-v5-preserve',
      content: 'queued v5 message',
      state: 'pending',
      createdAt: '2026-07-01T10:00:00.000Z',
      attempts: 0,
    });

    // v2 tables
    await db1.dmConversations.put({
      id: 'dmconv-v5-preserve',
      isGroup: false,
      participants: [],
      lastMessage: null,
      createdAt: '2026-07-01T10:00:00.000Z',
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.dmMessages.put({
      id: 'dmmsg-v5-preserve',
      conversationId: 'dmconv-v5-preserve',
      authorId: 'user-v5',
      content: 'dm hello wave-65',
      createdAt: '2026-07-01T10:00:00.000Z',
      cachedAt: '2026-07-01T10:00:00.000Z',
    });

    // v3 tables
    await db1.cachedAssignments.put({
      id: 'asgn-v5-preserve',
      serverId: 'srv-v5',
      organizerId: 'user-org-v5',
      title: 'Preserved Assignment v5',
      description: null,
      dueDate: '2026-08-01T12:00:00.000Z',
      myStatus: 'todo',
      createdAt: '2026-07-01T10:00:00.000Z',
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.cachedScheduledSessions.put({
      id: 'sess-v5-preserve',
      serverId: 'srv-v5',
      organizerId: 'user-org-v5',
      title: 'Preserved Session v5',
      description: null,
      startsAt: '2026-08-05T10:00:00.000Z',
      endsAt: '2026-08-05T11:00:00.000Z',
      recurrence: 'none',
      recurrenceUntil: null,
      organizer: {
        userId: 'user-org-v5',
        displayName: 'Organizer V5',
        username: 'orgv5',
        avatarUrl: null,
      },
      createdAt: '2026-07-01T10:00:00.000Z',
      updatedAt: '2026-07-01T10:00:00.000Z',
      cachedAt: '2026-07-01T10:00:00.000Z',
      windowKey: 'srv-v5|2026-08-01|2026-08-07',
    });

    // v4 table
    await db1.cachedAttachmentBlobs.put({
      id: 'att-v5-preserve',
      blob: new Blob(['hello'], { type: 'image/png' }),
      contentType: 'image/png',
      filename: 'preserve.png',
      sizeBytes: 5,
      cachedAt: '2026-07-01T10:00:00.000Z',
    });

    db1.close();

    // ── Step 2: Re-open same IDB with a new StudyHallDB instance ─────────────
    const db2 = new StudyHallDB(factory, IDBKeyRange);

    try {
      // ── Step 3: Assert ALL eight pre-v5 rows survive intact ──────────────

      // v1: channel
      const channel = await db2.channels.get('ch-v5-preserve');
      expect(channel).toBeDefined();
      expect(channel?.name).toBe('preserve-chan');

      // v1: message
      const message = await db2.messages.get('msg-v5-preserve');
      expect(message).toBeDefined();
      expect(message?.content).toBe('hello wave-65');

      // v1: outbox
      const outboxItems = await db2.outbox
        .where('idempotencyKey')
        .equals('idem-v5-preserve')
        .toArray();
      expect(outboxItems).toHaveLength(1);
      expect(outboxItems[0]?.state).toBe('pending');
      expect(outboxItems[0]?.content).toBe('queued v5 message');

      // v2: dmConversation
      const dmConv = await db2.dmConversations.get('dmconv-v5-preserve');
      expect(dmConv).toBeDefined();
      expect(dmConv?.isGroup).toBe(false);

      // v2: dmMessage
      const dmMsg = await db2.dmMessages.get('dmmsg-v5-preserve');
      expect(dmMsg).toBeDefined();
      expect(dmMsg?.content).toBe('dm hello wave-65');

      // v3: cachedAssignment
      const asgn = await db2.cachedAssignments.get('asgn-v5-preserve');
      expect(asgn).toBeDefined();
      expect(asgn?.title).toBe('Preserved Assignment v5');

      // v3: cachedScheduledSession
      const sess = await db2.cachedScheduledSessions.get('sess-v5-preserve');
      expect(sess).toBeDefined();
      expect(sess?.title).toBe('Preserved Session v5');
      expect(sess?.windowKey).toBe('srv-v5|2026-08-01|2026-08-07');

      // v4: cachedAttachmentBlob
      const blob = await db2.cachedAttachmentBlobs.get('att-v5-preserve');
      expect(blob).toBeDefined();
      expect(blob?.filename).toBe('preserve.png');

      // ── Step 4: New v5 tables are available and empty (cold) ──────────────
      const servers = await db2.cachedServers.toArray();
      expect(servers).toHaveLength(0);
      const serverDetails = await db2.cachedServerDetails.toArray();
      expect(serverDetails).toHaveLength(0);
    } finally {
      db2.close();
    }
  });

  it('full v1→v5 upgrade: v5 tables accept writes without corrupting earlier rows', async () => {
    const db1 = new StudyHallDB(factory, IDBKeyRange);

    // Seed one row from each generation.
    await db1.channels.put({
      id: 'ch-fullpath',
      serverId: 'srv-fullpath',
      name: 'fullpath-chan',
      type: 'text',
      isPrivate: false,
      position: 0,
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.dmConversations.put({
      id: 'dmconv-fullpath',
      isGroup: false,
      participants: [],
      lastMessage: null,
      createdAt: '2026-07-01T10:00:00.000Z',
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.cachedAssignments.put({
      id: 'asgn-fullpath',
      serverId: 'srv-fullpath',
      organizerId: 'user-fullpath',
      title: 'Fullpath Assignment',
      description: null,
      dueDate: '2026-08-01T12:00:00.000Z',
      myStatus: 'todo',
      createdAt: '2026-07-01T10:00:00.000Z',
      cachedAt: '2026-07-01T10:00:00.000Z',
    });

    db1.close();

    const db2 = new StudyHallDB(factory, IDBKeyRange);

    try {
      // Write to the new v5 tables.
      await putCachedServers(db2, [makeServerSummary({ id: 'srv-fullpath', name: 'Fullpath' })]);
      await putCachedServerDetail(db2, 'srv-fullpath', makeServerDetail('srv-fullpath'));

      // All pre-v5 rows still present and unchanged.
      const channel = await db2.channels.get('ch-fullpath');
      expect(channel).toBeDefined();
      expect(channel?.name).toBe('fullpath-chan');

      const dmConv = await db2.dmConversations.get('dmconv-fullpath');
      expect(dmConv).toBeDefined();
      expect(dmConv?.isGroup).toBe(false);

      const asgn = await db2.cachedAssignments.get('asgn-fullpath');
      expect(asgn).toBeDefined();
      expect(asgn?.title).toBe('Fullpath Assignment');

      // v5 rows readable.
      const servers = await getCachedServers(db2);
      expect(servers).toHaveLength(1);
      expect(servers[0]?.id).toBe('srv-fullpath');

      const detail = await getCachedServerDetail(db2, 'srv-fullpath');
      expect(detail).toBeDefined();
      expect(detail?.detail.server.name).toBe('Test Server');
    } finally {
      db2.close();
    }
  });
});
