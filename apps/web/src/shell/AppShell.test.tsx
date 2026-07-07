/**
 * AppShell — RTL + vitest structural tests.
 *
 * Asserts the three shell columns are present in the DOM,
 * and that ConnectionStateIndicator renders correctly for each of its 3 states.
 *
 * AppShell uses ServerContext; tests either wrap with ServerProvider (with api
 * mocked to idle) or render directly (default context values — no modal, empty
 * server list).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';
import { ConnectionStateIndicator } from './ConnectionStateIndicator';
import { ServerContext } from './ServerContext';
import type { ServerContextValue } from './ServerContext';

// useBlocks mock — MemberListPanel uses shared blocks store; default to empty
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

// Mock api so MainColumn/useMessages don't trigger real fetch
vi.mock('../auth/api', () => ({
  api: {
    listMessages: vi.fn().mockReturnValue(new Promise(() => {})),
    sendMessage: vi.fn(),
    getProfile: vi.fn().mockReturnValue(new Promise(() => {})),
    getServers: vi.fn().mockReturnValue(new Promise(() => {})),
    getServerDetail: vi.fn().mockReturnValue(new Promise(() => {})),
    getMyMentions: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    // wave-37 notification endpoints
    getNotifications: vi.fn().mockResolvedValue({ items: [], unreadCount: 0, nextCursor: null }),
    markNotificationRead: vi.fn().mockResolvedValue({ unreadCount: 0 }),
    markAllNotificationsRead: vi.fn().mockResolvedValue({ unreadCount: 0 }),
    // wave-46 DM endpoints — needed when DmHome mounts
    listDmConversations: vi.fn().mockReturnValue(new Promise(() => {})),
    listDmMessages: vi.fn().mockReturnValue(new Promise(() => {})),
    sendDmMessage: vi.fn(),
    createDmConversation: vi.fn().mockReturnValue(new Promise(() => {})),
    // permissions endpoint called by MemberListPanel / MainColumn when selectedId is set
    getMyPermissions: vi.fn().mockReturnValue(new Promise(() => {})),
    // endpoints called by components that mount when selectedId is non-null
    getStudyTimer: vi.fn().mockReturnValue(new Promise(() => {})),
    getServerMembers: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}));

// Mock socket singleton to avoid real socket connections in tests
vi.mock('./messagingSocket', () => ({
  getMessagingSocket: vi.fn(() => ({
    connected: false,
    active: false,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
  joinChannel: vi.fn(),
  leaveChannel: vi.fn(),
  onMessageNew: vi.fn(() => () => {}),
  onMessageUpdated: vi.fn(() => () => {}),
  onMessageDeleted: vi.fn(() => () => {}),
  onReactionAdded: vi.fn(() => () => {}),
  onReactionRemoved: vi.fn(() => () => {}),
  onThreadReplyCreated: vi.fn(() => () => {}),
  onThreadReplyDeleted: vi.fn(() => () => {}),
  applyReactionEvent: vi.fn((existing: unknown) => existing),
  // wave-15 mention / wave-37 notification socket events
  onMention: vi.fn(() => () => {}),
  // wave-46 DM socket events
  onDmMessage: vi.fn(() => () => {}),
  getSocketState: vi.fn(() => 'offline'),
}));

// Default context value for tests (no servers, modal closed)
const defaultCtx: ServerContextValue = {
  servers: [],
  status: 'idle',
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
};

function renderShell(ctxOverride: Partial<ServerContextValue> = {}) {
  return render(
    <MemoryRouter>
      <ServerContext.Provider value={{ ...defaultCtx, ...ctxOverride }}>
        <AppShell />
      </ServerContext.Provider>
    </MemoryRouter>,
  );
}

// ── AppShell structural tests ────────────────────────────────────────────────

describe('AppShell', () => {
  it('renders the server rail navigation', () => {
    renderShell();
    expect(screen.getByRole('navigation', { name: /server rail/i })).toBeInTheDocument();
  });

  it('renders the channel sidebar (desktop — present in DOM) on server view', () => {
    renderShell();
    // Default state: dmHomeActive=false (server view).
    // Both the desktop wrapper and the mobile drawer contain an aside — use getAllByRole.
    const sidebars = screen.getAllByRole('complementary', { name: /channel sidebar/i });
    expect(sidebars.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the main column', () => {
    renderShell();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the Home and Add-a-server buttons in the rail', () => {
    renderShell();
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add a server/i })).toBeInTheDocument();
  });

  it('renders channel content from MainColumn in the main area', () => {
    renderShell();
    // MainColumn still has static "questions" channel header — used as smoke test
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders a connection status region', () => {
    renderShell();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not render the create-server modal when createModalOpen is false', () => {
    renderShell({ createModalOpen: false });
    expect(screen.queryByTestId('create-server-modal')).not.toBeInTheDocument();
  });
});

// ── DM surface — ChannelSidebar gating tests ─────────────────────────────────
//
// When the user activates the DM home surface (clicks the Home/DM button in the
// server rail), dmHomeActive flips to true.  The ChannelSidebar must be absent
// from BOTH the desktop wrapper AND the mobile overlay drawer so that it no
// longer cramps DmThread.  The DM body (DmHome) must be present.
//
// When dmHomeActive is false (server view), ChannelSidebar must be present —
// this catches regressions to the gate logic.

describe('AppShell — DM surface ChannelSidebar gating', () => {
  it('hides ChannelSidebar (desktop + mobile) when DM surface is active', async () => {
    const user = userEvent.setup();
    renderShell();

    // Activate DM home by clicking the "Direct Messages" button in the server rail.
    const dmBtn = screen.getByTestId('dm-home-rail-button');
    await user.click(dmBtn);

    // ChannelSidebar (aside[aria-label="Channel sidebar"]) must be absent from DOM
    // for BOTH the desktop wrapper and the mobile drawer — zero instances.
    const sidebars = screen.queryAllByRole('complementary', { name: /channel sidebar/i });
    expect(sidebars).toHaveLength(0);
  });

  it('hides the mobile overlay drawer (ChannelSidebar) when DM surface is active', async () => {
    const user = userEvent.setup();
    renderShell();

    // Confirm mobile drawer wrapper is in DOM before activation (server view).
    const drawerBefore = document.querySelector('[aria-label="Channel sidebar drawer"]');
    expect(drawerBefore).toBeInTheDocument();

    // Activate DM surface.
    await user.click(screen.getByTestId('dm-home-rail-button'));

    // Mobile drawer wrapper must be gone — not just visually hidden.
    const drawerAfter = document.querySelector('[aria-label="Channel sidebar drawer"]');
    expect(drawerAfter).not.toBeInTheDocument();
  });

  it('shows the DM body (DmHome) and no ChannelSidebar when DM surface is active', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId('dm-home-rail-button'));

    // DmHome must replace the MainColumn in the flex layout.
    // Absence of ChannelSidebar confirms the canonical 3-panel:
    // ServerRail + DmConversationList + DmThread (DmThread itself renders <main>).
    const sidebars = screen.queryAllByRole('complementary', { name: /channel sidebar/i });
    expect(sidebars).toHaveLength(0);

    // DmThread renders <main> — the DM body is present, proving the DM surface mounted.
    expect(screen.queryByRole('main')).toBeInTheDocument();
  });

  it('shows ChannelSidebar (server view) when dmHomeActive is false — no regression', () => {
    renderShell();

    // Default: dmHomeActive=false.  Both desktop and mobile sidebar instances present.
    const sidebars = screen.queryAllByRole('complementary', { name: /channel sidebar/i });
    expect(sidebars.length).toBeGreaterThanOrEqual(1);

    // The main column (server channel view) must be present.
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('does not render the mobile backdrop after opening drawer then switching to DM surface', async () => {
    // Regression for: orphaned backdrop persists on DM surface when sidebarOpen=true at
    // DM activation time.  The backdrop must NOT be present after the DM toggle.
    const user = userEvent.setup();
    renderShell();

    // Step 1: Open the mobile channel drawer by clicking the toggle in MainColumn.
    // The toggle button is rendered by MainColumn; query it by accessible name.
    const menuBtn = screen.getByRole('button', { name: /toggle channel sidebar/i });
    await user.click(menuBtn);

    // Backdrop must now be in the DOM (sidebarOpen=true, dmHomeActive=false).
    expect(screen.getByTestId('mobile-sidebar-backdrop')).toBeInTheDocument();

    // The mobile drawer must also be in the DOM.
    expect(document.querySelector('[aria-label="Channel sidebar drawer"]')).toBeInTheDocument();

    // Step 2: Switch to the DM surface.
    await user.click(screen.getByTestId('dm-home-rail-button'));

    // Backdrop must be gone — not in document (sidebarOpen reset + !dmHomeActive guard).
    expect(screen.queryByTestId('mobile-sidebar-backdrop')).not.toBeInTheDocument();

    // Drawer must also be gone (existing behaviour — gated on !dmHomeActive).
    expect(document.querySelector('[aria-label="Channel sidebar drawer"]')).not.toBeInTheDocument();
  });
});

// ── Server-select clears DM home surface (wave-57 B-3 fix) ──────────────────
//
// Acceptance criteria:
//   1. From DM surface, clicking a server icon exits DmHome on the FIRST click.
//   2. From DM surface, clicking the Home button exits DmHome on the FIRST click.
//   3. Regression: clicking the DM-rail button still enters DmHome (entry intact).
//   4. Edge: re-selecting the already-selected server while in DM surface still exits.

describe('AppShell — server-select + Home clear DM surface (wave-57)', () => {
  it('server icon click exits DmHome on first click', async () => {
    const user = userEvent.setup();
    const selectServerMock = vi.fn();
    renderShell({
      servers: [{ id: 'srv-1', name: 'Physics', ownerId: 'u1' }],
      status: 'loaded',
      selectedId: 'srv-1',
      selectServer: selectServerMock,
    });

    // Enter DM surface.
    await user.click(screen.getByTestId('dm-home-rail-button'));
    // Confirm DM surface is active — ChannelSidebar should be gone.
    expect(screen.queryAllByRole('complementary', { name: /channel sidebar/i })).toHaveLength(0);

    // Click the server icon — first click must exit DM surface.
    await user.click(screen.getByRole('button', { name: /physics/i }));

    // MainColumn (server view) must be back — ChannelSidebar rendered again.
    const sidebarsAfter = screen.queryAllByRole('complementary', { name: /channel sidebar/i });
    expect(sidebarsAfter.length).toBeGreaterThanOrEqual(1);
    // selectServer must have been called.
    expect(selectServerMock).toHaveBeenCalledWith('srv-1');
  });

  it('Home button click exits DmHome on first click', async () => {
    const user = userEvent.setup();
    renderShell();

    // Enter DM surface.
    await user.click(screen.getByTestId('dm-home-rail-button'));
    expect(screen.queryAllByRole('complementary', { name: /channel sidebar/i })).toHaveLength(0);

    // Click Home — first click must exit DM surface.
    await user.click(screen.getByRole('button', { name: /^home$/i }));

    // Server view restored — ChannelSidebar present again.
    const sidebarsAfter = screen.queryAllByRole('complementary', { name: /channel sidebar/i });
    expect(sidebarsAfter.length).toBeGreaterThanOrEqual(1);
  });

  it('DM-rail button still enters DmHome (regression: entry unbroken)', async () => {
    const user = userEvent.setup();
    renderShell();

    // Click DM-rail button — DM surface must activate.
    await user.click(screen.getByTestId('dm-home-rail-button'));
    const sidebars = screen.queryAllByRole('complementary', { name: /channel sidebar/i });
    expect(sidebars).toHaveLength(0);
    // main is still in DOM (DmThread renders <main>).
    expect(screen.queryByRole('main')).toBeInTheDocument();
  });

  it('re-selecting already-selected server while in DM surface still exits', async () => {
    const user = userEvent.setup();
    const selectServerMock = vi.fn();
    renderShell({
      servers: [{ id: 'srv-1', name: 'Chemistry', ownerId: 'u1' }],
      status: 'loaded',
      selectedId: 'srv-1',
      selectServer: selectServerMock,
    });

    // Enter DM surface.
    await user.click(screen.getByTestId('dm-home-rail-button'));
    expect(screen.queryAllByRole('complementary', { name: /channel sidebar/i })).toHaveLength(0);

    // Click the same server that is already selected.
    await user.click(screen.getByRole('button', { name: /chemistry/i }));

    // Must still exit DM surface unconditionally.
    const sidebarsAfter = screen.queryAllByRole('complementary', { name: /channel sidebar/i });
    expect(sidebarsAfter.length).toBeGreaterThanOrEqual(1);
    expect(selectServerMock).toHaveBeenCalledWith('srv-1');
  });
});

// ── ConnectionStateIndicator unit tests ─────────────────────────────────────

describe('ConnectionStateIndicator', () => {
  it('renders online state as a visually hidden status (sr-only)', () => {
    render(<ConnectionStateIndicator state="online" />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    // Text should say "Online" for screen readers
    expect(status).toHaveTextContent(/online/i);
  });

  it('renders reconnecting state with indicator text', () => {
    render(<ConnectionStateIndicator state="reconnecting" />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent(/reconnecting/i);
  });

  it('renders offline state with full message text', () => {
    render(<ConnectionStateIndicator state="offline" />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent(/offline/i);
    expect(status).toHaveTextContent(/messages will send when you/i);
  });

  it('has aria-live="polite" on all states', () => {
    const { rerender } = render(<ConnectionStateIndicator state="online" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

    rerender(<ConnectionStateIndicator state="reconnecting" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

    rerender(<ConnectionStateIndicator state="offline" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});
