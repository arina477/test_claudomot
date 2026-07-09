/**
 * AuthGuard.test.tsx — transient-401 bounce guard (wave-82 B-3, mechanism 3).
 *
 * The real DM-after-login bounce is SessionAuth reacting to the fetch
 * interceptor's UNAUTHORISED event and redirecting — even when the refresh token
 * is still valid (a concurrent-refresh race on /app mount). AuthGuard now passes
 * an `onSessionExpired` handler that attempts a single shared refresh first and
 * only redirects on a genuine failure.
 *
 * These tests capture the handler AuthGuard hands to SessionAuth and assert:
 *   - transient expiry (refresh succeeds + session still exists) → NO redirect.
 *   - genuine logout (refresh returns false) → redirect preserved.
 *   - refresh true but session gone → redirect (fail-safe).
 */

import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Capture the onSessionExpired prop AuthGuard passes to SessionAuth.
let capturedOnSessionExpired: (() => void) | undefined;

const mockRedirectToAuth = vi.fn((_opts?: unknown) => Promise.resolve());
const mockDoesSessionExist = vi.fn<() => Promise<boolean>>();
const mockAttemptRefresh = vi.fn<() => Promise<boolean>>();

vi.mock('supertokens-auth-react', () => ({
  redirectToAuth: (opts?: unknown) => mockRedirectToAuth(opts),
}));

vi.mock('supertokens-auth-react/recipe/session', () => ({
  default: {
    doesSessionExist: () => mockDoesSessionExist(),
    attemptRefreshingSession: () => mockAttemptRefresh(),
  },
  SessionAuth: ({
    children,
    onSessionExpired,
  }: {
    children: ReactNode;
    onSessionExpired?: () => void;
  }) => {
    capturedOnSessionExpired = onSessionExpired;
    return <>{children}</>;
  },
}));

import { AuthGuard } from './AuthGuard';

beforeEach(() => {
  capturedOnSessionExpired = undefined;
  mockRedirectToAuth.mockClear();
  mockDoesSessionExist.mockReset();
  mockAttemptRefresh.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderGuard() {
  render(
    <AuthGuard>
      <div>protected</div>
    </AuthGuard>,
  );
  expect(capturedOnSessionExpired).toBeTypeOf('function');
  return capturedOnSessionExpired as () => Promise<void>;
}

describe('AuthGuard onSessionExpired — transient bounce guard', () => {
  it('does NOT redirect when a transient expiry is healed by a successful refresh', async () => {
    mockAttemptRefresh.mockResolvedValue(true);
    mockDoesSessionExist.mockResolvedValue(true);

    const handler = renderGuard();
    await handler();

    expect(mockAttemptRefresh).toHaveBeenCalledTimes(1);
    // Session restored — the user stays put, no bounce.
    expect(mockRedirectToAuth).not.toHaveBeenCalled();
  });

  it('redirects on a genuine logout when refresh returns false', async () => {
    mockAttemptRefresh.mockResolvedValue(false);

    const handler = renderGuard();
    await handler();

    expect(mockAttemptRefresh).toHaveBeenCalledTimes(1);
    // No usable refresh token — the no-session redirect is preserved.
    expect(mockRedirectToAuth).toHaveBeenCalledTimes(1);
  });

  it('redirects (fail-safe) when refresh succeeds but no session exists afterward', async () => {
    mockAttemptRefresh.mockResolvedValue(true);
    mockDoesSessionExist.mockResolvedValue(false);

    const handler = renderGuard();
    await handler();

    expect(mockRedirectToAuth).toHaveBeenCalledTimes(1);
  });
});
