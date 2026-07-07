/**
 * Component tests for ServerOverviewSettings.
 *
 * Covers:
 *   - Owner sees publish toggle; non-owner does NOT
 *   - Non-owner sees description/topic read-only (disabled) and NO Save button (Fix 1)
 *   - Toggling publish marks dirty; Save calls api.updateServer with is_public
 *   - Toggling off (unpublish) also calls api.updateServer correctly
 *   - description edit → PATCH called with that field
 *   - topic edit → PATCH called with that field
 *   - Save success reflects state (dirty cleared, toast shown)
 *   - After save: panel reflects saved state on reopen; onSaveSuccess callback fired (Fix 2)
 *   - Error surfaces non-destructively (inline banner, fields unchanged)
 *   - 403 error keyed off HttpError.status, not message string (Fix 4)
 *   - Toggle-only save sends ONLY is_public in the patch (Fix 5 partial patch)
 *   - Discard resets fields
 *   - Pre-populate: existing server values shown on open (is_public=true, description, topic)
 *   - Pre-populate + save: editing one field preserves the pre-populated others in the PATCH
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../auth/api';
import type { ServerOverviewSettingsProps } from './ServerOverviewSettings';
import { ServerOverviewSettings } from './ServerOverviewSettings';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../auth/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../auth/api')>();
  return {
    ...actual,
    api: {
      getMe: vi.fn(),
      updateServer: vi.fn(),
      // ServerPlanPanel is mounted inside ServerOverviewSettings (wave-75).
      getServerPlan: vi.fn().mockResolvedValue({
        serverId: 'srv-overview-1',
        tier: 'free',
        entitlements: { storageMb: 2048, callCapacity: 5, educatorAdminTools: false },
      }),
      changeServerTier: vi.fn(),
    },
  };
});

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

  // Fix 1: non-owner sees fields disabled and no Save button
  it('non-owner sees description and topic fields as disabled (read-only)', async () => {
    mockApi.getMe.mockResolvedValue({
      userId: MEMBER_ID,
      email: 'member@test.com',
      emailVerified: true,
    });
    renderPage({
      initialDescription: 'A server for CS students.',
      initialTopic: 'CS',
    });
    await waitFor(() => {
      expect(screen.getByText('Member')).toBeInTheDocument();
    });
    expect(screen.getByTestId('description-input')).toBeDisabled();
    expect(screen.getByTestId('topic-input')).toBeDisabled();
  });

  it('non-owner does NOT see the Save button', async () => {
    mockApi.getMe.mockResolvedValue({
      userId: MEMBER_ID,
      email: 'member@test.com',
      emailVerified: true,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Member')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('save-btn')).not.toBeInTheDocument();
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
    // Start with is_public=true so toggling off is an actual change.
    renderPage({ initialIsPublic: true });
    await waitFor(() => {
      expect(screen.getByTestId('publish-section')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch', { name: /list in public directory/i });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Toggle OFF
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

  // Fix 5: toggle-only save sends ONLY is_public (no description/topic)
  it('toggle-only save sends ONLY is_public in the patch (partial patch)', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('publish-section')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch', { name: /list in public directory/i });
    fireEvent.click(toggle);

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(mockApi.updateServer).toHaveBeenCalledWith(SERVER_ID, { is_public: true });
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
    // Start with a non-empty description so clearing it IS a change from the baseline.
    renderPage({ initialDescription: 'Some existing description.' });
    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toHaveValue('Some existing description.');
    });

    // Clear the description — this is a real change (baseline was non-empty, now empty).
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: '' } });

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

  // Fix 2: after save, onSaveSuccess is called so the parent can refresh selectedDetail
  it('calls onSaveSuccess after a successful save', async () => {
    const onSaveSuccess = vi.fn();
    renderPage({ onSaveSuccess });

    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'Updated description.' },
    });

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalledOnce();
    });
  });

  // Fix 2: after save the baseline is updated so Discard restores to the saved values
  it('after save, Discard restores to the saved (not original mount) values', async () => {
    renderPage({ initialDescription: 'Original.' });

    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toHaveValue('Original.');
    });

    // Edit and save
    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'Saved description.' },
    });
    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(mockApi.updateServer).toHaveBeenCalled();
    });
    // After save, dirty is cleared
    await waitFor(() => {
      expect(screen.queryByTestId('discard-btn')).not.toBeInTheDocument();
    });

    // Now make a further edit and then Discard — should restore to 'Saved description.'
    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'Another edit.' },
    });
    expect(screen.getByTestId('discard-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('discard-btn'));

    expect(screen.getByTestId('description-input')).toHaveValue('Saved description.');
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

  // Fix 4: 403 keyed off HttpError.status, not message string
  it('surfaces permission-denied message on HttpError with status 403', async () => {
    mockApi.updateServer.mockRejectedValueOnce(new HttpError(403, '403 Forbidden: not owner'));
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

  it('surfaces permission-denied message on plain Error with 403 in message (fallback)', async () => {
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

  // ── Pre-populate ──────────────────────────────────────────────────────────

  it('pre-populates toggle ON and field values when server is already published', async () => {
    renderPage({
      initialIsPublic: true,
      initialDescription: 'Advanced data structures.',
      initialTopic: 'CS 410',
    });

    // Wait for owner identity to resolve so the publish section appears
    await waitFor(() => {
      expect(screen.getByTestId('publish-section')).toBeInTheDocument();
    });

    // Toggle should reflect the real is_public=true
    const toggle = screen.getByRole('switch', { name: /list in public directory/i });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    // Description and topic should show the real server values
    expect(screen.getByTestId('description-input')).toHaveValue('Advanced data structures.');
    expect(screen.getByTestId('topic-input')).toHaveValue('CS 410');
  });

  it('editing only description preserves pre-populated is_public and topic in the PATCH', async () => {
    renderPage({
      initialIsPublic: true,
      initialDescription: 'Original description.',
      initialTopic: 'Physics',
    });

    await waitFor(() => {
      expect(screen.getByTestId('description-input')).toBeInTheDocument();
    });

    // Edit only the description — leave toggle and topic untouched
    fireEvent.change(screen.getByTestId('description-input'), {
      target: { value: 'Updated description.' },
    });

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      // Fix 5: only description changed — is_public and topic are NOT in the patch
      expect(mockApi.updateServer).toHaveBeenCalledWith(SERVER_ID, {
        description: 'Updated description.',
      });
    });
  });
});
