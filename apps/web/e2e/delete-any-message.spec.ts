/**
 * delete-any-message 2-client E2E — wave-44 task ca43eb12
 *
 * Scenario: fixture-A (server owner → moderate_members=true) can see and use
 * the "Delete message (moderator)" affordance on fixture-B's messages. fixture-B
 * cannot see the delete affordance on fixture-A's messages.
 *
 * Two browser contexts:
 *   - contextA: fixture-A (studyhall-e2e-fixture@example.com) — owner of proof server
 *   - contextB: fixture-B (studyhall-e2e-fixture-b@example.com) — co-member, no special role
 *
 * Shared test server: ad62cd12-b78e-4a85-a214-042cf176b16c ("Fixture Proof Server")
 * Channel: 93982063-4b70-4394-beaf-37168aef7098 ("general")
 *
 * Test plan:
 *   1. Both contexts sign in and navigate to #general.
 *   2. B posts a message with a unique marker.
 *   3. A hovers B's message — asserts "Delete message (moderator)" button is visible.
 *   4. A confirms deletion — asserts the message disappears for A.
 *   5. Assert B's still-open context receives the message:deleted fan-out (message gone/tombstone).
 *   6. Assert B does NOT see the delete affordance on A's message (non-moderator IDOR check).
 *
 * Auth strategy: fresh sign-in inside the test via browser context (no saved storageState).
 * The chromium-authed project sets a storageState on the outer context; we override it per-test.
 *
 * NEVER browser_close mid-test — contexts are closed by Playwright test cleanup.
 *
 * API baseline: delete-any backend is proven (wave-41 T-4/T-8). This test covers the
 * cross-client fan-out observable in a real 2-browser-context scenario.
 */

import { expect, test } from '@playwright/test';

// Override the inherited storageState: this test manages its own sign-in.
// Using empty storageState ensures both contexts start unauthenticated.
test.use({ storageState: { cookies: [], origins: [] } });

const BASE_URL = process.env.E2E_BASE_URL ?? 'https://web-production-bce1a8.up.railway.app';
const SERVER_ID = 'ad62cd12-b78e-4a85-a214-042cf176b16c';
const CHANNEL_ID = '93982063-4b70-4394-beaf-37168aef7098';

/** Sign in on the page and wait for the authed app shell. */
async function signIn(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Server rail visible → auth succeeded
  await expect(page.getByRole('navigation', { name: 'Server rail' })).toBeVisible({
    timeout: 25_000,
  });
}

/** Navigate to the shared proof-server #general channel. */
async function navigateToGeneralChannel(page: import('@playwright/test').Page): Promise<void> {
  // Click the proof server icon in the rail (aria-label = server name).
  // The rail button aria-label is the full server name — confirmed by create-server.spec.ts pattern.
  const serverBtn = page
    .getByRole('navigation', { name: 'Server rail' })
    .getByRole('button', { name: /fixture proof server/i });
  await expect(serverBtn).toBeVisible({ timeout: 10_000 });
  await serverBtn.click();

  // Wait for the channel sidebar to populate — the sidebar mounts with a list of channels once
  // the server is selected and the channels API call completes. The "general" link is the signal.
  // ChannelSidebar renders twice (desktop + mobile) — scope to the first (desktop) instance.
  const channelSidebar = page.getByTestId('channel-sidebar').first();
  // Wait for the sidebar to show channels (not the empty "select a server" state)
  const generalLink = channelSidebar.getByText('general', { exact: true });
  await expect(generalLink).toBeVisible({ timeout: 15_000 });
  await generalLink.click();

  // Wait for the composer input — a label "Message #general" is associated to the textarea.
  // Playwright resolves the label → textarea accessible name.
  await expect(page.getByTestId('composer-input')).toBeVisible({ timeout: 15_000 });
  void CHANNEL_ID; // channel id referenced for documentation; navigation is UI-driven
}

test("moderator (A) can delete any message; non-moderator (B) cannot delete A's message; B sees fan-out tombstone", async ({
  browser,
}) => {
  // ── Credentials from env (test-accounts.md registry) ──────────────────────
  const emailA = process.env.E2E_FIXTURE_EMAIL ?? 'studyhall-e2e-fixture@example.com';
  const passwordA = process.env.E2E_FIXTURE_PASSWORD ?? 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
  const emailB = process.env.E2E_FIXTURE_B_EMAIL ?? 'studyhall-e2e-fixture-b@example.com';
  const passwordB = process.env.E2E_FIXTURE_B_PASSWORD ?? 'Tb8xKp2mQvWz5nRj7sLcDh3aEf9gYu4w';

  // ── Provision two independent browser contexts ─────────────────────────────
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // ── Step 1: Both contexts authenticate ────────────────────────────────────
  await signIn(pageA, emailA, passwordA);
  await signIn(pageB, emailB, passwordB);

  // ── Step 2: Both navigate to #general in the proof server ─────────────────
  await navigateToGeneralChannel(pageA);
  await navigateToGeneralChannel(pageB);

  // ── Step 3: A posts a sentinel message (for step 6 non-mod check) ─────────
  // The composer textarea has role="combobox" when serverId is set, and data-testid="composer-input".
  const aMessageMarker = `A-sent-${Date.now()}`;
  await pageA.getByTestId('composer-input').fill(aMessageMarker);
  await pageA.keyboard.press('Enter');
  // Wait for A's message to appear in A's view
  await expect(pageA.getByText(aMessageMarker)).toBeVisible({ timeout: 10_000 });

  // ── Step 4: B posts a message for A to delete ─────────────────────────────
  const bMessageMarker = `B-sent-${Date.now()}`;
  await pageB.getByTestId('composer-input').fill(bMessageMarker);
  await pageB.keyboard.press('Enter');
  // B sees their own message
  await expect(pageB.getByText(bMessageMarker)).toBeVisible({ timeout: 10_000 });

  // ── Step 5: A sees B's message and the moderator delete affordance ─────────
  // A must first load B's message (may need reload if it arrived before A's view updated)
  await expect(pageA.getByText(bMessageMarker)).toBeVisible({ timeout: 15_000 });

  // ── Step 5b: Subscription-proof round-trip ────────────────────────────────
  // joinChannel (messagingSocket.ts:104-106) is fire-and-forget: the server joins
  // the socket into 'channel:<channelId>' asynchronously but emits NO ack/event
  // back. "Connection status: online" only proves the WebSocket is open, NOT that
  // B's socket is in the channel room. Without this proof step the fan-out
  // assertion below races: A could delete before B's server-side join completes.
  //
  // Proof mechanism: A sends a fresh probe message into the channel; B
  // hard-asserts it arrives via realtime (message:new is fanned out to
  // 'channel:<channelId>' — the SAME room that receives message:deleted).
  // B receiving the probe proves B's socket is live in that room, so the
  // delete fan-out will arrive on B's already-joined socket.
  const aProbeMarker = `A-probe-${Date.now()}`;
  await pageA.getByTestId('composer-input').fill(aProbeMarker);
  await pageA.keyboard.press('Enter');
  // B must receive A's probe via realtime — hard assertion, no catch
  await expect(pageB.getByText(aProbeMarker)).toBeVisible({ timeout: 12_000 });
  // (A can optionally confirm their own probe appeared; B's assertion is the proof)

  // Hover B's message article to reveal row-actions
  const bMessageArticle = pageA.getByRole('article').filter({ hasText: bMessageMarker }).last();
  await bMessageArticle.hover();

  // The moderator delete button renders with aria-label "Delete message (moderator)"
  const modDeleteBtn = bMessageArticle.getByRole('button', {
    name: /delete message \(moderator\)/i,
  });
  await expect(modDeleteBtn).toBeVisible({ timeout: 5_000 });

  // ── Step 6: A confirms deletion ───────────────────────────────────────────
  await modDeleteBtn.click();
  // Confirm strip appears ("Delete this message?") — click the confirm button
  const confirmBtn = bMessageArticle.getByTestId('delete-confirm-btn');
  await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
  await confirmBtn.click();

  // A's view: message disappears (tombstone or removal)
  await expect(pageA.getByText(bMessageMarker)).toBeHidden({ timeout: 10_000 });

  // ── Step 7: B's still-open context receives the message:deleted fan-out ────
  // B's channel-room subscription is proven live (step 5b above). The
  // message:deleted event fans out to 'channel:<channelId>' — the same room B
  // joined and proved active. Playwright expect() auto-retries within the
  // bounded window; a broken fan-out path causes this assertion to FAIL.

  await expect(pageB.getByText(bMessageMarker)).toBeHidden({ timeout: 12_000 });

  // ── Step 8: Non-moderator check — B does NOT see delete-any on A's message ─
  // B's view should show A's sentinel message
  await expect(pageB.getByText(aMessageMarker)).toBeVisible({ timeout: 10_000 });

  // Hover A's message article in B's context
  const aMessageArticleOnB = pageB.getByRole('article').filter({ hasText: aMessageMarker }).last();
  await aMessageArticleOnB.hover();

  // B must NOT see a "Delete message (moderator)" affordance on A's message
  // (B is not a moderator; only own-message delete is available)
  const unauthorizedDeleteBtn = aMessageArticleOnB.getByRole('button', {
    name: /delete message \(moderator\)/i,
  });
  // The button must not be visible to B
  await expect(unauthorizedDeleteBtn).toBeHidden({ timeout: 3_000 });

  // ── Cleanup: close contexts (do NOT browser_close — kills the MCP instance) ─
  await contextA.close();
  await contextB.close();
});

/**
 * Evidence log for this E2E:
 *
 * Fixture-A (21984eb2) is the proof server owner → effective permissions include
 *   owner:true, moderate_members:true (confirmed via GET /servers/.../me/permissions).
 * Fixture-B (da74148e) is a co-member with no assigned roles → moderate_members:false.
 *
 * Shared server: ad62cd12 ("Fixture Proof Server") — created wave-15.
 * Channel: 93982063 (#general) — auto-seeded at server creation.
 *
 * The delete-any backend (wave-41 T-4/T-8):
 *   - DELETE /channels/:id/messages/:msgId 204 — any member with moderate_members.
 *   - socket.io fans out message:deleted { messageId, channelId } to all channel subscribers.
 *   - MessageList renders a tombstone ("This message was deleted") on receipt.
 *
 * Server ID documented here: ad62cd12-b78e-4a85-a214-042cf176b16c
 * Channel ID: 93982063-4b70-4394-beaf-37168aef7098
 */
void SERVER_ID;
