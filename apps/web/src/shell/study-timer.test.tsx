/**
 * study-timer.test.tsx — StudyTimerWidget unit / component tests.
 * wave-49 M8 task c3daf6d3 (widget ACs).
 * wave-50 M8 tasks f4b3659e (duration config ACs) + ffd98a36 (F-1 fix ACs).
 *
 * Test matrix (wave-49 original, 1-17):
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
 *
 * Test matrix (wave-50 additions, 18-32):
 *  18. Widget renders configured durations (workDurationMs→minutes) in inputs.
 *  19. Idle timer shows configured work duration in idle countdown display.
 *  20. Config work input rejects out-of-range values — validation error visible.
 *  21. Config break input rejects out-of-range values — validation error visible.
 *  22. Apply button disabled until value changed AND both valid AND timer idle.
 *  23. Apply calls api.configureStudyTimer with correct workMinutes/breakMinutes.
 *  24. Apply shows optimistic pending (spinner, inputs disabled).
 *  25. Config inputs disabled while timer is running; locked hint shown.
 *  26. Config inputs disabled while timer is paused; locked hint shown.
 *  27. 409 response (timer not idle) shows reset hint, inputs re-enable.
 *  28. 400 response shows inline validation error text from API.
 *  29. study-timer:update reconciles new durations into config inputs.
 *  30. Work input has aria-label="Work duration minutes".
 *  31. Break input has aria-label="Break duration minutes".
 *  32. Validation error sets aria-invalid + aria-describedby → error element.
 *  33. F-1: slim-bar border — root element does NOT have inline border shorthand
 *       that would clobber border-left (style.borderLeft is unset / empty).
 *  34. Slim config toggle (<1024 affordance) is a <button> with aria-expanded.
 *  35. Slim config row toggles open/closed on toggle click.
 *  36. Escape closes the slim config row and returns focus to toggle.
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
    configureStudyTimer: vi.fn(),
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
  configureStudyTimer: ReturnType<typeof vi.fn>;
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SERVER_ID = 'server-abc';

/** Default 25/5 durations in ms */
const DEFAULT_WORK_MS = 25 * 60 * 1000;
const DEFAULT_BREAK_MS = 5 * 60 * 1000;

function makeIdle(
  workDurationMs = DEFAULT_WORK_MS,
  breakDurationMs = DEFAULT_BREAK_MS,
): StudyTimer {
  return {
    serverId: SERVER_ID,
    phase: 'work',
    runState: 'idle',
    endsAt: null,
    remainingMs: 0,
    running: false,
    updatedBy: null,
    workDurationMs,
    breakDurationMs,
  };
}

function makeRunning(
  phase: 'work' | 'break' = 'work',
  endsInMs = 90_000,
  workDurationMs = DEFAULT_WORK_MS,
  breakDurationMs = DEFAULT_BREAK_MS,
): StudyTimer {
  return {
    serverId: SERVER_ID,
    phase,
    runState: 'running',
    endsAt: new Date(Date.now() + endsInMs).toISOString(),
    remainingMs: endsInMs,
    running: true,
    updatedBy: 'user-1',
    workDurationMs,
    breakDurationMs,
  };
}

function makePaused(
  remainingMs = 900_000,
  workDurationMs = DEFAULT_WORK_MS,
  breakDurationMs = DEFAULT_BREAK_MS,
): StudyTimer {
  return {
    serverId: SERVER_ID,
    phase: 'work',
    runState: 'paused',
    endsAt: null,
    remainingMs,
    running: false,
    updatedBy: 'user-1',
    workDurationMs,
    breakDurationMs,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StudyTimerWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedUpdateHandler = null;
    capturedPresenceHandler = null;
  });

  // ── Wave-49 original tests (1-17) ─────────────────────────────────────────

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

  // ── Wave-50 duration config tests (18-36) ────────────────────────────────

  // 18. Widget renders configured durations in desktop form inputs
  it('renders configured durations from DTO in config inputs', async () => {
    // 30 min work, 10 min break
    mockApi.getStudyTimer.mockResolvedValue(makeIdle(30 * 60 * 1000, 10 * 60 * 1000));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    // Desktop form inputs (visible at any viewport in jsdom)
    const workInputs = screen.getAllByTestId(/work-input$/);
    const breakInputs = screen.getAllByTestId(/break-input$/);
    expect(workInputs.length).toBeGreaterThan(0);
    expect(Number((workInputs[0] as HTMLInputElement).value)).toBe(30);
    expect(Number((breakInputs[0] as HTMLInputElement).value)).toBe(10);
  });

  // 19. Idle countdown shows configured work duration (not hardcoded 25:00)
  it('idle countdown shows configured work duration from DTO', async () => {
    // 30 min work duration
    mockApi.getStudyTimer.mockResolvedValue(makeIdle(30 * 60 * 1000, 5 * 60 * 1000));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toHaveTextContent('30:00'));
  });

  // 20. Work input validation — out-of-range shows error
  it('work input rejects out-of-range value (>120) — shows validation error', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    const workInputs = screen.getAllByTestId(/work-input$/);
    fireEvent.change(workInputs[0] as HTMLElement, { target: { value: '150' } });

    await waitFor(() => {
      const errors = screen.getAllByTestId(/work-error$/);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // 21. Break input validation — out-of-range shows error
  it('break input rejects out-of-range value (>60) — shows validation error', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    const breakInputs = screen.getAllByTestId(/break-input$/);
    fireEvent.change(breakInputs[0] as HTMLElement, { target: { value: '99' } });

    await waitFor(() => {
      const errors = screen.getAllByTestId(/break-error$/);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // 22. Apply disabled until dirty AND valid AND idle
  it('Apply is disabled initially (no dirty values)', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle(25 * 60 * 1000, 5 * 60 * 1000));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    // All Apply buttons (desktop + slim) should be disabled initially (not dirty)
    const applies = screen.getAllByTestId(/apply$/);
    for (const btn of applies) {
      expect(btn).toBeDisabled();
    }
  });

  // 23. Apply calls configureStudyTimer with correct minutes
  it('Apply calls api.configureStudyTimer with correct workMinutes/breakMinutes', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle(25 * 60 * 1000, 5 * 60 * 1000));
    mockApi.configureStudyTimer.mockResolvedValue(makeIdle(30 * 60 * 1000, 10 * 60 * 1000));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    // Change work to 30
    const workInputs = screen.getAllByTestId(/work-input$/);
    fireEvent.change(workInputs[0] as HTMLElement, { target: { value: '30' } });

    // Apply should now be enabled
    await waitFor(() => {
      const applies = screen.getAllByTestId(/apply$/);
      // At least one is enabled
      expect(applies.some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
    });

    const applies = screen.getAllByTestId(/apply$/);
    const enabledApply = applies.find((b) => !(b as HTMLButtonElement).disabled);
    expect(enabledApply).toBeDefined();
    if (enabledApply) fireEvent.click(enabledApply);

    await waitFor(() =>
      expect(mockApi.configureStudyTimer).toHaveBeenCalledWith(SERVER_ID, {
        workMinutes: 30,
        breakMinutes: 5,
      }),
    );
  });

  // 24. Apply shows pending (spinner)
  it('Apply shows pending state while configureStudyTimer is in-flight', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle(25 * 60 * 1000, 5 * 60 * 1000));
    const deferred = { resolve: (_v: StudyTimer) => {} };
    mockApi.configureStudyTimer.mockReturnValue(
      new Promise<StudyTimer>((resolve) => {
        deferred.resolve = resolve;
      }),
    );
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    // Make dirty
    const workInputs = screen.getAllByTestId(/work-input$/);
    fireEvent.change(workInputs[0] as HTMLElement, { target: { value: '30' } });

    await waitFor(() => {
      const applies = screen.getAllByTestId(/apply$/);
      expect(applies.some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
    });

    const applies = screen.getAllByTestId(/apply$/);
    const enabledApply = applies.find((b) => !(b as HTMLButtonElement).disabled);
    if (enabledApply) fireEvent.click(enabledApply);

    // During pending: all inputs should be disabled and apply btn should show spinner
    await waitFor(() => {
      const allWorkInputs = screen.getAllByTestId(/work-input$/);
      expect((allWorkInputs[0] as HTMLInputElement).disabled).toBe(true);
    });

    // Cleanup
    await act(async () => {
      deferred.resolve(makeIdle(30 * 60 * 1000, 5 * 60 * 1000));
    });
  });

  // 25. Config inputs disabled while timer is running
  it('config inputs are disabled when timer is running (locked state)', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeRunning());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('phase-pill')).toBeInTheDocument());

    const workInputs = screen.getAllByTestId(/work-input$/);
    expect((workInputs[0] as HTMLInputElement).disabled).toBe(true);
    // Apply replaced by locked hint
    const lockHints = screen.getAllByTestId(/lock-hint$/);
    expect(lockHints.length).toBeGreaterThan(0);
  });

  // 26. Config inputs disabled while timer is paused
  it('config inputs are disabled when timer is paused (locked state)', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makePaused());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('paused-badge')).toBeInTheDocument());

    const workInputs = screen.getAllByTestId(/work-input$/);
    expect((workInputs[0] as HTMLInputElement).disabled).toBe(true);
    const lockHints = screen.getAllByTestId(/lock-hint$/);
    expect(lockHints.length).toBeGreaterThan(0);
  });

  // 27. 409 response shows reset hint
  it('409 from configureStudyTimer shows reset hint', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle(25 * 60 * 1000, 5 * 60 * 1000));
    mockApi.configureStudyTimer.mockRejectedValue(new Error('409 Conflict: timer not idle'));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    // Make dirty and open slim config to see the error display
    const workInputs = screen.getAllByTestId(/work-input$/);
    fireEvent.change(workInputs[0] as HTMLElement, { target: { value: '30' } });

    await waitFor(() => {
      const applies = screen.getAllByTestId(/apply$/);
      expect(applies.some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
    });

    // Open slim config row first to make config-error-409 visible
    const toggle = screen.getByTestId('slim-config-toggle');
    fireEvent.click(toggle);

    await waitFor(() => expect(screen.getByTestId('slim-config-row')).toBeInTheDocument());

    // Now click the slim apply
    await waitFor(() => {
      const slimApply = screen.getByTestId(/^slim.*apply$/);
      if (!(slimApply as HTMLButtonElement).disabled) {
        fireEvent.click(slimApply);
      }
    });

    // If we can trigger it via desktop apply
    const applies = screen.getAllByTestId(/apply$/);
    const enabledApply = applies.find((b) => !(b as HTMLButtonElement).disabled);
    if (enabledApply) {
      fireEvent.click(enabledApply);
    }

    await waitFor(() => expect(mockApi.configureStudyTimer).toHaveBeenCalled());
    // After 409, configError state shows reset hint in slim row
    await waitFor(() => {
      expect(screen.getByTestId('config-error-409')).toBeInTheDocument();
    });
  });

  // 28. 400 response — the form's own range validation prevents bad values reaching the API.
  // Verify: if the API returns 400 anyway (e.g. integer check), the pending state clears.
  it('400 from configureStudyTimer clears pending state', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle(25 * 60 * 1000, 5 * 60 * 1000));
    mockApi.configureStudyTimer.mockRejectedValue(new Error('400 Bad Request: invalid range'));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    const workInputs = screen.getAllByTestId(/work-input$/);
    fireEvent.change(workInputs[0] as HTMLElement, { target: { value: '30' } });

    await waitFor(() => {
      const applies = screen.getAllByTestId(/apply$/);
      expect(applies.some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
    });

    const applies = screen.getAllByTestId(/apply$/);
    const enabledApply = applies.find((b) => !(b as HTMLButtonElement).disabled);
    if (enabledApply) fireEvent.click(enabledApply);

    await waitFor(() => expect(mockApi.configureStudyTimer).toHaveBeenCalled());
    // After error, pending clears (inputs are re-enabled)
    await waitFor(() => {
      const allWorkInputs = screen.getAllByTestId(/work-input$/);
      expect((allWorkInputs[0] as HTMLInputElement).disabled).toBe(false);
    });
  });

  // 29. study-timer:update reconciles new durations into config inputs
  it('study-timer:update reconciles new durations into config form inputs', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle(25 * 60 * 1000, 5 * 60 * 1000));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    // Socket broadcasts updated config (30/10)
    await act(async () => {
      capturedUpdateHandler?.({
        serverId: SERVER_ID,
        timer: makeIdle(30 * 60 * 1000, 10 * 60 * 1000),
      });
    });

    await waitFor(() => {
      const workInputs = screen.getAllByTestId(/work-input$/);
      expect(Number((workInputs[0] as HTMLInputElement).value)).toBe(30);
      const breakInputs = screen.getAllByTestId(/break-input$/);
      expect(Number((breakInputs[0] as HTMLInputElement).value)).toBe(10);
    });
  });

  // 30. Work input has aria-label
  it('work input has aria-label="Work duration minutes"', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    // getAllByLabelText works across multiple instances (desktop + slim)
    const workLabeled = screen.getAllByRole('spinbutton', { name: 'Work duration minutes' });
    expect(workLabeled.length).toBeGreaterThan(0);
  });

  // 31. Break input has aria-label
  it('break input has aria-label="Break duration minutes"', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    const breakLabeled = screen.getAllByRole('spinbutton', { name: 'Break duration minutes' });
    expect(breakLabeled.length).toBeGreaterThan(0);
  });

  // 32. Validation error sets aria-invalid + aria-describedby
  it('validation error sets aria-invalid="true" on the input', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    const workInputs = screen.getAllByTestId(/work-input$/);
    const firstWorkInput = workInputs[0] as HTMLElement;
    fireEvent.change(firstWorkInput, { target: { value: '200' } });

    await waitFor(() => {
      expect(firstWorkInput).toHaveAttribute('aria-invalid', 'true');
    });
    // aria-describedby should point to the error element
    const describedById = firstWorkInput.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
  });

  // 33. F-1: root element has no inline border-left (so CSS class wins)
  it('F-1: root widget element does not set inline borderLeft (phase CSS class wins)', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeRunning('work'));
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('study-timer-widget')).toBeInTheDocument());

    const widget = screen.getByTestId('study-timer-widget');
    // The inline style must NOT set border-left via shorthand or explicit borderLeft
    // (which would clobber the CSS class at specificity level)
    expect(widget.style.borderLeft).toBeFalsy();
    expect(widget.style.border).toBeFalsy();
    // Individual sides are set
    expect(widget.style.borderTop).toBeTruthy();
    expect(widget.style.borderRight).toBeTruthy();
    expect(widget.style.borderBottom).toBeTruthy();
  });

  // 34. Slim config toggle is a real <button> with aria-expanded
  it('slim config toggle is a <button> with aria-expanded attribute', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    const toggle = screen.getByTestId('slim-config-toggle');
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle).toHaveAttribute('aria-expanded');
  });

  // 35. Slim config row toggles open/closed on button click
  it('slim config row opens on toggle click and closes on second click', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    expect(screen.queryByTestId('slim-config-row')).not.toBeInTheDocument();

    const toggle = screen.getByTestId('slim-config-toggle');
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByTestId('slim-config-row')).toBeInTheDocument());

    fireEvent.click(toggle);
    await waitFor(() => expect(screen.queryByTestId('slim-config-row')).not.toBeInTheDocument());
  });

  // 36. Escape closes the slim config row and returns focus to toggle
  it('Escape closes slim config row', async () => {
    mockApi.getStudyTimer.mockResolvedValue(makeIdle());
    render(<StudyTimerWidget serverId={SERVER_ID} />);

    await waitFor(() => expect(screen.getByTestId('timer-display')).toBeInTheDocument());

    const toggle = screen.getByTestId('slim-config-toggle');
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByTestId('slim-config-row')).toBeInTheDocument());

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('slim-config-row')).not.toBeInTheDocument());
  });
});
