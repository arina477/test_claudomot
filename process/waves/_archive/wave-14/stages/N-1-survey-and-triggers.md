# N-1 — Survey & triggers (wave-14)

Mode: `automatic`. head-next owns this block.

## Survey signals (Actions 1–4)

- **Action 1 — active milestone:** M3 — Real-time messaging, `6198650e-f4e0-44dc-9b0a-6550f01f9f82` (`in_progress`). Exactly one `in_progress` row — invariant holds.
- **Action 2 — todo queue:** 10 rows (M4..M13). Head by tier: M4 — Offline-first reliability (`eb2a1688`). No stockout.
- **Action 3 — M3 child summary:** open=7, done=10, seed_candidates(literal SQL)=3.
  - The 3 literal seed_candidates are ALL parked tech-debt carried from waves 7/9, NOT M3 feature seeds: `46f16288` (create-server E2E), `25523fb0` (mid-txn rollback test), `d058283d` (invite-code rotation).
  - Other open: 3 wave-14 V-2 non-blocking follow-ups (`02fa8011`, `6a546c7b`, `d23a0740`) + 1 deferred polish sibling (`10b9d18e` author-row presence dots).
  - **No FEATURE seed candidate exists for M3's next slice.**
- **Action 4 — unassigned queue depth:** 0.

## Trigger phase (Actions 6–10)

- **Action 6 — Closure check:** M3 `open_count=7 > 0` AND LLM judges scope NOT shipped — M3 `## Scope` still lists unshipped mentions, attachments, threads; `## Success metric` explicitly requires "threads, and attachments working". → **NO close.** M3 stays `in_progress`.
- **Action 7 — Per-wave decomposition:** active milestone exists, no FEATURE seed candidate (3 literal top-level todos are parked tech-debt, not the next slice), scope unshipped. → **FIRED** milestone-decomposition (reason `decomposition-needed`) against M3. Under `automatic`, spawned `milestone-decomposer` sub-agent inline (Action 10 mode table). Result: `decomposition-complete` — @mentions bundle authored (seed `3d238446` + siblings `cd585f04`, `c3f3f62a`), ~2200 LOC. Decomposer chose mentions as lightest/lowest-risk/self-contained next M3 slice; threads + attachments deferred to later M3 waves.
- **Action 8 — Slot promotion / stockout:** active milestone non-null → no promotion. 10 `todo` milestones exist → no stockout cascade.
- **Action 9 — Daily-checkpoint:** NOT fired — decomposition fired this tick (produced a seed), AND `unassigned_queue_depth = 0`. Conditions not met.
- **Action 10 — Routing:** `automatic` → decomposition spawned milestone-decomposer sub-agent (always inline). Outcome applied: one bundle INSERTed under M3 (`wave_id=NULL`, seed `parent_task_id IS NULL` + 2 siblings).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 (M3 in_progress)"
  - "todo queue head: eb2a1688-c6b5-416c-84b4-3ede41d07b4c (M4)"
  - "active child tasks: open=7 done=10 seed_candidates(literal)=3 (all parked tech-debt, no feature seed)"
  - "unassigned queue depth: 0"
  - "closure: none (M3 scope unshipped — mentions/attachments/threads)"
  - "promotion: none (active slot occupied by M3)"
  - "decomposition fired: true (M3 @mentions bundle authored)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 14
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_child_summary:
  open: 7
  done: 10
  seed_candidates: 3   # literal SQL; all parked tech-debt — no feature seed pre-decomposition
next_todo_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
unassigned_queue_depth: 0
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82, reason: decomposition-needed, decision: fired, by: milestone-decomposer (automatic), fired_at: "2026-06-30T07:08Z"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "@mentions bundle — seed 3d238446 + siblings cd585f04, c3f3f62a (~2200 LOC)", decision: decomposition-complete, by: milestone-decomposer}
loop_state: ready
note: "Literal seed_candidates=3 are parked tech-debt (waves 7/9), not M3 feature seeds; Action 7 fired correctly on absence of a next-feature seed + unshipped scope."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: "Next-claimable computed from live tasks table. Exactly one trigger (decomposition) fired with cited firing condition. Closure correctly withheld — M3 has 7 open tasks AND unshipped feature scope (mentions/attachments/threads per Scope + Success metric). Decomposition fired because no next-FEATURE seed existed (the 3 literal top-level todos are parked tech-debt). A todo milestone exists, so no roadmap-planning. unassigned_queue_depth=0 so no daily-checkpoint."
  next_action: PROCEED_TO_N-2
```
