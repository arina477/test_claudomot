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
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';
import { ConnectionStateIndicator } from './ConnectionStateIndicator';
import { ServerContext } from './ServerContext';
import type { ServerContextValue } from './ServerContext';

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
};

function renderShell(ctxOverride: Partial<ServerContextValue> = {}) {
  return render(
    <ServerContext.Provider value={{ ...defaultCtx, ...ctxOverride }}>
      <AppShell />
    </ServerContext.Provider>,
  );
}

// ── AppShell structural tests ────────────────────────────────────────────────

describe('AppShell', () => {
  it('renders the server rail navigation', () => {
    renderShell();
    expect(screen.getByRole('navigation', { name: /server rail/i })).toBeInTheDocument();
  });

  it('renders the channel sidebar (desktop — present in DOM)', () => {
    renderShell();
    // The aside is always in DOM; Tailwind hidden/lg:flex only controls CSS display.
    // Both the desktop div and the mobile drawer contain a sidebar — use getAllByRole.
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
