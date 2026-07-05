# T-6 — Layout (wave-50)

**Pattern:** B (active). Surface: the study-timer duration-config affordance + the F-1 slim-bar fix (canonical `design/timer-duration-config.html`, D-3 adopted). Deployed-state evidence from the T-5 tester-2 live run (computed styles + screenshots at desktop 1440 + slim 800).

## Action 1/2 — Deployed vs canonical design
Widget affordance rendered live matches `design/timer-duration-config.html`:
- Duration-config: two number inputs (Work/Break) + Apply, `.btn-primary` emerald chrome, `--surface-800`/hairline inputs, `--radius-md` — per design ✓ (tester-2 S7).
- 5 states render (idle-editable / locked+hint / validation-error / applying / applied) ✓.
- <1024 compact inline reveal (toggle, not modal/panel) — matches the D-3 adopted slim rendering ✓ (tester-2 S6, openDialogCount=0).

## Action 4 — Token compliance + F-1
- **F-1 slim-bar (the wave's fix) — VERIFIED live:** computed `border-left` = 2px `rgb(16,185,129)` emerald (Work) / `rgb(245,158,11)` amber (Break) at 800px; idle 0px. Design-system accent tokens, NOT invented hex. The wave-49 defect (1px grey clobber) is resolved.
- Validation-error uses `--danger` border/text + icon (not color-only). No off-token values (D-3 head-designer confirmed zero invented hex; tester-2 confirmed live).

## Action 5 — Diffs
No layout diffs / no findings. The affordance stays clear of the hero countdown at all breakpoints (tester-2: no overlap). Desktop states + slim reveal + F-1 border all render per design.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [study-timer-duration-config-affordance, study-timer-slim-bar (F-1)]
breakpoints: [1440, 800]
diffs:
  - {surface: slim-bar-F-1, breakpoint: 800, diff_pct: "resolved (2px phase border renders)", verdict: PASS}
  - {surface: config-affordance, breakpoint: 1440, diff_pct: "<5%", verdict: PASS}
token_violations: []
fix_up_cycles: 0
findings: []
```
