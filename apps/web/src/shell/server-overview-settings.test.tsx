/**
 * Component tests for ServerOverviewSettings.
 *
 * Covers:
 *   - Owner sees publish toggle; non-owner does NOT
 *   - Toggling publish marks dirty; Save calls api.updateServer with is_public
 *   - Toggling off (unpublish) also calls api.updateServer correctly
 *   - description edit → PATCH called with that field
 *   - topic edit → PATCH called with that field
 *   - Save success reflects state (dirty cleared, toast shown)
 *   - Error surfaces non-destructively (inline banner, fields unchanged)
 *   - 403 error surfaces with permission-denied message
 *   - Discard resets fields
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerOverviewSettingsProps } from './ServerOverviewSettings';
import { ServerOverviewSettings } from './ServerOverviewSettings';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../auth/api', () => ({
  api: {
    getMe: vi.fn(),
    updateServer: vi.fn(),
  },
}));

import { api } from '../auth/api';
type MockApi = {
  getMe: ReturnType<typeof vi.fn>;
  updateServer: ReturnType<typeof vi.fn>;
};
const mockApi = api as unknown as MockApi;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SERVER_ID = 'srv-overview-1';
const OWNER_ID = 'user-owner';
const MEMBER_ID = 'user-member';

function renderPage(props: Partial<ServerOverviewSettingsProps> = {}) {
  return render(
    <ServerOverviewSettings
      serverId={SERVER_ID}
      serverName="CS 410"
      ownerId={OWNER_ID}
      onClose={vi.fn()}
      {...props}
    />,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ServerOverviewSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getMe.mockResolvedValue({
      userId: OWNER_ID,
      email: 'owner@test.com',
      emailVerified: true,
    });
    mockApi.updateServer.mockResolvedValue({
      id: SERVER_ID,
      name: 'CS 410',
      ownerId: OWNER_ID,
    });
  });

  // ── Owner gate ────────────────────────────────────────────────────────────

  it('owner sees the publish section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('publish-section')).toBeInTheDocument();
    });
    expect(screen.getByRole('switch', { name: /list in public directory/i })).toBeInTheDocument();
  });

  it('non-owner does NOT see the publish section', async () => {
    mockApi.getMe.mockResolvedValue({
      userId: MEMBER_ID,
      email: 'member@test.com',
      emailVerified: true,
    });
    renderPage();
    // Wait for getMe to resolve
    await waitFor(() => {
      // sidebar should show "Member" not "Owner"
      expect(screen.getByText('Member')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('publish-section')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  // ── Publish toggle ────────────────────────────────────────────────────────

  it('toggling publish on calls api.updateServer with is_public true', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('publish-section')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch', { name: /list in public directory/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Toggle ON
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Save
    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(mockApi.updateServer).toHaveBeenCalledWith(
        SERVER_ID,
        expect.objectContaining({ is_public: true }),
      );
    });
  });

  it('toggling publish off calls api.updateServer with is_public false', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('publish-section')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch', { name: /list in public directory/i });

    // Toggle ON then OFF
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(mockApi.updateServer).toHaveBeenCalledWith(
        SERVER_ID,
        expect.objectContaining({ is_public: false }),
      );
    });
  });

  // ── Description field ─────────────────────────────────────────────────────

  it('description edit includes the new value in the PATCH call', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'Advanced data structures and algorithms.' },
    });

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(mockApi.updateServer).toHaveBeenCalledWith(
        SERVER_ID,
        expect.objectContaining({
          description: 'Advanced data structures and algorithms.',
        }),
      );
    });
  });

  it('empty description sends null in the patch', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
    });

    // topic is empty too, but we change it to trigger dirty
    fireEvent.change(screen.getByTestId('topic-input'), { target: { value: 'CS' } });
    fireEvent.change(screen.getByTestId('topic-input'), { target: { value: '' } });

    // description remains empty — but we need dirty to be set
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'x' } });
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: '' } });

    // Toggle to mark dirty (simplest path)
    const toggle = screen.queryByRole('switch');
    if (toggle) fireEvent.click(toggle);
    else {
      // non-owner branch: set topic to dirty
      fireEvent.change(screen.getByTestId('topic-input'), { target: { value: 'Physics' } });
    }

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(mockApi.updateServer).toHaveBeenCalledWith(
        SERVER_ID,
        expect.objectContaining({ description: null }),
      );
    });
  });

  // ── Topic field ───────────────────────────────────────────────────────────

  it('topic edit includes the new value in the PATCH call', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('topic-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('topic-input'), {
      target: { value: 'Physics' },
    });

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(mockApi.updateServer).toHaveBeenCalledWith(
        SERVER_ID,
        expect.objectContaining({ topic: 'Physics' }),
      );
    });
  });

  // ── Save success ─────────────────────────────────────────────────────────

  it('save success clears dirty state (discard button disappears)', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'My server description.' },
    });

    expect(screen.getByTestId('discard-btn')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(mockApi.updateServer).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('discard-btn')).not.toBeInTheDocument();
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('surfaces non-destructive error on API failure', async () => {
    mockApi.updateServer.mockRejectedValueOnce(new Error('500 Internal Server Error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'test description' },
    });

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('overview-save-error')).toBeInTheDocument();
    });

    // fields still contain their values (non-destructive)
    expect(screen.getByTestId('description-input')).toHaveValue('test description');
  });

  it('surfaces permission-denied message on 403', async () => {
    mockApi.updateServer.mockRejectedValueOnce(new Error('403 Forbidden'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'something' },
    });

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      const err = screen.getByTestId('overview-save-error');
      expect(err).toHaveTextContent(/owner/i);
    });
  });

  // ── Discard ───────────────────────────────────────────────────────────────

  it('discard resets description and topic fields', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'Some description' },
    });
    fireEvent.change(screen.getByTestId('topic-input'), {
      target: { value: 'CS101' },
    });

    expect(screen.getByTestId('discard-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('discard-btn'));

    expect(screen.getByTestId('description-input')).toHaveValue('');
    expect(screen.getByTestId('topic-input')).toHaveValue('');
    expect(screen.queryByTestId('discard-btn')).not.toBeInTheDocument();
  });
});
