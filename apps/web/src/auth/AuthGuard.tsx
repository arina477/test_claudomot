/**
 * AuthGuard — redirects unauthenticated users away from protected routes.
 *
 * Wraps SessionAuth from supertokens-auth-react/recipe/session.
 * When requireAuth=true (default), SuperTokens will redirect to /login
 * if there is no valid session.
 *
 * overrideGlobalClaimValidators removes the EmailVerification claim check
 * so that unverified users can still reach /app and /settings/profile
 * (the verify-email banner handles the soft prompt).
 *
 * TRANSIENT-401 BOUNCE FIX (wave-82 B-3, corrected B-6): SessionAuth subscribes
 * to the SuperTokens fetch interceptor's `UNAUTHORISED` event and, by default,
 * redirects to the auth page whenever it fires — WITHOUT distinguishing a
 * genuine logout from a transient token-refresh race.
 *
 * ROOT CAUSE (verified against supertokens-website@20.1.6 fetch.js):
 * `onUnauthorisedResponse` fires UNAUTHORISED{sessionExpiredOrRevoked:false} and
 * returns SESSION_EXPIRED whenever the post-lock local session state reads
 * NOT_EXISTS (~L734). NOT_EXISTS is derived (getLocalSessionState, ~L987) as:
 * the `st-last-access-token-update` cookie is present but `frontToken` is NOT.
 * Token persistence is NON-ATOMIC (saveTokensFromHeaders, ~L1195): refresh →
 * access (which writes last-access-token-update) → frontToken, in that order,
 * frontToken LAST. During a concurrent-refresh burst on /app mount a racer can
 * observe the window where last-access-token-update has landed but frontToken
 * has not → NOT_EXISTS → the event fires even though the refresh token is valid
 * and the write is about to complete.
 *
 * WHY THE OLD FIX WAS A NO-OP for the dominant case: it gated the no-bounce
 * decision on `attemptRefreshingSession()`'s boolean. But in the very NOT_EXISTS
 * condition that fired the event, attemptRefreshingSession re-enters
 * onUnauthorisedResponse, hits the SAME NOT_EXISTS short-circuit, and returns
 * false WITHOUT any network call. `refreshed === false` then fell through to
 * redirectToAuth — so the bounce STILL happened. It only healed in a timing
 * accident (frontToken write happened to land first).
 *
 * THE FIX (settle-then-recheck): do NOT gate on attemptRefreshingSession's
 * boolean. On a transient expiry we (1) suppress the redirect, (2) SETTLE — await
 * the shared in-flight refresh (the burst's own refresh that is writing the
 * non-atomic tokens; awaiting it is deterministic, not a timing gamble) and then
 * yield a small bounded number of microtask/macrotask ticks so the frontToken
 * write lands, (3) re-check `Session.doesSessionExist()` DIRECTLY (the source of
 * truth once the write settles) after each tick, and (4) redirect ONLY if the
 * session is still genuinely absent after the bounded settle. A real logout keeps
 * doesSessionExist false through every recheck → redirect still fires.
 */

import type { ReactNode } from 'react';
import { redirectToAuth } from 'supertokens-auth-react';
import Session, { SessionAuth } from 'supertokens-auth-react/recipe/session';
import { sharedRefreshSession } from './refreshAndRetry';

type Props = { children: ReactNode };

// Bounded settle: how many recheck ticks to give the non-atomic frontToken write
// to land after the shared refresh resolves. Small + fixed → never an unbounded
// spin. A genuine logout simply exhausts these and then redirects.
const SETTLE_RECHECK_TICKS = 5;

/** Yield one macrotask so any pending cookie/frontToken write can settle. */
function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function AuthGuard({ children }: Props) {
  async function onSessionExpired() {
    // Fast path: the session may already be live (frontToken already landed).
    if (await Session.doesSessionExist()) return;

    // SETTLE step 1 — await the shared in-flight refresh. This is the burst's
    // own refresh that is performing the non-atomic token write; awaiting it is
    // deterministic (not a bare-timer gamble). We deliberately IGNORE its boolean
    // return: in the NOT_EXISTS short-circuit it resolves false without a network
    // call, so it is NOT a reliable signal. doesSessionExist is the truth.
    await sharedRefreshSession();

    // SETTLE step 2 — bounded recheck. After the refresh resolves, the frontToken
    // write may still be a tick behind; yield one tick then re-check
    // doesSessionExist directly. As soon as the session is present we stay put
    // (no bounce). The loop runs a small fixed number of times → never an
    // unbounded spin.
    for (let i = 0; i < SETTLE_RECHECK_TICKS; i += 1) {
      await nextTick();
      if (await Session.doesSessionExist()) return;
    }

    // Genuine logout — the session stayed absent through the entire bounded
    // settle (refresh token expired/revoked). Preserve the no-session redirect so
    // a truly logged-out user still routes to the auth page.
    await redirectToAuth({ redirectBack: true });
  }

  return (
    <SessionAuth
      requireAuth
      overrideGlobalClaimValidators={() => []}
      onSessionExpired={onSessionExpired}
    >
      {children}
    </SessionAuth>
  );
}
