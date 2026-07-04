/**
 * Component tests for ServerRail, CreateServerModal, and ChannelSidebar.
 *
 * ServerRail:  lists real servers from context; empty state; "+" fires openCreateModal.
 * CreateServerModal: client-side name validation; submit disabled/enabled; calls api.
 * ChannelSidebar: no-server state; renders categories+channels when loaded.
 */

import type { ServerDetail } from '@studyhall/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelSidebar } from './ChannelSidebar';
import { CreateServerModal } from './CreateServerModal';
import { ProfileContext } from './ProfileContext';
import type { ProfileContextValue } from './ProfileContext';
import type { ServerContextValue } from './ServerContext';
import { ServerContext } from './ServerContext';
import { ServerRail } from './ServerRail';

// ── api mock ─────────────────────────────────────────────────────────────────

vi.mock('../auth/api', () => ({
  api: {
    createServer: vi.fn(),
    getServers: vi.fn(),
    getServerDetail: vi.fn(),
    getProfile: vi.fn(),
  },
}));

import { api } from '../auth/api';
const mockApi = api as unknown as {
  createServer: ReturnType<typeof vi.fn>;
  getServers: ReturnType<typeof vi.fn>;
  getServerDetail: ReturnType<typeof vi.fn>;
  getProfile: ReturnType<typeof vi.fn>;
};

// ── shared fixtures ───────────────────────────────────────────────────────────

const nullProfile: ProfileContextValue = {
  profile: null,
  refresh: vi.fn(),
};

function makeServerCtx(override: Partial<ServerContextValue> = {}): ServerContextValue {
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
    ...override,
  };
}

// ── ServerRail ────────────────────────────────────────────────────────────────

describe('ServerRail', () => {
  it('renders server initials for each server in the list', () => {
    const ctx = makeServerCtx({
      servers: [
        { id: 'a', name: 'CS 201', ownerId: 'u1' },
        { id: 'b', name: 'Literature', ownerId: 'u1' },
      ],
      status: 'loaded',
    });
    render(
      <ServerContext.Provider value={ctx}>
        <ServerRail />
      </ServerContext.Provider>,
    );
    // initials: "CS 201" → "CS", "Literature" → "LI"
    expect(screen.getByRole('button', { name: /CS 201/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Literature/i })).toBeInTheDocument();
  });

  it('renders no server buttons when the list is empty', () => {
    const ctx = makeServerCtx({ servers: [], status: 'loaded' });
    render(
      <ServerContext.Provider value={ctx}>
        <ServerRail />
      </ServerContext.Provider>,
    );
    // Only Home and "Add a server" — no dynamically generated server buttons
    const buttons = screen.getAllByRole('button');
    const labels = buttons.map((b) => b.getAttribute('aria-label'));
    expect(labels).not.toContain('CS 201');
    expect(screen.getByRole('button', { name: /add a server/i })).toBeInTheDocument();
  });

  it('marks the selected server as active (aria-current=page)', () => {
    const ctx = makeServerCtx({
      servers: [{ id: 'x', name: 'Study Group', ownerId: 'u1' }],
      status: 'loaded',
      selectedId: 'x',
    });
    render(
      <ServerContext.Provider value={ctx}>
        <ServerRail />
      </ServerContext.Provider>,
    );
    expect(screen.getByRole('button', { name: /Study Group/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('calls openCreateModal when the "Add a server" button is clicked', () => {
    const openCreateModal = vi.fn();
    const ctx = makeServerCtx({ openCreateModal });
    render(
      <ServerContext.Provider value={ctx}>
        <ServerRail />
      </ServerContext.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /add a server/i }));
    expect(openCreateModal).toHaveBeenCalledOnce();
  });

  it('shows a loading indicator while status is loading', () => {
    const ctx = makeServerCtx({ servers: [], status: 'loading' });
    render(
      <ServerContext.Provider value={ctx}>
        <ServerRail />
      </ServerContext.Provider>,
    );
    expect(screen.getByLabelText(/loading servers/i)).toBeInTheDocument();
  });
});

// ── CreateServerModal ─────────────────────────────────────────────────────────

describe('CreateServerModal', () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submit button is disabled when name is empty', () => {
    render(<CreateServerModal onSuccess={onSuccess} onClose={onClose} />);
    const submit = screen.getByRole('button', { name: /create/i });
    expect(submit).toHaveAttribute('aria-disabled', 'true');
  });

  it('submit button is enabled when name has content', () => {
    render(<CreateServerModal onSuccess={onSuccess} onClose={onClose} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'My Server' } });
    const submit = screen.getByRole('button', { name: /create/i });
    expect(submit).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('submit button stays disabled when name is only whitespace', () => {
    render(<CreateServerModal onSuccess={onSuccess} onClose={onClose} />);
    const input = screen.getByRole('textbox');
    // Whitespace-only is treated as empty
    fireEvent.change(input, { target: { value: '   ' } });
    const submit = screen.getByRole('button', { name: /create/i });
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('calls api.createServer with the trimmed name and fires onSuccess', async () => {
    const newServer = {
      id: 's1',
      name: 'Physics 101',
      ownerId: 'u1',
      createdAt: new Date().toISOString(),
    };
    mockApi.createServer.mockResolvedValueOnce(newServer);

    render(<CreateServerModal onSuccess={onSuccess} onClose={onClose} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  Physics 101  ' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockApi.createServer).toHaveBeenCalledWith({ name: 'Physics 101' });
      expect(onSuccess).toHaveBeenCalledWith(newServer);
    });
  });

  it('shows a server error banner on API failure', async () => {
    mockApi.createServer.mockRejectedValueOnce(new Error('500 Internal Server Error: oops'));

    render(<CreateServerModal onSuccess={onSuccess} onClose={onClose} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Bad Server' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to create server/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<CreateServerModal onSuccess={onSuccess} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ── ChannelSidebar ────────────────────────────────────────────────────────────

describe('ChannelSidebar', () => {
  function renderSidebar(ctxOverride: Partial<ServerContextValue> = {}) {
    return render(
      <ProfileContext.Provider value={nullProfile}>
        <ServerContext.Provider value={makeServerCtx(ctxOverride)}>
          <ChannelSidebar />
        </ServerContext.Provider>
      </ProfileContext.Provider>,
    );
  }

  it('shows a prompt to select a server when no server is selected', () => {
    renderSidebar({ selectedId: null });
    expect(screen.getByText(/select a server/i)).toBeInTheDocument();
  });

  it('renders categories and channels when server detail is loaded', () => {
    const detail: ServerDetail = {
      server: { id: 's1', name: 'Organic Chem', ownerId: 'u1', inviteCode: null },
      categories: [
        {
          id: 'cat1',
          name: 'Coursework',
          position: 0,
          channels: [
            { id: 'ch1', name: 'general', type: 'text', isPrivate: false, position: 0 },
            { id: 'ch2', name: 'resources', type: 'text', isPrivate: false, position: 1 },
          ],
        },
      ],
    };
    renderSidebar({
      selectedId: 's1',
      selectedDetail: detail,
      detailStatus: 'loaded',
      servers: [{ id: 's1', name: 'Organic Chem', ownerId: 'u1' }],
    });

    expect(screen.getByText(/coursework/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resources/i })).toBeInTheDocument();
  });

  it('renders the server name in the header when loaded', () => {
    const detail: ServerDetail = {
      server: { id: 's1', name: 'Organic Chem', ownerId: 'u1', inviteCode: null },
      categories: [],
    };
    renderSidebar({
      selectedId: 's1',
      selectedDetail: detail,
      detailStatus: 'loaded',
      servers: [{ id: 's1', name: 'Organic Chem', ownerId: 'u1' }],
    });
    expect(screen.getByRole('heading', { name: /organic chem/i })).toBeInTheDocument();
  });

  it('shows a loading state while fetching server detail', () => {
    renderSidebar({ selectedId: 's1', detailStatus: 'loading' });
    // Loading spinner should be visible (role="img" from SVG aria-hidden, so check container)
    expect(screen.queryByText(/select a server/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/couldn't load/i)).not.toBeInTheDocument();
  });

  it('shows an error message when detail fetch fails', () => {
    renderSidebar({ selectedId: 's1', detailStatus: 'error' });
    expect(screen.getByText(/couldn't load channels/i)).toBeInTheDocument();
  });
});
