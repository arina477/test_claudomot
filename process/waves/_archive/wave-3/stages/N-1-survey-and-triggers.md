# N-1 — Survey & triggers (wave-3)

Mode: automatic. head-next gating: APPROVED (PROCEED_TO_N-2).

## Survey signals (Actions 1–4, re-read from live Postgres this tick)

- **Action 1 — active milestone:** exactly one `in_progress` → M1 `5a6efc9e-9de7-4594-a75d-d45e30d9a417` "Foundation: app shell, auth & profiles". Invariant OK (one row).
- **Action 2 — todo queue:** 12 rows M2–M13 (`41e61975` … `b7400254`). No stockout. `next_todo_id` not needed (active slot occupied).
- **Action 3 — M1 child summary:** open_count=7, done_count=4, seed_candidates=2 (`2a655960`, `478e9d43`; both todo + wave_id NULL + parent_task_id NULL).
- **Action 4 — unassigned queue depth:** 0.

## Trigger phase (Actions 6–10)

- **Action 6 — closure check:** M1 `## Scope` names the user/profile module (display name, username, avatar, accent color) + settings-profile page. Wave-3 shipped login front-door + display_name editing only; username/avatar/accent profile customization is explicitly still open (seed `2a655960` covers it). open_count=7 ≠ 0. **No closure — M1 STAYS in_progress. No milestone DB write.**
- **Action 7 — decomposition:** seed_candidates=2 (≥ 1). **NOT fired.**
- **Action 8 — slot promotion / stockout:** active milestone non-null → no promotion. M2–M13 exist → no stockout cascade.
- **Action 9 — daily-checkpoint:** next-claimable non-null AND unassigned_queue_depth=0 → **NOT fired.**
- **Action 10 — routing:** no rituals fired; nothing to route.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 5a6efc9e-9de7-4594-a75d-d45e30d9a417 (M1, in_progress)"
  - "todo queue head: 41e61975-c92e-49b1-9ae5-45498dd04925 (M2) — 12 todo milestones"
  - "active child tasks: open=7 done=4 seed_candidates=2"
  - "unassigned queue depth: 0"
  - "closure: none (M1 stays in_progress — profile-module scope unshipped)"
  - "promotion: none"
  - "decomposition fired: false (seed_candidates=2)"
  - "rituals fired: []"
prev_wave: 3
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
active_milestone_child_summary:
  open: 7
  done: 4
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
loop_state: ready
note: "head-next APPROVED N-1. M1 profile-module scope (username/avatar/accent) explicitly unshipped — milestone correctly held in_progress, no premature close."
```
