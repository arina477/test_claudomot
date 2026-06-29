/**
 * SuperTokens SDK initialisation.
 *
 * Call initSuperTokens() once before rendering the React tree.
 * Uses VITE_API_ORIGIN for the backend domain; falls back to the current
 * window origin in dev so the Vite proxy (/auth → localhost:3001) works.
 */

import SuperTokens from 'supertokens-auth-react';
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword';
import EmailVerification from 'supertokens-auth-react/recipe/emailverification';
import Session from 'supertokens-auth-react/recipe/session';

export function initSuperTokens(): void {
  const apiDomain: string = import.meta.env.VITE_API_ORIGIN ?? window.location.origin;

  SuperTokens.init({
    appInfo: {
      appName: 'StudyHall',
      apiDomain,
      websiteDomain: window.location.origin,
      apiBasePath: '/auth',
    },
    recipeList: [
      EmailPassword.init(),
      EmailVerification.init({ mode: 'REQUIRED' }),
      Session.init(),
    ],
  });
}
