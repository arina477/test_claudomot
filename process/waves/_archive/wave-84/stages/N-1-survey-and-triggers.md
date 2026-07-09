# N-1 — Survey & triggers (wave-84)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: null (0 rows in status IN ('in_progress','todo'))"
  - "todo queue head: null (roadmap COMPLETE — all 14 milestones done since wave-80/M13)"
  - "active child tasks: n/a (no active milestone)"
  - "unassigned queue depth: 34 (seedable subset: 33 with parent_task_id IS NULL, wave_id IS NULL)"
  - "closure: none (no active milestone to close; M13 closed properly at wave-80)"
  - "promotion: none (no todo milestone to promote)"
  - "decomposition fired: false (no active milestone; N/A)"
  - "rituals fired: [] (roadmap-planning FOUNDER-DEFERRED; daily-checkpoint not triggered — next-claimable non-null)"
prev_wave: 84
active_milestone_id: null
active_milestone_child_summary:
  open: 0
  done: 0
  seed_candidates: 0
next_todo_id: null
unassigned_queue_depth: 34
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: >
  Mode: automatic. Founder BUG-FIX PHASE — roadmap-planning FOUNDER-DEFERRED, so the N-1
  stockout auto-trigger is overridden per always-on rule 9 (founder deferral beats auto-fire).
  head-next confirmed this on first pass and, after reconciliation against canonical Postgres
  state, upheld it: roadmap is COMPLETE (14/14 milestones done since wave-80), NOT a mid-roadmap
  stockout. Milestone state machine is intentionally dormant this phase. Daily-checkpoint NOT
  fired (its condition is next-claimable IS NULL; the seedable queue is 33-deep so next-claimable
  is non-null). NO rituals fire. NO measured pause condition (STATUS RUNNING, no .loop-paused.yaml,
  no .loop-resume.yaml, no founder message, no hard-stop). head-next (agentId ada5c574a9ed85f8c)
  owns the N-block for wave-84.
```

## Survey signals (Actions 1–4)

| Signal | Value | Query |
|---|---|---|
| Active milestone (Action 1) | none | `WHERE status='in_progress'` → 0 rows |
| todo queue (Action 2) | empty | `WHERE status='todo'` (milestones) → 0 rows |
| Active child summary (Action 3) | n/a | no active milestone_id to bind |
| Unassigned queue depth (Action 4) | 34 | `WHERE status='todo' AND milestone_id IS NULL` |
| Seedable queue (subset) | 33 | `+ parent_task_id IS NULL AND wave_id IS NULL` |
| Current wave row | wave-84 `running` | `WHERE status='running'` |

## Trigger evaluation (Actions 6–10)

- **Action 6 Closure** — no active milestone; no-op.
- **Action 7 Decomposition** — no active milestone; N/A.
- **Action 8 Promotion / stockout** — `active_milestone == null` AND `next_todo_id == null`. Default rule would fire roadmap-planning (milestone-stockout). OVERRIDDEN by founder BUG-FIX PHASE deferral (rule 9). Roadmap is COMPLETE (not stocked-out mid-stream); re-planning is founder-deferred. Precedent: waves 81–84 all seeded milestone-less from the same unassigned bug queue (verified live — seed tasks 2340d2d3 / 0e58af8e / 875b97f4 / 9535895f all milestone_id NULL). NOT fired.
- **Action 9 Daily-checkpoint** — condition is next-claimable null; seedable queue is 33-deep so next-claimable is non-null. NOT fired.
- **Action 10 Route** — no proposals fired; nothing to route.

## Verdict

COMPLETE. No transitions, no rituals, no pause. Proceed to N-2 to seed wave-85 from the bug-fix queue (premise-verified).
