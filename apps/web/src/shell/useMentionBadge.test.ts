/**
 * Tests for useMentionBadge — wave-15 H-1 / H-2.
 *
 * Coverage:
 * 1. A `mention` event for a non-active channel increments that channel's badge.
 * 2. A `mention` event for the currently active channel is suppressed (no increment).
 * 3. resetMentionBadges() clears counts and re-enables bootstrap (logout flow).
 * 4. markChannelRead clears the count for a specific channel.
 */

import type { MentionEvent } from '@studyhall/shared';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Capture the mention handler so tests can trigger it directly.
let capturedMentionHandler: ((e: MentionEvent) => void) | null = null;

vi.mock('./messagingSocket', () => ({
  onMention: vi.fn((handler: (e: MentionEvent) => void) => {
    capturedMentionHandler = handler;
    return () => {
      capturedMentionHandler = null;
    };
  }),
  onMessageNew: vi.fn(() => () => {}),
}));

vi.mock('../auth/api', () => ({
  api: {
    getMyMentions: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are hoisted)
// ---------------------------------------------------------------------------

import { resetMentionBadges, useMentionBadge } from './useMentionBadge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMentionEvent(channelId: string): MentionEvent {
  return {
    messageId: crypto.randomUUID(),
    channelId,
    mentionedUserId: 'user-123',
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('useMentionBadge — mention event wiring (H-1)', () => {
  beforeEach(() => {
    capturedMentionHandler = null;
    // Reset singleton state before every test so tests are independent.
    resetMentionBadges();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetMentionBadges();
  });

  it('increments badge for a non-active channel when a mention event arrives', () => {
    const { result } = renderHook(() =>
      useMentionBadge('alice', /* activeChannelId */ 'ch-active'),
    );

    // Trigger a mention for a different channel
    act(() => {
      capturedMentionHandler?.(makeMentionEvent('ch-other'));
    });

    expect(result.current.getCount('ch-other')).toBe(1);
  });

  it('does not increment badge for the currently active channel', () => {
    const { result } = renderHook(() =>
      useMentionBadge('alice', /* activeChannelId */ 'ch-active'),
    );

    // Trigger a mention for the ACTIVE channel — should be suppressed
    act(() => {
      capturedMentionHandler?.(makeMentionEvent('ch-active'));
    });

    expect(result.current.getCount('ch-active')).toBe(0);
  });

  it('accumulates multiple mention events for the same channel', () => {
    const { result } = renderHook(() => useMentionBadge('alice', null));

    act(() => {
      capturedMentionHandler?.(makeMentionEvent('ch-1'));
      capturedMentionHandler?.(makeMentionEvent('ch-1'));
      capturedMentionHandler?.(makeMentionEvent('ch-1'));
    });

    expect(result.current.getCount('ch-1')).toBe(3);
  });

  it('markChannelRead clears the count for that channel', () => {
    const { result } = renderHook(() => useMentionBadge('alice', null));

    act(() => {
      capturedMentionHandler?.(makeMentionEvent('ch-1'));
    });
    expect(result.current.getCount('ch-1')).toBe(1);

    act(() => {
      result.current.markChannelRead('ch-1');
    });
    expect(result.current.getCount('ch-1')).toBe(0);
  });

  it('suppression uses the live activeChannelId (ref stays current after re-render)', () => {
    // Start with no active channel
    const { result, rerender } = renderHook(
      ({ active }: { active: string | null }) => useMentionBadge('alice', active),
      { initialProps: { active: null as string | null } },
    );

    // Switch to ch-active
    rerender({ active: 'ch-active' as string | null });

    // Now a mention for ch-active should be suppressed
    act(() => {
      capturedMentionHandler?.(makeMentionEvent('ch-active'));
    });
    expect(result.current.getCount('ch-active')).toBe(0);

    // A mention for a different channel still increments
    act(() => {
      capturedMentionHandler?.(makeMentionEvent('ch-other'));
    });
    expect(result.current.getCount('ch-other')).toBe(1);
  });
});

describe('useMentionBadge — singleton reset on logout (H-2)', () => {
  beforeEach(() => {
    capturedMentionHandler = null;
    resetMentionBadges();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetMentionBadges();
  });

  it('resetMentionBadges clears all counts', () => {
    const { result } = renderHook(() => useMentionBadge('alice', null));

    act(() => {
      capturedMentionHandler?.(makeMentionEvent('ch-1'));
    });
    expect(result.current.getCount('ch-1')).toBe(1);

    act(() => {
      resetMentionBadges();
    });

    expect(result.current.getCount('ch-1')).toBe(0);
  });

  it('username change triggers internal reset — subsequent user starts at zero', () => {
    // First user accumulates counts
    const { result, rerender } = renderHook(
      ({ username }: { username: string | null }) => useMentionBadge(username, null),
      { initialProps: { username: 'alice' as string | null } as { username: string | null } },
    );

    act(() => {
      capturedMentionHandler?.(makeMentionEvent('ch-1'));
    });
    expect(result.current.getCount('ch-1')).toBe(1);

    // Simulate logout — username goes to null
    rerender({ username: null });
    // At this point the internal reset fires; count should be zero
    expect(result.current.getCount('ch-1')).toBe(0);

    // Simulate a new user logging in
    rerender({ username: 'bob' });
    // Bob should see zero counts, not alice's
    expect(result.current.getCount('ch-1')).toBe(0);
  });
});
