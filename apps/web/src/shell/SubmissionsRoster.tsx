/**
 * SubmissionsRoster — educator-only submissions roster for an assignment (wave-42 M9).
 *
 * Visual contract: design/assignment-submissions.html § RIGHT COLUMN (educator roster).
 *
 * Gate: rendered only when the viewer holds manage_assignments (caller checks + passes
 *       isOrganizer={true}).  The backend also enforces (403 on list/return endpoints).
 *
 * Layout:
 *   - Header: "Submissions Roster" + returned/total count chip.
 *   - Rows: avatar + display name + submitted-at + text/attachment preview + status badge.
 *     - Amber "Awaiting" badge for unretirned submissions.
 *     - Emerald "Returned" badge for returned submissions (row dimmed).
 *     - Hover: "Return" button reveals (opacity-0 → 1 on hover; always visible focus-visible).
 *   - Empty state: tray icon + "No submissions yet." text.
 *   - 403 (non-organizer) renders nothing (caller gates rendering).
 *   - Loading: shimmer skeleton rows.
 *   - Return dialog: role=dialog aria-modal, focus trap, Esc close + refocus trigger,
 *     aria-live announcements.
 *
 * A11y checklist:
 *   - role="dialog" aria-modal="true" aria-labelledby on return dialog.
 *   - Focus trap: Tab cycles inside dialog; Shift+Tab wraps.
 *   - Esc closes dialog + returns focus to trigger button.
 *   - aria-live="polite" announcer region for status changes.
 *   - "Return" trigger: aria-haspopup="dialog"; aria-expanded when open.
 */

import type { AssignmentSubmission, AssignmentSubmissionRosterRow } from '@studyhall/shared';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { api } from '../auth/api';
import { FileIcon, PaperclipIcon, SpinnerIcon, XIcon } from './icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

function formatRelativeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// ReturnDialog — role=dialog with focus trap
// ---------------------------------------------------------------------------

type ReturnDialogProps = {
  assignmentId: string;
  submissionId: string;
  /** Submitter displayName (may be empty — falls back to username). */
  studentName: string;
  /** Submitter username (used when displayName is blank). */
  studentUsername: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onReturned: (updated: AssignmentSubmission) => void;
  onAnnounce: (msg: string) => void;
};

function ReturnDialog({
  assignmentId,
  submissionId,
  studentName,
  studentUsername,
  triggerRef,
  onClose,
  onReturned,
  onAnnounce,
}: ReturnDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  // Fall back to username when displayName is blank (no empty "Return to" slot)
  const resolvedName = studentName.trim() || studentUsername.trim() || 'student';
  const firstName = resolvedName.split(' ')[0] ?? resolvedName;

  // Focus textarea on open
  useEffect(() => {
    const t = setTimeout(() => commentRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Esc + outside-click close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
        onAnnounce('Return dialog closed.');
      }
    }
    function handleMouseDown(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose, onAnnounce, triggerRef]);

  // Focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])',
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReturnError(null);
    setSubmitting(true);
    onAnnounce('Processing return…');
    try {
      const updated = await api.returnSubmission(assignmentId, submissionId, {
        comment: comment.trim() || null,
      });
      onAnnounce(`Submission marked as returned for ${firstName}.`);
      onReturned(updated);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't return submission — try again.";
      setReturnError(msg);
      onAnnounce("Couldn't return submission. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    onClose();
    triggerRef.current?.focus();
    onAnnounce('Return dialog closed.');
  }

  return (
    /* Backdrop
     * Positioning note: design/assignment-submissions.html uses an anchored-popover
     * (fixed, positioned near the trigger row). This implementation uses the accepted
     * modal-equivalent (centered overlay + focus-trap). Both are design-approved
     * equivalents; the modal form avoids viewport-edge clipping on narrow layouts. */
    // biome-ignore lint/a11y/useKeyWithClickEvents: Esc handled in useEffect; backdrop is supplementary
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: click-stop on dialog panel; keyboard handled by dialog keydown listener */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="return-dialog"
        className="w-full max-w-sm flex flex-col"
        style={{
          backgroundColor: '#27272a',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'returnDialogIn 0.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            id={titleId}
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            <ReturnIcon />
            Return to <span style={{ color: '#10b981' }}>{firstName}</span>
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={handleClose}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
            }}
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Body */}
        <form id="return-form" onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-3">
          <div>
            <label htmlFor="return-comment-textarea" className="sr-only">
              Acknowledgement comment (optional)
            </label>
            <textarea
              ref={commentRef}
              id="return-comment-textarea"
              value={comment}
              onChange={(e) => setComment(e.currentTarget.value)}
              placeholder="Add an acknowledgement note (optional)…"
              rows={3}
              className="w-full resize-none rounded-md outline-none px-3 py-2.5 text-[13px]"
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.92)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                // --glow-focus spec: alpha 0.4 (design/assignment-submissions.html §--glow-focus)
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {returnError && (
            <p role="alert" className="text-xs" style={{ color: '#f87171' }}>
              {returnError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                color: 'rgba(255,255,255,0.60)',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-testid="return-submit-btn"
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: submitting ? 'rgba(16,185,129,0.6)' : '#10b981',
                color: '#0a0a0b',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <SpinnerIcon size={11} className="sh-animate-spin" />
                  Returning…
                </>
              ) : (
                'Mark Returned'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes returnDialogIn {
          from { transform: scale(0.96) translateY(-6px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes returnDialogIn { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RosterRow — one submission row
// ---------------------------------------------------------------------------

type RosterRowProps = {
  row: AssignmentSubmissionRosterRow;
  assignmentId: string;
  onReturned: (userId: string, updated: AssignmentSubmission) => void;
  onAnnounce: (msg: string) => void;
};

function RosterRow({ row, assignmentId, onReturned, onAnnounce }: RosterRowProps) {
  const isReturned = row.returnedAt != null;
  const [dialogOpen, setDialogOpen] = useState(false);
  const returnTriggerRef = useRef<HTMLButtonElement>(null);

  const initials = getInitials(row.submitter.displayName);

  function handleReturnClick() {
    setDialogOpen(true);
    onAnnounce(`Return dialog opened for ${row.submitter.displayName}. Press Escape to cancel.`);
  }

  function handleClose() {
    setDialogOpen(false);
  }

  function handleReturned(updated: AssignmentSubmission) {
    onReturned(row.submitter.userId, updated);
  }

  return (
    <div
      data-testid={`roster-row-${row.submitter.userId}`}
      className="flex items-center px-3 py-2.5 rounded-lg group transition-colors"
      style={{
        border: '1px solid transparent',
        opacity: isReturned ? 0.75 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '#27272a';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
      }}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-semibold"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
      >
        {row.submitter.avatarUrl ? (
          <img
            src={row.submitter.avatarUrl}
            alt={row.submitter.displayName}
            className="w-full h-full object-cover"
            style={{ filter: isReturned ? 'grayscale(40%) brightness(75%)' : undefined }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Name + submission preview */}
      <div className="ml-3 flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            {row.submitter.displayName}
          </span>
          <span
            className="text-xs whitespace-nowrap shrink-0"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {formatRelativeShort(row.submittedAt)}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 mt-0.5 text-xs truncate"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          {row.attachment ? (
            <>
              <PaperclipIcon size={11} />
              <span className="truncate">{row.attachment.filename}</span>
            </>
          ) : row.text ? (
            <>
              <FileIcon size={11} />
              <span className="truncate italic">&ldquo;{row.text.slice(0, 60)}&rdquo;</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Right: status badge + return button */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {isReturned ? (
          /* Returned badge */
          <div className="flex items-center gap-1.5">
            <CheckCircleFillIconSmall />
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: '#10b981' }}
            >
              Returned
            </span>
          </div>
        ) : (
          /* Awaiting badge */
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{
              backgroundColor: '#27272a',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: '#f59e0b',
                boxShadow: '0 0 6px rgba(245,158,11,0.5)',
              }}
            />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Awaiting
            </span>
          </div>
        )}

        {/* Return trigger — hidden until hover; always visible on focus */}
        {!isReturned && (
          <button
            ref={returnTriggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={dialogOpen}
            data-testid={`return-trigger-${row.submitter.userId}`}
            onClick={handleReturnClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            style={{
              backgroundColor: '#1c1c1f',
              border: '1px solid transparent',
              color: 'rgba(255,255,255,0.60)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(16,185,129,0.10)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.30)';
              (e.currentTarget as HTMLButtonElement).style.color = '#10b981';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1c1c1f';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
            }}
          >
            <ReturnIcon size={13} />
            <span className="hidden sm:inline">Return</span>
          </button>
        )}
      </div>

      {/* Return dialog — portal-like fixed overlay */}
      {dialogOpen && (
        <ReturnDialog
          assignmentId={assignmentId}
          submissionId={row.id}
          studentName={row.submitter.displayName}
          studentUsername={row.submitter.username}
          triggerRef={returnTriggerRef}
          onClose={handleClose}
          onReturned={handleReturned}
          onAnnounce={onAnnounce}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SubmissionsRoster — main component
// ---------------------------------------------------------------------------

type Props = {
  assignmentId: string;
  /** Caller confirms the viewer has manage_assignments; no-render guard. */
  isOrganizer: boolean;
  /** Optional aria-live announcer callback (parent owns the live region). */
  onAnnounce?: (msg: string) => void;
};

export function SubmissionsRoster({ assignmentId, isOrganizer, onAnnounce }: Props) {
  const announce = onAnnounce ?? (() => {});
  const [rows, setRows] = useState<AssignmentSubmissionRosterRow[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOrganizer || !assignmentId) return;
    setLoadStatus('loading');
    api
      .listAssignmentSubmissions(assignmentId)
      .then(({ submissions }) => {
        if (!mountedRef.current) return;
        setRows(submissions);
        setLoadStatus('loaded');
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setLoadStatus('error');
      });
  }, [assignmentId, isOrganizer]);

  const handleReturned = useCallback((userId: string, updated: AssignmentSubmission) => {
    setRows((prev) =>
      prev.map((r) =>
        r.submitter.userId === userId
          ? { ...r, returnedAt: updated.returnedAt, organizerComment: updated.organizerComment }
          : r,
      ),
    );
  }, []);

  if (!isOrganizer) return null;

  const returnedCount = rows.filter((r) => r.returnedAt != null).length;
  const totalCount = rows.length;

  return (
    <div
      data-testid="submissions-roster"
      className="flex flex-col min-h-0"
      style={{
        backgroundColor: '#0a0a0b',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          backgroundColor: 'rgba(18,18,20,0.50)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Submissions Roster
          </h2>
          {loadStatus === 'loaded' && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.60)',
              }}
            >
              {returnedCount}/{totalCount}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 relative" style={{ minHeight: 200 }}>
        {/* Loading */}
        {loadStatus === 'loading' && (
          <div
            className="flex flex-col gap-2 p-2 animate-pulse"
            aria-busy="true"
            aria-label="Loading submissions"
            data-testid="submissions-skeleton"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" aria-hidden="true">
                <div
                  className="w-8 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: '#27272a' }}
                />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded" style={{ backgroundColor: '#27272a' }} />
                  <div
                    className="h-2.5 w-48 rounded"
                    style={{ backgroundColor: 'rgba(39,39,42,0.50)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {loadStatus === 'error' && (
          <div
            className="flex flex-col items-center justify-center p-8 text-center"
            data-testid="submissions-error"
          >
            <p className="text-sm" style={{ color: '#f87171' }}>
              Couldn&apos;t load submissions.
            </p>
          </div>
        )}

        {/* Empty */}
        {loadStatus === 'loaded' && rows.length === 0 && (
          <div
            data-testid="submissions-empty"
            className="flex flex-col items-center justify-center p-12 text-center"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{
                backgroundColor: '#121214',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              aria-hidden="true"
            >
              <TrayIcon />
            </div>
            <h3 className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
              No submissions yet
            </h3>
            <p className="text-sm mt-1 max-w-[200px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Students haven&apos;t submitted against this assignment.
            </p>
          </div>
        )}

        {/* Loaded rows */}
        {loadStatus === 'loaded' &&
          rows.length > 0 &&
          rows.map((row) => (
            <RosterRow
              key={row.submitter.userId}
              row={row}
              assignmentId={assignmentId}
              onReturned={handleReturned}
              onAnnounce={announce}
            />
          ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline icons (keep SubmissionsRoster self-contained for the new icons)
// ---------------------------------------------------------------------------

function CheckCircleFillIconSmall() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="#10b981" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm-1.5 14.06-4.28-4.28 1.41-1.41 2.87 2.87 6.12-6.12 1.41 1.41z" />
    </svg>
  );
}

function ReturnIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Arrow U-turn left (ph-arrow-u-turn-left equivalent) */}
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function TrayIcon() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'rgba(255,255,255,0.40)' }}
      aria-hidden="true"
    >
      <polyline points="21 15 21 21 3 21 3 15" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
