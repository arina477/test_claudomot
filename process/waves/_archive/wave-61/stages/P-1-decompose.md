# P-1 Decompose — wave-61

## Maximum size rubric — NO SPLIT
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~3 (dm.controller.ts @Throttle; client DM read/backoff; maybe a test) | no |
| New primitives | >60 | 0 (reuses existing ThrottlerModule) | no |
| Net LOC | >5,000 | ~40 (decorator + backoff wrapper) | no |
| Stage-4 working set | >350K | trivial | no |

## Wave type: single-spec (claimed_task_ids == [874bd233]).

## Minimum floor — TRIPPED, WAIVED (override-ship, resolve-by-rule)
Single-spec floor >1,500 LOC; ~40 LOC trips it. Floor WAIVED per the floor-exemption lineage
(product-decisions wave-16/21/50): the floor is a thin-FEATURE guard; this is a real, cited read-path
correctness/consistency fix (wave-47 V-2 T-8/T-5) reusing the EXISTING ThrottlerModule infra on ALREADY-SHIPPED
DM endpoints. All 3 P-0 reviewers scope-fenced (problem-framer round-2 PROCEED, ceo-reviewer HOLD-SCOPE,
mvp-thinner OK) — no adjacent unbuilt M8 scope. Override-ship §2b(a), single-task, resolve-by-rule (no BOARD).

## Verdict: PROCEED (floor-waived, single-task)

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # backend throttle config + client read-path backoff; no UI surface
```

## Footer
```yaml
wave_type: single-spec
verdict: PROCEED
floor_merge_attempt: 0
siblings_created: []
design_gap_flag: false
security_surface: rate-limit   # T-8 applies; P-4 security-scope-tightened gate in effect
```
