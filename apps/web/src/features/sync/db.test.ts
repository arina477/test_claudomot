/**
 * db.test.ts — unit tests for the Dexie store (StudyHallDB).
 *
 * Uses per-test IDBFactory injection from fake-indexeddb for hard isolation.
 * No shared state between tests — each gets a fresh in-memory IDB instance.
 *
 * Covers:
 *   - messages: write-through (putCachedMessages) + compound-index read
 *   - channels: put + get
 *   - outbox: enqueue (enqueue helper) + oldest-first [state+createdAt] ordering
 *   - outbox state transitions: pending → failed
 */

import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getCachedMessages, putCachedMessages } from './cache';
import { StudyHallDB } from './db';
import { enqueue, loadPending } from './outbox';
import type { CachedChannel, CachedMessage } from './types';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeMessage(overrides: Partial<CachedMessage> = {}): CachedMessage {
  return {
    id: crypto.randomUUID(),
    channelId: 'ch-1',
    authorId: 'user-1',
    content: 'hello',
    createdAt: new Date().toISOString(),
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    reactions: [],
    mentions: [],
    cachedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('StudyHallDB — messages cache', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(async () => {
    db.close();
  });

  it('writes and reads back a single message', async () => {
    const msg = makeMessage({ id: 'msg-1', channelId: 'ch-1' });
    await putCachedMessages(db, [msg]);
    const result = await getCachedMessages(db, 'ch-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('msg-1');
  });

  it('returns empty array for unknown channelId', async () => {
    const result = await getCachedMessages(db, 'ch-no-exist');
    expect(result).toHaveLength(0);
  });

  it('reads messages for correct channel only', async () => {
    const a = makeMessage({ id: 'a', channelId: 'ch-1', createdAt: '2026-06-30T10:00:00.000Z' });
    const b = makeMessage({ id: 'b', channelId: 'ch-2', createdAt: '2026-06-30T10:01:00.000Z' });
    await putCachedMessages(db, [a, b]);

    const ch1 = await getCachedMessages(db, 'ch-1');
    expect(ch1).toHaveLength(1);
    expect(ch1[0]?.id).toBe('a');

    const ch2 = await getCachedMessages(db, 'ch-2');
    expect(ch2).toHaveLength(1);
    expect(ch2[0]?.id).toBe('b');
  });

  it('returns messages ordered oldest-first via [channelId+createdAt]', async () => {
    const t0 = '2026-06-30T10:00:00.000Z';
    const t1 = '2026-06-30T10:01:00.000Z';
    const t2 = '2026-06-30T10:02:00.000Z';

    // Insert out of order.
    const msgs = [
      makeMessage({ id: 'c', channelId: 'ch-1', createdAt: t2 }),
      makeMessage({ id: 'a', channelId: 'ch-1', createdAt: t0 }),
      makeMessage({ id: 'b', channelId: 'ch-1', createdAt: t1 }),
    ];
    await putCachedMessages(db, msgs);

    const result = await getCachedMessages(db, 'ch-1');
    expect(result.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('upserts (put replaces existing row)', async () => {
    const original = makeMessage({ id: 'msg-1', content: 'original' });
    await putCachedMessages(db, [original]);

    const updated = { ...original, content: 'updated' };
    await putCachedMessages(db, [updated]);

    const result = await getCachedMessages(db, original.channelId);
    expect(result).toHaveLength(1);
    expect(result[0]?.content).toBe('updated');
  });
});

describe('StudyHallDB — channels cache', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(async () => {
    db.close();
  });

  it('writes and reads back a channel', async () => {
    const channel: CachedChannel = {
      id: 'ch-1',
      serverId: 'srv-1',
      name: 'general',
      type: 'text',
      isPrivate: false,
      position: 0,
      cachedAt: new Date().toISOString(),
    };
    await db.channels.put(channel);
    const result = await db.channels.get('ch-1');
    expect(result?.name).toBe('general');
  });

  it('returns undefined for unknown channel', async () => {
    const result = await db.channels.get('no-such-id');
    expect(result).toBeUndefined();
  });
});

describe('StudyHallDB — outbox enqueue + state', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(async () => {
    db.close();
  });

  it('enqueues an item and reads it back as pending', async () => {
    const { idempotencyKey } = await enqueue(db, { kind: 'channel', channelId: 'ch-1' }, 'hello');
    const items = await loadPending(db);
    expect(items).toHaveLength(1);
    expect(items[0]?.idempotencyKey).toBe(idempotencyKey);
    expect(items[0]?.state).toBe('pending');
    expect(items[0]?.attempts).toBe(0);
  });

  it('enqueue generates a unique idempotencyKey each time', async () => {
    const { idempotencyKey: k1 } = await enqueue(
      db,
      { kind: 'channel', channelId: 'ch-1' },
      'msg 1',
    );
    const { idempotencyKey: k2 } = await enqueue(
      db,
      { kind: 'channel', channelId: 'ch-1' },
      'msg 2',
    );
    expect(k1).not.toBe(k2);
  });

  it('loadPending returns only pending items (not failed)', async () => {
    await enqueue(db, { kind: 'channel', channelId: 'ch-1' }, 'pending msg');
    await enqueue(db, { kind: 'channel', channelId: 'ch-1' }, 'another pending');

    // Mark one as failed directly.
    const allItems = await db.outbox.toArray();
    const firstId = allItems[0]?.id;
    if (firstId !== undefined) {
      await db.outbox.update(firstId, { state: 'failed' });
    }

    const pending = await loadPending(db);
    expect(pending.every((item) => item.state === 'pending')).toBe(true);
  });

  it('returns items oldest-first via [state+createdAt] index', async () => {
    // Add items with explicit timestamps out of insertion order.
    const t0 = '2026-06-30T10:00:00.000Z';
    const t1 = '2026-06-30T10:01:00.000Z';
    const t2 = '2026-06-30T10:02:00.000Z';

    await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: 'key-c',
      content: 'third',
      state: 'pending',
      createdAt: t2,
      attempts: 0,
    });
    await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: 'key-a',
      content: 'first',
      state: 'pending',
      createdAt: t0,
      attempts: 0,
    });
    await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: 'key-b',
      content: 'second',
      state: 'pending',
      createdAt: t1,
      attempts: 0,
    });

    const pending = await db.outbox
      .where('[state+createdAt]')
      .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
      .toArray();

    expect(pending.map((item) => item.idempotencyKey)).toEqual(['key-a', 'key-b', 'key-c']);
  });

  it('marks an item as failed after update', async () => {
    await enqueue(db, { kind: 'channel', channelId: 'ch-1' }, 'will fail');
    const before = await db.outbox.toArray();
    const itemId = before[0]?.id;
    expect(itemId).toBeDefined();

    await db.outbox.update(itemId as number, { state: 'failed', attempts: 3 });

    const after = await db.outbox.get(itemId as number);
    expect(after?.state).toBe('failed');
    expect(after?.attempts).toBe(3);
  });

  it('stores and retrieves attachments', async () => {
    const attachments = [
      { key: 'uploads/file.png', filename: 'file.png', contentType: 'image/png', sizeBytes: 1024 },
    ];
    await enqueue(db, { kind: 'channel', channelId: 'ch-1' }, 'with attachment', attachments);

    const items = await loadPending(db);
    expect(items[0]?.attachments).toHaveLength(1);
    expect(items[0]?.attachments?.[0]?.key).toBe('uploads/file.png');
  });

  it('deletes an item after delivery', async () => {
    await enqueue(db, { kind: 'channel', channelId: 'ch-1' }, 'delivered');
    const before = await db.outbox.toArray();
    const itemId = before[0]?.id as number;

    await db.outbox.delete(itemId);

    const after = await db.outbox.toArray();
    expect(after).toHaveLength(0);
  });

  it('idempotencyKey index is queryable', async () => {
    const { idempotencyKey } = await enqueue(db, { kind: 'channel', channelId: 'ch-1' }, 'test');
    const count = await db.outbox.where('idempotencyKey').equals(idempotencyKey).count();
    expect(count).toBe(1);
  });
});
