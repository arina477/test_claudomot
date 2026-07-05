# N-1 — Survey & triggers (wave-50)

Canonical state read LIVE from Postgres this turn (not a sidecar). head-next (agent `abae158f52302344f`) gated this stage: **APPROVED**.

## Survey signals (Actions 1–4)

- **Action 1 — active milestone:** exactly ONE `in_progress` — M8 — Educator tools & deeper academics (`84e17739-af5e-4396-beb9-b6f3d6836fc4`). No invariant violation (≤1 in_progress).
- **Action 2 — todo queue (5, no stockout):** M9 Monetization (`3e507bc0`), M10 Compliance (`97d65b49`), M11 Growth: server discovery (`8d88e691`), M12 Offline-first moat (`36378340`), M13 Institution partnerships (`b7400254`).
- **Action 3 — M8 child summary:** open=7, done=29, seed_candidates=7 (all `parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`, 0 siblings each).
- **Action 4 — unassigned queue depth:** 13.

## Trigger phase (Actions 6–10)

- **Action 6 — closure:** M8 open=7 > 0 → NO closure. M8 stays `in_progress`. (Premature-close guard holds.)
- **Action 7 — decomposition:** seed_candidates=7 > 0 → decomposition does NOT auto-fire (Action 7 gates on 0). N-2 picks from the 7.
- **Action 8 — promotion / stockout:** active milestone present → no promotion; todo queue non-empty (M9–M13) → no stockout roadmap-planning.
- **Action 9 — daily-checkpoint:** seed candidates exist (next-claimable non-null) → does NOT fire (Action 9 requires null-claimable).
- **Action 10 — routing:** no ritual proposals fired → nothing to route.

Net: **no rituals auto-fire.** Trigger ladder resolves to the N-2 seed-pick path.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4 (M8, in_progress)"
  - "todo queue head: M9-M13 present (no stockout)"
  - "active child tasks: open=7 done=29 seed_candidates=7"
  - "unassigned queue depth: 13"
  - "closure: none (open=7 > 0)"
  - "promotion: none (active slot occupied)"
  - "decomposition fired: false (seed_candidates=7 > 0)"
  - "rituals fired: []"
prev_wave: 50
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 7
  done: 29
  seed_candidates: 7
next_todo_id: null
unassigned_queue_depth: 13
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "automatic mode; STATUS=RUNNING; no measured pause trigger. head-next N-1 signoff APPROVED."
```

## head-next N-1 signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Canonical state read live from Postgres this turn. Exactly one in_progress milestone (M8),
    todo queue non-empty (M9-M13), 7 legitimate M8 seed candidates and 13 unassigned rows. M8 open=7
    so closure correctly does NOT fire and M8 stays in_progress. Seed candidates exist, so
    decomposition (Action 7, gates on 0) and daily-checkpoint (Action 9, gates on null-claimable)
    both correctly do NOT auto-fire. Trigger ladder resolves to the N-2 seed-pick path.
  next_action: PROCEED_TO_N-2
```
