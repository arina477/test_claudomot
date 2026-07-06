/**
 * useConnectionState.test.tsx — wave-21 B-3 tests.
 *
 * Coverage:
 *   Connection-state hook:
 *     1. socket connected → 'online'
 *     2. socket disconnect → 'reconnecting' (socket active)
 *     3. socket active=false (permanently offline) → 'offline'
 *     4. window offline event → 'offline' regardless of socket
 *     5. rapid flap → no thrash (debounced; last-wins)
 *     6. AppHome passes the live value from useConnectionState to AppShell
 *
 *   DISAGREEMENT cases (mandatory per spec):
 *     D1. window=online + socket=reconnecting → 'reconnecting' (NOT 'online')
 *     D2. window=offline + socket=connected  → 'offline'   (NOT 'online')
 *
 * All tests use fake timers (vi.useFakeTimers) for the debounce + vi.fn() socket mocks.
 * No real I/O, no real socket.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Socket mock state — mutated per test ─────────────────────────────────────

type SocketEventHandler = () => void;

let mockSocketConnected = true;
let mockSocketActive = true;
const socketListeners: Map<string, SocketEventHandler[]> = new Map();

function emitSocketEvent(event: string) {
  for (const handler of socketListeners.get(event) ?? []) {
    handler();
  }
}

vi.mock('./messagingSocket', () => ({
  getMessagingSocket: vi.fn(() => ({
    get connected() {
      return mockSocketConnected;
    },
    get active() {
      return mockSocketActive;
    },
    on: vi.fn((event: string, handler: SocketEventHandler) => {
      if (!socketListeners.has(event)) socketListeners.set(event, []);
      socketListeners.get(event)?.push(handler);
    }),
    off: vi.fn((event: string, handler: SocketEventHandler) => {
      const handlers = socketListeners.get(event);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
      }
    }),
  })),
  getSocketState: vi.fn((): 'online' | 'reconnecting' | 'offline' => {
    if (mockSocketConnected) return 'online';
    if (mockSocketActive) return 'reconnecting';
    return 'offline';
  }),
  // wave-15 mention / wave-37 notification events
  onMention: vi.fn(() => () => {}),
}));

import { useConnectionState } from './useConnectionState';

// ── Helpers ────────────────────────────────────────────────────────────────────

function setSocketOnline() {
  mockSocketConnected = true;
  mockSocketActive = true;
}

function setSocketReconnecting() {
  mockSocketConnected = false;
  mockSocketActive = true;
}

function setSocketOffline() {
  mockSocketConnected = false;
  mockSocketActive = false;
}

function setWindowOnline() {
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
}

function setWindowOffline() {
  Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
}

const DEBOUNCE_MS = 150;

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('useConnectionState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset socket + window to healthy defaults before each test.
    setSocketOnline();
    setWindowOnline();
    // Clear all captured socket listeners.
    socketListeners.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ── 1. Socket connected → 'online' ───────────────────────────────────────

  it('returns online when socket is connected and window is online', () => {
    setSocketOnline();
    setWindowOnline();
    const { result } = renderHook(() => useConnectionState());
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(result.current).toBe('online');
  });

  // ── 2. Socket disconnect (active=true) → 'reconnecting' ──────────────────

  it('transitions to reconnecting when socket disconnects (active=true)', () => {
    setSocketOnline();
    setWindowOnline();
    const { result } = renderHook(() => useConnectionState());

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(result.current).toBe('online');

    // Simulate socket disconnect (socket is retrying — active=true).
    act(() => {
      setSocketReconnecting();
      emitSocketEvent('disconnect');
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(result.current).toBe('reconnecting');
  });

  // ── 3. Socket active=false → 'offline' ───────────────────────────────────

  it('returns offline when socket is permanently offline (active=false)', () => {
    setSocketOffline();
    setWindowOnline();
    const { result } = renderHook(() => useConnectionState());
    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(result.current).toBe('offline');
  });

  // ── 4. window offline event → 'offline' regardless of socket ─────────────

  it('returns offline on window offline event even if socket was connected', () => {
    setSocketOnline();
    setWindowOnline();
    const { result } = renderHook(() => useConnectionState());

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(result.current).toBe('online');

    act(() => {
      setWindowOffline();
      window.dispatchEvent(new Event('offline'));
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(result.current).toBe('offline');
  });

  // ── 5. Rapid flap → no thrash (debounced) ────────────────────────────────

  it('does not thrash on rapid flap — only the last stable state is applied', () => {
    setSocketOnline();
    setWindowOnline();
    const { result } = renderHook(() => useConnectionState());

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(result.current).toBe('online');

    // Rapid: disconnect → reconnect before debounce fires.
    act(() => {
      // Disconnect
      setSocketReconnecting();
      emitSocketEvent('disconnect');
      // Immediately reconnect before debounce fires
      setSocketOnline();
      emitSocketEvent('connect');
      // Advance debounce — only the last state is applied (online).
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    // Should remain online (last state wins — no flap to reconnecting).
    expect(result.current).toBe('online');
  });

  // ── DISAGREEMENT D1: window=online + socket=reconnecting → 'reconnecting' ─

  it('[DISAGREEMENT D1] window=online + socket=reconnecting → reconnecting (NOT online)', () => {
    // Window has regained network, but the socket is still trying to reconnect.
    setSocketReconnecting();
    setWindowOnline();
    const { result } = renderHook(() => useConnectionState());

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    // SOURCE-PRIORITY: socket reconnecting takes precedence — NOT 'online'.
    expect(result.current).toBe('reconnecting');
    expect(result.current).not.toBe('online');

    // Simulate the window 'online' event firing (e.g. network came back).
    // The socket is still in reconnecting state — must remain 'reconnecting'.
    act(() => {
      window.dispatchEvent(new Event('online'));
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(result.current).toBe('reconnecting');
  });

  // ── DISAGREEMENT D2: window=offline + socket=connected → 'offline' ────────

  it('[DISAGREEMENT D2] window=offline + socket=connected → offline (NOT online)', () => {
    // Socket is connected, but the window lost network.
    setSocketOnline();
    setWindowOffline();
    const { result } = renderHook(() => useConnectionState());

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    // SOURCE-PRIORITY: window offline is absolute — NOT 'online'.
    expect(result.current).toBe('offline');
    expect(result.current).not.toBe('online');
  });
});

// ── AppHome passes live connection state ──────────────────────────────────────
//
// Verify that AppHome replaces the hardcoded "online" with the live hook value.
// We render AppHome and check that the ConnectionStateIndicator reflects the
// disconnected state instead of the former hardcoded 'online'.

// Minimal mocks for AppHome's dependencies.
vi.mock('../auth/api', () => ({
  api: {
    getMe: vi.fn().mockReturnValue(new Promise(() => {})),
    getProfile: vi.fn().mockReturnValue(new Promise(() => {})),
    getServers: vi.fn().mockReturnValue(new Promise(() => {})),
    getServerDetail: vi.fn().mockReturnValue(new Promise(() => {})),
    getMyMentions: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    listMessages: vi.fn().mockReturnValue(new Promise(() => {})),
    getThreadReplies: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getServerMembers: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn(),
    editMessage: vi.fn(),
    deleteMessage: vi.fn(),
    toggleReaction: vi.fn(),
    // wave-37 notification endpoints
    getNotifications: vi.fn().mockResolvedValue({ items: [], unreadCount: 0, nextCursor: null }),
    markNotificationRead: vi.fn().mockResolvedValue({ unreadCount: 0 }),
    markAllNotificationsRead: vi.fn().mockResolvedValue({ unreadCount: 0 }),
  },
}));

vi.mock('./presenceSocket', () => ({
  getPresenceSocket: vi.fn(() => ({
    connected: false,
    active: false,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
  getPresenceStatus: vi.fn(() => 'offline'),
  getPresenceSnapshot: vi.fn(() => new Map()),
  getTypers: vi.fn(() => []),
  subscribePresence: vi.fn(() => () => {}),
  subscribeTyping: vi.fn(() => () => {}),
  joinPresenceChannel: vi.fn(),
  emitTypingStart: vi.fn(),
  emitTypingStop: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppHome } from '../pages/AppHome';

describe('AppHome — live connection state wiring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    socketListeners.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows reconnecting indicator when socket is disconnecting (not hardcoded online)', () => {
    setSocketReconnecting();
    setWindowOnline();

    render(
      <MemoryRouter>
        <AppHome />
      </MemoryRouter>,
    );

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    // The ConnectionStateIndicator renders "Reconnecting…" text when state='reconnecting'.
    // If AppHome were still hardcoded to 'online', the banner would be sr-only/invisible.
    expect(screen.getByText('Reconnecting…')).toBeInTheDocument();
  });

  it('shows offline indicator when window goes offline', () => {
    setSocketOffline();
    setWindowOffline();

    render(
      <MemoryRouter>
        <AppHome />
      </MemoryRouter>,
    );

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(screen.getByText(/Offline — messages will send when you're back/i)).toBeInTheDocument();
  });
});
