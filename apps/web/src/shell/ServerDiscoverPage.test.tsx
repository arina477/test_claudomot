/**
 * ServerDiscoverPage — RTL + vitest tests.
 *
 * Coverage:
 *   - Renders skeleton on initial load
 *   - Renders cards from mocked getDiscoverServers
 *   - Shows results count line ("Showing N")
 *   - Debounced search updates the query param passed to getDiscoverServers
 *   - Honest cold-start empty state (asserts non-error copy)
 *   - No-search-match empty state
 *   - Join click → api.joinPublicServer called → ServerContext.refetch invoked + joined state shown
 *   - Join sets sh:select-server in sessionStorage (pending auto-select survives stale refetch)
 *   - handleOpen sets sh:select-server before navigating to /app (fix 1)
 *   - Error classification: 403 → private msg; 404 → private msg; 400 → generic; 409 → generic
 *   - No duplicate id="discover-results-count" in DOM
 *   - Error state shows retry button
 *   - Retry button re-fetches
 *
 * Layout regression (B-6 wave-67):
 *   - ServerRail renders on /discover with Discover button aria-current="page"
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RailShell } from './RailShell';
import { ServerContext } from './ServerContext';
import type { ServerContextValue } from './ServerContext';
import { ServerDiscoverPage } from './ServerDiscoverPage';

// ── Mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.hoisted(() => ({
  getDiscoverServers: vi.fn(),
  joinPublicServer: vi.fn(),
}));

vi.mock('../auth/api', () => ({ api: mockApi }));

// ── Mock react-router-dom navigate ────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_SERVERS = [
  {
    id: 'srv_1',
    name: 'CS101 Study Group',
    description: 'Intro to programming help.',
    topic: 'Computer Science',
    memberCount: 342,
  },
  {
    id: 'srv_2',
    name: 'Late Night Library',
    description: 'Body-double and focus.',
    topic: 'Co-working',
    memberCount: 1205,
  },
];

function makeCtx(overrides?: Partial<ServerContextValue>): ServerContextValue {
  return {
    servers: [],
    status: 'loaded',
    selectedId: null,
    selectServer: vi.fn(),
    appendServer: vi.fn(),
    refetch: vi.fn(),
    createModalOpen: false,
    openCreateModal: vi.fn(),
    closeCreateModal: vi.fn(),
    selectedDetail: null,
    detailStatus: 'idle',
    selectedChannelId: null,
    selectedChannelName: null,
    selectChannel: vi.fn(),
    assignmentsOpen: false,
    openAssignments: vi.fn(),
    closeAssignments: vi.fn(),
    scheduleOpen: false,
    openSchedule: vi.fn(),
    closeSchedule: vi.fn(),
    refetchDetail: vi.fn(),
    ...overrides,
  };
}

function renderPage(ctx?: Partial<ServerContextValue>) {
  const ctxValue = makeCtx(ctx);
  return {
    ctxValue,
    ...render(
      <MemoryRouter initialEntries={['/discover']}>
        <ServerContext.Provider value={ctxValue}>
          <ServerDiscoverPage />
        </ServerContext.Provider>
      </MemoryRouter>,
    ),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ServerDiscoverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('shows skeleton while loading (no article cards yet)', () => {
    // getDiscoverServers never resolves — stays in loading state
    mockApi.getDiscoverServers.mockReturnValue(new Promise(() => {}));
    renderPage();
    // No server cards should be in DOM while loading
    expect(screen.queryByRole('article')).toBeNull();
    // Loading grid has aria-busy
    const loadingGrid = document.querySelector('[aria-busy="true"]');
    expect(loadingGrid).toBeTruthy();
  });

  it('renders cards from mocked getDiscoverServers', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('CS101 Study Group')).toBeInTheDocument();
      expect(screen.getByText('Late Night Library')).toBeInTheDocument();
    });
  });

  it('shows results count line with "Showing N" wording', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Showing 2 communities')).toBeInTheDocument();
    });
  });

  it('debounced search updates query param passed to api', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // First call for initial render
    mockApi.getDiscoverServers.mockResolvedValue({ servers: MOCK_SERVERS });
    renderPage();

    // Wait for initial load to complete
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const input = screen.getByLabelText('Search servers');

    // Type without flushing debounce
    await act(async () => {
      await userEvent.type(input, 'biology', { delay: null });
    });

    // Only initial call before debounce fires
    const callsBefore = mockApi.getDiscoverServers.mock.calls.length;

    // Advance past the 300ms debounce
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(mockApi.getDiscoverServers.mock.calls.length).toBeGreaterThan(callsBefore);
      const lastCall = mockApi.getDiscoverServers.mock.calls.at(-1)?.[0];
      expect(lastCall).toMatchObject({ q: 'biology' });
    });

    vi.useRealTimers();
  });

  it('shows honest cold-start empty state (non-error copy)', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No public communities yet')).toBeInTheDocument();
    });

    // Must NOT show error-flavoured copy
    expect(screen.queryByText(/couldn't load/i)).toBeNull();
    expect(screen.queryByText(/error/i)).toBeNull();
  });

  it('shows no-search-match empty state', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Initial load has servers
    mockApi.getDiscoverServers
      .mockResolvedValueOnce({ servers: MOCK_SERVERS })
      // After search term returns empty
      .mockResolvedValueOnce({ servers: [] });

    renderPage();

    // Wait for initial results
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await waitFor(() => screen.getByText('CS101 Study Group'));

    const input = screen.getByLabelText('Search servers');
    await act(async () => {
      await userEvent.type(input, 'xyz', { delay: null });
    });

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(screen.getByText(/no communities match/i)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('Join click calls api.joinPublicServer, invokes refetch, and shows joined state', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    mockApi.joinPublicServer.mockResolvedValueOnce({ serverId: 'srv_1' });
    const refetch = vi.fn();

    renderPage({ refetch });

    await waitFor(() => screen.getByText('CS101 Study Group'));

    const joinBtn = screen.getByRole('button', { name: /join cs101 study group/i });
    await userEvent.click(joinBtn);

    // After join completes: refetch invoked, button becomes "Open"
    await waitFor(() => {
      expect(mockApi.joinPublicServer).toHaveBeenCalledWith('srv_1');
      expect(refetch).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /open cs101 study group/i })).toBeInTheDocument();
    });
  });

  it('join sets sh:select-server in sessionStorage so pending auto-select survives stale refetch', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    mockApi.joinPublicServer.mockResolvedValueOnce({ serverId: 'srv_1' });

    // Simulate stale refetch — returned list does NOT yet include the joined server
    const refetch = vi.fn();

    renderPage({ refetch });
    await waitFor(() => screen.getByText('CS101 Study Group'));

    // Clear any existing key first
    sessionStorage.removeItem('sh:select-server');

    const joinBtn = screen.getByRole('button', { name: /join cs101 study group/i });
    await userEvent.click(joinBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open cs101 study group/i })).toBeInTheDocument();
    });

    // Key must be set so a later (non-stale) refetch in ServerContext can still consume it
    expect(sessionStorage.getItem('sh:select-server')).toBe('srv_1');
  });

  it('handleOpen sets sh:select-server in sessionStorage before navigating to /app', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    mockApi.joinPublicServer.mockResolvedValueOnce({ serverId: 'srv_1' });

    renderPage();
    await waitFor(() => screen.getByText('CS101 Study Group'));

    // Join first to get the card into 'joined' state
    const joinBtn = screen.getByRole('button', { name: /join cs101 study group/i });
    await userEvent.click(joinBtn);
    await waitFor(() => screen.getByRole('button', { name: /open cs101 study group/i }));

    // Clear the key set by join to isolate handleOpen's behaviour
    sessionStorage.removeItem('sh:select-server');

    const openBtn = screen.getByRole('button', { name: /open cs101 study group/i });
    await userEvent.click(openBtn);

    // sessionStorage key must be written before navigate
    expect(sessionStorage.getItem('sh:select-server')).toBe('srv_1');
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('join error: 403 → private/unavailable message', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    mockApi.joinPublicServer.mockRejectedValueOnce(new Error('403 Forbidden'));

    renderPage();
    await waitFor(() => screen.getByText('CS101 Study Group'));

    await userEvent.click(screen.getByRole('button', { name: /join cs101 study group/i }));

    await waitFor(() => {
      expect(screen.getByText(/server may be private or unavailable/i)).toBeInTheDocument();
    });
  });

  it('join error: 404 → private/unavailable message', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    mockApi.joinPublicServer.mockRejectedValueOnce(new Error('404 Not Found'));

    renderPage();
    await waitFor(() => screen.getByText('CS101 Study Group'));

    await userEvent.click(screen.getByRole('button', { name: /join cs101 study group/i }));

    await waitFor(() => {
      expect(screen.getByText(/server may be private or unavailable/i)).toBeInTheDocument();
    });
  });

  it('join error: 400 → generic retry message (not private)', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    mockApi.joinPublicServer.mockRejectedValueOnce(new Error('400 Bad Request'));

    renderPage();
    await waitFor(() => screen.getByText('CS101 Study Group'));

    await userEvent.click(screen.getByRole('button', { name: /join cs101 study group/i }));

    await waitFor(() => {
      expect(screen.getByText(/couldn't join — please try again/i)).toBeInTheDocument();
      expect(screen.queryByText(/private or unavailable/i)).toBeNull();
    });
  });

  it('join error: 409 → generic retry message (not private)', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    mockApi.joinPublicServer.mockRejectedValueOnce(new Error('409 Conflict'));

    renderPage();
    await waitFor(() => screen.getByText('CS101 Study Group'));

    await userEvent.click(screen.getByRole('button', { name: /join cs101 study group/i }));

    await waitFor(() => {
      expect(screen.getByText(/couldn't join — please try again/i)).toBeInTheDocument();
      expect(screen.queryByText(/private or unavailable/i)).toBeNull();
    });
  });

  it('has no duplicate id="discover-results-count" in DOM', async () => {
    mockApi.getDiscoverServers.mockResolvedValueOnce({ servers: MOCK_SERVERS });
    renderPage();

    await waitFor(() => screen.getByText('Showing 2 communities'));

    const els = document.querySelectorAll('#discover-results-count');
    expect(els.length).toBe(1);
  });

  it('shows error state and retry button', async () => {
    mockApi.getDiscoverServers.mockRejectedValueOnce(new Error('500 Internal Server Error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/couldn't load the directory/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry request/i })).toBeInTheDocument();
    });
  });

  it('retry button re-fetches after error', async () => {
    mockApi.getDiscoverServers
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ servers: MOCK_SERVERS });

    renderPage();

    await waitFor(() => screen.getByRole('button', { name: /retry request/i }));
    await userEvent.click(screen.getByRole('button', { name: /retry request/i }));

    await waitFor(() => {
      expect(screen.getByText('CS101 Study Group')).toBeInTheDocument();
    });
  });
});

// ── Layout regression — B-6 wave-67 ─────────────────────────────────────────
//
// Asserts that ServerRail is present on the /discover route and that the
// Discover button carries aria-current="page".  Before the fix, /discover
// mounted ServerDiscoverPage bare (no ServerRail), making the rail absent and
// the discoverActive glow logic dead code.
//
// Rendering approach: MemoryRouter initialEntries=['/discover'] with
// ServerContext.Provider so ServerRail's useServers() and useLocation() work
// without needing the real ServerProvider fetch machinery.

describe('RailShell layout on /discover — regression (B-6 wave-67)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getDiscoverServers must return a pending promise so ServerDiscoverPage
    // stays in loading state — we are only asserting layout structure here.
    mockApi.getDiscoverServers.mockReturnValue(new Promise(() => {}));
  });

  it('renders the server rail on /discover', () => {
    render(
      <MemoryRouter initialEntries={['/discover']}>
        <ServerContext.Provider value={makeCtx()}>
          <RailShell>
            <ServerDiscoverPage />
          </RailShell>
        </ServerContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('server-rail')).toBeInTheDocument();
  });

  it('Discover rail button has aria-current="page" on /discover', () => {
    render(
      <MemoryRouter initialEntries={['/discover']}>
        <ServerContext.Provider value={makeCtx()}>
          <RailShell>
            <ServerDiscoverPage />
          </RailShell>
        </ServerContext.Provider>
      </MemoryRouter>,
    );

    const discoverBtn = screen.getByTestId('discover-rail-button');
    expect(discoverBtn).toBeInTheDocument();
    expect(discoverBtn).toHaveAttribute('aria-current', 'page');
  });
});
