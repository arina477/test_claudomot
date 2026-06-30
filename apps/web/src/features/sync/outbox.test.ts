/**
 * outbox.test.ts — integration tests for the durable outbox send loop.
 *
 * GATING PROOF (task e29f6566): exactly-once delivery + in-order replay.
 *
 * All tests use per-test IDBFactory injection for hard isolation.
 * No real timers — fully deterministic.
 *
 * Test matrix:
 *   1. enqueue N items offline → drain → N POSTs in order, each exactly once.
 *   2. Replayed item (same idempotencyKey) does NOT dup — mock POST honours
 *      ON CONFLICT semantics (returns same id for same key).
 *   3. Partial drain (fail mid-drain) resumes next drain with no dup.
 *   4. Failed item (MAX_ATTEMPTS exceeded) → state='failed', callback fires.
 *   5. Retry a failed item → resets to pending → drained on next call.
 *   6. Drain is sequential (POST[i+1] only called after POST[i] resolves).
 *   7. Empty outbox drain is a no-op.
 *   8. Failed items are skipped by drain.
 */

import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StudyHallDB } from './db';
import { drain, loadPending, retryOutboxItem } from './outbox';
import type { SendFn } from './outbox';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Build a mock SendFn that records calls and returns a synthetic confirmed id. */
function makeSendFn(
  opts: {
    /** Optional per-key override: return the same id to simulate ON CONFLICT dedup. */
    idMap?: Map<string, string>;
    /** Keys that should fail (reject) */
    failKeys?: Set<string>;
  } = {},
): { sendFn: SendFn; calls: Array<{ channelId: string; idempotencyKey: string }> } {
  const calls: Array<{ channelId: string; idempotencyKey: string }> = [];

  const sendFn: SendFn = (channelId, body) => {
    calls.push({ channelId, idempotencyKey: body.idempotencyKey });

    if (opts.failKeys?.has(body.idempotencyKey)) {
      return Promise.reject(new Error('network error'));
    }

    const idempotencyKey = body.idempotencyKey;
    if (!opts.idMap?.has(idempotencyKey)) {
      opts.idMap?.set(idempotencyKey, crypto.randomUUID());
    }
    const confirmedId = opts.idMap?.get(idempotencyKey) ?? crypto.randomUUID();

    return Promise.resolve({ id: confirmedId });
  };

  return { sendFn, calls };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('outbox drain — exactly-once + in-order (gating proof)', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(async () => {
    db.close();
  });

  // ── Test 1: N offline → drain → N POSTs in order, each exactly once ─────

  it('drains N pending items in createdAt order, each POSTed exactly once', async () => {
    const timestamps = [
      '2026-06-30T10:00:00.000Z',
      '2026-06-30T10:01:00.000Z',
      '2026-06-30T10:02:00.000Z',
      '2026-06-30T10:03:00.000Z',
    ];

    const keys: string[] = [];
    for (let i = 0; i < 4; i++) {
      const key = `stable-key-${i}`;
      keys.push(key);
      await db.outbox.add({
        channelId: 'ch-1',
        idempotencyKey: key,
        content: `message ${i}`,
        state: 'pending',
        createdAt: timestamps[i] ?? '',
        attempts: 0,
      });
    }

    const idMap = new Map<string, string>();
    const delivered: Array<{ idempotencyKey: string; confirmedId: string }> = [];
    const failed: string[] = [];
    const { sendFn, calls } = makeSendFn({ idMap });

    await drain(
      db,
      sendFn,
      (idempotencyKey, confirmedId) => delivered.push({ idempotencyKey, confirmedId }),
      (idempotencyKey) => failed.push(idempotencyKey),
    );

    // N POSTs, in timestamps order.
    expect(calls).toHaveLength(4);
    expect(calls.map((c) => c.idempotencyKey)).toEqual(keys);

    // Each delivered exactly once.
    expect(delivered).toHaveLength(4);
    expect(failed).toHaveLength(0);

    // Outbox is empty after drain.
    const remaining = await db.outbox.toArray();
    expect(remaining).toHaveLength(0);
  });

  // ── Test 2: Replayed item (same key) does NOT dup ─────────────────────────

  it('replayed idempotencyKey (ON CONFLICT semantics) returns same id, no dup', async () => {
    const key = 'replay-key-stable';
    await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: key,
      content: 'replay me',
      state: 'pending',
      createdAt: '2026-06-30T10:00:00.000Z',
      attempts: 0,
    });

    const confirmedId = crypto.randomUUID();
    const idMap = new Map<string, string>([[key, confirmedId]]);

    const delivered1: string[] = [];
    const { sendFn: send1, calls: calls1 } = makeSendFn({ idMap });

    await drain(
      db,
      send1,
      (_k, id) => delivered1.push(id),
      () => {},
    );

    // First drain: 1 POST, 1 delivery, outbox empty.
    expect(calls1).toHaveLength(1);
    expect(delivered1).toHaveLength(1);
    expect(delivered1[0]).toBe(confirmedId);
    expect(await db.outbox.toArray()).toHaveLength(0);

    // Re-add the same item (simulating a crash/replay scenario).
    await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: key,
      content: 'replay me',
      state: 'pending',
      createdAt: '2026-06-30T10:00:00.000Z',
      attempts: 0,
    });

    const delivered2: string[] = [];
    const { sendFn: send2, calls: calls2 } = makeSendFn({ idMap });

    await drain(
      db,
      send2,
      (_k, id) => delivered2.push(id),
      () => {},
    );

    // Second drain: 1 POST (server receives same key again), returns SAME confirmedId.
    expect(calls2).toHaveLength(1);
    expect(delivered2[0]).toBe(confirmedId); // same id — no dup from server's ON CONFLICT
  });

  // ── Test 3: Partial drain (fail mid-drain) resumes, no dup ───────────────

  it('partial drain (fail mid-drain) — next drain resumes without duplication', async () => {
    const timestamps = [
      '2026-06-30T10:00:00.000Z',
      '2026-06-30T10:01:00.000Z',
      '2026-06-30T10:02:00.000Z',
    ];
    const keys = ['partial-key-0', 'partial-key-1', 'partial-key-2'];

    for (let i = 0; i < 3; i++) {
      await db.outbox.add({
        channelId: 'ch-1',
        idempotencyKey: keys[i] ?? '',
        content: `msg ${i}`,
        state: 'pending',
        createdAt: timestamps[i] ?? '',
        attempts: 0,
      });
    }

    // First drain: item at index 1 fails — but drain continues to item 2.
    const failKeys = new Set(['partial-key-1']);
    const idMap = new Map<string, string>();
    const delivered1: string[] = [];
    const failed1: string[] = [];
    const { sendFn: send1, calls: calls1 } = makeSendFn({ idMap, failKeys });

    await drain(
      db,
      send1,
      (k) => delivered1.push(k),
      (k) => failed1.push(k),
    );

    // 3 POSTs attempted (drain continues past failures).
    expect(calls1).toHaveLength(3);
    // key-0 and key-2 delivered, key-1 failed.
    expect(delivered1).toContain('partial-key-0');
    expect(delivered1).toContain('partial-key-2');
    // key-1 not yet at MAX_ATTEMPTS → still pending, no failed callback yet.
    expect(failed1).toHaveLength(0);

    // Outbox: only key-1 remains, attempts=1.
    const remaining = await db.outbox.toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.idempotencyKey).toBe('partial-key-1');
    expect(remaining[0]?.attempts).toBe(1);
    expect(remaining[0]?.state).toBe('pending');

    // Second drain: key-1 fails again.
    const { sendFn: send2, calls: calls2 } = makeSendFn({ idMap, failKeys });
    const delivered2: string[] = [];
    const failed2: string[] = [];

    await drain(
      db,
      send2,
      (k) => delivered2.push(k),
      (k) => failed2.push(k),
    );

    // Only key-1 in queue now, attempted again.
    expect(calls2).toHaveLength(1);
    expect(calls2[0]?.idempotencyKey).toBe('partial-key-1');
    expect(delivered2).toHaveLength(0);
    // attempts=2, still pending.
    const remaining2 = await db.outbox.toArray();
    expect(remaining2[0]?.attempts).toBe(2);

    // Third drain: key-1 fails again — now hits MAX_ATTEMPTS (3), marked failed.
    const { sendFn: send3, calls: calls3 } = makeSendFn({ idMap, failKeys });
    const failed3: string[] = [];

    await drain(
      db,
      send3,
      () => {},
      (k) => failed3.push(k),
    );

    expect(calls3).toHaveLength(1);
    expect(failed3).toContain('partial-key-1');

    // Item is now state='failed' in outbox.
    const final = await db.outbox.toArray();
    expect(final[0]?.state).toBe('failed');

    // key-0 and key-2 were only POSTed once each across all drains (no dup).
    const allCalls = [...calls1, ...calls2, ...calls3];
    const countKey0 = allCalls.filter((c) => c.idempotencyKey === 'partial-key-0').length;
    const countKey2 = allCalls.filter((c) => c.idempotencyKey === 'partial-key-2').length;
    expect(countKey0).toBe(1); // exactly once
    expect(countKey2).toBe(1); // exactly once
  });

  // ── Test 4: MAX_ATTEMPTS exhausted → state='failed', onFailed fires ───────

  it('item fails MAX_ATTEMPTS times → state=failed, onFailed callback fires', async () => {
    const key = 'will-fail-key';
    await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: key,
      content: 'doom',
      state: 'pending',
      createdAt: '2026-06-30T10:00:00.000Z',
      attempts: 0,
    });

    const failKeys = new Set([key]);
    const idMap = new Map<string, string>();
    const failed: string[] = [];

    // Drain 3 times to exhaust MAX_ATTEMPTS (=3).
    for (let round = 0; round < 3; round++) {
      const { sendFn } = makeSendFn({ idMap, failKeys });
      await drain(
        db,
        sendFn,
        () => {},
        (k) => failed.push(k),
      );
    }

    expect(failed).toContain(key);
    const item = await db.outbox.where('idempotencyKey').equals(key).first();
    expect(item?.state).toBe('failed');
    expect(item?.attempts).toBe(3);
  });

  // ── Test 5: Retry a failed item resets to pending ─────────────────────────

  it('retryOutboxItem resets a failed item to pending so next drain processes it', async () => {
    const key = 'retry-me-key';
    await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: key,
      content: 'retry',
      state: 'failed',
      createdAt: '2026-06-30T10:00:00.000Z',
      attempts: 3,
    });

    // Verify it does not show up in loadPending before retry.
    const beforeRetry = await loadPending(db);
    expect(beforeRetry.find((i) => i.idempotencyKey === key)).toBeUndefined();

    await retryOutboxItem(db, key);

    const afterRetry = await db.outbox.where('idempotencyKey').equals(key).first();
    expect(afterRetry?.state).toBe('pending');
    expect(afterRetry?.attempts).toBe(0);

    // Now drain — should POST successfully.
    const idMap = new Map<string, string>();
    const delivered: string[] = [];
    const { sendFn } = makeSendFn({ idMap });

    await drain(
      db,
      sendFn,
      (k) => delivered.push(k),
      () => {},
    );
    expect(delivered).toContain(key);
    expect(await db.outbox.toArray()).toHaveLength(0);
  });

  // ── Test 6: Drain is sequential (not concurrent) ──────────────────────────

  it('drain processes items sequentially (POST[i+1] called after POST[i] resolves)', async () => {
    const orderLog: string[] = [];
    const keys = ['seq-0', 'seq-1', 'seq-2'];
    const timestamps = [
      '2026-06-30T10:00:00.000Z',
      '2026-06-30T10:01:00.000Z',
      '2026-06-30T10:02:00.000Z',
    ];

    for (let i = 0; i < 3; i++) {
      await db.outbox.add({
        channelId: 'ch-1',
        idempotencyKey: keys[i] ?? '',
        content: `seq ${i}`,
        state: 'pending',
        createdAt: timestamps[i] ?? '',
        attempts: 0,
      });
    }

    // sendFn logs "start:<key>" before resolving and "end:<key>" after resolution
    // to prove sequential execution.
    const sequentialSendFn: SendFn = (_channelId, body) => {
      orderLog.push(`start:${body.idempotencyKey}`);
      return new Promise<{ id: string }>((resolve) => {
        Promise.resolve().then(() => {
          orderLog.push(`end:${body.idempotencyKey}`);
          resolve({ id: crypto.randomUUID() });
        });
      });
    };

    await drain(
      db,
      sequentialSendFn,
      () => {},
      () => {},
    );

    // Sequential pattern: start-0 end-0 start-1 end-1 start-2 end-2
    // If concurrent (Promise.all), pattern would be: start-0 start-1 start-2 end-0 ...
    expect(orderLog).toEqual([
      'start:seq-0',
      'end:seq-0',
      'start:seq-1',
      'end:seq-1',
      'start:seq-2',
      'end:seq-2',
    ]);
  });

  // ── Test 7: Empty outbox drain is a no-op ─────────────────────────────────

  it('drain with empty outbox calls sendFn zero times', async () => {
    const idMap = new Map<string, string>();
    const { sendFn, calls } = makeSendFn({ idMap });

    await drain(
      db,
      sendFn,
      () => {},
      () => {},
    );
    expect(calls).toHaveLength(0);
  });

  // ── Test 8: Failed items are not re-drained ───────────────────────────────

  it('drain skips failed items (only processes pending)', async () => {
    await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: 'failed-item',
      content: 'already failed',
      state: 'failed',
      createdAt: '2026-06-30T10:00:00.000Z',
      attempts: 3,
    });
    await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: 'pending-item',
      content: 'pending',
      state: 'pending',
      createdAt: '2026-06-30T10:01:00.000Z',
      attempts: 0,
    });

    const idMap = new Map<string, string>();
    const delivered: string[] = [];
    const { sendFn, calls } = makeSendFn({ idMap });

    await drain(
      db,
      sendFn,
      (k) => delivered.push(k),
      () => {},
    );

    // Only the pending item was POSTed.
    expect(calls).toHaveLength(1);
    expect(calls[0]?.idempotencyKey).toBe('pending-item');
    expect(delivered).toContain('pending-item');

    // Failed item remains in outbox unchanged.
    const failedItem = await db.outbox.where('idempotencyKey').equals('failed-item').first();
    expect(failedItem?.state).toBe('failed');
    expect(failedItem?.attempts).toBe(3);
  });
});
