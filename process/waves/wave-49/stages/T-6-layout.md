# T-6 — Layout (wave-49 study timer)

**Pattern:** B (active-execution). Surface: the StudyTimerWidget (only D-3-canonicalized UI this wave — `design/study-timer.html`). Deployed-state evidence from the T-5 `ui-comprehensive-tester` swarm (screenshots + live computed-style probes at multiple viewports incl. narrow <1024).

## Action 1/2 — Deployed-state vs canonicalized design
Widget rendered live at web-production-bce1a8 matches `design/study-timer.html` structure at desktop widths:
- Hero mm:ss tabular-nums countdown ✓
- Work phase pill emerald (#10b981) / Break amber ✓ (colors confirmed rendered by T-5 tester-2)
- Start/Pause/Reset (+Resume) controls as buttons ✓
- Ephemeral "N studying" roster with timer badge distinct from online-presence ✓ (T-5 tester-1)
- States idle / running-Work / running-Break / paused / loading / error all render ✓

## Action 4 — Token compliance
Computed styles probed live (via T-5 tester-2): phase colors are design-system emerald/amber (not invented hex); countdown uses tabular-nums; control buttons use system button chrome. **One token/layout defect** (BUG-1, cross-referenced from T-5):

## Action 5 — Diff findings
- **BUG-1 (layout, medium/non-blocking) — narrow-viewport slim-bar phase indicator absent** at `<1024px`. Inline `border: 1px solid rgba(255,255,255,0.06)` shorthand on the widget container (`StudyTimerWidget.tsx:476`) outranks the stylesheet `.timer-phase-work { border-left: 2px solid #10b981 }` (`globals.css:310-315`); computed `border-left` = 1px grey at 800px despite the phase class. This is the SAME finding surfaced at T-5 (F-1) — recorded once in the aggregate, corroborated here as a layout/token defect. Root cause is a CSS specificity collision (inline shorthand vs class border-left), one-line fix (drop `border-left` from the inline shorthand or use individual border sides). Non-blocking: desktop layout correct, feature fully functional; the slim-bar is a narrow-width affordance. → V-2 (candidate V-3 fast-fix).

No other layout diffs; desktop breakpoints (1440/1280/1024) render per design.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [study-timer-widget]
breakpoints: [1440, 1280, 1024, 800]   # tester-2 resized to narrow to exercise the slim-bar contract
diffs:
  - {surface: study-timer-widget, breakpoint: 800, diff_pct: "slim-bar missing", verdict: FINDING-BUG-1}
  - {surface: study-timer-widget, breakpoint: 1440, diff_pct: "<5%", verdict: PASS}
token_violations:
  - {surface: study-timer-widget, issue: "inline border shorthand clobbers .timer-phase-work border-left (BUG-1)"}
fix_up_cycles: 0
findings:
  - {severity: medium, surface: study-timer-widget, description: "slim-bar phase indicator absent <1024px (BUG-1, cross-ref T-5 F-1); one-line CSS fix; → V-2"}
```
