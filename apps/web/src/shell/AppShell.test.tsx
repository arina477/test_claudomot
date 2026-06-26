/**
 * AppShell — RTL + vitest structural tests.
 *
 * Asserts the three shell columns are present in the DOM,
 * and that ConnectionStateIndicator renders correctly for each of its 3 states.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';
import { ConnectionStateIndicator } from './ConnectionStateIndicator';

// ── AppShell structural tests ────────────────────────────────────────────────

describe('AppShell', () => {
  it('renders the server rail navigation', () => {
    render(<AppShell />);
    expect(
      screen.getByRole('navigation', { name: /server rail/i }),
    ).toBeInTheDocument();
  });

  it('renders the channel sidebar (desktop — present in DOM)', () => {
    render(<AppShell />);
    // The aside is always in DOM; Tailwind hidden/lg:flex only controls CSS display.
    // Both the desktop div and the mobile drawer contain a sidebar — use getAllByRole.
    const sidebars = screen.getAllByRole('complementary', { name: /channel sidebar/i });
    expect(sidebars.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the main column', () => {
    render(<AppShell />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders placeholder server buttons in the rail', () => {
    render(<AppShell />);
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add a server/i })).toBeInTheDocument();
  });

  it('renders placeholder channels in the sidebar', () => {
    render(<AppShell />);
    // getAllByText because the channel appears in both desktop + mobile sidebar
    expect(screen.getAllByText(/questions/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders a connection status region', () => {
    render(<AppShell />);
    expect(screen.getByRole('status')).toBeInTheDocument();
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
