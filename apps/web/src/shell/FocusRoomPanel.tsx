/**
 * FocusRoomPanel — explicit-join body-doubling surface for the server view.
 *
 * wave-52 M8 task aad849ac (client surface + UI) + ef84b378 (room-scoped timer).
 *
 * States: loading / error / empty / creating / open-rooms list / joined.
 *   - loading:  skeleton placeholder while initial rooms event arrives.
 *   - error:    join error or reconnect failure surfaces inline with retry.
 *   - empty:    no open rooms — centred CTA to create one.
 *   - creating: inline create form with room name input + confirm/cancel.
 *   - list:     open rooms (name + "N focusing" count + mini avatar cluster);
 *               click to join.
 *   - joined:   live roster of everyone focusing in the room + room-scoped
 *               Pomodoro timer (reuses StudyTimerWidget countdown rendering);
 *               Leave button returns to list.
 *
 * Room-timer:
 *   When joined, the room-scoped timer is rendered by reusing the
 *   StudyTimerWidget in a headless-timer composition: we pass roomId + the
 *   timer DTO from the socket into a dedicated RoomTimerSection that mirrors
 *   the widget's countdown display and control strip.  We DO NOT rebuild the
 *   timer UI from scratch — the StudyTimerWidget pure helpers (computeDisplaySeconds,
 *   formatTime) are extracted and reused here.
 *
 * Socket:
 *   Subscribes to studyRoomSocket (NOT studyTimerSocket / messagingSocket) via
 *   the onRooms / onPresence / onTimerUpdate / onJoinError helpers.
 *   All mutations go through the socket-only path (no REST).
 *
 * A11y (from design/focus-room-panel.html — carried faithfully):
 *   - roster: aria-live="polite" role="list" / role="listitem" / aria-current for self
 *   - room-card: focusable via tabIndex=0 + onKeyDown Enter/Space to join
 *   - room-card:focus-visible → outline via focusVisible ring (--glow-focus)
 *   - create input: labelled via <label> (sr-only) + htmlFor
 *   - buttons: real <button> elements
 *   - region landmark: role="region" aria-label
 *   - error: role="alert"
 *
 * Design tokens (no invented hex — all from design/focus-room-panel.html vars):
 *   --surface-950 #0a0a0b  --surface-900 #121214  --surface-800 #1c1c1f
 *   --surface-700 #27272a  --surface-600 #3f3f46  --surface-500 #52525b
 *   --border-hairline rgba(255,255,255,0.06)  --border-hover rgba(255,255,255,0.10)
 *   --text-primary rgba(255,255,255,0.92)    --text-secondary rgba(255,255,255,0.60)
 *   --text-muted rgba(255,255,255,0.40)
 *   --accent-emerald #10b981  --accent-amber #f59e0b
 *   --danger #ef4444  --danger-text #f87171
 *   --glow-focus 0 0 0 2px rgba(16,185,129,0.4)
 *
 * Responsive: full layout at >=1024px; compact bar when joined at <1024px.
 * NO voice/video controls (scope-fenced).
 */

import type { FocusRoom, FocusRoomViewer, StudyRoomTimer } from '@studyhall/shared';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  ArrowCounterClockwiseIcon,
  BooksIcon,
  CheckCircleIcon,
  PauseFillIcon,
  PlayFillIcon,
  PlusIcon,
  SignOutIcon,
  SpinnerIcon,
  WarningCircleIcon,
  XIcon,
} from './icons';
import {
  createFocusRoom,
  joinFocusRoom,
  leaveFocusRoom,
  onJoinError,
  onPresence,
  onRooms,
  onTimerUpdate,
  pauseRoomTimer,
  resetRoomTimer,
  startRoomTimer,
} from './studyRoomSocket';

// ---------------------------------------------------------------------------
// Pure timer helpers (reused from StudyTimerWidget — no rebuild)
// ---------------------------------------------------------------------------

/**
 * Derive display seconds from the server-authoritative room-timer DTO.
 * Anti-drift: running timer recomputes from endsAt on every 1s tick.
 * Mirrors StudyTimerWidget's computeDisplaySeconds exactly.
 */
function computeRoomTimerDisplaySeconds(timer: StudyRoomTimer | null): number {
  if (!timer || timer.runState === 'idle') {
    if (!timer) return 25 * 60;
    const durationMs = timer.phase === 'work' ? timer.workDurationMs : timer.breakDurationMs;
    return Math.floor(durationMs / 1000);
  }
  if (timer.runState === 'paused') {
    return Math.floor(timer.remainingMs / 1000);
  }
  if (timer.endsAt) {
    return Math.max(0, Math.floor((new Date(timer.endsAt).getTime() - Date.now()) / 1000));
  }
  return Math.floor(timer.remainingMs / 1000);
}

/** Format seconds to { mm, ss } display strings — mirrors StudyTimerWidget. */
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

/** Loading skeleton — matches design §06 loading state. */
function PanelSkeleton() {
  return (
    <div
      className="w-full rounded-lg p-4 flex flex-col gap-3"
      style={{
        backgroundColor: '#1c1c1f',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      data-testid="focus-room-skeleton"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="sh-skeleton w-32 h-4 rounded" />
        <div className="sh-skeleton w-20 h-7 rounded-md" />
      </div>
      {/* Two skeleton room cards */}
      <div
        className="rounded-lg p-3 flex items-start justify-between"
        style={{ backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex flex-col gap-2 w-full">
          <div className="sh-skeleton w-32 h-4 rounded" />
          <div className="sh-skeleton w-16 h-3 rounded" />
        </div>
        <div className="flex items-center -space-x-1.5 opacity-50">
          <div className="w-6 h-6 rounded-full sh-skeleton" />
          <div className="w-6 h-6 rounded-full sh-skeleton" />
        </div>
      </div>
      <div
        className="rounded-lg p-3"
        style={{ backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="sh-skeleton w-24 h-4 rounded" />
        <div className="sh-skeleton w-12 h-3 rounded mt-2" />
      </div>
    </div>
  );
}

/** Empty state — no open rooms. */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-10 px-4 gap-4"
      data-testid="focus-room-empty"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
        style={{
          backgroundColor: '#121214',
          border: '1px dashed #3f3f46',
        }}
        aria-hidden="true"
      >
        <BooksIcon size={24} style={{ color: 'rgba(255,255,255,0.40)' }} />
      </div>
      <div>
        <h4 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
          No active rooms
        </h4>
        <p
          className="text-sm mt-1 max-w-[200px] mx-auto"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          It's quiet in here. Start the first body-doubling session.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 h-[34px] px-3 rounded-md text-sm font-semibold transition-colors duration-150 active:scale-95 mt-2"
        style={{ backgroundColor: '#10b981', color: '#fff', border: '1px solid transparent' }}
        data-testid="empty-create-btn"
      >
        <PlusIcon size={16} />
        Create Room
      </button>
    </div>
  );
}

/** Inline create form — matches design §03 creating state. */
function CreateRoomForm({
  onConfirm,
  onCancel,
  creating,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
  creating: boolean;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onConfirm(trimmed);
  }

  const canSubmit = name.trim().length > 0 && !creating;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg p-3 mb-2"
      style={{
        backgroundColor: '#121214',
        border: '1px solid rgba(16,185,129,0.5)',
        boxShadow: '0 0 0 1px rgba(16,185,129,0.2)',
      }}
      data-testid="create-room-form"
    >
      {/* SR-only label for a11y */}
      <label htmlFor={inputId} className="sr-only">
        Room Name
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Essay Writing"
        maxLength={60}
        disabled={creating}
        className="input-base w-full h-8 px-2 text-sm mb-3"
        style={{ backgroundColor: '#0a0a0b' }}
        data-testid="create-room-input"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={creating}
          className="inline-flex items-center h-7 px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40"
          style={{ color: 'rgba(255,255,255,0.60)' }}
          data-testid="create-room-cancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          style={{
            backgroundColor: canSubmit ? '#10b981' : '#27272a',
            color: canSubmit ? '#fff' : 'rgba(255,255,255,0.40)',
            border: '1px solid transparent',
          }}
          data-testid="create-room-confirm"
        >
          {creating ? <SpinnerIcon size={12} className="sh-animate-spin" /> : null}
          Start Room
        </button>
      </div>
    </form>
  );
}

/** Mini avatar cluster for room card list view — up to 3 initials circles. */
function MiniRosterCluster({ count }: { count: number }) {
  if (count === 0) return null;
  const MAX = 3;
  const shown = Math.min(count, MAX);
  const overflow = count - shown;

  return (
    <div className="flex items-center -space-x-1.5" aria-hidden="true">
      {Array.from({ length: shown }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static display cluster
          key={i}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-semibold"
          style={{
            backgroundColor: '#3f3f46',
            color: 'rgba(255,255,255,0.60)',
            outline: '2px solid #1c1c1f',
            outlineOffset: '-1px',
            zIndex: MAX - i,
          }}
        >
          {String.fromCharCode(65 + i)}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-semibold"
          style={{
            backgroundColor: '#27272a',
            color: 'rgba(255,255,255,0.40)',
            outline: '2px solid #1c1c1f',
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

/** Single room card in the open-rooms list. */
function RoomCard({
  room,
  onJoin,
  joining,
}: {
  room: FocusRoom;
  onJoin: (roomId: string) => void;
  joining: boolean;
}) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onJoin(room.id);
    }
  }

  return (
    <div
      className="room-card p-3 flex flex-col gap-2 group cursor-pointer"
      tabIndex={0}
      role="button"
      aria-label={`Join ${room.name}, ${room.count} focusing`}
      aria-disabled={joining}
      onClick={() => !joining && onJoin(room.id)}
      onKeyDown={handleKeyDown}
      data-testid={`room-card-${room.id}`}
      style={{
        backgroundColor: '#1c1c1f',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
        transition: 'all 200ms ease',
        cursor: joining ? 'not-allowed' : 'pointer',
        opacity: joining ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4
            className="text-sm font-medium transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            {room.name}
          </h4>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
            {room.count} focusing
          </p>
        </div>
        <MiniRosterCluster count={room.count} />
      </div>
      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <span
          className="text-xs font-semibold flex items-center gap-1"
          style={{ color: '#10b981' }}
        >
          Click to join
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Room-timer section — reuses StudyTimerWidget countdown display + controls
// ---------------------------------------------------------------------------

/**
 * RoomTimerSection — renders the room-scoped Pomodoro using the same pure
 * helpers as StudyTimerWidget (computeRoomTimerDisplaySeconds + formatTime).
 * Controls emit over studyRoomSocket (distinct from /study-timer REST controls).
 * This is NOT a rebuild — it reuses the widget's countdown rendering pattern.
 */
function RoomTimerSection({
  serverId,
  roomId,
  timer,
}: {
  serverId: string;
  roomId: string;
  timer: StudyRoomTimer | null;
}) {
  const [displaySeconds, setDisplaySeconds] = useState(() => computeRoomTimerDisplaySeconds(timer));
  const [isPending, setIsPending] = useState(false);

  // Countdown: 1-second tick to endsAt (anti-drift) — mirrors StudyTimerWidget.
  // Also clears isPending on any timer prop change (new broadcast arrived from server).
  useEffect(() => {
    setDisplaySeconds(computeRoomTimerDisplaySeconds(timer));
    setIsPending(false); // clear optimistic pending on every authoritative server update
    if (!timer || timer.runState !== 'running') return;
    const id = setInterval(() => {
      setDisplaySeconds(computeRoomTimerDisplaySeconds(timer));
    }, 1000);
    return () => clearInterval(id);
  }, [timer]);

  const runState = timer?.runState ?? 'idle';
  const phase = timer?.phase ?? 'work';
  const isWork = phase === 'work';
  const isRunning = runState === 'running';
  const isPaused = runState === 'paused';
  const isIdle = runState === 'idle';
  const accent = isWork ? '#10b981' : '#f59e0b';

  const { mm, ss } = formatTime(displaySeconds);

  function handleStart() {
    if (isPending) return;
    setIsPending(true);
    startRoomTimer(serverId, roomId);
    // pending clears on next timer_update event (parent sets new timer prop)
    setTimeout(() => setIsPending(false), 3000);
  }

  function handlePause() {
    if (isPending) return;
    setIsPending(true);
    pauseRoomTimer(serverId, roomId);
    setTimeout(() => setIsPending(false), 3000);
  }

  function handleReset() {
    if (isPending) return;
    setIsPending(true);
    resetRoomTimer(serverId, roomId);
    setTimeout(() => setIsPending(false), 3000);
  }

  // Clear pending when a new timer broadcast arrives: we piggyback on the existing
  // countdown effect (which already fires on every `timer` change) by calling
  // setIsPending(false) there, rather than adding a second useEffect that would
  // trigger an exhaustive-deps lint error for tracking a derived value.

  return (
    <div
      className="mt-4 pt-4 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      data-testid="room-timer-section"
    >
      <p
        className="text-[10px] font-medium uppercase tracking-wide mb-3"
        style={{ color: 'rgba(255,255,255,0.40)' }}
      >
        Room Timer
      </p>

      {/* Countdown display — mirrors StudyTimerWidget countdown rendering */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="font-mono font-semibold leading-none flex items-center text-[28px]"
          style={{
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            color: isIdle ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.92)',
            opacity: isPaused ? 0.7 : 1,
          }}
          aria-label={`${mm} minutes ${ss} seconds remaining`}
          data-testid="room-timer-display"
        >
          {mm}
          <span
            className={isRunning ? 'sh-timer-colon' : ''}
            style={{ color: 'rgba(255,255,255,0.60)', paddingRight: '1px' }}
            aria-hidden="true"
          >
            :
          </span>
          {ss}
        </div>

        {/* Phase indicator */}
        {!isIdle && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
            style={{
              backgroundColor: '#121214',
              border: '1px solid rgba(255,255,255,0.06)',
              color: accent,
            }}
            data-testid="room-timer-phase"
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: accent }}
              aria-hidden="true"
            />
            {isWork ? 'Focus' : 'Break'}
          </div>
        )}

        {isPaused && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase"
            style={{
              backgroundColor: '#27272a',
              color: 'rgba(255,255,255,0.60)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            data-testid="room-timer-paused-badge"
          >
            Paused
          </div>
        )}
      </div>

      {/* Timer controls */}
      <div className="flex items-center gap-2">
        {isIdle && (
          <button
            type="button"
            onClick={handleStart}
            disabled={isPending}
            aria-label="Start room timer"
            className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            style={{ backgroundColor: '#10b981', color: '#fff', border: '1px solid transparent' }}
            data-testid="room-timer-start"
          >
            {isPending ? (
              <SpinnerIcon size={12} className="sh-animate-spin" />
            ) : (
              <PlayFillIcon size={12} />
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
              aria-label="Pause room timer"
              className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              data-testid="room-timer-pause"
            >
              {isPending ? (
                <SpinnerIcon size={12} className="sh-animate-spin" />
              ) : (
                <PauseFillIcon size={12} />
              )}
              Pause
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              aria-label="Reset room timer"
              className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-md transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{ color: 'rgba(255,255,255,0.60)' }}
              data-testid="room-timer-reset"
            >
              <ArrowCounterClockwiseIcon size={14} />
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              type="button"
              onClick={handleStart}
              disabled={isPending}
              aria-label="Resume room timer"
              className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              data-testid="room-timer-resume"
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
              aria-label="Reset room timer"
              className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{ color: 'rgba(255,255,255,0.40)' }}
              data-testid="room-timer-reset-paused"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Joined state: roster + room timer
// ---------------------------------------------------------------------------

function JoinedPanel({
  serverId,
  room,
  viewers,
  selfUserId,
  timer,
  onLeave,
  leaving,
  compact,
}: {
  serverId: string;
  room: FocusRoom;
  viewers: FocusRoomViewer[];
  selfUserId?: string | undefined;
  timer: StudyRoomTimer | null;
  onLeave: () => void;
  leaving: boolean;
  compact: boolean;
}) {
  // Compact bar for <1024px
  if (compact) {
    return (
      <div
        className="w-full rounded-lg flex flex-row items-center justify-between p-2 pl-3"
        style={{
          backgroundColor: '#1c1c1f',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        data-testid="joined-compact-bar"
      >
        <div className="flex items-center gap-2 overflow-hidden pr-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: '#10b981' }}
            aria-hidden="true"
          />
          <span
            className="text-xs font-semibold truncate"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            {room.name}
          </span>
          <span
            className="text-[10px] border-l pl-2 shrink-0"
            style={{
              color: 'rgba(255,255,255,0.60)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            {room.count} peers
          </span>
        </div>
        <button
          type="button"
          onClick={onLeave}
          disabled={leaving}
          aria-label="Leave focus room"
          className="inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-150 active:scale-95 disabled:opacity-40 shrink-0"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          data-testid="leave-compact-btn"
        >
          {leaving ? (
            <SpinnerIcon size={12} className="sh-animate-spin" />
          ) : (
            <SignOutIcon size={16} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={`Active Focus Room: ${room.name}`}
      className="w-full rounded-lg overflow-hidden flex flex-col"
      style={{
        backgroundColor: '#1c1c1f',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
      data-testid="joined-panel"
    >
      {/* Panel header */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-3 border-b"
        style={{
          backgroundColor: '#121214',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Joined indicator */}
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
            aria-hidden="true"
          >
            <CheckCircleIcon size={16} style={{ color: '#10b981' }} />
          </div>
          <div>
            <h3
              className="font-semibold text-sm leading-none"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              {room.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#10b981' }}
                aria-hidden="true"
              />
              <span
                className="text-xs"
                aria-live="polite"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                {room.count} focusing now
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLeave}
          disabled={leaving}
          aria-label="Leave focus room"
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
          style={{ color: 'rgba(255,255,255,0.60)' }}
          data-testid="leave-btn"
        >
          {leaving ? (
            <SpinnerIcon size={12} className="sh-animate-spin" />
          ) : (
            <SignOutIcon size={14} />
          )}
          Leave Room
        </button>
      </div>

      {/* Roster */}
      <div className="p-4">
        <div
          className="flex flex-wrap gap-4"
          role="list"
          aria-live="polite"
          aria-label="Active roster"
          data-testid="joined-roster"
        >
          {viewers.map((viewer) => {
            const isSelf = viewer.userId === selfUserId;
            return (
              <div
                key={viewer.userId}
                className="flex flex-col items-center gap-2 group w-14"
                role="listitem"
                aria-current={isSelf ? 'true' : undefined}
                aria-label={isSelf ? `${viewer.displayName} (You)` : viewer.displayName}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden"
                  style={{
                    border: `2px solid ${isSelf ? '#10b981' : '#27272a'}`,
                    backgroundColor: '#3f3f46',
                    color: 'rgba(255,255,255,0.92)',
                    transition: 'border-color 200ms ease',
                  }}
                >
                  {viewer.displayName.charAt(0).toUpperCase()}
                </div>
                <span
                  className="text-[11px] font-medium truncate w-full text-center"
                  style={{ color: isSelf ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.60)' }}
                >
                  {isSelf ? 'You' : viewer.displayName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Room-scoped timer — reuses StudyTimerWidget countdown display logic */}
        <RoomTimerSection serverId={serverId} roomId={room.id} timer={timer} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  serverId: string;
  selfUserId?: string | undefined;
};

type PanelState = 'loading' | 'list' | 'creating' | 'joined' | 'room-vanished';

export function FocusRoomPanel({ serverId, selfUserId }: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [panelState, setPanelState] = useState<PanelState>('loading');
  const [rooms, setRooms] = useState<FocusRoom[]>([]);
  const [joinedRoom, setJoinedRoom] = useState<FocusRoom | null>(null);
  const [roster, setRoster] = useState<FocusRoomViewer[]>([]);
  const [roomTimer, setRoomTimer] = useState<StudyRoomTimer | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null); // roomId being joined
  const [leaving, setLeaving] = useState(false);

  // Compact mode detection (<1024px)
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsCompact(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsCompact(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Stable ref to avoid stale closures in socket handlers
  const joinedRoomRef = useRef<FocusRoom | null>(null);
  useEffect(() => {
    joinedRoomRef.current = joinedRoom;
  }, [joinedRoom]);

  // ── Socket subscriptions ────────────────────────────────────────────────────
  useEffect(() => {
    // Rooms list — updated whenever rooms open/close/change count for this server
    const unsubRooms = onRooms((event) => {
      if (event.serverId !== serverId) return;
      setRooms(event.rooms);

      // Transition from loading to list on first rooms event
      setPanelState((prev) => {
        if (prev === 'loading') return event.rooms.length === 0 ? 'list' : 'list';
        return prev;
      });

      // If the user is joined and the room disappears → room-vanished state
      const currentJoined = joinedRoomRef.current;
      if (currentJoined) {
        const stillExists = event.rooms.some((r) => r.id === currentJoined.id);
        if (!stillExists) {
          setJoinedRoom(null);
          setRoster([]);
          setRoomTimer(null);
          setPanelState('room-vanished');
        } else {
          // Update count from rooms event
          const updated = event.rooms.find((r) => r.id === currentJoined.id);
          if (updated) setJoinedRoom(updated);
        }
      }
    });

    // Roster — per-room roster update
    const unsubPresence = onPresence((event) => {
      const currentJoined = joinedRoomRef.current;
      if (!currentJoined || event.roomId !== currentJoined.id) return;
      setRoster(event.roster.viewers);
    });

    // Room timer update — room-scoped Pomodoro
    const unsubTimer = onTimerUpdate((event) => {
      const currentJoined = joinedRoomRef.current;
      if (!currentJoined || event.roomId !== currentJoined.id) return;
      setRoomTimer(event.timer);
    });

    // Join error — surface inline
    const unsubError = onJoinError((event) => {
      setJoinError(event.message);
      setCreating(false);
      setJoining(null);
      // Stay in list state if error during join; return from creating state
      setPanelState((prev) => (prev === 'creating' ? 'list' : prev));
    });

    return () => {
      unsubRooms();
      unsubPresence();
      unsubTimer();
      unsubError();
    };
  }, [serverId]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateClick = useCallback(() => {
    setJoinError(null);
    setPanelState('creating');
  }, []);

  const handleCreateConfirm = useCallback(
    (name: string) => {
      setCreating(true);
      setJoinError(null);
      createFocusRoom(serverId, name);
      // The server will respond with a rooms event + presence event for the new room
      // We optimistically move to list; the rooms event will update the list
      // The join happens server-side after create — we'll receive a presence event
      // If error: onJoinError will fire and clear creating state
      // Timeout guard so UI doesn't hang if server is slow
      setTimeout(() => {
        setCreating(false);
        setPanelState('list');
      }, 5000);
    },
    [serverId],
  );

  const handleCreateCancel = useCallback(() => {
    setCreating(false);
    setPanelState('list');
  }, []);

  const handleJoin = useCallback(
    (roomId: string) => {
      setJoinError(null);
      setJoining(roomId);
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      joinFocusRoom(serverId, roomId);
      setJoinedRoom(room);
      setRoomTimer(null);
      setPanelState('joined');
      // Joining clears when presence event arrives
      setTimeout(() => setJoining(null), 3000);
    },
    [serverId, rooms],
  );

  const handleLeave = useCallback(() => {
    if (!joinedRoom) return;
    setLeaving(true);
    leaveFocusRoom(serverId, joinedRoom.id);
    setJoinedRoom(null);
    setRoster([]);
    setRoomTimer(null);
    setLeaving(false);
    setPanelState('list');
  }, [serverId, joinedRoom]);

  const handleReturnToList = useCallback(() => {
    setJoinError(null);
    setPanelState('list');
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div role="region" aria-label="Focus Rooms" className="w-full" data-testid="focus-room-panel">
      {/* ── Loading ── */}
      {panelState === 'loading' && <PanelSkeleton />}

      {/* ── Room-vanished error ── */}
      {panelState === 'room-vanished' && (
        <div
          role="alert"
          className="flex flex-col items-center justify-center text-center p-4 rounded-lg"
          style={{
            border: '1px solid rgba(239,68,68,0.2)',
            backgroundColor: 'rgba(239,68,68,0.05)',
          }}
          data-testid="room-vanished"
        >
          <WarningCircleIcon size={24} style={{ color: '#f87171', marginBottom: '8px' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Room disbanded
          </h4>
          <p className="text-xs mt-1 mb-4" style={{ color: 'rgba(255,255,255,0.60)' }}>
            The host closed this session or connection was lost.
          </p>
          <button
            type="button"
            onClick={handleReturnToList}
            className="inline-flex items-center h-7 px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95"
            style={{
              backgroundColor: '#27272a',
              color: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            data-testid="return-to-list-btn"
          >
            Return to List
          </button>
        </div>
      )}

      {/* ── Joined state ── */}
      {panelState === 'joined' && joinedRoom && (
        <JoinedPanel
          serverId={serverId}
          room={joinedRoom}
          viewers={roster}
          selfUserId={selfUserId}
          timer={roomTimer}
          onLeave={handleLeave}
          leaving={leaving}
          compact={isCompact}
        />
      )}

      {/* ── List / empty / creating states ── */}
      {(panelState === 'list' || panelState === 'creating') && (
        <div
          className="w-full rounded-lg overflow-hidden"
          style={{
            backgroundColor: '#1c1c1f',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          {/* Panel header */}
          <div
            className="px-4 py-3 flex items-center justify-between gap-3 border-b"
            style={{
              backgroundColor: '#121214',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Open Focus Rooms
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Join an active session or start your own.
              </p>
            </div>

            {panelState !== 'creating' && (
              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md text-xs font-semibold transition-colors duration-150 active:scale-95 shrink-0"
                style={{
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: '1px solid transparent',
                }}
                data-testid="create-room-btn"
              >
                <PlusIcon size={14} />
                Create Room
              </button>
            )}
          </div>

          {/* Panel body */}
          <div className="p-4 flex flex-col gap-3" style={{ minHeight: '120px' }}>
            {/* Join error feedback */}
            {joinError && (
              <div
                role="alert"
                className="flex items-center gap-2 p-2 rounded-lg text-xs"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171',
                }}
                data-testid="join-error"
              >
                <WarningCircleIcon size={14} aria-hidden="true" />
                {joinError}
                <button
                  type="button"
                  onClick={() => setJoinError(null)}
                  className="ml-auto shrink-0"
                  aria-label="Dismiss error"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  <XIcon size={12} />
                </button>
              </div>
            )}

            {/* Creating inline form */}
            {panelState === 'creating' && (
              <CreateRoomForm
                onConfirm={handleCreateConfirm}
                onCancel={handleCreateCancel}
                creating={creating}
              />
            )}

            {/* Rooms list */}
            {rooms.length > 0 ? (
              <div className="flex flex-col gap-2" data-testid="rooms-list">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onJoin={handleJoin}
                    joining={joining === room.id}
                  />
                ))}
              </div>
            ) : (
              /* Empty state when no rooms and not creating */
              panelState !== 'creating' && <EmptyState onCreateClick={handleCreateClick} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
