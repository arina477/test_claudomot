/**
 * retryOn429 — bounded exponential-backoff retry for GET (read-only) calls.
 *
 * Rules:
 *  - Retries ONLY on HTTP 429 (Too Many Requests). Any other error is rethrown
 *    immediately without retrying.
 *  - Exponential backoff: baseMs × 2^attempt, capped at capMs.
 *  - Retry-After header is honored when present and exceeds the computed delay.
 *  - After maxAttempts total calls the error is rethrown (no infinite loop).
 *
 * Usage: wrap only safe, idempotent (GET) call sites. Do NOT use for writes
 * (POST/PATCH/DELETE) — retrying a mutating call is unsafe.
 *
 * wave-61 task 874bd233.
 */

import { HttpError } from './api';

export interface RetryOn429Options {
  /** Maximum number of total attempts (first try + retries). Default: 4. */
  maxAttempts?: number;
  /** Base delay in milliseconds. Default: 300. */
  baseMs?: number;
  /** Maximum delay cap in milliseconds. Default: 10_000. */
  capMs?: number;
}

const DEFAULTS: Required<RetryOn429Options> = {
  maxAttempts: 4,
  baseMs: 300,
  capMs: 10_000,
};

/**
 * Wraps `fn` with bounded 429-aware retry logic.
 * The `fn` must be a factory (called fresh on each attempt) so each retry
 * issues a new network request.
 *
 * @example
 *   const data = await retryOn429(() => api.listDmConversations());
 */
export async function retryOn429<T>(fn: () => Promise<T>, opts?: RetryOn429Options): Promise<T> {
  const { maxAttempts, baseMs, capMs } = { ...DEFAULTS, ...opts };

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;

      // Non-429 or not an HttpError — rethrow immediately (no retry).
      if (!(err instanceof HttpError) || err.status !== 429) throw err;

      // Exhausted all attempts — rethrow.
      if (attempt >= maxAttempts) throw err;

      // Compute delay: exponential backoff capped, then honor Retry-After.
      const backoff = Math.min(baseMs * 2 ** (attempt - 1), capMs);
      const delay = err.retryAfterMs !== undefined ? Math.max(backoff, err.retryAfterMs) : backoff;

      await sleep(delay);
    }
  }
}

/** Thin sleep helper — extracted so tests can swap it via vi.useFakeTimers(). */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
