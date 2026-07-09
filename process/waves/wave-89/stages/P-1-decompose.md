# Wave 89 — P-1 Decompose
## Maximum rubric
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | > 60 | ~2 (ProfilePage.tsx + a profile test) | no |
| New primitives | > 60 | 0 (refs on existing fields + focus logic) | no |
| Net LOC | > 5,000 | ~40-80 (refs + scroll/focus-first-invalid in the academic save + test) | no |
| Stage-4 working set | > 350K | trivial | no |
**No maximum threshold trips.**
## Wave type
`claimed_task_ids=[45f0a88d]` → length 1 → **single-spec**.
## Minimum floor
- single-spec floor: net LOC > 1,500. Estimate ~60. **FLOOR TRIPS → RESCOPE-AUTO-MERGE.**
## RESCOPE-AUTO-MERGE → IMPOSSIBLE → floor WAIVED by precedent citation
Decomposition-expand impossible (0 in_progress + 0 todo milestones; seed milestone_id NULL). Per wave-87 BOARD `P-1-floor-merge-wave-87` (apply-by-citation; all 4 conditions hold — (1) bug-fix phase, (2) merge-impossible/milestone-unassigned, (3) single coherent fix, (4) live-verified). **Floor WAIVED by citation. No BOARD.** (Reminder: the founder's parked strategic re-plan remains open — reinforced this wave.)
## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
No new visual/design surface — scroll+focus behavior on an existing form reusing the existing aria-invalid/role="alert" pattern. Skip D-block.
## Verdict — PROCEED
```yaml
wave_type: single-spec
max_rubric_trips: none
floor_estimate_loc: ~60
floor_waived_by: "wave-87 BOARD P-1-floor-merge-wave-87 (citation; all 4 conditions hold)"
board_convened: false
verdict: PROCEED
design_gap_flag: false
```
