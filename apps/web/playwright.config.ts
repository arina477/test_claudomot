import os from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Resolve bundled chromium from the user-local default cache. This equals
// Playwright's default (~/.cache/ms-playwright), so it is a no-op in normal
// CI environments where that path is already correct. It neutralises a broken
// ambient PLAYWRIGHT_BROWSERS_PATH (e.g. a root-owned /opt/ms-playwright set
// by the host) that would otherwise cause Playwright to fail to find its
// managed chromium build when invoked directly via `playwright test` or
// `pnpm exec playwright test` — paths that bypass the npm script env prefix.
// Setting it here (config is loaded on every invocation) makes this the single
// source of truth regardless of call path.
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(os.homedir(), '.cache', 'ms-playwright');

/**
 * Playwright config — E2E against the live web deployment.
 * Runs on the BUNDLED Playwright chromium (not the Google Chrome channel).
 * `channel` is explicitly set to `undefined` on every project so Playwright
 * resolves its own managed chromium build (~/.cache/ms-playwright/chromium-*)
 * rather than looking for system Chrome at /opt/google/chrome/chrome (absent in CI).
 * No local dev server required; tests run against E2E_BASE_URL which defaults
 * to the Railway production URL.
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
      use: { ...devices['Desktop Chrome'], channel: undefined },
    },
    {
      // Unauthenticated smoke — no storageState, no dependency on the authed session.
      name: 'chromium-smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: undefined },
    },
    {
      // Authenticated flows — reuse the fixture session; sign-in happens once in `setup`.
      name: 'chromium-authed',
      testIgnore: /smoke\.spec\.ts/,
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: undefined,
        storageState: 'e2e/.auth/fixture.json',
      },
    },
  ],
});
