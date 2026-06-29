import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — CI smoke tests against the live web deployment.
 * Runs only chromium; no local dev server required (tests run against
 * E2E_BASE_URL which defaults to the Railway production URL).
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
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
