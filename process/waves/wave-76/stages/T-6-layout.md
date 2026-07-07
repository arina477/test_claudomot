# Wave 76 — T-6 Layout

**Pattern:** B (Active — live DOM/computed-style inspection vs adopted design). Fires: UI wave.

## Console vs adopted design/educator-admin-console.html
Live console (`educator-admin-console`) computed styles + structure:
- **Dark theme tokens:** backgroundColor `rgb(28,28,31)` (SURFACE_800), border `rgba(255,255,255,0.06)` (HAIRLINE), boxShadow present — matches the DESIGN-SYSTEM dark surface + hairline idiom shared with ServerPlanPanel.
- **Inline-SVG icons render:** 7 SVG icons present in the console (ShieldCheckIcon header + per-group icons from icons.tsx). No broken/missing icons.
- **Stat cards:** 7 stat cards (`stat-member-count`, `stat-educator-count`, `stat-student-count`, `stat-message-volume`, + assignment/submission/activity stats).
- **No horizontal overflow:** `scrollWidth <= clientWidth` on the console section.
- **4 states:** loaded dashboard (verified T-5), empty/zero dashboard (verified T-5), hidden/null (verified T-5), forbidden state (code path present: 403 → loadStatus 'forbidden'; error state → retry). Loading state via SpinnerIcon.

## Note
Element-screenshot capture was flaky in headless (settings modal paint intermittently 0×0 between tool calls); layout evidence gathered via computed-style + structural DOM inspection while the console was painted, which is authoritative for token/overflow/icon checks. Header "School Plan" subtitle + "Read-only aggregate metrics to monitor general server health and completion rates" copy renders per design.

```yaml
test_pattern: active
evidence:
  - "dark tokens: bg rgb(28,28,31) SURFACE_800, border rgba(255,255,255,0.06) HAIRLINE"
  - "7 inline-SVG icons render, 7 stat cards, no horizontal overflow"
  - "4 states present (loaded/empty/hidden verified live; forbidden+error+loading in code path)"
findings: []
