/**
 * ForgotPasswordPage — sends a password reset email.
 * Calls EmailPassword.sendPasswordResetEmail().
 * On OK shows a confirmation message; FIELD_ERROR shows the email error.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'supertokens-auth-react/recipe/emailpassword';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { SubmitButton } from '../components/SubmitButton';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setGlobalError('');
    setLoading(true);

    try {
      const result = await sendPasswordResetEmail({
        formFields: [{ id: 'email', value: email }],
      });

      if (result.status === 'OK' || result.status === 'PASSWORD_RESET_NOT_ALLOWED') {
        // Per SuperTokens security guidance, always show success even if email
        // doesn't exist (avoids user enumeration).
        setSent(true);
        return;
      }

      if (result.status === 'FIELD_ERROR') {
        const f = result.formFields.find((f) => f.id === 'email');
        if (f) setEmailError(f.error);
        return;
      }

      setGlobalError('Something went wrong. Please try again.');
    } catch {
      setGlobalError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="A reset link is on its way if that address is registered."
      >
        <div className="flex flex-col gap-6 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Didn&apos;t receive it? Check your spam folder, or{' '}
            <button
              type="button"
              className="font-medium transition-colors hover:opacity-90 focus-visible:outline-none rounded-sm"
              style={{ color: '#10b981' }}
              onClick={() => setSent(false)}
            >
              try again
            </button>
            .
          </p>
          <Link
            to="/login"
            className="text-sm font-medium transition-colors hover:opacity-90"
            style={{ color: 'rgba(255,255,255,0.60)' }}
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {globalError && (
        <div className="mb-6">
          <ErrorBanner message={globalError} />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          autoComplete="email"
          required
          error={emailError}
        />

        <SubmitButton loading={loading} disabled={!email}>
          Send Reset Link
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-[13px]">
        <Link
          to="/login"
          className="transition-colors hover:opacity-90"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
