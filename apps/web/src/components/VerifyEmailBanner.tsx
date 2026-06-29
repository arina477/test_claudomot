/**
 * VerifyEmailBanner — shown inside the app shell when the session user
 * has emailVerified:false (from GET /me).
 *
 * Unverified users CAN access the app shell (backend claim relaxed for /me).
 * This banner is purely informational + gives a resend action.
 */

import { useState } from 'react';
import { sendVerificationEmail } from 'supertokens-auth-react/recipe/emailverification';

type Props = {
  onDismiss?: () => void;
};

export function VerifyEmailBanner({ onDismiss }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  async function handleResend() {
    setState('loading');
    try {
      await sendVerificationEmail();
      setState('sent');
    } catch {
      setState('error');
    }
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center justify-between gap-4 px-4 py-2 text-sm"
      style={{
        backgroundColor: 'rgba(245,158,11,0.10)',
        borderBottom: '1px solid rgba(245,158,11,0.20)',
        color: '#f59e0b',
      }}
    >
      <span>
        Please verify your email address to get full access.{' '}
        {state === 'sent' && <span style={{ color: '#10b981' }}>Verification email sent!</span>}
        {state === 'error' && (
          <span style={{ color: '#ef4444' }}>Failed to send — please try again.</span>
        )}
      </span>

      <div className="flex shrink-0 items-center gap-3">
        {state !== 'sent' && (
          <button
            type="button"
            onClick={handleResend}
            disabled={state === 'loading'}
            className="rounded px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1"
            style={{
              backgroundColor: 'rgba(245,158,11,0.20)',
              border: '1px solid rgba(245,158,11,0.30)',
            }}
          >
            {state === 'loading' ? 'Sending…' : 'Resend email'}
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss verification banner"
            className="text-current opacity-60 hover:opacity-90 focus-visible:outline-none"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
