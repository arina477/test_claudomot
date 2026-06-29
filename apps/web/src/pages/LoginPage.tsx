/**
 * LoginPage — custom email/password sign-in form.
 * WRONG_CREDENTIALS → "Wrong email or password." banner.
 * FIELD_ERROR → per-field inline error.
 * Authenticated users are redirected away by the router guard before
 * this page renders.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from 'supertokens-auth-react/recipe/emailpassword';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { SubmitButton } from '../components/SubmitButton';

type FieldErrors = { email?: string; password?: string };

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError('');
    setLoading(true);

    try {
      const result = await signIn({
        formFields: [
          { id: 'email', value: email },
          { id: 'password', value: password },
        ],
      });

      if (result.status === 'OK') {
        // Redirect to app; SessionAuth on /app will pick up the fresh session.
        navigate('/app', { replace: true });
        return;
      }

      if (result.status === 'WRONG_CREDENTIALS_ERROR') {
        setGlobalError('Wrong email or password. Please try again.');
        return;
      }

      if (result.status === 'FIELD_ERROR') {
        const errs: FieldErrors = {};
        for (const f of result.formFields) {
          if (f.id === 'email') errs.email = f.error;
          if (f.id === 'password') errs.password = f.error;
        }
        setFieldErrors(errs);
        return;
      }

      if (result.status === 'SIGN_IN_NOT_ALLOWED') {
        setGlobalError(result.reason ?? 'Sign in is not allowed. Please contact support.');
        return;
      }

      setGlobalError('Something went wrong. Please try again.');
    } catch {
      setGlobalError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your study space.">
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
          error={fieldErrors.email}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
          error={fieldErrors.password}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs transition-colors hover:opacity-90"
            style={{ color: '#10b981' }}
          >
            Forgot password?
          </Link>
        </div>

        <SubmitButton loading={loading} disabled={!email || !password}>
          Sign In
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-[13px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 rounded-sm"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
