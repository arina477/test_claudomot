/**
 * Assignment module tests — wave-22 M5.
 *
 * Coverage:
 * 1. getUrgency — chip logic: overdue / dueSoon / normal / done
 * 2. AssignmentCard — overdue chip, due-soon chip, normal (no chip), done state
 * 3. AssignmentCard — per-member toggle PUT fires; stopPropagation on toggle wrapper
 * 4. AssignmentsPanel — organizer-only form visibility; empty state
 */

import type { Assignment } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      server: { id: 'srv-1', name: 'CS 202', ownerId: 'owner-1', inviteCode: null },
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

  it('reverts optimistic update if PUT fails', async () => {
    mockApi.setAssignmentStatus.mockRejectedValue(new Error('Network error'));
    const a = makeAssignment({ myStatus: 'todo' });
    render(<AssignmentCard assignment={a} onStatusChange={onStatusChange} onClick={onClick} />);
    const checkbox = screen.getByTestId('status-toggle');

    await act(async () => {
      fireEvent.click(checkbox);
    });

    await waitFor(() => {
      // First call: optimistic 'done', second call: revert back to 'todo'
      expect(onStatusChange).toHaveBeenCalledTimes(2);
      expect(onStatusChange).toHaveBeenNthCalledWith(1, 'asgn-1', 'done');
      expect(onStatusChange).toHaveBeenNthCalledWith(2, 'asgn-1', 'todo');
    });
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
