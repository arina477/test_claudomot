# N-1 — Survey & triggers (wave-20)

Mode: automatic. Gated by head-next.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: eb2a1688-c6b5-416c-84b4-3ede41d07b4c (M4 — Offline-first reliability) in_progress"
  - "todo queue head: a5232e16 (M5 — Academic tooling: assignments) — NOT promoted; M4 slot occupied"
  - "active child tasks: open=6 done=4 seed_candidates=5 (all 5 candidates are re-homed M3 tech-debt, NOT M4 scope)"
  - "unassigned queue depth: 2"
  - "closure: none (open_count=6, scope not shipped)"
  - "promotion: none (active slot occupied)"
  - "decomposition fired: true (milestone-decomposer, next-bundle)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 20
active_milestone_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
active_milestone_child_summary:
  open: 6
  done: 4
  seed_candidates: 5
next_todo_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
unassigned_queue_depth: 2
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: eb2a1688-c6b5-416c-84b4-3ede41d07b4c, reason: decomposition-needed, decision: spawn-milestone-decomposer-inline, by: head-next, fired_at: 2026-06-30}
ritual_outcomes:
  - ritual: milestone-decomposition
    outcome_summary: >-
      ONE bundle authored (1 seed + 2 siblings) for M4's next increment. Premise-verification
      against codebase refined the brief: connection-state COMPONENT already shipped but DEAD
      (hardcoded online in AppHome.tsx:39) -> seed derives live state; pending/failed message
      UI ALREADY SHIPPED -> dropped (no rebuild); multi-page catch-up loop genuinely unshipped
      (runDrainAndCatchup fetches once, ignores nextCursor) -> sibling. Spine (Dexie store,
      outbox, ?after= cursor) confirmed present; bundle CONSUMES, does not rebuild.
    decision: decomposition-complete
    by: milestone-decomposer
loop_state: ready
note: >-
  Action 7 LLM scope judgment: M4 ## Scope has 3 enumerated surfaces beyond the shipped spine
  (connection-state indicator, pending/failed UI, catch-up pagination). The literal
  seed_candidates count (5) is non-zero, but all 5 are M3 tech-debt re-homed at M3 closure
  (effective M4-feature-seed count = 0 per wave-17/19/20 parked-tech-debt precedent). The
  M4-spine next increment had no seed candidate -> decomposition correctly fired. M4 does NOT
  close: multi-wave, scope unshipped. Live bet ad1a3685 (offline-first wins students from
  Discord) directly served by M4.
```
