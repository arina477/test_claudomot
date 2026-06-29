/**
 * Light render tests for the six auth + profile pages.
 *
 * Strategy:
 *  - Mock supertokens-auth-react SDK functions so no real HTTP calls are made.
 *  - Wrap every render in MemoryRouter + a minimal SuperTokensWrapper stub
 *    (the real SDK is initialised in App.tsx; here we bypass it).
 *  - Assert the page renders, key form fields / headings exist, and links work.
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// ── Mock supertokens-auth-react ───────────────────────────────────────────────

vi.mock('supertokens-auth-react', () => ({
  SuperTokensWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: { init: vi.fn() },
  init: vi.fn(),
}));

vi.mock('supertokens-auth-react/recipe/emailpassword', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  submitNewPassword: vi.fn(),
  getResetPasswordTokenFromURL: vi.fn(() => 'fake-token'),
}));

vi.mock('supertokens-auth-react/recipe/emailverification', () => ({
  verifyEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
  getEmailVerificationTokenFromURL: vi.fn(() => ''),
}));

vi.mock('supertokens-auth-react/recipe/session', () => ({
  SessionAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSessionContext: vi.fn(() => ({ loading: false, doesSessionExist: false })),
}));

// Mock the API module so ProfilePage doesn't hit the live backend
vi.mock('../auth/api', () => ({
  api: {
    getMe: vi.fn(() => Promise.resolve({ userId: 'u1', email: 'a@b.com', emailVerified: true })),
    getProfile: vi.fn(() => Promise.resolve({ displayName: 'Test User' })),
    patchProfile: vi.fn(() => Promise.resolve({ displayName: 'Test User' })),
  },
}));

// ── Page imports ──────────────────────────────────────────────────────────────

import { EmailVerifyPage } from './EmailVerifyPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { LandingPage } from './LandingPage';
import { LoginPage } from './LoginPage';
import { ProfilePage } from './ProfilePage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { SignupPage } from './SignupPage';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderInRouter(ui: React.ReactElement, initialPath = '/') {
  return render(<MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LandingPage', () => {
  it('renders the main headline', () => {
    renderInRouter(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('has a link to /signup', () => {
    renderInRouter(<LandingPage />);
    const links = screen.getAllByRole('link', { name: /create free account|get started/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it('has a link to /login', () => {
    renderInRouter(<LandingPage />);
    const links = screen.getAllByRole('link', { name: /sign in/i });
    expect(links.length).toBeGreaterThan(0);
  });
});

describe('SignupPage', () => {
  it('renders the email and password fields', () => {
    renderInRouter(<SignupPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('has a submit button', () => {
    renderInRouter(<SignupPage />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('has a link to /login', () => {
    renderInRouter(<SignupPage />);
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });
});

describe('LoginPage', () => {
  it('renders the email and password fields', () => {
    renderInRouter(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('has a sign in submit button', () => {
    renderInRouter(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('has a forgot-password link', () => {
    renderInRouter(<LoginPage />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });
});

describe('ForgotPasswordPage', () => {
  it('renders the email field', () => {
    renderInRouter(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('has a send reset link button', () => {
    renderInRouter(<ForgotPasswordPage />);
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });
});

describe('ResetPasswordPage', () => {
  it('renders new password and confirm fields', () => {
    renderInRouter(<ResetPasswordPage />, '/reset-password?token=fake-token');
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('has an update password button', () => {
    renderInRouter(<ResetPasswordPage />, '/reset-password?token=fake-token');
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
  });
});

describe('EmailVerifyPage (idle — no token)', () => {
  it('renders the check-your-email heading', () => {
    renderInRouter(<EmailVerifyPage />);
    expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
  });

  it('has a resend button', () => {
    renderInRouter(<EmailVerifyPage />);
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
  });
});

describe('ProfilePage', () => {
  it('renders the settings heading', async () => {
    renderInRouter(<ProfilePage />);
    // Page has async data load; wait for the skeleton to resolve
    expect(await screen.findByRole('heading', { name: /settings.*profile/i })).toBeInTheDocument();
  });

  it('renders the display name field after load', async () => {
    renderInRouter(<ProfilePage />);
    expect(await screen.findByLabelText(/display name/i)).toBeInTheDocument();
  });
});
