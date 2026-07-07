/**
 * ReportDialog — modal for filing a report against a server, member, or message.
 *
 * Design canonical: design/moderation-report.html (D-3 APPROVED wave-69)
 *
 * ONE dialog serves all 3 target types; callers supply:
 *   targetType  — 'server' | 'member' | 'message'
 *   targetId    — the id for the matching target type
 *   serverId    — required for 'server' reports; optional context for 'member'/'message'
 *   displayLabel — human-readable name of the thing being reported (shown in subtitle)
 *   onClose     — called to dismiss the dialog
 *   triggerRef  — optional ref to restore focus on close
 *
 * States:
 *   default     — empty form, textarea focused
 *   validation  — empty reason submitted: inline error + input-error ring
 *   submitting  — spinner on Submit, button disabled (prevents double-submit)
 *   success     — success toast (role=status/polite) + dialog closes
 *   error       — error toast (role=alert/assertive); dialog stays open, reason intact
 *
 * A11y:
 *   - role="dialog" aria-modal aria-labelledby
 *   - Focus-trap (Tab/Shift+Tab cycle within panel)
 *   - Esc closes
 *   - Toasts: role="alert" aria-live="assertive" (error) / role="status" aria-live="polite" (success)
 *   - Mobile: bottom sheet (translateY(0) at sm:, centered above sm:)
 *
 * Tokens: all from design/DESIGN-SYSTEM.md + the wave-69 --danger-btn addition.
 * No invented hex values — mirrors the design exactly.
 */

import type { ReportTargetType } from '@studyhall/shared';
import { useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { FlagIcon, SpinnerIcon, WarningCircleIcon, XIcon } from './icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportDialogProps = {
  /** Which kind of entity is being reported. */
  targetType: ReportTargetType;
  /**
   * ID of the target entity:
   *   targetType='server'  → the server's UUID
   *   targetType='member'  → the user's ID (target_user_id)
   *   targetType='message' → the message's UUID (target_message_id)
   */
  targetId: string;
  /**
   * Server UUID. Required for target_type='server' (is the server being reported).
   * For 'member' and 'message' the server context is resolved server-side, so
   * this is optional — pass it when it's conveniently available to the caller.
   */
  serverId?: string;
  /** Human-readable label shown in "Report <displayLabel> to the moderators." */
  displayLabel: string;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
};

type SubmitState = 'idle' | 'submitting';

// ---------------------------------------------------------------------------
// Toast — rendered outside the dialog panel so it's always visible
// ---------------------------------------------------------------------------

type ToastKind = 'success' | 'error';

type ToastMessage = {
  id: string;
  kind: ToastKind;
  text: string;
};

function Toast({ toast, onGone }: { toast: ToastMessage; onGone: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onGone(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onGone]);

  const isError = toast.kind === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      data-testid={isError ? 'report-toast-error' : 'report-toast-success'}
      className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium"
      style={{
        backgroundColor: '#27272a',
        border: isError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isError
          ? '0 0 15px rgba(239,68,68,0.15), 0 8px 32px rgba(0,0,0,0.6)'
          : '0 8px 32px rgba(0,0,0,0.6)',
        color: 'rgba(255,255,255,0.92)',
        pointerEvents: 'auto',
      }}
    >
      {isError ? (
        <WarningCircleIcon size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
      ) : (
        /* Check-circle SVG inline — no dep on CheckCircleIcon shape assumption */
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10b981"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )}
      <span>{toast.text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReportDialog
// ---------------------------------------------------------------------------

const REASON_MAX = 300;

export function ReportDialog({
  targetType,
  targetId,
  serverId,
  displayLabel,
  onClose,
  triggerRef,
}: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [showInlineError, setShowInlineError] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmitting = submitState === 'submitting';

  // Focus textarea on mount
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Focus trap + Esc
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = dialogRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
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
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    onClose();
    setTimeout(() => {
      triggerRef?.current?.focus();
    }, 50);
  }

  function addToast(text: string, kind: ToastKind) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, kind, text }]);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();

    if (!trimmed) {
      setShowInlineError(true);
      textareaRef.current?.focus();
      return;
    }

    setSubmitState('submitting');

    try {
      // Build the correct body per target_type
      const body =
        targetType === 'server'
          ? { target_type: 'server' as const, target_server_id: targetId, reason: trimmed }
          : targetType === 'member'
            ? {
                target_type: 'member' as const,
                target_user_id: targetId,
                ...(serverId ? { target_server_id: serverId } : {}),
                reason: trimmed,
              }
            : {
                target_type: 'message' as const,
                target_message_id: targetId,
                ...(serverId ? { target_server_id: serverId } : {}),
                reason: trimmed,
              };

      await api.createReport(body);
      addToast('Report submitted successfully.', 'success');
      // Close after a brief moment so the toast is visible
      setTimeout(() => handleClose(), 400);
    } catch {
      setSubmitState('idle');
      addToast('Network error: Failed to submit report. Please try again.', 'error');
      textareaRef.current?.focus();
    }
  }

  const typeLabel =
    targetType === 'server'
      ? 'Report Server'
      : targetType === 'member'
        ? 'Report Member'
        : 'Report Message';

  const charCount = reason.length;
  const charNearLimit = charCount >= REASON_MAX - 10;

  return (
    <>
      {/* Toast container — fixed, bottom-right */}
      <div
        className="fixed bottom-6 z-[60] flex flex-col gap-2"
        style={{
          right: 0,
          left: 0,
          padding: '0 16px',
          pointerEvents: 'none',
        }}
      >
        <div className="flex flex-col gap-2 sm:items-end" style={{ pointerEvents: 'none' }}>
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onGone={removeToast} />
          ))}
        </div>
      </div>

      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close report dialog"
        tabIndex={-1}
        data-testid="report-dialog-scrim"
        className="fixed inset-0 z-50 cursor-default"
        style={{ backgroundColor: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-[51] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
      >
        <div
          ref={dialogRef}
          data-testid="report-dialog"
          className="relative w-full pointer-events-auto flex flex-col overflow-hidden"
          style={{
            maxWidth: 480,
            maxHeight: '90dvh',
            backgroundColor: '#121214',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px 10px 0 0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            // sm: full radius on bottom too
          }}
        >
          {/* Top accent bar */}
          <div
            aria-hidden="true"
            style={{
              height: 2,
              background:
                'linear-gradient(90deg, #27272a 0%, rgba(255,255,255,0.10) 50%, #27272a 100%)',
              opacity: 0.5,
              flexShrink: 0,
            }}
          />

          {/* Header */}
          <header
            className="flex items-start justify-between px-6 py-5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <h2
                id="report-dialog-title"
                className="text-[20px] font-semibold flex items-center gap-2"
                style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}
              >
                <FlagIcon size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                {typeLabel}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Report{' '}
                <span
                  className="font-medium"
                  style={{
                    color: 'rgba(255,255,255,0.92)',
                    maxWidth: 200,
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayLabel}
                </span>{' '}
                to the moderators.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={handleClose}
              data-testid="report-dialog-close"
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none shrink-0 -mr-2 -mt-1"
              style={{ color: 'rgba(255,255,255,0.40)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <XIcon size={16} />
            </button>
          </header>

          {/* Body */}
          <form
            id="report-form"
            onSubmit={(e) => void handleSubmit(e)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="p-6 flex-1 overflow-y-auto overscroll-contain">
              <div className="flex flex-col gap-2 relative">
                <label
                  htmlFor="report-reason"
                  className="flex items-center justify-between text-sm font-medium"
                  style={{ color: 'rgba(255,255,255,0.92)' }}
                >
                  Reason for report
                  <span
                    className="text-xs font-mono"
                    style={{ color: charNearLimit ? '#f59e0b' : 'rgba(255,255,255,0.40)' }}
                  >
                    {charCount} / {REASON_MAX}
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    id="report-reason"
                    data-testid="report-reason-textarea"
                    className="w-full rounded-md p-3 text-sm resize-none focus:outline-none transition-all"
                    style={{
                      height: 128,
                      backgroundColor: '#0a0a0b',
                      color: 'rgba(255,255,255,0.92)',
                      boxShadow: showInlineError
                        ? 'inset 0 0 0 1px #ef4444, 0 0 0 2px rgba(239,68,68,0.4)'
                        : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                    }}
                    placeholder="What's going on? Provide details to help moderators investigate."
                    maxLength={REASON_MAX}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (showInlineError && e.target.value.trim()) {
                        setShowInlineError(false);
                      }
                    }}
                    onFocus={(e) => {
                      if (!showInlineError) {
                        e.currentTarget.style.boxShadow =
                          'inset 0 0 0 1px #10b981, 0 0 0 2px rgba(16,185,129,0.4)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!showInlineError) {
                        e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.06)';
                      }
                    }}
                    disabled={isSubmitting}
                    aria-invalid={showInlineError}
                    aria-describedby={showInlineError ? 'report-reason-error' : undefined}
                  />

                  {/* Inline validation error */}
                  {showInlineError && (
                    <div
                      id="report-reason-error"
                      role="alert"
                      data-testid="report-inline-error"
                      className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium"
                      style={{
                        position: 'absolute',
                        bottom: -32,
                        left: 0,
                        backgroundColor: 'rgba(239,68,68,0.10)',
                        border: '1px solid rgba(239,68,68,0.20)',
                        color: '#f87171',
                      }}
                    >
                      <WarningCircleIcon size={12} style={{ flexShrink: 0 }} />
                      Reason is required
                    </div>
                  )}
                </div>
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  This report will be sent to server moderators, not platform administration.
                </p>
              </div>
            </div>

            {/* Footer */}
            <footer
              className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 flex-row-reverse sm:flex-row"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(10,10,11,0.50)',
              }}
            >
              {/* Cancel — ghost */}
              <button
                type="button"
                onClick={handleClose}
                data-testid="report-dialog-cancel"
                className="rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none w-full sm:w-auto"
                style={{
                  height: 38,
                  backgroundColor: 'transparent',
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
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Cancel
              </button>

              {/* Submit — primary emerald dark-on-emerald */}
              <button
                type="submit"
                form="report-form"
                data-testid="report-dialog-submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="relative flex items-center justify-center rounded-md px-6 text-sm font-semibold transition-all focus-visible:outline-none w-full sm:w-auto overflow-hidden"
                style={{
                  height: 38,
                  backgroundColor: '#10b981',
                  color: '#0a0a0b',
                  opacity: isSubmitting ? 0.8 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34d399';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ opacity: isSubmitting ? 0 : 1 }}>Submit Report</span>
                {isSubmitting && (
                  <SpinnerIcon
                    size={18}
                    className="animate-spin"
                    style={{ position: 'absolute' }}
                  />
                )}
              </button>
            </footer>
          </form>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes report-modal-enter {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
