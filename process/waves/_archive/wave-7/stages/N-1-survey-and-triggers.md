# N-1 — Survey & triggers (wave-7)

Block N (Next), stage N-1. Mode: `automatic`. head-next owns the block.

## Survey phase (Actions 1–4)

- **Action 1 — active milestone:** one row — M2 `41e61975-c92e-49b1-9ae5-45498dd04925` "Servers, channels & membership", `in_progress`. No invariant violation (exactly one `in_progress`).
- **Action 2 — todo queue:** 11 `todo` milestones (M3…M13). `next_todo_id` not needed this tick (active slot is occupied; no promotion).
- **Action 3 — M2 child-task summary:** `open_count=3`, `done_count=4`, `seed_candidates=3`.
  - done (4) = the create-server slice, LIVE+verified: a47ed9bc (data model + create-server API + owner membership), a87341fe (seed default channels + category), e32b50dd (list-my-servers + server-detail read APIs), d62d6ce3 (wire servers+channels into rail/sidebar/create-server).
  - open (3) = wave-7 V-3 tech-debt/test follow-ups, `parent_task_id IS NULL`, `wave_id IS NULL`: 46f16288 (browser E2E for create-server), 4a2ad286 (persistent verified prod test fixture), 25523fb0 (real-PG mid-transaction rollback test).
- **Action 4 — unassigned queue depth:** 0.

## Trigger phase (Actions 6–10)

- **Action 6 — closure check:** M2 NOT closed. `open_count=3 ≠ 0` and LLM judges scope NOT shipped — only the create-server slice of `## Scope` is built; membership join/leave/kick/ban, two-tier invites + invite-preview/join, RBAC, the invite-join + server-settings pages all remain unbuilt. M2 stays `in_progress`. Premature-close avoided.
- **Action 7 — per-wave decomposition trigger (FIRED):** the strict SQL gate (`seed_candidates = 0`) is not literally met (3 candidates), but all three candidates are tech-debt/test FOLLOW-UPS, not the next feature seed the milestone scope requires. Per N-1 Action 7 intent + N-2 Action 1's explicit LLM re-ordering allowance, the effective *feature*-seed count is 0 and `## Scope` is not shipped → fired `milestone-decomposition` (reason `decomposition-needed`, caller mode `next-bundle`) against M2.
  - Routed per Action 10 `automatic` table → spawned `milestone-decomposer` sub-agent inline (single-threaded). Briefed: create-server slice shipped; the 3 open rows are tech-debt follow-ups to leave untouched; author the next FEATURE bundle anchored on the success metric (invites + join-flow).
  - Returned `decomposition-complete`: 4-task bundle — seed c7443638 "Build two-tier server invite backend (ad-hoc invites + permanent code)" + 3 siblings 77e2041a (invite-preview + join-server membership API), 72fc08ea (invite-join page), 54407e1d (invite-create + share UI). ~2800 LOC, ≤60 files. Decision-log appended + committed (3d7946c).
- **Action 8 — slot promotion / stockout:** N/A — active slot occupied by M2; no promotion, no stockout cascade.
- **Action 9 — daily-checkpoint:** NOT fired — decomposition fired this tick AND `unassigned_queue_depth = 0`. Conditions not met.
- **Action 10 — routing:** decomposition routed to `milestone-decomposer` sub-agent (automatic). No BOARD, no ceo-agent.

## head-next gating verdict

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table, not a sidecar. Exactly one trigger
    fired (milestone-decomposition) with cited condition: M2 in_progress, scope unshipped,
    no feature seed candidate (the 3 existing top-level todos are tech-debt follow-ups, not
    feature seeds). M2 closure correctly withheld (open_count=3, scope incomplete). No
    roadmap-planning needed (11 todo milestones exist). Daily-checkpoint correctly not fired
    (unassigned queue empty, decomposition fired). Bundle authored via the decomposer ritual,
    not hand-INSERTed.
  next_action: PROCEED_TO_N-2
```

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 41e61975-c92e-49b1-9ae5-45498dd04925 (M2, in_progress)"
  - "todo queue head: 6198650e (M3) — no promotion (slot occupied)"
  - "active child tasks: open=3 done=4 seed_candidates=3 (all 3 candidates are tech-debt follow-ups)"
  - "unassigned queue depth: 0"
  - "closure: none (M2 scope incomplete — invites/RBAC/settings unbuilt)"
  - "promotion: none"
  - "decomposition fired: true (caller next-bundle; returned decomposition-complete)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 7
active_milestone_id: 41e61975-c92e-49b1-9ae5-45498dd04925
active_milestone_child_summary:
  open: 3
  done: 4
  seed_candidates: 3
next_todo_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
unassigned_queue_depth: 0
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 41e61975-c92e-49b1-9ae5-45498dd04925
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 41e61975-c92e-49b1-9ae5-45498dd04925, reason: decomposition-needed, decision: applied, by: milestone-decomposer, fired_at: "2026-06-29T17:34:51Z"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "4-task invites+join bundle authored (seed c7443638 + 3 siblings)", decision: decomposition-complete, by: milestone-decomposer}
loop_state: ready
note: "M2 first bundle (create-server) shipped+verified wave-7; M2 stays in_progress. Next bundle = invites + join-flow, the multi-user core per the M2 success metric."
```
