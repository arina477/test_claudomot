# N-1 — Survey & triggers (wave-60)

Head-next gated: **APPROVED** (spawn-pattern; owns N-block).

## Survey phase (Actions 1–4) — live DB reads

- **Action 1 — active milestone:** M8 (id `84e17739-af5e-4396-beb9-b6f3d6836fc4`, `in_progress`) — "Educator tools & deeper academics". Exactly one `in_progress` row (no invariant violation).
- **Action 2 — todo queue:** M9 (Monetization, `3e507bc0`), M10 (Compliance, `97d65b49`), M11 (Growth: server discovery, `8d88e691`), M12 (Offline-first moat, `36378340`), M13 (Institution partnerships, `b7400254`). `next_todo_id` moot — slot occupied.
- **Action 3 — M8 child summary:** `open_count=2`, `done_count=41`, `seed_candidates=2`.
  - Open: `874bd233` (DM throttle/429 — drainable tail, todo, parent NULL, wave NULL) + `999a14d1` (getDmCandidates pagination — DO-NOT-AUTO-DRAIN, wave-56 deferral stands, premature at zero users).
- **Action 4 — unassigned queue depth:** 13.

## Trigger phase (Actions 6–10)

- **Action 6 — closure check:** NO. M8 `open_count=2>0` → not shipped, no `in_progress→done`.
- **Action 7 — decomposition:** NO. `seed_candidates≥1` drainable (874bd233) → active queue has a seed; no decomposition fired. (999a14d1 counts toward the raw `seed_candidates=2` but is policy-excluded from drainage.)
- **Action 8 — promotion / stockout:** NO. `active_milestone != null` → no promotion. 5 `todo` milestones present → NOT a stockout; no roadmap-planning.
- **Action 9 — daily-checkpoint:** NO **this wave**. Next-claimable is NOT null (874bd233 claimable). **Forward flag:** after wave-61 drains 874bd233, M8's only remaining task is the do-not-drain 999a14d1 → next-claimable NULL + `unassigned_queue_depth>0` → daily-checkpoint fires at **wave-61 N-1** → founder. wave-61 is very likely the last autonomous wave before a founder checkpoint.
- **Action 10 — routing:** No rituals fired this tick. Standing M9/M12 founder-reserved direction carried forward as a NON-PAUSING soft flag (not re-decided, no BOARD, no STATUS: BLOCKED). No measured pause trigger (b/d/e/f) fired → loop CONTINUES.

## Exactly one trigger fired: **next-task** (seed 874bd233), firing condition — M8 `in_progress` with a drainable seed present.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4 (M8, in_progress)"
  - "todo queue head: 3e507bc0 (M9) — slot occupied, moot"
  - "active child tasks: open=2 done=41 seed_candidates=2"
  - "unassigned queue depth: 13"
  - "closure: none"
  - "promotion: none"
  - "decomposition fired: false"
  - "rituals fired: []"
prev_wave: 60
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 2
  done: 41
  seed_candidates: 2
next_todo_id: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548
unassigned_queue_depth: 13
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: >
  Standing founder-reserved decision (M9 Monetization + M12 Offline-first moat) carried
  forward as NON-PAUSING soft flag; not re-decided, no BOARD, no pause. wave-61 forward flag:
  once 874bd233 drains, M8 has only do-not-drain 999a14d1 → daily-checkpoint fires at
  wave-61 N-1 → founder. wave-61 likely last autonomous wave before founder checkpoint.

head_signoff:
  verdict: APPROVED
  stage: N-1-survey-triggers
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from live tasks table (874bd233 verified todo/parent NULL/wave
    NULL/M8 child). Exactly one trigger fires (next-task) with firing condition cited. All
    five alternatives ruled out against live DB. Founder-reserved M9/M12 carried forward as
    non-pausing soft flag, not re-decided, no BOARD, no STATUS: BLOCKED.
  next_action: PROCEED_TO_N-2
```
