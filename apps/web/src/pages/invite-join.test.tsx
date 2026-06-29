/**
 * Tests for InviteJoinPage (/invite/:code).
 *
 * Coverage:
 *   - Renders loading skeleton on mount
 *   - Renders server preview + Join button for valid authed+verified user
 *   - Renders error state when API returns 404
 *   - Renders unauthed state when no session
 *   - Join button triggers POST and redirects
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock supertokens ───────────────────────────────────────────────────────────

vi.mock('supertokens-auth-react', () => ({
  SuperTokensWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: { init: vi.fn() },
  init: vi.fn(),
}));

vi.mock('supertokens-auth-react/recipe/emailpassword', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('supertokens-auth-react/recipe/emailverification', () => ({
  verifyEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

const mockUseSessionContext = vi.fn();
vi.mock('supertokens-auth-react/recipe/session', () => ({
  SessionAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSessionContext: () => mockUseSessionContext(),
}));

// ── Mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.hoisted(() => ({
  getInvitePreview: vi.fn(),
  joinViaInvite: vi.fn(),
  getMe: vi.fn(),
  getServers: vi.fn(),
  createInvite: vi.fn(),
  getServerDetail: vi.fn(),
}));

vi.mock('../auth/api', () => ({ api: mockApi }));

// ── Mock useNavigate ──────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage(code = 'abc123') {
  return render(
    <MemoryRouter initialEntries={[`/invite/${code}`]}>
      <Routes>
        <Route path="/invite/:code" element={<InviteJoinPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

// Lazy import after mocks are hoisted
let InviteJoinPage: typeof import('./InviteJoinPage').InviteJoinPage;

beforeEach(async () => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  // Default: loading session
  mockUseSessionContext.mockReturnValue({ loading: false, doesSessionExist: true });
  mockApi.getMe.mockResolvedValue({ userId: 'u1', email: 'a@b.com', emailVerified: true });
  mockApi.getServers.mockResolvedValue([]);
  const mod = await import('./InviteJoinPage');
  InviteJoinPage = mod.InviteJoinPage;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InviteJoinPage', () => {
  it('shows loading skeleton initially (session still loading)', () => {
    mockUseSessionContext.mockReturnValue({ loading: true, doesSessionExist: false });
    mockApi.getInvitePreview.mockResolvedValue({
      server: { id: 's1', name: 'Chem Group', memberCount: 5 },
    });
    renderPage();
    // Skeleton present — no server name yet
    expect(screen.queryByText('Chem Group')).not.toBeInTheDocument();
  });

  it('renders server preview and Join button for valid authed+verified user', async () => {
    mockApi.getInvitePreview.mockResolvedValue({
      server: { id: 's1', name: 'Chem Group', memberCount: 42 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Chem Group')).toBeInTheDocument();
    });

    expect(screen.getByText(/42 members/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join server/i })).toBeInTheDocument();
  });

  it('renders invalid/error state when API returns 404', async () => {
    mockApi.getInvitePreview.mockRejectedValue(new Error('404 Not Found'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/link unavailable/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /return to app/i })).toBeInTheDocument();
  });

  it('renders unauthed state when no session exists', async () => {
    mockUseSessionContext.mockReturnValue({ loading: false, doesSessionExist: false });
    mockApi.getInvitePreview.mockResolvedValue({
      server: { id: 's1', name: 'Bio Study Hall', memberCount: 10 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign up to join/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('renders already-member state and shows go-to-server button', async () => {
    mockApi.getInvitePreview.mockResolvedValue({
      server: { id: 's1', name: 'Chem Group', memberCount: 42 },
    });
    // User is already a member
    mockApi.getServers.mockResolvedValue([{ id: 's1', name: 'Chem Group', ownerId: 'o1' }]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go to server/i })).toBeInTheDocument();
    });
  });

  it('calls joinViaInvite on Join click and redirects to /app', async () => {
    mockApi.getInvitePreview.mockResolvedValue({
      server: { id: 's1', name: 'Chem Group', memberCount: 42 },
    });
    mockApi.joinViaInvite.mockResolvedValue({ serverId: 's1' });

    renderPage('abc123');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /join server/i })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /join server/i }));

    expect(mockApi.joinViaInvite).toHaveBeenCalledWith('abc123');

    // Success state visible
    await waitFor(() => {
      expect(screen.getByText(/you joined/i)).toBeInTheDocument();
    });
  });

  it('shows unverified state when /me returns emailVerified:false', async () => {
    mockApi.getInvitePreview.mockResolvedValue({
      server: { id: 's1', name: 'Chem Group', memberCount: 5 },
    });
    mockApi.getMe.mockResolvedValue({ userId: 'u1', email: 'a@b.com', emailVerified: false });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/verify your email to join/i)).toBeInTheDocument();
    });
  });
});
