# T-5 — E2E (wave-50)

**Pattern:** B (active) against LIVE prod. 2 `ui-comprehensive-tester` (both drove the installed `playwright` node package directly — the MCP shared-profile lock blocked MCP browsers; tester-2's first attempt BLOCKED on that, re-ran clean via the node package). Fixtures A+B on server `ad62cd12`.

## Scenario verdicts

| # | Criterion | Tester | Verdict (2 runs) | Evidence |
|---|---|---|---|---|
| S1 | Two-client custom-durations sync live (A sets 45/10, 38/12 → B reflects, no reload) | 1 | **PASS** | study-timer:update socket frames carry workDurationMs/breakDurationMs on both; updatedBy=A |
| S2 | New durations take effect on Start (custom work length, not 25:00, on A+B) | 1 | **PASS** | Start → 44:57 / 49:57 FOCUS on both clients |
| S3 | Config blocked while running (409) + desktop-visible reset hint | 1 | **PASS** | inputs disabled, Apply removed, visible "Reset timer to change lengths" @1440; server 409 guard confirmed |
| S4 | Validation (out-of-range → inline error, no propagation) | 1 | **PASS** | 200/150 → "Must be 1-120", Apply disabled, bad value never sent to B |
| S5 | F-1 slim-bar 2px phase LEFT border @ <1024 (the wave-49 bug) | 2 | **PASS** | computed border-left = 2px rgb(16,185,129) Work / rgb(245,158,11) Break @ 800px; idle 0px — NOT the 1px grey defect |
| S6 | Config @ <1024 is compact inline reveal (not modal), no hero overlap | 2 | **PASS** | aria-expanded toggle, openDialogCount=0, inline row |
| S7 | Desktop config states (idle/locked/validation) | 2 | **PASS** | testid-verified |
| S8 | D-3 a11y carries (aria-label inputs, non-color-only error, aria-invalid/describedby/live, disabled-Apply reason) | 2 | **PASS** | DOM attributes confirmed |

## Must-verify outcomes
- **Custom-durations 2-client live sync — VERIFIED** (the wave's crux; socket frames captured with the new duration fields).
- **New durations apply on Start — VERIFIED** (44:57 not 25:00).
- **Config idle-only guard (409) with desktop-visible hint — VERIFIED** live (client removes Apply while running + server 409 both confirmed).
- **F-1 slim-bar fix — VERIFIED FIXED live** (2px emerald/amber phase border at <1024; the exact wave-49 T-5 defect is resolved).
- **D-3 a11y carries — VERIFIED live.**

## Findings (→ V-2)
None. All scenarios PASS. No 5xx, no app console errors (only benign pre-login 401 probe). Roster showed "2 studying / Live sync" (real co-presence). Timers restored to 25/5 idle.

## Note (non-finding)
Test-harness limitation: the MCP playwright servers share one Chrome profile (non-isolated) → concurrent testers mutually exclude (tester-2 first run BLOCKED). Workaround: drive the installed `playwright` node package with an isolated context (both testers did). Recurring across waves → candidate T-5.md principle (provision --isolated/distinct user-data-dir for parallel testers). NOT a product defect.

```yaml
test_pattern: active
skipped: false
testers_spawned: 2
scenarios:
  - {id: S1, criterion_ref: two-client-durations-sync, verdict: PASS}
  - {id: S2, criterion_ref: durations-take-effect-on-start, verdict: PASS}
  - {id: S3, criterion_ref: config-idle-only-409-desktop-hint, verdict: PASS}
  - {id: S4, criterion_ref: validation, verdict: PASS}
  - {id: S5, criterion_ref: F-1-slim-bar-border, verdict: PASS}
  - {id: S6, criterion_ref: config-inline-reveal, verdict: PASS}
  - {id: S7, criterion_ref: desktop-config-states, verdict: PASS}
  - {id: S8, criterion_ref: a11y-carries, verdict: PASS}
flakes_observed: []
fix_up_cycles: 0
findings: []
```
