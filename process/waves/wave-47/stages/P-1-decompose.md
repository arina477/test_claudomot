# Wave 47 — P-1 Decompose

## Maximum-size rubric
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~6 (dm.service+controller [GET /dm/candidates], shared dm.ts [candidate DTO], StartDmPicker.tsx, DmHome.tsx, useDm.ts [id-space], api.ts + tests) | > 60 | no |
| New primitives | ~2 (1 endpoint + 1 candidate DTO) | > 60 | no |
| Estimated net LOC | ~250-400 | > 5,000 | no |
| Stage-4 working set | small | > 350K | no |

No maximum threshold trips.

## Wave type
`claimed_task_ids.length == 2` → **multi-spec**. claimed = [10967558 (seed), 379978a4 (sibling)].

## Minimum floor
multi-spec floor: >2,500 LOC OR >=6 tasks. Est ~350 LOC / 2 tasks → **BELOW FLOOR** → RESCOPE-AUTO-MERGE.

## MERGE resolution — override-ship (standing precedent, no redundant re-convene)
The scope is CORRECTLY-SIZED, not under-scoped: P-0 reframe reviewers ceo-reviewer (board seat, **HOLD-SCOPE**) + mvp-thinner (**OK**) BOTH explicitly rejected expansion (mvp-thinner scope-fenced: single candidate source, no directory/typeahead; picker restriction UI correctly deferred to sibling 5bcbd27f). Expanding to meet the floor would violate the reframe consensus.
This is the **8th** instance of the recurring "correctly-sized small/completion wave trips the thin-FEATURE LOC floor" pattern (w16/21/23/24/25/26/27/45). Standing precedent = BOARD override-ship every time; wave-45 founder-proxy explicitly ruled "do NOT re-litigate a Nth per-wave; log a floor-rubric revision instead." Applying that precedent: **override-ship** (resolution ratified by ceo-reviewer board seat + standing precedent + product-decisions log), NO redundant 8th BOARD convene. **L-2: this is the standing floor-rubric-carve-out candidate (infra/hygiene/completion waves are legitimately sub-floor) — promote a project-side guardrail if it qualifies.**

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
The StartDmPicker + candidate-list + empty/loading/restricted states already exist in the canonical `design/direct-messages.html` (D-3 adopted wave-46). This wave rewires the picker's DATA SOURCE (server-members → dm-candidates) + fixes the entry point; no NEW member-facing surface. → skip D, hand to B.

```yaml
p_stage_verdict: COMPLETE
verdict: ESCALATED-FLOOR-UNMET
resolution: "override-ship (standing 8th-instance precedent + ceo-reviewer HOLD-SCOPE ratify; no redundant re-convene; L-2 rubric-carve-out candidate)"
wave_type: multi-spec
claimed_task_ids: [10967558-f27f-4f47-81be-5b5e5d878259, 379978a4-0497-449f-8807-4cffe53d1436]
floor_merge_attempt: 0
design_gap_flag: false
next_block: B
