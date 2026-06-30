# N-1 — Survey & triggers (wave-13)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 (M3 — Real-time messaging, in_progress)"
  - "todo queue head: eb2a1688-c6b5-416c-84b4-3ede41d07b4c (M4 — Offline-first reliability)"
  - "active child tasks: open=3 done=7 seed_candidates_raw=3 (all 3 parked tech-debt; feature-seed count=0 by LLM judgment)"
  - "unassigned queue depth: 0"
  - "closure: none (M3 scope materially unshipped — presence/typing, member-list, mentions, attachments, threads remain)"
  - "promotion: none (M3 still active)"
  - "decomposition fired: true (next-bundle, presence+typing+member-list slice)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 13
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_child_summary:
  open: 3
  done: 7
  seed_candidates: 3          # raw SQL count; all 3 are parked tech-debt, not M3 feature seeds → effective feature-seed count = 0 pre-decomposition
next_todo_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
unassigned_queue_depth: 0
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82, reason: decomposition-needed, decision: spawned-inline, by: milestone-decomposer, fired_at: "2026-06-30T04:16:00Z"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "decomposition-complete — 1 seed + 3 siblings (presence/typing/member-list slice, ~2800 LOC)", decision: applied, by: milestone-decomposer}
loop_state: ready
note: >
  Closure check (Action 6): M3 open_count=3 > 0 AND LLM judges scope NOT shipped (M3 ## Scope still lists
  presence+typing /presence namespace, member-list-with-presence, mentions, attachments, thread replies — none shipped;
  shipped through wave-13 = message send/receive/edit/delete + reactions only). NO close — correct per Action 6 fall-through.
  Decomposition (Action 7): the 3 open M3 tasks (46f16288 create-server E2E, 25523fb0 rollback-test, d058283d invite-rotation)
  are parked tech-debt top-level todos, NOT M3 feature seeds (confirmed by title + carried-from-M2 lineage). Effective feature-seed
  count = 0; scope unshipped → fired milestone-decomposition (next-bundle) inline per automatic-mode route.
  Slot promotion / stockout (Action 8): M3 active → no promotion; 10 todo milestones (M4–M13) exist → no stockout, no roadmap-planning.
  Daily-checkpoint (Action 9): unassigned_queue_depth=0 → NOT fired.
  Mode: automatic. No measured pause trigger fired (no founder message, no hard-stop verdict, no .loop-paused.yaml, STATUS=RUNNING).
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (not a sidecar). Exactly one trigger selected (milestone-decomposition,
    Action 7), firing condition cited: M3 active + no FEATURE seed candidate (3 parked tech-debt excluded by LLM judgment) +
    scope unshipped. Closure correctly suppressed (open_count>0 AND scope unshipped). No stockout (todo queue non-empty).
    No daily-checkpoint (unassigned depth=0). Invariant holds (exactly 1 in_progress milestone). All N-1 exit checkboxes ticked.
  next_action: PROCEED_TO_N-2
```
