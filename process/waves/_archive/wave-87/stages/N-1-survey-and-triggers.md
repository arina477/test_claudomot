# N-1 — Survey & triggers (wave-87)

Mode: automatic. STATUS: RUNNING. Founder standing directive (2026-07-09): bug-fix phase — roadmap-planning FOUNDER-DEFERRED; each wave pulls the next high-value item from the improvement backlog.

## Survey signals (Actions 1–4)

- **Active milestone (Action 1):** none. `SELECT ... WHERE status='in_progress'` → 0 rows. Roadmap complete (all 14 milestones `done`, since wave-80/M13).
- **Todo queue (Action 2):** empty. `SELECT ... WHERE status='todo'` → 0 rows. `next_todo_id = null`.
- **Active child summary (Action 3):** N/A — no active milestone. open=0 done=0 seed_candidates=0 (vacuously; no milestone to scope).
- **Unassigned queue depth (Action 4):** 33 top-level `todo` seeds with `milestone_id IS NULL` (bug-fix improvement backlog). Non-zero → next-claimable is NOT null.

## Trigger evaluation (Actions 6–10)

- **Action 6 — closure check:** N/A. No active milestone to close.
- **Action 7 — per-wave decomposition:** N/A. No active milestone to decompose.
- **Action 8 — slot promotion + stockout cascade:** `active_milestone == null` AND `next_todo_id == null` → this is milestone-stockout. Under automatic mode this would normally route roadmap-planning to BOARD (slug `N-1-roadmap-planning-wave-87`). **SUPPRESSED** per the founder's standing bug-fix-phase ruling (recorded across waves 81–87 in `command-center/product/product-decisions.md`). No BOARD convened; founder already ruled. Pipeline does not stall — the improvement backlog feeds the N-2 seed.
- **Action 9 — daily-checkpoint:** does NOT fire. Fires only when next-claimable is null AND unassigned queue has rows. The backlog has 33 claimable seeds → next-claimable is NOT null → condition unmet.
- **Action 10 — routing:** no ritual proposals fired; nothing to route.

**Net: no rituals fired this wave.**

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: null"
  - "todo queue head: null"
  - "active child tasks: open=0 done=0 seed_candidates=0 (no active milestone)"
  - "unassigned queue depth: 33"
  - "closure: none"
  - "promotion: none"
  - "decomposition fired: false"
  - "rituals fired: [] (roadmap-planning stockout SUPPRESSED per founder bug-fix-phase deferral)"
prev_wave: 87
active_milestone_id: null
active_milestone_child_summary:
  open: 0
  done: 0
  seed_candidates: 0
next_todo_id: null
unassigned_queue_depth: 33
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: false
proposals_fired:
  - {ritual: roadmap-planning, reason: milestone-stockout, decision: SUPPRESSED-founder-already-ruled, by: founder-standing-directive, fired_at: null}
ritual_outcomes:
  - {ritual: roadmap-planning, outcome_summary: "stockout suppressed — founder bug-fix-phase deferral in effect; backlog feeds N-2 seed; no BOARD convened", decision: SUPPRESSED, by: founder-standing-directive}
loop_state: ready
note: "Roadmap complete (14/14 done). Bug-fix phase: N-2 pulls next high-value live bug from the 33-item improvement backlog."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (33 unassigned seeds), not a sidecar.
    Exactly one state path selected (stockout) with its firing condition cited; roadmap-planning
    correctly SUPPRESSED under the founder's standing bug-fix-phase deferral rather than routed to
    BOARD, matching waves 81–86. Daily-checkpoint correctly does NOT fire (next-claimable non-null).
    No invariant violations (at most one in_progress milestone — there are zero). Pipeline flows via
    the backlog seed, not a stalled ritual.
  next_action: PROCEED_TO_N-2
```
