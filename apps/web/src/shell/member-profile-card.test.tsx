/**
 * wave-77 M13 leg-2 — Member profile card UI tests.
 *
 * Card is tested THROUGH its real parent (MemberListPanel) per BUILD-12:
 * a member row is clicked, which mounts MemberProfileCard, which fetches
 * getPublicProfile and renders one of the four states.
 *
 * Covers:
 *   1. Clicking a member row opens the card (fetch fired with the opaque userId).
 *   2. LOADED state renders the full academic identity stack.
 *   3. PARTIAL state omits absent fields (component shrinks gracefully).
 *   4. HIDDEN state: a 404 (uniform hidden shape) → calm "Profile Unavailable"
 *      (NOT an error), never leaking why.
 *   5. academicRole (educator) renders as PLAIN TEXT — no trust/verification badge.
 *   6. Esc dismisses the card (unmount) + restores focus to the trigger.
 */

import type { PublicProfile, ServerMember } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemberListPanel } from './MemberListPanel';

vi.mock('./useBlocks', () => ({
  useBlocks: () => ({
    blocks: [],
    blockedSet: new Set(),
    loading: false,
    error: false,
    refetch: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
  }),
  _resetBlocksStore: vi.fn(),
}));

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

// HttpError must be a real class so `err instanceof HttpError` works in the card.
// Defined INSIDE the factory (vi.mock is hoisted; no top-level refs allowed).
vi.mock('../auth/api', () => {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'HttpError';
    }
  }
  return {
    api: {
      getServerMembers: vi.fn(),
      getMyPermissions: vi.fn(),
      timeoutMember: vi.fn(),
      removeTimeout: vi.fn(),
      getPublicProfile: vi.fn(),
    },
    HttpError,
  };
});

import { HttpError, api } from '../auth/api';

type MockApi = {
  getServerMembers: ReturnType<typeof vi.fn>;
  getMyPermissions: ReturnType<typeof vi.fn>;
  getPublicProfile: ReturnType<typeof vi.fn>;
};
const mockApi = api as unknown as MockApi;

const SERVER_ID = 'srv-test';

function makeMember(overrides: Partial<ServerMember> = {}): ServerMember {
  return {
    userId: 'user-1',
    displayName: 'Julian Vance',
    avatarUrl: null,
    username: 'julian',
    mutedUntil: null,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<PublicProfile> = {}): PublicProfile {
  return {
    userId: 'user-1',
    username: 'julian',
    displayName: 'Julian Vance',
    avatarUrl: null,
    accentColor: '#10b981',
    pronouns: 'he/him',
    bio: 'Thesis: synthetic data generation.',
    institution: 'Massachusetts Institute of Technology',
    program: 'Ph.D. Computer Science',
    academicRole: 'student',
    academicYear: 'Year 3',
    ...overrides,
  };
}

async function openCard(members: ServerMember[]) {
  mockApi.getServerMembers.mockResolvedValue(members);
  render(<MemberListPanel serverId={SERVER_ID} canModerateMembers={false} />);
  await screen.findByText(members[0]?.displayName ?? '');
  const trigger = screen.getByTestId(`member-open-profile-${members[0]?.userId}`);
  await act(async () => {
    fireEvent.click(trigger);
  });
  return trigger;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MemberProfileCard — opened from MemberListPanel', () => {
  it('clicking a member row opens the card and fetches by opaque userId', async () => {
    mockApi.getPublicProfile.mockResolvedValue(makeProfile());
    await openCard([makeMember()]);
    expect(mockApi.getPublicProfile).toHaveBeenCalledWith('user-1');
    expect(await screen.findByTestId('member-profile-card')).toBeInTheDocument();
  });

  it('LOADED: renders the full academic identity stack', async () => {
    mockApi.getPublicProfile.mockResolvedValue(makeProfile());
    await openCard([makeMember()]);
    expect(await screen.findByTestId('member-card-name')).toHaveTextContent('Julian Vance');
    expect(screen.getByText('he/him')).toBeInTheDocument();
    expect(screen.getByText('Massachusetts Institute of Technology')).toBeInTheDocument();
    expect(screen.getByText('Ph.D. Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Year 3')).toBeInTheDocument();
  });

  it('PARTIAL: omits absent fields (no bio / program / year rows)', async () => {
    mockApi.getPublicProfile.mockResolvedValue(
      makeProfile({
        pronouns: 'she/they',
        bio: null,
        program: null,
        academicYear: null,
        academicRole: 'student',
        institution: 'UC Berkeley',
        displayName: 'Sarah Lin',
      }),
    );
    await openCard([makeMember({ userId: 'user-1', displayName: 'Sarah Lin' })]);
    expect(await screen.findByText('UC Berkeley')).toBeInTheDocument();
    // Absent labels are not rendered.
    expect(screen.queryByText('Program / Field')).not.toBeInTheDocument();
    expect(screen.queryByText('Academic Year')).not.toBeInTheDocument();
  });

  it('HIDDEN: a 404 renders the calm "Profile Unavailable" state (not an error)', async () => {
    mockApi.getPublicProfile.mockRejectedValue(new HttpError(404, '404 Not Found'));
    await openCard([makeMember()]);
    expect(await screen.findByText('Profile Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/hidden due to visibility settings/i)).toBeInTheDocument();
  });

  it('academicRole (educator) renders as PLAIN TEXT — no verification/trust badge', async () => {
    mockApi.getPublicProfile.mockResolvedValue(makeProfile({ academicRole: 'educator' }));
    await openCard([makeMember()]);
    // The role value is present…
    expect(await screen.findByText('Educator')).toBeInTheDocument();
    // …and there is NO verified/trust affordance anywhere in the card.
    const card = screen.getByTestId('member-profile-card');
    expect(card.textContent).not.toMatch(/verified/i);
    // Email is never rendered (PublicProfile carries none).
    expect(card.textContent).not.toMatch(/@[a-z]+\.[a-z]+/i);
  });

  it('Esc dismisses (unmount) and restores focus to the trigger', async () => {
    mockApi.getPublicProfile.mockResolvedValue(makeProfile());
    const trigger = await openCard([makeMember()]);
    expect(await screen.findByTestId('member-profile-card')).toBeInTheDocument();
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    await waitFor(() => {
      expect(screen.queryByTestId('member-profile-card')).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(trigger);
  });
});
