# N-1 — Survey & triggers (wave-46)

head-next gate: **APPROVED** (all N-1 stage-exit checkboxes ticked; anti-pattern scan clear).

## Survey signals (Actions 1–4, live Postgres)

- **Active milestone (Action 1):** M8 `84e17739-af5e-4396-beb9-b6f3d6836fc4` — "Educator tools & deeper academics", status `in_progress`. Exactly one `in_progress` row (invariant holds).
- **todo queue (Action 2):** 5 rows — M9 `3e507bc0` (Monetization), M10 `97d65b49` (Compliance), M11 `8d88e691` (Growth: server discovery), M12 `36378340` (Offline-first moat), M13 `b7400254` (Institution partnerships). No stockout. `next_todo_id` not needed (active slot filled).
- **M8 child summary (Action 3):** open=6, done=20, seed_candidates=5.
- **Unassigned queue depth (Action 4):** 12.

## Trigger phase (Actions 6–10)

- **Action 6 — closure check:** NOT closed. `open_count=6` (≠ 0, so close branch unreachable) AND LLM-judged scope NOT shipped: the shipped DM feature is UNSTARTABLE through the UI (V-1 jenny F-A CRITICAL; V-3 head-verifier REWORK routed to B re-entry), and M8 discretionary scope (study-groups / search) is unbuilt. `done_count=20` is not a scope-shipped signal. **M8 stays `in_progress`.** No premature-milestone-close.
- **Action 7 — decomposition:** NOT fired. `seed_candidates=5` (≠ 0) and scope partial → the queue already has seeds; do not decompose.
- **Action 8 — promotion / stockout:** N/A. Active slot filled (M8 in_progress); no closure this tick; 5 todo milestones exist → no stockout cascade, no roadmap-planning.
- **Action 9 — daily-checkpoint:** does NOT fire. Next-claimable is non-null (F-A seed exists), so the null-claimable precondition is not met.
- **Action 10 — routing:** no ritual proposals fired → nothing to route.

## Anti-pattern scan
Pipeline stall — cleared (seed exists). Premature milestone close — cleared (M8 in_progress). Stale-state read — cleared (all reads live Postgres).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4 (M8, in_progress)"
  - "todo queue head: M9..M13 present (no stockout)"
  - "active child tasks: open=6 done=20 seed_candidates=5"
  - "unassigned queue depth: 12"
  - "closure: none (open_count=6, scope unshipped — DMs unstartable, study-groups/search unbuilt)"
  - "promotion: none"
  - "decomposition fired: false (seed_candidates=5)"
  - "rituals fired: []"
prev_wave: 46
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 6
  done: 20
  seed_candidates: 5
next_todo_id: null
unassigned_queue_depth: 12
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "M8 stays in_progress — DM feature shipped-but-unstartable (F-A CRITICAL) is #1 follow-up; discretionary scope (study-groups/search) unbuilt. Next wave seeds F-A DM-entry-point bundle."
```
