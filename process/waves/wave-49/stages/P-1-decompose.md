# Wave 49 — P-1 Decompose
## Max rubric
| Measure | Estimate | Threshold | Trips? |
|---|---|---|---|
| Files touched | ~15-20 (timer schema+migration; timer service+controller; gateway fan-out+presence; shared Zod; timer widget+presence-roster UI; phase-transition compute) | > 60 | no |
| New primitives | ~10 (1 table+migration+module+~4 endpoints+socket events+widget+presence) | > 60 | no |
| Net LOC | ~2000-2400 (incl. presence-roster add) | > 5,000 | no |
| Stage-4 working set | moderate | > 350K | no |
No max trip.
## Wave type: **multi-spec** (4 tasks). claimed_task_ids [1387d845, cb81bf03, c3daf6d3, 832b83b7].
## Floor: multi-spec >2500 LOC OR >=6 tasks. Est ~2000-2400 / 4 tasks → **BELOW FLOOR** → RESCOPE-AUTO-MERGE.
**Resolution: override-ship** — real FEATURE slice (founder-directed study-group tools slice 1), correctly-sized per the P-0 reframe (ceo-reviewer SELECTIVE-EXPANSION = build it + presence; mvp-thinner THIN = right-sized after the configure peel). Expanding to meet the floor would either un-defer configure (contradicts mvp THIN) or pull in bigger study-group slices (study-sessions/whiteboard — separate slices, violates the boundary). This is the Nth instance of the multi-spec LOC floor being too high for StudyHall's ~2000-LOC feature slices (recurring; L-2 rubric-carve-out candidate). Override per standing precedent + reviewer ratification; NO redundant BOARD.
## design_gap_flag
```yaml
design_gap_flag: true
missing_surfaces:
  - "Study-timer widget in the server view (countdown display work/break phase + start/pause/reset controls) — new member-facing surface"
  - "Live-presence roster on the timer ('N studying' / avatars of members viewing the running timer) — new ephemeral-presence surface (ceo SELECTIVE-EXPANSION)"
```
→ D-block runs.
```yaml
p_stage_verdict: COMPLETE
verdict: ESCALATED-FLOOR-UNMET
resolution: "override-ship (feature slice, reviewer-ratified, Nth sub-floor precedent; no redundant BOARD)"
wave_type: multi-spec
claimed_task_ids: [1387d845-b8db-40cc-b6cb-a83d508ce3fe, cb81bf03-3472-4987-9749-86b254f89f19, c3daf6d3-01b4-4aa8-8e45-a198c456ecf3, 832b83b7-2124-475c-90bd-7dbc33f3a4f8]
floor_merge_attempt: 0
design_gap_flag: true
next_block: D
