/**
 * StudyTimerWidget — shared Pomodoro study timer for the server view.
 *
 * wave-49 M8 task c3daf6d3 (widget) + client half of cb81bf03 / 832b83b7
 * (socket subscription, presence roster, reconnect reconciliation).
 *
 * States: idle / running-work / running-break / paused / loading / error.
 *
 * Countdown anti-drift: the client derives displaySeconds from the authoritative
 * endsAt ISO timestamp supplied by the server, NOT from a client-authored counter.
 * A 1-second setInterval recomputes Math.max(0, floor((endsAt - now) / 1000))
 * on each tick. This means short clock drifts between clients self-correct every
 * second against the same absolute anchor.
 *
 * Presence roster: populated exclusively from study-timer:presence socket events
 * ({viewers, count}) — distinct from online-presence (presenceSocket.ts) which
 * tracks online/offline status. Timer roster shows who is currently viewing the
 * study timer widget (ph-timer badge, emerald/amber rings per phase). Empty
 * roster shows no roster section.
 *
 * Socket lifecycle:
 *   mount  → joinTimerRoom(serverId) — gateway adds socket to timer presence room,
 *             emits study-timer:presence with updated count, and on (re)join emits
 *             study-timer:update with current authoritative state for reconciliation.
 *   unmount → leaveTimerRoom(serverId) — gateway removes socket from roster.
 *   reconnect → studyTimerSocket.ts re-emits join_timer_room automatically.
 *
 * D-3 implementation notes applied:
 *   - .btn transition uses real CSS transition props (via Tailwind transition-colors);
 *     NOT the invalid "transition-colors 150ms ease" CSS value from the HTML prototype.
 *   - slim-bar (<1024px): 2px emerald/amber left border via .timer-phase-work/break CSS.
 *   - paused badge: aria-atomic="true".
 *   - phase pill: role="status" aria-live="polite" aria-atomic="true".
 *   - prefers-reduced-motion: sh-timer-colon animation disabled by CSS.
 *   - decorative header icons (channel header) are not timer controls — timer controls
 *     are limited to the widget's own Start/Pause/Resume/Reset buttons.
 */

import type { StudyTimer, StudyTimerPresenceEvent } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import {
  ArrowCounterClockwiseIcon,
  CoffeeIcon,
  PauseFillIcon,
  PlayFillIcon,
  SpinnerIcon,
  TimerFillIcon,
  UsersIcon,
  WarningCircleIcon,
} from './icons';
import {
  joinTimerRoom,
  leaveTimerRoom,
  onStudyTimerPresence,
  onStudyTimerUpdate,
} from './studyTimerSocket';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RosterState = Pick<StudyTimerPresenceEvent, 'viewers' | 'count'>;

// ---------------------------------------------------------------------------
// Helper: compute display seconds from authoritative timer DTO (anti-drift)
// ---------------------------------------------------------------------------

/**
 * Derive display seconds from the server-authoritative timer DTO.
 *
 * Running: count down to endsAt (recomputed on every 1s tick — anti-drift).
 * Paused:  show frozen remainingMs (server-computed at pause time).
 * Idle:    show full default duration for the current phase (25:00 / 5:00).
 *
 * Never sets its own countdown anchor — always derived from endsAt.
 */
function computeDisplaySeconds(timer: StudyTimer | null): number {
  if (!timer || timer.runState === 'idle') {
    // Idle: show full work or break duration
    return (timer?.phase ?? 'work') === 'work' ? 25 * 60 : 5 * 60;
  }
  if (timer.runState === 'paused') {
    return Math.floor(timer.remainingMs / 1000);
  }
  // running — derive from endsAt (anti-drift)
  if (timer.endsAt) {
    return Math.max(0, Math.floor((new Date(timer.endsAt).getTime() - Date.now()) / 1000));
  }
  // fallback (should not occur in well-formed running DTO)
  return Math.floor(timer.remainingMs / 1000);
}

/** Format seconds to "mm:ss" display string. */
function formatTime(totalSeconds: number): { mm: string; ss: string } {
  const mm = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const ss = (totalSeconds % 60).toString().padStart(2, '0');
  return { mm, ss };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Loading skeleton — matches design §06. */
function TimerSkeleton() {
  return (
    <div
      className="w-full rounded-lg p-4 flex items-center justify-between gap-4"
      style={{
        backgroundColor: '#121214',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      data-testid="timer-skeleton"
    >
      <div className="flex items-center gap-4">
        <div className="sh-skeleton w-20 h-8 rounded" />
        <div className="sh-skeleton w-14 h-5 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <div className="sh-skeleton w-20 h-8 rounded-md" />
        <div className="sh-skeleton w-8 h-8 rounded-md" />
      </div>
    </div>
  );
}

/** Error state — matches design §07. */
function TimerError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="w-full rounded-lg p-4 flex items-center gap-4"
      style={{
        backgroundColor: 'rgba(239,68,68,0.05)',
        border: '1px solid rgba(239,68,68,0.3)',
      }}
      data-testid="timer-error"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
      >
        <WarningCircleIcon size={20} style={{ color: '#ef4444' }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
          Timer sync disconnected
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Lost connection to the study server. Local session paused.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95"
        style={{
          backgroundColor: 'rgba(239,68,68,0.1)',
          color: '#f87171',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        Retry Connection
      </button>
    </div>
  );
}

/** Phase pill — emerald for Work, amber for Break. */
function PhasePill({ phase }: { phase: 'work' | 'break' }) {
  const isWork = phase === 'work';
  const accent = isWork ? '#10b981' : '#f59e0b';
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex items-center gap-1.5 px-3 py-1 rounded-full relative overflow-hidden shrink-0"
      style={{
        backgroundColor: '#121214',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      data-testid="phase-pill"
    >
      {/* Subtle phase tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: accent, opacity: 0.1 }}
        aria-hidden="true"
      />
      {isWork ? (
        <div
          className="w-1.5 h-1.5 rounded-full relative z-10 shrink-0"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        />
      ) : (
        <CoffeeIcon size={12} className="relative z-10 shrink-0" style={{ color: accent }} />
      )}
      <span
        className="text-xs font-medium tracking-wide uppercase relative z-10"
        style={{ color: 'rgba(255,255,255,0.92)' }}
      >
        {isWork ? 'Focus' : 'Break'}
      </span>
    </div>
  );
}

/** Presence roster — "N studying" + avatar cluster. */
function PresenceRoster({
  roster,
  phase,
}: {
  roster: RosterState;
  phase: 'work' | 'break';
}) {
  if (roster.count === 0) return null;

  const accent = phase === 'work' ? '#10b981' : '#f59e0b';
  const MAX_SHOWN = 3;
  const shown = roster.viewers.slice(0, MAX_SHOWN);
  const overflow = roster.count - shown.length;

  return (
    <div
      className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l pt-3 lg:pt-0 lg:pl-5 shrink-0"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      data-testid="presence-roster"
    >
      <div className="flex flex-col items-end">
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
          {roster.count} studying
        </span>
        <span className="text-[10px]" style={{ color: accent }}>
          Live sync
        </span>
      </div>

      {/* Avatar cluster */}
      <div
        className="flex items-center -space-x-2.5"
        aria-label={`${roster.count} members studying`}
      >
        {shown.map((viewer, i) => {
          const initials = viewer.displayName.charAt(0).toUpperCase();
          return (
            <div
              key={viewer.userId}
              className="relative cursor-default"
              style={{ zIndex: MAX_SHOWN - i }}
            >
              {/* Avatar circle */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center relative z-10 overflow-hidden border-2"
                style={{
                  borderColor: accent,
                  outline: '2px solid #1c1c1f',
                  outlineOffset: '-1px',
                  backgroundColor: '#27272a',
                }}
                title={viewer.displayName}
              >
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  {initials}
                </span>
              </div>
              {/* Timer badge — distinct from online-presence dot */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center z-20"
                style={{ backgroundColor: '#121214', outline: '2px solid #1c1c1f' }}
                aria-hidden="true"
              >
                <TimerFillIcon size={8} style={{ color: accent }} />
              </div>
            </div>
          );
        })}

        {overflow > 0 && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center relative z-0"
            style={{
              backgroundColor: '#121214',
              border: '1px solid rgba(255,255,255,0.06)',
              outline: '2px solid #1c1c1f',
            }}
          >
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
              +{overflow}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

type Props = {
  serverId: string;
};

export function StudyTimerWidget({ serverId }: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [timer, setTimer] = useState<StudyTimer | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(25 * 60);
  const [roster, setRoster] = useState<RosterState | null>(null);

  // Stable mounted guard for async control handlers
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  const fetchTimer = useCallback(() => {
    setLoadingInitial(true);
    setError(false);
    api
      .getStudyTimer(serverId)
      .then((t) => {
        if (!mountedRef.current) return;
        setTimer(t);
        setLoadingInitial(false);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setError(true);
        setLoadingInitial(false);
      });
  }, [serverId]);

  useEffect(() => {
    fetchTimer();
  }, [fetchTimer]);

  // ── Socket: join room + subscribe to update / presence events ──────────────
  useEffect(() => {
    joinTimerRoom(serverId);

    const unsubUpdate = onStudyTimerUpdate((event) => {
      if (event.serverId !== serverId) return;
      setTimer(event.timer);
      setIsPending(false);
      setLoadingInitial(false);
      setError(false);
    });

    const unsubPresence = onStudyTimerPresence((event) => {
      if (event.serverId !== serverId) return;
      setRoster({ viewers: event.viewers, count: event.count });
    });

    return () => {
      leaveTimerRoom(serverId);
      unsubUpdate();
      unsubPresence();
    };
  }, [serverId]);

  // ── Countdown: 1-second tick to endsAt (anti-drift) ───────────────────────
  useEffect(() => {
    // computeSeconds is defined inside the effect so it captures `timer` from
    // the closure — avoids stale closure on interval ticks.
    const computeSeconds = (): number => computeDisplaySeconds(timer);

    setDisplaySeconds(computeSeconds());

    // Only tick when running; paused/idle use static remainingMs or default.
    if (!timer || timer.runState !== 'running') return;

    const id = setInterval(() => {
      setDisplaySeconds(computeSeconds());
    }, 1000);

    return () => clearInterval(id);
  }, [timer]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const t = await api.startStudyTimer(serverId);
      if (mountedRef.current) setTimer(t);
    } catch {
      // Silent: socket broadcast will reconcile authoritative state
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }, [serverId, isPending]);

  const handlePause = useCallback(async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const t = await api.pauseStudyTimer(serverId);
      if (mountedRef.current) setTimer(t);
    } catch {
      // Silent
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }, [serverId, isPending]);

  const handleResume = useCallback(async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const t = await api.resumeStudyTimer(serverId);
      if (mountedRef.current) setTimer(t);
    } catch {
      // Silent
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }, [serverId, isPending]);

  const handleReset = useCallback(async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const t = await api.resetStudyTimer(serverId);
      if (mountedRef.current) setTimer(t);
    } catch {
      // Silent
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }, [serverId, isPending]);

  // ── Derived display values ─────────────────────────────────────────────────
  const runState = timer?.runState ?? 'idle';
  const phase = timer?.phase ?? 'work';
  const isWork = phase === 'work';
  const isRunning = runState === 'running';
  const isPaused = runState === 'paused';
  const isIdle = runState === 'idle';
  const accent = isWork ? '#10b981' : '#f59e0b';

  const { mm, ss } = formatTime(displaySeconds);

  // ── Render: loading / error ────────────────────────────────────────────────
  if (loadingInitial) return <TimerSkeleton />;
  if (error) return <TimerError onRetry={fetchTimer} />;

  // ── Render: full widget ────────────────────────────────────────────────────

  // The widget adapts responsively:
  //   < 1024px: stacked column layout + 2px left phase border (slim-bar indicator)
  //   ≥ 1024px: side-by-side row layout, no left border
  // Phase border classes (.timer-phase-work / .timer-phase-break) are defined in
  // globals.css with @media(min-width:1024px) { border-left: none }.
  const phaseClass = !isIdle ? (isWork ? 'timer-phase-work' : 'timer-phase-break') : '';

  return (
    <div
      role="region"
      aria-label="Shared Study Timer"
      className={`w-full relative overflow-hidden rounded-lg ${phaseClass}`}
      style={{
        backgroundColor: '#1c1c1f',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
      data-testid="study-timer-widget"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:px-5 lg:py-4 gap-4">
        {/* ── Left: countdown + phase pill ── */}
        <div className="flex items-center gap-4">
          {/* Hero countdown — tabular-nums, derives from endsAt */}
          <div
            className={`font-mono font-semibold leading-none flex items-center text-[32px] lg:text-[40px] ${isIdle ? '' : ''}`}
            style={{
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              color: isIdle ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.92)',
              opacity: isPaused ? 0.7 : 1,
            }}
            aria-label={`${mm} minutes ${ss} seconds remaining`}
            data-testid="timer-display"
          >
            {mm}
            <span
              className={isRunning ? 'sh-timer-colon' : ''}
              style={{ color: 'rgba(255,255,255,0.6)', paddingRight: '1px' }}
              aria-hidden="true"
            >
              :
            </span>
            {ss}
          </div>

          {/* Phase pill (idle: descriptive text, running/paused: pill) */}
          {isIdle ? (
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Start a focus session
            </span>
          ) : (
            <PhasePill phase={phase} />
          )}

          {/* Paused badge */}
          {isPaused && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase"
              style={{
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              data-testid="paused-badge"
            >
              Paused
            </div>
          )}
        </div>

        {/* ── Middle: controls ── */}
        <div className="flex items-center gap-2">
          {isIdle && (
            <button
              type="button"
              onClick={handleStart}
              disabled={isPending}
              aria-label="Start session"
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-md text-sm font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{
                backgroundColor: '#10b981',
                color: '#fff',
                border: '1px solid transparent',
              }}
              data-testid="btn-start"
            >
              {isPending ? (
                <SpinnerIcon size={14} className="sh-animate-spin" />
              ) : (
                <PlayFillIcon size={14} />
              )}
              Start
            </button>
          )}

          {isRunning && (
            <>
              <button
                type="button"
                onClick={handlePause}
                disabled={isPending}
                aria-label="Pause session"
                className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-md text-sm font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{
                  backgroundColor: '#27272a',
                  color: 'rgba(255,255,255,0.92)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                data-testid="btn-pause"
              >
                {isPending ? (
                  <SpinnerIcon size={14} className="sh-animate-spin" />
                ) : (
                  <PauseFillIcon size={14} />
                )}
                Pause
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                aria-label="Reset timer"
                className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-md transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                data-testid="btn-reset"
              >
                <ArrowCounterClockwiseIcon size={16} />
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                type="button"
                onClick={handleResume}
                disabled={isPending}
                aria-label="Resume session"
                className="inline-flex items-center gap-1.5 h-[28px] px-2 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex-1"
                style={{
                  backgroundColor: '#27272a',
                  color: 'rgba(255,255,255,0.92)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                data-testid="btn-resume"
              >
                {isPending ? (
                  <SpinnerIcon size={12} className="sh-animate-spin" />
                ) : (
                  <PlayFillIcon size={12} />
                )}
                Resume
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                aria-label="Reset timer"
                className="inline-flex items-center gap-1.5 h-[28px] px-2 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex-1"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                data-testid="btn-reset-paused"
              >
                Reset
              </button>
            </>
          )}
        </div>

        {/* ── Right: presence roster ── */}
        {roster && roster.count > 0 ? (
          <PresenceRoster roster={roster} phase={phase} />
        ) : (
          /* Empty roster placeholder — "N studying" hides, show minimal indicator */
          !isIdle && (
            <div
              className="flex items-center gap-1.5 border-t lg:border-t-0 lg:border-l pt-3 lg:pt-0 lg:pl-5 shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <UsersIcon size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                0 studying
              </span>
            </div>
          )
        )}
      </div>

      {/* Phase accent line at top (decorative, not a control) */}
      {!isIdle && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
          style={{ backgroundColor: accent, opacity: 0.4 }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
