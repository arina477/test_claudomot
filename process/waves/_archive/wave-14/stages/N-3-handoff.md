# N-3 — Handoff (wave-14 → wave-15)

Mode: `automatic`. head-next owns this block. Final stage of the wave loop.

## Actions

- **Action 1 — next wave + loop state:** current wave = 14, next = 15. No pause trigger: N-2 found a valid bundle (`queue_exhausted: false`); no stockout deferral; no decomposition deferred to founder (it completed inline under `automatic`). No measured pause condition (b/d/e/f) present — STATUS RUNNING, no `.loop-paused.yaml`, no founder message, no hard-stop. → **`loop_state: ready`**, increment to wave-15.
- **Action 2 — pre-create wave-15:** dir tree + checklist created, pre-filled with seed/siblings/active milestone.
- **Action 3 — write this deliverable** (before archive).
- **Action 4 — archive wave-14:** single `git mv process/waves/wave-14/ process/waves/_archive/wave-14/` + commit.
- **Action 5a — close wave row:** `UPDATE waves SET status='ok'` on the running row (wave_number 14) — RETURNING confirmed.
- **Action 5b — write `.last-wave-completed.yaml`.**

## Milestone state confirmation

M3 stays `in_progress` (NOT closed — feature scope mentions/attachments/threads unshipped; 7 open tasks). No milestone state transition this wave. ACs of M3 are NOT all shipped, so the closure gate correctly held.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 15"
  - "next wave checklist: process/waves/wave-15/checklist.md"
  - "archive commit: <see commit SHA in handoff>"
  - "wave-14 closed: status=ok (RETURNING wave_number=14)"
prev_wave: 14
next_wave: 15
loop_state: ready
seed_task_id: 3d238446-25b9-4c3d-91ca-0fc3dbae17f2
bundled_sibling_ids: [cd585f04-c1d5-48b2-9d45-d01ecd3ae15f, c3f3f62a-86c3-41cd-ba14-ce5e731e2d37]
claimed_task_ids: [3d238446-25b9-4c3d-91ca-0fc3dbae17f2, cd585f04-c1d5-48b2-9d45-d01ecd3ae15f, c3f3f62a-86c3-41cd-ba14-ce5e731e2d37]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "Clean handoff. M3 advances via @mentions bundle next wave. No pause — automatic mode, no measured trigger. STATUS stays RUNNING."

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: "M3 not closed — feature ACs (mentions/attachments/threads) unshipped, 7 open tasks. Current wave closed via single waves UPDATE (status=ok). Entire wave-14 dir archived in one move. Handoff opens next wave's P-0 (loop_state: ready) — NOT a pause, and not both: no measured pause trigger fired under automatic mode. All cross-wave state recoverable from DB (bundle rows) + .last-wave-completed.yaml + archive. Exactly one running wave closed."
  next_action: PROCEED_TO_P-0
```
