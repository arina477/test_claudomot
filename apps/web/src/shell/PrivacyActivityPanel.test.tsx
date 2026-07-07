/**
 * wave-73 B-3 — PrivacyActivityPanel tests.
 *
 * Coverage (per B-3 spec):
 *   1. Loading → loaded list renders the correct plain-language labels.
 *   2. Empty state renders "No privacy activity yet".
 *   3. Error state renders error message + "Try again" retry button that
 *      re-fetches on click.
 *   4. A privacy_settings_changed event WITH visibilityFrom/To context renders
 *      the "X → Y" visibility clause.
 *   5. A privacy_settings_changed event with null context renders only the
 *      base label (no crash, no extra text).
 *
 * BUILD-PRINCIPLES rule 12: tests drive the REAL PrivacyActivityPanel
 * component; api.getPrivacyEvents is mocked at the module boundary.
 */

import type { PrivacyEvent } from '@studyhall/shared';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock api module
// ---------------------------------------------------------------------------

const mockGetPrivacyEvents = vi.fn();

vi.mock('../auth/api', () => ({
  api: {
    getPrivacyEvents: (...args: unknown[]) => mockGetPrivacyEvents(...args),
  },
}));

// ---------------------------------------------------------------------------
// Lazy import (after mocks)
// ---------------------------------------------------------------------------

import { PrivacyActivityPanel } from './PrivacyActivityPanel';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<PrivacyEvent> = {}): PrivacyEvent {
  return {
    id: 'evt-1',
    actorId: 'user-1',
    eventType: 'data_exported',
    targetType: 'user',
    targetId: null,
    context: null,
    createdAt: new Date(Date.now() - 60_000).toISOString(), // 1 minute ago
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel() {
  return render(<PrivacyActivityPanel />);
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// Test 1: Loading → loaded list renders correct labels
// ===========================================================================

describe('PrivacyActivityPanel — loaded list labels', () => {
  it('renders the loading skeleton initially', () => {
    // Never resolves — keeps loading state active
    mockGetPrivacyEvents.mockReturnValue(new Promise(() => {}));
    renderPanel();
    expect(screen.getByTestId('privacy-activity-loading')).toBeInTheDocument();
  });

  it('renders event list with correct plain-language labels', async () => {
    const events: PrivacyEvent[] = [
      makeEvent({ id: 'e1', eventType: 'data_exported', context: null }),
      makeEvent({ id: 'e2', eventType: 'account_deleted', context: null }),
      makeEvent({ id: 'e3', eventType: 'user_blocked', context: null }),
      makeEvent({ id: 'e4', eventType: 'user_unblocked', context: null }),
    ];
    mockGetPrivacyEvents.mockResolvedValue({ events });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('privacy-activity-list')).toBeInTheDocument();
    });

    expect(screen.getByTestId('privacy-event-label-e1')).toHaveTextContent(
      'You exported your data',
    );
    expect(screen.getByTestId('privacy-event-label-e2')).toHaveTextContent(
      'You deleted your account',
    );
    expect(screen.getByTestId('privacy-event-label-e3')).toHaveTextContent('You blocked a user');
    expect(screen.getByTestId('privacy-event-label-e4')).toHaveTextContent('You unblocked a user');
  });

  it('renders privacy_settings_changed base label when context is null', async () => {
    const events: PrivacyEvent[] = [
      makeEvent({ id: 'e5', eventType: 'privacy_settings_changed', context: null }),
    ];
    mockGetPrivacyEvents.mockResolvedValue({ events });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('privacy-event-label-e5')).toBeInTheDocument();
    });

    expect(screen.getByTestId('privacy-event-label-e5')).toHaveTextContent(
      'You changed your privacy settings',
    );
    // Must NOT contain the visibility clause
    expect(screen.getByTestId('privacy-event-label-e5').textContent).not.toContain('→');
  });
});

// ===========================================================================
// Test 2: Empty state
// ===========================================================================

describe('PrivacyActivityPanel — empty state', () => {
  it('renders "No privacy activity yet" when the events list is empty', async () => {
    mockGetPrivacyEvents.mockResolvedValue({ events: [] });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('privacy-activity-empty')).toBeInTheDocument();
    });

    expect(screen.getByText('No privacy activity yet')).toBeInTheDocument();
  });

  it('does NOT render the list container when events is empty', async () => {
    mockGetPrivacyEvents.mockResolvedValue({ events: [] });
    renderPanel();

    await waitFor(() => {
      expect(screen.queryByTestId('privacy-activity-list')).not.toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Test 3: Error state + retry
// ===========================================================================

describe('PrivacyActivityPanel — error state', () => {
  it('renders the error state when getPrivacyEvents rejects', async () => {
    mockGetPrivacyEvents.mockRejectedValue(new Error('network'));
    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('privacy-activity-error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('privacy-activity-retry')).toBeInTheDocument();
  });

  it('re-fetches when "Try again" is clicked and shows the list on success', async () => {
    const events: PrivacyEvent[] = [makeEvent({ id: 'retry-evt', eventType: 'data_exported' })];

    // First call rejects; second call resolves
    mockGetPrivacyEvents
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ events });

    renderPanel();

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('privacy-activity-error')).toBeInTheDocument();
    });

    const retryBtn = screen.getByTestId('privacy-activity-retry');

    await act(async () => {
      fireEvent.click(retryBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('privacy-activity-list')).toBeInTheDocument();
    });

    expect(screen.getByTestId('privacy-event-label-retry-evt')).toHaveTextContent(
      'You exported your data',
    );
  });
});

// ===========================================================================
// Test 4: privacy_settings_changed with visibilityFrom/To context
// ===========================================================================

describe('PrivacyActivityPanel — privacy_settings_changed with context', () => {
  it('renders the from→to visibility clause when context has visibilityFrom and visibilityTo', async () => {
    const events: PrivacyEvent[] = [
      makeEvent({
        id: 'ctx-evt',
        eventType: 'privacy_settings_changed',
        context: { visibilityFrom: 'everyone', visibilityTo: 'nobody' },
      }),
    ];
    mockGetPrivacyEvents.mockResolvedValue({ events });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('privacy-event-label-ctx-evt')).toBeInTheDocument();
    });

    const label = screen.getByTestId('privacy-event-label-ctx-evt');
    expect(label).toHaveTextContent('You changed your privacy settings');
    expect(label.textContent).toContain('Visible to classmates');
    expect(label.textContent).toContain('Hidden');
    expect(label.textContent).toContain('→');
  });

  it('renders readable labels for server-members visibility', async () => {
    const events: PrivacyEvent[] = [
      makeEvent({
        id: 'ctx-evt-2',
        eventType: 'privacy_settings_changed',
        context: { visibilityFrom: 'server-members', visibilityTo: 'nobody' },
      }),
    ];
    mockGetPrivacyEvents.mockResolvedValue({ events });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('privacy-event-label-ctx-evt-2')).toBeInTheDocument();
    });

    const label = screen.getByTestId('privacy-event-label-ctx-evt-2');
    // server-members maps to "Visible to classmates"
    expect(label.textContent).toContain('Visible to classmates');
    expect(label.textContent).toContain('Hidden');
  });
});

// ===========================================================================
// Test 5: privacy_settings_changed with null context — base label only
// ===========================================================================

describe('PrivacyActivityPanel — privacy_settings_changed null context', () => {
  it('renders only the base label when context is null', async () => {
    const events: PrivacyEvent[] = [
      makeEvent({
        id: 'null-ctx-evt',
        eventType: 'privacy_settings_changed',
        context: null,
      }),
    ];
    mockGetPrivacyEvents.mockResolvedValue({ events });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('privacy-event-label-null-ctx-evt')).toBeInTheDocument();
    });

    const label = screen.getByTestId('privacy-event-label-null-ctx-evt');
    expect(label).toHaveTextContent('You changed your privacy settings');
    expect(label.textContent).not.toContain('→');
    expect(label.textContent).not.toContain('visibility');
  });
});
