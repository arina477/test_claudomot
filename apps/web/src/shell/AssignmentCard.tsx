/**
 * AssignmentCard — wave-22 M5 assignment card + wave-42 M9 student submit/return UI.
 *
 * Visual contract:
 *   - Card list (assignments-panel): glass-panel, urgency chip, status toggle, attachment badge.
 *   - Detail expand (wave-42): student submit control (text + optional attachment),
 *     own submission card (submitted-at, attachment chip, returned badge + comment),
 *     "Edit submission" resubmit affordance.
 *
 * Submit flow: presignSubmissionAttachment → PUT to storage → submitAssignment.
 * Resubmit: "Edit submission" resets to submit form prefilled with prior text/attachment.
 *
 * A11y: role/aria-live handled by parent via aria-live announcer region.
 */

import type { Assignment, AssignmentSubmission, SubmitAssignmentInput } from '@studyhall/shared';
import { useCallback, useId, useRef, useState } from 'react';
import { api } from '../auth/api';
import { ClockIcon, FileIcon, PaperclipIcon, SpinnerIcon, XIcon } from './icons';

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

/** Short formatted date+time for submission timestamp. */
function formatSubmittedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// DueChip — renders the correct chip or plain due line
// ---------------------------------------------------------------------------

function DueChip({ urgency, dueDate }: { urgency: UrgencyState; dueDate: string }) {
  if (urgency === 'done') {
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
    return (
      <span
        data-testid="chip-overdue"
        className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
        style={{
          backgroundColor: 'rgba(239,68,68,0.10)',
          color: '#f87171',
          borderColor: 'rgba(239,68,68,0.20)',
        }}
      >
        Overdue: {formatRelative(dueDate)}
      </span>
    );
  }
  if (urgency === 'dueSoon') {
    return (
      <span
        data-testid="chip-due-soon"
        className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
        style={{
          backgroundColor: 'rgba(245,158,11,0.10)',
          color: '#f59e0b',
          borderColor: 'rgba(245,158,11,0.20)',
        }}
      >
        <ClockIcon size={12} />
        Due {formatRelative(dueDate)}
      </span>
    );
  }
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
// Attachment upload state
// ---------------------------------------------------------------------------

const MAX_SUBMISSION_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_SUBMISSION_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);
const SUBMISSION_ACCEPT = [...ALLOWED_SUBMISSION_TYPES].join(',');

type AttachUploadState =
  | { phase: 'idle' }
  | { phase: 'uploading' }
  | { phase: 'done'; key: string; filename: string; contentType: string }
  | { phase: 'error'; message: string };

// ---------------------------------------------------------------------------
// StudentSubmitForm — inline submit control
// ---------------------------------------------------------------------------

type StudentSubmitFormProps = {
  assignmentId: string;
  serverId: string;
  /** Pre-fill from existing submission when editing. */
  prefillText?: string | undefined;
  /** Announce messages for a11y (screen reader live region). */
  onAnnounce: (msg: string) => void;
  onSubmitSuccess: (submission: AssignmentSubmission) => void;
  onCancel?: (() => void) | undefined;
};

function StudentSubmitForm({
  assignmentId,
  serverId,
  prefillText,
  onAnnounce,
  onSubmitSuccess,
  onCancel,
}: StudentSubmitFormProps) {
  const textareaId = useId();
  const [text, setText] = useState(prefillText ?? '');
  const [attachState, setAttachState] = useState<AttachUploadState>({ phase: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0];
      if (!file) return;
      e.currentTarget.value = '';

      if (!ALLOWED_SUBMISSION_TYPES.has(file.type)) {
        setAttachState({ phase: 'error', message: `File type not allowed: ${file.type}` });
        onAnnounce('File type not allowed.');
        return;
      }
      if (file.size > MAX_SUBMISSION_BYTES) {
        setAttachState({ phase: 'error', message: 'File exceeds 10 MB limit.' });
        onAnnounce('File exceeds 10 MB limit.');
        return;
      }

      setAttachState({ phase: 'uploading' });
      onAnnounce('Uploading attachment…');
      try {
        const { uploadUrl, key } = await api.presignSubmissionAttachment(
          serverId,
          file.type,
          file.name,
        );
        await api.putSubmissionAttachmentToStorage(uploadUrl, file);
        setAttachState({ phase: 'done', key, filename: file.name, contentType: file.type });
        onAnnounce(`${file.name} attached successfully.`);
      } catch (err) {
        setAttachState({
          phase: 'error',
          message: err instanceof Error ? err.message : 'Upload failed.',
        });
        onAnnounce('Attachment upload failed.');
      }
    },
    [serverId, onAnnounce],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (attachState.phase === 'uploading') {
      setSubmitError('Please wait for the attachment to finish uploading.');
      return;
    }

    const hasText = text.trim().length > 0;
    const hasAttachment = attachState.phase === 'done';
    if (!hasText && !hasAttachment) {
      setSubmitError('Please add a note or attach a file before submitting.');
      return;
    }

    const body: SubmitAssignmentInput = {
      text: hasText ? text.trim() : null,
      attachment: hasAttachment
        ? {
            key: attachState.key,
            filename: attachState.filename,
            contentType: attachState.contentType,
          }
        : null,
    };

    setSubmitting(true);
    onAnnounce('Submitting assignment…');
    try {
      const submission = await api.submitAssignment(assignmentId, body);
      onAnnounce('Assignment submitted successfully.');
      onSubmitSuccess(submission);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setSubmitError(msg);
      onAnnounce('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="student-submit-form"
      style={{
        backgroundColor: '#121214',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <label htmlFor={textareaId} className="sr-only">
        Submission note (optional if attaching a file)
      </label>
      <textarea
        id={textareaId}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        placeholder="Add a note for your educator (optional)…"
        rows={3}
        className="w-full resize-none outline-none p-3 text-sm"
        style={{
          background: 'transparent',
          color: 'rgba(255,255,255,0.92)',
        }}
        onFocus={(e) => {
          const form = e.currentTarget.closest('form');
          if (form) {
            (form as HTMLElement).style.borderColor = '#10b981';
            (form as HTMLElement).style.boxShadow = '0 0 0 2px rgba(16,185,129,0.2)';
          }
        }}
        onBlur={(e) => {
          const form = e.currentTarget.closest('form');
          if (form) {
            (form as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
            (form as HTMLElement).style.boxShadow = 'none';
          }
        }}
      />

      {/* Attachment preview */}
      {attachState.phase === 'done' && (
        <div
          className="mx-3 mb-3 px-3 py-2 rounded-md flex items-center justify-between gap-2"
          style={{
            backgroundColor: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.20)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon size={14} style={{ color: '#10b981', flexShrink: 0 }} />
            <span className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {attachState.filename}
            </span>
          </div>
          <button
            type="button"
            aria-label="Remove attachment"
            onClick={() => {
              setAttachState({ phase: 'idle' });
              if (fileInputRef.current) fileInputRef.current.value = '';
              onAnnounce('Attachment removed.');
            }}
            className="shrink-0 flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
            }}
          >
            <XIcon size={12} />
          </button>
        </div>
      )}

      {/* Uploading indicator */}
      {attachState.phase === 'uploading' && (
        <div
          className="mx-3 mb-3 px-3 py-2 rounded-md flex items-center gap-2 text-sm"
          style={{
            backgroundColor: '#0a0a0b',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.60)',
          }}
        >
          <SpinnerIcon size={13} className="sh-animate-spin" />
          <span>Uploading…</span>
        </div>
      )}

      {/* File upload error */}
      {attachState.phase === 'error' && (
        <div
          role="alert"
          className="mx-3 mb-3 px-3 py-2 rounded-md flex items-center gap-2 text-xs"
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.20)',
            color: '#f87171',
          }}
        >
          <span className="flex-1">{attachState.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setAttachState({ phase: 'idle' })}
            style={{ color: '#f87171' }}
          >
            <XIcon size={12} />
          </button>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <p role="alert" className="mx-3 mb-3 text-xs" style={{ color: '#f87171' }}>
          {submitError}
        </p>
      )}

      {/* Bottom toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-1">
          {/* Attach button */}
          {attachState.phase === 'idle' || attachState.phase === 'error' ? (
            <label
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors"
              style={{ color: 'rgba(255,255,255,0.60)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#27272a';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.60)';
              }}
            >
              <PaperclipIcon size={15} />
              <span>Attach file</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={SUBMISSION_ACCEPT}
                className="sr-only"
                onChange={handleFileChange}
                tabIndex={-1}
                aria-hidden="true"
              />
            </label>
          ) : null}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.60)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || attachState.phase === 'uploading'}
          data-testid="submit-assignment-btn"
          className="flex items-center gap-1.5 h-8 px-4 rounded-md text-sm font-semibold transition-all"
          style={{
            backgroundColor: submitting ? 'rgba(16,185,129,0.6)' : '#10b981',
            color: '#0a0a0b',
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? (
            <>
              <SpinnerIcon size={13} className="sh-animate-spin" />
              <span>Submitting…</span>
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// OwnSubmissionCard — shows student's submitted work + returned state
// ---------------------------------------------------------------------------

type OwnSubmissionCardProps = {
  submission: AssignmentSubmission;
  onEditSubmission: () => void;
};

function OwnSubmissionCard({ submission, onEditSubmission }: OwnSubmissionCardProps) {
  const isReturned = submission.returnedAt != null;

  return (
    <div
      data-testid="own-submission-card"
      className="flex flex-col gap-3"
      style={{
        backgroundColor: '#121214',
        border: isReturned ? '1px solid rgba(16,185,129,0.20)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Returned left-edge accent bar */}
      {isReturned && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: '#10b981',
          }}
        />
      )}

      <div className="px-4 pt-4" style={isReturned ? { paddingLeft: 20 } : undefined}>
        {/* Returned badge */}
        {isReturned && (
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircleFillIcon />
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: '#10b981' }}
            >
              Returned
            </span>
            {submission.returnedAt && (
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                · {formatSubmittedAt(submission.returnedAt)}
              </span>
            )}
          </div>
        )}

        {/* Submission header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Your submission
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {formatSubmittedAt(submission.submittedAt)}
          </span>
        </div>

        {/* Submission text */}
        {submission.text && (
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {submission.text}
          </p>
        )}

        {/* Attachment chip */}
        {submission.attachment && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md mb-3"
            style={{
              backgroundColor: '#1c1c1f',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <FileIcon size={13} style={{ color: 'rgba(255,255,255,0.60)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {submission.attachment.filename}
            </span>
          </div>
        )}

        {/* Educator comment (returned state) */}
        {isReturned && submission.organizerComment && (
          <blockquote
            className="mt-1 mb-3 px-3 py-3 rounded-md text-[13px] leading-relaxed"
            style={{
              backgroundColor: 'rgba(16,185,129,0.06)',
              borderLeft: '2px solid rgba(16,185,129,0.40)',
              color: 'rgba(255,255,255,0.80)',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{submission.organizerComment}&rdquo;
          </blockquote>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex justify-end px-4 py-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          type="button"
          data-testid="edit-submission-btn"
          onClick={onEditSubmission}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.60)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
          }}
        >
          Edit submission
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type AssignmentCardProps = {
  assignment: Assignment;
  /** Server id for submission presign endpoint. Defaults to empty string (no-op for tests). */
  serverId?: string;
  /** Called after status toggle PUT succeeds — caller updates list state. */
  onStatusChange: (id: string, state: 'todo' | 'done') => void;
  /** Called when the card body (not the toggle wrapper) is clicked — opens detail modal. */
  onClick: (assignment: Assignment) => void;
  /** Announce messages for a11y live region (parent owns). */
  onAnnounce?: (msg: string) => void;
};

// ---------------------------------------------------------------------------
// AssignmentCard
// ---------------------------------------------------------------------------

export function AssignmentCard({
  assignment,
  serverId = '',
  onStatusChange,
  onClick,
  onAnnounce,
}: AssignmentCardProps) {
  const checkboxId = useId();
  const isDone = assignment.myStatus === 'done';
  const urgency = getUrgency(assignment.dueDate, isDone);

  // Submission local state — synced from assignment.mySubmission; updated on submit
  const [submission, setSubmission] = useState<AssignmentSubmission | null | undefined>(
    assignment.mySubmission,
  );
  // editing = show submit form (either first submit or resubmit)
  const [editing, setEditing] = useState(false);

  const announce = onAnnounce ?? (() => {});

  const handleToggle = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newState = e.currentTarget.checked ? 'done' : ('todo' as const);
      onStatusChange(assignment.id, newState);
      try {
        await api.setAssignmentStatus(assignment.id, { state: newState });
      } catch (err) {
        console.error('[AssignmentCard] status toggle failed', err);
        onStatusChange(assignment.id, newState === 'done' ? 'todo' : 'done');
      }
    },
    [assignment.id, onStatusChange],
  );

  const handleSubmitSuccess = useCallback((sub: AssignmentSubmission) => {
    setSubmission(sub);
    setEditing(false);
  }, []);

  const borderLeftColor =
    urgency === 'overdue' ? '#ef4444' : urgency === 'dueSoon' ? '#f59e0b' : 'transparent';

  const attachmentCount = assignment.attachment != null ? 1 : 0;

  return (
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
      {/* Interactive card body */}
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

        {/* Left / main content */}
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

        {/* Right / controls */}
        <div
          className="flex flex-row md:flex-col items-center md:items-end justify-between shrink-0 gap-4 mt-4 md:mt-0 border-t border-hairline md:border-t-0 pt-4 md:pt-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Per-member status toggle */}
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

      {/* Student submission section — below the card body, not inside the button */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: click-stop only; keyboard handled by children */}
      <div className="px-5 pb-5" onClick={(e) => e.stopPropagation()}>
        <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <h5 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Your Work
          </h5>

          {/* Show submit form when: no submission yet OR explicitly editing */}
          {(submission == null || editing) && (
            <StudentSubmitForm
              assignmentId={assignment.id}
              serverId={serverId}
              prefillText={editing && submission?.text ? submission.text : undefined}
              onAnnounce={announce}
              onSubmitSuccess={handleSubmitSuccess}
              onCancel={editing ? () => setEditing(false) : undefined}
            />
          )}

          {/* Show own submission card when submitted and not editing */}
          {submission != null && !editing && (
            <OwnSubmissionCard submission={submission} onEditSubmission={() => setEditing(true)} />
          )}
        </div>
      </div>
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
