/**
 * Tests for InviteShareModal (wave-9 delta).
 *
 * Coverage:
 *   8b regression guard: opening the modal does NOT call createInvite (no ad-hoc mint on open).
 *   8b: modal renders the PERMANENT link passed via inviteCode prop immediately.
 *   8b: null inviteCode → fallback message shown, no link input.
 *   Copy button writes permanent URL to clipboard + shows Copied state.
 *   "Generate a limited invite" calls createInvite and shows the invite in the list.
 *   Revoke trash button → confirm row appears (two-step).
 *   Cancel in confirm row → row returns to normal.
 *   Confirm revoke → calls revokeInvite + marks row as revoked + shows Toast.
 *   Close button calls onClose.
 *   Done button calls onClose.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.hoisted(() => ({
  createInvite: vi.fn(),
  revokeInvite: vi.fn(),
  getInvitePreview: vi.fn(),
  joinViaInvite: vi.fn(),
  getMe: vi.fn(),
  getServers: vi.fn(),
}));

vi.mock('../auth/api', () => ({ api: mockApi }));

// ── Mock clipboard ────────────────────────────────────────────────────────────

const mockWriteText = vi.fn();
vi.stubGlobal('navigator', {
  ...globalThis.navigator,
  clipboard: { writeText: mockWriteText },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

let InviteShareModal: typeof import('./InviteShareModal').InviteShareModal;

const PERMANENT_CODE = 'PERM_ABC123';
// jsdom sets window.location.origin = 'http://localhost' by default
const PERMANENT_URL = `${window.location.origin}/invite/${PERMANENT_CODE}`;

const defaultProps = {
  serverId: 'srv-1',
  inviteCode: PERMANENT_CODE as string | null,
  onClose: vi.fn(),
};

function renderModal(propsOverride: Partial<typeof defaultProps> = {}) {
  return render(<InviteShareModal {...defaultProps} {...propsOverride} />);
}

beforeEach(async () => {
  vi.clearAllMocks();
  mockWriteText.mockResolvedValue(undefined);
  const mod = await import('./InviteShareModal');
  InviteShareModal = mod.InviteShareModal;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InviteShareModal — 8b permanent-default', () => {
  it('[8b regression guard] does NOT call createInvite on open', () => {
    renderModal();
    // After mount, createInvite must NOT have been called (no ad-hoc mint on open)
    expect(mockApi.createInvite).not.toHaveBeenCalled();
  });

  it('renders the permanent invite link immediately without loading state', () => {
    renderModal();
    // The permanent URL is in the input immediately — no async wait needed
    expect(screen.getByDisplayValue(PERMANENT_URL)).toBeInTheDocument();
    expect(screen.getByLabelText(/copy permanent invite link to clipboard/i)).not.toBeDisabled();
  });

  it('shows "Permanent" badge next to the link label', () => {
    renderModal();
    expect(screen.getByText('Permanent')).toBeInTheDocument();
  });

  it('shows fallback message when inviteCode is null', () => {
    renderModal({ inviteCode: null });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(/permanent link unavailable/i)).toBeInTheDocument();
  });

  it('copies permanent link to clipboard and shows Copied state', async () => {
    renderModal();

    // Link is visible immediately
    expect(screen.getByDisplayValue(PERMANENT_URL)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/copy permanent invite link to clipboard/i));

    expect(mockWriteText).toHaveBeenCalledWith(PERMANENT_URL);

    await waitFor(() => {
      expect(screen.getByLabelText(/invite link copied/i)).toBeInTheDocument();
    });
  });
});

describe('InviteShareModal — limited invites / revoke', () => {
  it('calls createInvite when "Generate a limited invite" is clicked', async () => {
    mockApi.createInvite.mockResolvedValue({
      code: 'ADHOC1',
      url: 'http://localhost/invite/ADHOC1',
    });

    renderModal();

    const user = userEvent.setup();
    await user.click(screen.getByTestId('generate-limited-invite'));

    expect(mockApi.createInvite).toHaveBeenCalledWith('srv-1');

    await waitFor(() => {
      // Row appears in the list
      expect(screen.getByLabelText(/revoke limited invite ending/i)).toBeInTheDocument();
    });
  });

  it('shows error when createInvite fails', async () => {
    mockApi.createInvite.mockRejectedValue(new Error('500'));

    renderModal();

    const user = userEvent.setup();
    await user.click(screen.getByTestId('generate-limited-invite'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('shows confirm row (two-step) when trash is clicked', async () => {
    mockApi.createInvite.mockResolvedValue({
      code: 'ADHOC2',
      url: 'http://localhost/invite/ADHOC2',
    });

    renderModal();

    const user = userEvent.setup();
    await user.click(screen.getByTestId('generate-limited-invite'));

    await waitFor(() => {
      expect(screen.getByLabelText(/revoke limited invite ending/i)).toBeInTheDocument();
    });

    // Click trash
    await user.click(screen.getByLabelText(/revoke limited invite ending/i));

    // Confirm row must appear
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm revoke/i })).toBeInTheDocument();
  });

  it('cancels revoke confirm and returns row to normal', async () => {
    mockApi.createInvite.mockResolvedValue({
      code: 'ADHOC3',
      url: 'http://localhost/invite/ADHOC3',
    });

    renderModal();

    const user = userEvent.setup();
    await user.click(screen.getByTestId('generate-limited-invite'));

    await waitFor(() => {
      expect(screen.getByLabelText(/revoke limited invite ending/i)).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText(/revoke limited invite ending/i));

    // Cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Confirm row gone, trash button back
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/revoke limited invite ending/i)).toBeInTheDocument();
  });

  it('calls revokeInvite and marks row as revoked on confirm', async () => {
    mockApi.createInvite.mockResolvedValue({
      code: 'ADHOC4',
      url: 'http://localhost/invite/ADHOC4',
    });
    mockApi.revokeInvite.mockResolvedValue(undefined);

    renderModal();

    const user = userEvent.setup();
    await user.click(screen.getByTestId('generate-limited-invite'));

    await waitFor(() => {
      expect(screen.getByLabelText(/revoke limited invite ending/i)).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText(/revoke limited invite ending/i));
    await user.click(screen.getByRole('button', { name: /confirm revoke/i }));

    expect(mockApi.revokeInvite).toHaveBeenCalledWith('ADHOC4');

    await waitFor(() => {
      expect(screen.getByText(/revoked — this link no longer works/i)).toBeInTheDocument();
    });
  });
});

describe('InviteShareModal — close', () => {
  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/close invite dialog/i));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Done button is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /done/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
