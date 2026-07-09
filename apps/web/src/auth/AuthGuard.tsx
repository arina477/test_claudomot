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
 * TRANSIENT-401 BOUNCE FIX (wave-82 B-3): SessionAuth subscribes to the
 * SuperTokens fetch interceptor's `UNAUTHORISED` event and, by default,
 * redirects to the auth page whenever it fires — WITHOUT distinguishing a
 * genuine logout from a transient token-refresh race. On /app mount a burst of
 * authed fetches with a just-expired access token can make the interceptor fire
 * UNAUTHORISED (sessionExpiredOrRevoked:false) mid-refresh, bouncing the SPA off
 * /app even though the refresh token is valid. `onSessionExpired` overrides that
 * default: we first attempt a single SHARED refresh; if it succeeds the user
 * stays put (no bounce). Only a genuine failure (refresh expired/revoked) falls
 * through to the normal no-session redirect (redirectToAuth). The shared refresh
 * reuses the same in-flight promise as the api-client seam, so a burst triggers
 * exactly one refresh.
 */

import type { ReactNode } from 'react';
import { redirectToAuth } from 'supertokens-auth-react';
import Session, { SessionAuth } from 'supertokens-auth-react/recipe/session';
import { sharedRefreshSession } from './refreshAndRetry';

type Props = { children: ReactNode };

export function AuthGuard({ children }: Props) {
  async function onSessionExpired() {
    // Transient-bounce guard: try a single shared refresh before redirecting.
    // A valid refresh token that restores a live session → user stays on the
    // page (no bounce). We re-assert doesSessionExist as a fail-safe so a
    // refresh that reports success but leaves no session still redirects.
    const refreshed = await sharedRefreshSession();
    if (refreshed && (await Session.doesSessionExist())) return;

    // Genuine logout (refresh expired/revoked) — preserve the no-session
    // redirect so a truly logged-out user still routes to the auth page.
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
