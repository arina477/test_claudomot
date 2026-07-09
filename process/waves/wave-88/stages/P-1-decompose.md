# Wave 88 — P-1 Decompose

## Maximum-size rubric
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~2-3 (dm.service.ts + registered-key lookup; dm.service.spec.ts; maybe dm-encryption.integration.spec.ts) | no |
| New primitives | > 60 | 0-1 (optional resolveRegisteredKey helper) | no |
| Estimated net LOC | > 5,000 | ~60-90 (validation branch + key lookup + fail-open guard + tests) | no |
| Stage-4 working set | > 350K | trivial | no |
**No maximum threshold trips.**

## Wave type
`claimed_task_ids = [1f48f4db]` → length 1 → **single-spec**.

## Minimum floor
- single-spec floor: net LOC **> 1,500**. Estimate ~60-90. **FLOOR TRIPS → RESCOPE-AUTO-MERGE.**

## RESCOPE-AUTO-MERGE → IMPOSSIBLE → floor WAIVED by precedent citation
Decomposition-expand is impossible: 0 in_progress + 0 todo milestones; seed `1f48f4db.milestone_id IS NULL`. Per the wave-87 BOARD ruling `P-1-floor-merge-wave-87` (7/7 APPROVE; guardrail: **apply-by-citation, do NOT re-convene BOARD** when all four conjunctive conditions hold): bug-fix-phase sub-floor waves ship at natural coherent size when — (1) bug-fix phase active ✓, (2) RESCOPE-AUTO-MERGE impossible / milestone-unassigned ✓, (3) a single coherent fix ✓, (4) behavior-preserving OR live-verified at natural size ✓ (a live-verified security-hardening fix). **All four hold → floor WAIVED by citation. No BOARD.** (Reminder per the precedent: the founder's parked strategic re-plan remains open — see the backlog-thinning signal in P-0-frame.md.)

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Backend-only server-side validation on the DM send path + tests. No UI surface.

## Verdict — PROCEED
```yaml
wave_type: single-spec
max_rubric_trips: none
floor_applicable: 1500
floor_estimate_loc: ~75
floor_verdict: RESCOPE-AUTO-MERGE
merge_feasible: false
floor_waived_by: "wave-87 BOARD P-1-floor-merge-wave-87 (apply-by-citation; all 4 conditions hold)"
board_convened: false
verdict: PROCEED
design_gap_flag: false
```
