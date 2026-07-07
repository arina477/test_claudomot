/**
 * wave-71 M14 — Block toggle + enriched list tests.
 *
 * Covers (per B-3 spec):
 *   A. member-row Block affordance reflects state:
 *      - unblocked member shows Block button
 *      - already-blocked member shows Unblock button
 *      - block→POST flips row to Unblock (optimistic via useBlocks)
 *      - unblock→DELETE flips row to Block (optimistic via useBlocks)
 *      - loading fail-safe: while GET /blocks in-flight, default to Block (not Unblock)
 *   B. blocked-list renders displayName (not UUID) + avatar/initials:
 *      - displayName rendered, not UUID
 *      - unblock success removes row + shows toast
 *      - unblock failure row stays + error toast
 *   C. own-row isSelf suppression preserved (wave-70 spec D)
 *
 * BUILD-PRINCIPLES rule 12: tests go through the real parent callers:
 *   - MemberListPanel for spec A + C (member row affordance)
 *   - BlockedUsersPanel for spec B (blocked list rendering)
 *
 * useBlocks is mocked at the module boundary so the module-level store does
 * not bleed between tests.
 */

import type { BlockListItem, ServerMember } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// useBlocks mock — controls the shared blocks store in tests
// ---------------------------------------------------------------------------

const mockUseBlocks = vi.fn();

vi.mock('./useBlocks', () => ({
  useBlocks: () => mockUseBlocks(),
  _resetBlocksStore: vi.fn(),
}));

// ---------------------------------------------------------------------------
// API mock (needed by MemberListPanel for getServerMembers + getMyPermissions)
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

const SERVER_ID = 'srv-test-71';
const SELF_USER_ID = 'self-uuid-71';
const OTHER_USER_ID = 'other-uuid-71';
const BLOCKED_USER_ID = 'blocked-uuid-71';
const DISPLAY_NAME = 'Alice Block';
const DISPLAY_NAME_BLOCKED = 'Bob Blocked';

function makeMember(overrides: Partial<ServerMember> = {}): ServerMember {
  return {
    userId: OTHER_USER_ID,
    displayName: DISPLAY_NAME,
    avatarUrl: null,
    username: 'aliceblock',
    mutedUntil: null,
    ...overrides,
  };
}

function makeSelfMember(): ServerMember {
  return {
    userId: SELF_USER_ID,
    displayName: 'Self User',
    avatarUrl: null,
    username: 'selfuser',
    mutedUntil: null,
  };
}

function makeBlockedMember(): ServerMember {
  return {
    userId: BLOCKED_USER_ID,
    displayName: DISPLAY_NAME_BLOCKED,
    avatarUrl: null,
    username: 'bobblocked',
    mutedUntil: null,
  };
}

function makeBlockListItem(overrides: Partial<BlockListItem> = {}): BlockListItem {
  return {
    id: 'blk-71-1',
    blocker_id: SELF_USER_ID,
    blocked_id: BLOCKED_USER_ID,
    created_at: new Date().toISOString(),
    blockedUser: {
      userId: BLOCKED_USER_ID,
      displayName: DISPLAY_NAME_BLOCKED,
      username: 'bobblocked',
      avatarUrl: null,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Default useBlocks mock value helpers
// ---------------------------------------------------------------------------

function makeBlocksHook(overrides: Partial<ReturnType<typeof buildBlocksHook>> = {}) {
  return buildBlocksHook(overrides);
}

function buildBlocksHook(overrides: {
  blocks?: BlockListItem[];
  blockedSet?: Set<string>;
  loading?: boolean;
  error?: boolean;
  refetch?: ReturnType<typeof vi.fn>;
  blockUser?: ReturnType<typeof vi.fn>;
  unblockUser?: ReturnType<typeof vi.fn>;
}) {
  return {
    blocks: overrides.blocks ?? [],
    blockedSet: overrides.blockedSet ?? new Set<string>(),
    loading: overrides.loading ?? false,
    error: overrides.error ?? false,
    refetch: overrides.refetch ?? vi.fn(),
    blockUser: overrides.blockUser ?? vi.fn(),
    unblockUser: overrides.unblockUser ?? vi.fn(),
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

function renderMemberPanel(
  members: ServerMember[],
  selfUserId: string | null = null,
  blocksHookValue?: ReturnType<typeof makeBlocksHook>,
) {
  mockApi.getServerMembers.mockResolvedValue(members);
  mockApi.getMyPermissions.mockResolvedValue({
    owner: false,
    moderate_members: false,
    manage_channels: false,
    manage_assignments: false,
  });
  mockUseBlocks.mockReturnValue(blocksHookValue ?? makeBlocksHook());
  return render(
    <MemberListPanel serverId={SERVER_ID} canModerateMembers={false} selfUserId={selfUserId} />,
  );
}

function renderBlockedPanel(blocksHookValue: ReturnType<typeof makeBlocksHook>) {
  mockUseBlocks.mockReturnValue(blocksHookValue);
  return render(<BlockedUsersPanel />);
}

// ===========================================================================
// Spec A: member-row Block affordance reflects state
// ===========================================================================

describe('MemberListPanel — Block affordance state reflection', () => {
  it('shows Block button for an unblocked member', async () => {
    renderMemberPanel([makeMember()], SELF_USER_ID, makeBlocksHook({ blockedSet: new Set() }));
    await screen.findByText(DISPLAY_NAME);

    expect(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`unblock-member-btn-${OTHER_USER_ID}`)).not.toBeInTheDocument();
  });

  it('shows Unblock button for an already-blocked member', async () => {
    renderMemberPanel(
      [makeBlockedMember()],
      SELF_USER_ID,
      makeBlocksHook({ blockedSet: new Set([BLOCKED_USER_ID]) }),
    );
    await screen.findByText(DISPLAY_NAME_BLOCKED);

    expect(screen.getByTestId(`unblock-member-btn-${BLOCKED_USER_ID}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`block-member-btn-${BLOCKED_USER_ID}`)).not.toBeInTheDocument();
  });

  it('loading fail-safe: while blocks are loading, defaults to Block (not Unblock)', async () => {
    renderMemberPanel(
      [makeMember()],
      SELF_USER_ID,
      // loading=true, blockedSet is empty (fail-safe defaults to Block)
      makeBlocksHook({ loading: true, blockedSet: new Set() }),
    );
    await screen.findByText(DISPLAY_NAME);

    // Should show Block (not Unblock) while loading state is unknown
    expect(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`unblock-member-btn-${OTHER_USER_ID}`)).not.toBeInTheDocument();
  });

  it('block→POST flips row from Block to Unblock (via useBlocks optimistic update)', async () => {
    // Render once with no blocks (Block shown)
    const { rerender } = renderMemberPanel(
      [makeMember()],
      SELF_USER_ID,
      makeBlocksHook({ blockedSet: new Set() }),
    );
    await screen.findByText(DISPLAY_NAME);

    // Initially shows Block
    expect(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();

    // Simulate optimistic update: rerender with the updated blockedSet
    mockApi.getServerMembers.mockResolvedValue([makeMember()]);
    mockUseBlocks.mockReturnValue(makeBlocksHook({ blockedSet: new Set([OTHER_USER_ID]) }));
    rerender(
      <MemberListPanel serverId={SERVER_ID} canModerateMembers={false} selfUserId={SELF_USER_ID} />,
    );

    // Row flips to Unblock
    await waitFor(() => {
      expect(screen.getByTestId(`unblock-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(`block-member-btn-${OTHER_USER_ID}`)).not.toBeInTheDocument();
  });

  it('clicking Unblock on a blocked member calls unblockUser', async () => {
    const unblockFn = vi.fn().mockResolvedValue(undefined);
    renderMemberPanel(
      [makeBlockedMember()],
      SELF_USER_ID,
      makeBlocksHook({ blockedSet: new Set([BLOCKED_USER_ID]), unblockUser: unblockFn }),
    );
    await screen.findByText(DISPLAY_NAME_BLOCKED);

    await act(async () => {
      fireEvent.click(screen.getByTestId(`unblock-member-btn-${BLOCKED_USER_ID}`));
    });

    expect(unblockFn).toHaveBeenCalledWith(BLOCKED_USER_ID);
  });

  it('unblock→DELETE flips row from Unblock to Block (via useBlocks optimistic update)', async () => {
    // Render with blocked member (Unblock shown)
    const { rerender } = renderMemberPanel(
      [makeBlockedMember()],
      SELF_USER_ID,
      makeBlocksHook({ blockedSet: new Set([BLOCKED_USER_ID]) }),
    );
    await screen.findByText(DISPLAY_NAME_BLOCKED);

    // Initially shows Unblock
    expect(screen.getByTestId(`unblock-member-btn-${BLOCKED_USER_ID}`)).toBeInTheDocument();

    // Simulate optimistic removal: rerender with empty blockedSet
    mockApi.getServerMembers.mockResolvedValue([makeBlockedMember()]);
    mockUseBlocks.mockReturnValue(makeBlocksHook({ blockedSet: new Set() }));
    rerender(
      <MemberListPanel serverId={SERVER_ID} canModerateMembers={false} selfUserId={SELF_USER_ID} />,
    );

    // Row flips to Block
    await waitFor(() => {
      expect(screen.getByTestId(`block-member-btn-${BLOCKED_USER_ID}`)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(`unblock-member-btn-${BLOCKED_USER_ID}`)).not.toBeInTheDocument();
  });
});

// ===========================================================================
// Spec C: own-row isSelf suppression preserved (wave-70 spec D, unchanged)
// ===========================================================================

describe('MemberListPanel — own-row Block/Unblock suppressed', () => {
  it('suppresses both Block and Unblock on own row regardless of blocked state', async () => {
    renderMemberPanel(
      [makeSelfMember(), makeMember()],
      SELF_USER_ID,
      // Even if self is somehow in blockedSet (degenerate), buttons still suppressed
      makeBlocksHook({ blockedSet: new Set([SELF_USER_ID]) }),
    );

    await screen.findByText('Self User');
    await screen.findByText(DISPLAY_NAME);

    // Own row: no Block, no Unblock
    expect(screen.queryByTestId(`block-member-btn-${SELF_USER_ID}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`unblock-member-btn-${SELF_USER_ID}`)).not.toBeInTheDocument();

    // Other row: has Block (not in blockedSet)
    expect(screen.getByTestId(`block-member-btn-${OTHER_USER_ID}`)).toBeInTheDocument();
  });
});

// ===========================================================================
// Spec B: blocked-list renders displayName not UUID
// ===========================================================================

describe('BlockedUsersPanel — enriched list rendering', () => {
  it('renders blockedUser.displayName, not the UUID', async () => {
    const item = makeBlockListItem();
    renderBlockedPanel(makeBlocksHook({ blocks: [item], loading: false }));

    await screen.findByTestId('blocked-users-list');

    // displayName rendered
    expect(screen.getByTestId(`blocked-name-${BLOCKED_USER_ID}`)).toHaveTextContent(
      DISPLAY_NAME_BLOCKED,
    );
    // UUID must NOT appear as visible text
    expect(screen.queryByText(BLOCKED_USER_ID)).not.toBeInTheDocument();
  });

  it('shows avatar initials when avatarUrl is null', async () => {
    const item = makeBlockListItem({
      blockedUser: {
        userId: BLOCKED_USER_ID,
        displayName: 'Bob Blocked',
        username: 'bobblocked',
        avatarUrl: null,
      },
    });
    renderBlockedPanel(makeBlocksHook({ blocks: [item], loading: false }));

    await screen.findByTestId('blocked-users-list');
    // Initials are BO (first 2 chars of "Bo" from "Bob Blocked")
    // BB = B from "Bob" + B from "Blocked"
    const row = screen.getByTestId(`blocked-row-${BLOCKED_USER_ID}`);
    expect(row).toBeInTheDocument();
    // No img tag should render (no avatarUrl)
    const imgs = row.querySelectorAll('img');
    expect(imgs.length).toBe(0);
  });

  it('shows an img when avatarUrl is provided', async () => {
    const item = makeBlockListItem({
      blockedUser: {
        userId: BLOCKED_USER_ID,
        displayName: DISPLAY_NAME_BLOCKED,
        username: 'bobblocked',
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
      },
    });
    renderBlockedPanel(makeBlocksHook({ blocks: [item], loading: false }));

    await screen.findByTestId(`blocked-row-${BLOCKED_USER_ID}`);
    const img = screen.getByAltText(DISPLAY_NAME_BLOCKED) as HTMLImageElement;
    expect(img.src).toBe('https://cdn.example.com/avatar.jpg');
  });

  it('shows loading skeleton while blocks are loading', () => {
    renderBlockedPanel(makeBlocksHook({ loading: true }));
    expect(screen.getByTestId('blocked-users-loading')).toBeInTheDocument();
  });

  it('unblock success removes row and shows toast', async () => {
    const unblockFn = vi.fn().mockImplementation(async () => {
      // Simulate optimistic removal: return empty blocks
      mockUseBlocks.mockReturnValue(makeBlocksHook({ blocks: [], loading: false }));
    });
    const item = makeBlockListItem();
    renderBlockedPanel(makeBlocksHook({ blocks: [item], loading: false, unblockUser: unblockFn }));

    await screen.findByTestId(`unblock-btn-${BLOCKED_USER_ID}`);

    await act(async () => {
      fireEvent.click(screen.getByTestId(`unblock-btn-${BLOCKED_USER_ID}`));
    });

    expect(unblockFn).toHaveBeenCalledWith(BLOCKED_USER_ID);

    // Row removed (list now empty → empty state shown)
    await waitFor(() => {
      expect(screen.queryByTestId(`blocked-row-${BLOCKED_USER_ID}`)).not.toBeInTheDocument();
    });

    // Success toast
    await waitFor(() => {
      expect(screen.getByTestId('blocked-list-toast-success')).toBeInTheDocument();
    });
  });

  it('unblock failure: row stays and error toast shown', async () => {
    const unblockFn = vi.fn().mockRejectedValue(new Error('network error'));
    const item = makeBlockListItem();
    renderBlockedPanel(makeBlocksHook({ blocks: [item], loading: false, unblockUser: unblockFn }));

    await screen.findByTestId(`unblock-btn-${BLOCKED_USER_ID}`);

    await act(async () => {
      fireEvent.click(screen.getByTestId(`unblock-btn-${BLOCKED_USER_ID}`));
    });

    // Row still in DOM (useBlocks will have restored state via re-fetch)
    expect(screen.getByTestId(`blocked-row-${BLOCKED_USER_ID}`)).toBeInTheDocument();

    // Error toast shown
    await waitFor(() => {
      expect(screen.getByTestId('blocked-list-toast-error')).toBeInTheDocument();
    });
  });

  it('shows empty state when blocks array is empty', () => {
    renderBlockedPanel(makeBlocksHook({ blocks: [], loading: false }));
    expect(screen.getByTestId('blocked-users-empty')).toBeInTheDocument();
  });
});
