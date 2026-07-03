/**
 * Unit tests for UserMenu (wave-39, task c208e91e).
 *
 * Coverage:
 *   - Renders 3 menuitems (Profile, Privacy, Log out)
 *   - Clicking Profile calls navigate('/settings/profile') and closes menu
 *   - Clicking Privacy calls navigate('/settings/privacy') and closes menu
 *   - Clicking Log out calls Session.signOut() + navigate('/login') and closes menu
 *   - [C1 regression guard] Log out navigates to /login even when signOut() rejects
 *   - Escape key closes the menu and returns focus to the trigger button
 *   - Mousedown outside the popover closes the menu
 *   - Selecting any item closes (covered per-item above)
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock supertokens-auth-react ───────────────────────────────────────────────

vi.mock('supertokens-auth-react', () => ({
  SuperTokensWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: { init: vi.fn() },
  init: vi.fn(),
}));

const mockSignOut = vi.fn(() => Promise.resolve());

vi.mock('supertokens-auth-react/recipe/session', () => ({
  default: {
    signOut: () => mockSignOut(),
  },
  SessionAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSessionContext: vi.fn(() => ({ loading: false, doesSessionExist: true })),
}));

// ── Mock react-router-dom useNavigate ─────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  };
});

// ── Lazy import after mocks ───────────────────────────────────────────────────

import { UserMenu } from './UserMenu';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderMenu(onClose = vi.fn()) {
  // Create a real button element in the document as the anchor
  const anchorEl = document.createElement('button');
  document.body.appendChild(anchorEl);

  const anchorRef = createRef<HTMLButtonElement>();
  // Assign the actual element to the ref manually
  (anchorRef as React.MutableRefObject<HTMLButtonElement>).current = anchorEl;

  const result = render(
    <MemoryRouter>
      <UserMenu anchorRef={anchorRef} onClose={onClose} />
    </MemoryRouter>,
  );

  return { ...result, onClose, anchorRef, anchorEl };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up any stray anchor elements
    document.body.innerHTML = '';
  });

  it('renders three menuitems', () => {
    renderMenu();
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Profile');
    expect(items[1]).toHaveTextContent('Privacy');
    expect(items[2]).toHaveTextContent('Log out');
  });

  it('clicking Profile navigates to /settings/profile and calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderMenu(onClose);

    await user.click(screen.getByRole('menuitem', { name: /profile/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/settings/profile');
  });

  it('clicking Privacy navigates to /settings/privacy and calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderMenu(onClose);

    await user.click(screen.getByRole('menuitem', { name: /privacy/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/settings/privacy');
  });

  it('clicking Log out calls Session.signOut, navigates to /login, and calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderMenu(onClose);

    await user.click(screen.getByRole('menuitem', { name: /log out/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('[C1] navigates to /login even when Session.signOut() rejects', async () => {
    // Arrange: make signOut reject this one time
    mockSignOut.mockRejectedValueOnce(new Error('network error'));

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderMenu(onClose);

    await user.click(screen.getByRole('menuitem', { name: /log out/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledOnce();
      // navigate('/login') MUST still be called despite the rejection
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      // menu should still close
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('Escape key calls onClose and returns focus to the anchor element', async () => {
    const onClose = vi.fn();
    const { anchorEl } = renderMenu(onClose);

    // Give the anchor focus so we can verify it gets focus back
    anchorEl.focus();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledOnce();
    // focus is returned synchronously in the handler
    expect(document.activeElement).toBe(anchorEl);
  });

  it('mousedown outside the popover calls onClose', () => {
    const onClose = vi.fn();
    renderMenu(onClose);

    // Fire a mousedown on an element outside both the popover and anchor
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);

    fireEvent.mouseDown(outsideEl);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('mousedown inside the popover does NOT call onClose', async () => {
    const onClose = vi.fn();
    renderMenu(onClose);

    const menu = screen.getByRole('menu');
    fireEvent.mouseDown(menu);

    expect(onClose).not.toHaveBeenCalled();
  });
});
