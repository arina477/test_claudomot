# Wave 17 — P-1 Decompose

## Maximum size rubric (no threshold trips)
| Measure | Estimate | Threshold | Pass |
|---|---|---|---|
| Files touched | ~3-5 (real-PG test harness/setup, the rollback integration spec, maybe a vitest config for the integration tier, package.json devDep) | >60 | ✓ |
| New primitives | ~3 (real-PG test harness, mid-txn-failure injection, the rollback assertion spec) | >60 | ✓ |
| Net LOC | ~300-600 (harness setup + migration-apply + the rollback test + orphan-row assertions) | >5000 | ✓ |
| Stage-4 working set | <350K | >350K | ✓ |

## Wave type + floor
- claimed_task_ids = [25523fb0] → length 1 → **single-spec**.
- Floor (single-spec): >1500 LOC. Estimate ~300-600 LOC → BELOW the 1500 floor.
- **Floor disposition: OVERRIDE-SHIP (test-infra exempt)** — same rationale as wave-16 P-1 (logged in product-decisions wave-16 entry): test-coverage/test-infra waves are exempt from the feature-LOC floor (test code is inherently low-LOC; decomposer can't author feature-siblings for a tech-debt seed). Applied directly (technical/process call, rule 17). Kept single-task (problem-framer: keep focused on create-server; do NOT bundle 02fa8011 — it becomes a harness-reuse follow-on once this lands).

## Verdict: PROCEED (single-spec, floor-overridden for test-infra)
- floor_merge_attempt: 0
- **02fa8011 follow-on note:** the real-PG harness this wave builds is reusable for 02fa8011 (real-PG integration tier for presence/services). Once this lands, 02fa8011 can be authored as a thin consumer of the harness — flag for a future wave's P-0/N-1.

## design_gap_flag: FALSE
```yaml
design_gap_flag: false
missing_surfaces: []   # backend integration test only; no UI surface → D-block SKIPS
```
