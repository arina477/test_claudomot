# T-6 — Layout (wave-69) [Pattern B — active, live prod]
UI wave. Surfaces: report dialog (T-5-captured) + owner report inbox + affordances. vs design/moderation-report.html (D-3 APPROVED). Single sequential tester (avoided the T-5 shared-browser lock).

## Surfaces / breakpoints
| Surface | 1440 | 375 (mobile) |
|---|---|---|
| Report dialog | PASS (T-5: chrome + bottom-sheet + counter) | PASS (bottom sheet, T-5) |
| Owner report inbox | PASS — faithful to D-3 (rows target/reason/reporter/time + Timeout/Delete[danger]/Dismiss[ghost]; no overflow/clip/font-drift) | **CRITICAL FAIL (T6-M1)** |
| Report affordances (member/message) | PASS desktop (flag/moderate 24×24 SVG, dark) | — |

## Token audit (Action 4) — ALL PASS
- Delete/Timeout danger buttons: computed backgroundColor rgb(185,28,28) = #b91c1c (the AA fill, NOT #ef4444) + white text.
- Dismiss ghost: transparent + rgba(255,255,255,0.6) (--text-secondary).
- Emerald primary: rgb(16,185,129) #10b981 + DARK rgb(10,10,11) surface-950 text (§8 dark-on-emerald held).
- Geist font (no drift); Phosphor icons inline SVG (trash/clock/user/flag), no missing-glyph boxes.

## Findings → V-2
- **T6-M1 (CRITICAL, B-3 frontend) — mobile report inbox unreachable.** At 375px the inbox `fixed inset-0` overlay is mounted INSIDE the ChannelSidebar drawer wrapper which carries `transform: translateX(-260px)` on mobile. A transformed ancestor becomes the containing block for `position:fixed` descendants → the inbox collapses to a 260px box parked off-screen left (rendered x=-188, width=260); only a ~72px clipped sliver shows. The moderator inbox is unusable on a phone. FIX: portal the ReportInbox overlay to document.body (proper modal pattern) OR mount it outside the transformed drawer. Desktop unaffected. → V-2 (consolidate with T-5 F1 for one V-3 fast-fix + redeploy).

```yaml
test_pattern: active
skipped: false
surfaces_audited: [report-dialog, owner-report-inbox, report-affordances]
breakpoints: [1440, 375]
diffs:
  - {surface: report-inbox, breakpoint: 1440, diff_pct: <5, verdict: PASS}
  - {surface: report-inbox, breakpoint: 375, diff_pct: broken, verdict: CRITICAL-FAIL}
  - {surface: report-dialog, breakpoint: 1440+375, verdict: PASS}
token_violations: []
fix_up_cycles: 0
findings:
  - {severity: CRITICAL, surface: report-inbox-mobile, description: "T6-M1: fixed-inset overlay trapped in translateX drawer → off-screen on mobile; portal to body. → V-2"}
```
