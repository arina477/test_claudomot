/**
 * Light render tests for the six auth + profile pages.
 *
 * Strategy:
 *  - Mock supertokens-auth-react SDK functions so no real HTTP calls are made.
 *  - Wrap every render in MemoryRouter + a minimal SuperTokensWrapper stub
 *    (the real SDK is initialised in App.tsx; here we bypass it).
 *  - Assert the page renders, key form fields / headings exist, and links work.
 *
 * ProfilePage tests cover wave-4 additions:
 *   - username validation feedback (format error, 409 taken error)
 *   - accent swatch selection
 *   - avatar 503-graceful degradation
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

// ── api mock — extended for wave-4 ───────────────────────────────────────────
// vi.hoisted ensures these are defined before the hoisted vi.mock factory runs.

const {
  mockGetProfile,
  mockPatchProfile,
  mockPresignAvatar,
  mockPutAvatarToStorage,
  mockConfirmAvatar,
} = vi.hoisted(() => {
  const defaultProfile = {
    displayName: 'Test User',
    username: 'testuser',
    avatarUrl: null as string | null,
    accentColor: '#10b981',
  };

  return {
    mockGetProfile: vi.fn(() => Promise.resolve(defaultProfile)),
    mockPatchProfile: vi.fn(() => Promise.resolve(defaultProfile)),
    mockPresignAvatar: vi.fn(() =>
      Promise.resolve({
        uploadUrl: 'https://storage.example.com/upload',
        key: 'avatars/u1/img.png',
      }),
    ),
    mockPutAvatarToStorage: vi.fn(() => Promise.resolve()),
    mockConfirmAvatar: vi.fn(() =>
      Promise.resolve({ ...defaultProfile, avatarUrl: 'https://cdn.example.com/avatars/u1.png' }),
    ),
  };
});

vi.mock('../auth/api', () => ({
  api: {
    getMe: vi.fn(() => Promise.resolve({ userId: 'u1', email: 'a@b.com', emailVerified: true })),
    getProfile: mockGetProfile,
    patchProfile: mockPatchProfile,
    presignAvatar: mockPresignAvatar,
    putAvatarToStorage: mockPutAvatarToStorage,
    confirmAvatar: mockConfirmAvatar,
  },
}));

// ── ProfileContext mock ───────────────────────────────────────────────────────
// ProfilePage uses useProfile() from ProfileContext; stub it so tests don't need
// the full ProfileProvider tree.

vi.mock('../shell/ProfileContext', () => ({
  useProfile: vi.fn(() => ({ profile: null, refresh: vi.fn() })),
  ProfileProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ProfileContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
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

// ── LandingPage ───────────────────────────────────────────────────────────────

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

// ── SignupPage ────────────────────────────────────────────────────────────────

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

// ── LoginPage ─────────────────────────────────────────────────────────────────

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

// ── ForgotPasswordPage ────────────────────────────────────────────────────────

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

// ── ResetPasswordPage ─────────────────────────────────────────────────────────

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

// ── EmailVerifyPage ───────────────────────────────────────────────────────────

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

// ── ProfilePage ───────────────────────────────────────────────────────────────

describe('ProfilePage', () => {
  const defaultProfile = {
    displayName: 'Test User',
    username: 'testuser',
    avatarUrl: null as string | null,
    accentColor: '#10b981',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue(defaultProfile);
    mockPatchProfile.mockResolvedValue(defaultProfile);
    mockPresignAvatar.mockResolvedValue({
      uploadUrl: 'https://storage.example.com/upload',
      key: 'avatars/u1/img.png',
    });
    mockPutAvatarToStorage.mockResolvedValue(undefined);
    mockConfirmAvatar.mockResolvedValue({
      ...defaultProfile,
      avatarUrl: 'https://cdn.example.com/avatars/u1.png',
    });
  });

  it('renders the settings heading', async () => {
    renderInRouter(<ProfilePage />);
    expect(await screen.findByRole('heading', { name: /settings.*profile/i })).toBeInTheDocument();
  });

  it('renders the display name field after load', async () => {
    renderInRouter(<ProfilePage />);
    expect(await screen.findByLabelText(/display name/i)).toBeInTheDocument();
  });

  it('renders the username field after load', async () => {
    renderInRouter(<ProfilePage />);
    expect(await screen.findByLabelText(/username/i)).toBeInTheDocument();
  });

  it('renders the accent colour radiogroup after load', async () => {
    renderInRouter(<ProfilePage />);
    expect(await screen.findByRole('radiogroup', { name: /accent colour/i })).toBeInTheDocument();
  });

  // ── Username validation feedback ─────────────────────────────────────────

  it('shows a format error for invalid username (too short)', async () => {
    const user = userEvent.setup();
    renderInRouter(<ProfilePage />);

    const input = await screen.findByLabelText(/username/i);
    await user.clear(input);
    await user.type(input, 'ab'); // only 2 chars → below min 3

    expect(await screen.findByText(/3.*20 characters/i)).toBeInTheDocument();
  });

  it('shows a format error when special chars are stripped leaving a too-short value', async () => {
    const user = userEvent.setup();
    renderInRouter(<ProfilePage />);

    const input = await screen.findByLabelText(/username/i);
    // The input handler strips non-[a-z0-9_] chars; 'ab!' strips to 'ab' → too short
    await user.clear(input);
    await user.type(input, 'ab!');
    expect(await screen.findByText(/3.*20 characters/i)).toBeInTheDocument();
  });

  it('shows "username taken" error on 409 from PATCH /profile', async () => {
    mockPatchProfile.mockRejectedValueOnce(new Error('409 Conflict: username taken'));
    const user = userEvent.setup();
    renderInRouter(<ProfilePage />);

    const input = await screen.findByLabelText(/username/i);
    await user.clear(input);
    await user.type(input, 'newhandle');

    const saveBtn = screen.getByRole('button', { name: /save username/i });
    await user.click(saveBtn);

    expect(await screen.findByText(/already taken/i)).toBeInTheDocument();
  });

  it('shows "format error" message on 400 from PATCH /profile', async () => {
    mockPatchProfile.mockRejectedValueOnce(new Error('400 Bad Request: invalid username format'));
    const user = userEvent.setup();
    renderInRouter(<ProfilePage />);

    const input = await screen.findByLabelText(/username/i);
    await user.clear(input);
    await user.type(input, 'validname');

    const saveBtn = screen.getByRole('button', { name: /save username/i });
    await user.click(saveBtn);

    expect(await screen.findByText(/3.*20 characters/i)).toBeInTheDocument();
  });

  // ── Accent colour selection ───────────────────────────────────────────────

  it('marks the Emerald swatch as checked by default', async () => {
    renderInRouter(<ProfilePage />);
    await screen.findByRole('radiogroup', { name: /accent colour/i });

    const emeraldSwatch = screen.getByRole('radio', { name: /emerald/i });
    expect(emeraldSwatch).toHaveAttribute('aria-checked', 'true');
  });

  it('calls patchProfile with accentColor when a different swatch is clicked', async () => {
    const user = userEvent.setup();
    mockPatchProfile.mockResolvedValue({ ...defaultProfile, accentColor: '#3b82f6' });

    renderInRouter(<ProfilePage />);
    await screen.findByRole('radiogroup', { name: /accent colour/i });

    const blueSwatch = screen.getByRole('radio', { name: /blue/i });
    await user.click(blueSwatch);

    await waitFor(() => {
      expect(mockPatchProfile).toHaveBeenCalledWith(
        expect.objectContaining({ accentColor: '#3b82f6' }),
      );
    });
  });

  // ── Avatar 503-graceful degradation ──────────────────────────────────────

  it('shows "avatar upload not available yet" when presign returns 503', async () => {
    mockPresignAvatar.mockRejectedValueOnce(
      new Error('503 Service Unavailable: STORAGE_NOT_CONFIGURED'),
    );
    const user = userEvent.setup();
    renderInRouter(<ProfilePage />);

    await screen.findByLabelText(/avatar file upload/i);

    const file = new File(['fake-img'], 'photo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/avatar file upload/i);
    await user.upload(input, file);

    expect(await screen.findByText(/not available yet/i)).toBeInTheDocument();
  });

  it('rejects avatar files larger than 2 MB without calling the API', async () => {
    const user = userEvent.setup();
    renderInRouter(<ProfilePage />);
    await screen.findByLabelText(/avatar file upload/i);

    // Stub a > 2 MB file
    const bigFile = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 3 * 1024 * 1024 });

    const input = screen.getByLabelText(/avatar file upload/i);
    await user.upload(input, bigFile);

    expect(await screen.findByText(/smaller than 2 mb/i)).toBeInTheDocument();
    expect(mockPresignAvatar).not.toHaveBeenCalled();
  });
});
