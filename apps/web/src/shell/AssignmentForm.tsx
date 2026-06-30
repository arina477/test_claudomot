/**
 * AssignmentForm — organizer create/edit modal for assignments.
 *
 * wave-22 M5 — D-3 GAP-FORM: build item, design intent from existing Modal + Form-field primitives.
 *
 * Fields: title (input), description (textarea), due date (datetime-local input),
 *         optional attachment (file upload via presign → PUT → key, reusing the wave-19 flow).
 *
 * Authz: rendered only when isOrganizer=true (owner OR manage_channels).
 *        Server always enforces; we gate the UI as a convenience.
 *
 * Modal chrome: surface-900, radius-lg, header/body/footer, primary action right,
 *               Esc-close, focus-trap, role="dialog" aria-modal.
 *
 * A11y: focus-trap via useEffect + keyboard listener; initial focus on title field.
 */

import type { Assignment, CreateAssignmentInput, UpdateAssignmentInput } from '@studyhall/shared';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { api } from '../auth/api';
import { PaperclipIcon, SpinnerIcon, XIcon } from './icons';

// ---------------------------------------------------------------------------
// Constants (mirror server side)
// ---------------------------------------------------------------------------

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);
const ACCEPT = [...ALLOWED_CONTENT_TYPES].join(',');

// ---------------------------------------------------------------------------
// Attachment upload state
// ---------------------------------------------------------------------------

type AttachUploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; progress: number }
  | { phase: 'done'; key: string; filename: string; contentType: string }
  | { phase: 'error'; message: string };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type AssignmentFormProps = {
  serverId: string;
  /** When provided — edit mode; when absent — create mode. */
  assignment?: Assignment;
  onSuccess: (saved: Assignment) => void;
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// AssignmentForm
// ---------------------------------------------------------------------------

export function AssignmentForm({ serverId, assignment, onSuccess, onClose }: AssignmentFormProps) {
  const titleId = useId();
  const descId = useId();
  const dueId = useId();
  const attachId = useId();

  // Form fields
  const [title, setTitle] = useState(assignment?.title ?? '');
  const [description, setDescription] = useState(assignment?.description ?? '');
  const [dueDate, setDueDate] = useState(() => {
    if (!assignment?.dueDate) return '';
    // datetime-local needs "YYYY-MM-DDTHH:mm"
    const d = new Date(assignment.dueDate);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
  });

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Attachment upload
  const [attachState, setAttachState] = useState<AttachUploadState>({ phase: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus trap
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title on open
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Esc to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Simple focus trap: keep Tab inside the dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));
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

  // ---------------------------------------------------------------------------
  // File handling — presign → PUT → record key
  // ---------------------------------------------------------------------------

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0];
      if (!file) return;
      // Reset file input so re-selecting the same file works
      e.currentTarget.value = '';

      if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
        setAttachState({ phase: 'error', message: `File type not allowed: ${file.type}` });
        return;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setAttachState({ phase: 'error', message: 'File too large (10 MB max)' });
        return;
      }

      setAttachState({ phase: 'uploading', progress: 0 });
      try {
        // 1. Presign
        const { uploadUrl, key } = await api.presignAssignmentAttachment(
          serverId,
          file.type,
          file.name,
        );
        setAttachState({ phase: 'uploading', progress: 40 });

        // 2. PUT to storage
        await api.putAssignmentAttachmentToStorage(uploadUrl, file);
        setAttachState({ phase: 'uploading', progress: 90 });

        // 3. Record key (no confirm endpoint for assignments — key IS the reference)
        setAttachState({ phase: 'done', key, filename: file.name, contentType: file.type });
      } catch (err) {
        setAttachState({
          phase: 'error',
          message: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    },
    [serverId],
  );

  function removeAttachment() {
    setAttachState({ phase: 'idle' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim()) {
      setSubmitError('Title is required.');
      return;
    }
    if (!dueDate) {
      setSubmitError('Due date is required.');
      return;
    }
    if (attachState.phase === 'uploading') {
      setSubmitError('Please wait for the attachment to finish uploading.');
      return;
    }

    const dueDateISO = new Date(dueDate).toISOString();

    setSubmitting(true);
    try {
      let saved: Assignment;
      if (assignment) {
        // Edit mode — PATCH
        const patch: UpdateAssignmentInput = {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDateISO,
          attachment:
            attachState.phase === 'done'
              ? {
                  key: attachState.key,
                  filename: attachState.filename,
                  contentType: attachState.contentType,
                }
              : null,
        };
        saved = await api.updateAssignment(assignment.id, patch);
      } else {
        // Create mode — POST
        const body: CreateAssignmentInput = {
          title: title.trim(),
          dueDate: dueDateISO,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(attachState.phase === 'done'
            ? {
                attachment: {
                  key: attachState.key,
                  filename: attachState.filename,
                  contentType: attachState.contentType,
                },
              }
            : {}),
        };
        saved = await api.createAssignment(serverId, body);
      }
      onSuccess(saved);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save assignment.');
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = !!assignment;

  return (
    /* Backdrop — role=presentation; Esc handled globally via useEffect */
    // biome-ignore lint/a11y/useKeyWithClickEvents: Esc handled in useEffect; backdrop click-outside is supplementary
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-form-title"
        data-testid="assignment-form-modal"
        className="w-full max-w-lg flex flex-col max-h-[90dvh] overflow-hidden"
        style={{
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, // --radius-lg
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation:
            'assignmentModalSlideUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            id="assignment-form-title"
            className="text-base font-semibold"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            {isEdit ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          <button
            type="button"
            aria-label="Close"
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

        {/* Body */}
        <form
          id="assignment-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 px-6 py-5 overflow-y-auto flex-1"
        >
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={titleId}
              className="text-[13px] font-medium"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              ref={titleInputRef}
              id={titleId}
              type="text"
              required
              maxLength={200}
              placeholder="e.g. Homework 4: Graph Traversals"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              className="h-10 w-full rounded-md px-3 text-sm outline-none transition-all duration-200 placeholder:opacity-40"
              style={{
                backgroundColor: '#0a0a0b',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.92)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={descId}
              className="text-[13px] font-medium"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Description
            </label>
            <textarea
              id={descId}
              rows={4}
              maxLength={2000}
              placeholder="Describe the assignment requirements…"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              className="w-full resize-none rounded-md px-3 py-2 text-sm outline-none transition-all duration-200 placeholder:opacity-40"
              style={{
                backgroundColor: '#0a0a0b',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.92)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Due date */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={dueId}
              className="text-[13px] font-medium"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Due Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id={dueId}
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.currentTarget.value)}
              className="h-10 w-full rounded-md px-3 text-sm outline-none transition-all duration-200"
              style={{
                backgroundColor: '#0a0a0b',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.92)',
                colorScheme: 'dark',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Attachment — optional */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Attachment (optional)
            </span>

            {attachState.phase === 'idle' && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.60)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
                }}
              >
                <PaperclipIcon size={16} />
                Attach file…
              </button>
            )}

            {attachState.phase === 'uploading' && (
              <div
                className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm"
                style={{
                  backgroundColor: '#0a0a0b',
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.60)',
                }}
              >
                <SpinnerIcon size={14} className="sh-animate-spin" />
                <span>Uploading… {attachState.progress}%</span>
              </div>
            )}

            {attachState.phase === 'done' && (
              <div
                className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm"
                style={{
                  backgroundColor: 'rgba(16,185,129,0.08)',
                  borderColor: 'rgba(16,185,129,0.20)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                <PaperclipIcon size={14} style={{ color: '#10b981' }} />
                <span className="flex-1 truncate">{attachState.filename}</span>
                <button
                  type="button"
                  aria-label="Remove attachment"
                  onClick={removeAttachment}
                  className="ml-auto shrink-0 transition-colors duration-150"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
                  }}
                >
                  <XIcon size={14} />
                </button>
              </div>
            )}

            {attachState.phase === 'error' && (
              <div
                role="alert"
                className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.20)',
                  color: '#f87171', // --danger-text
                }}
              >
                <span className="flex-1 truncate">{attachState.message}</span>
                <button
                  type="button"
                  aria-label="Dismiss error"
                  onClick={removeAttachment}
                  style={{ color: '#f87171' }}
                >
                  <XIcon size={14} />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              id={attachId}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={handleFileChange}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          {/* Submit error */}
          {submitError && (
            <p role="alert" className="text-xs" style={{ color: '#f87171' }}>
              {submitError}
            </p>
          )}
        </form>

        {/* Footer */}
        <footer
          className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={onClose}
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
            type="submit"
            form="assignment-form"
            disabled={submitting || attachState.phase === 'uploading'}
            className="h-9 px-5 rounded-md text-sm font-semibold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: submitting ? 'rgba(16,185,129,0.6)' : '#10b981',
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <SpinnerIcon size={14} className="sh-animate-spin" />
                {isEdit ? 'Saving…' : 'Creating…'}
              </span>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create Assignment'
            )}
          </button>
        </footer>
      </div>

      {/* Slide-up animation keyframes — scoped here to avoid polluting globals */}
      <style>{`
        @keyframes assignmentModalSlideUp {
          from { transform: scale(0.95) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes assignmentModalSlideUp {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
