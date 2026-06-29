/**
 * EmailVerifyPage — two states:
 *   1. No token in URL → "check your email" message + resend button.
 *   2. Token in URL    → call verifyEmail(); show success or error.
 *
 * Route: /verify-email
 * The backend sends a link like: <websiteDomain>/verify-email?token=<tok>
 * SuperTokens EmailVerification reads this via getEmailVerificationTokenFromURL().
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getEmailVerificationTokenFromURL,
  sendVerificationEmail,
  verifyEmail,
} from 'supertokens-auth-react/recipe/emailverification';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorBanner } from '../components/ErrorBanner';
import { SubmitButton } from '../components/SubmitButton';

type VerifyState = 'idle' | 'verifying' | 'success' | 'error';

export function EmailVerifyPage() {
  const navigate = useNavigate();
  const token = getEmailVerificationTokenFromURL();

  const [verifyState, setVerifyState] = useState<VerifyState>(token ? 'verifying' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function consume() {
      try {
        const result = await verifyEmail();
        if (result.status === 'OK') {
          setVerifyState('success');
          // After successful verification, send to profile setup (first-run flow).
          setTimeout(() => navigate('/settings/profile', { replace: true }), 1500);
        } else {
          // EMAIL_VERIFICATION_INVALID_TOKEN_ERROR
          setErrorMsg(
            'This verification link has expired or already been used. Please request a new one.',
          );
          setVerifyState('error');
        }
      } catch {
        setErrorMsg('Something went wrong. Please try again.');
        setVerifyState('error');
      }
    }

    void consume();
  }, [token, navigate]);

  async function handleResend() {
    setResendLoading(true);
    setErrorMsg('');
    try {
      await sendVerificationEmail();
      setResendSent(true);
    } catch {
      setErrorMsg('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  if (verifyState === 'verifying') {
    return (
      <AuthLayout title="Verifying your email…" subtitle="Just a moment.">
        <div className="flex justify-center py-4">
          <span
            className="h-8 w-8 rounded-full border-2 border-current border-t-transparent sh-animate-spin"
            style={{ color: '#10b981' }}
            aria-label="Verifying"
          />
        </div>
      </AuthLayout>
    );
  }

  if (verifyState === 'success') {
    return (
      <AuthLayout title="Email verified!" subtitle="Redirecting to profile setup…">
        <div className="flex justify-center py-4">
          <span className="text-4xl" role="img" aria-label="Success" style={{ color: '#10b981' }}>
            ✓
          </span>
        </div>
      </AuthLayout>
    );
  }

  if (verifyState === 'error') {
    return (
      <AuthLayout title="Verification failed" subtitle="The link may have expired.">
        <ErrorBanner message={errorMsg} />
        <div className="mt-6 flex flex-col gap-3 text-center text-sm">
          <SubmitButton onClick={handleResend} loading={resendLoading} type="button">
            Send new verification email
          </SubmitButton>
          <Link
            to="/login"
            className="transition-colors hover:opacity-90"
            style={{ color: 'rgba(255,255,255,0.60)' }}
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // idle — post-signup state: show instructions + resend button
  return (
    <AuthLayout title="Check your email" subtitle="We sent a verification link to your inbox.">
      {errorMsg && (
        <div className="mb-6">
          <ErrorBanner message={errorMsg} />
        </div>
      )}

      <div className="flex flex-col gap-6 text-center">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
          Click the link in the email to verify your address, then you can set up your profile.
        </p>

        {resendSent ? (
          <p className="text-sm" style={{ color: '#10b981' }}>
            Sent! Check your inbox (and spam folder).
          </p>
        ) : (
          <SubmitButton onClick={handleResend} loading={resendLoading} type="button">
            Resend verification email
          </SubmitButton>
        )}

        <Link
          to="/login"
          className="text-xs transition-colors hover:opacity-90"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
