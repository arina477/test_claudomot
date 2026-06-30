# N-1 — Survey & triggers (wave-16)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 (M3 — Real-time messaging, in_progress)"
  - "todo queue head: eb2a1688-c6b5-416c-84b4-3ede41d07b4c (M4 — Offline-first reliability) — queue healthy M4..M13"
  - "active child tasks: open=7 done=14 seed_candidates=2"
  - "unassigned queue depth: 2"
  - "closure: none (M3 scope NOT shipped — thread replies + file/image attachments have no done task; success metric requires threads+attachments)"
  - "promotion: none (active slot occupied by M3)"
  - "decomposition fired: false (seed_candidates=2 != 0 — decomposer Step-1.4 validation would refuse; NO milestone-decomposer spawn)"
  - "rituals fired: []"
prev_wave: 16
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_child_summary:
  open: 7
  done: 14
  seed_candidates: 2
next_todo_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
unassigned_queue_depth: 2
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: >
  CORRECTION TO PRE-SURVEY: live DB shows seed_candidates=2 (not 0). The two genuine
  seed candidates (status=todo, wave_id IS NULL, parent_task_id IS NULL) are 25523fb0
  (real-PG create-server rollback test, oldest) and d058283d (invite-code rotation).
  The pre-survey's "tier enabler" 02fa8011 (Real-PG integration test tier) is NOT a
  seed candidate: it has wave_id=wave-14 (status ok) — a stale claim (claimed but never
  closed). Likewise 6a546c7b, d23a0740 (wave-14) and c18b8089 (wave-15) are stale
  claims, NOT seedable. N-2's seed query (wave_id IS NULL) cannot pick any of them, so
  the proposed "pick 02fa8011 first" path is not actionable at N-2. Decomposition NO-OP
  (seed_candidates != 0). Daily-checkpoint does NOT fire (Action 9 gate requires
  Action-7 'no seed candidate', which is false). No measured pause trigger — automatic
  mode, loop continues.
  STALE-CLAIM NOTE (informational, no N-block write): 4 M3 tasks carry a closed wave's
  wave_id while still status=todo (02fa8011, 6a546c7b, d23a0740 @ wave-14; c18b8089 @
  wave-15). They are re-surfaceable via milestone_id but invisible to the seed query.
  Flagged for P-0 of wave-17 to consider re-parenting/re-decomposing into seedable rows;
  not an N-block edit (task status flips are B-0/L-2/V-2 owned, not N-1's).
```
