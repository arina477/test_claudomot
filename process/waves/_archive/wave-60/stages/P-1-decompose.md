# P-1 Decompose — wave-60

## Maximum size rubric — NO SPLIT
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | 3 (ServerRail.tsx, StartDmPicker.tsx, disabled-send surface) | no |
| New primitives | >60 | 0 | no |
| Net LOC | >5,000 | ~15 (3 inline-hex → var(--color-surface-*) conversions) | no |
| Stage-4 working set | >350K tok | trivial | no |

## Wave type
single-spec (claimed_task_ids == [5bcbd27f]).

## Minimum floor — TRIPPED, WAIVED (override-ship, resolve-by-rule)
Single-spec floor is >1,500 net LOC; ~15 LOC trips it. **Floor WAIVED** per the standing floor-exemption lineage
in product-decisions.md: wave-16 (test-coverage) → wave-21 (UX-completion/infra-reuse) → wave-50 (sub-floor
feature-completion/debt-fix on shipped surfaces, floor waived, resolve-by-rule, no BOARD). The floor is a
thin-FEATURE guard; it does not apply to a real, cited design-debt fix (wave-46 T-6 F10) on ALREADY-SHIPPED DM
surfaces reusing the existing design-token system. All 3 P-0 reviewers scope-fenced against expansion
(problem-framer PROCEED, ceo-reviewer HOLD-SCOPE, mvp-thinner OK) — no adjacent unbuilt M8 scope to floor-fill
(M8 substantive scope shipped). Resolution: override-ship per P-1 §2b(a) recursion-guard, single-task,
resolve-by-rule (no BOARD — routine sizing to rule-resolution per wave-50 precedent).

## Verdict: PROCEED (floor-waived, single-task)

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # existing DM surfaces; canonical tokens already defined in DESIGN-SYSTEM.md/globals.css
```

## Footer
```yaml
wave_type: single-spec
verdict: PROCEED
floor_merge_attempt: 0   # decomposition not invoked — resolved by floor-exemption precedent (wave-50/16/21)
siblings_created: []
design_gap_flag: false
```
