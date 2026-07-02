/**
 * HeaderBell — reload-on-open behavior (wave-37 B-6 REWORK).
 *
 * Verifies HIGH-2 fix: opening the panel triggers reload() so that live
 * mentions emitted between opens are reflected in the item list, not only
 * in the optimistic badge count.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted before any local imports
// ---------------------------------------------------------------------------

const mockReload = vi.fn();

vi.mock('./useNotifications', () => ({
  useNotifications: () => ({
    items: [],
    unreadCount: 3,
    nextCursor: null,
    loadStatus: 'loaded' as const,
    markAllStatus: 'idle' as const,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    loadMore: vi.fn(),
    reload: mockReload,
  }),
}));

vi.mock('./NotificationsPanel', () => ({
  // Simple stand-in; accepts onClose so HeaderBell's closePanel works.
  NotificationsPanel: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Notifications">
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('./ServerContext', () => ({
  useServers: () => ({
    selectServer: vi.fn(),
    selectChannel: vi.fn(),
    openAssignments: vi.fn(),
  }),
}));

vi.mock('./icons', () => ({
  BellIcon: () => <svg data-testid="bell-icon" />,
  BellFillIcon: () => <svg data-testid="bell-fill-icon" />,
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks are registered
// ---------------------------------------------------------------------------

import { HeaderBell } from './HeaderBell';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('HeaderBell — reload on panel open', () => {
  beforeEach(() => {
    mockReload.mockClear();
  });

  it('calls reload() when the panel opens (false → true)', () => {
    render(<HeaderBell />);

    // Panel is closed on mount; reload should NOT have been called yet.
    expect(mockReload).not.toHaveBeenCalled();

    // Click the bell to open the panel.
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('does NOT call reload() on close (true → false)', () => {
    render(<HeaderBell />);

    // Open the panel.
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(mockReload).toHaveBeenCalledTimes(1);

    mockReload.mockClear();

    // Close the panel via the bell toggle.
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));

    expect(mockReload).not.toHaveBeenCalled();
  });

  it('calls reload() on each subsequent open, not just the first', () => {
    render(<HeaderBell />);

    const bell = screen.getByRole('button', { name: /notifications/i });

    // Open → close → open again.
    fireEvent.click(bell); // open #1
    fireEvent.click(bell); // close
    fireEvent.click(bell); // open #2

    // reload called on open #1 and open #2, never on close.
    expect(mockReload).toHaveBeenCalledTimes(2);
  });
});
