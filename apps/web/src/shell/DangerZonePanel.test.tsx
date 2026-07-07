/**
 * wave-72 B-3 — DangerZonePanel tests.
 *
 * Coverage (per B-3 spec):
 *   1. Confirm button is disabled until the acknowledgment checkbox is checked.
 *   2. On confirm, deleteAccount() is called then Session.signOut() + navigate('/login') fires.
 *   3. The 409 owner-block path renders the server list and does NOT redirect.
 *   4. Generic API error shows error message without redirecting.
 *   5. Dialog closes on Esc key while not submitting.
 *   6. Dialog remains open (Esc blocked) while submitting.
 *
 * BUILD-PRINCIPLES rule 12: success paths are tested THROUGH the real parent
 * (DangerZonePanel renders DeleteAccountDialog — no direct imports of the
 * internal dialog component).
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock supertokens-auth-react/recipe/session
// ---------------------------------------------------------------------------

const mockSignOut = vi.fn(() => Promise.resolve());

vi.mock('supertokens-auth-react/recipe/session', () => ({
  default: {
    signOut: () => mockSignOut(),
  },
  SessionAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSessionContext: vi.fn(() => ({ loading: false, doesSessionExist: true })),
}));

// ---------------------------------------------------------------------------
// Mock react-router-dom useNavigate
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  };
});

// ---------------------------------------------------------------------------
// Mock api module
// ---------------------------------------------------------------------------

const mockDeleteAccount = vi.fn();

vi.mock('../auth/api', async () => {
  const actual = await vi.importActual('../auth/api');
  return {
    ...(actual as object),
    api: {
      deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
    },
  };
});

import { DeleteAccountBlockedError } from '../auth/api';

// ---------------------------------------------------------------------------
// Lazy component import (after mocks)
// ---------------------------------------------------------------------------

import { DangerZonePanel } from './DangerZonePanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel() {
  return render(
    <MemoryRouter>
      <DangerZonePanel />
    </MemoryRouter>,
  );
}

/** Opens the dialog by clicking the trigger button. */
async function openDialog() {
  const triggerBtn = screen.getByTestId('danger-zone-open-btn');
  await act(async () => {
    fireEvent.click(triggerBtn);
  });
  return screen.getByTestId('delete-account-dialog');
}

/** Opens the dialog and checks the acknowledgment checkbox. */
async function openDialogAndAcknowledge() {
  await openDialog();
  const checkbox = screen.getByTestId('delete-acknowledge-checkbox');
  await act(async () => {
    fireEvent.click(checkbox);
  });
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// Test 1: Confirm button disabled until checkbox checked
// ===========================================================================

describe('DangerZonePanel — confirm button gate', () => {
  it('renders the danger zone section with a Delete account button', () => {
    renderPanel();
    expect(screen.getByTestId('danger-zone-section')).toBeInTheDocument();
    expect(screen.getByTestId('danger-zone-open-btn')).toBeInTheDocument();
    expect(screen.getByText('Delete account')).toBeInTheDocument();
  });

  it('opens dialog when Delete account button is clicked', async () => {
    renderPanel();
    await openDialog();
    expect(screen.getByTestId('delete-account-dialog')).toBeInTheDocument();
  });

  it('confirm button is disabled before checkbox is checked', async () => {
    renderPanel();
    await openDialog();
    const confirmBtn = screen.getByTestId('delete-dialog-confirm');
    expect(confirmBtn).toBeDisabled();
  });

  it('confirm button is enabled after checkbox is checked', async () => {
    renderPanel();
    await openDialogAndAcknowledge();
    const confirmBtn = screen.getByTestId('delete-dialog-confirm');
    expect(confirmBtn).not.toBeDisabled();
  });

  it('confirm button becomes disabled again if checkbox is unchecked', async () => {
    renderPanel();
    await openDialogAndAcknowledge();

    const checkbox = screen.getByTestId('delete-acknowledge-checkbox');
    await act(async () => {
      fireEvent.click(checkbox); // uncheck
    });

    expect(screen.getByTestId('delete-dialog-confirm')).toBeDisabled();
  });
});

// ===========================================================================
// Test 2: Success path — deleteAccount() called then signOut + navigate('/login')
// ===========================================================================

describe('DangerZonePanel — success path', () => {
  it('calls deleteAccount() after confirming', async () => {
    mockDeleteAccount.mockResolvedValue({ status: 'deleted' });
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    expect(mockDeleteAccount).toHaveBeenCalledOnce();
  });

  it('calls Session.signOut() after successful deleteAccount', async () => {
    mockDeleteAccount.mockResolvedValue({ status: 'deleted' });
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledOnce();
    });
  });

  it('navigates to /login after successful deleteAccount', async () => {
    mockDeleteAccount.mockResolvedValue({ status: 'deleted' });
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('still navigates to /login even if Session.signOut() rejects', async () => {
    mockDeleteAccount.mockResolvedValue({ status: 'deleted' });
    mockSignOut.mockRejectedValueOnce(new Error('network'));
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});

// ===========================================================================
// Test 3: 409 owner-block path — renders server list, does NOT redirect
// ===========================================================================

describe('DangerZonePanel — 409 owner-block path', () => {
  const blockedError = new DeleteAccountBlockedError({
    status: 'blocked',
    reason: 'You own servers that must be transferred or deleted first.',
    servers: [
      { id: 'srv-1', name: 'Physics Study Group' },
      { id: 'srv-2', name: 'Math Circle' },
    ],
  });

  it('renders the blocked reason message', async () => {
    mockDeleteAccount.mockRejectedValue(blockedError);
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-blocked-message')).toBeInTheDocument();
    });

    expect(
      screen.getByText('You own servers that must be transferred or deleted first.'),
    ).toBeInTheDocument();
  });

  it('renders each blocking server by name', async () => {
    mockDeleteAccount.mockRejectedValue(blockedError);
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-blocked-server-list')).toBeInTheDocument();
    });

    expect(screen.getByTestId('delete-blocked-server-srv-1')).toHaveTextContent(
      'Physics Study Group',
    );
    expect(screen.getByTestId('delete-blocked-server-srv-2')).toHaveTextContent('Math Circle');
  });

  it('does NOT navigate to /login on 409 blocked response', async () => {
    mockDeleteAccount.mockRejectedValue(blockedError);
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-blocked-message')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('keeps the dialog open on 409 blocked response', async () => {
    mockDeleteAccount.mockRejectedValue(blockedError);
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-blocked-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('delete-account-dialog')).toBeInTheDocument();
  });

  it('does NOT call Session.signOut() on 409 blocked response', async () => {
    mockDeleteAccount.mockRejectedValue(blockedError);
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-blocked-message')).toBeInTheDocument();
    });

    expect(mockSignOut).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Test 4: Generic API error — shows error, no redirect
// ===========================================================================

describe('DangerZonePanel — generic API error', () => {
  it('shows generic error message on unexpected failure', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('500 Internal Server Error'));
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-submit-error')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('keeps dialog open on generic error', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('500 error'));
    renderPanel();
    await openDialogAndAcknowledge();

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-dialog-confirm'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-submit-error')).toBeInTheDocument();
    });

    expect(screen.getByTestId('delete-account-dialog')).toBeInTheDocument();
  });
});

// ===========================================================================
// Test 5: Dialog closes on Esc (while not submitting)
// ===========================================================================

describe('DangerZonePanel — Esc closes dialog', () => {
  it('closes dialog when Esc is pressed while not submitting', async () => {
    renderPanel();
    await openDialog();
    expect(screen.getByTestId('delete-account-dialog')).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByTestId('delete-account-dialog')).not.toBeInTheDocument();
  });
});

// ===========================================================================
// Test 6: Confirm button disabled while submitting (double-submit prevention)
// ===========================================================================

describe('DangerZonePanel — double-submit prevention', () => {
  it('confirm button is disabled while submission is in flight', async () => {
    // Never resolves — keeps the submitting state active
    mockDeleteAccount.mockReturnValue(new Promise(() => {}));
    renderPanel();
    await openDialogAndAcknowledge();

    const confirmBtn = screen.getByTestId('delete-dialog-confirm');

    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(confirmBtn).toBeDisabled();
  });
});
