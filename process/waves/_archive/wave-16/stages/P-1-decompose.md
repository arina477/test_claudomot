# Wave 16 — P-1 Decompose

## Maximum size rubric (no threshold trips)
| Measure | Estimate | Threshold | Pass |
|---|---|---|---|
| Files touched | ~4-6 (authed E2E spec, playwright auth setup/global-setup or fixture, playwright.config authed project, helper/selectors) | >60 | ✓ |
| New primitives | ~3 (authed-session E2E harness, create-server E2E scenario, fixture sign-in helper) | >60 | ✓ |
| Net LOC | ~400-700 (authed Playwright harness + create-server E2E + anti-flake waits) | >5000 | ✓ |
| Stage-4 working set | <350K | >350K | ✓ |

## Wave type + floor
- claimed_task_ids = [46f16288] → length 1 → **single-spec**.
- Floor (single-spec): >1500 LOC. Estimate ~400-700 LOC → **BELOW the 1500 single-spec floor.**

## Floor disposition: OVERRIDE-SHIP (logged) — test-infra exemption
- RESCOPE-AUTO-MERGE considered: the decomposer authors siblings from milestone ## Scope items; the seed (46f16288) is TECH-DEBT, not a ## Scope feature, so expand-current-bundle would no-op (as it did at wave-15 N-1). No feature-sibling merge is possible.
- **No test-coverage wave can clear a feature-LOC floor** — test code is inherently lower-LOC than the feature it covers; the floor is a feature-sizing heuristic (guards against thin FEATURE waves), not applicable to a test-coverage tech-debt task. This is a technical/process call (rule 17 — applied directly, not a product/taste poll, not a BOARD-class scope ambiguity).
- Resolution path (a) override-ship-anyway, logged in command-center/product/product-decisions.md. Kept SINGLE-task (respects N-2's seed pick; does not autonomously balloon scope — the adjacent create-server test tasks 25523fb0/02fa8011 remain parked for future waves).

## Verdict: PROCEED (single-spec, floor-overridden for test-infra)
- floor_merge_attempt: 0 (no decomposer merge — tech-debt seed has no ## Scope siblings; override applied)

## design_gap_flag: FALSE
```yaml
design_gap_flag: false
missing_surfaces: []   # tests an EXISTING live UI flow (create-server modal → rail → #general, shipped M1); no new surface
```
Anti-flake discipline (P-0 carry): explicit waits, deterministic fixture state, no retry-masking → P-3 + T-4/T-5.
