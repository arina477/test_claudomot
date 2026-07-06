# N-1 — Survey & triggers (wave-68)

Block: N (Next), 8th of 8. head-next owns the block. Mode: automatic. STATUS: RUNNING.

## Survey phase (Actions 1–4)

**Action 1 — Active milestone:** zero rows in `status='in_progress'` at N-1 entry. M11 (8d88e691, Growth: server discovery) was transitioned `in_progress → done` at wave-68 **L-1** via BOARD 7/7 APPROVE (slug L-1-roadmap-delta-wave-68) — already applied before N-block. Active slot therefore **empty** on N-1 entry → routes to Action 8 slot-promotion.

**Action 2 — `todo` queue:** M9 (Monetization: freemium tiers), M10 (Compliance & data rights), M13 (Institution partnerships & portable identity). All three are founder-reserved / founder-heavy themes (pricing, compliance regime, institutional deals). `next_todo_id` by mechanical age = M9; but see Action 8 — LLM tier judgment authored + promoted a higher-tier BOARD-mandated milestone over the founder-reserved queue.

**Action 3 — M11 child-task summary (the just-closed milestone):** open=0, done=4, seed_candidates=0. All 4 M11 children terminal (609c9bdd/37b78777/e363dac2 wave-67 read-half; 2bd37c4c wave-68 write-half). Confirms the L-1 closure was valid (closure invariant: all children terminal + LLM scope-shipped).

**Action 4 — Unassigned queue depth:** 16 (`status='todo' AND milestone_id IS NULL`). Includes dc4abee3 (role_id RBAC default on public/invite join), f51ace12 (AA-convergence buttons), and 14 other prior-wave follow-ups. Non-zero — informs Action 9 checkpoint evaluation only.

## Trigger phase (Actions 6–10)

**Action 6 — Closure check:** M11 already `done` (applied at L-1 by BOARD, not re-applied here). No N-1 closure transition needed. `active_milestone = null` at entry to Action 8.

**Action 8a — Slot promotion (the roadmap decision):** active slot empty. The mechanical Action-8a path ("promote highest-tier existing `todo`") would promote a founder-reserved theme (M9/M10/M13). Instead, applied the **standing wave-68 L-1 BOARD 7/7 endorsement** (slug L-1-roadmap-delta-wave-68), whose unanimous carry (all seven dissent-notes agreeing) was: *moderation MUST be authored as a real queued `status='todo'` milestone AND MUST gate any actual public launch of the directory*, and which explicitly directed N-1 to give moderation a milestone home.

- **Authored** M14 — Trust & Safety: moderation for public discovery (id `6a9424fe-c943-4b26-9110-6915661a6fb9`), `status='todo'`, full prose (Class product-feature / Tier T1 / Horizon H1 / bet_id = live "win students from Discord" bet / Depends on M11). This is a targeted single-milestone authoring under the standing endorsement — NOT the full heavyweight roadmap-planning ritual (competitive sweep ×3 + trend scan + fresh /plan-ceo-review + fresh checkpoint), which would re-litigate the already-decided 7/7 call (board-process anti-pattern #1; this project's repeated precedent-application pattern, wave-24/53/65/66/67).
- **Promoted** M14 `todo → in_progress`. Single-active invariant verified (in_progress count = 1). Prior active (M11) is `done`.
- **Tier judgment (Action 2):** M14 outranks M9/M10/M13 — it is the launch-gating safety completion of the just-shipped M11 growth surface (product-feature, mvp-critical), while M9/M10/M13 are founder-reserved themes. Founder delegated the theme pick at the M12→M11 transition and can redirect.

**Action 8b — Stockout cascade:** NOT fired. `todo` milestones exist (M9/M10/M13), so this was never a `milestone-stockout` — it was an empty-active-slot promotion resolved via the standing BOARD endorsement.

**Action 7 — Per-wave decomposition (re-evaluated against the newly-promoted M14):** M14 active, seed_candidates=0 (freshly promoted, zero child tasks), scope NOT shipped → fired milestone-decomposition, reason `decomposition-needed`, caller mode `next-bundle`. Under automatic mode, spawned the `milestone-decomposer` sub-agent inline (brain single-threaded). Returned `decomposition-complete`: 1 seed + 2 siblings under M14 (see N-2 deliverable).

**Action 9 — Daily-checkpoint:** NOT fired. Decomposition fired this tick and produced a seed candidate (Action 9 precondition "no seed candidate after decomposition" is false). Queue depth > 0 alone does not fire a checkpoint when a bundle was just authored.

**Action 10 — Routing:** roadmap authoring → applied standing L-1 BOARD 7/7 precedent (do-not-re-litigate; no fresh `N-1-roadmap-planning-wave-68` BOARD convened). Decomposition → `milestone-decomposer` sub-agent, inline. Both outcomes recorded in `command-center/product/product-decisions.md`.

## head-next stage-exit gate (N-1)

- [x] Next-claimable computed from live `tasks`/`milestones` tables (Postgres), not a sidecar — verified via SQL this turn.
- [x] Exactly one promotion + one decomposition trigger selected, firing conditions cited.
- [x] Active slot was empty; resolved via promotion (not left null), so no stranded loop.
- [x] Active milestone's queue had no seed candidate AND scope unshipped → decomposition fired (Action 7).
- [x] A `todo` milestone did exist → no roadmap-stockout planning fired; the moderation authoring was BOARD-precedent-driven, not stockout.
- [x] No preemptive pause — no rule-13 (b/d/e/f) measured trigger; anticipatory pause on the founder-reserved-priority framing would be forbidden.

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Survey read live Postgres state (M11 done, 0 in_progress at entry, todo queue M9/M10/M13,
    unassigned depth 16). Active slot empty resolved by authoring + promoting M14 (moderation
    for public discovery) under the standing wave-68 L-1 BOARD 7/7 endorsement (slug
    L-1-roadmap-delta-wave-68) that mandated moderation as a real queued milestone gating public
    launch — applied as do-not-re-litigate precedent rather than convening a fresh BOARD. M14
    outranks the founder-reserved todo themes as the launch-gating completion of the just-shipped
    M11 surface. Decomposition fired inline via milestone-decomposer, producing a validated
    1-seed + 2-sibling bundle. No measured pause trigger — loop continues.
  next_action: PROCEED_TO_N-2

n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone at entry: null (M11 8d88e691 closed at L-1 via BOARD 7/7)"
  - "todo queue head: M9/M10/M13 (all founder-reserved) — superseded by authored M14"
  - "active child tasks (M11): open=0 done=4 seed_candidates=0"
  - "unassigned queue depth: 16"
  - "closure: none at N-1 (M11 in_progress->done already applied at L-1)"
  - "promotion: 6a9424fe (M14) todo->in_progress (single-active invariant verified)"
  - "decomposition fired: true (M14 first bundle: seed 9f2bb017 + 2 siblings)"
  - "rituals fired: [roadmap-authoring (L-1 BOARD 7/7 precedent, no fresh BOARD), milestone-decomposition (milestone-decomposer inline)]"
prev_wave: 68
active_milestone_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
active_milestone_child_summary:
  open: 3
  done: 0
  seed_candidates: 1
next_todo_id: null
unassigned_queue_depth: 16
state_transitions_applied:
  - {milestone: "M11 (8d88e691)", from: in_progress, to: done, recorded_in_decisions_log: true, note: "applied at L-1 via BOARD 7/7; recorded again in N-1 log for the transition snapshot"}
  - {milestone: "M14 (6a9424fe)", from: "(new)", to: todo, recorded_in_decisions_log: true}
  - {milestone: "M14 (6a9424fe)", from: todo, to: in_progress, recorded_in_decisions_log: true}
slot_promotion:
  promoted_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
  prior_active_id: null
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 6a9424fe-c943-4b26-9110-6915661a6fb9, reason: decomposition-needed, decision: fired-inline, by: milestone-decomposer, fired_at: "2026-07-06"}
  - {ritual: roadmap-authoring, reason: "L-1 BOARD 7/7 moderation-milestone mandate", decision: "precedent-application (no fresh BOARD)", by: head-next, fired_at: "2026-07-06"}
ritual_outcomes:
  - {ritual: roadmap-authoring, outcome_summary: "M14 authored (todo) + promoted (in_progress)", decision: applied, by: head-next}
  - {ritual: milestone-decomposition, outcome_summary: "decomposition-complete: seed 9f2bb017 + siblings d7250881, 96d5ed58 (~2800 LOC)", decision: applied, by: milestone-decomposer}
loop_state: ready
note: "Active slot empty after M11 close resolved by authoring+promoting M14 under standing L-1 BOARD 7/7 endorsement. No preemptive pause (rule 13)."
```

## Next
→ N-2 (seed the M14 first bundle).
