# Wave 35 — T-6 Layout (visual regression / DESIGN-SYSTEM discipline)

Stage: T-6 (Layout) · Block: T (Test) · Mode: automatic
Target: LIVE prod deploy (deploy_commit `0c71585`), web https://web-production-bce1a8.up.railway.app
Tool: bundled chromium (playwright MCP chrome-channel unavailable — see T-5). Viewports: desktop 1280×900, mobile 390×844. Never browser_close.
Surfaces: `/settings/privacy` (auth), `/privacy` (public), `/terms` (public).
Evidence: `process/waves/wave-35/blocks/T/shots/` — t6-settings-privacy-viewport.png, t6-settings-privacy-full.png, t6-settings-privacy-mobile390.png, t6-stub-privacy-full.png, t6-stub-terms-full.png.

## Overall verdict: PASS — no layout regressions

| Check | Surface | Result |
|---|---|---|
| Dark theme intact (DESIGN-SYSTEM base) | all 3 | PASS — `body { background: rgb(10,10,11) }`, text `rgba(255,255,255,0.92)` |
| No horizontal overflow (desktop 1280) | all 3 | PASS — `scrollWidth == clientWidth (1280)`, zero elements right-edge > viewport |
| No horizontal overflow (mobile 390) | settings-privacy | PASS — `scrollWidth == clientWidth (390)` |
| Disabled who-can-DM visually distinct from active controls | settings-privacy | PASS — dimmed `opacity: 0.55`, `pointer-events: none` |
| DESIGN-SYSTEM token discipline (accent, cards, spacing) | settings-privacy | PASS — green accent on selected radio; consistent card/border treatment |
| No overlap / broken layout | all 3 | PASS — visually verified in screenshots |

---

## /settings/privacy
- **Dark theme:** body background `rgb(10, 10, 11)` — matches DESIGN-SYSTEM base surface token. Cards use a slightly-raised surface with subtle border.
- **Visibility control:** the two options ("Visible to classmates" / "Hidden") render as bordered card rows with a custom radio. The **selected** row ("Visible to classmates") carries the **green accent** (radio fill + row border) — the DESIGN-SYSTEM active-selection token. Clean visual hierarchy: heading → helper text → options → explanatory footnote.
- **Disabled who-can-DM ("Who can message you?"):** the three rows ("Anyone in my servers" / "Classmates only" / "No one") are rendered clearly **dimmed** (computed `opacity: 0.55`, `pointer-events: none`) and are visually, unmistakably distinct from the active visibility control above. "BETA FEATURE" pill badge next to the heading reinforces the inactive state. This directly satisfies the T-6 requirement that the disabled affordance read as inactive.
- **Account-data "Your data" section:** profile + membership summary render in the same card idiom; no overflow, no clipping of the email/username text.
- **Responsive:** at 390×844 the page reflows to a single column with no horizontal overflow and no overlap (t6-settings-privacy-mobile390.png).

## /privacy (public stub)
- Dark theme intact (`rgb(10,10,11)` bg, `rgba(255,255,255,0.92)` text). Heading "Privacy Policy". Body copy laid out in readable prose blocks; no overflow at 1280 or 390. Renders without auth.

## /terms (public stub)
- Dark theme intact (same tokens). Heading "Terms of Service". No overflow, no overlap. Renders without auth.

## Regressions
None found. The only cosmetic note is textual, not layout: both stubs display "Last updated: 2024" (pre-existing © 2024 string, flagged non-blocking at B-6; not a wave-35 regression) — LOW, tracked in findings-aggregate.

```yaml
head_signoff:
  stage: T-6
  verdict: PASS
  surfaces_checked: [settings-privacy, privacy-stub, terms-stub]
  viewports: [1280x900, 390x844]
  dark_theme: intact (rgb(10,10,11))
  horizontal_overflow: none
  disabled_dm_distinct: true (opacity 0.55, pointer-events none)
  regressions: []
  findings: []   # LOW cosmetic "Last updated 2024" is pre-existing (B-6), not a T-6 layout regression
```
