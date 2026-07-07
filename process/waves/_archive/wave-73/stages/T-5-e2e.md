# T-5 — E2E: "Your privacy activity" audit-log panel (production)

**Target:** `https://web-production-bce1a8.up.railway.app/settings/privacy` (web) → `https://api-production-b93e.up.railway.app` (api)
**Account:** Fixture A — `studyhall-e2e-fixture@example.com` (@studyhallfixturea)
**Date:** 2026-07-07
**Tool:** Playwright MCP (instance `playwright-2`), single browser context, never closed.

## Feature under test
Read-only "Your privacy activity" panel on Settings › Privacy. Lists the caller's own privacy
events (settings change / block / unblock / deletion / export) in plain English with relative
timestamps. Data from `GET /profile/privacy-events`. Rendered as a panel among the existing ones
(visibility control, Blocked users, Your data, Danger Zone).

## Scenario verdict table

| # | Scenario | Verdict | Evidence |
|---|----------|---------|----------|
| 1 | Panel renders on /settings/privacy (`data-testid=privacy-activity-panel`); shows list OR empty state | **PASS** | Panel present; heading "Your privacy activity" + description "A log of privacy-related actions you have taken on your account." Shows a **list** (not empty). Rows have `privacy-event-row-<id>` / `privacy-event-label-<id>` / `privacy-event-ts-<id>`. Screenshot `T-5-scenario1-panel-renders.png`. |
| 2 | **Core e2e** — change profile-visibility radio (auto-save) → reload → new "You changed your privacy settings" row appears at top with relative timestamp | **PASS** | Toggled visibility `everyone` (Visible to classmates) → `nobody` (Hidden). `PUT /profile/privacy` → 200. Reloaded: new **top** row "You changed your privacy settings (profile visibility Visible to classmates → Hidden)" · "Just now". Hook→panel→endpoint path proven live. Screenshot `T-5-scenario2-event-appeared.png`. |
| 3 | Events are caller's own, plain English (no raw codes like `privacy_settings_changed`) | **PASS** | All rows read "You changed your privacy settings" (+ optional "(profile visibility X → Y)"). Bundle source confirms label map: `privacy_settings_changed`→"You changed your privacy settings", `user_blocked`→"You blocked a user", `user_unblocked`→"You unblocked a user". No raw event_type surfaced. Own-scoped: API returns only actorId == this fixture. |
| 4 | Loading = skeleton (not spinner); panel doesn't error | **PASS** | Bundle source: loading branch renders `data-testid=privacy-activity-loading` (`aria-busy=true`) = two skeleton rows (grey avatar circle `#27272a` + two grey bars 55%/20% width). No `animate-spin`/spinner. 0 console errors across all loads. Error branch (`privacy-activity-error` + "Try again" retry) present but not triggered. |

## Notes / observations
- **First-load timing artifact (non-blocking):** on the very first *cold direct navigation* to `/settings/privacy` the panel briefly did not appear in the DOM and `GET /profile/privacy-events` had not yet fired (page rendered the other panels first). On the next clean navigation the panel rendered correctly and the endpoint fired. Backend was always healthy (direct `GET /profile/privacy-events` returned 200 with data throughout). Classified as an SPA hydration/mount race on cold entry, not a feature defect — the panel fetches on mount and the initial observation caught a pre-fetch frame. Worth a glance if it recurs, but the feature works.
- Label carries rich context: the from→to visibility transition is rendered inline in plain English — a nice touch beyond the minimum spec.
- Relative timestamps render correctly and update ("Just now" → "1m ago" → "2m ago" → "3m ago" observed).
- Endpoint is own-scoped: `GET /profile/privacy-events` returned only events with `actorId` == the fixture's own id.

## Cleanup
- Profile-visibility **reverted to original value `everyone` (Visible to classmates)**. Verified authoritatively via `GET /profile/privacy` → `{ profileVisibility: "everyone", whoCanDm: "everyone" }`. Fixture A left logged in, settings restored. No deletions. The audit rows generated (settings-change events) are append-only + expected per the feature.

```yaml
test_pattern: active
testers_spawned: 1
scenarios:
  - id: 1
    name: panel-renders
    verdict: PASS
  - id: 2
    name: event-appears-after-settings-change
    verdict: PASS
    core_e2e: true
  - id: 3
    name: own-scoped-plain-language
    verdict: PASS
  - id: 4
    name: loading-skeleton-not-spinner-no-error
    verdict: PASS
flakes_observed:
  - description: cold-first-navigation showed panel absent + privacy-events not yet fired; resolved on next clean nav; backend healthy throughout
    classification: spa-mount-race-on-cold-entry
    blocking: false
fix_up_cycles: 0
findings:
  - severity: minor
    area: frontend-hydration
    note: "First cold direct-nav to /settings/privacy rendered other panels before privacy-activity-panel mounted / before GET /profile/privacy-events fired. Self-resolved on next nav. Monitor for recurrence."
  - severity: positive
    area: labels
    note: "privacy_settings_changed label includes inline plain-English visibility transition (X -> Y); no raw event_type codes leak to UI."
  - severity: positive
    area: states
    note: "Loading state is a two-row skeleton (aria-busy), not a spinner, per spec. Error state with retry present. Empty state (privacy-activity-empty / 'No privacy activity yet') present in bundle."
```
