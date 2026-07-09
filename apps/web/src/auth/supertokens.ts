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
      // tokenTransferMethod: 'header' — make the cross-origin transport posture
      // EXPLICIT (wave-84, BOARD Option B). web and api are different SITES under
      // the up.railway.app public suffix, so cookie-mode session tokens would be
      // cross-site (SameSite=None) and unreliable (Safari ITP / Chrome 3p-cookie
      // deprecation). Header transport is SuperTokens' recommended mode for
      // different-domain SPAs: the SDK sends st-access-token / st-refresh-token as
      // Authorization/response headers instead of cookies. This is the FRONTEND
      // side that actually selects the transport; the backend getTokenTransferMethod
      // defaults to 'any' and honours this choice.
      Session.init({ tokenTransferMethod: 'header' }),
    ],
  });
}
