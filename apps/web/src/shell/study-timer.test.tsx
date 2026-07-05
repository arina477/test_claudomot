/**
 * study-timer.test.tsx — StudyTimerWidget unit / component tests.
 * wave-49 M8 task c3daf6d3 (widget ACs).
 *
 * Test matrix:
 *   1. Renders loading skeleton initially (before fetch resolves).
 *   2. Renders idle state from a StudyTimer DTO (runState: 'idle').
 *   3. Renders running-work state — emerald phase pill "Focus".
 *   4. Renders running-break state — amber phase pill "Break".
 *   5. Renders paused state — frozen countdown + Paused badge + Resume/Reset.
 *   6. Renders error state on fetch failure — retry button present.
 *   7. Countdown derives from endsAt (anti-drift): running timer with
 *      endsAt 90s in future → displaySeconds ≈ 90.
 *   8. Start click calls api.startStudyTimer + shows pending (buttons disabled).
 *   9. Pause click calls api.pauseStudyTimer.
 *  10. Resume click calls api.resumeStudyTimer.
 *  11. Reset click (from running) calls api.resetStudyTimer.
 *  12. study-timer:update reconciles state (socket event → state update).
 *  13. study-timer:presence updates roster ("N studying" appears).
 *  14. Phase pill has role="status" aria-live="polite" aria-atomic="true".
 *  15. Controls are <button> elements (a11y).
 *  16. Paused badge has aria-atomic="true".
 *  17. Error retry calls fetchTimer (api.getStudyTimer re-invoked).
 */

import type { StudyTimer, StudyTimerPresenceEvent, StudyTimerUpdateEvent } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock studyTimerSocket — capture event handlers ────────────────────────────

let capturedUpdateHandler: ((event: StudyTimerUpdateEvent) => void) | null = null;
let capturedPresenceHandler: ((event: StudyTimerPresenceEvent) => void) | null = null;

vi.mock('./studyTimerSocket', () => ({
  joinTimerRoom: vi.fn(),
  leaveTimerRoom: vi.fn(),
  onStudyTimerUpdate: vi.fn((handler: (event: StudyTimerUpdateEvent) => void) => {
    capturedUpdateHandler = handler;
    return () => {
      capturedUpdateHandler = null;
    };
  }),
  onStudyTimerPresence: vi.fn((handler: (event: StudyTimerPresenceEvent) => void) => {
    capturedPresenceHandler = handler;
    return () => {
      capturedPresenceHandler = null;
    };
  }),
}));

// ── Mock api ──────────────────────────────────────────────────────────────────

vi.mock('../auth/api', () => ({
  api: {
    getStudyTimer: vi.fn(),
    startStudyTimer: vi.fn(),
    pauseStudyTimer: vi.fn(),
    resumeStudyTimer: vi.fn(),
    resetStudyTimer: vi.fn(),
  },
}));

import { api } from '../auth/api';
import { StudyTimerWidget } from './StudyTimerWidget';

const mockApi = api as unknown as {
  getStudyTimer: ReturnType<typeof vi.fn>;
  startStudyTimer: ReturnType<typeof vi.fn>;
  pauseStudyTimer: ReturnType<typeof vi.fn>;
  resumeStudyTimer: ReturnType<typeof vi.fn>;
  resetStudyTimer: ReturnType<typeof vi.fn>;
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SERVER_ID = 'server-abc';

function makeIdle(): StudyTimer {
  return {
    serverId: SERVER_ID,
    phase: 'work',
    runState: 'idle',
    endsAt: null,
    remainingMs: 0,
    running: false,
    updatedBy: null,
  };
}

function makeRunning(phase: 'work' | 'break' = 'work', endsInMs = 90_000): StudyTimer {
  return {
    serverId: SERVER_ID,
    phase,
    runState: 'running',
    endsAt: new Date(Date.now() + endsInMs).toISOString(),
    remainingMs: endsInMs,
    running: true,
    updatedBy: 'user-1',
  };
}

function makePaused(remainingMs = 900_000): StudyTimer {
  return {
    serverId: SERVER_ID,
    phase: 'work',
    runState: 'paused',
    endsAt: null,
    remainingMs,
    running: false,
    updatedBy: 'user-1',
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StudyTimerWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedUpdateHandler = null;
    capturedPresenceHandler = null;
  });

  // 1. Loading skeleton
  it('renders loading skeleton before fetch resolves', () => {
    // Never-resolving promise keeps component in loading state
    mockApi.getStudyTimer.mockReturnValue(new Promise(() => {}));
    render(<StudyTimerWidget serverId={SERVER_ID} />);
    expect(screen.getByTestId('timer-skeleton')).toBeInTheDocument();
  });

  // 2. Idle state
  it('renders idle state with Start button and "25:00" display', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
    expect(screen.getByText('Start a focus session')).toBeInTheDocument();
    expect(screen.getByTestId('btn-start')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start session' })).toBeInTheDocument();
  });

  // 3. Running-work state
  it('renders running-work state with "Focus" phase pill (emerald)', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeRunning('work'));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('phase-pill')).toBeInTheDocument());

    expect(screen.getByTestId('phase-pill')).toHaveTextContent('Focus');
    expect(screen.getByTestId('btn-pause')).toBeInTheDocument();
    expect(screen.getByTestId('btn-reset')).toBeInTheDocument();
    // No Start button while running
    expect(screen.queryByTestId('btn-start')).not.toBeInTheDocument();
  });

  // 4. Running-break state (amber)
  it('renders running-break state with "Break" phase pill', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeRunning('break'));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('phase-pill')).toBeInTheDocument());

    expect(screen.getByTestId('phase-pill')).toHaveTextContent('Break');
  });

  // 5. Paused state
  it('renders paused state with frozen countdown, Paused badge, Resume + Reset', async () => {
    // 900_000ms = 900s = 15:00
    mockApi.getStudyTimer.mockResolvedValue(makePaused(900_000));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    // Two-phase wait:
    // 1. paused-badge appears on the first render triggered by setTimer(makePaused())
    //    + setLoadingInitial(false). Awaiting it ensures the paused branch controls
    //    (btn-resume, btn-reset-paused) are in the DOM.
    // 2. displaySeconds is updated by a separate useEffect([timer]) that fires after
    //    that render, triggering a second re-render. We wait for timer-display to
    //    show the paused frozen value before asserting its text content.
    //
    // Using waitFor for both assertions blocks until the full paused UI is committed,
    // eliminating the sync-after-partial-waitFor race that caused ~1/3 failures under
    // parallel full-suite load.
    await waitFor(() => {
      expect(screen.getByTestId('paused-badge')).toBeInTheDocument();
      expect(screen.getByTestId('timer-display')).toHaveTextContent('15:00');
    });

    expect(screen.getByTestId('timer-display')).toHaveTextContent('15:00');
    expect(screen.getByTestId('paused-badge')).toBeInTheDocument();
    expect(screen.getByTestId('btn-resume')).toBeInTheDocument();
    expect(screen.getByTestId('btn-reset-paused')).toBeInTheDocument();
    // No pause button while paused
    expect(screen.queryByTestId('btn-pause')).not.toBeInTheDocument();
  });

  // 6. Error state
  it('renders error state with retry button on fetch failure', async () => {
    mockApi.getStudyTimer.mockRejectedValue(new Error('Network error'));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-error')).toBeInTheDocument());

    const retryBtn = screen.getByRole('button', { name: 'Retry Connection' });
    expect(retryBtn).toBeInTheDocument();
  });

  // 7. Countdown derives from endsAt (anti-drift)
  it('countdown displays seconds derived from endsAt, not a local counter', async () => {
    // endsAt 90s in the future → should display ~01:30
    const timer = makeRunning('work', 90_000); // 90 seconds
    mockApi.getStudyTimer.mockResolvedValue(timer);
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    // Wait until the display shows a value derived from endsAt (~90s), not the
    // default 25:00 (1500s) initial state. The useEffect([timer]) fires after
    // the fetch resolves and updates displaySeconds from endsAt.
    await waitFor(() => {
      const display = screen.getByTestId('timer-display').textContent ?? '';
      const parts = display.split(':');
      const mm = Number.parseInt(parts[0] ?? '99', 10);
      const ss = Number.parseInt(parts[1] ?? '99', 10);
      const total = mm * 60 + ss;
      // Should be close to 90s (within 3s tolerance for test timing jitter)
      expect(total).toBeGreaterThanOrEqual(87);
      expect(total).toBeLessThanOrEqual(93);
    });
  });

  // 8. Start click → api called + pending (buttons disabled)
  it('Start click calls api.startStudyTimer and disables button during pending', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    // Never-resolving start to observe pending state
    const startDeferred = { resolve: (_v: StudyTimer) => {} };
    mockApi.startStudyTimer.mockReturnValue(
      new Promise<StudyTimer>((resolve) => {
        startDeferred.resolve = resolve;
      }),
    );

    render(<StudyTimerWidget serverId={SERVER_ID} />);
    await waitFor(() => expect(screen.getByTestId('btn-start')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('btn-start'));

    await waitFor(() => expect(mockApi.startStudyTimer).toHaveBeenCalledWith(SERVER_ID));

    // Button is disabled while pending
    expect(screen.getByTestId('btn-start')).toBeDisabled();

    // Resolve → pending clears
    await act(async () => {
      startDeferred.resolve(makeRunning());
    });

    await waitFor(() => expect(screen.queryByTestId('btn-start')).not.toBeInTheDocument());
  });

  // 9. Pause click
  it('Pause click calls api.pauseStudyTimer', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeRunning());
    mockApi.pauseStudyTimer.mockResolvedValue(makePaused());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('btn-pause')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-pause'));

    await waitFor(() => expect(mockApi.pauseStudyTimer).toHaveBeenCalledWith(SERVER_ID));
  });

  // 10. Resume click
  it('Resume click calls api.resumeStudyTimer', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makePaused());
    mockApi.resumeStudyTimer.mockResolvedValue(makeRunning());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('btn-resume')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-resume'));

    await waitFor(() => expect(mockApi.resumeStudyTimer).toHaveBeenCalledWith(SERVER_ID));
  });

  // 11. Reset click from running state
  it('Reset click calls api.resetStudyTimer', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeRunning());
    mockApi.resetStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('btn-reset')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('btn-reset'));

    await waitFor(() => expect(mockApi.resetStudyTimer).toHaveBeenCalledWith(SERVER_ID));
  });

  // 12. study-timer:update reconciles state
  it('study-timer:update event reconciles to authoritative state', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('btn-start')).toBeInTheDocument());

    // Simulate socket broadcast of running state
    await act(async () => {
      capturedUpdateHandler?.({
        serverId: SERVER_ID,
        timer: makeRunning('work'),
      });
    });

    // Widget now reflects running-work state
    await waitFor(() => expect(screen.getByTestId('phase-pill')).toHaveTextContent('Focus'));
    expect(screen.getByTestId('btn-pause')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-start')).not.toBeInTheDocument();
  });

  // 13. study-timer:presence updates roster
  it('study-timer:presence event updates "N studying" roster', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeRunning());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('btn-pause')).toBeInTheDocument());

    // Initially no roster
    expect(screen.queryByTestId('presence-roster')).not.toBeInTheDocument();

    // Simulate presence event with 3 viewers
    await act(async () => {
      capturedPresenceHandler?.({
        serverId: SERVER_ID,
        viewers: [
          { userId: 'u1', displayName: 'Alice' },
          { userId: 'u2', displayName: 'Bob' },
          { userId: 'u3', displayName: 'Carol' },
        ],
        count: 3,
      });
    });

    await waitFor(() => expect(screen.getByTestId('presence-roster')).toBeInTheDocument());
    expect(screen.getByText('3 studying')).toBeInTheDocument();
  });

  // 14. Phase pill has correct aria attributes
  it('phase pill has role="status" aria-live="polite" aria-atomic="true"', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeRunning('work'));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('phase-pill')).toBeInTheDocument());

    const pill = screen.getByTestId('phase-pill');
    expect(pill).toHaveAttribute('role', 'status');
    expect(pill).toHaveAttribute('aria-live', 'polite');
    expect(pill).toHaveAttribute('aria-atomic', 'true');
  });

  // 15. Controls are <button> elements (a11y)
  it('timer controls are accessible <button> elements', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('btn-start')).toBeInTheDocument());

    // Start button is a real <button>
    expect(screen.getByRole('button', { name: 'Start session' })).toBeInTheDocument();
  });

  // 16. Paused badge has aria-atomic="true"
  it('paused badge has aria-atomic="true"', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makePaused());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('paused-badge')).toBeInTheDocument());

    expect(screen.getByTestId('paused-badge')).toHaveAttribute('aria-atomic', 'true');
  });

  // 17. Error retry re-invokes getStudyTimer
  it('retry button after error re-invokes api.getStudyTimer', async () => {
    // First call fails
    mockApi.getStudyTimer
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(makeIdle());

    render(<StudyTimerWidget serverId={SERVER_ID} />);

    // Wait for error state
    await waitFor(() => expect(screen.getByTestId('timer-error')).toBeInTheDocument());

    const retryBtn = screen.getByRole('button', { name: 'Retry Connection' });

    await act(async () => {
      fireEvent.click(retryBtn);
    });

    // getStudyTimer called twice (initial + retry)
    await waitFor(() => expect(mockApi.getStudyTimer).toHaveBeenCalledTimes(2));
    // Should recover to idle state
    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());
  });
});
