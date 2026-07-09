/**
 * Assignment module tests — wave-22 M5 + wave-63 B-3 offline cache (task 35c57942).
 *
 * Coverage:
 * 1. getUrgency — chip logic: overdue / dueSoon / normal / done
 * 2. AssignmentCard — overdue chip, due-soon chip, normal (no chip), done state
 * 3. AssignmentCard — per-member toggle PUT fires; stopPropagation on toggle wrapper
 * 4. AssignmentsPanel — organizer-only form visibility; empty state
 * 5. AssignmentsPanel — offline cache write-through + fallback (wave-63 task 35c57942)
 */

import type { Assignment } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUrgency } from './AssignmentCard';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentsPanel } from './AssignmentsPanel';
import { ProfileContext } from './ProfileContext';
import type { ProfileContextValue } from './ProfileContext';
import { ServerContext } from './ServerContext';
import type { ServerContextValue } from './ServerContext';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../auth/api', () => ({
  api: {
    setAssignmentStatus: vi.fn(),
    listAssignments: vi.fn(),
    listAssignmentSubmissions: vi.fn(),
    getMe: vi.fn(),
    getMyPermissions: vi.fn(),
    getServerMembers: vi.fn(),
    listRoles: vi.fn(),
    getProfile: vi.fn(),
  },
}));

import { api } from '../auth/api';
const mockApi = api as unknown as {
  setAssignmentStatus: ReturnType<typeof vi.fn>;
  listAssignments: ReturnType<typeof vi.fn>;
  listAssignmentSubmissions: ReturnType<typeof vi.fn>;
  getMe: ReturnType<typeof vi.fn>;
  getMyPermissions: ReturnType<typeof vi.fn>;
  getServerMembers: ReturnType<typeof vi.fn>;
  listRoles: ReturnType<typeof vi.fn>;
  getProfile: ReturnType<typeof vi.fn>;
};

// ── Cache mock — offline write-through + fallback ─────────────────────────────

const mockPutCachedAssignments = vi.fn().mockResolvedValue(undefined);
const mockGetCachedAssignments = vi.fn();

vi.mock('../features/sync/cache', () => ({
  putCachedAssignments: (...args: unknown[]) => mockPutCachedAssignments(...args),
  getCachedAssignments: (...args: unknown[]) => mockGetCachedAssignments(...args),
  // stubs for other cache functions used transitively
  getCachedMessages: vi.fn().mockResolvedValue([]),
  putCachedMessages: vi.fn().mockResolvedValue(undefined),
  putCachedMessage: vi.fn().mockResolvedValue(undefined),
  getCachedChannel: vi.fn().mockResolvedValue(undefined),
  putCachedChannel: vi.fn().mockResolvedValue(undefined),
  getCachedDmConversations: vi.fn().mockResolvedValue([]),
  putCachedDmConversations: vi.fn().mockResolvedValue(undefined),
  putCachedDmConversation: vi.fn().mockResolvedValue(undefined),
  getCachedDmMessages: vi.fn().mockResolvedValue([]),
  putCachedDmMessages: vi.fn().mockResolvedValue(undefined),
  putCachedDmMessage: vi.fn().mockResolvedValue(undefined),
  getCachedScheduledSessions: vi.fn().mockResolvedValue([]),
  putCachedScheduledSessions: vi.fn().mockResolvedValue(undefined),
}));

// ── DB mock — assignments panel accesses db for offline cache ─────────────────

vi.mock('../features/sync/db', () => ({
  db: {
    cachedAssignments: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
      bulkPut: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = new Date('2026-06-30T12:00:00Z');

function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: 'asgn-1',
    serverId: 'srv-1',
    organizerId: 'org-1',
    title: 'Homework 4',
    dueDate: new Date(NOW.getTime() + 72 * 60 * 60 * 1000).toISOString(), // 72h → normal
    myStatus: 'todo',
    createdAt: NOW.toISOString(),
    ...overrides,
  };
}

const nullProfile: ProfileContextValue = {
  profile: null,
  refresh: vi.fn(),
};

function makeServerCtx(override: Partial<ServerContextValue> = {}): ServerContextValue {
  return {
    servers: [],
    status: 'loaded',
    selectedId: 'srv-1',
    selectServer: vi.fn(),
    appendServer: vi.fn(),
    refetch: vi.fn(),
    createModalOpen: false,
    openCreateModal: vi.fn(),
    closeCreateModal: vi.fn(),
    selectedDetail: {
      server: {
        id: 'srv-1',
        name: 'CS 202',
        ownerId: 'owner-1',
        inviteCode: null,
        is_public: false,
        description: null,
        topic: null,
      },
      categories: [],
    },
    detailStatus: 'loaded',
    selectedChannelId: null,
    selectedChannelName: null,
    selectChannel: vi.fn(),
    assignmentsOpen: true,
    openAssignments: vi.fn(),
    closeAssignments: vi.fn(),
    scheduleOpen: false,
    openSchedule: vi.fn(),
    closeSchedule: vi.fn(),
    refetchDetail: vi.fn(),
    ...override,
  };
}

// ── 1. getUrgency — chip logic ────────────────────────────────────────────────

describe('getUrgency', () => {
  it('returns "overdue" when dueAt < now', () => {
    const past = new Date(NOW.getTime() - 1 * 60 * 60 * 1000).toISOString(); // 1h ago
    expect(getUrgency(past, false, NOW)).toBe('overdue');
  });

  it('returns "overdue" for well past dates', () => {
    const past = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
    expect(getUrgency(past, false, NOW)).toBe('overdue');
  });

  it('returns "dueSoon" when 0 ≤ dueAt - now < 48h', () => {
    const soon = new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24h
    expect(getUrgency(soon, false, NOW)).toBe('dueSoon');
  });

  it('returns "dueSoon" at the exact 48h boundary - 1ms', () => {
    const boundary = new Date(NOW.getTime() + 48 * 60 * 60 * 1000 - 1).toISOString();
    expect(getUrgency(boundary, false, NOW)).toBe('dueSoon');
  });

  it('returns "normal" when dueAt ≥ now + 48h', () => {
    const future = new Date(NOW.getTime() + 72 * 60 * 60 * 1000).toISOString(); // 72h
    expect(getUrgency(future, false, NOW)).toBe('normal');
  });

  it('returns "done" regardless of date when isDone=true', () => {
    const past = new Date(NOW.getTime() - 1000).toISOString();
    expect(getUrgency(past, true, NOW)).toBe('done');
  });

  it('returns "normal" for invalid date string', () => {
    expect(getUrgency('not-a-date', false, NOW)).toBe('normal');
  });
});

// ── 2. AssignmentCard — chip rendering ───────────────────────────────────────

describe('AssignmentCard chip states', () => {
  const onStatusChange = vi.fn();
  const onClick = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
    mockApi.setAssignmentStatus.mockResolvedValue({ myStatus: 'done' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders overdue chip with --danger-text color when past due', () => {
    const a = makeAssignment({
      dueDate: new Date(NOW.getTime() - 3600_000).toISOString(), // 1h ago
    });
    render(<AssignmentCard assignment={a} onStatusChange={onStatusChange} onClick={onClick} />);
    const chip = screen.getByTestId('chip-overdue');
    expect(chip).toBeInTheDocument();
    // Verify the --danger-text color (#f87171) is applied inline
    expect(chip).toHaveStyle({ color: '#f87171' });
    // Must NOT use #ef4444 (--danger) — that fails WCAG AA on the tint
    expect(chip).not.toHaveStyle({ color: '#ef4444' });
  });

  it('renders due-soon amber chip when within 48h', () => {
    const a = makeAssignment({
      dueDate: new Date(NOW.getTime() + 24 * 3600_000).toISOString(), // 24h
    });
    render(<AssignmentCard assignment={a} onStatusChange={onStatusChange} onClick={onClick} />);
    const chip = screen.getByTestId('chip-due-soon');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveStyle({ color: '#f59e0b' }); // --accent-amber
  });

  it('renders normal plain due line (no chip) when > 48h away', () => {
    const a = makeAssignment({
      dueDate: new Date(NOW.getTime() + 72 * 3600_000).toISOString(), // 72h
    });
    render(<AssignmentCard assignment={a} onStatusChange={onStatusChange} onClick={onClick} />);
    // Normal state: chip-normal present, no overdue/dueSoon chips
    expect(screen.getByTestId('chip-normal')).toBeInTheDocument();
    expect(screen.queryByTestId('chip-overdue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chip-due-soon')).not.toBeInTheDocument();
  });

  it('suppresses urgency chip when done — shows muted due line only', () => {
    const a = makeAssignment({
      dueDate: new Date(NOW.getTime() - 3600_000).toISOString(), // overdue
      myStatus: 'done',
    });
    render(<AssignmentCard assignment={a} onStatusChange={onStatusChange} onClick={onClick} />);
    // done overrides urgency — no overdue/dueSoon chip
    expect(screen.queryByTestId('chip-overdue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chip-due-soon')).not.toBeInTheDocument();
  });

  it('renders card-done modifier class on completed assignments', () => {
    const a = makeAssignment({ myStatus: 'done' });
    render(<AssignmentCard assignment={a} onStatusChange={onStatusChange} onClick={onClick} />);
    const card = screen.getByTestId('assignment-card');
    // card-done modifier applies emerald-dim background
    expect(card).toHaveStyle({ backgroundColor: 'rgba(16,185,129,0.1)' });
  });
});

// ── 3. AssignmentCard — per-member toggle ────────────────────────────────────

describe('AssignmentCard per-member toggle', () => {
  const onStatusChange = vi.fn();
  const onClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.setAssignmentStatus.mockResolvedValue({ myStatus: 'done' });
  });

  it('fires onStatusChange("done") and calls PUT when checkbox is checked', async () => {
    const a = makeAssignment({ myStatus: 'todo' });
    render(<AssignmentCard assignment={a} onStatusChange={onStatusChange} onClick={onClick} />);
    const checkbox = screen.getByTestId('status-toggle');
    expect(checkbox).not.toBeChecked();

    await act(async () => {
      fireEvent.click(checkbox);
    });

    expect(onStatusChange).toHaveBeenCalledWith('asgn-1', 'done');
    await waitFor(() => {
      expect(mockApi.setAssignmentStatus).toHaveBeenCalledWith('asgn-1', { state: 'done' });
    });
  });

  it('fires onStatusChange("todo") when unchecking a done assignment', async () => {
    mockApi.setAssignmentStatus.mockResolvedValue({ myStatus: 'todo' });
    const a = makeAssignment({ myStatus: 'done' });
    render(<AssignmentCard assignment={a} onStatusChange={onStatusChange} onClick={onClick} />);
    const checkbox = screen.getByTestId('status-toggle');

    await act(async () => {
      fireEvent.click(checkbox);
    });

    expect(onStatusChange).toHaveBeenCalledWith('asgn-1', 'todo');
  });

  it('stopPropagation on toggle wrapper — does not call onClick when toggle is clicked', async () => {
    const a = makeAssignment({ myStatus: 'todo' });
    render(<AssignmentCard assignment={a} onStatusChange={onStatusChange} onClick={onClick} />);
    const wrapper = screen.getByTestId('toggle-wrapper');

    await act(async () => {
      fireEvent.click(wrapper);
    });

    // The card onClick should NOT have fired
    expect(onClick).not.toHaveBeenCalled();
  });

  it('restores the CAPTURED prior status through the real prop-wiring on a failed toggle', async () => {
    // BUILD-12: drive the failure through a stateful host that mirrors
    // AssignmentsPanel (onStatusChange updates the myStatus prop → the card
    // re-renders), so a stale-closure `prev` would misfire. The snapshot is
    // captured fresh at click time (assignment.myStatus is in the useCallback
    // dep array), so the revert restores the true pre-click status.
    mockApi.setAssignmentStatus.mockRejectedValue(new Error('Network error'));
    const announce = vi.fn();
    const emitted: Array<'todo' | 'done'> = [];

    function Host() {
      const [status, setStatus] = useState<'todo' | 'done'>('todo');
      return (
        <AssignmentCard
          assignment={makeAssignment({ myStatus: status })}
          onStatusChange={(_id, state) => {
            emitted.push(state);
            setStatus(state);
          }}
          onClick={onClick}
          onAnnounce={announce}
        />
      );
    }

    render(<Host />);
    const checkbox = screen.getByTestId('status-toggle') as HTMLInputElement;

    // Toggle todo → done; PUT rejects → restore captured prior 'todo'.
    await act(async () => {
      fireEvent.click(checkbox);
    });

    await waitFor(() => {
      // optimistic 'done' then revert to the captured prior 'todo'.
      expect(emitted).toEqual(['done', 'todo']);
    });
    // Prop re-rendered back to the restored prior → checkbox unchecked again.
    expect(checkbox).not.toBeChecked();
  });

  it('rapid double-toggle race: each failed revert restores its OWN captured prior (not a shared/opposite guess)', async () => {
    // TEST-HONESTY (P-4): the assume-opposite bug diverged under a rapid
    // double-toggle race. We stall BOTH PUTs (pending), fire two clicks so the
    // second toggle captures the mid-flight optimistic status as its prior, then
    // reject them. Each catch must restore the status THAT toggle captured —
    // proving the snapshot is per-invocation, not a shared closure. Combined
    // with the announce/toast assertions (which the OLD console-only code never
    // produced), this fails on the old behavior and passes on the fix.
    const rejecters: Array<(e: Error) => void> = [];
    mockApi.setAssignmentStatus.mockImplementation(
      () =>
        new Promise((_res, rej) => {
          rejecters.push(rej);
        }),
    );
    const announce = vi.fn();
    const emitted: Array<'todo' | 'done'> = [];

    function Host() {
      const [status, setStatus] = useState<'todo' | 'done'>('todo');
      return (
        <AssignmentCard
          assignment={makeAssignment({ myStatus: status })}
          onStatusChange={(_id, state) => {
            emitted.push(state);
            setStatus(state);
          }}
          onClick={onClick}
          onAnnounce={announce}
        />
      );
    }

    render(<Host />);
    const checkbox = screen.getByTestId('status-toggle') as HTMLInputElement;

    // Toggle 1: todo → done (prev captured = 'todo'). PUT pending.
    await act(async () => {
      fireEvent.click(checkbox);
    });
    // Toggle 2: done → todo (prev captured = 'done', the optimistic value). PUT pending.
    await act(async () => {
      fireEvent.click(checkbox);
    });
    expect(emitted).toEqual(['done', 'todo']);

    // Reject in order: toggle-1's catch restores its prior 'todo', toggle-2's
    // catch restores its prior 'done'. Each restores its OWN captured snapshot.
    await act(async () => {
      rejecters[0]?.(new Error('Network error'));
      rejecters[1]?.(new Error('Network error'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(emitted).toEqual(['done', 'todo', 'todo', 'done']);
    });
    // Two failures → announced exactly once each (no double-announce per failure).
    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenNthCalledWith(1, "Couldn't update assignment. Please try again.");
    expect(announce).toHaveBeenNthCalledWith(2, "Couldn't update assignment. Please try again.");
  });

  it('shows a VISIBLE error toast and announces exactly ONCE per failure', async () => {
    mockApi.setAssignmentStatus.mockRejectedValue(new Error('Network error'));
    const announce = vi.fn();
    const a = makeAssignment({ myStatus: 'todo' });
    render(
      <AssignmentCard
        assignment={a}
        onStatusChange={onStatusChange}
        onClick={onClick}
        onAnnounce={announce}
      />,
    );
    const checkbox = screen.getByTestId('status-toggle');

    await act(async () => {
      fireEvent.click(checkbox);
    });

    // Visible toast appears for sighted users (old console-only code never showed one).
    await waitFor(() => {
      expect(screen.getByTestId('status-toggle-error-toast')).toBeInTheDocument();
    });
    expect(screen.getByTestId('status-toggle-error-toast')).toHaveTextContent(
      "Couldn't update assignment. Please try again.",
    );
    // The visible toast is aria-hidden — AT reads the failure only via onAnnounce,
    // so the failure is announced to screen readers EXACTLY ONCE (no double-announce).
    expect(screen.getByTestId('status-toggle-error-toast')).toHaveAttribute('aria-hidden', 'true');
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Couldn't update assignment. Please try again.");

    // Snapshot-restore: optimistic 'done' then revert to captured prior 'todo'.
    expect(onStatusChange).toHaveBeenNthCalledWith(1, 'asgn-1', 'done');
    expect(onStatusChange).toHaveBeenNthCalledWith(2, 'asgn-1', 'todo');
  });

  it('F1 regression: error toast auto-dismisses on schedule EVEN IF the parent re-renders mid-window', async () => {
    // The toast's 3500ms auto-dismiss timer must NOT reset when the parent
    // re-renders (assignments panel re-renders on presence/realtime ticks).
    // Pre-fix, onGone was a fresh inline arrow each render, so the toast's
    // [onGone]-dep effect tore down + recreated the setTimeout on every parent
    // re-render — the clock restarted from zero and the toast never dismissed.
    // With onGone stabilized via useCallback, the timer runs once and fires.
    vi.useFakeTimers();
    try {
      mockApi.setAssignmentStatus.mockRejectedValue(new Error('Network error'));
      const announce = vi.fn();

      // Host that re-renders on demand via a bumpable counter, mirroring the
      // panel's realtime-tick re-renders while the toast is visible.
      let forceParentRerender: () => void = () => {};
      function Host() {
        const [, setTick] = useState(0);
        forceParentRerender = () => setTick((n) => n + 1);
        return (
          <AssignmentCard
            assignment={makeAssignment({ myStatus: 'todo' })}
            onStatusChange={vi.fn()}
            onClick={onClick}
            onAnnounce={announce}
          />
        );
      }

      render(<Host />);
      const checkbox = screen.getByTestId('status-toggle');

      // Trigger the failing toggle → toast appears.
      await act(async () => {
        fireEvent.click(checkbox);
        await Promise.resolve();
      });
      expect(screen.getByTestId('status-toggle-error-toast')).toBeInTheDocument();

      // Advance partway (2000ms), then force a parent re-render. A reset timer
      // (pre-fix) would restart its 3500ms clock here; the stable timer keeps
      // counting from the toast's mount.
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      await act(async () => {
        forceParentRerender();
        await Promise.resolve();
      });
      // Still visible at 2000ms — dismissal is at 3500ms.
      expect(screen.getByTestId('status-toggle-error-toast')).toBeInTheDocument();

      // Advance past the original 3500ms deadline (2000 + 1600 = 3600 total).
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });

      // Toast is GONE — the mid-window re-render did NOT reset the timer.
      expect(screen.queryByTestId('status-toggle-error-toast')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ── 4. AssignmentsPanel — organizer-only form + empty state ──────────────────

describe('AssignmentsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getMe.mockResolvedValue({
      userId: 'owner-1',
      email: 'owner@test.com',
      emailVerified: true,
    });
    // Default: full owner — gives organizer access so most tests see the CTA.
    mockApi.getMyPermissions.mockResolvedValue({
      owner: true,
      manage_server: true,
      manage_roles: true,
      manage_channels: true,
      manage_members: true,
      manage_assignments: true,
    });
    mockApi.getServerMembers.mockResolvedValue([]);
    mockApi.listRoles.mockResolvedValue([]);
    mockApi.getProfile.mockResolvedValue(null);
    mockApi.listAssignmentSubmissions.mockResolvedValue({ submissions: [] });
  });

  function renderPanel(ctxOverride: Partial<ServerContextValue> = {}) {
    return render(
      <ProfileContext.Provider value={nullProfile}>
        <ServerContext.Provider value={makeServerCtx(ctxOverride)}>
          <AssignmentsPanel />
        </ServerContext.Provider>
      </ProfileContext.Provider>,
    );
  }

  it('shows empty state when no assignments exist', async () => {
    mockApi.listAssignments.mockResolvedValue({ assignments: [] });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No assignments yet.')).toBeInTheDocument();
    });
  });

  it('shows "New Assignment" button for organizer (owner)', async () => {
    mockApi.listAssignments.mockResolvedValue({ assignments: [] });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('new-assignment-btn')).toBeInTheDocument();
    });
  });

  it('hides "New Assignment" button for non-organizer', async () => {
    mockApi.listAssignments.mockResolvedValue({ assignments: [] });
    // Override: user has no permissions — not owner, no manage_assignments
    mockApi.getMyPermissions.mockResolvedValue({
      owner: false,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      manage_members: false,
      manage_assignments: false,
    });

    renderPanel();

    // Wait for the panel to load
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // New Assignment button should NOT be present
    expect(screen.queryByTestId('new-assignment-btn')).not.toBeInTheDocument();
  });

  it('renders assignment cards after loading', async () => {
    const assignments: Assignment[] = [
      makeAssignment({ id: 'a1', title: 'Graph Traversals' }),
      makeAssignment({ id: 'a2', title: 'System Design Reading' }),
    ];
    mockApi.listAssignments.mockResolvedValue({ assignments });

    renderPanel();

    await waitFor(() => {
      expect(screen.getAllByTestId('assignment-card')).toHaveLength(2);
      expect(screen.getByText('Graph Traversals')).toBeInTheDocument();
      expect(screen.getByText('System Design Reading')).toBeInTheDocument();
    });
  });

  it('opens AssignmentForm modal when "New Assignment" is clicked (organizer)', async () => {
    mockApi.listAssignments.mockResolvedValue({ assignments: [] });
    const user = userEvent.setup();

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('new-assignment-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('new-assignment-btn'));

    expect(screen.getByTestId('assignment-form-modal')).toBeInTheDocument();
    // Form title heading (h2 inside the modal dialog)
    expect(screen.getByRole('heading', { name: 'New Assignment' })).toBeInTheDocument();
  });

  it('shows "New Assignment" button for non-owner with manage_assignments permission (wave-23 gate)', async () => {
    mockApi.listAssignments.mockResolvedValue({ assignments: [] });
    // Non-owner, but explicitly granted manage_assignments
    mockApi.getMyPermissions.mockResolvedValue({
      owner: false,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      manage_members: false,
      manage_assignments: true,
    });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('new-assignment-btn')).toBeInTheDocument();
    });
  });
});

// ── 5. AssignmentsPanel — offline cache write-through + fallback ──────────────
//
// wave-63 B-3 task 35c57942
// Online path: successful fetch writes through to putCachedAssignments.
// Offline path: fetch failure falls back to getCachedAssignments so the panel
//   renders the cached list rather than the error state.

describe('AssignmentsPanel — offline cache (wave-63 task 35c57942)', () => {
  const cachedAssignmentList: Assignment[] = [
    makeAssignment({ id: 'cached-asgn-1', title: 'Cached Assignment A' }),
    makeAssignment({ id: 'cached-asgn-2', title: 'Cached Assignment B' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockPutCachedAssignments.mockResolvedValue(undefined);
    mockGetCachedAssignments.mockResolvedValue(cachedAssignmentList);
    mockApi.getMyPermissions.mockResolvedValue({
      owner: false,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      manage_members: false,
      manage_assignments: false,
    });
    mockApi.getServerMembers.mockResolvedValue([]);
    mockApi.listRoles.mockResolvedValue([]);
    mockApi.getProfile.mockResolvedValue(null);
    mockApi.listAssignmentSubmissions.mockResolvedValue({ submissions: [] });
  });

  function renderOfflinePanel(ctxOverride: Partial<ServerContextValue> = {}) {
    return render(
      <ProfileContext.Provider value={nullProfile}>
        <ServerContext.Provider value={makeServerCtx(ctxOverride)}>
          <AssignmentsPanel />
        </ServerContext.Provider>
      </ProfileContext.Provider>,
    );
  }

  it('online success: putCachedAssignments is called with serverId and the fetched list', async () => {
    const serverAssignments: Assignment[] = [
      makeAssignment({ id: 'srv-asgn-1', title: 'Server Assignment' }),
    ];
    mockApi.listAssignments.mockResolvedValue({ assignments: serverAssignments });

    renderOfflinePanel();

    await waitFor(() => {
      expect(mockPutCachedAssignments).toHaveBeenCalled();
    });

    const [, writtenServerId, writtenList] = mockPutCachedAssignments.mock.calls[0] as [
      unknown,
      string,
      Assignment[],
    ];
    expect(writtenServerId).toBe('srv-1');
    expect(writtenList.some((a) => a.id === 'srv-asgn-1')).toBe(true);
  });

  it('offline reject: getCachedAssignments served — panel renders cached assignments, not error', async () => {
    mockApi.listAssignments.mockRejectedValue(new Error('Network offline'));

    renderOfflinePanel();

    // Panel should render the cached assignments, not the error state.
    await waitFor(() => {
      expect(screen.getAllByTestId('assignment-card')).toHaveLength(2);
    });
    expect(screen.getByText('Cached Assignment A')).toBeInTheDocument();
    expect(screen.getByText('Cached Assignment B')).toBeInTheDocument();
    // Error state must NOT be shown when the cache provided data.
    expect(screen.queryByTestId('assignments-error')).not.toBeInTheDocument();
  });

  it('cold cache offline: shows empty (loaded) state rather than error when cache returns []', async () => {
    mockApi.listAssignments.mockRejectedValue(new Error('Network offline'));
    mockGetCachedAssignments.mockResolvedValue([]);

    renderOfflinePanel();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    // Error state must NOT be shown on a cold-cache offline scenario.
    expect(screen.queryByTestId('assignments-error')).not.toBeInTheDocument();
  });
});
