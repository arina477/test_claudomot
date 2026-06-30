# N-1 — Survey & triggers (wave-19)

n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone (entry): 6198650e M3 — Real-time messaging (in_progress)"
  - "todo queue head: eb2a1688 M4 — Offline-first reliability (the wedge)"
  - "active child tasks (M3, entry): open=6 done=21 seed_candidates=5"
  - "unassigned queue depth: 2"
  - "closure: M3 in_progress→done (scope-met; all 3 success-metric features LIVE)"
  - "promotion: eb2a1688 M4 todo→in_progress"
  - "decomposition fired: true (M4 first offline-first bundle, 1 seed + 3 siblings)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 19
active_milestone_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
active_milestone_child_summary:           # M4, post-transition (post-rehome + post-decomposition)
  open: 10                                # 6 re-homed tech-debt + 4 new offline-first bundle tasks
  done: 0
  seed_candidates: 6                       # 5 re-homed top-level tech-debt + 1 offline-first seed (92d85e0e)
next_todo_id: a5232e16                      # M5 — Academic tooling: assignments (next after M4 promoted)
unassigned_queue_depth: 2
state_transitions_applied:
  - {milestone: "6198650e M3 — Real-time messaging", from: in_progress, to: done, recorded_in_decisions_log: true}
  - {milestone: "eb2a1688 M4 — Offline-first reliability", from: todo, to: in_progress, recorded_in_decisions_log: true}
slot_promotion:
  promoted_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
  prior_active_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: eb2a1688-c6b5-416c-84b4-3ede41d07b4c, reason: decomposition-needed, decision: decomposition-complete, by: milestone-decomposer-subagent, fired_at: "2026-06-30"}
ritual_outcomes:
  - ritual: milestone-decomposition
    outcome_summary: "M4 first bundle authored — 1 seed (92d85e0e idempotent send contract) + 3 siblings (IndexedDB store, outbox/send-path integration, offline test harness); ~2,800–3,800 LOC. Wave-20 P-0 carries an IndexedDB-wrapper (Dexie) SDK-research dependency; no founder cred-ask (client-side)."
    decision: decomposition-complete
    by: milestone-decomposer-subagent
loop_state: ready
note: >
  M3 closure (Action 6): scope-met mechanical closure — all three M3 ## Scope success-metric features
  shipped + LIVE (reactions w13, threads w18, attachments w19). roadmap-lifecycle Invariant #3 requires
  all M3 children terminal; the 6 open M3 tasks were parked messaging-infra tech-debt (NOT M3 scope
  features), so rather than cancel real backlog they were RE-HOMED to M4 (M3 ## Required by names M4 as
  building on the messaging path) as independent top-level backlog (parent_task_id NULL, NOT part of M4's
  authored bundle). After rehome M3 had 0 open children → closure valid. M4 promotion (Action 8a) is
  next-sequential roadmap-following (10 todo milestones remain → no stockout/roadmap-planning). Invariant #1
  (exactly one in_progress) re-verified post-flip. Daily-checkpoint (Action 9) NOT fired: Action 7 produced a
  seed candidate (offline-first bundle), so the null-claimable condition does not hold.
