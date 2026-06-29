import { expect, test } from '@playwright/test';

/**
 * Smoke suite — verifies the two most critical public routes load and
 * render meaningful DOM.  Runs against E2E_BASE_URL (live Railway deployment
 * by default).  These are intentionally shallow checks: we confirm the page
 * shell loads and key elements are present, not full interaction flows.
 */

test.describe('StudyHall smoke', () => {
  test('/ — landing page renders', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    // Landing page has the product name in the header
    await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
  });

  test('/login — login form renders with email field', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBeLessThan(400);

    // The login form has an email input (id="email", type="email")
    const emailInput = page.locator('input[type="email"], input[id="email"]').first();
    await expect(emailInput).toBeVisible();

    // Password field is also present
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Submit button is present
    const submitBtn = page.getByRole('button', { name: /sign in/i });
    await expect(submitBtn).toBeVisible();
  });
});
