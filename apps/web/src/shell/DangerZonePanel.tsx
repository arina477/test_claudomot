/**
 * DangerZonePanel — "Delete your account" Danger Zone section.
 *
 * Design canonical: design/settings-privacy.html § Panel 5: Danger Zone (Deletion)
 * (D-3 APPROVED wave-72)
 *
 * COPY NOTE (P-1 reconciliation — wave-72):
 *   The mockup says deletion "requires email verification and initiates a 30-day
 *   grace period". This slice ships IMMEDIATE soft-delete — no email-verify, no
 *   30-day grace, reversible-by-support, NOT a hard purge. All mockup copy that
 *   promises unimplemented behaviour has been corrected:
 *     - "email verification + 30-day grace period" removed from the section description.
 *     - "permanently deleted" in the acknowledgment softened to "deactivated and
 *       personal data removed" (accurate to soft-delete).
 *
 * Dialog chrome: mirrors BlockConfirmDialog (portal to document.body, focus-trap,
 * Esc, mobile bottom-sheet, danger styling).
 *
 * Danger color: --danger-btn #b91c1c (white text ≈ 6.5:1 WCAG AA PASS).
 * Section border: --danger #ef4444 at 10% alpha (non-text use; design-system safe).
 *
 * A11y:
 *   - role="alertdialog" aria-modal aria-labelledby
 *   - Focus-trap (Tab / Shift+Tab within panel)
 *   - Esc closes (guarded while submitting)
 *   - Confirm button disabled until acknowledgment checkbox is checked
 *   - Danger confirm = #b91c1c fill, white text (≥ 4.5:1 AA pass)
 *   - On success: Session.signOut() then navigate('/login')
 *   - On 409: renders blocking server list inside dialog — no redirect
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Session from 'supertokens-auth-react/recipe/session';
import { DeleteAccountBlockedError, api } from '../auth/api';
import { SpinnerIcon, WarningCircleIcon, XIcon } from './icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubmitState = 'idle' | 'submitting';

type BlockedState = {
  reason: string;
  servers: { id: string; name: string }[];
};

// ---------------------------------------------------------------------------
// DangerZonePanel
// ---------------------------------------------------------------------------

export function DangerZonePanel() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      {/* Danger Zone section — design panel 5 */}
      <section
        data-testid="danger-zone-section"
        className="rounded-lg"
        style={{
          border: '2px solid rgba(239,68,68,0.10)',
        }}
      >
        <div
          className="relative overflow-hidden rounded-lg p-6"
          style={{ backgroundColor: '#0a0a0b' }}
        >
          {/* Subtle red tint overlay — design-canonical */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: '#ef4444', opacity: 0.02 }}
          />

          <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h3 className="mb-1 text-[17px] font-semibold" style={{ color: '#f87171' }}>
                Delete your account
              </h3>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Deactivate your profile, remove your personal data, and sever all server
                associations. This action will be processed immediately.
              </p>
            </div>

            <button
              type="button"
              data-testid="danger-zone-open-btn"
              onClick={() => setDialogOpen(true)}
              className="w-full shrink-0 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none sm:w-auto"
              style={{
                height: 34,
                backgroundColor: '#b91c1c',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#991b1b';
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
              Delete account
            </button>
          </div>
        </div>
      </section>

      {/* Dialog — portaled to document.body per BUILD-PRINCIPLES rule 14 */}
      {dialogOpen && <DeleteAccountDialog onClose={() => setDialogOpen(false)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// DeleteAccountDialog
// ---------------------------------------------------------------------------

type DeleteAccountDialogProps = {
  onClose: () => void;
};

function DeleteAccountDialog({ onClose }: DeleteAccountDialogProps) {
  const navigate = useNavigate();
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [blocked, setBlocked] = useState<BlockedState | null>(null);
  const [submitError, setSubmitError] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const isSubmitting = submitState === 'submitting';

  // Focus confirm button on mount (or cancel if confirm is disabled initially)
  useEffect(() => {
    const t = setTimeout(() => {
      // Focus the close/cancel button initially since confirm starts disabled
      const panel = dialogRef.current;
      if (!panel) return;
      const cancelBtn = panel.querySelector<HTMLButtonElement>(
        '[data-testid="delete-dialog-cancel"]',
      );
      cancelBtn?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // Focus-trap + Esc handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isSubmitting) return;
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = dialogRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [isSubmitting, onClose]);

  async function handleConfirm() {
    if (isSubmitting || !acknowledged) return;

    setSubmitState('submitting');
    setBlocked(null);
    setSubmitError('');

    try {
      await api.deleteAccount();
      // Success: server revoked all sessions. Clear client auth + navigate.
      try {
        await Session.signOut();
      } catch {
        // signOut failure is non-fatal — server already revoked the session.
      }
      navigate('/login');
    } catch (err) {
      setSubmitState('idle');

      if (err instanceof DeleteAccountBlockedError) {
        // 409: owner-blocked — render server list, keep dialog open.
        setBlocked({ reason: err.blocked.reason, servers: err.blocked.servers });
      } else {
        setSubmitError('Could not delete your account. Please try again.');
      }
    }
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close delete account dialog"
        tabIndex={-1}
        data-testid="delete-dialog-scrim"
        className="fixed inset-0 z-50 cursor-default"
        style={{ backgroundColor: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)' }}
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Dialog — mobile: bottom sheet; desktop: centered */}
      <div
        className="pointer-events-none fixed inset-0 z-[51] flex items-end justify-center sm:items-center sm:p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-dialog-title"
      >
        <div
          ref={dialogRef}
          data-testid="delete-account-dialog"
          className="pointer-events-auto relative flex w-full flex-col overflow-hidden"
          style={{
            maxWidth: 500,
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
            className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full sm:hidden"
            style={{ backgroundColor: '#3f3f46' }}
          />

          {/* Header */}
          <div
            className="mt-3 flex items-center justify-between rounded-t-[10px] px-5 pb-4 pt-5 sm:mt-0"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(239,68,68,0.03)',
            }}
          >
            <h2
              id="delete-account-dialog-title"
              className="flex items-center gap-2 text-[20px] font-semibold"
              style={{ color: '#f87171', letterSpacing: '-0.01em' }}
            >
              <WarningCircleIcon size={20} style={{ color: '#f87171', flexShrink: 0 }} />
              Delete Account
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="rounded p-1 transition-colors focus-visible:outline-none disabled:opacity-50"
              style={{ color: 'rgba(255,255,255,0.60)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <XIcon size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-5 sm:p-6">
            {/* Consequence list */}
            <p className="mb-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Deleting your account will:
            </p>
            <ul
              className="mb-5 flex flex-col gap-1.5 text-[13px] leading-snug"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              <li className="flex items-start gap-2">
                <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                  ·
                </span>
                Deactivate your account and remove access immediately
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                  ·
                </span>
                Remove your personal data and profile information
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                  ·
                </span>
                Remove you from all study servers you have joined
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                  ·
                </span>
                Display your name as &ldquo;Deleted user&rdquo; on past messages (to preserve
                academic context for your peers)
              </li>
            </ul>

            {/* 409 owner-blocked error — renders server list */}
            {blocked && (
              <div
                data-testid="delete-blocked-message"
                className="mb-5 rounded-md p-4"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.20)',
                }}
              >
                <p className="mb-2 text-[13px] font-medium" style={{ color: '#f87171' }}>
                  {blocked.reason}
                </p>
                <ul
                  data-testid="delete-blocked-server-list"
                  className="flex flex-col gap-1 text-[13px]"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  {blocked.servers.map((s) => (
                    <li
                      key={s.id}
                      data-testid={`delete-blocked-server-${s.id}`}
                      className="flex items-center gap-2"
                    >
                      <span aria-hidden="true">·</span>
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generic submit error */}
            {submitError && (
              <p
                data-testid="delete-submit-error"
                role="alert"
                className="mb-4 rounded-md px-3 py-2 text-[13px]"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.20)',
                  color: '#f87171',
                }}
              >
                {submitError}
              </p>
            )}

            {/* Acknowledgment checkbox */}
            <div
              className="rounded-md p-4"
              style={{
                backgroundColor: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  data-testid="delete-acknowledge-checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  disabled={isSubmitting}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded-sm disabled:opacity-50"
                  style={{ accentColor: '#b91c1c' }}
                />
                <span
                  className="select-none text-[13px] font-medium leading-tight"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  I understand my account will be deactivated and my personal data removed
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex flex-col-reverse items-stretch gap-3 rounded-b-[10px] px-5 py-4 sm:flex-row sm:items-center sm:justify-end"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: '#0a0a0b',
            }}
          >
            {/* Cancel */}
            <button
              type="button"
              data-testid="delete-dialog-cancel"
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none disabled:opacity-50"
              style={{
                height: 40,
                backgroundColor: 'transparent',
                color: 'rgba(255,255,255,0.60)',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
                }
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
              Keep my account
            </button>

            {/* Confirm — disabled until checkbox checked */}
            <button
              ref={confirmBtnRef}
              type="button"
              data-testid="delete-dialog-confirm"
              onClick={() => void handleConfirm()}
              disabled={!acknowledged || isSubmitting}
              aria-busy={isSubmitting}
              className="relative flex items-center justify-center overflow-hidden rounded-md px-6 text-sm font-semibold transition-colors focus-visible:outline-none"
              style={{
                height: 40,
                backgroundColor: '#b91c1c',
                color: '#ffffff',
                opacity: !acknowledged || isSubmitting ? 0.45 : 1,
                cursor: !acknowledged || isSubmitting ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (acknowledged && !isSubmitting) {
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
              <span style={{ opacity: isSubmitting ? 0 : 1 }}>Delete my account</span>
              {isSubmitting && (
                <SpinnerIcon size={18} className="animate-spin" style={{ position: 'absolute' }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
