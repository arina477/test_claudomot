/**
 * SessionForm — organizer create/edit modal for scheduled sessions.
 *
 * wave-43 M10 — mirrors AssignmentForm.tsx structure + design/class-scheduling.html
 * authoring modal contract.
 *
 * Fields: title (input), description (textarea), date (date), startTime (time),
 *         endTime (time), recurrence (select: none|weekly), recurrenceUntil (date,
 *         revealed only when recurrence=weekly).
 *
 * Authz: rendered only when isOrganizer=true (manage_assignments).
 *        Server enforces; UI gate is convenience only.
 *
 * Modal chrome: surface-900, radius-lg, header/body/footer, primary action right,
 *               Esc-close, focus-trap, role="dialog" aria-modal.
 *
 * A11y: focus-trap via useEffect + keyboard listener; initial focus on title field;
 *       aria-live announcer for async status; inline error on endsAt <= startsAt.
 *
 * Inline validation:
 *   - endsAt must be after startsAt (cross-field refine)
 *   - recurrenceUntil (when weekly) must be >= startsAt date
 *   - save-failed API error shown in aria-live alert region
 */

import type {
  CreateScheduledSessionInput,
  ScheduledSession,
  UpdateScheduledSessionInput,
} from '@studyhall/shared';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { api } from '../auth/api';
import { ArrowsClockwiseIcon, CalendarIcon, ClockIcon, SpinnerIcon, XIcon } from './icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert ISO string "2026-07-04T14:00:00Z" → "2026-07-04" local date string. */
function isoToDateLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

/** Convert ISO string → "HH:mm" local time string. */
function isoToTimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Combine a date string "YYYY-MM-DD" + time string "HH:mm" → ISO string (local → UTC). */
function dateTimeToISO(date: string, time: string): string {
  if (!date || !time) return '';
  return new Date(`${date}T${time}`).toISOString();
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type SessionFormProps = {
  serverId: string;
  /** When provided — edit mode; when absent — create mode. */
  session?: ScheduledSession;
  onSuccess: (saved: ScheduledSession) => void;
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// SessionForm
// ---------------------------------------------------------------------------

export function SessionForm({ serverId, session, onSuccess, onClose }: SessionFormProps) {
  const titleId = useId();
  const descId = useId();
  const dateId = useId();
  const startId = useId();
  const endId = useId();
  const recurrenceId = useId();
  const untilId = useId();
  const errorId = useId();

  // Form fields
  const [title, setTitle] = useState(session?.title ?? '');
  const [description, setDescription] = useState(session?.description ?? '');
  const [date, setDate] = useState(() => (session ? isoToDateLocal(session.startsAt) : ''));
  const [startTime, setStartTime] = useState(() =>
    session ? isoToTimeLocal(session.startsAt) : '',
  );
  const [endTime, setEndTime] = useState(() => (session ? isoToTimeLocal(session.endsAt) : ''));
  const [recurrence, setRecurrence] = useState<'none' | 'weekly'>(session?.recurrence ?? 'none');
  const [recurrenceUntil, setRecurrenceUntil] = useState(() =>
    session?.recurrenceUntil ? isoToDateLocal(session.recurrenceUntil) : '',
  );

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Focus trap + initial focus
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // aria-live announcer
  const announcerRef = useRef<HTMLDivElement>(null);
  const announce = useCallback((msg: string) => {
    if (!announcerRef.current) return;
    announcerRef.current.textContent = msg;
    setTimeout(() => {
      if (announcerRef.current?.textContent === msg) {
        announcerRef.current.textContent = '';
      }
    }, 4000);
  }, []);

  // Focus title on open
  useEffect(() => {
    const t = setTimeout(() => titleInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Esc to close — restore focus is handled by the caller via onClose
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Focus trap: keep Tab inside the dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
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
    dialog.addEventListener('keydown', handleTab);
    return () => dialog.removeEventListener('keydown', handleTab);
  }, []);

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
    if (!date) {
      setSubmitError('Date is required.');
      return;
    }
    if (!startTime) {
      setSubmitError('Start time is required.');
      return;
    }
    if (!endTime) {
      setSubmitError('End time is required.');
      return;
    }

    const startsAt = dateTimeToISO(date, startTime);
    const endsAt = dateTimeToISO(date, endTime);

    if (!startsAt || !endsAt) {
      setSubmitError('Invalid date or time.');
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      setSubmitError('End time must be after start time.');
      announce('Error: End time must be after start time.');
      return;
    }

    const recurrenceUntilISO =
      recurrence === 'weekly' && recurrenceUntil
        ? new Date(`${recurrenceUntil}T23:59:59`).toISOString()
        : null;

    if (recurrenceUntilISO && new Date(recurrenceUntilISO) < new Date(startsAt)) {
      setSubmitError('Repeat-until date must be on or after the session date.');
      announce('Error: Repeat-until date must be on or after the session date.');
      return;
    }

    setSubmitting(true);
    announce('Saving session…');

    try {
      let saved: ScheduledSession;
      if (session) {
        // Edit mode — PATCH
        const patch: UpdateScheduledSessionInput = {
          title: title.trim(),
          description: description.trim() || null,
          startsAt,
          endsAt,
          recurrence,
          recurrenceUntil: recurrenceUntilISO,
        };
        saved = await api.updateSession(session.id, patch);
      } else {
        // Create mode — POST
        const body: CreateScheduledSessionInput = {
          title: title.trim(),
          description: description.trim() || null,
          startsAt,
          endsAt,
          recurrence,
          recurrenceUntil: recurrenceUntilISO,
        };
        saved = await api.createSession(serverId, body);
      }
      announce('Session saved.');
      onSuccess(saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save session.';
      setSubmitError(msg);
      announce(`Save failed. ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = !!session;

  // Input style helpers
  const inputBase: React.CSSProperties = {
    backgroundColor: '#0a0a0b',
    border: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.92)',
    colorScheme: 'dark',
  };

  function onFocusStyle(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    e.currentTarget.style.borderColor = '#10b981';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.2)';
  }

  function onBlurStyle(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
    e.currentTarget.style.boxShadow = 'none';
  }

  return (
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
        aria-labelledby="session-form-title"
        data-testid="session-form-modal"
        className="w-full max-w-lg flex flex-col max-h-[90dvh] overflow-hidden"
        style={{
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'sessionModalSlideUp 0.35s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            id="session-form-title"
            className="text-base font-semibold"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            {isEdit ? 'Edit session' : 'New session'}
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
          id="session-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 px-6 py-5 overflow-y-auto flex-1"
        >
          {/* Inline error / save-failed alert */}
          {submitError && (
            <div
              id={errorId}
              role="alert"
              className="flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.20)',
                color: '#f87171',
              }}
            >
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{submitError}</span>
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={titleId}
              className="text-[13px] font-medium"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Session Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              ref={titleInputRef}
              id={titleId}
              type="text"
              required
              maxLength={200}
              placeholder="e.g. CS492 Architecture Review"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              className="h-10 w-full rounded-md px-3 text-sm outline-none transition-all duration-200 placeholder:opacity-40"
              style={inputBase}
              onFocus={onFocusStyle}
              onBlur={onBlurStyle}
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
              rows={3}
              maxLength={2000}
              placeholder="Add context or prerequisites for members…"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              className="w-full resize-none rounded-md px-3 py-2 text-sm outline-none transition-all duration-200 placeholder:opacity-40"
              style={inputBase}
              onFocus={onFocusStyle}
              onBlur={onBlurStyle}
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={dateId}
              className="text-[13px] font-medium"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Date <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="relative">
              <input
                id={dateId}
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.currentTarget.value)}
                className="h-10 w-full rounded-md pl-10 pr-3 text-sm outline-none transition-all duration-200"
                style={inputBase}
                onFocus={onFocusStyle}
                onBlur={onBlurStyle}
              />
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                <CalendarIcon size={16} />
              </span>
            </div>
          </div>

          {/* Start / End Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={startId}
                className="text-[13px] font-medium"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                Start Time <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="relative">
                <input
                  id={startId}
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.currentTarget.value)}
                  className="h-10 w-full rounded-md pl-10 pr-3 text-sm outline-none transition-all duration-200"
                  style={inputBase}
                  onFocus={onFocusStyle}
                  onBlur={onBlurStyle}
                />
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  <ClockIcon size={16} />
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={endId}
                className="text-[13px] font-medium"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                End Time <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="relative">
                <input
                  id={endId}
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.currentTarget.value)}
                  className="h-10 w-full rounded-md pl-10 pr-3 text-sm outline-none transition-all duration-200"
                  style={inputBase}
                  onFocus={onFocusStyle}
                  onBlur={onBlurStyle}
                />
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  <ClockIcon size={16} />
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* Recurrence section */}
          <div
            className="flex flex-col gap-4 rounded-lg p-4"
            style={{
              backgroundColor: 'rgba(28,28,31,0.50)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={recurrenceId}
                className="text-[13px] font-medium"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                Recurrence
              </label>
              <div className="relative">
                <select
                  id={recurrenceId}
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.currentTarget.value as 'none' | 'weekly')}
                  className="h-10 w-full appearance-none rounded-md pl-10 pr-8 text-sm outline-none transition-all duration-200"
                  style={inputBase}
                  onFocus={onFocusStyle}
                  onBlur={onBlurStyle}
                >
                  <option value="none">Does not repeat (One-off)</option>
                  <option value="weekly">Weekly</option>
                </select>
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  <ArrowsClockwiseIcon size={16} />
                </span>
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </div>
            </div>

            {/* Repeat-until — only visible when weekly */}
            {recurrence === 'weekly' && (
              <div
                className="flex flex-col gap-1.5 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <label
                  htmlFor={untilId}
                  className="flex items-center justify-between text-[13px] font-medium"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  Repeat Until
                  <span
                    className="text-[11px] font-normal"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    (Optional)
                  </span>
                </label>
                <div className="relative">
                  <input
                    id={untilId}
                    type="date"
                    value={recurrenceUntil}
                    onChange={(e) => setRecurrenceUntil(e.currentTarget.value)}
                    className="h-10 w-full rounded-md pl-10 pr-3 text-sm outline-none transition-all duration-200"
                    style={inputBase}
                    onFocus={onFocusStyle}
                    onBlur={onBlurStyle}
                  />
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    <CalendarIcon size={16} />
                  </span>
                </div>
              </div>
            )}
          </div>
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
            form="session-form"
            disabled={submitting}
            className="h-9 px-5 rounded-md text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: submitting ? 'rgba(16,185,129,0.6)' : '#10b981',
              color: '#0a0a0b',
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
              'Create Session'
            )}
          </button>
        </footer>

        {/* aria-live polite announcer */}
        <div ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes sessionModalSlideUp {
          from { transform: scale(0.95) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes sessionModalSlideUp {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
