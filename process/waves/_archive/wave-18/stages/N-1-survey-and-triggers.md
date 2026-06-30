# N-1 — Survey & triggers (wave-18 close-out)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 (M3 — Real-time messaging, in_progress)"
  - "todo queue head: eb2a1688 (M4 — Offline-first reliability)"
  - "active child tasks: open=6 done=18 seed_candidates=5 (literal SQL) — but effective FEATURE-seed count = 0 (all 5 are parked tech-debt/polish)"
  - "unassigned queue depth: 2"
  - "closure: none (open_count=6>0 AND attachments unshipped)"
  - "promotion: none (active slot occupied by M3)"
  - "decomposition fired: true (attachments bundle authored under M3)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 18
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_child_summary:
  open: 6
  done: 18
  seed_candidates: 5        # structural; effective feature-seed count = 0
next_todo_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
unassigned_queue_depth: 2
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82, reason: decomposition-needed (no unshipped-feature seed candidate; ## Scope attachments not shipped), decision: fired-inline-subagent, by: milestone-decomposer (automatic mode), fired_at: 2026-06-30T16:02:00Z}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "decomposition-complete — attachments bundle: seed 20db0c16 + 2 siblings (7c39c9e3, cf1ae370); ~2800 LOC", decision: complete, by: milestone-decomposer}
loop_state: ready
note: >
  Action 6 closure WITHHELD: M3 open_count=6 and the last ## Success-metric feature (file/image
  attachments) is unshipped. Action 7 decomposition: literal seed_candidates=5 (≠0), but all 5 are
  parked tech-debt/polish (invite-rotation d058283d, real-PG tier 02fa8011, presence perf 6a546c7b,
  presence code-debt d23a0740, mention parity c18b8089) — NONE is an unshipped FEATURE seed. Effective
  feature-seed count = 0, identical to the wave-17 ruling (product-decisions.md L210). Per the wave-17
  BOARD BINDING (N-1-ordering-wave-17, 7/7 APPROVE feature-first), the next seed must be the success-
  metric feature (attachments), which does NOT displace any feature → binding resolves cleanly, NO BOARD
  needed. Fired milestone-decomposition inline (automatic-mode → milestone-decomposer sub-agent). Bundle
  authored: seed 20db0c16 (upload/storage data plane, object-storage SDK framed as wave-19 P-0/SDK-
  research + rule-6 cred-ask deferred to wave-19 P-block) + siblings 7c39c9e3 (composer send) + cf1ae370
  (message-row render). No closure, no promotion, no stockout, no daily-checkpoint (decomposition fired,
  so Action 9 trigger condition not met).
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from live tasks table (not sidecar). Exactly one trigger selected
    (milestone-decomposition) with cited firing condition (no unshipped-feature seed + scope not shipped).
    Closure correctly withheld (unshipped AC: attachments). No stockout (10 todo milestones). Decomposition
    routed through the milestone-decomposer ritual, not hand-INSERTed. The seed_candidates=5 literal does
    not represent an unshipped-feature seed; the wave-17 feature-first binding governs and resolves clean
    (attachments-first does not displace a feature) — no BOARD escalation warranted.
  next_action: PROCEED_TO_N-2
```
