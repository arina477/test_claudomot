/**
 * AssignmentCard — wave-22 M5 assignment card primitive.
 *
 * Visual contract: design/assignments-panel.html + D-3 gate-verdict.md
 *
 * Layout: <article>.glass-panel, flex col→row at md, hover-lift.
 * Left edge accent bar (border-l-2):
 *   overdue  → --danger   (dueAt < now)
 *   due-soon → --accent-amber  (now ≤ dueAt < now+48h)
 *   normal   → none
 *   done     → none; card-done modifier applied
 *
 * Status chip (exclusive):
 *   OVERDUE  — bg-danger/10, text-danger-text (#f87171 — AA over tint), border-danger/20
 *   DUE-SOON — bg-amber/10, text-amber, border-amber/20, ph-clock icon
 *   NORMAL   — no chip; plain "Due: <date>" in text-muted
 *   DONE overrides chip — muted due line at 70% opacity only
 *
 * Per-member toggle: real <input type="checkbox"> + <label>, stopPropagation on wrapper.
 * Attachment badge: ph-paperclip "N Files" when attachmentCount > 0.
 */

import type { Assignment } from '@studyhall/shared';
import { useCallback, useId } from 'react';
import { api } from '../auth/api';
import { ClockIcon, PaperclipIcon } from './icons';

// ---------------------------------------------------------------------------
// Chip logic helpers — pure, testable
// ---------------------------------------------------------------------------

/** Computed urgency state for a card. "done" short-circuits urgency display. */
export type UrgencyState = 'overdue' | 'dueSoon' | 'normal' | 'done';

/**
 * Derive the card urgency state from the due date string and current time.
 *
 * Thresholds (from D-3 gate-verdict.md § B-4 ADOPTION CONTRACT):
 *   overdue  = dueAt < now
 *   dueSoon  = now ≤ dueAt < now + 48h
 *   normal   = dueAt ≥ now + 48h
 *   done overrides chip display entirely
 */
export function getUrgency(dueDate: string, isDone: boolean, now = new Date()): UrgencyState {
  if (isDone) return 'done';
  const dueAt = new Date(dueDate);
  if (Number.isNaN(dueAt.getTime())) return 'normal';
  if (dueAt < now) return 'overdue';
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  if (dueAt.getTime() - now.getTime() < fortyEightHoursMs) return 'dueSoon';
  return 'normal';
}

/** Human-readable relative date label for chips. */
function formatRelative(dueDate: string): string {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return '';
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays} days`;
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Short formatted date for normal state (no chip). */
function formatDate(dueDate: string): string {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return '';
  return due.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// DueChip — renders the correct chip or plain due line
// ---------------------------------------------------------------------------

function DueChip({ urgency, dueDate }: { urgency: UrgencyState; dueDate: string }) {
  if (urgency === 'done') {
    // Done: show muted due line at 70% opacity (urgency chip suppressed)
    return (
      <span
        className="text-xs font-medium"
        style={{ color: 'rgba(255,255,255,0.40)', opacity: 0.7 }}
      >
        Due: <span style={{ color: 'rgba(255,255,255,0.55)' }}>{formatDate(dueDate)}</span>
      </span>
    );
  }
  if (urgency === 'overdue') {
    // OVERDUE: danger-text on danger/10 tint — AA guaranteed (6.30:1)
    return (
      <span
        data-testid="chip-overdue"
        className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
        style={{
          backgroundColor: 'rgba(239,68,68,0.10)',
          color: '#f87171', // --danger-text: AA over danger/10
          borderColor: 'rgba(239,68,68,0.20)',
        }}
      >
        Overdue: {formatRelative(dueDate)}
      </span>
    );
  }
  if (urgency === 'dueSoon') {
    // DUE-SOON: amber chip with clock icon
    return (
      <span
        data-testid="chip-due-soon"
        className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
        style={{
          backgroundColor: 'rgba(245,158,11,0.10)',
          color: '#f59e0b', // --accent-amber
          borderColor: 'rgba(245,158,11,0.20)',
        }}
      >
        <ClockIcon size={12} />
        Due {formatRelative(dueDate)}
      </span>
    );
  }
  // NORMAL: plain due line, no chip
  return (
    <span
      data-testid="chip-normal"
      className="text-xs font-medium"
      style={{ color: 'rgba(255,255,255,0.40)' }}
    >
      Due: <span style={{ color: 'rgba(255,255,255,0.92)' }}>{formatDate(dueDate)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type AssignmentCardProps = {
  assignment: Assignment;
  /** Called after status toggle PUT succeeds — caller updates list state. */
  onStatusChange: (id: string, state: 'todo' | 'done') => void;
  /** Called when the card body (not the toggle wrapper) is clicked — opens detail modal. */
  onClick: (assignment: Assignment) => void;
};

// ---------------------------------------------------------------------------
// AssignmentCard
// ---------------------------------------------------------------------------

export function AssignmentCard({ assignment, onStatusChange, onClick }: AssignmentCardProps) {
  const checkboxId = useId();
  const isDone = assignment.myStatus === 'done';
  const urgency = getUrgency(assignment.dueDate, isDone);

  const handleToggle = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newState = e.currentTarget.checked ? 'done' : ('todo' as const);
      // Optimistic update immediately (caller handles state)
      onStatusChange(assignment.id, newState);
      // Fire the PUT — if it fails we silently log (optimistic already applied)
      try {
        await api.setAssignmentStatus(assignment.id, { state: newState });
      } catch (err) {
        console.error('[AssignmentCard] status toggle failed', err);
        // Revert optimistic update on error
        onStatusChange(assignment.id, newState === 'done' ? 'todo' : 'done');
      }
    },
    [assignment.id, onStatusChange],
  );

  // Border-left accent bar colour
  const borderLeftColor =
    urgency === 'overdue'
      ? '#ef4444' // --danger
      : urgency === 'dueSoon'
        ? '#f59e0b' // --accent-amber
        : 'transparent';

  const attachmentCount = assignment.attachment != null ? 1 : 0;

  return (
    // D-3 contract: <article> as card container; interactive via button inside
    <article
      data-testid="assignment-card"
      className={['glass-panel rounded-lg relative overflow-hidden', isDone ? 'card-done' : '']
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: isDone ? 'rgba(16,185,129,0.1)' : '#1c1c1f',
        border: isDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        borderLeft:
          urgency === 'overdue' || urgency === 'dueSoon'
            ? `2px solid ${borderLeftColor}`
            : undefined,
      }}
    >
      {/* Interactive card body — button element satisfies a11y + keyboard requirements */}
      <button
        type="button"
        className="w-full text-left p-5 flex flex-col md:flex-row gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{
          transition:
            'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.2s ease, background-color 0.2s ease',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: 'inherit',
        }}
        onClick={() => onClick(assignment)}
        onMouseEnter={(e) => {
          const article = e.currentTarget.closest('article') as HTMLElement | null;
          if (article && !isDone) {
            article.style.borderColor = 'rgba(255,255,255,0.12)';
          }
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const article = e.currentTarget.closest('article') as HTMLElement | null;
          if (article && !isDone) {
            article.style.borderColor = 'rgba(255,255,255,0.06)';
          }
          e.currentTarget.style.transform = '';
        }}
      >
        {/* Overdue gradient overlay */}
        {urgency === 'overdue' && (
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, rgba(239,68,68,0.05) 0%, transparent 60%)',
            }}
          />
        )}

        {/* ── Left / main content ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <DueChip urgency={urgency} dueDate={assignment.dueDate} />
          </div>
          <h4
            className={[
              'text-[18px] font-bold mb-1 truncate leading-tight',
              isDone ? 'line-through' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              color: isDone ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.92)',
              textDecorationColor: isDone ? 'rgba(255,255,255,0.40)' : undefined,
            }}
          >
            {assignment.title}
          </h4>
          {assignment.description && (
            <p className="text-sm line-clamp-2 pr-4" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {assignment.description}
            </p>
          )}
        </div>

        {/* ── Right / controls ── */}
        <div
          className="flex flex-row md:flex-col items-center md:items-end justify-between shrink-0 gap-4 mt-4 md:mt-0 border-t border-hairline md:border-t-0 pt-4 md:pt-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Per-member status toggle — stopPropagation so click does not open modal */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper stopPropagation; checkbox/label handle keyboard */}
          <div
            data-testid="toggle-wrapper"
            className={[
              'flex items-center gap-3 px-3 py-2 rounded-md border cursor-default',
              isDone
                ? 'border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.1)]'
                : 'bg-surface-900 border-hairline',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              backgroundColor: isDone ? 'rgba(16,185,129,0.1)' : '#121214',
              borderColor: isDone ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium cursor-pointer select-none"
              style={{
                color: isDone ? '#10b981' : 'rgba(255,255,255,0.60)',
              }}
            >
              {isDone ? (
                <span className="flex items-center gap-1">
                  <CheckCircleFillIcon />
                  Completed
                </span>
              ) : (
                'Mark as Done'
              )}
            </label>
            <input
              type="checkbox"
              id={checkboxId}
              data-testid="status-toggle"
              className="status-toggle"
              checked={isDone}
              onChange={handleToggle}
            />
          </div>

          {/* Attachment badge */}
          {attachmentCount > 0 && (
            <div
              data-testid="attachment-badge"
              className="flex items-center gap-1 rounded border px-2 py-1 text-xs"
              style={{
                backgroundColor: '#121214',
                borderColor: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.60)',
              }}
            >
              <PaperclipIcon size={13} />
              {attachmentCount} {attachmentCount === 1 ? 'File' : 'Files'}
            </div>
          )}
        </div>
      </button>
    </article>
  );
}

// ---------------------------------------------------------------------------
// CheckCircleFillIcon — emerald fill check circle (Phosphor-style)
// ---------------------------------------------------------------------------

function CheckCircleFillIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm-1.5 14.06-4.28-4.28 1.41-1.41 2.87 2.87 6.12-6.12 1.41 1.41z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CSS classes referenced — must exist in globals.css or tailwind
// ---------------------------------------------------------------------------
// .glass-panel — defined in design/assignments-panel.html; replicated here via inline styles
// .card-done   — defined in design/assignments-panel.html; replicated via isDone check inline
// .hover-lift  — transition defined in design/assignments-panel.html; replicated via inline style
// .status-toggle — defined in design/assignments-panel.html; must be present in globals.css
