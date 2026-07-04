/**
 * ClassCalendar — date-grouped agenda view for scheduled sessions.
 *
 * wave-43 M10 — matches design/class-scheduling.html.
 *
 * Layout:
 *   - Channel-like header ("Schedule", calendar icon) + organizer-only "New session" CTA.
 *   - Date-grouped agenda list: each group has a date header + session cards.
 *     Session cards: title, time range, Weekly recurrence chip, organizer name.
 *     Clicking a card opens SessionDetail in an inline side-panel.
 *   - Organizer-only row hover actions: edit (pencil) + delete (trash)
 *     (edit opens SessionForm; delete opens SessionDetail delete dialog via onEdit).
 *   - Empty state: calendar icon + "No sessions scheduled".
 *   - Loading: skeleton rows.
 *   - Error state: retry button.
 *
 * Date window: today → today + 60 days (enough for most weekly schedules).
 *
 * A11y:
 *   - Session cards: role is implicit (button via onClick), tabindex=0, Enter/Space activates.
 *   - aria-live="polite" announcer region for status announcements.
 *   - Date group headers use h3 (inside the panel's h2 hierarchy).
 *
 * Permissions: "New session" CTA + row-level Edit/Delete gated on manage_assignments.
 *   Self-fetch like AssignmentsPanel does; server also enforces.
 */

import type { ScheduledSession } from '@studyhall/shared';
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { api } from '../auth/api';
import { ErrorState } from '../components/states/ErrorState';
import { useServers } from './ServerContext';
import { SessionDetail } from './SessionDetail';
import { SessionForm } from './SessionForm';
import {
  ArrowsClockwiseIcon,
  CalendarIcon,
  ClockIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from './icons';

// ---------------------------------------------------------------------------
// Responsive breakpoint hook
// ---------------------------------------------------------------------------

/**
 * Returns true when the viewport is ≤1024px (the DS §9 "lg" breakpoint where
 * the member panel collapses).  Uses useSyncExternalStore for tear-free reads.
 */
function useIsNarrow(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === 'undefined') return () => {};
      const mql = window.matchMedia('(max-width: 1024px)');
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () =>
      typeof window !== 'undefined' ? window.matchMedia('(max-width: 1024px)').matches : false,
    () => false,
  );
}

// ---------------------------------------------------------------------------
// Date window helpers
// ---------------------------------------------------------------------------

function toISODay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns today's date at 00:00:00 UTC. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return d.toLocaleDateString(undefined, { weekday: 'long' });
}

function monthDayStr(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ---------------------------------------------------------------------------
// Group sessions by calendar day (using their startsAt local date)
// ---------------------------------------------------------------------------

type DayGroup = { dateStr: string; sessions: ScheduledSession[] };

function groupByDay(sessions: ScheduledSession[]): DayGroup[] {
  const map = new Map<string, ScheduledSession[]>();
  for (const s of sessions) {
    const d = new Date(s.startsAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const group = map.get(key) ?? [];
    group.push(s);
    map.set(key, group);
  }
  // Sort sessions within each day by startsAt
  const entries = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([dateStr, group]) => ({
    dateStr,
    sessions: [...group].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    ),
  }));
}

// ---------------------------------------------------------------------------
// SessionRow — a single session card in the agenda
// ---------------------------------------------------------------------------

type SessionRowProps = {
  session: ScheduledSession;
  isToday: boolean;
  isSelected: boolean;
  isOrganizer: boolean;
  onClick: (cardEl: HTMLElement) => void;
  onEdit: (e: React.MouseEvent, triggerEl: HTMLButtonElement) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
};

function SessionRow({
  session,
  isToday,
  isSelected,
  isOrganizer,
  onClick,
  onEdit,
  onDeleteClick,
}: SessionRowProps) {
  const timeLabel = `${formatTimeShort(session.startsAt)} — ${formatTimeShort(session.endsAt)}`;

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="session-card"
      onClick={(e) => onClick(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e.currentTarget);
        }
      }}
      className="group relative flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2"
      style={{
        backgroundColor: isSelected ? 'rgba(39,39,42,0.50)' : '#121214',
        borderColor: isSelected ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
        // focus-visible ring via inline — use emerald
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.10)';
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(39,39,42,0.40)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
          (e.currentTarget as HTMLDivElement).style.backgroundColor = '#121214';
        }
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Today accent bar */}
      {isToday && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
          style={{ backgroundColor: '#f59e0b' }}
        />
      )}

      <div className="flex-1 min-w-0 pl-2">
        {/* Title + weekly chip */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4
            className="text-[15px] font-semibold truncate"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            {session.title}
          </h4>
          {session.recurrence === 'weekly' && (
            <span
              className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium shrink-0 whitespace-nowrap"
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid rgba(63,63,70,0.80)',
                color: '#10b981',
              }}
            >
              <ArrowsClockwiseIcon size={10} />
              Weekly
            </span>
          )}
        </div>

        {/* Time + organizer */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span
            className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 -ml-1.5"
            style={{
              color: isToday ? '#f59e0b' : 'rgba(255,255,255,0.60)',
              backgroundColor: isToday ? 'rgba(245,158,11,0.10)' : 'transparent',
            }}
          >
            <ClockIcon size={11} />
            {timeLabel}
          </span>
          <span
            className="hidden sm:flex items-center gap-1.5"
            style={{ color: 'rgba(255,255,255,0.60)' }}
          >
            <span
              aria-hidden="true"
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: '#52525b' }}
            />
            {session.organizer.avatarUrl ? (
              <img
                src={session.organizer.avatarUrl}
                alt={session.organizer.displayName}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : null}
            {session.organizer.displayName}
          </span>
        </div>
      </div>

      {/* Row hover actions — organizer only */}
      {isOrganizer && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pr-1 shrink-0">
          <button
            type="button"
            aria-label={`Edit session: ${session.title}`}
            onClick={(e) => onEdit(e, e.currentTarget)}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1"
            style={{ color: 'rgba(255,255,255,0.60)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                '0 0 0 1px rgba(16,185,129,0.6)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <PencilSimpleIcon size={15} />
          </button>
          <button
            type="button"
            aria-label={`Delete session: ${session.title}`}
            onClick={onDeleteClick}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1"
            style={{ color: 'rgba(255,255,255,0.60)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.10)';
              (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                '0 0 0 1px rgba(239,68,68,0.6)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <TrashIcon size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClassCalendar
// ---------------------------------------------------------------------------

type Props = {
  onClose?: () => void;
};

export function ClassCalendar({ onClose }: Props) {
  const { selectedId: serverId } = useServers();

  // Responsive: at ≤1024px the detail panel overlays rather than sitting inline
  // (DS §9 — mirrors how member/assignment panels collapse at the 1024 breakpoint)
  const isNarrow = useIsNarrow();

  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  // Effective permissions
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Detail panel
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ScheduledSession | null>(null);

  // Ref to "New session" trigger for focus-restore on form close (WCAG 2.4.3)
  const newSessionBtnRef = useRef<HTMLButtonElement>(null);
  const emptyStateNewBtnRef = useRef<HTMLButtonElement>(null);
  // Tracks which trigger opened the form so we can restore focus on close
  const formTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Narrow overlay a11y: container ref for focus-trap, trigger ref for focus-restore on close
  const narrowOverlayRef = useRef<HTMLDivElement>(null);
  const narrowOverlayTriggerRef = useRef<HTMLElement | null>(null);
  const narrowOverlayLabelId = useId();

  // aria-live announcer
  const announceRef = useRef<HTMLDivElement>(null);
  const announce = useCallback((msg: string) => {
    if (!announceRef.current) return;
    announceRef.current.textContent = msg;
    setTimeout(() => {
      if (announceRef.current?.textContent === msg) {
        announceRef.current.textContent = '';
      }
    }, 3500);
  }, []);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Narrow overlay dialog a11y — Esc dismiss + focus trap
  // Only active when selectedSessionId is set AND isNarrow is true.
  // ---------------------------------------------------------------------------

  // Close narrow overlay and restore focus to the row that opened it
  const closeNarrowOverlay = useCallback(() => {
    setSelectedSessionId(null);
    requestAnimationFrame(() => {
      if (narrowOverlayTriggerRef.current) {
        narrowOverlayTriggerRef.current.focus();
      }
      narrowOverlayTriggerRef.current = null;
    });
  }, []);

  // Esc dismisses the narrow overlay
  useEffect(() => {
    if (!selectedSessionId || !isNarrow) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeNarrowOverlay();
      }
    }
    document.addEventListener('keydown', handleEsc, true);
    return () => document.removeEventListener('keydown', handleEsc, true);
  }, [selectedSessionId, isNarrow, closeNarrowOverlay]);

  // Focus trap: keep Tab inside the narrow overlay while it is open
  useEffect(() => {
    if (!selectedSessionId || !isNarrow) return;
    const overlay = narrowOverlayRef.current;
    if (!overlay) return;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !overlay) return;
      const focusable = Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled') && !el.closest('[aria-hidden="true"]'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    overlay.addEventListener('keydown', handleTab);
    return () => overlay.removeEventListener('keydown', handleTab);
  }, [selectedSessionId, isNarrow]);

  // Move initial focus into the narrow overlay when it opens
  useEffect(() => {
    if (!selectedSessionId || !isNarrow) return;
    const overlay = narrowOverlayRef.current;
    if (!overlay) return;
    const t = setTimeout(() => {
      const first = overlay.querySelector<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [selectedSessionId, isNarrow]);

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!serverId) return;
    api
      .getMyPermissions(serverId)
      .then((p) => {
        if (!mounted.current) return;
        setIsOrganizer(p.owner || p.manage_assignments);
      })
      .catch(() => {
        if (!mounted.current) return;
        setIsOrganizer(false);
      });
  }, [serverId]);

  // ---------------------------------------------------------------------------
  // Load sessions
  // ---------------------------------------------------------------------------

  const loadSessions = useCallback(() => {
    if (!serverId) return;
    setLoadStatus('loading');

    const today = startOfToday();
    const windowEnd = new Date(today);
    windowEnd.setDate(today.getDate() + 60);

    const from = today.toISOString();
    const to = windowEnd.toISOString();

    api
      .listSessions(serverId, from, to)
      .then(({ sessions: list }) => {
        if (!mounted.current) return;
        const sorted = [...list].sort(
          (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        );
        setSessions(sorted);
        setLoadStatus('loaded');
      })
      .catch(() => {
        if (!mounted.current) return;
        setLoadStatus('error');
      });
  }, [serverId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFormSuccess = useCallback(
    (saved: ScheduledSession) => {
      // Re-fetch the full list so that occurrence-expanded weekly sessions
      // (which all share the same base id) are reflected correctly. Splicing
      // the single returned DTO would collapse N occurrences to N identical
      // rows and cause React key collisions.
      loadSessions();
      setFormOpen(false);
      setEditTarget(null);
      // Detail-panel refresh: if the detail panel is open and showing the edited
      // session, force SessionDetail to re-fetch by briefly resetting the id.
      // We use a functional update so we read the current value without a dep.
      setSelectedSessionId((prev) => {
        if (prev === saved.id) {
          // Toggle off then back on in the next microtask so SessionDetail's
          // useEffect [sessionId] fires a fresh GET.
          setTimeout(() => setSelectedSessionId(saved.id), 0);
          return null;
        }
        return prev;
      });
      announce(saved.title ? `Session "${saved.title}" saved.` : 'Session saved.');
      // Restore focus to form trigger (WCAG 2.4.3) — closeForm path also does
      // this but handleFormSuccess bypasses closeForm.
      // Fallback: if the trigger was inside the detail panel that just remounted
      // (edit-from-detail path), .focus() lands on a detached node and focus
      // drops to body. In that case fall back to the stable newSessionBtnRef.
      requestAnimationFrame(() => {
        formTriggerRef.current?.focus();
        if (document.activeElement === document.body) {
          newSessionBtnRef.current?.focus();
        }
      });
    },
    [announce, loadSessions],
  );

  const handleDeleted = useCallback(
    (id: string) => {
      // Re-fetch instead of filtering by id: all weekly occurrences share the
      // same base id, so an id-filter splice would remove every occurrence in
      // the list on a single-occurrence delete (or leave stale rows after a
      // series delete). Re-fetching gives the canonical post-delete state.
      loadSessions();
      setSelectedSessionId((prev) => (prev === id ? null : prev));
    },
    [loadSessions],
  );

  function openCreate(triggerEl?: HTMLButtonElement | null) {
    setEditTarget(null);
    formTriggerRef.current = triggerEl ?? null;
    setFormOpen(true);
  }

  function openEdit(session: ScheduledSession, triggerEl?: HTMLButtonElement | null) {
    setEditTarget(session);
    formTriggerRef.current = triggerEl ?? null;
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditTarget(null);
    // WCAG 2.4.3: restore focus to the element that invoked the modal.
    // Fallback to newSessionBtnRef if the trigger was inside a remounted
    // detail panel and the .focus() lands on a detached node (focus → body).
    requestAnimationFrame(() => {
      formTriggerRef.current?.focus();
      if (document.activeElement === document.body) {
        newSessionBtnRef.current?.focus();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const groups = groupByDay(sessions);
  const todayStr = toISODay(startOfToday());

  // On delete icon click from a row, open the detail panel for that session so
  // the user can confirm deletion via SessionDetail's built-in delete dialog.
  function handleRowDeleteClick(e: React.MouseEvent, session: ScheduledSession) {
    e.stopPropagation();
    setSelectedSessionId(session.id);
  }

  return (
    <div
      data-testid="class-calendar-panel"
      className="flex flex-col flex-1 min-w-0 min-h-0"
      style={{ backgroundColor: '#1c1c1f' }}
    >
      {/* A11y announcer */}
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="a11y-announcer"
      />

      {/* Panel header */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-6"
        style={{
          backgroundColor: 'rgba(28,28,31,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px -8px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              aria-label="Back"
              onClick={onClose}
              className="mr-1 flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 lg:hidden"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.92)' }}>
            <CalendarIcon size={20} />
          </span>
          <h2
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            Schedule
          </h2>
        </div>

        {isOrganizer && (
          <button
            ref={newSessionBtnRef}
            type="button"
            data-testid="new-session-btn"
            onClick={() => openCreate(newSessionBtnRef.current)}
            className="flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: '#10b981',
              color: '#0a0a0b',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
          >
            <PlusIcon size={14} />
            New session
          </button>
        )}
      </header>

      {/* Scrollable content area + optional detail panel */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* PRIMARY: Agenda list — hidden from AT while narrow overlay is open */}
        <div
          className="flex-1 overflow-y-auto"
          aria-hidden={selectedSessionId !== null && isNarrow ? 'true' : undefined}
        >
          <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 pb-32 flex flex-col gap-8 min-h-full">
            {/* Loading skeleton */}
            {loadStatus === 'loading' && (
              <div
                className="flex flex-col gap-6"
                aria-busy="true"
                aria-label="Loading schedule"
                data-testid="schedule-skeleton"
              >
                {[0, 1].map((gi) => (
                  <div key={gi} className="space-y-3">
                    <div
                      className="h-5 w-28 rounded-md"
                      style={{
                        backgroundColor: '#27272a',
                        backgroundImage:
                          'linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite linear',
                      }}
                    />
                    {[0, 1].map((ri) => (
                      <div
                        key={ri}
                        className="h-[72px] rounded-lg"
                        style={{
                          backgroundColor: '#27272a',
                          backgroundImage:
                            'linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite linear',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {loadStatus === 'error' && (
              <ErrorState
                data-testid="schedule-error"
                message="Couldn't load the schedule. Check your connection and try again."
                onRetry={loadSessions}
              />
            )}

            {/* Empty state */}
            {loadStatus === 'loaded' && sessions.length === 0 && (
              <div
                data-testid="schedule-empty-state"
                className="flex flex-col items-center gap-4 py-16 text-center"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: '#27272a',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  aria-hidden="true"
                >
                  <CalendarIcon size={32} style={{ color: 'rgba(255,255,255,0.40)' }} />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    No sessions scheduled
                  </h3>
                  <p
                    className="text-sm max-w-xs leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    {isOrganizer
                      ? 'Schedule the first class session or study group to get started.'
                      : 'The class calendar is currently empty. Recurring study groups and lectures will appear here.'}
                  </p>
                </div>
                {isOrganizer && (
                  <button
                    ref={emptyStateNewBtnRef}
                    type="button"
                    data-testid="empty-state-new-btn"
                    onClick={() => openCreate(emptyStateNewBtnRef.current)}
                    className="flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: '#10b981', color: '#0a0a0b' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = '';
                    }}
                  >
                    <PlusIcon size={14} />
                    Schedule first session
                  </button>
                )}
              </div>
            )}

            {/* Loaded — agenda groups */}
            {loadStatus === 'loaded' && sessions.length > 0 && (
              <div className="space-y-10">
                {groups.map((group) => {
                  const isGroupToday = group.dateStr === todayStr;
                  return (
                    <div key={group.dateStr}>
                      {/* Date group header */}
                      <h3
                        className="text-[13px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2"
                        style={{
                          color: isGroupToday ? '#f59e0b' : 'rgba(255,255,255,0.92)',
                        }}
                      >
                        {dayLabel(group.dateStr)}
                        <span
                          className="font-normal normal-case tracking-normal"
                          style={{ color: 'rgba(255,255,255,0.40)' }}
                        >
                          — {monthDayStr(group.dateStr)}
                        </span>
                      </h3>

                      {/* Session cards */}
                      <div className="space-y-1">
                        {group.sessions.map((session) => (
                          <SessionRow
                            key={`${session.id}-${session.startsAt}`}
                            session={session}
                            isToday={isGroupToday}
                            isSelected={selectedSessionId === session.id}
                            isOrganizer={isOrganizer}
                            onClick={(cardEl) => {
                              setSelectedSessionId((prev) => {
                                const next = prev === session.id ? null : session.id;
                                // Track the card as the restore target for the
                                // narrow overlay's focus-restore on close (H1 fix)
                                if (next !== null && isNarrow) {
                                  narrowOverlayTriggerRef.current = cardEl;
                                }
                                return next;
                              });
                            }}
                            onEdit={(e, triggerEl) => {
                              e.stopPropagation();
                              openEdit(session, triggerEl);
                            }}
                            onDeleteClick={(e) => handleRowDeleteClick(e, session)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* End of list marker */}
                <div
                  className="py-8 flex items-center justify-center gap-4"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  <div className="h-px w-8" style={{ backgroundColor: 'rgba(63,63,70,0.80)' }} />
                  <span className="text-xs">✦</span>
                  <div className="h-px w-8" style={{ backgroundColor: 'rgba(63,63,70,0.80)' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECONDARY: Session detail panel */}
        {selectedSessionId && !isNarrow && (
          /* ≥1025px: inline bento side-panel (standard desktop layout) */
          <div
            className="flex relative"
            style={{
              transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <SessionDetail
              sessionId={selectedSessionId}
              isOrganizer={isOrganizer}
              onClose={() => {
                setSelectedSessionId(null);
              }}
              onEdit={(session, triggerEl) => openEdit(session, triggerEl)}
              onDeleted={handleDeleted}
              onAnnounce={announce}
            />
          </div>
        )}
        {selectedSessionId && isNarrow && (
          /* ≤1024px: overlay modal — proper WCAG dialog (DS §9).
             role=dialog aria-modal; Esc dismiss + focus-trap wired via useEffect above;
             backdrop click-outside closes as supplementary affordance.
             The agenda list carries aria-hidden="true" while this is open (see above). */
          // biome-ignore lint/a11y/useKeyWithClickEvents: Esc handled by the useEffect keydown listener above; backdrop click is supplementary
          <div
            ref={narrowOverlayRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={narrowOverlayLabelId}
            data-testid="narrow-session-overlay"
            className="fixed inset-0 z-40 flex items-stretch justify-end"
            style={{ backgroundColor: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(2px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeNarrowOverlay();
            }}
          >
            {/* Visually hidden label for the dialog */}
            <span id={narrowOverlayLabelId} className="sr-only">
              Session Details
            </span>
            <SessionDetail
              sessionId={selectedSessionId}
              isOrganizer={isOrganizer}
              onClose={closeNarrowOverlay}
              onEdit={(session, triggerEl) => openEdit(session, triggerEl)}
              onDeleted={handleDeleted}
              onAnnounce={announce}
            />
          </div>
        )}
      </div>

      {/* Session Form Modal */}
      {formOpen && serverId && editTarget === null && (
        <SessionForm serverId={serverId} onSuccess={handleFormSuccess} onClose={closeForm} />
      )}
      {formOpen && serverId && editTarget !== null && (
        <SessionForm
          serverId={serverId}
          session={editTarget}
          onSuccess={handleFormSuccess}
          onClose={closeForm}
        />
      )}

      {/* Shimmer keyframe — used by skeleton rows */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
