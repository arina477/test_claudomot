/**
 * CreateServerModal — centered overlay dialog for creating a new server.
 *
 * Six UI states per design/create-server.html:
 *   default          — empty input, submit disabled
 *   valid            — non-empty input, submit enabled
 *   validation-error — empty submit attempt, shake + inline error
 *   loading          — POST in-flight; inputs disabled, spinner shown
 *   server-error     — API error banner with retry
 *   success          — modal closes, success toast fires (handled by caller via onSuccess)
 *
 * A11y:
 *   <dialog> element with aria-labelledby
 *   Focus trapped within modal while open
 *   Escape closes (unless loading)
 *   Focus returns to trigger (add-server button) on close
 *   aria-live="polite" on validation error
 *   aria-busy on submit button while loading
 *   Input aria-invalid + aria-describedby wired on validation error
 */

import type { ServerResponse } from '@studyhall/shared';
import { useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { SpinnerIcon, XIcon } from './icons';

const MAX_NAME = 100;

type Props = {
  /** Called after successful server creation with the new server data. */
  onSuccess: (server: ServerResponse) => void;
  /** Called when the modal should close (Cancel / Esc / backdrop click). */
  onClose: () => void;
  /** Ref to the element that triggered the modal; focus is restored here on close. */
  triggerRef?: React.RefObject<HTMLElement | null>;
};

type FormState = 'idle' | 'loading' | 'error';

export function CreateServerModal({ onSuccess, onClose, triggerRef }: Props) {
  const [name, setName] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [validationError, setValidationError] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Focus trap + Escape handler
  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault(); // prevent browser default dialog close; we handle it
        if (formState !== 'loading') {
          handleClose();
        }
        return;
      }

      if (e.key !== 'Tab') return;

      // Re-check for TypeScript narrowing inside nested closure
      if (!dialogEl) return;

      const focusable = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])',
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
  }, [formState]);

  function handleClose() {
    onClose();
    // Restore focus to trigger
    setTimeout(() => {
      triggerRef?.current?.focus();
    }, 50);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (validationError) setValidationError(false);
    if (serverError) setServerError(null);
  }

  async function handleSubmit() {
    const trimmed = name.trim();

    // Client-side validation
    if (trimmed.length === 0) {
      setValidationError(true);
      setShake(false);
      // Trigger shake on next tick
      requestAnimationFrame(() => setShake(true));
      inputRef.current?.focus();
      return;
    }

    setFormState('loading');
    setServerError(null);
    setValidationError(false);

    try {
      const server = await api.createServer({ name: trimmed });
      setFormState('idle');
      onSuccess(server);
    } catch (err) {
      setFormState('error');
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'A connection error occurred. Please try again.';
      setServerError(msg);
    }
  }

  function handleKeyDownInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && name.trim().length > 0 && formState !== 'loading') {
      e.preventDefault();
      void handleSubmit();
    }
  }

  const isLoading = formState === 'loading';
  const submitEnabled = name.trim().length > 0 && !isLoading;
  const charWarning = name.length >= 75;

  // Clear shake flag after animation completes
  function handleAnimationEnd() {
    setShake(false);
  }

  return (
    <>
      {/* Backdrop — button role so click has keyboard parity; visually styled as full-screen overlay */}
      <button
        type="button"
        aria-label="Close modal"
        className="fixed inset-0 z-50 cursor-default"
        style={{ backgroundColor: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(2px)' }}
        onClick={() => {
          if (formState !== 'loading') handleClose();
        }}
        data-testid="create-server-modal-overlay"
        tabIndex={-1}
      />
      {/* Dialog — uses <dialog open> so the element is accessible as a dialog landmark */}
      <dialog
        ref={dialogRef}
        aria-labelledby="create-server-modal-title"
        open
        className="fixed inset-0 z-[51] flex items-center justify-center px-4 pointer-events-none m-0 p-0 max-w-none max-h-none w-full h-full bg-transparent border-0"
      >
        <div
          className="w-full flex flex-col overflow-hidden pointer-events-auto"
          style={{
            maxWidth: 480,
            backgroundColor: '#121214',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            animation: 'modal-enter 300ms cubic-bezier(0.175,0.885,0.32,1.275) forwards',
          }}
          data-testid="create-server-modal"
        >
          {/* Header */}
          <header
            className="flex items-center justify-between px-4 py-4 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2
              id="create-server-modal-title"
              className="text-[22px] font-semibold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              Create a Server
            </h2>
            <button
              type="button"
              aria-label="Close modal"
              onClick={handleClose}
              disabled={isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                color: 'rgba(255,255,255,0.40)',
                backgroundColor: 'transparent',
              }}
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
          <div className="p-4 flex-1" style={{ backgroundColor: '#121214' }}>
            {/* Server error banner */}
            {formState === 'error' && serverError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-md p-3"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.20)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                    Failed to create server
                  </p>
                  <p className="text-sm mt-1 leading-snug" style={{ color: '#ef4444' }}>
                    {serverError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    className="mt-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: '#ef4444', color: '#fff' }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <form noValidate onSubmit={(e) => e.preventDefault()}>
              <p
                className="text-sm mb-5 leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                Give your new study space a name. You can change this later in server settings.
              </p>

              <div>
                <label
                  htmlFor="server-name-input"
                  className="block text-xs font-medium uppercase tracking-wide mb-2"
                  style={{ color: 'rgba(255,255,255,0.92)' }}
                >
                  Server Name{' '}
                  <span aria-hidden="true" style={{ color: '#ef4444' }}>
                    *
                  </span>
                </label>

                <div className="relative">
                  <input
                    ref={inputRef}
                    id="server-name-input"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    onKeyDown={handleKeyDownInput}
                    onAnimationEnd={handleAnimationEnd}
                    maxLength={MAX_NAME}
                    placeholder="e.g. Intro to Organic Chemistry"
                    disabled={isLoading}
                    aria-required="true"
                    aria-invalid={validationError ? 'true' : undefined}
                    aria-describedby={validationError ? 'server-name-error' : undefined}
                    className="w-full rounded-md px-3 h-9 text-sm transition-all focus-visible:outline-none"
                    style={{
                      backgroundColor: '#1c1c1f',
                      border: validationError
                        ? '1px solid #ef4444'
                        : '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.92)',
                      boxShadow: validationError ? '0 0 0 2px rgba(239,68,68,0.2)' : undefined,
                      animation: shake ? 'shake 250ms ease-in-out' : undefined,
                    }}
                  />
                </div>

                {/* Feedback row */}
                <div className="flex items-start mt-1.5 min-h-[20px]">
                  {validationError && (
                    <span
                      id="server-name-error"
                      role="alert"
                      aria-live="polite"
                      className="text-sm font-medium"
                      style={{ color: '#ef4444' }}
                    >
                      Server name cannot be empty
                    </span>
                  )}
                  <span
                    className="ml-auto text-xs tabular-nums"
                    aria-live="polite"
                    aria-atomic="true"
                    style={{ color: charWarning ? '#f59e0b' : 'rgba(255,255,255,0.40)' }}
                  >
                    {name.length}/{MAX_NAME}
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <footer
            className="flex items-center justify-end gap-3 px-4 py-4 shrink-0 rounded-b-[10px]"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(10,10,11,0.40)',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex h-[34px] items-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(255,255,255,0.06)',
                opacity: isLoading ? 0.5 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!submitEnabled}
              aria-disabled={!submitEnabled}
              aria-busy={isLoading}
              className="relative flex h-[34px] min-w-[90px] items-center justify-center overflow-hidden rounded-md px-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: '#10b981',
                color: '#0a0a0b',
                opacity: submitEnabled ? 1 : 0.5,
                cursor: submitEnabled ? 'pointer' : 'not-allowed',
              }}
            >
              <span style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 150ms' }}>
                Create
              </span>
              {isLoading && (
                <span
                  className="absolute inset-0 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <SpinnerIcon size={18} className="animate-spin" />
                </span>
              )}
            </button>
          </footer>
        </div>
      </dialog>

      {/* Keyframe styles for modal-enter and shake animations */}
      <style>{`
        @keyframes modal-enter {
          0%   { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-4px); }
          75%       { transform: translateX(4px); }
        }
      `}</style>
    </>
  );
}
