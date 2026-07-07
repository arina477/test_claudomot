# N-2 — Seed (wave-71)

## Outcome: queue-exhausted-pending-founder — NO seed

N-1 emitted `loop_state: paused` on a founder-reserved fork. There is **no seedable next bundle** WITHOUT the founder-reserved decision:

- **No active milestone** (`active_milestone = null`) → no milestone under which a seed could carry `milestone_id = $active`, `wave_id = NULL`, `status = 'todo'`.
- **No seed candidate exists** — a next wave's seed must belong to an active milestone's bundle (authored by the milestone-decomposer ritual), and no milestone is active. Decomposition cannot fire against a null milestone.
- **The unassigned queue (18 rows)** is NOT a valid autonomous seed source here: promoting a strategic theme (which would give those tasks a milestone home) is the very founder-reserved decision the loop is paused on. Seeding from the unassigned queue now would pre-empt the founder's theme pick.

Per N-3 Action 1, this satisfies the pause condition: "N-2 emitted `queue_exhausted: true` AND no ritual is in-flight that will produce work." No decomposition or roadmap-planning is in flight (none is warranted — 3 todo milestones exist; the block is a promotion-authority gate, not a stockout).

The next wave's seed will be determined by the founder's answer, resolved via `.loop-resume.yaml` at the active mode's § Resume protocol (`choice.kind`: `milestone` → promote the picked theme then decompose; or `drain-queue` → P-0 walks the unassigned queue; or `directive` → founder-direct).

```yaml
n_stage_verdict: COMPLETE
queue_exhausted: true
seed_task_id: null
bundled_sibling_ids: []
claimed_task_ids: []
active_milestone_id: null
reason: >
  Founder-reserved fork (N-1). No active milestone → no decomposition target → no seedable bundle.
  Unassigned queue (18) not seedable without the founder-reserved strategic-theme promotion.
loop_state: paused
note: "queue-exhausted-pending-founder — next seed set by founder's theme/launch answer via .loop-resume.yaml"
```
