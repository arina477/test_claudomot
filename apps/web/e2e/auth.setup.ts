import { expect, test as setup } from '@playwright/test';

/**
 * Authed-session setup — signs in ONCE as the verified prod fixture via the
 * real /login UI, then persists the SuperTokens httpOnly cookies to
 * `e2e/.auth/fixture.json` (gitignored). Every authed E2E project consumes this
 * storageState, so individual tests never re-sign-in.
 *
 * Credentials come from env (locally exported from the gitignored
 * command-center/testing/test-accounts.md; in CI from GitHub Actions secrets):
 *   E2E_FIXTURE_EMAIL / E2E_FIXTURE_PASSWORD
 *
 * Fails LOUD: missing env vars throw; a failed sign-in fails the setup (no
 * silent skip), which fails-fast every dependent authed test.
 */

const AUTH_FILE = 'e2e/.auth/fixture.json';

setup('authenticate fixture via /login', async ({ page }) => {
  const email = process.env.E2E_FIXTURE_EMAIL;
  const password = process.env.E2E_FIXTURE_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'auth.setup: E2E_FIXTURE_EMAIL and E2E_FIXTURE_PASSWORD must be set ' +
        '(locally export from command-center/testing/test-accounts.md; in CI they come from repo secrets). ' +
        'Refusing to run the authed suite without fixture credentials.',
    );
  }

  // 1. Go to the login form (GuestGuard redirects authed users away; we start clean).
  await page.goto('/login');

  // 2. Fill the verified-fixture credentials. FormField renders id="email" / id="password".
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  // 3. Submit — "Sign In" button. On OK the app navigates to /app (AuthGuard → AppShell).
  await page.getByRole('button', { name: /sign in/i }).click();

  // 4. Web-first wait for the AUTHENTICATED app shell. The server rail
  //    (nav aria-label="Server rail") only renders inside AppShell behind AuthGuard,
  //    so its visibility proves the session is live. Generous timeout: prod cold-start
  //    + SuperTokens session handshake.
  await expect(page.getByRole('navigation', { name: 'Server rail' })).toBeVisible({
    timeout: 20_000,
  });

  // Guard against a stuck/visible login error banner masquerading as success.
  await expect(page).toHaveURL(/\/app\b/, { timeout: 20_000 });

  // 5. Persist cookies (httpOnly SuperTokens session) + storage for reuse.
  await page.context().storageState({ path: AUTH_FILE });
});
