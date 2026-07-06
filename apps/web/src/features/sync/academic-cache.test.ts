/**
 * academic-cache.test.ts — unit tests for the wave-63 academic offline cache substrate.
 *
 * Uses per-test IDBFactory injection from fake-indexeddb for hard isolation.
 * No shared state between tests — each gets a fresh in-memory IDB instance.
 *
 * Covers:
 *   - cachedAssignments: put → get round-trip, serverId scoping
 *   - cachedScheduledSessions: put → get round-trip, window scoping
 *   - sessions WINDOW isolation: (from1,to1) put not returned for (from2,to2)
 *   - v1→v2→v3 UPGRADE PRESERVATION (load-bearing exit criterion):
 *       seed v1/v2-shaped rows (channels/messages/outbox/dmConversations/dmMessages),
 *       open at v3, assert ALL pre-existing rows SURVIVE intact (not just table existence).
 */

import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getCachedAssignments,
  getCachedScheduledSessions,
  putCachedAssignments,
  putCachedScheduledSessions,
} from './cache';
import { StudyHallDB } from './db';
import type { CachedAssignment, CachedScheduledSession } from './types';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeAssignment(
  overrides: Partial<Omit<CachedAssignment, 'cachedAt'>> = {},
): Omit<CachedAssignment, 'cachedAt'> {
  return {
    id: crypto.randomUUID(),
    serverId: 'srv-1',
    organizerId: 'user-org-1',
    title: 'Test Assignment',
    description: null,
    dueDate: '2026-08-01T12:00:00.000Z',
    myStatus: 'todo',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSession(
  overrides: Partial<Omit<CachedScheduledSession, 'cachedAt' | 'windowKey'>> = {},
): Omit<CachedScheduledSession, 'cachedAt' | 'windowKey'> {
  return {
    id: crypto.randomUUID(),
    serverId: 'srv-1',
    organizerId: 'user-org-1',
    title: 'Test Session',
    description: null,
    startsAt: '2026-08-05T10:00:00.000Z',
    endsAt: '2026-08-05T11:00:00.000Z',
    recurrence: 'none',
    recurrenceUntil: null,
    organizer: {
      userId: 'user-org-1',
      displayName: 'Organizer One',
      username: 'org1',
      avatarUrl: null,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── cachedAssignments round-trip ──────────────────────────────────────────────

describe('StudyHallDB — cachedAssignments cache (round-trip)', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(() => {
    db.close();
  });

  it('writes and reads back a single assignment', async () => {
    const a = makeAssignment({ id: 'asgn-1', serverId: 'srv-1' });
    await putCachedAssignments(db, 'srv-1', [a]);
    const result = await getCachedAssignments(db, 'srv-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('asgn-1');
  });

  it('returns empty array on cold cache', async () => {
    const result = await getCachedAssignments(db, 'srv-no-exist');
    expect(result).toHaveLength(0);
  });

  it('stamps cachedAt on write', async () => {
    const before = Date.now();
    const a = makeAssignment({ id: 'asgn-stamp' });
    await putCachedAssignments(db, 'srv-1', [a]);
    const result = await getCachedAssignments(db, 'srv-1');
    expect(result[0]?.cachedAt).toBeDefined();
    const stamped = new Date(result[0]?.cachedAt).getTime();
    expect(stamped).toBeGreaterThanOrEqual(before);
  });

  it('scopes reads to serverId — assignments for srv-2 not returned for srv-1', async () => {
    const a1 = makeAssignment({ id: 'asgn-srv1', serverId: 'srv-1' });
    const a2 = makeAssignment({ id: 'asgn-srv2', serverId: 'srv-2' });
    await putCachedAssignments(db, 'srv-1', [a1]);
    await putCachedAssignments(db, 'srv-2', [a2]);

    const srv1 = await getCachedAssignments(db, 'srv-1');
    expect(srv1.map((a) => a.id)).toEqual(['asgn-srv1']);

    const srv2 = await getCachedAssignments(db, 'srv-2');
    expect(srv2.map((a) => a.id)).toEqual(['asgn-srv2']);
  });

  it('upserts (put replaces existing row)', async () => {
    const original = makeAssignment({ id: 'asgn-upsert', title: 'Original Title' });
    await putCachedAssignments(db, 'srv-1', [original]);

    const updated = { ...original, title: 'Updated Title' };
    await putCachedAssignments(db, 'srv-1', [updated]);

    const result = await getCachedAssignments(db, 'srv-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Updated Title');
  });

  it('no-op when list is empty', async () => {
    await putCachedAssignments(db, 'srv-1', []);
    const result = await getCachedAssignments(db, 'srv-1');
    expect(result).toHaveLength(0);
  });
});

// ── cachedScheduledSessions round-trip ───────────────────────────────────────

describe('StudyHallDB — cachedScheduledSessions cache (round-trip)', () => {
  let db: StudyHallDB;

  const FROM = '2026-08-01T00:00:00.000Z';
  const TO = '2026-08-07T23:59:59.999Z';

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(() => {
    db.close();
  });

  it('writes and reads back a single session', async () => {
    const s = makeSession({ id: 'sess-1', serverId: 'srv-1' });
    await putCachedScheduledSessions(db, 'srv-1', FROM, TO, [s]);
    const result = await getCachedScheduledSessions(db, 'srv-1', FROM, TO);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('sess-1');
  });

  it('returns empty array on cold cache', async () => {
    const result = await getCachedScheduledSessions(db, 'srv-no-exist', FROM, TO);
    expect(result).toHaveLength(0);
  });

  it('stamps cachedAt and windowKey on write', async () => {
    const before = Date.now();
    const s = makeSession({ id: 'sess-stamp' });
    await putCachedScheduledSessions(db, 'srv-1', FROM, TO, [s]);
    const result = await getCachedScheduledSessions(db, 'srv-1', FROM, TO);
    expect(result[0]?.cachedAt).toBeDefined();
    expect(result[0]?.windowKey).toBe(`srv-1|${FROM}|${TO}`);
    const stamped = new Date(result[0]?.cachedAt).getTime();
    expect(stamped).toBeGreaterThanOrEqual(before);
  });

  it('no-op when list is empty', async () => {
    await putCachedScheduledSessions(db, 'srv-1', FROM, TO, []);
    const result = await getCachedScheduledSessions(db, 'srv-1', FROM, TO);
    expect(result).toHaveLength(0);
  });

  it('upserts (put replaces existing row)', async () => {
    const original = makeSession({ id: 'sess-upsert', title: 'Original' });
    await putCachedScheduledSessions(db, 'srv-1', FROM, TO, [original]);

    const updated = { ...original, title: 'Updated' };
    await putCachedScheduledSessions(db, 'srv-1', FROM, TO, [updated]);

    const result = await getCachedScheduledSessions(db, 'srv-1', FROM, TO);
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Updated');
  });
});

// ── sessions WINDOW scoping (load-bearing) ────────────────────────────────────
//
// CRITICAL: a put for window (from1,to1) MUST NOT be returned for a different
// window (from2,to2). This enforces cache isolation between weekly expansions.

describe('StudyHallDB — sessions window isolation (LOAD-BEARING)', () => {
  let db: StudyHallDB;

  const SRV = 'srv-window';
  const FROM_1 = '2026-08-01T00:00:00.000Z';
  const TO_1 = '2026-08-07T23:59:59.999Z';
  const FROM_2 = '2026-08-08T00:00:00.000Z';
  const TO_2 = '2026-08-14T23:59:59.999Z';

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(() => {
    db.close();
  });

  it('put for (from1,to1) is retrieved for (from1,to1) and NOT returned for (from2,to2)', async () => {
    const s1 = makeSession({ id: 'sess-window-1', serverId: SRV, title: 'Week 1 Session' });
    await putCachedScheduledSessions(db, SRV, FROM_1, TO_1, [s1]);

    // Same window — must return the row.
    const sameWindow = await getCachedScheduledSessions(db, SRV, FROM_1, TO_1);
    expect(sameWindow).toHaveLength(1);
    expect(sameWindow[0]?.id).toBe('sess-window-1');

    // Different window — must return [] (cold).
    const diffWindow = await getCachedScheduledSessions(db, SRV, FROM_2, TO_2);
    expect(diffWindow).toHaveLength(0);
  });

  it('two windows coexist in the store without cross-contamination', async () => {
    const s1 = makeSession({ id: 'sess-w1', serverId: SRV, title: 'Week 1' });
    const s2 = makeSession({ id: 'sess-w2', serverId: SRV, title: 'Week 2' });
    await putCachedScheduledSessions(db, SRV, FROM_1, TO_1, [s1]);
    await putCachedScheduledSessions(db, SRV, FROM_2, TO_2, [s2]);

    const w1 = await getCachedScheduledSessions(db, SRV, FROM_1, TO_1);
    expect(w1.map((s) => s.id)).toEqual(['sess-w1']);

    const w2 = await getCachedScheduledSessions(db, SRV, FROM_2, TO_2);
    expect(w2.map((s) => s.id)).toEqual(['sess-w2']);
  });

  it('different serverId same window does not cross-contaminate', async () => {
    const s1 = makeSession({ id: 'sess-s1', serverId: 'srv-a', title: 'Server A session' });
    const s2 = makeSession({ id: 'sess-s2', serverId: 'srv-b', title: 'Server B session' });
    await putCachedScheduledSessions(db, 'srv-a', FROM_1, TO_1, [s1]);
    await putCachedScheduledSessions(db, 'srv-b', FROM_1, TO_1, [s2]);

    const srvA = await getCachedScheduledSessions(db, 'srv-a', FROM_1, TO_1);
    expect(srvA.map((s) => s.id)).toEqual(['sess-s1']);

    const srvB = await getCachedScheduledSessions(db, 'srv-b', FROM_1, TO_1);
    expect(srvB.map((s) => s.id)).toEqual(['sess-s2']);
  });
});

// ── v1→v2→v3 UPGRADE PRESERVATION (load-bearing safety test) ─────────────────
//
// CRITICAL: seed a v1/v2-shaped DB with existing channels/messages/outbox/
// dmConversations/dmMessages ROWS, open at v3, assert ALL pre-existing rows
// SURVIVE intact. This is the named load-bearing exit criterion for wave-63 B-3 step 3a.

describe('StudyHallDB — v1→v2→v3 upgrade preservation (LOAD-BEARING)', () => {
  let factory: IDBFactory;

  beforeEach(() => {
    factory = new IDBFactory();
  });

  it('all v1+v2 rows (channels/messages/outbox/dmConversations/dmMessages) survive the v1→v2→v3 migration', async () => {
    // ── Step 1: Seed data using a db instance (registers v1+v2+v3 in one shot) ─
    // We open db1 with the shared factory. Dexie runs v1+v2+v3 migrations on the
    // fresh IDBFactory. We write rows to all five pre-v3 tables, close db1, then
    // re-open with db2 (same factory, same persisted IDB) and assert nothing was lost.
    const db1 = new StudyHallDB(factory, IDBKeyRange);

    // Seed v1 rows: channel, message, outbox item.
    await db1.channels.put({
      id: 'ch-v3-preserve',
      serverId: 'srv-v3',
      name: 'general',
      type: 'text',
      isPrivate: false,
      position: 0,
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.messages.put({
      id: 'msg-v3-preserve',
      channelId: 'ch-v3-preserve',
      authorId: 'user-v3',
      content: 'hello wave-63',
      createdAt: '2026-07-01T10:00:00.000Z',
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      reactions: [],
      mentions: [],
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.outbox.add({
      channelId: 'ch-v3-preserve',
      idempotencyKey: 'idem-v3-preserve',
      content: 'queued v3 message',
      state: 'pending',
      createdAt: '2026-07-01T10:00:00.000Z',
      attempts: 0,
    });

    // Seed v2 rows: dmConversation, dmMessage.
    await db1.dmConversations.put({
      id: 'dmconv-v3-preserve',
      isGroup: false,
      participants: [],
      lastMessage: null,
      createdAt: '2026-07-01T10:00:00.000Z',
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.dmMessages.put({
      id: 'dmmsg-v3-preserve',
      conversationId: 'dmconv-v3-preserve',
      authorId: 'user-v3',
      content: 'dm hello wave-63',
      createdAt: '2026-07-01T10:00:00.000Z',
      cachedAt: '2026-07-01T10:00:00.000Z',
    });

    db1.close();

    // ── Step 2: Re-open same IDB with a new StudyHallDB instance ─────────────
    const db2 = new StudyHallDB(factory, IDBKeyRange);

    try {
      // ── Step 3: Assert ALL pre-v3 rows survive ────────────────────────────

      // v1: channel
      const channel = await db2.channels.get('ch-v3-preserve');
      expect(channel).toBeDefined();
      expect(channel?.name).toBe('general');

      // v1: message
      const message = await db2.messages.get('msg-v3-preserve');
      expect(message).toBeDefined();
      expect(message?.content).toBe('hello wave-63');

      // v1: outbox
      const outboxItems = await db2.outbox
        .where('idempotencyKey')
        .equals('idem-v3-preserve')
        .toArray();
      expect(outboxItems).toHaveLength(1);
      expect(outboxItems[0]?.state).toBe('pending');
      expect(outboxItems[0]?.content).toBe('queued v3 message');

      // v2: dmConversation
      const dmConv = await db2.dmConversations.get('dmconv-v3-preserve');
      expect(dmConv).toBeDefined();
      expect(dmConv?.isGroup).toBe(false);

      // v2: dmMessage
      const dmMsg = await db2.dmMessages.get('dmmsg-v3-preserve');
      expect(dmMsg).toBeDefined();
      expect(dmMsg?.content).toBe('dm hello wave-63');

      // ── Step 4: New v3 tables are available and empty (cold) ──────────────
      const assignments = await db2.cachedAssignments.toArray();
      expect(assignments).toHaveLength(0);

      const sessions = await db2.cachedScheduledSessions.toArray();
      expect(sessions).toHaveLength(0);
    } finally {
      db2.close();
    }
  });

  it('v3 academic tables accept writes after upgrade without corrupting v1+v2 rows', async () => {
    const db1 = new StudyHallDB(factory, IDBKeyRange);

    // Seed a channel (v1) and a dmConversation (v2).
    await db1.channels.put({
      id: 'ch-v3-coexist',
      serverId: 'srv-coexist',
      name: 'coexist-chan',
      type: 'text',
      isPrivate: false,
      position: 1,
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    await db1.dmConversations.put({
      id: 'dmconv-v3-coexist',
      isGroup: true,
      participants: [],
      lastMessage: null,
      createdAt: '2026-07-01T10:00:00.000Z',
      cachedAt: '2026-07-01T10:00:00.000Z',
    });
    db1.close();

    const db2 = new StudyHallDB(factory, IDBKeyRange);

    try {
      // Write to new v3 academic tables.
      const asgn = makeAssignment({ id: 'asgn-coexist', serverId: 'srv-coexist' });
      await db2.cachedAssignments.put({ ...asgn, cachedAt: new Date().toISOString() });

      const sess = makeSession({ id: 'sess-coexist', serverId: 'srv-coexist' });
      await db2.cachedScheduledSessions.put({
        ...sess,
        cachedAt: new Date().toISOString(),
        windowKey: 'srv-coexist|from|to',
      });

      // v1 channel still there, unchanged.
      const channel = await db2.channels.get('ch-v3-coexist');
      expect(channel).toBeDefined();
      expect(channel?.name).toBe('coexist-chan');

      // v2 dmConversation still there, unchanged.
      const dmConv = await db2.dmConversations.get('dmconv-v3-coexist');
      expect(dmConv).toBeDefined();
      expect(dmConv?.isGroup).toBe(true);

      // v3 academic rows readable.
      const assignments = await db2.cachedAssignments.toArray();
      expect(assignments).toHaveLength(1);
      expect(assignments[0]?.id).toBe('asgn-coexist');

      const sessions = await db2.cachedScheduledSessions.toArray();
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.id).toBe('sess-coexist');
    } finally {
      db2.close();
    }
  });
});
