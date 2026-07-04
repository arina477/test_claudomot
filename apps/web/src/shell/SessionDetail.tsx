/**
 * SessionDetail — inline side-panel showing a single scheduled session.
 *
 * wave-43 M10 — matches design/class-scheduling.html § SECONDARY INLINE PANEL.
 *
 * States:
 *   - loading: skeleton rows
 *   - not-found: "Session not found" with calendar-x icon
 *   - loaded (organizer): title + meta grid + description + footer Edit/Delete buttons
 *   - loaded (member): title + meta grid + description, no footer controls
 *
 * Delete confirmation: role=dialog, focus trap, Esc close + restore focus.
 *
 * A11y:
 *   - Inline delete confirmation dialog: role="dialog" aria-modal aria-labelledby,
 *     focus trap (Tab/Shift+Tab), Esc close + restore focus to trigger.
 *   - aria-live="polite" announcer for async status changes.
 */

import type { ScheduledSession } from '@studyhall/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../auth/api';
import {
  ArrowsClockwiseIcon,
  CalendarIcon,
  CalendarXIcon,
  ClockIcon,
  PencilSimpleIcon,
  SpinnerIcon,
  TrashIcon,
  XIcon,
} from './icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : '';
  const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return dayLabel ? `${dayLabel}, ${monthDay}` : monthDay;
}

function formatTimeRange(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';

  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

  const diffMs = e.getTime() - s.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.round((diffMs % 3600000) / 60000);
  const durParts: string[] = [];
  if (diffH > 0) durParts.push(`${diffH}hr`);
  if (diffM > 0) durParts.push(`${diffM}min`);
  const dur = durParts.join(' ');

  return `${fmt(s)} — ${fmt(e)}${dur ? ` (${dur})` : ''}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

// ---------------------------------------------------------------------------
// DeleteDialog — focused confirmation dialog
// ---------------------------------------------------------------------------

type DeleteDialogProps = {
  sessionTitle: string;
  onConfirm: () => void;
  onClose: () => void;
  deleting: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

function DeleteDialog({
  sessionTitle,
  onConfirm,
  onClose,
  deleting,
  triggerRef,
}: DeleteDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel on open (safe default for destructive actions)
  useEffect(() => {
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Esc close + focus restore
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, triggerRef]);

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
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
    dialog.addEventListener('keydown', handleTab);
    return () => dialog.removeEventListener('keydown', handleTab);
  }, []);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Esc handled in useEffect; backdrop click-outside is supplementary
    <div
      role="presentation"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          requestAnimationFrame(() => triggerRef.current?.focus());
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="delete-session-dialog"
        className="w-full max-w-sm flex flex-col"
        style={{
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'deleteDialogIn 0.25s ease forwards',
        }}
      >
        <header
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            id={titleId}
            className="text-base font-semibold"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            Delete session?
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => {
              onClose();
              requestAnimationFrame(() => triggerRef.current?.focus());
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
            }}
          >
            <XIcon size={16} />
          </button>
        </header>

        <div
          className="px-5 py-4 text-sm leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          Are you sure you want to delete{' '}
          <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 500 }}>
            &ldquo;{sessionTitle}&rdquo;
          </span>
          ? This action cannot be undone.
        </div>

        <footer
          className="flex items-center justify-end gap-2 px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            ref={cancelRef}
            type="button"
            onClick={() => {
              onClose();
              requestAnimationFrame(() => triggerRef.current?.focus());
            }}
            className="h-9 px-4 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: '#27272a',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.60)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="h-9 px-5 rounded-md text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              opacity: deleting ? 0.7 : 1,
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            {deleting ? (
              <span className="flex items-center gap-2">
                <SpinnerIcon size={14} className="sh-animate-spin" />
                Deleting…
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </footer>
      </div>

      <style>{`
        @keyframes deleteDialogIn {
          from { transform: scale(0.97) translateY(8px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes deleteDialogIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SessionDetail props + component
// ---------------------------------------------------------------------------

export type SessionDetailProps = {
  sessionId: string;
  isOrganizer: boolean;
  onClose: () => void;
  onEdit: (session: ScheduledSession) => void;
  onDeleted: (sessionId: string) => void;
  onAnnounce: (msg: string) => void;
};

export function SessionDetail({
  sessionId,
  isOrganizer,
  onClose,
  onEdit,
  onDeleted,
  onAnnounce,
}: SessionDetailProps) {
  const [loadStatus, setLoadStatus] = useState<'loading' | 'loaded' | 'not-found' | 'error'>(
    'loading',
  );
  const [session, setSession] = useState<ScheduledSession | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Load session
  useEffect(() => {
    setLoadStatus('loading');
    setSession(null);
    api
      .getSession(sessionId)
      .then((s) => {
        setSession(s);
        setLoadStatus('loaded');
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '';
        if (msg.startsWith('404')) {
          setLoadStatus('not-found');
        } else {
          setLoadStatus('error');
        }
      });
  }, [sessionId]);

  async function handleDelete() {
    if (!session) return;
    setDeleting(true);
    try {
      await api.deleteSession(session.id);
      onAnnounce(`Session "${session.title}" deleted.`);
      onDeleted(session.id);
      setDeleteOpen(false);
    } catch {
      onAnnounce('Delete failed. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div
      data-testid="session-detail-panel"
      className="flex h-full flex-col"
      style={{
        backgroundColor: '#121214',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        width: 360,
        minWidth: 360,
      }}
    >
      {/* Panel header */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          Session Details
        </h2>
        <button
          type="button"
          aria-label="Close session details"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          }}
        >
          <XIcon size={16} />
        </button>
      </header>

      {/* Loading skeleton */}
      {loadStatus === 'loading' && (
        <div className="flex-1 p-6 space-y-4" aria-busy="true" aria-label="Loading session details">
          {[80, 140, 60, 100].map((w, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              key={i}
              className="h-4 rounded-md"
              style={{
                width: `${w}%`,
                maxWidth: w,
                backgroundColor: '#27272a',
                animation: 'shimmer 1.5s infinite linear',
                backgroundImage: 'linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)',
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      )}

      {/* Not found state */}
      {(loadStatus === 'not-found' || loadStatus === 'error') && (
        <div
          data-testid="session-not-found"
          className="flex flex-1 flex-col items-center justify-center p-6 text-center"
        >
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: '#27272a' }}
            aria-hidden="true"
          >
            <CalendarXIcon size={24} style={{ color: 'rgba(255,255,255,0.40)' }} />
          </div>
          <h3 className="mb-2 text-[17px] font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Session not found
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
            {loadStatus === 'not-found'
              ? 'This session may have been deleted, or the link is invalid.'
              : 'Could not load session details. Please try again.'}
          </p>
        </div>
      )}

      {/* Loaded state */}
      {loadStatus === 'loaded' && session && (
        <>
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-8">
            {/* Title + chips */}
            <div>
              <h3
                className="mb-3 text-[22px] font-semibold leading-tight"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                {session.title}
              </h3>

              <div className="mb-6 flex flex-wrap gap-2">
                {/* Recurrence chip */}
                {session.recurrence === 'weekly' && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 h-6 text-xs font-medium"
                    style={{
                      backgroundColor: '#27272a',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#10b981',
                    }}
                  >
                    <ArrowsClockwiseIcon size={12} />
                    Weekly
                  </span>
                )}
              </div>

              {/* Meta grid */}
              <div
                className="rounded-lg border p-4 space-y-4 text-sm"
                style={{
                  backgroundColor: 'rgba(28,28,31,0.50)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                {/* Date + time */}
                <div className="flex items-start gap-3">
                  <span style={{ color: 'rgba(255,255,255,0.60)', marginTop: 2 }}>
                    <CalendarIcon size={16} />
                  </span>
                  <div>
                    <p className="font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                      {formatDateLabel(session.startsAt)}
                    </p>
                    <p
                      className="text-xs mt-0.5 flex items-center gap-1"
                      style={{ color: 'rgba(255,255,255,0.60)' }}
                    >
                      <ClockIcon size={12} />
                      {formatTimeRange(session.startsAt, session.endsAt)}
                    </p>
                    {session.recurrence === 'weekly' && session.recurrenceUntil && (
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                        Repeats weekly until{' '}
                        {new Date(session.recurrenceUntil).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />

                {/* Organizer */}
                <div className="flex items-center gap-3">
                  <span style={{ color: 'rgba(255,255,255,0.60)' }}>
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <div className="flex items-center gap-2">
                    {session.organizer.avatarUrl ? (
                      <img
                        src={session.organizer.avatarUrl}
                        alt={session.organizer.displayName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0"
                        style={{
                          backgroundColor: '#27272a',
                          color: '#10b981',
                        }}
                        aria-hidden="true"
                      >
                        {getInitials(session.organizer.displayName)}
                      </div>
                    )}
                    <p className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.92)' }}>
                      {session.organizer.displayName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {session.description && (
              <div>
                <h4
                  className="mb-2 text-sm font-semibold"
                  style={{ color: 'rgba(255,255,255,0.92)' }}
                >
                  Description
                </h4>
                <div
                  className="rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap min-h-[80px]"
                  style={{
                    backgroundColor: '#1c1c1f',
                    borderColor: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.60)',
                  }}
                >
                  {session.description}
                </div>
              </div>
            )}
          </div>

          {/* Organizer footer — Edit + Delete */}
          {isOrganizer && (
            <footer
              className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-2 p-4"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(18,18,20,0.90)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <button
                ref={deleteTriggerRef}
                type="button"
                aria-haspopup="dialog"
                onClick={() => setDeleteOpen(true)}
                className="h-9 px-4 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                  color: 'rgba(255,255,255,0.60)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'rgba(239,68,68,0.10)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.20)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
                }}
              >
                <span className="flex items-center gap-1.5">
                  <TrashIcon size={14} />
                  Delete
                </span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(session)}
                className="h-9 px-4 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: '#27272a',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.92)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                }}
              >
                <span className="flex items-center gap-1.5">
                  <PencilSimpleIcon size={14} />
                  Edit Session
                </span>
              </button>
            </footer>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      {deleteOpen && session && (
        <DeleteDialog
          sessionTitle={session.title}
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
          deleting={deleting}
          triggerRef={deleteTriggerRef as React.RefObject<HTMLButtonElement | null>}
        />
      )}
    </div>
  );
}
