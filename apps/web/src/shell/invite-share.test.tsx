/**
 * Tests for InviteShareModal.
 *
 * Coverage:
 *   - Renders loading skeleton while fetching invite
 *   - Renders link + Copy button once invite loads
 *   - Copy button triggers clipboard write + shows Copied state
 *   - Error state + Retry when createInvite fails
 *   - Close button calls onClose
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.hoisted(() => ({
  createInvite: vi.fn(),
  getInvitePreview: vi.fn(),
  joinViaInvite: vi.fn(),
  getMe: vi.fn(),
  getServers: vi.fn(),
}));

vi.mock('../auth/api', () => ({ api: mockApi }));

// ── Mock clipboard ────────────────────────────────────────────────────────────

// jsdom's navigator.clipboard is configurable via vi.stubGlobal but NOT via
// Object.defineProperty (non-configurable once set). Use vi.stubGlobal instead.
const mockWriteText = vi.fn();
vi.stubGlobal('navigator', {
  ...globalThis.navigator,
  clipboard: { writeText: mockWriteText },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

let InviteShareModal: typeof import('./InviteShareModal').InviteShareModal;

const defaultProps = {
  serverId: 'srv-1',
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

describe('InviteShareModal', () => {
  it('shows loading skeleton while creating invite', () => {
    // Never resolves — stays loading
    mockApi.createInvite.mockReturnValue(new Promise(() => {}));

    renderModal();

    // Loading state: Copy button disabled, Done button disabled
    expect(screen.getByLabelText(/copy invite link to clipboard/i)).toBeDisabled();
  });

  it('renders invite link once createInvite resolves', async () => {
    mockApi.createInvite.mockResolvedValue({ code: 'XY7K', url: 'https://app.test/invite/XY7K' });

    renderModal();

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://app.test/invite/XY7K')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/copy invite link to clipboard/i)).not.toBeDisabled();
  });

  it('copies link to clipboard and shows Copied state', async () => {
    mockApi.createInvite.mockResolvedValue({ code: 'XY7K', url: 'https://app.test/invite/XY7K' });

    renderModal();

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://app.test/invite/XY7K')).toBeInTheDocument();
    });

    // Use fireEvent to avoid userEvent.setup() re-defining navigator.clipboard
    fireEvent.click(screen.getByLabelText(/copy invite link to clipboard/i));

    expect(mockWriteText).toHaveBeenCalledWith('https://app.test/invite/XY7K');

    await waitFor(() => {
      expect(screen.getByLabelText(/invite link copied/i)).toBeInTheDocument();
    });
  });

  it('shows error state when createInvite fails', async () => {
    mockApi.createInvite.mockRejectedValue(new Error('500 Server Error'));

    renderModal();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/couldn.*t load the invite link/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('retries fetch when Retry is clicked', async () => {
    mockApi.createInvite
      .mockRejectedValueOnce(new Error('500'))
      .mockResolvedValueOnce({ code: 'XY7K', url: 'https://app.test/invite/XY7K' });

    renderModal();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://app.test/invite/XY7K')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    mockApi.createInvite.mockResolvedValue({ code: 'XY7K', url: 'https://app.test/invite/XY7K' });

    renderModal({ onClose });

    await waitFor(() => {
      expect(screen.getByLabelText(/close invite dialog/i)).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/close invite dialog/i));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Done button is clicked', async () => {
    const onClose = vi.fn();
    mockApi.createInvite.mockResolvedValue({ code: 'XY7K', url: 'https://app.test/invite/XY7K' });

    renderModal({ onClose });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /done/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
