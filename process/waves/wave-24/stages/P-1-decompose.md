# Wave 24 — P-1 Decompose

## Bundle
claimed_task_ids = [02fa8011] (solo). **wave_type = single-spec.** Scope (P-0 accepted expansion): extend the existing wave-17 real-PG harness with 3 integration-spec surfaces — presence co-member resolution + servers member-gate + rbac/assignments authz.

## Maximum rubric — NO threshold trips
| Measure | Estimate | Threshold | Trip? |
|---|---|---|---|
| Files touched | ~4-5 (2-3 new integration spec files under apps/api/test/integration/ + possible pg-harness helper additions + maybe a vitest.integration.config include) | >60 | no |
| New primitives | ~0 (extends existing harness; no new module/route/migration) | >60 | no |
| Net LOC | ~400-600 (test code) | >5,000 | no |
| Stage-4 working set | small | >350K | no |

## Minimum floor — TRIPS (below)
single-spec floor = net LOC >1,500. ~500 LOC → **below floor → RESCOPE-AUTO-MERGE.**

### MERGE protocol (one mandated decomposition-expansion attempt)
- Fired milestone-decomposer `expand-current-bundle` (agentId a055047aae8294fad) → **`incomplete-scope`**. M5 ## Scope = {assignment feature (SHIPPED w22+w23) + reminder arc (cred-blocked on founder Resend key)}. No unblocked adjacent scope to floor-fill; padding a test seed = coverage theater. No DB write. `floor_merge_attempt: 1`.

### Recursion-guard escalation → BOARD (automatic mode)
- decision-slug `P-1-floor-merge-wave-24` → **BOARD 6/7 APPROVE A (override-ship)**, 1 ABSTAIN (user-advocate), no hard-stops. Logged: `process/waves/wave-24/escalations/board-P-1-floor-merge-wave-24.md` + product-decisions.md 2026-07-02.
- **Resolution:** override-ship the ~500-LOC under-floor test-infra slice (3rd instance; extends w16/w21/w23 floor-exemption precedent).

## Carried BOARD conditions (binding on B/T)
1. **T-4 false-green guard (risk-officer, binding):** verify per-CI-job the integration tier ACTUALLY executed — nonzero executed count + real-DB round-trip row-count as each spec's load-bearing assertion. Green-with-0/skipped = false-green = gate fail (wave-17 lesson).
2. **Resend escalation (5-member convergent):** sharpened in pending-founder-asks.log — M5's real unblock.
3. **Floor-rubric revision (industry-expert + founder-proxy):** L-2/roadmap-planning candidate; needs a falsifiable framing (wave-23 obs-4 was karen-rejected non-falsifiable). Do NOT re-litigate a 4th per-wave.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Test-infra only — no UI/page/primitive. → next block **B** (skip D).

## Verdict
**ESCALATED-FLOOR-UNMET → BOARD override-ship (PROCEED with logged floor exception).** wave_type=single-spec. No siblings created/removed (solo [02fa8011]).

```yaml
wave_type: single-spec
verdict: ESCALATED-FLOOR-UNMET-RESOLVED-OVERRIDE-SHIP
maximum_rubric_tripped: false
minimum_floor_tripped: true
floor_merge_attempt: 1
decomposition_expansion_result: incomplete-scope
board_decision: "P-1-floor-merge-wave-24 → 6/7 (ABSTAIN 1) APPROVE override-ship"
claimed_task_ids: [02fa8011-1d44-4a02-a808-eba7191fba1b]
design_gap_flag: false
```

## Exit
Sizing recorded. Floor exception BOARD-ratified. design_gap_flag=false (→ B after P-4). → P-2 Spec.
