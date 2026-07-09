/**
 * refreshAndRetry — resilient transient-401 refresh-and-retry for authed calls.
 *
 * WHY (wave-82 B-3 trace finding): SuperTokens' Session.init() globally overrides
 * window.fetch with an auto-refresh interceptor that already does single-flight
 * refresh-and-retry-on-401. So a raw fetch in api.ts request() already runs through
 * it. The residual DM-after-login bounce is NOT request() throwing a 401 (useDm
 * swallows those into an offline-cache fallback and never navigates). It is the
 * SuperTokens React SessionAuth guard reacting to the interceptor's `UNAUTHORISED`
 * event — which the guard fires (fetch.js onUnauthorisedResponse, local session
 * state NOT_EXISTS short-circuit, sessionExpiredOrRevoked:false) during the
 * concurrent-refresh race on /app mount, then redirects to the auth page. The
 * guard treats a transient UNAUTHORISED identically to a genuine logout.
 *
 * This module provides the shared machinery used to heal BOTH surfaces with ONE
 * shared refresh:
 *   1. AuthGuard.onSessionExpired — on the transient bounce, attempt the shared
 *      refresh; only redirect if it genuinely fails (the actual bounce fix).
 *   2. api.ts request()/requestNoContent() — defense-in-depth so any caller that
 *      does NOT swallow a 401 (e.g. createDmConversation) also self-heals rather
 *      than surfacing the error.
 *
 * attemptRefreshingSession() shares the SDK's global refresh lock, so it never
 * double-refreshes or fights the interceptor. On top of that we de-dupe at the
 * app layer too: a burst of concurrent 401s reuses ONE in-flight refresh promise,
 * so N racers cause exactly one refresh round-trip.
 */

import Session from 'supertokens-auth-react/recipe/session';
import { HttpError } from './api';

/**
 * The single in-flight shared refresh promise. Null when no refresh is running.
 * A burst of concurrent 401s all await the SAME promise → one refresh, not N.
 */
let inFlightRefresh: Promise<boolean> | null = null;

/**
 * Attempt a session refresh, de-duplicating concurrent callers onto a single
 * in-flight promise. Resolves true when the session was refreshed (valid refresh
 * token), false when it could not be (genuine logout — refresh expired/revoked).
 *
 * The underlying Session.attemptRefreshingSession() already shares SuperTokens'
 * global refresh lock; this app-level single-flight additionally collapses a
 * synchronous burst into one awaited promise so we never even queue N calls.
 */
export function sharedRefreshSession(): Promise<boolean> {
  if (inFlightRefresh === null) {
    inFlightRefresh = Session.attemptRefreshingSession()
      .catch(() => false)
      .finally(() => {
        inFlightRefresh = null;
      });
  }
  return inFlightRefresh;
}

/**
 * Wrap an authed request factory with transient-401 refresh-and-retry.
 *
 * Behavior:
 *  - On HttpError(401): attempt the shared refresh. If it succeeds, retry `fn`
 *    EXACTLY ONCE. The caller receives the retried response.
 *  - GENUINE-LOGOUT GUARD: if the refresh returns false (refresh token
 *    expired/revoked), the original 401 propagates unchanged so a truly
 *    logged-out user still routes to the no-session redirect.
 *  - Retry is exactly once and ONLY on 401: a second 401 after a successful
 *    refresh propagates (no infinite loop). Non-401 errors are unaffected.
 *
 * `fn` MUST be a factory (called fresh on each attempt) so the retry issues a
 * new network request.
 *
 * @example
 *   const data = await withRefreshRetry(() => request<T>('/dm/conversations'));
 */
export async function withRefreshRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // Only a 401 is a refresh candidate. Everything else propagates untouched.
    if (!(err instanceof HttpError) || err.status !== 401) throw err;

    const refreshed = await sharedRefreshSession();
    // Genuine logout — refresh token expired/revoked. Propagate the 401 so the
    // app's no-session redirect still fires. We do NOT mask or delay it.
    if (!refreshed) throw err;

    // Refresh succeeded — retry exactly once. A second 401 propagates (the
    // retry has no inner refresh-retry), so there is no infinite loop.
    return await fn();
  }
}
