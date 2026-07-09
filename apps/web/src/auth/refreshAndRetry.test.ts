/**
 * refreshAndRetry.test.ts — transient-401 refresh-and-retry (wave-82 B-3).
 *
 * These tests prove the retry RESOLVES (caller receives the successful result),
 * not merely that a refresh was requested. A test that only asserted
 * attemptRefreshingSession was called would pass a no-op — forbidden by spec.
 *
 * Coverage:
 *   1. 401 → refresh(true) → retry → 200: caller RECEIVES the 200 result, fn
 *      called twice (original + one retry).
 *   2. 401 → refresh(false) → propagate HttpError(401): genuine logout preserved
 *      (no retry).
 *   3. 401 → refresh(true) → 401 again → propagate (retry EXACTLY once, no loop).
 *   4. N concurrent 401s → ONE shared refresh → all resolve.
 *   5. non-401 error (429 / 500 / generic) → unchanged (no refresh, no retry).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the SuperTokens session recipe BEFORE importing the module under test.
const mockAttemptRefresh = vi.fn<() => Promise<boolean>>();
vi.mock('supertokens-auth-react/recipe/session', () => ({
  default: {
    attemptRefreshingSession: () => mockAttemptRefresh(),
  },
}));

import { HttpError } from './api';
import { sharedRefreshSession, withRefreshRetry } from './refreshAndRetry';

beforeEach(() => {
  mockAttemptRefresh.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test 1: 401 → refresh(true) → retry → 200 (RESOLUTION proof)
// ---------------------------------------------------------------------------

describe('withRefreshRetry — 401 then refresh then success', () => {
  it('resolves the caller with the 200 result after one refresh + one retry', async () => {
    mockAttemptRefresh.mockResolvedValue(true);

    const ok = { data: 'the-real-payload' };
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new HttpError(401, '401 Unauthorized');
      return ok;
    });

    const result = await withRefreshRetry(fn);

    // The CALLER receives the successful 200 result — not the 401, not undefined.
    expect(result).toBe(ok);
    // Exactly two attempts: original (401) + one retry (200).
    expect(fn).toHaveBeenCalledTimes(2);
    // Exactly one refresh.
    expect(mockAttemptRefresh).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Test 2: 401 → refresh(false) → propagate (genuine-logout guard)
// ---------------------------------------------------------------------------

describe('withRefreshRetry — genuine logout propagates', () => {
  it('propagates HttpError(401) when refresh returns false (refresh expired/revoked)', async () => {
    mockAttemptRefresh.mockResolvedValue(false);

    const fn = vi.fn(async () => {
      throw new HttpError(401, '401 Unauthorized');
    });

    await expect(withRefreshRetry(fn)).rejects.toMatchObject({ status: 401 });
    // No retry — the original request ran once, refresh once, then propagated.
    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockAttemptRefresh).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Test 3: 401 → refresh(true) → 401 again → propagate (retry once only)
// ---------------------------------------------------------------------------

describe('withRefreshRetry — retry exactly once', () => {
  it('propagates a second 401 after a successful refresh (no infinite loop)', async () => {
    mockAttemptRefresh.mockResolvedValue(true);

    const fn = vi.fn(async () => {
      throw new HttpError(401, '401 Unauthorized');
    });

    await expect(withRefreshRetry(fn)).rejects.toMatchObject({ status: 401 });
    // Original + exactly one retry = 2 calls. The retry does not refresh again.
    expect(fn).toHaveBeenCalledTimes(2);
    expect(mockAttemptRefresh).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Test 4: N concurrent 401s → ONE shared refresh → all resolve
// ---------------------------------------------------------------------------

describe('withRefreshRetry — burst shares a single refresh', () => {
  it('resolves N concurrent 401s with exactly ONE refresh', async () => {
    // Gate the refresh so all N racers observe the same in-flight promise before
    // it settles — proving the single-flight collapse.
    let releaseRefresh: (v: boolean) => void = () => {};
    const refreshGate = new Promise<boolean>((resolve) => {
      releaseRefresh = resolve;
    });
    mockAttemptRefresh.mockReturnValue(refreshGate);

    const N = 5;
    const makeFactory = () => {
      let calls = 0;
      return vi.fn(async () => {
        calls += 1;
        if (calls === 1) throw new HttpError(401, '401 Unauthorized');
        return `ok-${calls}`;
      });
    };

    const factories = Array.from({ length: N }, makeFactory);
    const pending = factories.map((fn) => withRefreshRetry(fn));

    // Let all N hit their 401 and register on the shared refresh promise.
    await Promise.resolve();
    await Promise.resolve();

    releaseRefresh(true);
    const results = await Promise.all(pending);

    // Every racer resolved to its retried 200.
    expect(results).toEqual(Array(N).fill('ok-2'));
    // Every factory ran exactly twice (401 + retry).
    for (const fn of factories) expect(fn).toHaveBeenCalledTimes(2);
    // ONE shared refresh for the whole burst — not N.
    expect(mockAttemptRefresh).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Test 5: non-401 errors are unchanged (no refresh, no retry)
// ---------------------------------------------------------------------------

describe('withRefreshRetry — non-401 unaffected', () => {
  it.each([429, 500, 403])('does not refresh or retry on %i', async (status) => {
    const fn = vi.fn(async () => {
      throw new HttpError(status, `${status}`);
    });

    await expect(withRefreshRetry(fn)).rejects.toMatchObject({ status });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockAttemptRefresh).not.toHaveBeenCalled();
  });

  it('rethrows a generic (non-HttpError) error without refreshing', async () => {
    const fn = vi.fn(async () => {
      throw new Error('network failure');
    });

    await expect(withRefreshRetry(fn)).rejects.toThrow('network failure');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockAttemptRefresh).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// sharedRefreshSession — single-flight de-dup + failure isolation
// ---------------------------------------------------------------------------

describe('sharedRefreshSession — single-flight', () => {
  it('collapses concurrent callers onto one in-flight promise', async () => {
    let release: (v: boolean) => void = () => {};
    mockAttemptRefresh.mockReturnValue(
      new Promise<boolean>((resolve) => {
        release = resolve;
      }),
    );

    const a = sharedRefreshSession();
    const b = sharedRefreshSession();
    const c = sharedRefreshSession();
    expect(a).toBe(b);
    expect(b).toBe(c);

    release(true);
    await Promise.all([a, b, c]);
    expect(mockAttemptRefresh).toHaveBeenCalledTimes(1);
  });

  it('resolves false (never throws) when the SDK refresh rejects', async () => {
    mockAttemptRefresh.mockRejectedValue(new Error('refresh endpoint down'));
    await expect(sharedRefreshSession()).resolves.toBe(false);
  });

  it('starts a fresh refresh after the previous one settled', async () => {
    mockAttemptRefresh.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expect(sharedRefreshSession()).resolves.toBe(true);
    await expect(sharedRefreshSession()).resolves.toBe(false);
    expect(mockAttemptRefresh).toHaveBeenCalledTimes(2);
  });
});
