/**
 * InviteShareModal — "Invite people" modal per design/invite-share.html (wave-9 delta).
 *
 * 8b change: DEFAULT link = the PERMANENT server invite link (from props.inviteCode,
 * which comes from ServerContext.selectedDetail.server.inviteCode). No ad-hoc invite
 * is minted on open. The permanent link is displayed immediately — no loading state
 * needed for it.
 *
 * States:
 *   default     — permanent link shown, Copy button active
 *   copied      — Copy button morphs to check; Toast fires; reverts after 2s
 *   null-code   — inviteCode is null → friendly fallback + generate button
 *   (limited invites section)
 *   generating  — POST /servers/:id/invites in flight (spinner on Generate button)
 *   gen-error   — createInvite failed; inline error
 *   revoke-confirm — per-row inline confirm before POSTing revoke
 *   revoked     — row marked as revoked + Toast
 *
 * Limited-invites list: session-scoped (invites created in THIS modal session).
 * No GET endpoint exists for listing ad-hoc invites, so we track only what was
 * created in this session. Revoke action calls POST /invites/:code/revoke and
 * marks the row as revoked optimistically.
 *
 * Modal pattern mirrors CreateServerModal exactly:
 *   header (title + X close) / body / footer
 *   <dialog> element, aria-modal, focus trap, Esc to close
 *   max-w-[460px], rounded-lg bg-#121214, border, shadow-pop
 *
 * Focus order: close → link field → Copy → Generate → list revoke controls → Done.
 *
 * Props:
 *   serverId    — used to generate ad-hoc invites via POST /servers/:id/invites
 *   inviteCode  — the server's permanent invite code (from ServerDetail); may be null
 *   onClose     — called when the modal should close
 *   triggerRef  — optional, restores focus on close
 */

import type { InviteResponse } from '@studyhall/shared';
import { useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { CheckIcon, CopyIcon, SpinnerIcon, TrashIcon, WarningCircleIcon, XIcon } from './icons';

type CopyState = 'idle' | 'copied';
type GenState = 'idle' | 'generating' | 'error';

type RevokeState = 'idle' | 'confirming' | 'revoking' | 'revoked';

type LimitedInvite = {
  code: string;
  url: string;
  revokeState: RevokeState;
  revokeError: boolean;
};

type ToastMessage = 'copied' | 'revoked';

type Props = {
  serverId: string;
  /** The server's permanent invite code, or null if unavailable. */
  inviteCode: string | null;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
};

// Toast component — positioned fixed, top-right, aria-live="polite"
function Toast({ visible, message }: { visible: boolean; message: ToastMessage }) {
  const label = message === 'revoked' ? 'Invite revoked' : 'Invite link copied';
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[60] flex items-center overflow-hidden rounded-md shadow-pop transition-all duration-300"
      style={{
        backgroundColor: '#27272a',
        border: '1px solid rgba(255,255,255,0.10)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        pointerEvents: 'none',
        maxWidth: 240,
      }}
    >
      {/* Emerald left accent bar */}
      <div
        aria-hidden="true"
        className="w-1 self-stretch rounded-l-md shrink-0"
        style={{ backgroundColor: '#10b981' }}
      />
      <div className="flex items-center gap-2 py-2.5 pr-3 pl-1">
        <CheckIcon size={16} style={{ color: '#10b981', flexShrink: 0 }} />
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

export function InviteShareModal({ serverId, inviteCode, onClose, triggerRef }: Props) {
  const permanentUrl = inviteCode ? `${window.location.origin}/invite/${inviteCode}` : null;

  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToastMessage>('copied');

  // Limited invites section
  const [limitedInvites, setLimitedInvites] = useState<LimitedInvite[]>([]);
  const [genState, setGenState] = useState<GenState>('idle');

  const dialogRef = useRef<HTMLDialogElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Focus link input on mount (if permanent link is available)
  useEffect(() => {
    if (permanentUrl) {
      const timer = setTimeout(() => linkInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [permanentUrl]);

  // Focus trap + Escape handler
  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key !== 'Tab') return;
      if (!dialogEl) return;

      const focusable = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  function showToast(msg: ToastMessage) {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }

  async function handleCopy() {
    if (!permanentUrl) return;
    try {
      await navigator.clipboard.writeText(permanentUrl);
    } catch {
      // Fallback: select + copy via execCommand
      linkInputRef.current?.select();
      document.execCommand('copy');
    }
    setCopyState('copied');
    showToast('copied');
    setTimeout(() => setCopyState('idle'), 2000);
  }

  async function handleGenerate() {
    setGenState('generating');
    try {
      const data: InviteResponse = await api.createInvite(serverId);
      const url = data.url ?? `${window.location.origin}/invite/${data.code}`;
      setLimitedInvites((prev) => [
        ...prev,
        { code: data.code, url, revokeState: 'idle', revokeError: false },
      ]);
      setGenState('idle');
    } catch {
      setGenState('error');
    }
  }

  function handleRevokeClick(code: string) {
    setLimitedInvites((prev) =>
      prev.map((inv) => (inv.code === code ? { ...inv, revokeState: 'confirming' } : inv)),
    );
  }

  function handleRevokeCancelClick(code: string) {
    setLimitedInvites((prev) =>
      prev.map((inv) =>
        inv.code === code ? { ...inv, revokeState: 'idle', revokeError: false } : inv,
      ),
    );
  }

  async function handleRevokeConfirm(code: string) {
    setLimitedInvites((prev) =>
      prev.map((inv) => (inv.code === code ? { ...inv, revokeState: 'revoking' } : inv)),
    );
    try {
      await api.revokeInvite(code);
      setLimitedInvites((prev) =>
        prev.map((inv) => (inv.code === code ? { ...inv, revokeState: 'revoked' } : inv)),
      );
      showToast('revoked');
    } catch {
      setLimitedInvites((prev) =>
        prev.map((inv) =>
          inv.code === code ? { ...inv, revokeState: 'idle', revokeError: true } : inv,
        ),
      );
    }
  }

  const hasLimitedInvites = limitedInvites.length > 0;

  return (
    <>
      <Toast visible={toastVisible} message={toastMessage} />

      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className="fixed inset-0 z-50 cursor-default"
        style={{ backgroundColor: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(2px)' }}
        onClick={handleClose}
        tabIndex={-1}
        data-testid="invite-share-modal-overlay"
      />

      {/* Dialog */}
      <dialog
        ref={dialogRef}
        aria-labelledby="invite-share-modal-title"
        aria-modal="true"
        open
        className="fixed inset-0 z-[51] flex items-center justify-center px-4 pointer-events-none m-0 p-0 max-w-none max-h-none w-full h-full bg-transparent border-0"
      >
        <div
          className="w-full flex flex-col overflow-hidden pointer-events-auto"
          style={{
            maxWidth: 460,
            backgroundColor: '#121214',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            animation: 'modal-enter 300ms cubic-bezier(0.175,0.885,0.32,1.275) forwards',
          }}
          data-testid="invite-share-modal"
        >
          {/* Header */}
          <header
            className="flex items-center justify-between px-4 py-4 shrink-0"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(28,28,31,0.60)',
              borderRadius: '10px 10px 0 0',
            }}
          >
            <h2
              id="invite-share-modal-title"
              className="text-xl font-semibold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              Invite people
            </h2>
            {/* Tab order: close is first focusable element */}
            <button
              type="button"
              aria-label="Close invite dialog"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none"
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
          <div className="px-4 py-4 flex flex-col gap-4" style={{ backgroundColor: '#121214' }}>
            {/* ── Permanent invite link block ── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                {/* Globe icon inline SVG (emerald) */}
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  Server invite link
                </span>
                <span
                  className="ml-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: '#27272a',
                    color: 'rgba(255,255,255,0.60)',
                  }}
                >
                  Permanent
                </span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Anyone with this link can join this server. This link doesn&apos;t expire.
              </p>

              {permanentUrl ? (
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <label htmlFor="invite-link-input" className="sr-only">
                      Permanent invite link
                    </label>
                    <input
                      ref={linkInputRef}
                      id="invite-link-input"
                      type="text"
                      readOnly
                      value={permanentUrl}
                      aria-label="Permanent invite link — read only, click to select all"
                      onClick={() => linkInputRef.current?.select()}
                      className="w-full rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-none truncate"
                      style={{
                        fontFamily: "'Geist Mono', ui-monospace, monospace",
                        backgroundColor: '#0a0a0b',
                        border: '1px solid rgba(255,255,255,0.10)',
                        color: 'rgba(255,255,255,0.92)',
                        cursor: 'text',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                        e.currentTarget.style.borderColor = '#10b981';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                      }}
                    />
                  </div>

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    aria-label={
                      copyState === 'copied'
                        ? 'Invite link copied'
                        : 'Copy permanent invite link to clipboard'
                    }
                    aria-live="polite"
                    className="shrink-0 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none"
                    style={{
                      backgroundColor: copyState === 'copied' ? 'rgba(16,185,129,0.80)' : '#10b981',
                      color: '#0a0a0b',
                      cursor: 'pointer',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {copyState === 'copied' ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                    {copyState === 'copied' ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              ) : (
                /* Null inviteCode fallback */
                <div
                  className="flex items-start gap-2 rounded-md px-3 py-2.5 text-sm"
                  style={{
                    backgroundColor: '#1c1c1f',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <WarningCircleIcon
                    size={16}
                    style={{ color: 'rgba(255,255,255,0.40)', flexShrink: 0, marginTop: 2 }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.60)' }}>
                    Permanent link unavailable. Generate a limited invite below.
                  </span>
                </div>
              )}
            </div>

            {/* ── Divider ── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

            {/* ── Limited invites section ── */}
            <div className="flex flex-col gap-3">
              {hasLimitedInvites ? (
                <>
                  {/* Header row with "New" button */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.60)' }}
                    >
                      Limited invites
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleGenerate()}
                      disabled={genState === 'generating'}
                      aria-label="Generate a limited invite"
                      className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 focus-visible:outline-none"
                      style={{
                        backgroundColor: '#27272a',
                        color: 'rgba(255,255,255,0.92)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        cursor: genState === 'generating' ? 'not-allowed' : 'pointer',
                        opacity: genState === 'generating' ? 0.6 : 1,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {genState === 'generating' ? (
                        <SpinnerIcon size={12} className="animate-spin" />
                      ) : (
                        <svg
                          width={12}
                          height={12}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="12" y1="4" x2="12" y2="20" />
                          <line x1="4" y1="12" x2="20" y2="12" />
                        </svg>
                      )}
                      New
                    </button>
                  </div>

                  {/* Generation error banner */}
                  {genState === 'error' && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-md px-3 py-2 text-xs"
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.10)',
                        border: '1px solid rgba(239,68,68,0.40)',
                      }}
                    >
                      <WarningCircleIcon
                        size={14}
                        style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.92)' }}>
                        Couldn&apos;t generate a limited invite. Try again.
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleGenerate()}
                        className="ml-auto shrink-0 text-xs font-medium focus-visible:outline-none"
                        style={{ color: '#10b981' }}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Invite list */}
                  <ul className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
                    {limitedInvites.map((inv) => (
                      <LimitedInviteRow
                        key={inv.code}
                        invite={inv}
                        onRevoke={handleRevokeClick}
                        onRevokeCancel={handleRevokeCancelClick}
                        onRevokeConfirm={handleRevokeConfirm}
                      />
                    ))}
                  </ul>
                </>
              ) : (
                /* Empty state — no limited invites yet */
                <div className="flex flex-col gap-2">
                  <div
                    className="flex items-center justify-between"
                    style={{ color: 'rgba(255,255,255,0.60)' }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                      Need a limited invite?
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    Create a link with a max number of uses or an expiry.
                  </p>

                  {/* Generation error in empty state */}
                  {genState === 'error' && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-md px-3 py-2 text-xs"
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.10)',
                        border: '1px solid rgba(239,68,68,0.40)',
                      }}
                    >
                      <WarningCircleIcon
                        size={14}
                        style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.92)' }}>
                        Couldn&apos;t generate invite. Try again.
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={genState === 'generating'}
                    aria-label="Generate a limited invite"
                    data-testid="generate-limited-invite"
                    className="self-start rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 focus-visible:outline-none"
                    style={{
                      backgroundColor: '#27272a',
                      color: 'rgba(255,255,255,0.92)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      cursor: genState === 'generating' ? 'not-allowed' : 'pointer',
                      opacity: genState === 'generating' ? 0.6 : 1,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {genState === 'generating' ? (
                      <SpinnerIcon size={14} className="animate-spin" />
                    ) : (
                      /* Clock-countdown shape */
                      <svg
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    )}
                    Generate a limited invite
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer
            className="flex items-center justify-end gap-2 px-4 py-4 shrink-0 rounded-b-[10px]"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(10,10,11,0.40)',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none"
              style={{ color: 'rgba(255,255,255,0.60)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
              }}
            >
              Done
            </button>
          </footer>
        </div>
      </dialog>

      {/* Keyframes */}
      <style>{`
        @keyframes modal-enter {
          0%   { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}

// ── LimitedInviteRow ──────────────────────────────────────────────────────────

type LimitedInviteRowProps = {
  invite: LimitedInvite;
  onRevoke: (code: string) => void;
  onRevokeCancel: (code: string) => void;
  onRevokeConfirm: (code: string) => Promise<void>;
};

function LimitedInviteRow({
  invite,
  onRevoke,
  onRevokeCancel,
  onRevokeConfirm,
}: LimitedInviteRowProps) {
  const shortCode = `…${invite.code.slice(-6)}`;
  const isRevoked = invite.revokeState === 'revoked';
  const isConfirming = invite.revokeState === 'confirming';
  const isRevoking = invite.revokeState === 'revoking';

  if (isRevoked) {
    return (
      <li
        className="flex items-center gap-3 px-3 py-2.5 rounded-md"
        style={{
          backgroundColor: 'rgba(28,28,31,0.50)',
          border: '1px solid rgba(255,255,255,0.06)',
          opacity: 0.7,
        }}
      >
        {/* Prohibit icon */}
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium truncate line-through"
            style={{
              fontFamily: "'Geist Mono', ui-monospace, monospace",
              color: 'rgba(255,255,255,0.40)',
            }}
          >
            {shortCode}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Revoked — this link no longer works.
          </p>
        </div>
      </li>
    );
  }

  if (isConfirming || isRevoking) {
    return (
      <li
        className="rounded-md"
        style={{
          backgroundColor: '#1c1c1f',
          border: '1px solid rgba(239,68,68,0.40)',
        }}
      >
        <div role="alert" className="flex items-start gap-2 px-3 py-2.5">
          <WarningCircleIcon size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Revoke invite{' '}
              <span style={{ fontFamily: "'Geist Mono', ui-monospace, monospace" }}>
                {shortCode}
              </span>
              ?
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
              It will stop working immediately. People who already joined stay in the server.
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => onRevokeCancel(invite.code)}
                disabled={isRevoking}
                className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none"
                style={{
                  color: 'rgba(255,255,255,0.60)',
                  backgroundColor: 'transparent',
                  cursor: isRevoking ? 'not-allowed' : 'pointer',
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
              <button
                type="button"
                onClick={() => void onRevokeConfirm(invite.code)}
                disabled={isRevoking}
                aria-label={`Confirm revoke invite ${shortCode}`}
                className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#0a0a0b',
                  cursor: isRevoking ? 'not-allowed' : 'pointer',
                  opacity: isRevoking ? 0.7 : 1,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isRevoking ? (
                  <SpinnerIcon size={12} className="animate-spin" />
                ) : (
                  <TrashIcon size={12} />
                )}
                Revoke
              </button>
            </div>
          </div>
        </div>
        {invite.revokeError && (
          <p className="px-3 pb-2 text-xs" style={{ color: '#ef4444' }} role="alert">
            Couldn&apos;t revoke. Try again.
          </p>
        )}
      </li>
    );
  }

  // Normal idle row
  return (
    <li
      className="flex items-center gap-3 px-3 py-2.5 rounded-md"
      style={{
        backgroundColor: '#1c1c1f',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-medium truncate"
          style={{
            fontFamily: "'Geist Mono', ui-monospace, monospace",
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          {shortCode}
        </p>
        {invite.revokeError && (
          <p className="text-xs" style={{ color: '#ef4444' }}>
            Revoke failed. Try again.
          </p>
        )}
        {!invite.revokeError && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Active · no expiry
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRevoke(invite.code)}
        aria-label={`Revoke limited invite ending ${shortCode}`}
        className="shrink-0 rounded-md p-1.5 transition-colors focus-visible:outline-none"
        style={{ color: 'rgba(255,255,255,0.40)', backgroundColor: 'transparent' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.10)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.4)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <TrashIcon size={14} />
      </button>
    </li>
  );
}
