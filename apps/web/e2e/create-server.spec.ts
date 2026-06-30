import { expect, test } from '@playwright/test';

/**
 * Authenticated create-server flow E2E (the first authed browser test).
 *
 * Uses the storageState saved by auth.setup.ts (config: chromium-authed project),
 * so the browser starts already signed-in as the verified fixture.
 *
 * Flow: open the create-server modal → create a UNIQUELY-named server →
 * assert it appears in the server rail → select it → assert #general appears
 * in the channel sidebar.
 *
 * Anti-flake contract (load-bearing):
 *   - Web-first assertions only (expect(locator).toBeVisible()); Playwright auto-waits.
 *   - NO page.waitForTimeout / sleeps.
 *   - Unique server name per run → no collision, no reliance on a clean/seeded DB.
 *   - Assertions target the just-created server specifically by its unique name.
 *   - Must pass on the FIRST attempt; does not lean on the config's CI retry.
 */

test('authenticated user creates a server and sees #general', async ({ page }) => {
  // Unique name per run — prod state is shared, so never assume a clean DB.
  const serverName = `E2E ${Date.now()}`;

  // 1. Land in the authed app shell. Server rail proves the session is live.
  await page.goto('/app');
  const serverRail = page.getByRole('navigation', { name: 'Server rail' });
  await expect(serverRail).toBeVisible();

  // 2. Open the create-server modal via the "Add a server" rail button.
  await page.getByRole('button', { name: 'Add a server' }).click();

  // Modal is present (data-testid="create-server-modal"); its name input is focused.
  const modal = page.getByTestId('create-server-modal');
  await expect(modal).toBeVisible();

  // 3. Fill the unique name and submit ("Create").
  await page.locator('#server-name-input').fill(serverName);
  await modal.getByRole('button', { name: 'Create' }).click();

  // Modal closes on success.
  await expect(modal).toBeHidden();

  // 4. The new server appears in the rail. Each icon's accessible name is the
  //    full server name (aria-label), even though it renders 2-char initials.
  const newServerIcon = serverRail.getByRole('button', { name: serverName, exact: true });
  await expect(newServerIcon).toBeVisible();

  // 5. Select it — appendServer adds to the rail but does not auto-select; selecting
  //    triggers the detail fetch that populates the channel sidebar.
  await newServerIcon.click();

  // 6. #general (auto-seeded on server create) appears in the channel sidebar.
  //    The channel name renders as plain text "general" (the # is a glyph icon).
  //    AppShell mounts ChannelSidebar twice (desktop inline + mobile drawer), both
  //    carrying data-testid="channel-sidebar"; the desktop one is rendered first in
  //    the DOM and is the visible instance at desktop viewport — scope to it.
  const channelSidebar = page.getByTestId('channel-sidebar').first();
  await expect(channelSidebar.getByText('general', { exact: true })).toBeVisible();
});
