# P-1 Decompose — wave-59

## Maximum size rubric (split when over) — NO SPLIT
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | 1 (new useTyping.test.ts) | no |
| New primitives | >60 | 0 (test-only, no models/routes/services/migrations) | no |
| Net LOC | >5,000 | ~50 (table-driven test, 5 buckets) | no |
| Stage-4 working set | >350K tok | trivial | no |

## Wave type
single-spec (claimed_task_ids.length == 1 → [f8eb49c1]).

## Minimum floor — TRIPPED, WAIVED BY PRECEDENT
Single-spec floor is >1,500 net LOC; a ~50-LOC unit test trips it. **Floor WAIVED** under the standing
`wave-16` product-decision (`command-center/product/product-decisions.md:233`): "Test-coverage waves are
exempt from the feature-LOC floor" — a test-debt seed's decomposer cannot author feature-siblings, and the
floor is a thin-FEATURE guard. Re-affirmed waves 21/23/24. Resolution: override-ship per P-1 §2b(a),
kept single-task to respect the N-2 seed pick. No BOARD (resolve-by-rule; precedent + P-0 reframe trio all PROCEED).

## Verdict: PROCEED (floor-exempt, single-task)

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # test-only; touches no UI surface (asserts a pure function's output)
```

## Footer
```yaml
wave_type: single-spec
verdict: PROCEED
floor_merge_attempt: 0    # decomposition NOT invoked — resolved by wave-16 exemption precedent
siblings_created: []
design_gap_flag: false
```
