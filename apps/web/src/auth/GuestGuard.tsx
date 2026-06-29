/**
 * GuestGuard — redirects authenticated users away from auth pages.
 *
 * Uses useSessionContext to check session state; if loading, renders nothing.
 * If a valid session exists, redirects to /app.
 */

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';

type Props = { children: ReactNode };

export function GuestGuard({ children }: Props) {
  const session = useSessionContext();

  if (session.loading) return null;

  if (session.doesSessionExist) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
