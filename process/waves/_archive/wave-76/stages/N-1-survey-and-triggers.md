# N-1 — Survey & triggers (wave-76)

**Block:** N (Next) · **Stage:** N-1 · **Mode:** automatic · **Owner:** head-next
**Date:** 2026-07-07

## Survey phase (Actions 1–4) — canonical state read from Postgres

- **Action 1 — active milestone:** `M13 — Institution partnerships & portable identity` (`b7400254-9c16-4b97-a898-2619b949fc5e`), `status='in_progress'`. Exactly one `in_progress` row — invariant holds.
- **Action 2 — todo queue:** 0 rows. `next_todo_id = null`. No `todo` milestone exists (all 13 others `done`; M13 the only `in_progress`).
- **Action 3 — M13 child-task summary:** `open_count=0`, `done_count=4`, `seed_candidates=0`. The four wave-76 tasks (educator admin console + analytics — leg-1) are all `done`.
- **Action 4 — unassigned queue depth:** 26.
- Current running wave: `wave-76` (`7df4fb16-…`, `milestone_id=b7400254`).

## Trigger phase (Actions 6–10)

### Action 6 — Closure check → NO CLOSURE
`active_milestone` exists AND `open_count=0`, so the closure gate is *considered* — but LLM-judged scope is **NOT shipped**. M13's `## Scope` names four items and its `## Approach` (set 2026-07-07) explicitly sequences **three autonomous engineering legs**: (1) educator admin console + analytics, (2) cross-server portable academic identity, (3) richer privacy/E2E posture. Only **leg-1 shipped** (the 4 done tasks, merge d8d4d9e6 / PR #95, V-block APPROVED, T-8 authz matrix proven). Legs 2 and 3 remain. Per roadmap-lifecycle Invariant 3, closure is strict and requires scope-shipped — not met. **M13 stays `in_progress`.** Fall through to Action 7.

### Action 7 — Per-wave decomposition → FIRED
`active_milestone` exists AND `seed_candidates=0` AND scope NOT shipped → fired milestone-decomposition, reason `decomposition-needed`, caller mode `next-bundle`, against M13. Under `automatic` mode (Action 10 routing), spawned the `milestone-decomposer` sub-agent **inline**. Target: **leg-2 = cross-server portable academic identity** — the Approach-ordered next autonomous slice on the shipped M9 + leg-1 substrate. No founder credentials required (mirrors how M9 shipped its substrate + mock flow before real billing), so the loop continues RUNNING — no founder-reserved pause.

Guard passed to the decomposer: M13's `## Success metric` reads `_TBD by founder_` because it is **deliberately fenced** (founder-reserved), NOT an authoring gap. Leg-1 already shipped a coherent bundle under the same `_TBD_` metric; the `## Approach` + `## Scope` are the authoritative anchor. The decomposer honored this — did not trip `incomplete-scope`.

**Bundle authored (verified in DB):** 1 seed + 3 siblings, all `milestone_id=b7400254`, `wave_id=NULL`, `status='todo'`, correctly parented (`seed_candidates` recomputed = 1).
- **Seed** `10a68f9e-047d-4f1d-b42e-aa5c73996dfe` — Add portable academic-identity fields to the user profile model + self API
- **Sib** `a51e281d-3c3a-42d0-9e9d-eb4a3eff61cb` — Extend @studyhall/shared profile contract with academic-identity + public-profile shapes
- **Sib** `bf0ad2a8-93d2-4234-afa5-397fe802af73` — Cross-server public profile-view endpoint honoring profile_visibility
- **Sib** `a98286cb-7cc9-4381-9c2f-ba5db3723af5` — Academic-identity editor + cross-server member profile card (web)
- Estimate ~2,500 LOC (range 2,000–3,000), ≤40 files. UI wave — expect a D-block profile-card gap.
- Sequencing: seed (schema) → sib1 (shared contract) → sib2 (endpoint) → sib3 (web). No sibling depends on an unbuilt later sibling; all depend on the seed. No intra-bundle blocker.
- Decision-log entry appended + committed (`cf44006`) by the ritual.

### Action 8 — Slot promotion + stockout cascade → NOT APPLICABLE
`active_milestone != null` (M13 stays active; not closed). No promotion. No stockout cascade this tick (the active slot is filled). Note for a future N-1: with `todo` queue = 0, if M13 ever closes, N-1 Action 8b will fire roadmap-planning (`milestone-stockout`) before it can promote.

### Action 9 — Daily-checkpoint → NOT FIRED
Requires "no seed candidate AND decomposition not fired". Decomposition **was** fired and returned `decomposition-complete` (seed candidate now exists). Checkpoint condition not met.

### Action 10 — Routing → APPLIED
Milestone-decomposition routed under `automatic` mode = spawn `milestone-decomposer` sub-agent (inline). Applied.

## head-next signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable state read live from Postgres (not a sidecar). Exactly one trigger fired
    — per-wave milestone-decomposition (Action 7), condition cited: M13 in_progress + seed_candidates=0
    + scope-not-shipped (only leg-1 of 3 autonomous Approach legs done). Closure correctly withheld
    (premature-close avoided: 2 of 3 legs remain). No pause written — leg-2 is autonomous engineering,
    no measured pause trigger (b/d/e/f) fired; preemptive pausing avoided. Bundle validated in DB:
    1 seed (parent_task_id IS NULL) + 3 siblings (parent_task_id = seed.id), all milestone_id=M13,
    wave_id=NULL, status=todo, dependency-sequenced, authored via the decomposer ritual (not hand-INSERTed).
    Loop continues to wave-77 on M13 leg-2.
  next_action: PROCEED_TO_N-2
```

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: b7400254-9c16-4b97-a898-2619b949fc5e (M13, in_progress)"
  - "todo queue head: null (0 todo milestones)"
  - "active child tasks: open=0 done=4 seed_candidates=0 (pre-decomposition)"
  - "unassigned queue depth: 26"
  - "closure: none (M13 scope NOT shipped — only leg-1 of 3 autonomous legs done)"
  - "promotion: none (active slot filled by M13)"
  - "decomposition fired: true (leg-2 bundle: 1 seed + 3 siblings)"
  - "rituals fired: [milestone-decomposition]"
  - "post-decomposition seed_candidates recomputed: 1"
prev_wave: 76
active_milestone_id: b7400254-9c16-4b97-a898-2619b949fc5e
active_milestone_child_summary:
  open: 0
  done: 4
  seed_candidates: 0        # pre-decomposition survey read; post-fire = 1
next_todo_id: null
unassigned_queue_depth: 26
state_transitions_applied: []   # no milestone status flip; M13 stays in_progress
slot_promotion:
  promoted_id: null
  prior_active_id: b7400254-9c16-4b97-a898-2619b949fc5e
decomposition_fired: true
proposals_fired:
  - ritual: milestone-decomposition
    target_milestone: b7400254-9c16-4b97-a898-2619b949fc5e
    reason: decomposition-needed
    caller_mode: next-bundle
    decision: fired-and-complete
    by: milestone-decomposer (sub-agent, inline, automatic mode)
    fired_at: 2026-07-07
ritual_outcomes:
  - ritual: milestone-decomposition
    outcome_summary: >
      decomposition-complete — leg-2 cross-server portable academic identity bundle:
      seed 10a68f9e (portable identity fields + self API) + 3 siblings
      (a51e281d shared contract, bf0ad2a8 cross-server profile-view endpoint, a98286cb web editor+card).
      ~2,500 LOC, ≤40 files. All milestone_id=M13, wave_id=NULL, status=todo, seed parent NULL, siblings→seed.
      Decision-log committed cf44006. Fenced (untouched): B2B2C go-to-market + _TBD_ success metric.
    decision: fired-and-complete
    by: milestone-decomposer
decomposed_bundle:
  seed_task_id: 10a68f9e-047d-4f1d-b42e-aa5c73996dfe
  sibling_task_ids:
    - a51e281d-3c3a-42d0-9e9d-eb4a3eff61cb
    - bf0ad2a8-93d2-4234-afa5-397fe802af73
    - a98286cb-7cc9-4381-9c2f-ba5db3723af5
  claimed_task_ids:
    - 10a68f9e-047d-4f1d-b42e-aa5c73996dfe
    - a51e281d-3c3a-42d0-9e9d-eb4a3eff61cb
    - bf0ad2a8-93d2-4234-afa5-397fe802af73
    - a98286cb-7cc9-4381-9c2f-ba5db3723af5
loop_state: ready
note: >
  M13 stays in_progress (leg-2 of 3 autonomous Approach legs seeded; leg-3 privacy/E2E remains). No pause:
  leg-2 is autonomous engineering, zero measured pause triggers (b/d/e/f). No todo milestone exists, so if
  M13 later closes, the next N-1 must fire roadmap-planning (milestone-stockout) before promoting. N-2 will
  pick seed 10a68f9e + its 3 siblings; N-3 archives wave-76 and opens wave-77 P-0 on M13 leg-2. Orchestrator
  coordinates N-2/N-3 — not run here.
```
