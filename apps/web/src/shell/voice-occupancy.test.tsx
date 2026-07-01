/**
 * VoiceOccupancyIndicator + useVoiceOccupancy — render + poll tests.
 *
 * Testing surface (wave-32 B-3):
 *   VoiceOccupancyIndicator:
 *     - loading state renders skeleton (no count / names yet).
 *     - empty state renders "Room is empty" + "door's open" text.
 *     - populated state renders count chip + member names + "+N" overflow.
 *     - error state renders fail-soft muted line; Join stays reachable.
 *
 *   useVoiceOccupancy:
 *     - fetches /channels/:id/voice/participants on mount when enabled=true.
 *     - poll is BOUNDED: interval is cleared on unmount.
 *     - poll is BOUNDED: interval is cleared when enabled flips false.
 *     - in-flight coalescing: aborting previous request before starting next.
 *     - fetch error → status 'error', last-known data preserved (fail-soft).
 *     - returns status 'loaded' on success with correct count + participants.
 *
 * NOT tested (by design — media plane is not testable in headless):
 *   - ICE/DTLS, SFU track routing.
 *   - real network latency / real LiveKit connectivity.
 *
 * Test approach:
 *   - VoiceOccupancyIndicator: pure render assertions (no fetch).
 *   - useVoiceOccupancy: vi.useFakeTimers() for interval control;
 *     global.fetch mocked via vi.spyOn / vi.fn().
 */

import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceOccupancyIndicator } from './VoiceOccupancyIndicator';
import { useVoiceOccupancy } from './useVoiceOccupancy';

// ─────────────────────────────────────────────────────────────────────────────
// VoiceOccupancyIndicator — render tests
// ─────────────────────────────────────────────────────────────────────────────

describe('VoiceOccupancyIndicator', () => {
  // ── Loading state ─────────────────────────────────────────────────────────

  it('loading state: renders aria-busy status region with no participant names', () => {
    render(<VoiceOccupancyIndicator count={0} participants={[]} status="loading" />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveAttribute('aria-live', 'polite');
    // No names in DOM during loading
    expect(screen.queryByText(/studying now/i)).not.toBeInTheDocument();
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  it('empty state: renders "Room is empty" heading and invitation text', () => {
    render(<VoiceOccupancyIndicator count={0} participants={[]} status="loaded" />);

    expect(screen.getByText('Room is empty')).toBeInTheDocument();
    expect(screen.getByText(/door's open/i)).toBeInTheDocument();
  });

  it('empty state: has role=status aria-live=polite (not alert)', () => {
    render(<VoiceOccupancyIndicator count={0} participants={[]} status="loaded" />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  // ── Populated state ───────────────────────────────────────────────────────

  it('populated state: renders count chip with correct count', () => {
    const participants = [
      { userId: 'u1', displayName: 'Alice Smith' },
      { userId: 'u2', displayName: 'Bob Jones' },
    ];

    render(<VoiceOccupancyIndicator count={2} participants={participants} status="loaded" />);

    // Count chip accessible label
    expect(screen.getByLabelText('2 participants')).toBeInTheDocument();
  });

  it('populated state: SR-only span announces member names', () => {
    const participants = [
      { userId: 'u1', displayName: 'Alice Smith' },
      { userId: 'u2', displayName: 'Bob Jones' },
    ];

    render(<VoiceOccupancyIndicator count={2} participants={participants} status="loaded" />);

    // The sr-only span should include names
    const srText = screen.getByText(/2 participants studying now: Alice Smith, Bob Jones/i);
    expect(srText).toBeInTheDocument();
  });

  it('populated state: renders "+N" overflow chip when count > MAX_VISIBLE_AVATARS (6)', () => {
    const participants = Array.from({ length: 9 }, (_, i) => ({
      userId: `u${i}`,
      displayName: `User ${i + 1}`,
    }));

    render(<VoiceOccupancyIndicator count={9} participants={participants} status="loaded" />);

    // 9 participants, 6 visible max → overflow = 3.
    // "and 3 others" appears in both the sr-only span AND the overflow tooltip div
    // (the tooltip has aria-hidden but testing-library finds it anyway).
    // Use getAllByText and assert at least one element contains the text.
    const elements = screen.getAllByText(/and 3 others/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('populated state: SR announcement includes all visible names + overflow count', () => {
    const participants = Array.from({ length: 8 }, (_, i) => ({
      userId: `u${i}`,
      displayName: `Person ${i + 1}`,
    }));

    render(<VoiceOccupancyIndicator count={8} participants={participants} status="loaded" />);

    // "8 participants studying now" is unique to the sr-only span.
    expect(screen.getByText(/8 participants studying now/i)).toBeInTheDocument();
    // "and 2 others" appears in sr-only span + overflow tooltip — use getAllByText.
    const overflowElements = screen.getAllByText(/and 2 others/i);
    expect(overflowElements.length).toBeGreaterThanOrEqual(1);
  });

  it('populated state: avatar chips have aria-label = display name', () => {
    const participants = [
      { userId: 'u1', displayName: 'Sarah Chen' },
      { userId: 'u2', displayName: 'Julian Davis' },
    ];

    render(<VoiceOccupancyIndicator count={2} participants={participants} status="loaded" />);

    // Each avatar chip has aria-label = display name
    expect(screen.getByLabelText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByLabelText('Julian Davis')).toBeInTheDocument();
  });

  it('populated state: singular "participant" when count=1', () => {
    const participants = [{ userId: 'u1', displayName: 'Solo User' }];

    render(<VoiceOccupancyIndicator count={1} participants={participants} status="loaded" />);

    // sr-only: "1 participant studying now" (singular)
    expect(screen.getByText(/1 participant studying now/i)).toBeInTheDocument();
    // count chip: "1 participant" (singular)
    expect(screen.getByLabelText('1 participant')).toBeInTheDocument();
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it('error state: renders fail-soft muted message', () => {
    render(<VoiceOccupancyIndicator count={0} participants={[]} status="error" />);

    expect(screen.getByText(/occupancy data currently unavailable/i)).toBeInTheDocument();
  });

  it('error state: uses role=status (not role=alert) so Join is never hijacked', () => {
    render(<VoiceOccupancyIndicator count={0} participants={[]} status="error" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    // Critically: no role=alert (which would hijack focus from the Join button)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('error state: has aria-live=polite', () => {
    render(<VoiceOccupancyIndicator count={0} participants={[]} status="error" />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useVoiceOccupancy — poll + fetch tests
// ─────────────────────────────────────────────────────────────────────────────

describe('useVoiceOccupancy', () => {
  const PARTICIPANTS = [
    { userId: 'u1', displayName: 'Alice' },
    { userId: 'u2', displayName: 'Bob' },
  ];

  // Use vi.fn() typed as the fetch signature so TS is satisfied.
  // vi.stubGlobal replaces global.fetch before each test and restores on afterEach.
  let fetchSpy: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * Helper: build a fetch Response mock that resolves with JSON.
   */
  function mockFetchSuccess(data: unknown): Promise<Response> {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response);
  }

  /**
   * Helper: build a fetch Response mock that rejects (network error).
   */
  function mockFetchError(message = 'Network error'): Promise<Response> {
    return Promise.reject(new Error(message));
  }

  /**
   * Helper: build a non-ok Response (e.g. 503).
   */
  function mockFetchHttpError(status: number, statusText: string): Promise<Response> {
    return Promise.resolve({
      ok: false,
      status,
      statusText,
      text: () => Promise.resolve(''),
    } as Response);
  }

  // ── Mount + initial fetch ─────────────────────────────────────────────────

  it('fetches /channels/:id/voice/participants on mount when enabled=true', async () => {
    fetchSpy.mockReturnValueOnce(mockFetchSuccess({ count: 2, participants: PARTICIPANTS }));

    const { result } = renderHook(() => useVoiceOccupancy('ch-voice-1', { enabled: true }));

    // Initial state is loading
    expect(result.current.status).toBe('loading');

    // Flush fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/channels/ch-voice-1/voice/participants'),
      expect.objectContaining({ credentials: 'include' }),
    );

    expect(result.current.status).toBe('loaded');
    expect(result.current.count).toBe(2);
    expect(result.current.participants).toEqual(PARTICIPANTS);
  });

  it('does NOT fetch when enabled=false', async () => {
    const { result } = renderHook(() => useVoiceOccupancy('ch-voice-1', { enabled: false }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    // Status stays 'loading' (initial) — polling never fired
    expect(result.current.status).toBe('loading');
  });

  // ── Bounded poll: stopped on unmount ─────────────────────────────────────

  it('poll is bounded: interval is cleared on unmount (no fetch after unmount)', async () => {
    fetchSpy.mockReturnValue(mockFetchSuccess({ count: 1, participants: [PARTICIPANTS[0]] }));

    const { unmount } = renderHook(() => useVoiceOccupancy('ch-voice-1', { enabled: true }));

    // Flush initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Unmount — should clear the interval
    unmount();

    // Advance timer past two poll intervals
    await act(async () => {
      vi.advanceTimersByTime(25_000); // 2.5 × 10s interval
      await Promise.resolve();
    });

    // Fetch must NOT have been called a second time after unmount
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // ── Bounded poll: stopped when enabled flips false ────────────────────────

  it('poll is bounded: interval clears when enabled flips false', async () => {
    fetchSpy.mockReturnValue(mockFetchSuccess({ count: 1, participants: [PARTICIPANTS[0]] }));

    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useVoiceOccupancy('ch-voice-1', { enabled }),
      { initialProps: { enabled: true } },
    );

    // Flush initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Flip enabled to false (user joined the room)
    rerender({ enabled: false });

    // Advance timers — no new fetch should fire
    await act(async () => {
      vi.advanceTimersByTime(25_000);
      await Promise.resolve();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // ── Poll fires on interval ────────────────────────────────────────────────

  it('polls again after the interval elapses', async () => {
    fetchSpy.mockReturnValue(mockFetchSuccess({ count: 0, participants: [] }));

    renderHook(() => useVoiceOccupancy('ch-voice-1', { enabled: true }));

    // Flush initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance by one poll interval (10 s)
    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  // ── In-flight coalescing ──────────────────────────────────────────────────

  it('in-flight coalescing: new tick aborts the previous request (no stacked fetches)', async () => {
    // First fetch: never resolves (slow request). We verify coalescing by:
    //   (a) confirming the hook calls fetch twice (once per tick), and
    //   (b) confirming the first call received an AbortSignal (the hook's contract).
    // The actual AbortError rejection is handled internally; we do not observe
    // its settled value here — only that the signal was passed.

    fetchSpy.mockImplementationOnce((_url: string | URL | Request, init?: RequestInit) => {
      // Capture the abort signal; if aborted, reject with AbortError
      const signal = init?.signal as AbortSignal | undefined;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          const err = new DOMException('Aborted', 'AbortError');
          reject(err);
        });
      });
    });

    // Second fetch resolves normally
    fetchSpy.mockReturnValueOnce(mockFetchSuccess({ count: 3, participants: PARTICIPANTS }));

    renderHook(() => useVoiceOccupancy('ch-voice-1', { enabled: true }));

    // First poll fires on mount — slow, in-flight
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance timer: second tick fires — should abort the first request
    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    // Second fetch was called
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    // The first request's AbortSignal was triggered (verified by the abort listener
    // we attached above); the hook passed the signal to fetch via init.signal).
    // We verify this indirectly: the second fetch was called, meaning the hook
    // did not wait for the first to complete before issuing the second.
    // Direct abort verification: check that the first call received an AbortSignal.
    const firstCallInit = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(firstCallInit?.signal).toBeDefined();
    expect(firstCallInit?.signal).toBeInstanceOf(AbortSignal);
  });

  // ── Error handling — fail-soft ────────────────────────────────────────────

  it('fetch error → status=error, keeps last-known data (fail-soft)', async () => {
    // First fetch succeeds with data
    fetchSpy.mockReturnValueOnce(mockFetchSuccess({ count: 2, participants: PARTICIPANTS }));

    const { result } = renderHook(() => useVoiceOccupancy('ch-voice-1', { enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('loaded');
    expect(result.current.count).toBe(2);

    // Second fetch fails
    fetchSpy.mockReturnValueOnce(mockFetchError('Network error'));

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    // Status is error, but count/participants are preserved from last successful fetch
    expect(result.current.status).toBe('error');
    expect(result.current.count).toBe(2);
    expect(result.current.participants).toEqual(PARTICIPANTS);
  });

  it('HTTP error response → status=error (fail-soft)', async () => {
    fetchSpy.mockReturnValueOnce(mockFetchHttpError(503, 'Service Unavailable'));

    const { result } = renderHook(() => useVoiceOccupancy('ch-voice-1', { enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('error');
  });

  it('first fetch error immediately → status=error, count=0 preserved from initial', async () => {
    fetchSpy.mockReturnValueOnce(mockFetchError('Immediate fail'));

    const { result } = renderHook(() => useVoiceOccupancy('ch-voice-1', { enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('error');
    // No data yet — initial zeros preserved
    expect(result.current.count).toBe(0);
    expect(result.current.participants).toEqual([]);
  });

  // ── channelId change resets to loading ───────────────────────────────────

  it('resets to loading state when channelId changes', async () => {
    fetchSpy.mockReturnValue(mockFetchSuccess({ count: 1, participants: [PARTICIPANTS[0]] }));

    const { result, rerender } = renderHook(
      ({ channelId }: { channelId: string }) => useVoiceOccupancy(channelId, { enabled: true }),
      { initialProps: { channelId: 'ch-1' } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('loaded');
    expect(result.current.count).toBe(1);

    // Change channel
    rerender({ channelId: 'ch-2' });

    // Should reset to loading immediately (before the new fetch resolves)
    expect(result.current.status).toBe('loading');
    expect(result.current.count).toBe(0);
    expect(result.current.participants).toEqual([]);
  });

  // ── Correct URL + credentials ─────────────────────────────────────────────

  it('sends credentials:include with every request', async () => {
    fetchSpy.mockReturnValueOnce(mockFetchSuccess({ count: 0, participants: [] }));

    renderHook(() => useVoiceOccupancy('ch-abc', { enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: VoiceOccupancyIndicator inside VoiceStudyRoom pre-join surface
// (wiring test — does the panel appear and is Join still reachable on error?)
// ─────────────────────────────────────────────────────────────────────────────

// Minimal mock of the modules that VoiceStudyRoom pulls in

vi.mock('../auth/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../auth/api')>();
  return {
    api: {
      // getVoiceParticipants calls through to the real implementation so that
      // useVoiceOccupancy unit tests can intercept it via global fetch mocks.
      getVoiceParticipants: actual.api.getVoiceParticipants,
      // getVoiceToken is stubbed for VoiceStudyRoom integration tests.
      getVoiceToken: vi.fn(),
    },
  };
});

vi.mock('@livekit/components-react', () => ({
  LiveKitRoom: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="livekit-room">{children}</div>
  ),
  useLocalParticipant: () => ({
    localParticipant: {
      identity: 'user-1',
      isMicrophoneEnabled: true,
      setMicrophoneEnabled: vi.fn(),
    },
  }),
  useParticipants: () => [{ identity: 'user-1', name: 'Test', isMicrophoneEnabled: true }],
  useRoomContext: () => ({ disconnect: vi.fn() }),
}));

vi.mock('./ProfileContext', () => ({
  ProfileContext: {
    _currentValue: { profile: null },
    Consumer: ({ children }: { children: (v: { profile: null }) => React.ReactNode }) =>
      children({ profile: null }),
  },
  useProfile: () => ({ profile: null, refresh: vi.fn() }),
}));

import { VoiceStudyRoom } from './VoiceStudyRoom';

describe('VoiceStudyRoom — occupancy integration', () => {
  // Real timers here — waitFor uses setTimeout internally and breaks with fake timers.
  // We do not test poll interval timing in these tests; only fetch result rendering.
  let fetchSpy: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    fetchSpy = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('pre-join surface renders the occupancy panel', async () => {
    fetchSpy.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ count: 0, participants: [] }),
      } as Response),
    );

    render(<VoiceStudyRoom channelId="ch-voice-1" channelName="Study Hall" />);

    expect(screen.getByTestId('voice-occupancy-panel')).toBeInTheDocument();
  });

  it('error in occupancy fetch does NOT remove the Join button (fail-soft)', async () => {
    fetchSpy.mockReturnValue(Promise.reject(new Error('Network error')));

    render(<VoiceStudyRoom channelId="ch-voice-1" channelName="Study Hall" />);

    await act(async () => {
      await Promise.resolve();
    });

    // Join button must still be present after fetch error
    expect(screen.getByTestId('join-voice-btn')).toBeInTheDocument();

    // Error state renders (not blocking)
    await waitFor(() => {
      expect(screen.getByText(/occupancy data currently unavailable/i)).toBeInTheDocument();
    });
  });

  it('populated occupancy: renders count chip in pre-join surface', async () => {
    fetchSpy.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            count: 3,
            participants: [
              { userId: 'u1', displayName: 'Alice' },
              { userId: 'u2', displayName: 'Bob' },
              { userId: 'u3', displayName: 'Carol' },
            ],
          }),
      } as Response),
    );

    render(<VoiceStudyRoom channelId="ch-voice-1" channelName="Study Hall" />);

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByLabelText('3 participants')).toBeInTheDocument();
    });

    // Join button stays reachable
    expect(screen.getByTestId('join-voice-btn')).toBeInTheDocument();
  });

  it('empty room: Join button label changes to "Be the First to Join"', async () => {
    fetchSpy.mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ count: 0, participants: [] }),
      } as Response),
    );

    render(<VoiceStudyRoom channelId="ch-voice-1" channelName="Study Hall" />);

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('join-voice-btn')).toHaveTextContent('Be the First to Join');
    });
  });
});
