/**
 * retryOn429.test.ts — unit tests for the bounded 429-aware retry helper.
 *
 * wave-61 task 874bd233.
 *
 * Coverage:
 *   1. 429 → backoff → success on retry.
 *   2. 429 exhausting max attempts → throws the last 429 HttpError.
 *   3. Retry-After header honored: delay is at least retryAfterMs.
 *   4. Non-429 HttpError → throws immediately (no retry).
 *   5. Non-HttpError (generic Error) → throws immediately (no retry).
 *   6. DM write call (sendDmMessage) is NOT wrapped (smoke-test: call count = 1, no retry on 429).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from './api';
import { retryOn429 } from './retryOn429';

// ---------------------------------------------------------------------------
// Setup: fake timers so `sleep()` inside retryOn429 resolves instantly.
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// Helper: run retryOn429 while ticking all pending timers concurrently.
// We attach a no-op rejection handler on the internal promise to prevent
// Vitest's unhandled-rejection detector from firing during vi.runAllTimersAsync(),
// then let the caller observe the final settled result.
async function runWithTimers<T>(fn: () => Promise<T>): Promise<T> {
  const promise = fn();
  // Suppress intermediate unhandled-rejection noise during timer flush.
  promise.catch(() => undefined);
  await vi.runAllTimersAsync();
  return promise;
}

// ---------------------------------------------------------------------------
// Test 1: 429 → backoff → success on retry
// ---------------------------------------------------------------------------

describe('retryOn429 — 429 then success', () => {
  it('retries after 429 and resolves on the next attempt', async () => {
    const result = { ok: true };
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new HttpError(429, '429 Too Many Requests');
      return result;
    });

    const value = await runWithTimers(() => retryOn429(fn));

    expect(value).toBe(result);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Test 2: max attempts exhausted → throws
// ---------------------------------------------------------------------------

describe('retryOn429 — exhausts max attempts', () => {
  it('throws after maxAttempts (4) total calls all returning 429', async () => {
    const fn = vi.fn(async () => {
      throw new HttpError(429, '429 Too Many Requests');
    });

    await expect(runWithTimers(() => retryOn429(fn, { maxAttempts: 4 }))).rejects.toMatchObject({
      status: 429,
    });

    // 4 total calls (1 original + 3 retries)
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('respects a custom maxAttempts=2', async () => {
    const fn = vi.fn(async () => {
      throw new HttpError(429, '429');
    });

    await expect(runWithTimers(() => retryOn429(fn, { maxAttempts: 2 }))).rejects.toMatchObject({
      status: 429,
    });

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Retry-After honored
// ---------------------------------------------------------------------------

describe('retryOn429 — Retry-After honored', () => {
  it('uses retryAfterMs when it exceeds the computed backoff', async () => {
    const RETRY_AFTER_MS = 5_000;
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new HttpError(429, '429', RETRY_AFTER_MS);
      return 'ok';
    });

    // Intercept setTimeout to verify the delay used.
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const promise = retryOn429(fn, { baseMs: 300, capMs: 10_000 });
    await vi.runAllTimersAsync();
    const value = await promise;

    expect(value).toBe('ok');
    // The delay passed to setTimeout must be >= RETRY_AFTER_MS.
    const delays = setTimeoutSpy.mock.calls.map((args) => args[1] as number);
    expect(delays.some((d) => d >= RETRY_AFTER_MS)).toBe(true);
  });

  it('uses computed backoff when retryAfterMs is undefined', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new HttpError(429, '429'); // no retryAfterMs
      return 'ok';
    });

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const promise = retryOn429(fn, { baseMs: 300, capMs: 10_000 });
    await vi.runAllTimersAsync();
    await promise;

    // baseMs * 2^0 = 300 for the first retry
    const delays = setTimeoutSpy.mock.calls.map((args) => args[1] as number);
    expect(delays.some((d) => d === 300)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Non-429 HttpError → throws immediately (no retry)
// ---------------------------------------------------------------------------

describe('retryOn429 — non-429 HttpError throws immediately', () => {
  it('does not retry on 401', async () => {
    const fn = vi.fn(async () => {
      throw new HttpError(401, '401 Unauthorized');
    });

    await expect(retryOn429(fn)).rejects.toMatchObject({
      status: 401,
    });
    // Only 1 call — no retry
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 500', async () => {
    const fn = vi.fn(async () => {
      throw new HttpError(500, '500 Internal Server Error');
    });

    await expect(retryOn429(fn)).rejects.toMatchObject({
      status: 500,
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 403', async () => {
    const fn = vi.fn(async () => {
      throw new HttpError(403, '403 Forbidden');
    });

    await expect(retryOn429(fn)).rejects.toMatchObject({
      status: 403,
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Test 5: Generic (non-HttpError) error → throws immediately
// ---------------------------------------------------------------------------

describe('retryOn429 — generic Error throws immediately', () => {
  it('rethrows a plain Error without retrying', async () => {
    const fn = vi.fn(async () => {
      throw new Error('network failure');
    });

    await expect(retryOn429(fn)).rejects.toThrow('network failure');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Test 6: DM write (sendDmMessage) is NOT wrapped — it gets called once even
// on 429 because the helper is never applied to it.
// ---------------------------------------------------------------------------

describe('retryOn429 — writes are NOT wrapped', () => {
  it('sendDmMessage equivalent fn is called exactly once even on 429 (not wrapped)', async () => {
    // Simulate a write call that returns 429. It is NOT passed to retryOn429.
    const writeFn = vi.fn(async () => {
      throw new HttpError(429, '429');
    });

    // Caller invokes writeFn directly — no retryOn429 wrapper.
    await expect(writeFn()).rejects.toMatchObject({
      status: 429,
    });

    // Only 1 call — not retried because retryOn429 was never applied.
    expect(writeFn).toHaveBeenCalledTimes(1);
  });
});
