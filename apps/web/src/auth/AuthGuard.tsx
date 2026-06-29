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
 */

import type { ReactNode } from 'react';
import { SessionAuth } from 'supertokens-auth-react/recipe/session';

type Props = { children: ReactNode };

export function AuthGuard({ children }: Props) {
  return (
    <SessionAuth requireAuth overrideGlobalClaimValidators={() => []}>
      {children}
    </SessionAuth>
  );
}
