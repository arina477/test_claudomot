/**
 * InviteShareModal — "Invite people" modal per design/invite-share.html.
 *
 * 4 states:
 *   default  — link shown, Copy button active
 *   copied   — Copy button morphs to check; Toast fires; reverts after 2s
 *   loading  — link generating (POST /servers/:id/invites in flight)
 *   error    — link failed to load; Retry action in footer
 *
 * Modal pattern mirrors CreateServerModal exactly:
 *   header (title + X close) / body / footer
 *   <dialog> element, aria-modal, focus trap, Esc to close
 *   max-w-[460px], rounded-lg bg-#121214, border, shadow-pop
 *
 * Focus order: close → link field → Copy → Done (per design spec).
 *
 * Props:
 *   serverId  — used to generate the invite link via POST /servers/:id/invites
 *   onClose   — called when the modal should close
 *   triggerRef — optional, restores focus on close
 */

import type { InviteResponse } from '@studyhall/shared';
import { useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { CheckIcon, CopyIcon, RetryIcon, WarningCircleIcon, XIcon } from './icons';

type LinkState = 'loading' | 'ready' | 'error';
type CopyState = 'idle' | 'copied';

type Props = {
  serverId: string;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
};

// Toast component — positioned fixed, top-right, aria-live="polite"
function Toast({ visible }: { visible: boolean }) {
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
          Invite link copied
        </span>
      </div>
    </div>
  );
}

export function InviteShareModal({ serverId, onClose, triggerRef }: Props) {
  const [linkState, setLinkState] = useState<LinkState>('loading');
  const [invite, setInvite] = useState<InviteResponse | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [toastVisible, setToastVisible] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Derive the full invite URL
  const inviteUrl = invite ? (invite.url ?? `${window.location.origin}/invite/${invite.code}`) : '';

  // Fetch invite on mount
  useEffect(() => {
    fetchInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fetchInvite() {
    setLinkState('loading');
    setInvite(null);
    api
      .createInvite(serverId)
      .then((data) => {
        setInvite(data);
        setLinkState('ready');
      })
      .catch(() => {
        setLinkState('error');
      });
  }

  // Focus link input once it becomes available
  useEffect(() => {
    if (linkState === 'ready') {
      const timer = setTimeout(() => linkInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [linkState]);

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

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      // Fallback: select + copy via execCommand
      linkInputRef.current?.select();
      document.execCommand('copy');
    }
    setCopyState('copied');
    setToastVisible(true);
    setTimeout(() => {
      setCopyState('idle');
      setToastVisible(false);
    }, 2000);
  }

  const isLoading = linkState === 'loading';
  const isError = linkState === 'error';

  return (
    <>
      <Toast visible={toastVisible} />

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
        aria-busy={isLoading}
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
          <div className="px-4 py-4 flex flex-col gap-3" style={{ backgroundColor: '#121214' }}>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Anyone with this link can join this server.
            </p>

            {/* Error banner */}
            {isError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md px-3 py-2.5 text-sm"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.40)',
                }}
              >
                <WarningCircleIcon
                  size={16}
                  style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}
                />
                <span style={{ color: 'rgba(255,255,255,0.92)' }}>
                  Couldn&apos;t load the invite link. Check your connection and try again.
                </span>
              </div>
            )}

            {/* Link field row */}
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <label htmlFor="invite-link-input" className="sr-only">
                  Invite link
                </label>

                {isLoading ? (
                  /* Skeleton while loading */
                  <div
                    className="h-10 w-full rounded-md relative overflow-hidden"
                    style={{ backgroundColor: '#27272a' }}
                    aria-label="Loading invite link"
                    aria-live="polite"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                        animation: 'shimmer 1.6s infinite',
                      }}
                    />
                  </div>
                ) : (
                  <input
                    ref={linkInputRef}
                    id="invite-link-input"
                    type="text"
                    readOnly
                    disabled={isError}
                    value={isError ? '' : inviteUrl}
                    placeholder={isError ? 'Invite link unavailable' : ''}
                    aria-label="Invite link — read only, click to select all"
                    aria-invalid={isError ? 'true' : undefined}
                    onClick={() => !isError && linkInputRef.current?.select()}
                    className="w-full rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-none truncate"
                    style={{
                      fontFamily: "'Geist Mono', ui-monospace, monospace",
                      backgroundColor: '#0a0a0b',
                      border: isError
                        ? '1px solid rgba(239,68,68,0.80)'
                        : '1px solid rgba(255,255,255,0.10)',
                      color: isError ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.92)',
                      cursor: isError ? 'not-allowed' : 'text',
                      boxShadow: 'var(--invite-link-focus-shadow, none)',
                    }}
                    onFocus={(e) => {
                      if (!isError) {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                        e.currentTarget.style.borderColor = '#10b981';
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = isError
                        ? 'rgba(239,68,68,0.80)'
                        : 'rgba(255,255,255,0.10)';
                    }}
                  />
                )}
              </div>

              {/* Copy button */}
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={isLoading || isError}
                aria-label={
                  copyState === 'copied' ? 'Invite link copied' : 'Copy invite link to clipboard'
                }
                aria-live="polite"
                className="shrink-0 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none"
                style={{
                  backgroundColor:
                    isLoading || isError
                      ? '#27272a'
                      : copyState === 'copied'
                        ? 'rgba(16,185,129,0.80)'
                        : '#10b981',
                  color: isLoading || isError ? 'rgba(255,255,255,0.40)' : '#0a0a0b',
                  cursor: isLoading || isError ? 'not-allowed' : 'pointer',
                }}
                onFocus={(e) => {
                  if (!isLoading && !isError) {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {copyState === 'copied' ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                {copyState === 'copied' ? 'Copied' : 'Copy link'}
              </button>
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
            {isError ? (
              <>
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
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={fetchInvite}
                  className="rounded-md px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none"
                  style={{ backgroundColor: '#10b981', color: '#0a0a0b' }}
                >
                  <RetryIcon size={14} />
                  Retry
                </button>
              </>
            ) : (
              /* Tab order: Done is last focusable element */
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none"
                style={{
                  color: isLoading ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.60)',
                  backgroundColor: 'transparent',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = isLoading
                    ? 'rgba(255,255,255,0.40)'
                    : 'rgba(255,255,255,0.60)';
                }}
              >
                Done
              </button>
            )}
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
