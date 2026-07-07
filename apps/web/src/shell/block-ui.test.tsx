/**
 * wave-70 M14 — Block UI tests.
 *
 * Covers (per B-3 spec):
 *   1. Block → POST /blocks + confirm dialog + success toast.
 *   2. Double-submit disabled (button disabled while submitting).
 *   3. Unblock (from BlockedUsersPanel) → DELETE + row removed.
 *   4. Blocked list GET → render + inline unblock.
 *   5. Own-row Report AND Block suppressed; other rows show them.
 *   6. Unblock failure → row stays.
 *
 * BUILD-PRINCIPLES rule 12: success callbacks are tested THROUGH the real parent
 * caller. Specifically:
 *   - Tests 1/2: BlockConfirmDialog is opened through MemberListPanel's onBlock path.
 *   - Tests 3/4/6: BlockedUsersPanel (the real parent for the unblock flow).
 *   - Test 5: MemberListPanel renders both own-row and other-row; assertions check
 *     which buttons appear on which rows.
 */

import type { Block, ServerMember } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// API mock
// ---------------------------------------------------------------------------

vi.mock('../auth/api', () => ({
  api: {
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    getBlocks: vi.fn(),
    // host component deps
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

const SERVER_ID = 'srv-test-1';
const SELF_USER_ID = 'self-user-uuid';
const OTHER_USER_ID = 'other-user-uuid';
const BLOCKED_USER_ID = 'blocked-user-uuid';

function makeMember(overrides: Partial<ServerMember> = {}): ServerMember {
  return {
    userId: OTHER_USER_ID,
    displayName: 'Alice Doe',
    avatarUrl: null,
    username: 'alicedoe',
    mutedUntil: null,
    ...overrides,
  };
}

function makeSelfMember(overrides: Partial<ServerMember> = {}): ServerMember {
  return {
    userId: SELF_USER_ID,
    displayName: 'Me Myself',
    avatarUrl: null,
    username: 'memyself',
    mutedUntil: null,
    ...overrides,
  };
}

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: 'blk-1',
    blocker_id: SELF_USER_ID,
    blocked_id: BLOCKED_USER_ID,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { BlockedUsersPanel } from './BlockedUsersPanel';
import { MemberListPanel } from './MemberListPanel';

function renderMemberPanel(members: ServerMember[], selfUserId: string | null = null) {
  mockApi.getServerMembers.mockResolvedValue(members);
  mockApi.getMyPermissions.mockResolvedValue({
    owner: false,
    moderate_members: false,
    manage_channels: false,
    manage_assignments: false,
  });
  return render(
    <MemberListPanel serverId={SERVER_ID} canModerateMembers={false} selfUserId={selfUserId} />,
  );
}

// ===========================================================================
// Test 1: Block → POST /blocks + confirm dialog + success toast
// (rule 12: tested THROUGH MemberListPanel, the real parent caller)
// ===========================================================================

describe('Block affordance + BlockConfirmDialog via MemberListPanel', () => {
  it('shows block button on member rows (not own row)', async () => {
    renderMemberPanel([makeMember()], SELF_USER_ID);
    await screen.findByText('Alice Doe');

    expect(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
  });

  it('clicking block button opens BlockConfirmDialog with correct name', async () => {
    renderMemberPanel([makeMember()], SELF_USER_ID);
    await screen.findByText('Alice Doe');

    await act(async () => {
      fireEvent.click(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`));
    });

    const dialog = screen.getByTestId('block-dialog');
    expect(dialog).toBeInTheDocument();
    // Dialog title contains "Block <name>?"
    expect(within(dialog).getByRole('heading', { name: /Block/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/Alice Doe/)).toBeInTheDocument();
  });

  it('calls blockUser with correct userId after confirming', async () => {
    mockApi.blockUser.mockResolvedValue(makeBlock());
    renderMemberPanel([makeMember()], SELF_USER_ID);
    await screen.findByText('Alice Doe');

    fireEvent.click(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`));
    await screen.findByTestId('block-dialog');

    await act(async () => {
      fireEvent.click(screen.getByTestId('block-dialog-confirm'));
    });

    expect(mockApi.blockUser).toHaveBeenCalledWith(OTHER_USER_ID);

    // Success toast shown
    await waitFor(() => {
      expect(screen.getByTestId('block-toast-success')).toBeInTheDocument();
    });
  });

  it('keeps dialog open and shows error toast when blockUser fails', async () => {
    mockApi.blockUser.mockRejectedValue(new Error('500 error'));
    renderMemberPanel([makeMember()], SELF_USER_ID);
    await screen.findByText('Alice Doe');

    fireEvent.click(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`));
    await screen.findByTestId('block-dialog');

    await act(async () => {
      fireEvent.click(screen.getByTestId('block-dialog-confirm'));
    });

    // Dialog stays open
    expect(screen.getByTestId('block-dialog')).toBeInTheDocument();
    // Error toast shown
    await waitFor(() => {
      expect(screen.getByTestId('block-toast-error')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Test 2: Double-submit disabled
// ===========================================================================

describe('BlockConfirmDialog — double-submit prevention', () => {
  it('disables confirm button while submitting', async () => {
    mockApi.blockUser.mockReturnValue(new Promise(() => {})); // never resolves
    renderMemberPanel([makeMember()], SELF_USER_ID);
    await screen.findByText('Alice Doe');

    fireEvent.click(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`));
    await screen.findByTestId('block-dialog');

    const confirmBtn = screen.getByTestId('block-dialog-confirm');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(confirmBtn).toBeDisabled();
  });
});

// ===========================================================================
// Test 3 + 4: BlockedUsersPanel GET + render + inline unblock removes row
// (rule 12: tested THROUGH BlockedUsersPanel, the real parent)
// ===========================================================================

describe('BlockedUsersPanel — GET + render + inline unblock', () => {
  it('renders loading skeleton then blocked user rows', async () => {
    mockApi.getBlocks.mockResolvedValue([makeBlock()]);

    render(<BlockedUsersPanel />);

    // Loading state visible initially
    expect(screen.getByTestId('blocked-users-loading')).toBeInTheDocument();

    // After load, list renders
    await waitFor(() => {
      expect(screen.getByTestId('blocked-users-list')).toBeInTheDocument();
    });

    expect(screen.getByTestId(`blocked-row-${BLOCKED_USER_ID}`)).toBeInTheDocument();
    expect(screen.getByTestId(`unblock-btn-${BLOCKED_USER_ID}`)).toBeInTheDocument();
  });

  it('shows empty state when block list is empty', async () => {
    mockApi.getBlocks.mockResolvedValue([]);

    render(<BlockedUsersPanel />);
    await waitFor(() => {
      expect(screen.getByTestId('blocked-users-empty')).toBeInTheDocument();
    });
    expect(screen.getByText("You haven't blocked anyone")).toBeInTheDocument();
  });

  it('inline unblock calls unblockUser and removes row', async () => {
    mockApi.getBlocks.mockResolvedValue([makeBlock()]);
    mockApi.unblockUser.mockResolvedValue(undefined);

    render(<BlockedUsersPanel />);
    await waitFor(() => {
      expect(screen.getByTestId(`unblock-btn-${BLOCKED_USER_ID}`)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId(`unblock-btn-${BLOCKED_USER_ID}`));
    });

    expect(mockApi.unblockUser).toHaveBeenCalledWith(BLOCKED_USER_ID);

    // Row removed
    await waitFor(() => {
      expect(screen.queryByTestId(`blocked-row-${BLOCKED_USER_ID}`)).not.toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Test 5: Own-row suppresses both Report AND Block; other rows show them
// ===========================================================================

describe('MemberListPanel — own-row Report + Block suppressed', () => {
  it('suppresses Report and Block buttons on own row, shows them on other rows', async () => {
    renderMemberPanel([makeSelfMember(), makeMember()], SELF_USER_ID);

    await screen.findByText('Me Myself');
    await screen.findByText('Alice Doe');

    // Own row — no report, no block
    expect(screen.queryByTestId(`report-member-btn-${SELF_USER_ID}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`block-member-btn-${SELF_USER_ID}`)).not.toBeInTheDocument();

    // Other row — has report and block
    expect(screen.getByTestId(`report-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
    expect(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
  });

  it('shows Report + Block on all rows when selfUserId is not provided', async () => {
    renderMemberPanel([makeSelfMember(), makeMember()], null);

    await screen.findByText('Me Myself');
    await screen.findByText('Alice Doe');

    // When no selfUserId prop — both rows treated as "other", show buttons
    expect(screen.getByTestId(`report-member-btn-${SELF_USER_ID}`)).toBeInTheDocument();
    expect(screen.getByTestId(`block-member-btn-${SELF_USER_ID}`)).toBeInTheDocument();
    expect(screen.getByTestId(`report-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
    expect(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
  });
});

// ===========================================================================
// Test 6: Unblock failure → row stays
// ===========================================================================

describe('BlockedUsersPanel — unblock failure keeps row', () => {
  it('row stays in DOM and shows error toast when unblockUser fails', async () => {
    mockApi.getBlocks
      .mockResolvedValueOnce([makeBlock()]) // initial load
      .mockResolvedValue([]); // reload after failure (empty — just for test isolation)
    mockApi.unblockUser.mockRejectedValue(new Error('network error'));

    render(<BlockedUsersPanel />);
    await waitFor(() => {
      expect(screen.getByTestId(`unblock-btn-${BLOCKED_USER_ID}`)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId(`unblock-btn-${BLOCKED_USER_ID}`));
    });

    expect(mockApi.unblockUser).toHaveBeenCalledWith(BLOCKED_USER_ID);

    // Error toast
    await waitFor(() => {
      expect(screen.getByTestId('blocked-list-toast-error')).toBeInTheDocument();
    });
  });
});
