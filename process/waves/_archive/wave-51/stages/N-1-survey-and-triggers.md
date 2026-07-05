# N-1 — Survey & triggers (wave-51)

Survey signals read from live Postgres (`founder_bets` / `milestones` / `tasks` / `waves`) via SCHEMA.md recipes — no sidecar / bash-var reads.

## Survey phase (Actions 1-4)

- **Active milestone** (Action 1): M8 — Educator tools & deeper academics (`84e17739-af5e-4396-beb9-b6f3d6836fc4`), `in_progress`. Exactly one `in_progress` row — no invariant violation.
- **todo queue** (Action 2): M9-M13 (5 rows) — `3e507bc0` M9 Monetization, `97d65b49` M10 Compliance, `8d88e691` M11 Growth-discovery, `36378340` M12 Offline-first moat, `b7400254` M13 Institution partnerships. `next_todo_id` not needed (active slot occupied).
- **M8 child-task summary** (Action 3): `open=10, done=30, seed_candidates=8` (post-decomposition state — the 3 new focus-room tasks are now queued; only the seed counts toward seed_candidates, so 7 prior stragglers + 1 new focus-room seed = 8).
- **unassigned queue depth** (Action 4): 13.

## Trigger phase (Actions 6-10)

- **Closure check** (Action 6): M8 `open_count=10 > 0` → NO closure. M8 stays `in_progress`. No done-transition. (Premature-milestone-close anti-pattern cannot trigger.)
- **Per-wave decomposition** (Action 7): FIRED this N-block (orchestrator-driven, automatic mode) via `milestone-decomposer` sub-agent — always inline. Target M8. Reason: `pivot-to-directed-headline` — the ceo-reviewer BOARD seat flagged the joinable focus-room in BOTH wave-50 and wave-51 P-0. Ritual returned `decomposition-complete`; one bundle authored (commit `d2bd9d0`):
  - SEED `d123d9e0-bdcd-4815-91c5-ac90b6852997` — "Add joinable focus-room surface + ephemeral join-presence backend" (`parent_task_id IS NULL`)
  - sibling `aad849ac-3273-4a11-ad05-8efef1c5da87` — "Build focus-room UI: open-rooms list, join/leave, who-is-focusing roster" (`parent = seed`)
  - sibling `ef84b378-df1d-4bf1-b669-6624d210170f` — "Scope the shared study timer to the focus room (per-room synchronized Pomodoro)" (`parent = seed`)
  Presence-only slice-1 (~2200 LOC); voice/LiveKit + whiteboard deferred. Rides the shipped study-timer substrate. Decomposer flagged `ef84b378` as the P-1 split point.
- **Slot promotion + stockout** (Action 8): active milestone present (M8) → no promotion. todo queue full (M9-M13) → no stockout cascade, no roadmap-planning.
- **Daily-checkpoint** (Action 9): seed candidate present (decomposition produced one) → does not fire.
- **Route per mode** (Action 10): mode `automatic`. Decomposition → `milestone-decomposer` sub-agent (inline). Applied: one bundle INSERTed under M8 (`milestone_id=M8`, seed `parent_task_id IS NULL`, siblings `parent_task_id=seed.id`, all `wave_id=NULL`, all `status='todo'`). Decision logged to `command-center/product/product-decisions.md`.

Also still open under M8: 7 DM-polish stragglers (prior-slice V-2 debt, deliberately un-seeded across waves 45-49). They stay queued (`wave_id NULL`, seedable) — NOT seeded this handoff.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4 (M8, in_progress)"
  - "todo queue head: M9-M13 present (no stockout)"
  - "active child tasks: open=10 done=30 seed_candidates=8"
  - "unassigned queue depth: 13"
  - "closure: none (M8 open=10 > 0)"
  - "promotion: none (active slot occupied)"
  - "decomposition fired: true (focus-room bundle, commit d2bd9d0)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 51
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 10
  done: 30
  seed_candidates: 8
next_todo_id: null
unassigned_queue_depth: 13
state_transitions_applied:
  []
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4, reason: pivot-to-directed-headline, decision: fired-inline, by: milestone-decomposer, fired_at: "2026-07-05"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "one focus-room bundle authored under M8 (seed d123d9e0 + siblings aad849ac, ef84b378); commit d2bd9d0", decision: decomposition-complete, by: milestone-decomposer}
loop_state: ready
note: "head-next N-1 signoff APPROVED. 7 M8 DM-polish stragglers stay un-seeded (prior-slice debt, seedable)."
```
