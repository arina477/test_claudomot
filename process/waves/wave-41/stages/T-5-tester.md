# T-5 E2E + T-6 Layout — Educator Moderation UI (wave-41)

**Target:** PRODUCTION — Web `https://web-production-bce1a8.up.railway.app` · API `https://api-production-b93e.up.railway.app`
**Date:** 2026-07-03
**Tooling:** Playwright MCP chrome-channel absent (`/opt/google/chrome/chrome` not found) → fell back to driving bundled `playwright-core@1.61.1` + chromium-1228 directly (headless, `--no-sandbox`), standalone Node processes. Never used `browser_close` on any MCP instance.
**Fixtures:** A = `studyhall-e2e-fixture` (owner, userId `21984eb2…`), B = `studyhall-e2e-fixture-b` (co-member, userId `da74148e…`). Shared server `ad62cd12` ("Fixture Proof Server").
**Drivers:** `evidence/mod-driver.mjs` (S2/S3/S4/T-6), `evidence/s1-roles-driver.mjs` (S1), `evidence/cleanup-role.mjs` (state cleanup).

## Verdict table

| # | Scenario | Layer | Verdict | Evidence |
|---|----------|-------|---------|----------|
| 1 | "Moderate Members" permission toggle exists on a role, can be enabled + saved | T-5 | **PASS** | toggle present + enabled (owner, non-default role) + state-change + `200 PATCH /roles/:id` save + persisted on re-read. `S1-01..04` |
| 2 | Moderator: kebab → menu → Time out → duration popover → pick 5m → amber muted indicator; Remove timeout clears it (run ×2) | T-5 | **PASS** (both passes) | kebab on B row; menu + duration popover visible; `200 POST …/timeout` ×2; indicator shown ×2; `204 DELETE …/timeout` ×2; indicator cleared. `A-04..09` |
| 3 | Keyboard: Enter opens, Arrow nav, Esc closes+refocuses trigger, outside-click closes | T-5 | **PASS** | menu opened via Enter; Arrow moved focus within menu; Esc closed + refocused `mod-kebab-…`; reopen + outside-click closed |
| 4 | Non-moderator (B): NO kebab/controls on rows, but muted member's amber indicator IS visible (public state) | T-5 | **PASS** | B roster: `0` kebabs; `muted-indicator-<B.id>` visible. `B-01/02` |
| 5 | Delete-any: moderator delete affordance on another member's message | T-5 | **NOT EXECUTED (deferred)** | Requires seeding a co-member message in a channel; out of scope of the four report asks. Code path present (`MessageList.tsx` RowActions renders Delete for non-own with aria-label "Delete message (moderator)"; server enforces via 403). Recommend a dedicated pass. |
| 6 | Layout @1280: menu + popover + muted indicator — dark tokens, in-viewport, no clip/overflow, roster no drift | T-6 | **PASS** | menu bg `rgb(39,39,42)` (`#27272a`), z-index 100, width 180px, `inViewport=true`, page `hOverflow=false`; amber `#f59e0b` indicator legible. `A-10/11` |

## Captured network codes
- Timeout (POST): `200 POST /servers/ad62cd12/members/da74148e…/timeout` — pass 1 and pass 2.
- Remove timeout (DELETE): `204 DELETE /servers/ad62cd12/members/da74148e…/timeout` — pass 1 and pass 2.
- Role save (PATCH): `20x PATCH /servers/ad62cd12/roles/:id` (Moderate Members enabled).
- Role create/delete: `201 POST /roles` (test role) and `204 DELETE /roles/:id` (cleanup).
- Permissions source: `200 GET /servers/ad62cd12/me/permissions` (drives `canModerate`). Note: `GET …/permissions` (no `/me`) returns 404 — that is a stale probe in my own diagnostic, not an app call; the app correctly uses `/me/permissions`.

## Screenshots (all under `process/waves/wave-41/stages/evidence/`)
- `A-02-roles-page.png` — roles page (server had **no custom roles**; only default "Member").
- `S1-01-create-modal.png`, `S1-02-role-editor.png`, `S1-03-moderate-enabled.png`, `S1-04-saved.png` — Moderate Members toggle lifecycle.
- `A-05-mod-menu.png` — "Time out member" menu (danger-red, submenu arrow) on member row.
- `A-06-duration-popover.png` — DURATION submenu (5 minutes / 1 hour / 1 day).
- `A-07-muted-indicator.png` — amber muted indicator after timeout (moderator view).
- `A-10-layout-menu-1280.png`, `A-11-layout-duration-1280.png` — T-6 layout capture @1280.
- `B-01-roster.png`, `B-02-muted-indicator.png` — non-moderator view: no kebab, muted indicator visible.

## Findings
1. **[INFO] Server started with zero custom roles.** Scenario 1 required creating a role to reach the editor (the toggle only renders in the role editor, not on the default Member row). Toggle behaves correctly for an owner on a non-default role: present, enabled, togglable, PATCH-persisted. It is correctly disabled on the default role and for non-owners (`disabled = isDefault || !isOwner`).
2. **[PASS] Moderation gate is correct.** Kebab renders only for viewers with `owner || moderate_members` (A sees it; B does not). The amber muted indicator is public — rendered for ALL viewers on a timed-out row, independent of moderation permission (verified on B).
3. **[PASS] A11y matches the shipped spec.** `role="menu"` + `aria-label="Member moderation"`, Arrow/Home/End nav, Esc close + trigger refocus, outside-click close all functioned live.
4. **[MINOR/COSMETIC] Muted speaker-x icon sits at the far-right edge of the 240px members panel** and is close to the panel boundary (see `B-02`). Legible and not clipped at 1280, but has little right padding; worth a glance if the panel ever narrows.
5. **[NOT A BUG] `mod-kebab` also renders on the moderator's own row.** A owner sees a kebab on its own row too. Not tested for self-timeout; server rank-guard would govern. No spec violation observed.
6. No console errors attributable to the moderation UI (only incidental `401`/`404` from unrelated polling before session settle).

## State changes made + cleanup
- Timed out B four times total (2× S2 passes + prep for S4) — **all cleared**; final `GET /members` shows `mutedUntil: null` for both A and B.
- Created one test role "E2E Educator 97441" to exercise the toggle → **deleted** (`204`); final `GET /roles` shows only default "Member". Server roster/roles left in original clean state.
- Pre-existing junk servers in A's server rail (V1/MV/C2/E1…) are leftovers from prior waves — untouched, out of scope.

**Bottom line:** The wave-41 educator-moderation UI works end-to-end on production for all four primary asks. Delete-any (S5) is the only untested surface and is recommended for a follow-up pass.
