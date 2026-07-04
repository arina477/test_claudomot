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
import { useCallback, useEffect, useRef, useState } from 'react';
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
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
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
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
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
            onClick={onEdit}
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

  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  // Effective permissions
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Detail panel
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ScheduledSession | null>(null);

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
      announce(saved.title ? `Session "${saved.title}" saved.` : 'Session saved.');
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

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(session: ScheduledSession) {
    setEditTarget(session);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditTarget(null);
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
            type="button"
            data-testid="new-session-btn"
            onClick={openCreate}
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
        {/* PRIMARY: Agenda list */}
        <div className="flex-1 overflow-y-auto">
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
                    type="button"
                    data-testid="empty-state-new-btn"
                    onClick={openCreate}
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
                            onClick={() => {
                              setSelectedSessionId((prev) =>
                                prev === session.id ? null : session.id,
                              );
                            }}
                            onEdit={(e) => {
                              e.stopPropagation();
                              openEdit(session);
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

        {/* SECONDARY: Session detail panel (inline, bento paradigm) */}
        {selectedSessionId && (
          <div
            className="hidden sm:flex relative"
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
              onEdit={(session) => openEdit(session)}
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
