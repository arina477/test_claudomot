# N-1 — Survey & triggers (wave-4)

head-next gate: APPROVED (items 1-7). See `command-center/product/product-decisions.md` 2026-06-29 entries.

## Survey (Actions 1-4)
- Active milestone: M1 `5a6efc9e-9de7-4594-a75d-d45e30d9a417` (in_progress) — one row, invariant OK.
- todo milestone queue head: M2 `41e61975-c92e-49b1-9ae5-45498dd04925` (M2..M13 all todo). No stockout.
- M1 child summary: open=7, done=5, seed_candidates=1 (pre-repair) → 2 (post-repair, 839af17f + 478e9d43 top-level NULL-wave).
- unassigned_queue_depth: 0.

## Triggers (Actions 6-10)
- Action 6 closure: NONE. M1 stays in_progress (open=7; founder ruled scope not fully shipped — rate-limit + avatar incomplete). No DB write.
- Action 7 decomposition: NOT fired. Seed candidates exist; founder-named tasks already authored. No milestone-decomposer spawn.
- Action 8 promotion/stockout: NONE. M1 active; M2..M13 todo exist.
- Action 9 daily-checkpoint: NOT fired. unassigned_queue_depth=0.
- State reconciliation (tasks UPDATE, brain CRUD): cleared stale `wave_id`→NULL on 839af17f + 84e09891 (scoped to exactly two ids); set 84e09891.parent_task_id=839af17f to form the wave-5 seed+sibling bundle per founder direction. Logged in product-decisions.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 5a6efc9e-9de7-4594-a75d-d45e30d9a417 (M1, in_progress)"
  - "todo queue head: 41e61975-c92e-49b1-9ae5-45498dd04925 (M2)"
  - "active child tasks: open=7 done=5 seed_candidates=1->2 (post state-repair)"
  - "unassigned queue depth: 0"
  - "closure: none (M1 stays in_progress per founder ruling)"
  - "promotion: none"
  - "decomposition fired: false"
  - "rituals fired: []"
prev_wave: 4
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
active_milestone_child_summary:
  open: 7
  done: 5
  seed_candidates: 2
next_todo_id: 41e61975-c92e-49b1-9ae5-45498dd04925
unassigned_queue_depth: 0
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
state_reconciliation:
  - {task: 839af17f-fa3d-4212-a17b-d34bfbb231d7, change: "wave_id cleared (was wave-2 cb76d7b9, unbuilt follow-up)"}
  - {task: 84e09891-2b2f-4b68-b6e2-e2ef340ef32a, change: "wave_id cleared (was wave-4 82387899, unbuilt); parent_task_id set to 839af17f (sibling of seed)"}
loop_state: ready
note: "Founder 'a bit of both' ruling (2026-06-29): hardening next (rate-limit + avatar), then M2->M3. M1 stays in_progress. head-next APPROVED all 7 decisions."
```
