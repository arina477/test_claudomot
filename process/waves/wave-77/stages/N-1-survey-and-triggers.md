# N-1 — Survey & triggers (wave-77)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: b7400254-9c16-4b97-a898-2619b949fc5e (M13, in_progress) — exactly 1 in_progress row (no invariant violation)"
  - "todo queue head: null (todo milestone queue EMPTY, 0 rows)"
  - "active child tasks: open=2 done=8 seed_candidates=2"
  - "unassigned queue depth: 27"
  - "closure: none (open=2 ≠ 0; leg-3 privacy/E2E scope also unauthored)"
  - "promotion: none (active milestone non-null)"
  - "decomposition fired: false (seed_candidates=2 > 0)"
  - "rituals fired: []"
prev_wave: 77
active_milestone_id: b7400254-9c16-4b97-a898-2619b949fc5e
active_milestone_child_summary:
  open: 2
  done: 8
  seed_candidates: 2
next_todo_id: null
unassigned_queue_depth: 27
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: b7400254-9c16-4b97-a898-2619b949fc5e
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: >
  DB-verified survey (psql against CLAUDOMAT_DB_URL). Trigger ladder walked and each branch measured:
  Action 6 closure — open=2 ≠ 0 → NO close; M13 stays in_progress (leg-3 privacy/E2E unauthored, scope not shipped).
  Action 7 decomposition — seed_candidates=2 > 0 → does NOT fire (work existing queue; no milestone-decomposer spawn).
  Action 8 promotion/stockout — active≠null → no promotion, no stockout cascade (todo-queue empty only matters if M13 closes).
  Action 9 daily-checkpoint — seed candidates exist (next-claimable non-null) → does NOT fire.
  Net: no rituals fire this tick. The 2 seed candidates are wave-77 V-2 member-profile-card UX polish follow-ups.
  head-next gate: APPROVED (no premature close, no out-of-ritual decompose, pipeline stall cleared — loop continues).
```

## Seed candidates (both parent_task_id NULL, todo, wave_id NULL, milestone_id=M13)

| id | title | source |
|---|---|---|
| 4be3b084-c86f-48f6-b3fc-fe9e95d60556 | Allow clearing academicRole back to unset | wave-77 V-2 (T-8 LOW + jenny F-J1) |
| 3b3530d8-f452-4e26-b50d-be2d3dabf384 | Distinguish hidden profile from transient network error on member card | wave-77 V-2 (B-3 + T-8 LOW + jenny F-J2) |
