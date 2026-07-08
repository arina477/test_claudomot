# N-1 — Survey & triggers (wave-79)

Mode: automatic. head-next spawned for N-block lifetime (ACK received).

## Survey signals (Actions 1–4, verified against DB)

| Signal | Value | Source query |
|---|---|---|
| Active milestone (Action 1) | M13 `b7400254-9c16-4b97-a898-2619b949fc5e` — "Institution partnerships & portable identity", `in_progress` | `SELECT ... WHERE status='in_progress'` → 1 row |
| `todo` milestone queue (Action 2) | 0 rows → `next_todo_id = null` | `SELECT ... WHERE status='todo'` → 0 rows |
| M13 child summary (Action 3) | open=1, done=13, seed_candidates=1 | count() FILTER over `tasks WHERE milestone_id=M13` |
| Unassigned queue depth (Action 4) | 31 | `count(*) WHERE status='todo' AND milestone_id IS NULL` |

The 1 open M13 seed candidate: `3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1` — "Add read-receipt and presence privacy controls to settings" (leg-3b; parent_task_id NULL, wave_id NULL, status=todo). Verified present.

Unassigned queue includes the 3 wave-79 V-2 follow-ups (0e58af8e auth-guard-race, 1f48f4db server-senderKeyRef-validation, ae1c82a5 header-indicator-polish).

## Trigger phase (Actions 6–10)

- **Action 6 — Closure check:** M13 open_count=1 ≠ 0 → NO close. Leg-3b (read-receipt/presence privacy controls) is unbuilt. M13 stays `in_progress`. No transition.
- **Action 7 — Per-wave decomposition:** seed_candidates=1 > 0 → decomposition does NOT fire. Work the existing seed first; milestone-decomposer NOT spawned.
- **Action 8 — Slot promotion + stockout:** active_milestone ≠ null → no promotion, no stockout cascade.
- **Action 9 — Daily-checkpoint:** a seed candidate exists (Action 7 did not find zero) → daily-checkpoint does NOT fire.
- **Action 10 — Routing:** no proposals fired; nothing to route.

Net: no rituals fire this tick. No milestone state change → no product-decisions.md append required.

## Forward flag for the NEXT N-block cycle

After leg-3b (`3038a4bc`) ships, M13 will reach open=0 with only founder-reserved scope remaining (B2B2C go-to-market, _TBD_ success metric, identity verification). That is a genuine milestone-disposition JUDGMENT CALL — under `automatic` mode it routes to BOARD at that next N-1 (`todo` milestone queue is currently EMPTY, so a `done` transition would additionally trigger roadmap-planning stockout cascade). The next N-block should expect this.

## Deliverable footer

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: b7400254-9c16-4b97-a898-2619b949fc5e (M13, in_progress)"
  - "todo queue head: null"
  - "active child tasks: open=1 done=13 seed_candidates=1"
  - "unassigned queue depth: 31"
  - "closure: none"
  - "promotion: none"
  - "decomposition fired: false"
  - "rituals fired: []"
prev_wave: 79
active_milestone_id: b7400254-9c16-4b97-a898-2619b949fc5e
active_milestone_child_summary:
  open: 1
  done: 13
  seed_candidates: 1
next_todo_id: null
unassigned_queue_depth: 31
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: b7400254-9c16-4b97-a898-2619b949fc5e
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "No rituals fire. M13 stays in_progress (leg-3b unbuilt). FLAG: after leg-3b ships, M13 hits open=0 with only founder-reserved scope → milestone-disposition JUDGMENT CALL routes to BOARD at next N-1 (+ roadmap-planning stockout, todo queue empty)."
```
