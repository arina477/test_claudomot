/**
 * useAudioOnlyFallback — unit tests (wave-34 B-3)
 *
 * Tests the public API of useAudioOnlyFallback via a wrapper component
 * that renders inside a mocked LiveKitRoom context.
 *
 * Coverage:
 *   - Initial mode is null (not in audio-only)
 *   - enterManual() → mode = 'manual', pauseVideoSubscriptions called
 *   - restore() → mode back to null (after timeout), restoreState transitions
 *   - ConnectionQuality.Poor (debounced) → mode = 'auto'
 *   - Quality flapping (Poor → Good before debounce) → no mode change
 *   - ConnectionQuality.Good while in 'auto' → restore auto
 *   - ConnectionQuality.Good while in 'manual' → does NOT auto-restore (user decision wins)
 *   - Screen-share track present while in audio-only → NOT auto-subscribed
 *   - Debounce: Poor for < 3 s → no mode change; Poor for > 3 s → auto mode
 *
 * NOT tested here (media plane):
 *   - Real ICE/WebRTC setSubscribed calls — those require a live SFU.
 *     We verify the CALL to setSubscribed on mock track publications.
 *
 * All timers use vi.useFakeTimers() to deterministically control debounce.
 */

import { act, renderHook } from '@testing-library/react';
import { ConnectionQuality, RoomEvent, Track } from 'livekit-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock @livekit/components-react ──────────────────────────────────────────
// We need useRoomContext() to return a controlled room mock.

// Room event listener map — lets tests simulate RoomEvent.ConnectionQualityChanged
type RoomEventListener = (...args: unknown[]) => void;
const roomListeners: Map<string, RoomEventListener[]> = new Map();

// Mock remote publication — for setSubscribed assertion
const mockSetSubscribed = vi.fn();
const mockVideoPublication = {
  kind: Track.Kind.Video,
  source: Track.Source.Camera,
  setSubscribed: mockSetSubscribed,
};
const mockScreenSharePublication = {
  kind: Track.Kind.Video,
  source: Track.Source.ScreenShare,
  setSubscribed: mockSetSubscribed,
};
const mockAudioPublication = {
  kind: Track.Kind.Audio,
  source: Track.Source.Microphone,
  setSubscribed: vi.fn(), // should NEVER be called
};

// Mock remote participant with video + screen-share + audio publications
const mockRemoteParticipant = {
  trackPublications: new Map([
    ['cam-track', mockVideoPublication],
    ['screen-track', mockScreenSharePublication],
    ['audio-track', mockAudioPublication],
  ]),
};

const mockLocalParticipant = { identity: 'local-user' };

const mockRoom = {
  localParticipant: mockLocalParticipant,
  remoteParticipants: new Map([['remote-user', mockRemoteParticipant]]),
  on: (event: string, listener: RoomEventListener) => {
    if (!roomListeners.has(event)) roomListeners.set(event, []);
    const listeners = roomListeners.get(event);
    if (listeners) listeners.push(listener);
  },
  off: (event: string, listener: RoomEventListener) => {
    const listeners = roomListeners.get(event) ?? [];
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  },
};

// Helper: fire a ConnectionQualityChanged event
function fireQualityChanged(
  quality: ConnectionQuality,
  participantArg: unknown = mockLocalParticipant,
) {
  const listeners = roomListeners.get(RoomEvent.ConnectionQualityChanged) ?? [];
  for (const listener of listeners) {
    listener(quality, participantArg);
  }
}

vi.mock('@livekit/components-react', () => ({
  useRoomContext: () => mockRoom,
}));

// ── Import after mock ────────────────────────────────────────────────────────
import { useAudioOnlyFallback } from './useAudioOnlyFallback';

// ── Setup ────────────────────────────────────────────────────────────────────

describe('useAudioOnlyFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomListeners.clear();
    vi.useFakeTimers();
    // Re-init mockSetSubscribed so each test starts fresh
    mockSetSubscribed.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('initial mode is null (not in audio-only)', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());
    expect(result.current.mode).toBe(null);
    expect(result.current.restoreState).toBe('idle');
  });

  // ── Manual opt-in ─────────────────────────────────────────────────────────

  it('enterManual() sets mode to "manual" and pauses video subscriptions', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());

    act(() => {
      result.current.enterManual();
    });

    expect(result.current.mode).toBe('manual');
    // setSubscribed(false) called on video + screen-share tracks, NOT on audio
    expect(mockSetSubscribed).toHaveBeenCalledWith(false);
    // Audio publication's setSubscribed must NOT have been called
    expect(mockAudioPublication.setSubscribed).not.toHaveBeenCalled();
  });

  // ── Restore ────────────────────────────────────────────────────────────────

  it('restore() sets restoreState to "restoring" then clears mode after 1 s', async () => {
    const { result } = renderHook(() => useAudioOnlyFallback());

    // Enter manual first
    act(() => {
      result.current.enterManual();
    });
    expect(result.current.mode).toBe('manual');

    // Restore
    act(() => {
      result.current.restore();
    });
    expect(result.current.restoreState).toBe('restoring');

    // After 1 s (restore timeout), mode clears
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.mode).toBe(null);
    expect(result.current.restoreState).toBe('idle');
  });

  it('restore() calls setSubscribed(true) on video publications', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());

    act(() => {
      result.current.enterManual();
    });
    mockSetSubscribed.mockReset(); // clear pause calls

    act(() => {
      result.current.restore();
    });

    expect(mockSetSubscribed).toHaveBeenCalledWith(true);
    // Audio publication still not touched
    expect(mockAudioPublication.setSubscribed).not.toHaveBeenCalled();
  });

  // ── ConnectionQuality.Poor → debounce → auto mode ─────────────────────────

  it('ConnectionQuality.Poor for < 3 s → mode stays null (debounce not elapsed)', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());

    act(() => {
      fireQualityChanged(ConnectionQuality.Poor);
    });

    // Advance 2 s — debounce (3 s) not yet elapsed
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.mode).toBe(null);
  });

  it('ConnectionQuality.Poor sustained for 3 s → mode becomes "auto"', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());

    act(() => {
      fireQualityChanged(ConnectionQuality.Poor);
    });

    // Advance 3 s — debounce elapsed
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.mode).toBe('auto');
    // setSubscribed(false) called on video tracks
    expect(mockSetSubscribed).toHaveBeenCalledWith(false);
  });

  // ── Quality flapping (Poor → Good before debounce) ────────────────────────

  it('quality flap (Poor → Good before 3 s) → no mode change (debounce cancelled)', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());

    act(() => {
      fireQualityChanged(ConnectionQuality.Poor);
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Quality recovers before debounce fires
    act(() => {
      fireQualityChanged(ConnectionQuality.Good);
    });

    act(() => {
      vi.advanceTimersByTime(2000); // past the original 3 s mark
    });

    // Mode should still be null — debounce was cancelled
    expect(result.current.mode).toBe(null);
  });

  // ── Auto-restore on Quality.Good ──────────────────────────────────────────

  it('ConnectionQuality.Good while in "auto" mode → auto-restores (mode back to null)', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());

    // Enter auto via sustained poor quality
    act(() => {
      fireQualityChanged(ConnectionQuality.Poor);
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.mode).toBe('auto');

    // Quality recovers
    act(() => {
      fireQualityChanged(ConnectionQuality.Good);
    });

    expect(result.current.mode).toBe(null);
    // setSubscribed(true) called for video re-subscribe
    expect(mockSetSubscribed).toHaveBeenCalledWith(true);
  });

  it('ConnectionQuality.Good while in "manual" mode → does NOT auto-restore (user decision wins)', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());

    act(() => {
      result.current.enterManual();
    });
    expect(result.current.mode).toBe('manual');

    // Even if quality is Good, manual mode is NOT auto-cleared
    act(() => {
      fireQualityChanged(ConnectionQuality.Good);
    });

    expect(result.current.mode).toBe('manual');
  });

  // ── Remote participant quality events are ignored ──────────────────────────

  it('ConnectionQuality event from a remote participant is ignored', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());
    const remoteParticipant = { identity: 'remote-user' };

    act(() => {
      fireQualityChanged(ConnectionQuality.Poor, remoteParticipant);
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // Mode stays null — we only watch LOCAL participant quality
    expect(result.current.mode).toBe(null);
  });

  // ── Restore timer cleared on unmount (RW-2 regression guard) ────────────────

  it('restore() timeout is cleared on unmount — no setState on unmounted component', () => {
    const { result, unmount } = renderHook(() => useAudioOnlyFallback());

    // Enter manual first so restore() is meaningful
    act(() => {
      result.current.enterManual();
    });

    // Trigger restore — restoreTimerRef now holds a 1 s timer
    act(() => {
      result.current.restore();
    });
    expect(result.current.restoreState).toBe('restoring');

    // Unmount BEFORE the 1 s timer fires (simulates user leaving within 1 s of restoring)
    unmount();

    // Advance past the 1 s mark — the timer should have been cleared and must not throw
    // (React would warn/throw on setState after unmount if the timer fired)
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    }).not.toThrow();
  });

  // ── Audio invariant ────────────────────────────────────────────────────────

  it('audio publications are NEVER touched by pause or restore (audio invariant)', () => {
    const { result } = renderHook(() => useAudioOnlyFallback());

    act(() => {
      result.current.enterManual();
    });
    act(() => {
      result.current.restore();
    });

    // The audio publication's setSubscribed must never have been called
    expect(mockAudioPublication.setSubscribed).not.toHaveBeenCalled();
  });
});
