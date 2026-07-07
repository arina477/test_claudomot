/**
 * wave-71 P0 fix — real-store dialog-driven block-toggle test.
 *
 * Unlike block-toggle.test.tsx and block-ui.test.tsx (which wholesale-mock
 * useBlocks), this file does NOT mock the useBlocks module.  The real module-
 * level store runs, so the optimistic add in doBlockUser flows through to every
 * subscriber — including the MemberItem component that renders Block/Unblock.
 *
 * Mock boundary: api layer only (api.getBlocks / api.blockUser / api.unblockUser).
 *
 * Test:
 *   - Render MemberListPanel with a real useBlocks store whose initial
 *     getBlocks returns empty (no blocked users).
 *   - Click the member-row Block button → BlockConfirmDialog opens.
 *   - Click "Block User" (confirm) → doBlockUser fires, api.blockUser resolves,
 *     optimistic blockedSet update propagates to MemberItem.
 *   - Assert: row now shows Unblock (not Block).
 *   - Assert: api.blockUser called exactly once (no double-POST).
 */

import type { ServerMember } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetBlocksStore } from './useBlocks';

// ---------------------------------------------------------------------------
// API mock — only the api layer; useBlocks is NOT mocked
// ---------------------------------------------------------------------------

vi.mock('../auth/api', () => ({
  api: {
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    getBlocks: vi.fn(),
    getServerMembers: vi.fn(),
    getMyPermissions: vi.fn(),
  },
}));

import { api } from '../auth/api';

type MockApi = {
  blockUser: ReturnType<typeof vi.fn>;
  unblockUser: ReturnType<typeof vi.fn>;
  getBlocks: ReturnType<typeof vi.fn>;
  getServerMembers: ReturnType<typeof vi.fn>;
  getMyPermissions: ReturnType<typeof vi.fn>;
};
const mockApi = api as unknown as MockApi;

// ---------------------------------------------------------------------------
// Presence mock (needed by MemberListPanel)
// ---------------------------------------------------------------------------

vi.mock('./presenceSocket', () => ({
  getPresenceSocket: vi.fn(),
  getPresenceStatus: vi.fn(() => 'offline'),
  hasPresence: vi.fn(() => false),
  subscribePresence: vi.fn(() => () => {}),
  getPresenceSnapshot: vi.fn(() => new Map()),
  getTypers: vi.fn(() => []),
  subscribeTyping: vi.fn(() => () => {}),
  joinPresenceChannel: vi.fn(),
  emitTypingStart: vi.fn(),
  emitTypingStop: vi.fn(),
  seedSelfPresence: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SERVER_ID = 'srv-store-test';
const SELF_USER_ID = 'self-store-uuid';
const OTHER_USER_ID = 'other-store-uuid';
const DISPLAY_NAME = 'Carol Store';

function makeMember(overrides: Partial<ServerMember> = {}): ServerMember {
  return {
    userId: OTHER_USER_ID,
    displayName: DISPLAY_NAME,
    avatarUrl: null,
    username: 'carolstore',
    mutedUntil: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown — reset module-level store between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  _resetBlocksStore();

  // Default: getBlocks returns empty list (no blocked users on initial fetch)
  mockApi.getBlocks.mockResolvedValue([]);
  mockApi.getServerMembers.mockResolvedValue([makeMember()]);
  mockApi.getMyPermissions.mockResolvedValue({
    owner: false,
    moderate_members: false,
    manage_channels: false,
    manage_assignments: false,
  });
});

afterEach(() => {
  _resetBlocksStore();
});

// ---------------------------------------------------------------------------
// Import component under test
// ---------------------------------------------------------------------------

import { MemberListPanel } from './MemberListPanel';

// ===========================================================================
// Real-store dialog-driven block-toggle test
// ===========================================================================

describe('BlockConfirmDialog → useBlocks store wiring (real store)', () => {
  it('member row flips to Unblock after dialog confirm, api.blockUser called once', async () => {
    // api.blockUser resolves successfully (returns a block record)
    mockApi.blockUser.mockResolvedValue({
      id: 'blk-store-1',
      blocker_id: SELF_USER_ID,
      blocked_id: OTHER_USER_ID,
      created_at: new Date().toISOString(),
    });

    // Second getBlocks call (triggered by doBlockUser re-fetch after success)
    // returns the new blocked entry so the store's blocks array is consistent.
    mockApi.getBlocks
      .mockResolvedValueOnce([]) // initial fetch on mount
      .mockResolvedValue([
        {
          id: 'blk-store-1',
          blocker_id: SELF_USER_ID,
          blocked_id: OTHER_USER_ID,
          created_at: new Date().toISOString(),
          blockedUser: {
            userId: OTHER_USER_ID,
            displayName: DISPLAY_NAME,
            username: 'carolstore',
            avatarUrl: null,
          },
        },
      ]);

    render(
      <MemberListPanel serverId={SERVER_ID} canModerateMembers={false} selfUserId={SELF_USER_ID} />,
    );

    // Wait for member list to render the member row
    await screen.findByText(DISPLAY_NAME);

    // Block button is shown (not blocked yet)
    const blockBtn = screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`);
    expect(blockBtn).toBeInTheDocument();
    expect(screen.queryByTestId(`unblock-member-btn-${OTHER_USER_ID}`)).not.toBeInTheDocument();

    // Open the BlockConfirmDialog
    await act(async () => {
      fireEvent.click(blockBtn);
    });

    // Dialog is visible
    const dialog = screen.getByTestId('block-dialog');
    expect(dialog).toBeInTheDocument();

    // Click "Block User" confirm button
    await act(async () => {
      fireEvent.click(screen.getByTestId('block-dialog-confirm'));
    });

    // api.blockUser must have been called exactly once (no double-POST)
    expect(mockApi.blockUser).toHaveBeenCalledTimes(1);
    expect(mockApi.blockUser).toHaveBeenCalledWith(OTHER_USER_ID);

    // After the store's optimistic update, the member row must flip to Unblock
    await waitFor(() => {
      expect(screen.getByTestId(`unblock-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(`block-member-btn-${OTHER_USER_ID}`)).not.toBeInTheDocument();
  });

  it('on block API failure: row stays as Block, no double-POST, error toast shown', async () => {
    mockApi.blockUser.mockRejectedValue(new Error('network error'));

    render(
      <MemberListPanel serverId={SERVER_ID} canModerateMembers={false} selfUserId={SELF_USER_ID} />,
    );

    await screen.findByText(DISPLAY_NAME);

    await act(async () => {
      fireEvent.click(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`));
    });

    await screen.findByTestId('block-dialog');

    await act(async () => {
      fireEvent.click(screen.getByTestId('block-dialog-confirm'));
    });

    // api.blockUser called once (doBlockUser attempted; reverted on failure)
    expect(mockApi.blockUser).toHaveBeenCalledTimes(1);

    // Error toast shown
    await waitFor(() => {
      expect(screen.getByTestId('block-toast-error')).toBeInTheDocument();
    });

    // Dialog stays open (error path — not closed)
    expect(screen.getByTestId('block-dialog')).toBeInTheDocument();

    // Row did NOT flip to Unblock — doBlockUser rolled back the optimistic add
    expect(screen.queryByTestId(`unblock-member-btn-${OTHER_USER_ID}`)).not.toBeInTheDocument();
  });
});
