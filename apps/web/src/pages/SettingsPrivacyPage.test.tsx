/**
 * Tests for SettingsPrivacyPage.
 *
 * 1. toUiVisibility unit tests — prove the honest-selector collapse: the
 *    server-side 3-value profileVisibility enum collapses to the 2-option UI
 *    value, with `server-members` absorbed into `everyone`.
 *
 * 2. Presence toggle (wave-80 B-3 / B-6) — through the REAL page:
 *    - renders as an ENABLED working switch (not disabled/Beta),
 *    - toggling issues a PARTIAL-body PUT /profile/privacy carrying ONLY the
 *      changed showPresence field (F1 — closes the cross-tab clobber), and the
 *      UI + GET-shaped echo reflect it,
 *    - default state reflects the server showPresence value,
 *    - a failed PUT reverts to the pre-change LOCAL value (F4).
 *
 * 3. Visibility change (wave-80 B-6 F1) — a radio select issues a partial-body
 *    PUT carrying ONLY profileVisibility.
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

  it('toggling issues a PARTIAL-body PUT carrying ONLY showPresence (F1), and reflects the new state (GET-shaped echo)', async () => {
    // Server starts with presence ON, non-default siblings to prove they are
    // NOT re-sent (that re-send was the cross-tab clobber source).
    mockApi.getPrivacy.mockResolvedValue(
      makePrivacy({ profileVisibility: 'nobody', whoCanDm: 'nobody', showPresence: true }),
    );
    // PUT echoes back the FULL updated object (GET-shaped round-trip).
    mockApi.putPrivacy.mockResolvedValue(
      makePrivacy({ profileVisibility: 'nobody', whoCanDm: 'nobody', showPresence: false }),
    );

    renderPage();

    const toggle = await screen.findByRole('switch', { name: /online status/i });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await act(async () => {
      fireEvent.click(toggle);
    });

    // Partial-body PUT: ONLY showPresence — profileVisibility/whoCanDm are absent.
    await waitFor(() => expect(mockApi.putPrivacy).toHaveBeenCalledTimes(1));
    expect(mockApi.putPrivacy).toHaveBeenCalledWith({ showPresence: false });
    // Guard the negative explicitly: the stale siblings must NOT be re-sent.
    const presenceBody = mockApi.putPrivacy.mock.calls[0]?.[0];
    expect(presenceBody).not.toHaveProperty('profileVisibility');
    expect(presenceBody).not.toHaveProperty('whoCanDm');

    // UI reflects the new (server-echoed) state.
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'));
  });

  it('reverts the toggle to the pre-change local value if the PUT fails (F4)', async () => {
    mockApi.getPrivacy.mockResolvedValue(makePrivacy({ showPresence: true }));
    mockApi.putPrivacy.mockRejectedValue(new Error('boom'));

    renderPage();

    const toggle = await screen.findByRole('switch', { name: /online status/i });
    await act(async () => {
      fireEvent.click(toggle);
    });

    await waitFor(() => expect(mockApi.putPrivacy).toHaveBeenCalled());
    // Reverted to the pre-change local value (was ON before the click).
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
  });
});

describe('SettingsPrivacyPage — visibility change (wave-80 B-6 F1)', () => {
  it('selecting a visibility option issues a PARTIAL-body PUT carrying ONLY profileVisibility', async () => {
    // Start Visible; non-default presence sibling proves it is NOT re-sent.
    mockApi.getPrivacy.mockResolvedValue(
      makePrivacy({ profileVisibility: 'everyone', whoCanDm: 'nobody', showPresence: false }),
    );
    mockApi.putPrivacy.mockResolvedValue(
      makePrivacy({ profileVisibility: 'nobody', whoCanDm: 'nobody', showPresence: false }),
    );

    renderPage();

    // "Hidden" maps to enum `nobody`.
    const hidden = await screen.findByRole('radio', { name: /hidden/i });
    await act(async () => {
      fireEvent.click(hidden);
    });

    // Partial-body PUT: ONLY profileVisibility — whoCanDm/showPresence are absent.
    await waitFor(() => expect(mockApi.putPrivacy).toHaveBeenCalledTimes(1));
    expect(mockApi.putPrivacy).toHaveBeenCalledWith({ profileVisibility: 'nobody' });
    const visibilityBody = mockApi.putPrivacy.mock.calls[0]?.[0];
    expect(visibilityBody).not.toHaveProperty('whoCanDm');
    expect(visibilityBody).not.toHaveProperty('showPresence');
  });

  it('reverts to the pre-change local visibility if the PUT fails (F4)', async () => {
    mockApi.getPrivacy.mockResolvedValue(makePrivacy({ profileVisibility: 'everyone' }));
    mockApi.putPrivacy.mockRejectedValue(new Error('boom'));

    renderPage();

    const visible = await screen.findByRole('radio', { name: /visible to classmates/i });
    const hidden = await screen.findByRole('radio', { name: /hidden/i });
    expect(visible).toBeChecked();

    await act(async () => {
      fireEvent.click(hidden);
    });

    await waitFor(() => expect(mockApi.putPrivacy).toHaveBeenCalled());
    // Reverted to the pre-change local value (was Visible before the click).
    await waitFor(() => expect(visible).toBeChecked());
  });
});
