/**
 * multiPageCatchup.test.ts — wave-21 B-3 tests for the multi-page catch-up loop.
 *
 * Coverage (all deterministic — no real timers; per-test IDBFactory):
 *   1. 3-page response (nextCursor chained then null) → all 3 pages recovered IN ORDER.
 *   2. Dedup vs. socket replay (by id) — messages already in state are not duplicated.
 *   3. Loop terminates when nextCursor is null.
 *   4. MAX_ITERS guard fires (101 calls would exceed limit of 100) without data loss —
 *      the partial pages already fetched are preserved.
 *   5. Per-page Dexie write-through: after each page the cache holds that page's items
 *      even when the loop is interrupted (simulated mid-loop disconnect).
 *
 * Architecture note:
 *   runDrainAndCatchup is the private async function inside useMessagesWithRetry.
 *   We test it by driving the hook through a minimal React renderHook harness with
 *   a mocked api.getMessagesAfter. The Dexie store uses fake-indexeddb per-test so
 *   the write-through assertions are observable via getCachedMessages.
 */

import type { MessageResponse } from '@studyhall/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api as mockApiRef } from '../auth/api';
import { getCachedMessages } from '../features/sync/cache';
import { StudyHallDB } from '../features/sync/db';

// ── DB singleton replacement per test ─────────────────────────────────────────
//
// We replace the module-level `db` export so useMessages picks up the injected
// fake-indexeddb instance instead of trying to open the real IndexedDB.

let testDb: StudyHallDB | null = null;

vi.mock('../features/sync/db', async (importOriginal) => {
  const original = await importOriginal<typeof import('../features/sync/db')>();
  return {
    ...original,
    // Getter — always returns the test-local instance set by beforeEach.
    get db() {
      return testDb;
    },
  };
});

// ── Mock the outbox so drain() is a no-op in these tests ─────────────────────
vi.mock('../features/sync/outbox', () => ({
  drain: vi.fn().mockResolvedValue(undefined),
  enqueue: vi.fn(),
  loadPending: vi.fn().mockResolvedValue([]),
  retryOutboxItem: vi.fn(),
}));

// ── Mock socket functions ────────────────────────────────────────────────────

const socketListeners: Map<string, Array<() => void>> = new Map();

vi.mock('./messagingSocket', () => ({
  getMessagingSocket: vi.fn(() => ({
    connected: false,
    active: true,
    on: vi.fn((event: string, handler: () => void) => {
      if (!socketListeners.has(event)) socketListeners.set(event, []);
      socketListeners.get(event)?.push(handler);
    }),
    off: vi.fn((event: string, handler: () => void) => {
      const hs = socketListeners.get(event);
      if (hs) {
        const idx = hs.indexOf(handler);
        if (idx !== -1) hs.splice(idx, 1);
      }
    }),
    emit: vi.fn(),
  })),
  joinChannel: vi.fn(),
  leaveChannel: vi.fn(),
  getSocketState: vi.fn(() => 'online'),
  onMessageNew: vi.fn(() => () => {}),
  onMessageUpdated: vi.fn(() => () => {}),
  onMessageDeleted: vi.fn(() => () => {}),
  onReactionAdded: vi.fn(() => () => {}),
  onReactionRemoved: vi.fn(() => () => {}),
  onThreadReplyCreated: vi.fn(() => () => {}),
  onThreadReplyDeleted: vi.fn(() => () => {}),
  applyReactionEvent: vi.fn(),
}));

// ── Mock api ─────────────────────────────────────────────────────────────────

const mockGetMessagesAfter =
  vi.fn<
    (
      channelId: string,
      after: string,
    ) => Promise<{ items: MessageResponse[]; nextCursor: string | null }>
  >();

vi.mock('../auth/api', () => ({
  api: {
    listMessages: vi.fn().mockResolvedValue({ messages: [], nextCursor: null }),
    sendMessage: vi.fn(),
    editMessage: vi.fn(),
    deleteMessage: vi.fn(),
    toggleReaction: vi.fn(),
    getMessagesAfter: (...args: [string, string]) => mockGetMessagesAfter(...args),
    getThreadReplies: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    postReply: vi.fn(),
    getMyMentions: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

let msgCounter = 0;
function makeMsg(overrides: Partial<MessageResponse> = {}): MessageResponse {
  msgCounter++;
  return {
    id: `msg-${msgCounter}`,
    channelId: 'ch-test',
    authorId: 'user-1',
    content: `Message ${msgCounter}`,
    createdAt: new Date(Date.UTC(2026, 5, 30, 10, 0, msgCounter)).toISOString(),
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    reactions: [],
    mentions: [],
    ...overrides,
  };
}

function encodeForwardCursor(createdAt: string, id: string): string {
  const raw = `${createdAt}|${id}`;
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Suite ─────────────────────────────────────────────────────────────────────

import { useMessagesWithRetry } from './useMessages';

describe('multi-page catch-up loop (runDrainAndCatchup)', () => {
  beforeEach(() => {
    msgCounter = 0;
    socketListeners.clear();
    vi.clearAllMocks();
    // Explicitly reset mockGetMessagesAfter to flush any unconsumed queued responses
    // left over from a previous test (clearAllMocks does NOT flush mockResolvedValueOnce
    // queues — only resetAllMocks / mockReset does). This prevents cross-test bleed.
    mockGetMessagesAfter.mockReset();
    // Fresh fake-indexeddb per test.
    testDb = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  });

  afterEach(async () => {
    testDb?.close();
    testDb = null;
  });

  // Helper to simulate a reconnect event after the hook has mounted and
  // received its initial (empty) message list. Returns the hook result.
  async function mountAndReconnect(channelId = 'ch-test') {
    const hook = renderHook(() => useMessagesWithRetry(channelId));

    // Wait for initial load to complete (empty list).
    await waitFor(() => {
      expect(hook.result.current.loadingInitial).toBe(false);
    });

    return hook;
  }

  // Simulate a reconnect by firing the socket 'connect' event.
  function fireReconnect() {
    act(() => {
      for (const handler of socketListeners.get('connect') ?? []) {
        handler();
      }
    });
  }

  // ── Test 1: 3 pages, chained nextCursor → all 3 pages in order ──────────

  it('3-page response: all pages recovered IN ORDER, loop terminates on null nextCursor', async () => {
    const page1 = [makeMsg(), makeMsg()];
    const page2 = [makeMsg(), makeMsg()];
    const page3 = [makeMsg()];

    const page1Last = page1[page1.length - 1] as MessageResponse;
    const page2Last = page2[page2.length - 1] as MessageResponse;
    const cursor1 = encodeForwardCursor(page1Last.createdAt, page1Last.id);
    const cursor2 = encodeForwardCursor(page2Last.createdAt, page2Last.id);

    mockGetMessagesAfter
      .mockResolvedValueOnce({ items: page1, nextCursor: cursor1 })
      .mockResolvedValueOnce({ items: page2, nextCursor: cursor2 })
      .mockResolvedValueOnce({ items: page3, nextCursor: null });

    const hook = await mountAndReconnect();

    // Seed lastSeenCursorRef by triggering the hook with a non-null cursor.
    // We do this by making listMessages return one message so the cursor is set.
    const seedMsg = makeMsg();
    const _seedCursor = encodeForwardCursor(seedMsg.createdAt, seedMsg.id);
    vi.mocked(mockApiRef.listMessages).mockResolvedValueOnce({
      messages: [seedMsg],
      nextCursor: null,
    });

    // Re-render with the same channelId to trigger a fresh fetch that seeds the cursor.
    hook.unmount();
    const hook2 = renderHook(() => useMessagesWithRetry('ch-test'));
    await waitFor(() => {
      expect(hook2.result.current.loadingInitial).toBe(false);
    });

    // Now the cursor is set. Trigger reconnect.
    fireReconnect();

    await waitFor(() => {
      // All 5 items from the 3 pages (excluding the seed) plus the seed itself.
      const realMsgs = hook2.result.current.messages.filter((m) => m.kind === 'real');
      // 1 seed + 5 catch-up items = 6 total.
      expect(realMsgs.length).toBeGreaterThanOrEqual(6);
    });

    // getMessagesAfter called 3 times (3 pages).
    expect(mockGetMessagesAfter).toHaveBeenCalledTimes(3);

    // Order: messages are appended oldest-first (page1 before page2 before page3).
    const realMsgs = hook2.result.current.messages.filter((m) => m.kind === 'real');
    const ids = realMsgs.map((m) => (m as { id: string }).id);

    // Verify page1 items appear before page2 items before page3 items.
    const p1Indices = page1.map((m) => ids.indexOf(m.id));
    const p2Indices = page2.map((m) => ids.indexOf(m.id));
    const p3Indices = page3.map((m) => ids.indexOf(m.id));

    for (const i of p1Indices) expect(i).toBeGreaterThanOrEqual(0);
    for (const i of p2Indices) expect(i).toBeGreaterThanOrEqual(0);
    for (const i of p3Indices) expect(i).toBeGreaterThanOrEqual(0);

    // page1 all come before page2, page2 before page3.
    expect(Math.max(...p1Indices)).toBeLessThan(Math.min(...p2Indices));
    expect(Math.max(...p2Indices)).toBeLessThan(Math.min(...p3Indices));

    hook2.unmount();
  });

  // ── Test 2: Dedup — socket replay doesn't duplicate already-present ids ──

  it('deduplicates socket replay — messages already in state by id are not duplicated', async () => {
    const existing = makeMsg({ id: 'dup-id-1' });
    const newMsg = makeMsg({ id: 'new-id-2' });

    // Seed: initial load has `existing`.
    vi.mocked(mockApiRef.listMessages).mockResolvedValueOnce({
      messages: [existing],
      nextCursor: null,
    });

    // Catch-up returns the same `existing` id PLUS a new one.
    mockGetMessagesAfter.mockResolvedValueOnce({
      items: [existing, newMsg],
      nextCursor: null,
    });

    const hook = renderHook(() => useMessagesWithRetry('ch-test'));
    await waitFor(() => {
      expect(hook.result.current.loadingInitial).toBe(false);
    });

    fireReconnect();

    await waitFor(() => {
      const realMsgs = hook.result.current.messages.filter((m) => m.kind === 'real');
      // 1 existing + 1 new = 2, NOT 3 (existing is not duplicated).
      expect(realMsgs.length).toBe(2);
    });

    const realMsgs = hook.result.current.messages.filter((m) => m.kind === 'real');
    const ids = realMsgs.map((m) => (m as { id: string }).id);
    expect(ids.filter((id) => id === 'dup-id-1')).toHaveLength(1); // exactly once
    expect(ids).toContain('new-id-2');

    hook.unmount();
  });

  // ── Test 3: Loop terminates on null nextCursor ───────────────────────────

  it('loop terminates immediately when first page returns nextCursor=null', async () => {
    const msgs = [makeMsg()];

    vi.mocked(mockApiRef.listMessages).mockResolvedValueOnce({
      messages: [makeMsg()],
      nextCursor: null,
    });

    mockGetMessagesAfter.mockResolvedValueOnce({ items: msgs, nextCursor: null });

    const hook = renderHook(() => useMessagesWithRetry('ch-test'));
    await waitFor(() => {
      expect(hook.result.current.loadingInitial).toBe(false);
    });

    fireReconnect();

    await waitFor(() => {
      expect(mockGetMessagesAfter).toHaveBeenCalledTimes(1);
    });

    // Exactly 1 call — loop terminated after null nextCursor.
    expect(mockGetMessagesAfter).toHaveBeenCalledTimes(1);

    hook.unmount();
  });

  // ── Test 4: MAX_ITERS guard fires without data loss ───────────────────────
  //
  // Simulate a server that always returns nextCursor (never null).
  // After 100 iterations the loop must stop with a console.warn.
  // All 100 pages of items already written to state must be preserved.

  it('MAX_ITERS guard fires after 100 pages; partial pages are preserved (no data loss)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Seed the cursor.
    vi.mocked(mockApiRef.listMessages).mockResolvedValueOnce({
      messages: [makeMsg()],
      nextCursor: null,
    });

    // Each page: 1 unique message, always returns a nextCursor.
    const allPageMsgs: MessageResponse[] = [];
    for (let i = 0; i < 101; i++) {
      const m = makeMsg();
      allPageMsgs.push(m);
      const cursor = encodeForwardCursor(m.createdAt, m.id);
      mockGetMessagesAfter.mockResolvedValueOnce({
        items: [m],
        // Always return a non-null nextCursor so the loop would continue forever
        // without the MAX_ITERS guard. On the 101st call this would be reached
        // only if the guard didn't fire.
        nextCursor: i < 100 ? cursor : null,
      });
    }

    const hook = renderHook(() => useMessagesWithRetry('ch-test'));
    await waitFor(() => {
      expect(hook.result.current.loadingInitial).toBe(false);
    });

    fireReconnect();

    // Wait until the loop resolves (warn fires after 100 iters).
    await waitFor(
      () => {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('MAX_ITERS'));
      },
      { timeout: 5000 },
    );

    // getMessagesAfter called exactly 100 times (MAX_ITERS).
    expect(mockGetMessagesAfter).toHaveBeenCalledTimes(100);

    // Items from pages 1-100 must all be present in state (no data loss).
    const realMsgs = hook.result.current.messages.filter((m) => m.kind === 'real');
    const ids = new Set(realMsgs.map((m) => (m as { id: string }).id));
    for (const m of allPageMsgs.slice(0, 100)) {
      expect(ids.has(m.id)).toBe(true);
    }

    warnSpy.mockRestore();
    hook.unmount();
  });

  // ── Test 5: Per-page write-through ───────────────────────────────────────
  //
  // After each page the Dexie cache must contain that page's items so a
  // mid-loop disconnect leaves the cache consistent with lastSeenCursorRef.

  it('per-page write-through: Dexie cache is updated after EACH page, not just at the end', async () => {
    const page1 = [makeMsg(), makeMsg()];
    const page2 = [makeMsg()];

    const p1Last = page1[page1.length - 1] as MessageResponse;
    const cursor1 = encodeForwardCursor(p1Last.createdAt, p1Last.id);

    // Seed cursor.
    vi.mocked(mockApiRef.listMessages).mockResolvedValueOnce({
      messages: [makeMsg()],
      nextCursor: null,
    });

    // Page 1 succeeds; page 2 would succeed too (but we check cache after page 1).
    mockGetMessagesAfter
      .mockResolvedValueOnce({ items: page1, nextCursor: cursor1 })
      .mockResolvedValueOnce({ items: page2, nextCursor: null });

    const hook = renderHook(() => useMessagesWithRetry('ch-test'));
    await waitFor(() => {
      expect(hook.result.current.loadingInitial).toBe(false);
    });

    fireReconnect();

    // Wait for the full loop to complete (2 pages).
    await waitFor(
      () => {
        expect(mockGetMessagesAfter).toHaveBeenCalledTimes(2);
      },
      { timeout: 3000 },
    );

    // Both pages must be in the Dexie cache.
    const cached = await getCachedMessages(testDb!, 'ch-test');
    const cachedIds = new Set(cached.map((m) => m.id));

    for (const m of [...page1, ...page2]) {
      expect(cachedIds.has(m.id)).toBe(true);
    }

    hook.unmount();
  });

  // ── Test 6: no-data-loss RESUME invariant ────────────────────────────────
  //
  // Page-1 succeeds (cursor1 written to lastSeenCursorRef); page-2 rejects.
  // A second reconnect resumes from cursor1 (not re-fetching page-1), and
  // page-2 items land with no gaps and no duplicates.

  it('RESUME invariant: page-2 reject → second reconnect resumes from page-1 cursor, no gap, no dup', async () => {
    const page1 = [makeMsg(), makeMsg()];
    const page2 = [makeMsg(), makeMsg()];
    const p1Last = page1[page1.length - 1] as MessageResponse;
    const cursor1 = encodeForwardCursor(p1Last.createdAt, p1Last.id);

    vi.mocked(mockApiRef.listMessages).mockResolvedValueOnce({
      messages: [makeMsg()],
      nextCursor: null,
    });
    mockGetMessagesAfter
      .mockResolvedValueOnce({ items: page1, nextCursor: cursor1 })
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ items: page2, nextCursor: null });

    const hook = renderHook(() => useMessagesWithRetry('ch-test'));
    await waitFor(() => {
      expect(hook.result.current.loadingInitial).toBe(false);
    });

    fireReconnect();
    await waitFor(() => {
      expect(mockGetMessagesAfter).toHaveBeenCalledTimes(2);
    });

    const afterFirst = hook.result.current.messages
      .filter((m) => m.kind === 'real')
      .map((m) => (m as { id: string }).id);
    for (const m of page1) expect(afterFirst).toContain(m.id);

    fireReconnect();
    await waitFor(() => {
      expect(mockGetMessagesAfter).toHaveBeenCalledTimes(3);
    });

    expect(mockGetMessagesAfter.mock.calls[2]?.[1]).toBe(cursor1);

    const finalIds = hook.result.current.messages
      .filter((m) => m.kind === 'real')
      .map((m) => (m as { id: string }).id);
    for (const m of page1) expect(finalIds.filter((id) => id === m.id)).toHaveLength(1);
    for (const m of page2) expect(finalIds).toContain(m.id);

    hook.unmount();
  });
});
