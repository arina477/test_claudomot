# T-5 — E2E (Account Deletion Danger-Zone UI) — PRODUCTION RE-TEST

**Target:** `https://web-production-bce1a8.up.railway.app` (Railway prod)
**Actor:** Fixture A — `studyhall-e2e-fixture@example.com` (owner of "Fixture Proof Server" + ~600 other E2E fixture servers)
**Date:** 2026-07-07
**Context:** Re-test after the prod white-screen (`ReferenceError: require is not defined`) fix redeploy.

## White-screen gate — PASS (with caveat)

Clean origin load now renders. `#root` non-empty (1 child, 6914 chars innerHTML), landing copy visible ("The single tool that replaces Notion + Discord"), **0 console errors** on the fixed bundle. The fixed bundle is served as `assets/index-DcCKmloX.js`.

**Caveat (finding F1):** The very first load of the bare origin served a STALE cached bundle (`assets/index-BHD_VFkL.js`) from a leftover service-worker registration, which STILL white-screens with `ReferenceError: require is not defined`. After unregistering the stale SW + reloading, the fixed bundle served and rendered cleanly. Server-side fix is confirmed landed; returning users with the old SW will hit the broken bundle exactly once until the SW updates itself, then recover. New visitors get the working build immediately. Not a blocker for this wave's feature test, but worth a note to the C-block / ops.

## Verdict table

| # | Scenario | Verdict | Evidence |
|---|----------|---------|----------|
| 1 | Danger Zone renders | PASS* | Section renders at bottom of Settings › Privacy: red-titled heading "Delete your account", red-bordered card, red "Delete account" button (`bg #b91c1c` = rgb(185,28,28), white text). *Heading reads "Delete your account", NOT the literal "Danger Zone" from the design ref — see F2. Screenshot `screens/01-danger-zone-1440.png`, `screens/05-danger-zone-1024.png`. |
| 2 | Acknowledgment gate | PASS | Clicking "Delete account" opens a portaled confirm dialog "Delete Account" with a 4-item consequence list + acknowledgment checkbox. Destructive "Delete my account" button is `disabled:true` before the checkbox is checked, `disabled:false` after. Screenshots `screens/02-dialog-unchecked-disabled-1440.png` (disabled) + `screens/03-dialog-checked-enabled-1440.png` (enabled). |
| 3 | Owner-block 409 (non-destructive) | PASS | Checked box → clicked "Delete my account" → `/profile/delete` on `https://api-production-b93e.up.railway.app` returned **HTTP 409**. UI surfaced red-titled alert "Transfer or delete the servers you own before deleting your account" + a scrollable bulleted list of owned server names (confirmed contains "Fixture Proof Server" among ~600). No logout, no redirect — URL stayed `/settings/privacy`, dialog stayed open. Screenshot `screens/04-owner-block-409-1440.png`. |
| 4 | Copy reconciliation | PASS | Shipped copy does NOT promise "email verification", "30-day grace period", or "permanently deleted". Actual strings recorded below. |
| 5 | Fixture A intact | PASS | After the 409, cancelled via "Keep my account" + hard reload → still on `/settings/privacy`, NOT redirected to login, Privacy Settings + Delete account button still render. Account NOT deleted. |

## Reconciled copy strings (as shipped)

**Danger-zone card:**
- Heading: `Delete your account`
- Body: `Deactivate your profile, remove your personal data, and sever all server associations. This action will be processed immediately.`
- Button: `Delete account`

**Confirm dialog:**
- Title: `Delete Account`
- Lead-in: `Deleting your account will:`
- Consequence list:
  1. `Deactivate your account and remove access immediately`
  2. `Remove your personal data and profile information`
  3. `Remove you from all study servers you have joined`
  4. `Display your name as "Deleted user" on past messages (to preserve academic context for your peers)`
- Acknowledgment checkbox label: `I understand my account will be deactivated and my personal data removed`
- Cancel button: `Keep my account`
- Destructive button: `Delete my account`

**Owner-block (409) message:**
- Title: `Transfer or delete the servers you own before deleting your account`
- Body: bulleted list of owned-server names (dynamic; includes "Fixture Proof Server").

Copy is consistent with the soft-delete spec: "deactivate", "remove personal data", "Deleted user" tombstoning, "processed immediately". No forbidden verification/grace-period/permanent-deletion promises.

## Findings

- **F1 (minor / ops):** Stale service-worker serves the old broken bundle on the first return visit until the SW self-updates. Server fix is confirmed landed; recommend a note to C-block re: SW cache-bust / skipWaiting on the deploy. Not a feature blocker.
- **F2 (cosmetic / copy):** Section heading reads "Delete your account" rather than the design-ref label "Danger Zone (Deletion)". Danger-red styling + intent are fully met; only the literal label differs. Recommend a product/design call on whether the "Danger Zone" label is required.
- **F3 (cosmetic / fixture-only):** With Fixture A owning ~600 servers, the owner-block list makes the dialog very tall (scrolls internally, footer stays pinned — no clipping). Real users won't hit this; no action needed.

```yaml
test_pattern: active
testers_spawned: 1
scenarios:
  - id: 1_danger_zone_renders
    verdict: PASS
    note: "heading 'Delete your account' not literal 'Danger Zone' (F2)"
  - id: 2_acknowledgment_gate
    verdict: PASS
    note: "destructive confirm disabled pre-check, enabled post-check"
  - id: 3_owner_block_409
    verdict: PASS
    note: "HTTP 409 from /profile/delete; owner-block message + server list; no logout/redirect"
  - id: 4_copy_reconciliation
    verdict: PASS
    note: "no email-verification / 30-day-grace / permanently-deleted promises"
  - id: 5_fixture_a_intact
    verdict: PASS
    note: "still authenticated after reload; account not deleted"
white_screen_gate: PASS
white_screen_caveat: "stale service-worker serves old broken bundle on first return visit until SW self-updates (F1)"
flakes_observed: 0
fix_up_cycles: 0
findings:
  - id: F1
    severity: minor
    area: ops/service-worker
    text: "stale SW serves pre-fix bundle (require is not defined) once until SW updates"
  - id: F2
    severity: cosmetic
    area: copy
    text: "section heading 'Delete your account' vs design-ref 'Danger Zone (Deletion)'"
  - id: F3
    severity: cosmetic
    area: layout-fixture-only
    text: "600-server owner-block list makes dialog tall; scrolls internally, no clipping"
fixture_a_state: "logged-in, undeleted, browser left open"
```
