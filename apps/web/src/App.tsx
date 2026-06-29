/**
 * App root — initialises SuperTokens SDK and mounts the router.
 * initSuperTokens() is called once here before any recipe function is invoked.
 */

import { SuperTokensWrapper } from 'supertokens-auth-react';
import { initSuperTokens } from './auth/supertokens';
import { AppRouter } from './router';

initSuperTokens();

export function App() {
  return (
    <SuperTokensWrapper>
      <AppRouter />
    </SuperTokensWrapper>
  );
}
