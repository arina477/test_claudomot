# N-1 — Survey & triggers (wave-10)

Mode: automatic. head-next gate: APPROVED.

## Survey signals (Actions 1–4)

- **Active milestone (Action 1):** M2 — Servers, channels & membership (`41e61975-c92e-49b1-9ae5-45498dd04925`), status=in_progress. Exactly one in_progress row (invariant OK).
- **todo queue head (Action 2):** M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`), T2, product-feature. 11 todo milestones total; M3 is highest-priority next core milestone (reuses M2's wave-10 ChannelPermissionGuard + auth/RBAC primitives).
- **Active child summary (Action 3, pre-disposition):** open=4, done=15, seed_candidates=4. All 4 open tasks are `parent_task_id IS NULL`, `wave_id NULL`, `status='todo'`.
- **Unassigned queue depth (Action 4):** 0.

## Disposition (Actions 6–10)

M2 is FEATURE-COMPLETE: `## Success metric` MET across 4 LIVE bundles (servers/channels, invites/join, invite-complete, RBAC); all `## Scope` items have done tasks. The 4 open M2 tasks are NOT M2 feature scope — test-infra/tech-debt/M3-forward (one self-describes "Follow-up/tech-debt task, not a milestone bundle seed").

1. **Reassign (Action 6 prep):** 4 open M2 tasks → M3 via `UPDATE tasks SET milestone_id='6198650e…'` (brain-permitted, rule 15; not an out-of-ritual INSERT). M2 open children → 0, satisfying closure invariant #3.
   - `4a2ad286` verified-prod fixture · `46f16288` browser-E2E · `25523fb0` PG-rollback test · `d058283d` invite_code rotation.
2. **Closure (Action 6):** M2 `in_progress → done`. Recorded in product-decisions.md.
3. **Promotion (Action 8a):** M3 `todo → in_progress`. One-in_progress invariant holds (verified count=1). Recorded in product-decisions.md.
4. **Decomposition (Action 7):** NOT fired — after reassign M3 has 4 seed candidates, so the ritual's no-seed-candidate precondition is unmet. M3's messaging bundle decomposes in a later N-1 once the infra/tech-debt seeds clear.
5. **Stockout (Action 8b):** N/A — 11 todo milestones remain.
6. **Daily-checkpoint (Action 9):** NOT fired — seed candidates exist; unassigned_queue_depth=0.
7. **M2→M3 pivot touchpoint:** autonomous-proceed (founder same-day standing direction "M2 servers → M3 messaging") + non-blocking founder REPORT. NOT a blocking ask (re-polling a pre-authorized same-day direction violates rules 16/17).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 41e61975-c92e-49b1-9ae5-45498dd04925 (M2) → closed done"
  - "todo queue head: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 (M3) → promoted in_progress"
  - "active child tasks (pre-disposition): open=4 done=15 seed_candidates=4"
  - "unassigned queue depth: 0"
  - "closure: M2 in_progress→done (feature-complete, success metric MET)"
  - "promotion: M3 todo→in_progress"
  - "decomposition fired: false (M3 has 4 seed candidates post-reassign)"
  - "rituals fired: []"
  - "4 open M2 tasks reassigned to M3 (test-infra/tech-debt/M3-forward)"
prev_wave: 10
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_child_summary:
  open: 4
  done: 0
  seed_candidates: 4
next_todo_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c   # M4 (next after M3 promoted)
unassigned_queue_depth: 0
state_transitions_applied:
  - {milestone: "M2 (41e61975…)", from: in_progress, to: done, recorded_in_decisions_log: true}
  - {milestone: "M3 (6198650e…)", from: todo, to: in_progress, recorded_in_decisions_log: true}
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "M2 FEATURE-COMPLETE; M2→M3 core pivot (founder pre-authorized, automatic). 4 open M2 tasks reassigned to M3 to satisfy closure invariant; verified-fixture 4a2ad286 → wave-11 seed per L escalation."
```
