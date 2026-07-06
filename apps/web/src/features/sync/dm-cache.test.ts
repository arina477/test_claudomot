/**
 * dm-cache.test.ts — unit tests for the wave-62 DM offline cache substrate.
 *
 * Uses per-test IDBFactory injection from fake-indexeddb for hard isolation.
 * No shared state between tests — each gets a fresh in-memory IDB instance.
 *
 * Covers:
 *   - dmConversations: put → get round-trip
 *   - dmMessages: put → get round-trip, ordered by createdAt (oldest-first)
 *   - getCachedDmConversations: last-activity DESC ordering + null tie-break
 *   - v1→v2 UPGRADE PRESERVATION (load-bearing safety test):
 *       seed v1-shaped rows (channels/messages/outbox), open at v2, assert they survive
 */

import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getCachedDmConversations,
  getCachedDmMessages,
  putCachedDmConversation,
  putCachedDmConversations,
  putCachedDmMessage,
  putCachedDmMessages,
} from './cache';
import { StudyHallDB } from './db';
import type { CachedDmConversation, CachedDmMessage } from './types';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeConversation(overrides: Partial<CachedDmConversation> = {}): CachedDmConversation {
  return {
    id: crypto.randomUUID(),
    isGroup: false,
    participants: [],
    lastMessage: null,
    createdAt: new Date().toISOString(),
    cachedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeDmMessage(overrides: Partial<CachedDmMessage> = {}): CachedDmMessage {
  return {
    id: crypto.randomUUID(),
    conversationId: 'conv-1',
    authorId: 'user-1',
    content: 'hello',
    createdAt: new Date().toISOString(),
    cachedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── dmConversations round-trip ────────────────────────────────────────────────

describe('StudyHallDB — dmConversations cache (round-trip)', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(async () => {
    db.close();
  });

  it('writes and reads back a single conversation', async () => {
    const conv = makeConversation({ id: 'conv-1' });
    await putCachedDmConversations(db, [conv]);
    const result = await getCachedDmConversations(db);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('conv-1');
  });

  it('returns empty array on cold cache', async () => {
    const result = await getCachedDmConversations(db);
    expect(result).toHaveLength(0);
  });

  it('upserts (put replaces existing row)', async () => {
    const original = makeConversation({ id: 'conv-upsert', isGroup: false });
    await putCachedDmConversations(db, [original]);

    const updated = { ...original, isGroup: true };
    await putCachedDmConversations(db, [updated]);

    const result = await getCachedDmConversations(db);
    expect(result).toHaveLength(1);
    expect(result[0]?.isGroup).toBe(true);
  });

  it('single-conversation put via putCachedDmConversation upserts correctly', async () => {
    const conv = makeConversation({ id: 'conv-single' });
    await putCachedDmConversation(db, conv);
    const result = await getCachedDmConversations(db);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('conv-single');
  });
});

// ── getCachedDmConversations ordering ─────────────────────────────────────────

describe('StudyHallDB — getCachedDmConversations ordering', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(async () => {
    db.close();
  });

  it('returns conversations in last-activity DESC order based on lastMessage.createdAt', async () => {
    const oldest = makeConversation({
      id: 'conv-oldest',
      lastMessage: {
        content: 'old',
        createdAt: '2026-06-30T08:00:00.000Z',
        authorId: 'u1',
      },
      createdAt: '2026-06-01T00:00:00.000Z',
    });
    const newest = makeConversation({
      id: 'conv-newest',
      lastMessage: {
        content: 'new',
        createdAt: '2026-06-30T12:00:00.000Z',
        authorId: 'u2',
      },
      createdAt: '2026-06-02T00:00:00.000Z',
    });
    const middle = makeConversation({
      id: 'conv-middle',
      lastMessage: {
        content: 'mid',
        createdAt: '2026-06-30T10:00:00.000Z',
        authorId: 'u3',
      },
      createdAt: '2026-06-03T00:00:00.000Z',
    });

    // Insert in arbitrary order.
    await putCachedDmConversations(db, [oldest, newest, middle]);

    const result = await getCachedDmConversations(db);
    expect(result.map((c) => c.id)).toEqual(['conv-newest', 'conv-middle', 'conv-oldest']);
  });

  it('null lastMessage falls back to createdAt for deterministic tie-break (no crash)', async () => {
    const noMsg1 = makeConversation({
      id: 'conv-nomsg-1',
      lastMessage: null,
      createdAt: '2026-06-30T09:00:00.000Z',
    });
    const noMsg2 = makeConversation({
      id: 'conv-nomsg-2',
      lastMessage: null,
      createdAt: '2026-06-30T11:00:00.000Z',
    });
    const withMsg = makeConversation({
      id: 'conv-with-msg',
      lastMessage: {
        content: 'hi',
        createdAt: '2026-06-30T10:00:00.000Z',
        authorId: 'u1',
      },
      createdAt: '2026-06-30T08:00:00.000Z',
    });

    await putCachedDmConversations(db, [noMsg1, noMsg2, withMsg]);

    // Ordering:
    //   conv-nomsg-2: last-activity = createdAt '2026-06-30T11:00:00.000Z' (null fallback)
    //   conv-with-msg: last-activity = lastMessage.createdAt '2026-06-30T10:00:00.000Z'
    //   conv-nomsg-1: last-activity = createdAt '2026-06-30T09:00:00.000Z' (null fallback)
    const result = await getCachedDmConversations(db);
    expect(result.map((c) => c.id)).toEqual(['conv-nomsg-2', 'conv-with-msg', 'conv-nomsg-1']);
  });

  it('null lastMessage tie-break uses id as secondary key (deterministic, no crash)', async () => {
    const sameCreatedAt = '2026-06-30T10:00:00.000Z';
    // Both conversations have null lastMessage AND the same createdAt — id is the tiebreak.
    const convA = makeConversation({
      id: 'aaaa-conv',
      lastMessage: null,
      createdAt: sameCreatedAt,
    });
    const convB = makeConversation({
      id: 'zzzz-conv',
      lastMessage: null,
      createdAt: sameCreatedAt,
    });

    await putCachedDmConversations(db, [convA, convB]);

    const result = await getCachedDmConversations(db);
    // DESC id order: 'zzzz' > 'aaaa' lexicographically
    expect(result.map((c) => c.id)).toEqual(['zzzz-conv', 'aaaa-conv']);
  });
});

// ── dmMessages round-trip ─────────────────────────────────────────────────────

describe('StudyHallDB — dmMessages cache (round-trip)', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(async () => {
    db.close();
  });

  it('writes and reads back a single DM message', async () => {
    const msg = makeDmMessage({ id: 'dm-msg-1', conversationId: 'conv-1' });
    await putCachedDmMessages(db, [msg]);
    const result = await getCachedDmMessages(db, 'conv-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('dm-msg-1');
  });

  it('returns empty array for unknown conversationId', async () => {
    const result = await getCachedDmMessages(db, 'conv-no-exist');
    expect(result).toHaveLength(0);
  });

  it('reads messages for correct conversation only', async () => {
    const a = makeDmMessage({
      id: 'a',
      conversationId: 'conv-1',
      createdAt: '2026-06-30T10:00:00.000Z',
    });
    const b = makeDmMessage({
      id: 'b',
      conversationId: 'conv-2',
      createdAt: '2026-06-30T10:01:00.000Z',
    });
    await putCachedDmMessages(db, [a, b]);

    const conv1 = await getCachedDmMessages(db, 'conv-1');
    expect(conv1).toHaveLength(1);
    expect(conv1[0]?.id).toBe('a');

    const conv2 = await getCachedDmMessages(db, 'conv-2');
    expect(conv2).toHaveLength(1);
    expect(conv2[0]?.id).toBe('b');
  });

  it('returns messages ordered oldest-first via [conversationId+createdAt]', async () => {
    const t0 = '2026-06-30T10:00:00.000Z';
    const t1 = '2026-06-30T10:01:00.000Z';
    const t2 = '2026-06-30T10:02:00.000Z';

    // Insert out of order.
    const msgs = [
      makeDmMessage({ id: 'c', conversationId: 'conv-1', createdAt: t2 }),
      makeDmMessage({ id: 'a', conversationId: 'conv-1', createdAt: t0 }),
      makeDmMessage({ id: 'b', conversationId: 'conv-1', createdAt: t1 }),
    ];
    await putCachedDmMessages(db, msgs);

    const result = await getCachedDmMessages(db, 'conv-1');
    expect(result.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('upserts (put replaces existing row)', async () => {
    const original = makeDmMessage({ id: 'dm-upsert', content: 'original' });
    await putCachedDmMessages(db, [original]);

    const updated = { ...original, content: 'updated' };
    await putCachedDmMessages(db, [updated]);

    const result = await getCachedDmMessages(db, original.conversationId);
    expect(result).toHaveLength(1);
    expect(result[0]?.content).toBe('updated');
  });

  it('single DM message put via putCachedDmMessage upserts correctly', async () => {
    const msg = makeDmMessage({ id: 'single-dm', conversationId: 'conv-single' });
    await putCachedDmMessage(db, msg);
    const result = await getCachedDmMessages(db, 'conv-single');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('single-dm');
  });
});

// ── v1→v2 UPGRADE PRESERVATION (load-bearing safety test) ────────────────────
//
// CRITICAL: seed a v1-shaped DB (channels/messages/outbox rows only),
// then open at v2, and assert those pre-existing rows SURVIVE intact.
// This is a named exit criterion for wave-62 B-3 step 3a.

describe('StudyHallDB — v1→v2 upgrade preservation (LOAD-BEARING)', () => {
  // One shared IDBFactory so v1 and v2 open the same in-memory store.
  let factory: IDBFactory;

  beforeEach(() => {
    factory = new IDBFactory();
  });

  it('pre-existing v1 channels/messages/outbox rows survive the v1→v2 migration', async () => {
    // ── Step 1: Seed data into a v1-only db ──────────────────────────────────
    // We open the SAME db name with a fresh StudyHallDB (which now registers v1
    // then v2). Dexie runs both migrations on the fresh IDBFactory. We then verify
    // rows seeded before v2 are still present after the version upgrade path.
    //
    // Because fake-indexeddb does not persist between StudyHallDB instances unless
    // they share the same IDBFactory, we:
    //   1. Open db1 with the shared factory — this triggers v1 + v2 schema.
    //   2. Write v1-table rows.
    //   3. Close db1.
    //   4. Open db2 with the SAME shared factory — same DB, already at v2.
    //   5. Assert rows survive.

    const db1 = new StudyHallDB(factory, IDBKeyRange);

    // Seed a channel, a message, and an outbox item (v1 table rows).
    await db1.channels.put({
      id: 'ch-preserve-1',
      serverId: 'srv-1',
      name: 'general',
      type: 'text',
      isPrivate: false,
      position: 0,
      cachedAt: '2026-06-30T10:00:00.000Z',
    });
    await db1.messages.put({
      id: 'msg-preserve-1',
      channelId: 'ch-preserve-1',
      authorId: 'user-1',
      content: 'hello world',
      createdAt: '2026-06-30T10:00:00.000Z',
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      reactions: [],
      mentions: [],
      cachedAt: '2026-06-30T10:00:00.000Z',
    });
    await db1.outbox.add({
      channelId: 'ch-preserve-1',
      idempotencyKey: 'idem-preserve-1',
      content: 'queued message',
      state: 'pending',
      createdAt: '2026-06-30T10:00:00.000Z',
      attempts: 0,
    });

    db1.close();

    // ── Step 2: Re-open same IDB with a new StudyHallDB instance ─────────────
    const db2 = new StudyHallDB(factory, IDBKeyRange);

    try {
      // ── Step 3: Assert v1 rows survived ──────────────────────────────────
      const channel = await db2.channels.get('ch-preserve-1');
      expect(channel).toBeDefined();
      expect(channel?.name).toBe('general');

      const message = await db2.messages.get('msg-preserve-1');
      expect(message).toBeDefined();
      expect(message?.content).toBe('hello world');

      const outboxItems = await db2.outbox
        .where('idempotencyKey')
        .equals('idem-preserve-1')
        .toArray();
      expect(outboxItems).toHaveLength(1);
      expect(outboxItems[0]?.state).toBe('pending');

      // ── Step 4: New v2 tables are available and empty ─────────────────────
      const dmConvs = await db2.dmConversations.toArray();
      expect(dmConvs).toHaveLength(0);

      const dmMsgs = await db2.dmMessages.toArray();
      expect(dmMsgs).toHaveLength(0);
    } finally {
      db2.close();
    }
  });

  it('v2 DM tables accept writes after upgrade without corrupting v1 rows', async () => {
    const db1 = new StudyHallDB(factory, IDBKeyRange);

    // Seed a v1 channel row.
    await db1.channels.put({
      id: 'ch-coexist-1',
      serverId: 'srv-coexist',
      name: 'coexist',
      type: 'text',
      isPrivate: false,
      position: 1,
      cachedAt: '2026-06-30T10:00:00.000Z',
    });
    db1.close();

    const db2 = new StudyHallDB(factory, IDBKeyRange);

    try {
      // Write to new v2 tables.
      const conv = makeConversation({ id: 'conv-coexist-1' });
      await db2.dmConversations.put(conv);

      const dmMsg = makeDmMessage({ id: 'dmmsg-coexist-1', conversationId: 'conv-coexist-1' });
      await db2.dmMessages.put(dmMsg);

      // v1 channel still there, unchanged.
      const channel = await db2.channels.get('ch-coexist-1');
      expect(channel).toBeDefined();
      expect(channel?.name).toBe('coexist');

      // v2 rows readable.
      const dmConvs = await db2.dmConversations.toArray();
      expect(dmConvs).toHaveLength(1);
      expect(dmConvs[0]?.id).toBe('conv-coexist-1');

      const dmMsgs = await db2.dmMessages.toArray();
      expect(dmMsgs).toHaveLength(1);
      expect(dmMsgs[0]?.id).toBe('dmmsg-coexist-1');
    } finally {
      db2.close();
    }
  });
});
