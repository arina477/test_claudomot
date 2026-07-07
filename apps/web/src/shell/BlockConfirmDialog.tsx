/**
 * BlockConfirmDialog — confirm-before-block modal.
 *
 * Design canonical: design/block-ui.html (D-3 APPROVED wave-70)
 *
 * Mirrors ReportDialog in portal, focus-trap, Esc, mobile bottom-sheet
 * and toast patterns (wave-69 ReportDialog is the reference).
 *
 * Props:
 *   targetUserId   — UUID of the user to block
 *   displayName    — shown in the dialog title ("Block <displayName>?")
 *   onClose        — called after success or cancel
 *   triggerRef     — optional ref to restore focus on close
 *
 * States:
 *   idle        — confirm button ready
 *   submitting  — spinner, button disabled (prevents double-submit)
 *   success     — toast (role=status/polite) + dialog closes
 *   error       — toast (role=alert/assertive) + dialog stays open
 *
 * A11y:
 *   - role="dialog" aria-modal aria-labelledby
 *   - Focus-trap (Tab/Shift+Tab cycle within panel)
 *   - Esc closes (guarded while submitting)
 *   - Mobile: bottom sheet (rounded-t-2xl, full-width)
 *   - Confirm button gets focus-visible:ring (--glow-focus per D-3 note)
 *   - Danger confirm = --danger-btn #b91c1c white text (DESTRUCTIVE, NOT emerald)
 *   - Cancel = ghost/neutral
 *   - Toast: role=alert/status per type
 *
 * Tokens: DESIGN-SYSTEM.md only — no invented hex values.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../auth/api';
import { ProhibitIcon, SpinnerIcon, WarningCircleIcon } from './icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BlockConfirmDialogProps = {
  targetUserId: string;
  displayName: string;
  onClose: (blocked?: boolean) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
};

type SubmitState = 'idle' | 'submitting';

// ---------------------------------------------------------------------------
// Toast (same pattern as ReportDialog)
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
      data-testid={isError ? 'block-toast-error' : 'block-toast-success'}
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
        <ProhibitIcon size={18} style={{ color: '#10b981', flexShrink: 0 }} />
      )}
      <span>{toast.text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlockConfirmDialog
// ---------------------------------------------------------------------------

export function BlockConfirmDialog({
  targetUserId,
  displayName,
  onClose,
  triggerRef,
}: BlockConfirmDialogProps) {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const isSubmitting = submitState === 'submitting';

  // Focus confirm button on mount
  useEffect(() => {
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Focus trap + Esc
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isSubmitting) return;
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = dialogRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [isSubmitting]);

  function handleClose(blocked?: boolean) {
    onClose(blocked);
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

  async function handleConfirm() {
    if (isSubmitting) return;
    setSubmitState('submitting');

    try {
      await api.blockUser(targetUserId);
      addToast(`${displayName} has been blocked.`, 'success');
      setTimeout(() => handleClose(true), 400);
    } catch {
      setSubmitState('idle');
      addToast('Network error: Failed to block user. Please try again.', 'error');
      confirmBtnRef.current?.focus();
    }
  }

  return createPortal(
    <>
      {/* Toast container — fixed, bottom-right */}
      <div
        className="fixed bottom-6 z-[60] flex flex-col gap-2"
        style={{ right: 0, left: 0, padding: '0 16px', pointerEvents: 'none' }}
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
        aria-label="Close block dialog"
        tabIndex={-1}
        data-testid="block-dialog-scrim"
        className="fixed inset-0 z-50 cursor-default"
        style={{ backgroundColor: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)' }}
        onClick={() => !isSubmitting && handleClose()}
      />

      {/* Dialog — mobile: bottom sheet; desktop: centered */}
      <div
        className="fixed inset-0 z-[51] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-dialog-title"
      >
        <div
          ref={dialogRef}
          data-testid="block-dialog"
          className="relative w-full pointer-events-auto flex flex-col overflow-hidden"
          style={{
            maxWidth: 400,
            maxHeight: '90dvh',
            backgroundColor: '#121214',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px 10px 0 0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {/* Mobile drag handle */}
          <div
            aria-hidden="true"
            className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
            style={{ backgroundColor: '#3f3f46' }}
          />

          {/* Content */}
          <div className="p-5 sm:p-6 flex flex-col">
            {/* Title */}
            <h2
              id="block-dialog-title"
              className="text-[20px] font-semibold mb-3 mt-3 sm:mt-0"
              style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}
            >
              Block{' '}
              <span
                style={{
                  maxWidth: 200,
                  display: 'inline-block',
                  verticalAlign: 'bottom',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </span>
              ?
            </h2>

            {/* Body */}
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.60)' }}>
              They won&apos;t be able to DM you and you won&apos;t see their content in servers.
              This action won&apos;t notify them.
            </p>

            {/* Footer — mobile: stacked (column-reverse); desktop: inline row */}
            <div className="flex items-center justify-end gap-3 flex-col-reverse sm:flex-row w-full sm:w-auto">
              {/* Cancel — ghost/neutral */}
              <button
                type="button"
                onClick={() => !isSubmitting && handleClose()}
                data-testid="block-dialog-cancel"
                className="rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none w-full sm:w-auto"
                style={{
                  height: 40,
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

              {/* Confirm — danger #b91c1c fill, white text (DESTRUCTIVE) */}
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => void handleConfirm()}
                data-testid="block-dialog-confirm"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="relative flex items-center justify-center rounded-md px-6 text-sm font-semibold transition-colors focus-visible:outline-none w-full sm:w-auto overflow-hidden"
                style={{
                  height: 40,
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  opacity: isSubmitting ? 0.8 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#991b1b';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b91c1c';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ opacity: isSubmitting ? 0 : 1 }}>Block User</span>
                {isSubmitting && (
                  <SpinnerIcon
                    size={18}
                    className="animate-spin"
                    style={{ position: 'absolute' }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
