/**
 * SignupPage — custom email/password sign-up form.
 * Calls EmailPassword.signUp(); on FIELD_ERROR surfaces per-field errors;
 * on duplicate-email surfaces a banner ("Email already in use").
 * On success redirects to /verify-email (the post-signup verify flow).
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from 'supertokens-auth-react/recipe/emailpassword';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { SubmitButton } from '../components/SubmitButton';

type FieldErrors = { email?: string; password?: string };

export function SignupPage() {
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
      const result = await signUp({
        formFields: [
          { id: 'email', value: email },
          { id: 'password', value: password },
        ],
      });

      if (result.status === 'OK') {
        navigate('/verify-email', { replace: true });
        return;
      }

      if (result.status === 'FIELD_ERROR') {
        const errs: FieldErrors = {};
        for (const f of result.formFields) {
          if (f.id === 'email') errs.email = f.error;
          if (f.id === 'password') errs.password = f.error;
        }
        // SuperTokens returns "email already exists" via FIELD_ERROR on the email field
        setFieldErrors(errs);
        return;
      }

      if (result.status === 'SIGN_UP_NOT_ALLOWED') {
        setGlobalError('Sign up is not allowed at this time. Please try again later.');
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
    <AuthLayout title="Create your account" subtitle="Join the study session.">
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
          autoComplete="new-password"
          required
          error={fieldErrors.password}
        />

        <SubmitButton loading={loading} disabled={!email || !password} className="mt-2">
          Create Account
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-[13px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 rounded-sm"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
