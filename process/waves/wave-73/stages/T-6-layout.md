# T-6 — Layout: "Your privacy activity" panel (production)

**Target:** `https://web-production-bce1a8.up.railway.app/settings/privacy`
**Account:** Fixture A (@studyhallfixturea)
**Date:** 2026-07-07
**Tool:** Playwright MCP (`playwright-2`), same session as T-5. Never closed.
**Breakpoints:** 1440, 1024.

## Screenshots
- `screens/privacy-activity-panel-1440.png` — panel at 1440px viewport.
- `screens/privacy-activity-panel-1024.png` — panel at 1024px viewport.
- `screens/settings-privacy-fullpage-1440.png` — full page (cross-panel ordering/consistency).

## Checks

| Check | Result |
|-------|--------|
| Consistent with other /settings/privacy panels (dark theme) | PASS — surface `#1c1c1f`, hairline border `rgba(255,255,255,0.06)`, subtle shadow — identical shell to Blocked Users / Your data panels. |
| DS tokens (surfaces, text hierarchy) | PASS — header eyebrow `--text-secondary` (rgba .60) with clock icon; h3 `--text-primary` (rgba .92); description `--text-secondary`; row label `--text-primary`; timestamp `--text-muted` (rgba .40); row tint `rgba(255,255,255,0.02)`; avatar chip `--surface-700` (#27272a). All from DESIGN-SYSTEM.md. |
| Readable contrast | PASS — primary-on-surface and muted-timestamp legible; no low-contrast text. |
| List rows legible | PASS — clock-icon chip + wrapping plain-English label + relative timestamp; multi-line labels wrap cleanly. |
| Relative timestamps present | PASS — "Just now", "2m ago", "3m ago" rendered in muted style. |
| No broken / overflowing layout | PASS — panel is a fixed max-width content column (~624px) at BOTH 1440 and 1024; `hasHorizontalOverflow=false` at both; no child exceeds its container. |
| Empty state styled (if shown) | N/A shown live (list populated), but bundle confirms `privacy-activity-empty` = centered icon chip + "No privacy activity yet" copy, DS-styled. |

## Visual regression
None. Panel is visually identical across 1440 and 1024 (content column is max-width-capped, so the two breakpoints render the same). Matches the sibling privacy panels' card styling. No token drift, no misalignment, no clipping.

## Notes
- Full-page 1440 screenshot is very tall due to the fixture's large "Membership summary" list (~hundreds of E2E test-server joins) inside the "Your data" panel — this is fixture data volume, NOT a layout defect of the privacy-activity panel.

```yaml
test_pattern: active
surfaces_audited:
  - settings-privacy-your-privacy-activity-panel
breakpoints: [1440, 1024]
diffs: []
token_violations: []
findings:
  - severity: none
    area: layout
    note: "Panel consistent with sibling privacy panels at both breakpoints; fixed max-width content column, no overflow, DS tokens correct, timestamps + rows legible. No regression."
```
