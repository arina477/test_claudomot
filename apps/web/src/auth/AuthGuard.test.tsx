/**
 * AuthGuard.test.tsx — transient-401 bounce guard (wave-82 B-3, corrected B-6).
 *
 * The real DM-after-login bounce is SessionAuth reacting to the fetch
 * interceptor's UNAUTHORISED event and redirecting — even when the refresh token
 * is still valid (a concurrent-refresh race on /app mount). The interceptor fires
 * that event from its NOT_EXISTS short-circuit: `st-last-access-token-update` has
 * been written but the non-atomic `frontToken` write has NOT yet landed. In that
 * exact condition `attemptRefreshingSession()` re-enters the SAME short-circuit
 * and returns FALSE with no network call — so gating the no-bounce decision on
 * its boolean is a no-op for the production-dominant case.
 *
 * AuthGuard now SETTLES-then-RECHECKS: it awaits the shared refresh, yields a
 * bounded number of ticks for the frontToken write to land, and re-checks
 * `Session.doesSessionExist()` DIRECTLY (the source of truth) — redirecting only
 * if the session is still absent after the bounded settle.
 *
 * These tests capture the handler AuthGuard hands to SessionAuth and assert:
 *   - DOMINANT PATH: refresh returns FALSE and doesSessionExist is false, but
 *     after a settle tick doesSessionExist becomes true → NO redirect. This is
 *     the NOT_EXISTS-then-settle branch the old test missed.
 *   - genuine logout (session stays absent through the whole settle) → redirect.
 *   - bounded / no-infinite-loop (session never returns → redirects after the
 *     bounded ticks, does not hang).
 *   - fast path (session already live) → NO redirect, NO refresh needed.
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

describe('AuthGuard onSessionExpired — settle-then-recheck bounce guard', () => {
  it('DOMINANT PATH: refresh returns FALSE but the session settles true after a tick → NO redirect', async () => {
    // This is the production-dominant NOT_EXISTS case: attemptRefreshingSession
    // re-enters the same NOT_EXISTS short-circuit and returns false with no
    // network call, while doesSessionExist is initially false because the
    // non-atomic frontToken write has not landed yet. After the settle tick the
    // write completes and doesSessionExist flips to true → the guard must NOT
    // gate on the boolean and must NOT bounce.
    mockAttemptRefresh.mockResolvedValue(false);
    // false on the fast-path + first post-refresh check, then true once the
    // frontToken write settles.
    mockDoesSessionExist
      .mockResolvedValueOnce(false) // fast-path pre-refresh check
      .mockResolvedValueOnce(false) // first post-refresh recheck (write not landed)
      .mockResolvedValue(true); // frontToken write settled

    const handler = renderGuard();
    await handler();

    // Redirect suppressed — the boolean-false refresh did NOT trigger a bounce.
    expect(mockRedirectToAuth).not.toHaveBeenCalled();
    // The direct doesSessionExist source-of-truth was consulted, not the boolean.
    expect(mockDoesSessionExist).toHaveBeenCalled();
  });

  it('fast path: NO redirect (and no wait) when the session is already live', async () => {
    mockDoesSessionExist.mockResolvedValue(true);

    const handler = renderGuard();
    await handler();

    // Session already present on the very first check — no bounce, no refresh
    // round-trip needed.
    expect(mockRedirectToAuth).not.toHaveBeenCalled();
    expect(mockAttemptRefresh).not.toHaveBeenCalled();
  });

  it('genuine logout: session stays absent through the whole settle → redirect DOES fire', async () => {
    // A real revoke — the refresh cannot restore a session and doesSessionExist
    // stays false through every recheck. The settle-recheck must NOT swallow this.
    mockAttemptRefresh.mockResolvedValue(false);
    mockDoesSessionExist.mockResolvedValue(false);

    const handler = renderGuard();
    await handler();

    // Bounded settle exhausted with no session → the no-session redirect fires.
    expect(mockRedirectToAuth).toHaveBeenCalledTimes(1);
    expect(mockRedirectToAuth).toHaveBeenCalledWith({ redirectBack: true });
  });

  it('bounded / no-infinite-loop: never-returning session redirects after finite ticks (does not hang)', async () => {
    // doesSessionExist never becomes true. The handler must terminate (bounded
    // ticks) and redirect exactly once — proving no unbounded spin.
    mockAttemptRefresh.mockResolvedValue(false);
    mockDoesSessionExist.mockResolvedValue(false);

    const handler = renderGuard();
    // If this awaited handler ever hung, the test would time out — passing here
    // proves the settle loop is bounded.
    await handler();

    expect(mockRedirectToAuth).toHaveBeenCalledTimes(1);
    // Finite number of source-of-truth checks (fast-path + bounded rechecks +
    // final check), never unbounded.
    expect(mockDoesSessionExist.mock.calls.length).toBeGreaterThan(0);
    expect(mockDoesSessionExist.mock.calls.length).toBeLessThanOrEqual(8);
  });
});
