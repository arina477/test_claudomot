# N-1 — Survey & triggers (wave-30)

Milestone-closing N-block. Mode: `automatic`. head-next gate: APPROVED (N-1).

## Survey phase (Actions 1–4)

- **Action 0 — head-next spawned** for N-block lifetime; ACK'd, gated all three stages.
- **Action 1 — active milestone:** M5 (a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d) `in_progress`. Exactly one row (invariant OK).
- **Action 2 — todo queue head:** M6 (8702a335 — Voice/video study rooms, `product-feature`, T4, founder-bet must-have) chosen over M7 (6e2f68d8 — Privacy/launch-polish, `product-polish`, T4) by prose priority. `next_todo_id = 8702a335`.
- **Action 3 — M5 child summary (pre-disposition):** open=6, done=15, seed_candidates=0.
- **Action 4 — unassigned queue depth:** 6 (pre-disposition); 12 after disposing M5's 6 open tasks.

## Trigger phase (Actions 6–10)

### Action 6 — M5 closure check → CLOSED
M5's sole unbuilt `## Scope` item (due-date reminder notifications, cron + NotificationsModule via Resend) shipped LIVE this wave (PR #43 / 81dc821, migration applied, api LIVE, all gates APPROVE). `## Success metric` MET (V-block + T-9 F6/F9 reminders LIVE). LLM-judged scope shipped.

**Dispose-before-close (Invariant #3):** M5's 6 open child tasks are NONE of them M5-metric scope — all generic polish/hardening/cross-cutting debt. Re-homed to the unassigned queue (`milestone_id=NULL`) as staged-for-P-0 work (none obsolete → no cancel):
- 4b397de0 (controller-spec IDOR assertion), 6f257c82 (rowToDto fold), 3ad35a42 (optimistic-toggle-revert), 72cb6ebb (stale manage_channels sweep), 226c7e42 (integration-tier hardening), fdb444fc (presence dots — M3-era re-homed debt).

After disposition M5 open_count → 0. `UPDATE milestones SET status='done' WHERE id='a5232e16-...'`. Recorded in product-decisions.md.

### Action 7 — Per-wave decomposition (against newly-promoted M6)
M6 promoted (Action 8a) → active slot filled, queue empty (0 children, 0 seed candidates). Fired milestone-decomposition (reason `decomposition-needed`, `next-bundle`, `automatic`-mode → milestone-decomposer sub-agent inline). Returned `decomposition-complete`: seed d8a85de0 (VoiceModule LiveKit token-mint) + 2 siblings (1dd1f2ca client join surface, 78f51968 who's-in-room occupancy), ~2200 LOC. Committed 901938f.

### Action 8 — Slot promotion
**8a. Promote:** active slot emptied by M5 close → `UPDATE milestones SET status='in_progress' WHERE id='8702a335-...'` (M6). Highest-tier todo; founder-bet product-feature over M7 polish. Recorded in product-decisions.md. Re-evaluated Action 7 against M6 (fired — see above).
**8b. Stockout cascade:** N/A — M6/M7/M8–M13 all `todo`; no stockout, no roadmap-planning.

### Action 9 — Daily-checkpoint: NOT fired
A claimable seed exists post-cascade (M6 bundle); Action 7 fired successfully, so the checkpoint precondition ("no seed candidate AND decomposition not fired") does not hold.

### Action 10 — Routing
Only ritual fired = milestone-decomposition → `automatic`-mode route: milestone-decomposer sub-agent, inline. Applied: one bundle INSERTed under M6.

## Invariants confirmed
- #1 (≤1 in_progress): after M5→done, M6→in_progress → exactly one `in_progress` = M6. Verified via `SELECT ... WHERE status='in_progress'`.
- #2 (promotion requires prior active done): M5 reached `done` before M6 promoted (ordering).
- #3 (closure requires all children terminal): all 6 M5 children disposed to unassigned before the done flip; open_count=0 at close.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: a5232e16 (M5) → closed done"
  - "todo queue head: 8702a335 (M6) → promoted in_progress"
  - "active child tasks (M5, pre-disposition): open=6 done=15 seed_candidates=0"
  - "unassigned queue depth: 6 → 12 (after disposing M5's 6 open tasks)"
  - "closure: M5 in_progress→done"
  - "promotion: 8702a335 (M6):todo→in_progress"
  - "decomposition fired: true (M6 bundle — seed d8a85de0 + 2 siblings, ~2200 LOC, commit 901938f)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 30
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
active_milestone_child_summary:
  open: 3
  done: 0
  seed_candidates: 1
next_todo_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007   # M7, next after M6
unassigned_queue_depth: 12
state_transitions_applied:
  - {milestone: "M5 (a5232e16)", from: in_progress, to: done, recorded_in_decisions_log: true}
  - {milestone: "M6 (8702a335)", from: todo, to: in_progress, recorded_in_decisions_log: true}
slot_promotion:
  promoted_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
  prior_active_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 8702a335-90ec-40ff-8c7d-a91bb7790a27, reason: decomposition-needed, decision: decomposition-complete, by: milestone-decomposer, fired_at: "2026-07-01"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "M6 first bundle authored — seed d8a85de0 (VoiceModule LiveKit token-mint) + siblings 1dd1f2ca (client join) + 78f51968 (occupancy); ~2200 LOC; commit 901938f", decision: decomposition-complete, by: milestone-decomposer}
task_disposition:
  - {task: 4b397de0, from_milestone: a5232e16, to: unassigned, reason: "assignments controller-spec test hardening — not M5-metric scope"}
  - {task: 6f257c82, from_milestone: a5232e16, to: unassigned, reason: "rowToDto perf refactor — not M5-metric scope"}
  - {task: 3ad35a42, from_milestone: a5232e16, to: unassigned, reason: "optimistic-toggle-revert client polish — not M5-metric scope"}
  - {task: 72cb6ebb, from_milestone: a5232e16, to: unassigned, reason: "stale manage_channels sweep — cross-cutting RBAC debt"}
  - {task: 226c7e42, from_milestone: a5232e16, to: unassigned, reason: "integration-tier hardening — not M5-metric scope"}
  - {task: fdb444fc, from_milestone: a5232e16, to: unassigned, reason: "presence dots — M3-era re-homed debt"}
loop_state: ready
note: "Milestone-closing N-block: M5 COMPLETE (academic tooling), M6 (voice/video) promoted + decomposed. head-next APPROVED N-1."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: "Closure→promotion→decompose cascade correctly sequenced against Invariants #1/#2/#3; M5 scope shipped + metric MET; 6 open non-metric children disposed to unassigned before the done flip; M6 promotion is the N-1-owned mechanical flip of the highest-tier todo (founder-bet product-feature over M7 polish); decomposition returned decomposition-complete."
  next_action: PROCEED_TO_N-2
```
