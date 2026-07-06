/**
 * calendar-offline.test.tsx — ClassCalendar offline cache tests.
 *
 * wave-63 B-3 task 42e0a265
 *
 * Coverage:
 * 1. Online success: putCachedScheduledSessions called with exact from/to window strings.
 * 2. Offline reject: getCachedScheduledSessions served for that window, calendar renders
 *    cached sessions rather than blank/error.
 * 3. Cold cache offline: graceful empty state (loaded, no error).
 */

import type { ScheduledSession } from '@studyhall/shared';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom does not implement window.matchMedia — stub it for useIsNarrow (useSyncExternalStore).
beforeAll(() => {
  if (typeof window.matchMedia === 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }
});
import { ClassCalendar } from './ClassCalendar';
import { ProfileContext } from './ProfileContext';
import type { ProfileContextValue } from './ProfileContext';
import { ServerContext } from './ServerContext';
import type { ServerContextValue } from './ServerContext';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../auth/api', () => ({
  api: {
    getMyPermissions: vi.fn(),
    listSessions: vi.fn(),
    getSession: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    // stubs for other api methods used transitively
    getProfile: vi.fn(),
    getServerMembers: vi.fn().mockResolvedValue([]),
  },
}));

import { api } from '../auth/api';
const mockApi = api as unknown as {
  getMyPermissions: ReturnType<typeof vi.fn>;
  listSessions: ReturnType<typeof vi.fn>;
};

// ── Cache mock ────────────────────────────────────────────────────────────────

const mockPutCachedScheduledSessions = vi.fn().mockResolvedValue(undefined);
const mockGetCachedScheduledSessions = vi.fn();

vi.mock('../features/sync/cache', () => ({
  putCachedScheduledSessions: (...args: unknown[]) => mockPutCachedScheduledSessions(...args),
  getCachedScheduledSessions: (...args: unknown[]) => mockGetCachedScheduledSessions(...args),
  // stubs for other cache functions
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
  getCachedAssignments: vi.fn().mockResolvedValue([]),
  putCachedAssignments: vi.fn().mockResolvedValue(undefined),
}));

// ── DB mock ───────────────────────────────────────────────────────────────────

vi.mock('../features/sync/db', () => ({
  db: {
    cachedScheduledSessions: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
      bulkPut: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

// ── SessionDetail and SessionForm — render nothing (not under test here) ──────
// These are heavy sub-components; stubbing keeps the tests fast and focused.

vi.mock('./SessionDetail', () => ({
  SessionDetail: () => null,
}));

vi.mock('./SessionForm', () => ({
  SessionForm: () => null,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date('2026-07-06T00:00:00.000Z');

function makeSession(overrides: Partial<ScheduledSession> = {}): ScheduledSession {
  return {
    id: 'sess-1',
    serverId: 'srv-1',
    organizerId: 'org-1',
    title: 'Test Session',
    description: null,
    startsAt: new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(NOW.getTime() + 25 * 60 * 60 * 1000).toISOString(),
    recurrence: 'none',
    recurrenceUntil: null,
    organizer: {
      userId: 'org-1',
      displayName: 'Organizer One',
      username: 'org1',
      avatarUrl: null,
    },
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
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
    assignmentsOpen: false,
    openAssignments: vi.fn(),
    closeAssignments: vi.fn(),
    scheduleOpen: true,
    openSchedule: vi.fn(),
    closeSchedule: vi.fn(),
    ...override,
  };
}

function renderCalendar(ctxOverride: Partial<ServerContextValue> = {}) {
  return render(
    <ProfileContext.Provider value={nullProfile}>
      <ServerContext.Provider value={makeServerCtx(ctxOverride)}>
        <ClassCalendar />
      </ServerContext.Provider>
    </ProfileContext.Provider>,
  );
}

// ── Helpers: capture the from/to window used by loadSessions ──────────────────
//
// ClassCalendar computes from/to deterministically from startOfToday() + 60 days.
// We replicate the same derivation here so we can assert the exact strings.

function computeWindow(): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowEnd = new Date(today);
  windowEnd.setDate(today.getDate() + 60);
  return { from: today.toISOString(), to: windowEnd.toISOString() };
}

// ── Suite: ClassCalendar offline cache (wave-63 task 42e0a265) ────────────────

describe('ClassCalendar — offline cache (wave-63 task 42e0a265)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPutCachedScheduledSessions.mockResolvedValue(undefined);
    mockGetCachedScheduledSessions.mockResolvedValue([]);
    mockApi.getMyPermissions.mockResolvedValue({
      owner: false,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      manage_members: false,
      manage_assignments: false,
    });
  });

  it('online success: putCachedScheduledSessions called with exact from/to window strings', async () => {
    const serverSessions: ScheduledSession[] = [
      makeSession({ id: 'srv-sess-1', title: 'Server Session' }),
    ];
    mockApi.listSessions.mockResolvedValue({ sessions: serverSessions });

    renderCalendar();

    await waitFor(() => {
      expect(mockPutCachedScheduledSessions).toHaveBeenCalled();
    });

    const [, writtenServerId, writtenFrom, writtenTo, writtenList] = mockPutCachedScheduledSessions
      .mock.calls[0] as [unknown, string, string, string, ScheduledSession[]];

    expect(writtenServerId).toBe('srv-1');

    // Verify the from/to strings written to cache are the EXACT same ones
    // passed to listSessions (window correctness requirement).
    const { from: expectedFrom, to: expectedTo } = computeWindow();
    expect(writtenFrom).toBe(expectedFrom);
    expect(writtenTo).toBe(expectedTo);

    // The list written to cache contains the server-returned session.
    expect(writtenList.some((s) => s.id === 'srv-sess-1')).toBe(true);

    // listSessions was also called with the same from/to.
    expect(mockApi.listSessions).toHaveBeenCalledWith('srv-1', expectedFrom, expectedTo);
  });

  it('offline reject: getCachedScheduledSessions served — calendar renders cached sessions, not blank', async () => {
    const cachedSessions: ScheduledSession[] = [
      makeSession({ id: 'cached-sess-1', title: 'Cached Session Alpha' }),
    ];
    mockApi.listSessions.mockRejectedValue(new Error('Network offline'));
    mockGetCachedScheduledSessions.mockResolvedValue(cachedSessions);

    renderCalendar();

    // Panel should render the cached session card, not the error state.
    await waitFor(() => {
      expect(screen.getAllByTestId('session-card')).toHaveLength(1);
    });
    expect(screen.getByText('Cached Session Alpha')).toBeInTheDocument();
    // Error state must NOT be shown when the cache provided data.
    expect(screen.queryByTestId('schedule-error')).not.toBeInTheDocument();
  });

  it('offline reject: getCachedScheduledSessions called with the exact from/to window', async () => {
    mockApi.listSessions.mockRejectedValue(new Error('Network offline'));
    mockGetCachedScheduledSessions.mockResolvedValue([]);

    renderCalendar();

    await waitFor(() => {
      expect(mockGetCachedScheduledSessions).toHaveBeenCalled();
    });

    const [, readServerId, readFrom, readTo] = mockGetCachedScheduledSessions.mock.calls[0] as [
      unknown,
      string,
      string,
      string,
    ];

    expect(readServerId).toBe('srv-1');
    const { from: expectedFrom, to: expectedTo } = computeWindow();
    expect(readFrom).toBe(expectedFrom);
    expect(readTo).toBe(expectedTo);
  });

  it('cold cache offline: shows empty (loaded) state, not error state', async () => {
    mockApi.listSessions.mockRejectedValue(new Error('Network offline'));
    mockGetCachedScheduledSessions.mockResolvedValue([]);

    renderCalendar();

    await waitFor(() => {
      expect(screen.getByTestId('schedule-empty-state')).toBeInTheDocument();
    });
    // Error state must NOT be shown on a cold-cache offline scenario.
    expect(screen.queryByTestId('schedule-error')).not.toBeInTheDocument();
  });
});
