# T-5 E2E — tester-1 (wave-70 Block feature, LIVE PROD)

**Target:** https://web-production-bce1a8.up.railway.app (web) · API https://api-production-b93e.up.railway.app
**Fixture A (self, owner):** studyhall-e2e-fixture@example.com · userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2` (username @studyhallfixturea, displayName null)
**Fixture B (block target):** username @studyhallfixtureb · userId `da74148e-132e-4faf-a526-a34c28e7481b`
**Server:** Fixture Proof Server `ad62cd12-b78e-4a85-a214-042cf176b16c` (channel: General) — both fixtures are members.
**Runs:** each scenario executed ≥2× for flake detection. **Result: all core scenarios PASS, 0 FLAKE, 0 BLOCKED.** Prod returned to no-blocks state (cleanup verified).

Note on session hygiene: MCP arrived with a stale different account logged in (also displayName-collides on "studyhallfixturea"). Logged out (POST /auth/signout 200) and signed in as the prompt's Fixture A (verified via /me → studyhall-e2e-fixture@example.com). Never called browser_close.

## Per-scenario verdict

| # | Scenario | Verdict | Evidence |
|---|----------|---------|----------|
| 1 | Block a member (dialog + confirm + network + a11y + mobile + dbl-click) | **PASS** (1 Major finding: member-row affordance does not reflect blocked state) | POST /blocks → **201** (×2). role=dialog, aria-modal=true, aria-labelledby=block-dialog-title. Focus lands on confirm. Esc closes. Focus-trap cycles Cancel↔Block User (Tab + Shift+Tab), never escapes. <640px → bottom sheet. Double-click → exactly 1 block row (no dupe). |
| 2 | Own-row: no Block AND no Report (spec D isSelf guard) | **PASS** | Self row action buttons = `[]` (no Block/Report/Moderate). Other row = `[Report, Block, Moderate]`. Consistent ×2. |
| 3 | Blocked-users settings list (/settings/privacy) | **PASS** (known UUID gap present, noted not failed) | "Blocked Users" section lists blocked user with Unblock action. Row shows raw UUID `da74148e-…` instead of display name (documented B-6 gap → V-2). Empty state "You haven't blocked anyone" renders when list empty. Consistent ×2. |
| 4 | Unblock (settings list) | **PASS** | DELETE /blocks/da74148e-… → **204** (×2). Row leaves list → empty state. GET /blocks → `{blocks:[]}`. |

## Network evidence (captured)
- **POST** `https://api-production-b93e.up.railway.app/blocks` → **201**. Request body `{blockedUserId}` only; blocker server-derived. Confirmed via GET /blocks: `blocker_id=21984eb2…` (A, server-set), `blocked_id=da74148e…` (B). Block ids observed: `804f2501-…`, `c556ff60-…`.
- **DELETE** `…/blocks/da74148e-132e-4faf-a526-a34c28e7481b` → **204**. Path param is the **blocked user's userId** (not the block-row id) — matches api.ts unblock contract.
- **GET** `…/blocks` → 200, `{blocks:[…]}` snake_case DTOs (id, blocker_id, blocked_id, created_at).

## Accessibility / interaction sub-checks (scenario 1)
- role="dialog", aria-modal="true", aria-labelledby="block-dialog-title" — PASS
- Initial focus inside dialog on "Block User" confirm — PASS
- Esc closes dialog — PASS (minor nit: focus returns to BODY, not the triggering Block button; not a FAIL)
- Focus-trap: Tab cycles Cancel→Block User→Cancel; Shift+Tab reverses; never leaks to page behind — PASS
- Mobile (<640px, 375×720): dialog reflows to bottom sheet — anchored to viewport bottom, full-width, grab handle, rounded top, danger confirm above ghost cancel — PASS (screenshot t5-bottomsheet-mobile.png)
- Double-click confirm disabled: dbl-click on "Block User" produced exactly ONE block row (submitting/disabled suppresses the 2nd) — PASS
- Danger styling: red "Block User" confirm + ghost "Cancel" per D-3 — PASS

## Findings

### FINDING-1 (Major, UX/state-reflection) — member-row Block affordance does not reflect blocked state
After a successful block (201 + GET /blocks confirms the block is active/persisted), the member-list row for the blocked user (Fixture B) **still shows the "Block" affordance** rather than flipping to "Unblock" or a blocked indicator. Persists across a full page reload + member-list re-fetch (not a transient render). `hasUnblockAffordance:false`, `aria-label` remains "Block studyhall-e2e-fixture-b".
- **Not a hard FAIL** by the prompt's criterion: the block **persists** (server truth correct) and the spec's authoritative blocked-state surface — the /settings/privacy Blocked Users list — DOES reflect it correctly (scenario 3 PASS). B-3 spec describes the member-row block affordance + the settings list w/ optimistic unblock; it does not explicitly promise the member row flips to Unblock after blocking.
- **Severity Major** because it is a real UX inconsistency (a user can "re-block" an already-blocked member from the member list with no signal they're already blocked). Recommend a follow-on: cross-reference the blocks set in MemberListPanel to flip the affordance / show a blocked badge. Candidate V-2 follow-on alongside the enrichment gap.

### FINDING-2 (Low, known gap — NOTE not FAIL) — Blocked Users list shows UUID instead of display name
The /settings/privacy Blocked Users list renders the blocked user's raw UUID (`da74148e-132e-4faf-a526-a34c28e7481b`) as the name, avatar initials "DA". This is the pre-documented B-6 gap (GET /blocks lacks profile enrichment) → V-2 follow-on. Explicitly a documented gap, not a defect.

### No FAILs found
- No missing Block affordance on other members (present on B's row) — not a FAIL.
- No Block/Report on own row (both suppressed by isSelf) — spec-D regression NOT present.
- Block persists correctly — not a FAIL.

## Console
No block-feature console errors. Only pre-login 401s (before sign-in) and a pre-existing 404 on `/servers/:id/channels` (unrelated; General channel rendered fine via the working path).

## Cleanup (prod-clean) — DONE
All test blocks unblocked. Final GET /blocks = `{blocks:[]}`, empty-state UI confirmed. Blocked/unblocked user id across all runs: `da74148e-132e-4faf-a526-a34c28e7481b` (Fixture B). Blocker: `21984eb2-8029-4c1b-9e73-bc586a0be4d2` (Fixture A). No residual test data.

## Screenshots (absolute paths)
- /home/claudomat/project/t5-channel-members.png — members panel (self online, B offline w/ actions)
- /home/claudomat/project/t5-blockdialog.png — BlockConfirmDialog (desktop, danger confirm + ghost cancel)
- /home/claudomat/project/t5-block-success.png — post-confirm state
- /home/claudomat/project/t5-blocked-users-list.png — settings list w/ blocked user (UUID gap) + Unblock
- /home/claudomat/project/t5-after-unblock.png — empty state after unblock
- /home/claudomat/project/t5-bottomsheet-mobile.png — dialog as bottom sheet (<640px)
