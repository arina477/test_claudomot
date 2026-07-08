/**
 * Tests for SettingsPrivacyPage.
 *
 * 1. toUiVisibility unit tests — prove the honest-selector collapse: the
 *    server-side 3-value profileVisibility enum collapses to the 2-option UI
 *    value, with `server-members` absorbed into `everyone`.
 *
 * 2. Presence toggle (wave-80 B-3) — through the REAL page:
 *    - renders as an ENABLED working switch (not disabled/Beta),
 *    - toggling issues a full-object PUT /profile/privacy including the changed
 *      showPresence plus the other current settings, and the UI + GET reflect it,
 *    - default state reflects the server showPresence value.
 */

import type { AccountDataResponse, PrivacySettingsResponse } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/api', () => ({
  api: {
    getPrivacy: vi.fn(),
    putPrivacy: vi.fn(),
    getAccountData: vi.fn(),
    exportAccountData: vi.fn(),
    getPrivacyEvents: vi.fn(),
    getBlocks: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

import { api } from '../auth/api';
import { SettingsPrivacyPage, toUiVisibility } from './SettingsPrivacyPage';

type MockApi = {
  getPrivacy: ReturnType<typeof vi.fn>;
  putPrivacy: ReturnType<typeof vi.fn>;
  getAccountData: ReturnType<typeof vi.fn>;
  exportAccountData: ReturnType<typeof vi.fn>;
  getPrivacyEvents: ReturnType<typeof vi.fn>;
  getBlocks: ReturnType<typeof vi.fn>;
  blockUser: ReturnType<typeof vi.fn>;
  unblockUser: ReturnType<typeof vi.fn>;
  deleteAccount: ReturnType<typeof vi.fn>;
};
const mockApi = api as unknown as MockApi;

function makePrivacy(overrides: Partial<PrivacySettingsResponse> = {}): PrivacySettingsResponse {
  return {
    profileVisibility: 'everyone',
    whoCanDm: 'everyone',
    showPresence: true,
    ...overrides,
  };
}

const ACCOUNT_DATA: AccountDataResponse = {
  profile: {
    userId: 'u-1',
    displayName: 'Julian Vance',
    username: 'julian',
    avatarUrl: null,
    accentColor: '#10b981',
    email: 'julian@example.edu',
  },
  memberships: [],
  activitySummary: {
    serversJoined: 0,
    accountCreatedAt: '2026-01-01T00:00:00.000Z',
  },
};

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPrivacyPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Defaults shared by all page-render tests (BlockedUsers + PrivacyActivity panels).
  mockApi.getAccountData.mockResolvedValue(ACCOUNT_DATA);
  mockApi.getPrivacyEvents.mockResolvedValue({ events: [] });
  mockApi.getBlocks.mockResolvedValue({ blocks: [] });
});

describe('toUiVisibility', () => {
  it('maps "everyone" → "everyone"', () => {
    expect(toUiVisibility('everyone')).toBe('everyone');
  });

  it('maps "server-members" → "everyone" (absorbed into Visible, never a distinct live choice)', () => {
    expect(toUiVisibility('server-members')).toBe('everyone');
  });

  it('maps "nobody" → "nobody"', () => {
    expect(toUiVisibility('nobody')).toBe('nobody');
  });
});

describe('SettingsPrivacyPage — presence toggle (wave-80 B-3)', () => {
  it('renders as an ENABLED working switch (not disabled/Beta)', async () => {
    mockApi.getPrivacy.mockResolvedValue(makePrivacy({ showPresence: true }));

    renderPage();

    const toggle = await screen.findByRole('switch', { name: /online status/i });
    // A live, working control — must be interactive, not a Beta affordance.
    expect(toggle).not.toBeDisabled();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('default state reflects the server showPresence value (false → off)', async () => {
    mockApi.getPrivacy.mockResolvedValue(makePrivacy({ showPresence: false }));

    renderPage();

    const toggle = await screen.findByRole('switch', { name: /online status/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggling issues a full-object PUT including the changed showPresence + other current settings, and reflects the new state (GET round-trip)', async () => {
    // Server starts with presence ON, non-default siblings to prove they are preserved.
    mockApi.getPrivacy.mockResolvedValue(
      makePrivacy({ profileVisibility: 'nobody', whoCanDm: 'nobody', showPresence: true }),
    );
    // PUT echoes back the full updated object (GET round-trip).
    mockApi.putPrivacy.mockResolvedValue(
      makePrivacy({ profileVisibility: 'nobody', whoCanDm: 'nobody', showPresence: false }),
    );

    renderPage();

    const toggle = await screen.findByRole('switch', { name: /online status/i });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await act(async () => {
      fireEvent.click(toggle);
    });

    // Full-replace PUT: all three fields sent, only showPresence changed.
    await waitFor(() => expect(mockApi.putPrivacy).toHaveBeenCalledTimes(1));
    expect(mockApi.putPrivacy).toHaveBeenCalledWith({
      profileVisibility: 'nobody',
      whoCanDm: 'nobody',
      showPresence: false,
    });

    // UI reflects the new (server-echoed) state.
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'));
  });

  it('reverts the toggle if the PUT fails', async () => {
    mockApi.getPrivacy.mockResolvedValue(makePrivacy({ showPresence: true }));
    mockApi.putPrivacy.mockRejectedValue(new Error('boom'));

    renderPage();

    const toggle = await screen.findByRole('switch', { name: /online status/i });
    await act(async () => {
      fireEvent.click(toggle);
    });

    await waitFor(() => expect(mockApi.putPrivacy).toHaveBeenCalled());
    // Reverted to last-known server value.
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
  });
});
