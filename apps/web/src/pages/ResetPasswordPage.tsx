/**
 * ResetPasswordPage — consumed via the link from the reset-password email.
 * Reads the token from the URL using EmailPassword.getResetPasswordTokenFromURL(),
 * then calls EmailPassword.submitNewPassword().
 *
 * Routes: /reset-password?token=<tok>
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getResetPasswordTokenFromURL,
  submitNewPassword,
} from 'supertokens-auth-react/recipe/emailpassword';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { SubmitButton } from '../components/SubmitButton';

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setGlobalError('');

    if (password !== confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await submitNewPassword({
        formFields: [{ id: 'password', value: password }],
      });

      if (result.status === 'OK') {
        navigate('/login', { replace: true });
        return;
      }

      if (result.status === 'RESET_PASSWORD_INVALID_TOKEN_ERROR') {
        setGlobalError(
          'This reset link has expired or already been used. Please request a new one.',
        );
        return;
      }

      if (result.status === 'FIELD_ERROR') {
        const f = result.formFields.find((f) => f.id === 'password');
        if (f) setPasswordError(f.error);
        return;
      }

      setGlobalError('Something went wrong. Please try again.');
    } catch {
      setGlobalError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // Token is consumed by the SDK directly from the URL; we only need to check
  // it is present so we can show a useful message if someone navigates here bare.
  const token = getResetPasswordTokenFromURL();
  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is missing a token.">
        <div className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
          <Link
            to="/forgot-password"
            className="font-medium hover:opacity-90"
            style={{ color: '#10b981' }}
          >
            Request a new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose something you haven't used before.">
      {globalError && (
        <div className="mb-6">
          <ErrorBanner message={globalError} />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          id="password"
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
          error={passwordError}
        />

        <FormField
          id="confirm"
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
        />

        <SubmitButton loading={loading} disabled={!password || !confirm}>
          Update Password
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
