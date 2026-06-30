# N-1 — Survey & triggers (wave-21)

The milestone transition wave: M4 (the offline-first WEDGE) closed; M5 (academic tooling: assignments) activated; M5 first bundle decomposed.

## Survey signals (Actions 1–4)

- **Active milestone (Action 1):** M4 — Offline-first reliability (the wedge) `eb2a1688-c6b5-416c-84b4-3ede41d07b4c`, `status=in_progress`. Exactly one in_progress row (invariant intact).
- **`todo` queue head (Action 2):** M5 — Academic tooling: assignments `a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d` (next-sequential by roadmap order; 10 todo milestones M5–M13 → roadmap-planning NOT needed).
- **M4 child census (Action 3):** open=6, done=7, seed_candidates=5 (5 top-level open; 1 of the 6 open was a sibling). All 7 done = the full M4 `## Scope`. All 6 open = re-homed M3/M4 messaging/presence tech-debt (NOT offline-first scope).
- **Unassigned queue depth (Action 4):** 2.

## Trigger phase (Actions 6–10)

### Action 6 — M4 closure check → CLOSED (in_progress → done)
LLM scope-shipped judgment: M4 `## Scope` (IndexedDB store + cached reads + idempotency/replay-safe POST + outbox/optimistic-send + multi-page ?after= catch-up + live connection-state indicator + pending/failed UI + composer-offline + heavily tested) is FULLY shipped across the 7 done children, and the `## Success metric` (lose connectivity → keep reading/composing → reconnect exactly-once in-order, NO data loss) is FULLY MET (confirmed by L-1 + jenny + V-3 across waves 20–21). The 6 open children are re-homed M3/M4 tech-debt, NOT M4 scope — disposed (re-homed to M5) BEFORE closure so Invariant #3 (all children terminal) holds. `UPDATE milestones SET status='done' WHERE id='eb2a1688...'`. Recorded in product-decisions.md.

**Tech-debt disposition (roadmap-lifecycle Invariant #3 + wave-19 precedent):** the 6 open children re-homed to M5 as independent top-level backlog (`milestone_id=M5`, `parent_task_id=NULL`, `wave_id=NULL`, `status=todo`): d058283d (invite-rotation), 10b9d18e (presence-dots — was a sibling, parent nulled), 6a546c7b (presence-perf), 02fa8011 (real-PG test tier), d23a0740 (presence-debt), c18b8089 (mention-parity). Carrying under a closed milestone is illegal; canceling discards real work; re-home is lifecycle-correct.

### Action 8 — Slot promotion → M5 ACTIVATED (todo → in_progress)
Active slot emptied by Action 6 closure. `next_todo_id` = M5 (a5232e16), highest-priority next-sequential. Promoted `todo → in_progress`. Roadmap-following — no scope change, no BOARD/founder. Recorded in product-decisions.md. No stockout cascade (todo queue non-empty: M6–M13 remain).

### Action 7 — Per-wave decomposition → FIRED (decomposition-complete)
M5 just activated with zero *assignments-feature* children (the 6 re-homed debt rows are independent backlog, NOT feature scope; M5 assignments `## Scope` wholly unshipped, zero done assignments tasks). Fired milestone-decomposition (reason `decomposition-needed`, caller `next-bundle`) via `milestone-decomposer` sub-agent (automatic mode → spawn, inline). Returned `decomposition-complete`: 1 seed + 2 siblings (~2,800 net LOC, files <60). Carries encoded in task prose: PRODUCT-PRINCIPLES rule 1 (verify premises vs codebase), design_gap likely TRUE (new assignments-panel page + assignment-card primitive → D-block next wave), Resend SDK = P-0 SDK-research item (reminder arc deferred to a later M5 bundle).

### Action 9 — Daily-checkpoint → NOT fired
Seed candidate exists after decomposition (Action 7 succeeded); daily-checkpoint precondition (no seed candidate) not met. No fire.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: eb2a1688-c6b5-416c-84b4-3ede41d07b4c (M4) → done"
  - "todo queue head: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d (M5)"
  - "active child tasks: open=6 done=7 seed_candidates=5"
  - "unassigned queue depth: 2"
  - "closure: M4 in_progress→done (scope-met mechanical, 7/7 ## Scope shipped, ## Success metric met)"
  - "tech-debt disposition: 6 open M4 children re-homed to M5 (independent top-level backlog)"
  - "promotion: a5232e16 (M5) todo→in_progress"
  - "decomposition fired: true (decomposition-complete — seed 01fcefb8 + 2 siblings)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 21
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_child_summary:
  open: 9          # 6 re-homed debt + 3 freshly-authored assignments bundle
  done: 0
  seed_candidates: 7   # 6 debt rows + 1 assignments seed (N-2 selects assignments explicitly)
next_todo_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27   # M6 (next after M5 promoted)
unassigned_queue_depth: 2
state_transitions_applied:
  - {milestone: "M4 (eb2a1688)", from: in_progress, to: done, recorded_in_decisions_log: true}
  - {milestone: "M5 (a5232e16)", from: todo, to: in_progress, recorded_in_decisions_log: true}
slot_promotion:
  promoted_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
  prior_active_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d, reason: decomposition-needed, decision: decomposition-complete, by: milestone-decomposer, fired_at: 2026-06-30}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "1 seed (assignments CRUD spine) + 2 siblings (panel/card page; integration+E2E tests), ~2800 LOC; reminder arc deferred to later M5 bundle", decision: decomposition-complete, by: milestone-decomposer}
loop_state: ready
note: "M4 WEDGE chapter (waves 20-21) closed; M5 academic-tooling chapter opened. N-2 must select assignments seed 01fcefb8 explicitly (newest of 7 candidates; oldest-first would surface re-homed debt) — N-2 Action 1 LLM re-order authority."
```

## Exit criteria
- [x] All survey signals captured (Actions 1–4).
- [x] No invariant violations (1 in_progress before + after).
- [x] Closure check applied (Action 6 — M4 closed; tech-debt disposed first).
- [x] Per-wave decomposition fired (Action 7 — decomposition-complete).
- [x] Promotion applied (Action 8 — M5 activated); no stockout.
- [x] Daily-checkpoint evaluated (Action 9 — not fired); ritual routed per automatic mode.
- [x] Outcomes captured.
- [x] `n_stage_verdict: COMPLETE`.

## head_signoff
```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks/milestones tables (never a sidecar). Exactly one trigger
    ladder walked: M4 scope-met closure (7/7 ## Scope shipped + ## Success metric met, all 6 non-scope
    children re-homed first to satisfy Invariant #3), M5 slot promotion (next-sequential, no scope change),
    and per-wave decomposition fired (decomposition-complete) so a seed exists. No premature close (every M4
    AC shipped), no out-of-ritual INSERT (bundle authored by milestone-decomposer), no pipeline stall
    (decomposition produced the next seed). Tech-debt disposed lifecycle-correctly per the wave-19 precedent.
  next_action: PROCEED_TO_N-2
```
