import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — E2E against the live web deployment.
 * Runs chromium; no local dev server required (tests run against E2E_BASE_URL
 * which defaults to the Railway production URL).
 *
 * Three projects:
 *   - setup           : signs in as the verified fixture, saves storageState.
 *   - chromium-smoke  : UNAUTHENTICATED public-route smoke (smoke.spec.ts). No storageState.
 *   - chromium-authed : AUTHENTICATED flows (*.spec.ts except smoke). Depends on `setup`,
 *                       consumes e2e/.auth/fixture.json. Excludes smoke so it stays unauthenticated.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://web-production-bce1a8.up.railway.app',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Unauthenticated smoke — no storageState, no dependency on the authed session.
      name: 'chromium-smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Authenticated flows — reuse the fixture session; sign-in happens once in `setup`.
      name: 'chromium-authed',
      testIgnore: /smoke\.spec\.ts/,
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/fixture.json',
      },
    },
  ],
});
