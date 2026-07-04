/**
 * outbox.test.ts — integration tests for the durable outbox send loop.
 *
 * GATING PROOF (task 9a4ab31d): exactly-once delivery + strict in-order replay.
 *
 * All tests use per-test IDBFactory injection for hard isolation.
 * No real timers — fully deterministic.
 *
 * Test matrix:
 *   1. enqueue N items offline → drain → N POSTs in order, each exactly once.
 *   2. Replayed item (same idempotencyKey) does NOT dup — mock POST honours
 *      ON CONFLICT semantics (returns same id for same key).
 *   3. Stop-on-failure: a failed item blocks later items; no later message
 *      sends ahead of an earlier un-sent one (in-order preserved).
 *   4. Failed item (MAX_ATTEMPTS exceeded) → state='failed', callback fires.
 *   5. Retry a failed item → resets to pending → drained on next call.
 *   6. Drain is sequential (POST[i+1] only called after POST[i] resolves).
 *   7. Empty outbox drain is a no-op.
 *   8. Failed items are skipped by drain.
 *   9. Re-entrancy guard: two concurrent drain() calls — each pending item
 *      POSTed exactly once, in order.
 *  10. id tiebreak: items with identical createdAt drained in id order.
 */

import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StudyHallDB } from './db';
import { drain, enqueue, loadPending, retryOutboxItem } from './outbox';
import type { SendFn } from './outbox';
import type { OutboxTarget } from './types';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Build a mock SendFn that records calls and returns a synthetic confirmed id. */
function makeSendFn(
  opts: {
    /** Optional per-key override: return the same id to simulate ON CONFLICT dedup. */
    idMap?: Map<string, string>;
    /** Keys that should fail (reject) */
    failKeys?: Set<string>;
  } = {},
): {
  sendFn: SendFn;
  calls: Array<{ target: OutboxTarget; idempotencyKey: string }>;
} {
  const calls: Array<{ target: OutboxTarget; idempotencyKey: string }> = [];

  const sendFn: SendFn = (target, body) => {
    calls.push({ target, idempotencyKey: body.idempotencyKey });

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

  // ── Test 3: Stop-on-failure — in-order preserved ─────────────────────────
  //
  // POLICY: drain stops when a send fails. All items after the failed item
  // stay pending. A later message NEVER sends ahead of an earlier un-sent one.
  // This is the in-order guarantee (the wedge). The failed item is retried
  // FIRST on the next drain call.

  it('stop-on-failure: failed item blocks later items; no later message sends ahead of earlier un-sent one', async () => {
    const timestamps = [
      '2026-06-30T10:00:00.000Z',
      '2026-06-30T10:01:00.000Z',
      '2026-06-30T10:02:00.000Z',
    ];
    const keys = ['stop-key-0', 'stop-key-1', 'stop-key-2'];

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

    // First drain: item at index 1 (stop-key-1) fails.
    // EXPECTED: stop-key-0 POSTed (success), stop-key-1 attempted (fails),
    //           drain STOPS — stop-key-2 is NEVER POSTed (in-order preserved).
    const failKeys = new Set(['stop-key-1']);
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

    // Only 2 POSTs attempted: stop-key-0 (success) + stop-key-1 (fail, stops drain).
    expect(calls1).toHaveLength(2);
    expect(calls1[0]?.idempotencyKey).toBe('stop-key-0');
    expect(calls1[1]?.idempotencyKey).toBe('stop-key-1');
    // stop-key-2 was NEVER sent — it was blocked behind stop-key-1.
    expect(calls1.map((c) => c.idempotencyKey)).not.toContain('stop-key-2');

    // stop-key-0 delivered; stop-key-1 and stop-key-2 remain pending.
    expect(delivered1).toContain('stop-key-0');
    expect(delivered1).not.toContain('stop-key-1');
    expect(delivered1).not.toContain('stop-key-2');
    expect(failed1).toHaveLength(0); // not yet at MAX_ATTEMPTS

    // Outbox: stop-key-1 (attempts=1, pending) and stop-key-2 (attempts=0, pending) remain.
    const remaining1 = await db.outbox.toArray();
    expect(remaining1).toHaveLength(2);
    const key1row = remaining1.find((r) => r.idempotencyKey === 'stop-key-1');
    const key2row = remaining1.find((r) => r.idempotencyKey === 'stop-key-2');
    expect(key1row?.attempts).toBe(1);
    expect(key1row?.state).toBe('pending');
    expect(key2row?.attempts).toBe(0); // untouched
    expect(key2row?.state).toBe('pending');

    // Second drain: stop-key-1 fails again, drain stops — stop-key-2 still blocked.
    const { sendFn: send2, calls: calls2 } = makeSendFn({ idMap, failKeys });
    const delivered2: string[] = [];
    const failed2: string[] = [];

    await drain(
      db,
      send2,
      (k) => delivered2.push(k),
      (k) => failed2.push(k),
    );

    // Only stop-key-1 attempted (head of queue), drain stops after failure.
    expect(calls2).toHaveLength(1);
    expect(calls2[0]?.idempotencyKey).toBe('stop-key-1');
    // stop-key-2 still NEVER sent.
    expect(calls2.map((c) => c.idempotencyKey)).not.toContain('stop-key-2');
    expect(delivered2).toHaveLength(0);
    expect(failed2).toHaveLength(0); // attempts=2, still below MAX_ATTEMPTS

    const remaining2 = await db.outbox.toArray();
    const key1row2 = remaining2.find((r) => r.idempotencyKey === 'stop-key-1');
    expect(key1row2?.attempts).toBe(2);
    const key2row2 = remaining2.find((r) => r.idempotencyKey === 'stop-key-2');
    expect(key2row2?.attempts).toBe(0); // still untouched

    // Third drain: stop-key-1 fails again — hits MAX_ATTEMPTS (3), becomes failed.
    // stop-key-2 is still blocked (head-of-line is now state=failed).
    const { sendFn: send3, calls: calls3 } = makeSendFn({ idMap, failKeys });
    const failed3: string[] = [];

    await drain(
      db,
      send3,
      () => {},
      (k) => failed3.push(k),
    );

    // stop-key-1 attempted, becomes failed. Drain stops.
    expect(calls3).toHaveLength(1);
    expect(calls3[0]?.idempotencyKey).toBe('stop-key-1');
    expect(failed3).toContain('stop-key-1');

    const remaining3 = await db.outbox.toArray();
    const key1Final = remaining3.find((r) => r.idempotencyKey === 'stop-key-1');
    expect(key1Final?.state).toBe('failed');
    const key2Final = remaining3.find((r) => r.idempotencyKey === 'stop-key-2');
    // stop-key-2 never sent across ALL drains — it was always blocked.
    expect(key2Final?.state).toBe('pending');
    expect(key2Final?.attempts).toBe(0);

    // Verify stop-key-2 was NEVER POSTed across all three drains.
    const allCalls = [...calls1, ...calls2, ...calls3];
    const key2PostCount = allCalls.filter((c) => c.idempotencyKey === 'stop-key-2').length;
    expect(key2PostCount).toBe(0); // in-order preserved: never sent ahead of stop-key-1

    // stop-key-0 POSTed exactly once (no dup).
    const key0PostCount = allCalls.filter((c) => c.idempotencyKey === 'stop-key-0').length;
    expect(key0PostCount).toBe(1);
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
    const sequentialSendFn: SendFn = (_target, body) => {
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

  // ── Test 9: Re-entrancy guard — two concurrent drain() calls ─────────────
  //
  // H1 fix proof: socket 'connect' and window 'online' commonly fire together
  // on reconnect. Both call drain(). The module-level guard ensures only ONE
  // drain executes; the second caller gets the in-flight promise back.
  // Each pending item must be POSTed exactly once, in order.

  it('two concurrent drain() calls — each pending item POSTed exactly once, in order', async () => {
    const keys = ['concurrent-key-0', 'concurrent-key-1', 'concurrent-key-2'];
    const timestamps = [
      '2026-06-30T10:00:00.000Z',
      '2026-06-30T10:01:00.000Z',
      '2026-06-30T10:02:00.000Z',
    ];

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

    const idMap = new Map<string, string>();
    const delivered: Array<string> = [];
    const { sendFn, calls } = makeSendFn({ idMap });

    const onDelivered = (k: string, _id: string) => delivered.push(k);
    const onFailed = () => {};

    // Fire two drain() calls simultaneously — the guard must serialize them.
    const [p1, p2] = [
      drain(db, sendFn, onDelivered, onFailed),
      drain(db, sendFn, onDelivered, onFailed),
    ];
    await Promise.all([p1, p2]);

    // Each item POSTed exactly once — no double-send from overlapping drains.
    expect(calls).toHaveLength(3);
    const seen = new Set(calls.map((c) => c.idempotencyKey));
    expect(seen.size).toBe(3); // all distinct — each appeared exactly once

    // Items delivered in order (oldest first).
    expect(delivered).toEqual(keys);

    // Outbox empty.
    expect(await db.outbox.toArray()).toHaveLength(0);
  });

  // ── Test 10: id tiebreak — items with identical createdAt drain in id order ─
  //
  // M2 fix proof: when two items have the same createdAt millisecond,
  // the auto-increment id is the secondary sort key — deterministic order.

  it('items with identical createdAt are drained in ascending id (auto-increment) order', async () => {
    const sameTimestamp = '2026-06-30T10:00:00.000Z';

    // Add in intended order — Dexie assigns ascending auto-increment ids.
    const id0 = await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: 'tiebreak-key-0',
      content: 'msg 0',
      state: 'pending',
      createdAt: sameTimestamp,
      attempts: 0,
    });
    const id1 = await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: 'tiebreak-key-1',
      content: 'msg 1',
      state: 'pending',
      createdAt: sameTimestamp,
      attempts: 0,
    });
    const id2 = await db.outbox.add({
      channelId: 'ch-1',
      idempotencyKey: 'tiebreak-key-2',
      content: 'msg 2',
      state: 'pending',
      createdAt: sameTimestamp,
      attempts: 0,
    });

    // Confirm ascending id assignment.
    expect(id0 as number).toBeLessThan(id1 as number);
    expect(id1 as number).toBeLessThan(id2 as number);

    const idMap = new Map<string, string>();
    const { sendFn, calls } = makeSendFn({ idMap });

    await drain(
      db,
      sendFn,
      () => {},
      () => {},
    );

    // All 3 sent in id order (tiebreak-key-0 before tiebreak-key-1 before tiebreak-key-2).
    expect(calls).toHaveLength(3);
    expect(calls[0]?.idempotencyKey).toBe('tiebreak-key-0');
    expect(calls[1]?.idempotencyKey).toBe('tiebreak-key-1');
    expect(calls[2]?.idempotencyKey).toBe('tiebreak-key-2');
  });

  // ── Test 11: Channel send NOT regressed after wave-46 outbox generalisation ──
  //
  // Regression proof: enqueue() with kind='channel' target must route the drain
  // call to sendFn with target.kind === 'channel' and the correct channelId.
  // Channel send behaviour must be identical to pre-wave-46.

  it('channel send NOT regressed — enqueue({kind:channel}) drains with channel target', async () => {
    const channelId = 'regression-channel-42';
    const target: OutboxTarget = { kind: 'channel', channelId };

    const { idempotencyKey } = await enqueue(db, target, 'channel regression message');

    const idMap = new Map<string, string>();
    const delivered: string[] = [];
    const failed: string[] = [];
    const { sendFn, calls } = makeSendFn({ idMap });

    await drain(
      db,
      sendFn,
      (k) => delivered.push(k),
      (k) => failed.push(k),
    );

    // Exactly one POST fired.
    expect(calls).toHaveLength(1);

    // The sendFn received a channel target (not a DM target).
    const call = calls[0];
    expect(call?.target.kind).toBe('channel');
    if (call?.target.kind === 'channel') {
      expect(call.target.channelId).toBe(channelId);
    }

    // The idempotency key was routed correctly.
    expect(call?.idempotencyKey).toBe(idempotencyKey);

    // Delivered successfully, no failures.
    expect(delivered).toContain(idempotencyKey);
    expect(failed).toHaveLength(0);

    // Outbox empty after drain.
    expect(await db.outbox.toArray()).toHaveLength(0);
  });

  // ── Test 12: DM enqueue + drain ──────────────────────────────────────────────
  //
  // wave-46 M8: enqueue() with kind='dm' target stores the row and drain()
  // routes the sendFn call with kind='dm' + conversationId.

  it('DM enqueue({kind:dm}) drains with dm target and correct conversationId', async () => {
    const conversationId = 'conv-abc-123';
    const target: OutboxTarget = { kind: 'dm', conversationId };

    const { idempotencyKey } = await enqueue(db, target, 'hello via dm outbox');

    // Verify the persisted row has target and legacy channelId=''.
    const stored = await db.outbox.where('idempotencyKey').equals(idempotencyKey).first();
    expect(stored).toBeDefined();
    expect(stored?.target).toEqual({ kind: 'dm', conversationId });
    expect(stored?.channelId).toBe(''); // legacy field empty for DM items

    const idMap = new Map<string, string>();
    const delivered: string[] = [];
    const failed: string[] = [];
    const { sendFn, calls } = makeSendFn({ idMap });

    await drain(
      db,
      sendFn,
      (k) => delivered.push(k),
      (k) => failed.push(k),
    );

    // Exactly one POST fired.
    expect(calls).toHaveLength(1);

    // The sendFn received a dm target with the correct conversationId.
    const call = calls[0];
    expect(call?.target.kind).toBe('dm');
    if (call?.target.kind === 'dm') {
      expect(call.target.conversationId).toBe(conversationId);
    }

    // Delivered successfully.
    expect(delivered).toContain(idempotencyKey);
    expect(failed).toHaveLength(0);

    // Outbox empty.
    expect(await db.outbox.toArray()).toHaveLength(0);
  });

  // ── Test 14: Mixed-queue drain (C1 fix) ──────────────────────────────────────
  //
  // CRITICAL fix proof: a pending channel item followed by a pending DM item
  // (or vice-versa) must BOTH flush when the SendFn is a bidirectional router.
  // Neither kind must reject or halt the drain for the other kind.
  // This test proves the C1 fix: the off-kind item no longer rejects + stops the drain.

  it('mixed channel+DM queue: both items flush; neither kind rejects the other', async () => {
    // Channel item queued first (older createdAt).
    await enqueue(db, { kind: 'channel', channelId: 'mixed-channel-1' }, 'channel message first');

    // DM item queued second (newer createdAt).
    await enqueue(db, { kind: 'dm', conversationId: 'mixed-conv-1' }, 'dm message second');

    // Verify both rows are pending.
    const pending = await loadPending(db);
    expect(pending).toHaveLength(2);

    // Build a bidirectional router send fn (matches the fix applied to all 3 call-sites).
    const calls: Array<{ target: OutboxTarget; idempotencyKey: string }> = [];
    const bidrectionalRouter: SendFn = (target, body) => {
      calls.push({ target, idempotencyKey: body.idempotencyKey });
      // Both kinds succeed — no rejection.
      return Promise.resolve({ id: crypto.randomUUID() });
    };

    const delivered: string[] = [];
    const failed: string[] = [];

    await drain(
      db,
      bidrectionalRouter,
      (k) => delivered.push(k),
      (k) => failed.push(k),
    );

    // BOTH items sent — neither kind rejected or halted the drain.
    expect(calls).toHaveLength(2);

    // The first call is the channel item (older createdAt); second is DM.
    expect(calls[0]?.target.kind).toBe('channel');
    if (calls[0]?.target.kind === 'channel') {
      expect(calls[0].target.channelId).toBe('mixed-channel-1');
    }
    expect(calls[1]?.target.kind).toBe('dm');
    if (calls[1]?.target.kind === 'dm') {
      expect(calls[1].target.conversationId).toBe('mixed-conv-1');
    }

    // Both delivered, none failed.
    expect(delivered).toHaveLength(2);
    expect(failed).toHaveLength(0);

    // Outbox empty — no items stranded.
    expect(await db.outbox.toArray()).toHaveLength(0);
  });

  it('mixed DM+channel queue (DM first): both items flush regardless of ordering', async () => {
    // DM item queued first this time.
    await enqueue(db, { kind: 'dm', conversationId: 'mixed-conv-reverse' }, 'dm message first');

    // Channel item queued second.
    await enqueue(
      db,
      { kind: 'channel', channelId: 'mixed-channel-reverse' },
      'channel message second',
    );

    const calls: Array<{ target: OutboxTarget; idempotencyKey: string }> = [];
    const bidirectionalRouter: SendFn = (target, body) => {
      calls.push({ target, idempotencyKey: body.idempotencyKey });
      return Promise.resolve({ id: crypto.randomUUID() });
    };

    const delivered: string[] = [];
    const failed: string[] = [];

    await drain(
      db,
      bidirectionalRouter,
      (k) => delivered.push(k),
      (k) => failed.push(k),
    );

    // Both items sent in enqueue order (DM first, then channel).
    expect(calls).toHaveLength(2);
    expect(calls[0]?.target.kind).toBe('dm');
    expect(calls[1]?.target.kind).toBe('channel');

    // Both delivered, none failed, outbox empty.
    expect(delivered).toHaveLength(2);
    expect(failed).toHaveLength(0);
    expect(await db.outbox.toArray()).toHaveLength(0);
  });

  // ── Test 13: Legacy IDB row (no target field) falls back to channel routing ──
  //
  // Pre-wave-46 rows in IDB have no `target` field. The drain must fall back to
  // {kind:'channel', channelId} so existing offline rows are not stranded.

  it('legacy IDB row without target field falls back to channel routing', async () => {
    // Add a legacy-style row directly (no target field — pre-wave-46 format).
    await db.outbox.add({
      channelId: 'legacy-channel-7',
      idempotencyKey: 'legacy-row-key',
      content: 'legacy message',
      state: 'pending',
      createdAt: '2026-06-30T10:00:00.000Z',
      attempts: 0,
      // No target field — simulates a row written before wave-46.
    });

    const idMap = new Map<string, string>();
    const { sendFn, calls } = makeSendFn({ idMap });

    await drain(
      db,
      sendFn,
      () => {},
      () => {},
    );

    expect(calls).toHaveLength(1);
    // Drain fell back to channel routing from channelId field.
    expect(calls[0]?.target.kind).toBe('channel');
    if (calls[0]?.target.kind === 'channel') {
      expect(calls[0].target.channelId).toBe('legacy-channel-7');
    }
  });
});
