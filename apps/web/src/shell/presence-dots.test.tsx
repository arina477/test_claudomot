/**
 * Presence dot tests — wave-26 B-3 / wave-27 Spec-B.
 *
 * Coverage:
 * 1. PresenceDot: online (emerald token), offline (surface-500 token), size variant.
 * 2. MessageList author-avatar presence dots:
 *    a. Author online in store → dot present with online color.
 *    b. Author offline in store → dot present with offline color.
 *    c. Author NOT in store (unknown) → no dot (graceful degrade, AC3).
 *    d. Live update: author flips online→offline → dot updates without reload.
 * 3. MemberListPanel regression: members still render correct dots via PresenceDot (AC5).
 * 4. Single socket/store assertion (AC4 / wave-27 AC1): the message list holds exactly
 *    ONE presence subscription regardless of row count (lifted from per-row to list-level).
 * 5. CARRY-B: per-author render-scoping — a presence event for author-B does not cause
 *    a functional re-render of author-A's dot when A's status is unchanged.
 */

import type { MessageResponse } from '@studyhall/shared';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock presenceSocket — module singleton mirrored for test control
// ---------------------------------------------------------------------------

type PresenceSubscriber = () => void;
let _subscribers: Set<PresenceSubscriber> = new Set();
const _store = new Map<string, 'online' | 'offline'>();

// Track call counts to assert single-socket use (AC4).
let subscribePresenceCallCount = 0;

vi.mock('./presenceSocket', () => ({
  getPresenceSocket: vi.fn(),
  getPresenceStatus: vi.fn((userId: string) => _store.get(userId) ?? 'offline'),
  hasPresence: vi.fn((userId: string) => _store.has(userId)),
  subscribePresence: vi.fn((handler: PresenceSubscriber) => {
    subscribePresenceCallCount++;
    _subscribers.add(handler);
    return () => {
      _subscribers.delete(handler);
    };
  }),
  getPresenceSnapshot: vi.fn(() => _store),
  getTypers: vi.fn(() => []),
  subscribeTyping: vi.fn(() => () => {}),
  joinPresenceChannel: vi.fn(),
  emitTypingStart: vi.fn(),
  emitTypingStop: vi.fn(),
  // seedSelfPresence: mirrors the real implementation — sets userId → 'online' in the
  // mock store (only when not already present) and notifies subscribers.
  seedSelfPresence: vi.fn((userId: string) => {
    if (!_store.has(userId)) {
      _store.set(userId, 'online');
      for (const sub of _subscribers) sub();
    }
  }),
}));

/** Helper: set a userId's status in the mock store and notify subscribers. */
function setPresence(userId: string, status: 'online' | 'offline') {
  _store.set(userId, status);
  for (const sub of _subscribers) sub();
}

/** Helper: remove a userId from the mock store (simulates "unknown"). */
function clearPresence(userId: string) {
  _store.delete(userId);
  for (const sub of _subscribers) sub();
}

// ---------------------------------------------------------------------------
// Mock other dependencies so we can render the components in isolation
// ---------------------------------------------------------------------------

vi.mock('../auth/api', () => ({
  api: {
    getServerMembers: vi.fn(),
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    getProfile: vi.fn().mockReturnValue(new Promise(() => {})),
    getServers: vi.fn().mockReturnValue(new Promise(() => {})),
    getServerDetail: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}));

vi.mock('./messagingSocket', () => ({
  getMessagingSocket: vi.fn(() => ({ connected: false, on: vi.fn(), off: vi.fn() })),
  joinChannel: vi.fn(),
  leaveChannel: vi.fn(),
  onMessageNew: vi.fn(() => () => {}),
  onMessageUpdated: vi.fn(() => () => {}),
  onMessageDeleted: vi.fn(() => () => {}),
  onReactionAdded: vi.fn(() => () => {}),
  onReactionRemoved: vi.fn(() => () => {}),
  applyReactionEvent: vi.fn(),
  onThreadReplyCreated: vi.fn(() => () => {}),
  onThreadReplyDeleted: vi.fn(() => () => {}),
  getSocketState: vi.fn(() => 'online'),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { MemberListPanel } from './MemberListPanel';
import { MessageList } from './MessageList';
import type { DisplayMessage } from './MessageList';
import { PresenceDot } from './PresenceDot';
import { seedSelfPresence } from './presenceSocket';

import { api } from '../auth/api';
const mockApi = api as unknown as { getServerMembers: ReturnType<typeof vi.fn> };
const mockSeedSelfPresence = seedSelfPresence as unknown as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRealMsg(overrides: Partial<MessageResponse> = {}): DisplayMessage {
  return {
    kind: 'real',
    id: crypto.randomUUID(),
    channelId: 'ch-1',
    authorId: 'user-abc',
    content: 'Hello',
    createdAt: new Date().toISOString(),
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    reactions: [],
    mentions: [],
    ...overrides,
  };
}

function renderMessageList(msgs: DisplayMessage[]) {
  return render(
    <MessageList
      messages={msgs}
      loadingInitial={false}
      loadingOlder={false}
      errorInitial={false}
      hasOlderMessages={false}
      onLoadOlder={vi.fn()}
      onRetry={vi.fn()}
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  _store.clear();
  _subscribers = new Set();
  subscribePresenceCallCount = 0;
  vi.clearAllMocks();
});

// ── 1. PresenceDot component ─────────────────────────────────────────────────

describe('PresenceDot', () => {
  it('renders an online dot using the emerald CSS token', () => {
    const { getByTestId } = render(<PresenceDot online={true} />);
    const dot = getByTestId('presence-dot-inner');
    // JSDOM does not resolve CSS custom properties; the inline style string is stored verbatim.
    expect(dot.getAttribute('style')).toContain('var(--color-accent-emerald)');
  });

  it('renders an offline dot using the surface-500 CSS token', () => {
    const { getByTestId } = render(<PresenceDot online={false} />);
    const dot = getByTestId('presence-dot-inner');
    expect(dot.getAttribute('style')).toContain('var(--color-surface-500)');
  });

  it('renders an sr-only accessible label for online state and exposes it to the a11y tree', () => {
    const { container } = render(<PresenceDot online={true} />);
    const label = screen.getByText('Online');
    expect(label).toBeInTheDocument();
    // The label must NOT be inside an aria-hidden subtree — if any ancestor carries
    // aria-hidden="true" the entire subtree is removed from the a11y tree and screen
    // readers never announce the status (the regression this test guards against).
    let node: Element | null = label;
    while (node && node !== container) {
      expect(node).not.toHaveAttribute('aria-hidden', 'true');
      node = node.parentElement;
    }
  });

  it('renders an sr-only accessible label for offline state and exposes it to the a11y tree', () => {
    const { container } = render(<PresenceDot online={false} />);
    const label = screen.getByText('Offline');
    expect(label).toBeInTheDocument();
    // Same ancestor-aria-hidden guard as online state.
    let node: Element | null = label;
    while (node && node !== container) {
      expect(node).not.toHaveAttribute('aria-hidden', 'true');
      node = node.parentElement;
    }
  });

  it('outer container does NOT carry aria-hidden (regression guard)', () => {
    // aria-hidden on the outer container would suppress the sr-only label entirely.
    // The decorative inner dot may carry aria-hidden; the outer wrapper must not.
    const { getByTestId } = render(<PresenceDot online={true} />);
    const innerDot = getByTestId('presence-dot-inner');
    // Inner dot is allowed to be aria-hidden (it's purely decorative).
    expect(innerDot).toHaveAttribute('aria-hidden', 'true');
    // Outer container (parent of inner dot and sr-only label) must NOT be aria-hidden.
    const outerContainer = innerDot.parentElement;
    expect(outerContainer).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('applies a custom size to the inner dot', () => {
    const { getByTestId } = render(<PresenceDot online={true} size={8} />);
    const dot = getByTestId('presence-dot-inner');
    expect(dot.getAttribute('style')).toContain('width: 8px');
    expect(dot.getAttribute('style')).toContain('height: 8px');
  });
});

// ── 2. MessageList author-avatar presence dots ────────────────────────────────

describe('MessageList author-avatar presence dots', () => {
  it('shows online dot when author is online in the presence store', () => {
    setPresence('user-alice', 'online');
    renderMessageList([makeRealMsg({ authorId: 'user-alice' })]);
    // The online dot uses the emerald token
    const onlineDots = document.querySelectorAll<HTMLDivElement>('[style*="color-accent-emerald"]');
    expect(onlineDots.length).toBeGreaterThan(0);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows offline dot when author is offline in the store', () => {
    setPresence('user-bob', 'offline');
    renderMessageList([makeRealMsg({ authorId: 'user-bob' })]);
    const offlineDots = document.querySelectorAll<HTMLDivElement>('[style*="color-surface-500"]');
    expect(offlineDots.length).toBeGreaterThan(0);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders NO dot when author is NOT in the store (unknown — graceful degrade, AC3)', () => {
    // Author key absent from store — hasPresence returns false.
    // AC3: unknown author must produce NO dot at all, not a default offline dot.
    clearPresence('user-unknown');
    const { queryByTestId } = renderMessageList([makeRealMsg({ authorId: 'user-unknown' })]);
    // Neither online nor offline label present — no PresenceDot rendered.
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    expect(queryByTestId('presence-dot-inner')).not.toBeInTheDocument();
  });

  it('updates dot when author flips from online to offline (live update, AC1)', async () => {
    setPresence('user-charlie', 'online');
    renderMessageList([makeRealMsg({ authorId: 'user-charlie' })]);
    expect(screen.getByText('Online')).toBeInTheDocument();

    // Simulate presence event: charlie goes offline
    act(() => {
      setPresence('user-charlie', 'offline');
    });

    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('removes dot when author transitions from online to unknown (AC3 live degrade)', () => {
    // Author starts known-online, then is removed from the store (e.g. server eviction).
    setPresence('user-delta', 'online');
    const { queryByTestId } = renderMessageList([makeRealMsg({ authorId: 'user-delta' })]);
    expect(screen.getByText('Online')).toBeInTheDocument();

    // Simulate the author becoming unknown (absent from store).
    act(() => {
      clearPresence('user-delta');
    });

    // No dot rendered — unknown author degrades to no dot (AC3).
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    expect(queryByTestId('presence-dot-inner')).not.toBeInTheDocument();
  });

  /**
   * Self-author regression guard — the bug this wave's T-5 caught.
   *
   * The server's presence snapshot excludes the connecting user's own userId
   * (getCoMemberUserIds filters self). Without seedSelfPresence(), hasPresence(selfId)
   * is always false → AuthorPresenceDot returns null for the viewer's own messages.
   *
   * After seedSelfPresence(selfId) runs (mirrored by the mock above), the viewer's
   * own userId IS in the store as 'online', so the dot resolves correctly.
   *
   * This test exercises the real reproduction path: the author-id is the viewer's
   * own userId (normally absent from the snapshot), and it only becomes known after
   * seedSelfPresence() seeds it.
   */
  it('self-author: shows online dot after seedSelfPresence seeds the viewer own userId (T-5 regression)', () => {
    // Reproduce prod condition: viewer's own userId NOT yet in store (snapshot excludes self).
    const SELF_ID = 'self-user-00000000-0000-0000-0000-000000000001';
    // Confirm the store does NOT have self before the seed.
    expect(_store.has(SELF_ID)).toBe(false);

    // Render a message authored by the viewer (own message row — the failing case on prod).
    renderMessageList([makeRealMsg({ authorId: SELF_ID })]);

    // Before seed: dot is absent (store doesn't know this author yet).
    expect(screen.queryByText('Online')).not.toBeInTheDocument();

    // Simulate ProfileContext calling seedSelfPresence (which sets SELF_ID → 'online').
    act(() => {
      mockSeedSelfPresence(SELF_ID);
    });

    // After seed: viewer's own message shows the online dot.
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  /**
   * Self-author: seedSelfPresence must NOT overwrite an already-known status.
   *
   * If the user was included in a snapshot or received an online/offline event
   * before seedSelfPresence fires (e.g. race between profile load and snapshot),
   * the existing status must be preserved.
   */
  it('self-author: seedSelfPresence does not overwrite existing presence status (idempotent seed)', () => {
    const SELF_ID = 'self-user-idempotent';
    // Simulate: server already sent an online event for this userId (unusual but possible).
    setPresence(SELF_ID, 'offline');

    renderMessageList([makeRealMsg({ authorId: SELF_ID })]);
    expect(screen.getByText('Offline')).toBeInTheDocument();

    // seedSelfPresence should not overwrite the existing 'offline' status.
    act(() => {
      mockSeedSelfPresence(SELF_ID);
    });

    // Status must remain 'offline' — idempotent seed (store already has the key).
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
  });

  it('does not render any presence dot on optimistic PendingRow (CARRY-2 degrade)', () => {
    const pendingMsg: DisplayMessage = {
      kind: 'optimistic',
      idempotencyKey: 'idk-1',
      content: 'Sending...',
      authorDisplay: 'Me',
      state: 'pending',
    };
    renderMessageList([pendingMsg]);
    // No presence dot labels for an optimistic row (no authorId available)
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  it('does not render any presence dot on optimistic FailedRow (CARRY-2 degrade)', () => {
    const failedMsg: DisplayMessage = {
      kind: 'optimistic',
      idempotencyKey: 'idk-2',
      content: 'Failed',
      authorDisplay: 'Me',
      state: 'failed',
    };
    renderMessageList([failedMsg]);
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });
});

// ── 3. MemberListPanel regression (AC5) ──────────────────────────────────────

describe('MemberListPanel regression — PresenceDot used for member dots', () => {
  it('renders Online sr-only label for an online member and exposes it to the a11y tree', async () => {
    setPresence('member-1', 'online');
    mockApi.getServerMembers.mockResolvedValue([
      { userId: 'member-1', displayName: 'Alice', avatarUrl: null },
    ]);
    const { container } = render(<MemberListPanel serverId="srv-1" />);
    // Wait for members to load
    await screen.findByText('Alice');
    const label = screen.getByText('Online');
    expect(label).toBeInTheDocument();
    // Guard: label must not be inside an aria-hidden ancestor.
    let node: Element | null = label;
    while (node && node !== container) {
      expect(node).not.toHaveAttribute('aria-hidden', 'true');
      node = node.parentElement;
    }
  });

  it('renders Offline sr-only label for an offline member and exposes it to the a11y tree', async () => {
    setPresence('member-2', 'offline');
    mockApi.getServerMembers.mockResolvedValue([
      { userId: 'member-2', displayName: 'Bob', avatarUrl: null },
    ]);
    const { container } = render(<MemberListPanel serverId="srv-2" />);
    await screen.findByText('Bob');
    const label = screen.getByText('Offline');
    expect(label).toBeInTheDocument();
    // Guard: label must not be inside an aria-hidden ancestor.
    let node: Element | null = label;
    while (node && node !== container) {
      expect(node).not.toHaveAttribute('aria-hidden', 'true');
      node = node.parentElement;
    }
  });

  it('renders both Online and Offline dots for mixed-presence member list', async () => {
    setPresence('m-online', 'online');
    setPresence('m-offline', 'offline');
    mockApi.getServerMembers.mockResolvedValue([
      { userId: 'm-online', displayName: 'Carol', avatarUrl: null },
      { userId: 'm-offline', displayName: 'Dave', avatarUrl: null },
    ]);
    render(<MemberListPanel serverId="srv-3" />);
    await screen.findByText('Carol');
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  /**
   * AC1 (wave-27) / Single presence subscription guard.
   *
   * wave-27 Spec-B lifts the subscription from per-AuthorPresenceDot to a single
   * list-level useEffect in MessageList. Regardless of how many real-message rows
   * are rendered, subscribePresence must be called exactly ONCE.
   *
   * Both MemberListPanel (via usePresence) and MessageList (via the list-level
   * subscription) share the same module-level presenceStore and _socket singleton
   * in presenceSocket.ts — confirmed by structural ESM module graph sharing.
   *
   * We cannot inspect raw WebSocket count in a unit test (socket.io fully mocked).
   * Instead we assert the call count is exactly 1 for N messages — the subscriber
   * budget was O(N) in wave-26; it is O(1) in wave-27.
   */
  it('(AC1/wave-27) subscribePresence is called exactly ONCE for a multi-message list', async () => {
    setPresence('u1', 'online');
    setPresence('u2', 'offline');
    const msgs: DisplayMessage[] = [
      makeRealMsg({ authorId: 'u1' }),
      makeRealMsg({ authorId: 'u2' }),
    ];
    renderMessageList(msgs);
    // List-level subscription: 2 real messages → 1 subscription, not 2.
    expect(subscribePresenceCallCount).toBe(1);
  });

  /**
   * CARRY-B: per-author render-scoping.
   *
   * A presence event for author-B must not functionally change what author-A's dot
   * renders. After user-B goes offline, user-A's dot still shows the same state it
   * had before the event (online in this case).
   *
   * Implementation: AuthorPresenceDot is wrapped in React.memo with a custom
   * areEqual that derives the tri-state for the given authorId and bails out
   * when it has not changed — even though the shared presenceTick incremented.
   */
  it('(CARRY-B) presence event for author-B does not change author-A dot output', () => {
    setPresence('carry-a', 'online');
    setPresence('carry-b', 'online');
    renderMessageList([makeRealMsg({ authorId: 'carry-a' }), makeRealMsg({ authorId: 'carry-b' })]);
    // Both dots online initially.
    expect(screen.getAllByText('Online')).toHaveLength(2);

    // Only user-B goes offline.
    act(() => {
      setPresence('carry-b', 'offline');
    });

    // user-A's dot is still online; user-B's is now offline.
    expect(screen.getAllByText('Online')).toHaveLength(1);
    expect(screen.getAllByText('Offline')).toHaveLength(1);
  });
});
