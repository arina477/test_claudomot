# N-1 — Survey & triggers (wave-11)

Active mode: `automatic`. head-next gate: **APPROVED** (PROCEED_TO_N-2), 3 binding conditions recorded below.

## Survey signals (Actions 1–4)

- **Action 1 — active milestone:** exactly one `in_progress` → M3 "Real-time messaging" `6198650e-f4e0-44dc-9b0a-6550f01f9f82`. No invariant violation.
- **Action 2 — todo queue head:** M4 "Offline-first reliability (the wedge)" `eb2a1688-c6b5-416c-84b4-3ede41d07b4c` (10 todo milestones M4..M13). No stockout.
- **Action 3 — M3 child-task summary:** `open_count=3`, `done_count=1`, `seed_candidates=3`.
- **Action 4 — unassigned queue depth:** `0`.

## Trigger evaluations (Actions 6–10)

### Action 6 — closure check: NO CLOSE
M3 held `in_progress`. Closure is doubly blocked: `open_count=3 ≠ 0`, AND the `## Scope` messaging slice is unshipped — the only `done` task (4a2ad286) is the wave-11 prod verified test fixture, an infra enabler, not a messaging feature. Premature-milestone-close avoided.

### Action 7 — per-wave decomposition: FIRED
**Seed-candidate override (head-next condition 1).** The raw `seed_candidates=3` numerically reads ">0 → do not fire", but all 3 top-level `todo` / `wave_id IS NULL` tasks are carried M2 tech-debt, NOT messaging-feature seeds:
- `46f16288` — browser E2E for authed create-server flow
- `25523fb0` — real-Postgres mid-transaction rollback test for create-server
- `d058283d` — rotate permanent server invite_code (owner-gated)

None advances M3's unshipped messaging `## Scope`. The messaging slice has an **effective seed count of 0** → this is a feature-stockout (Action 6→7 fall-through: scope items lack done tasks → fire decomposition). The wave-11 checklist pre-amble (carry-forward #3) explicitly predicted this fire. The 3 tech-debt tasks were left untouched (head-next condition 3).

Decomposition routed per Action 10 mode table (`automatic` → spawn `milestone-decomposer` inline). Returned `decomposition-complete`. One bundle authored:
- **seed** `a0c322b4-72de-4c8d-ac27-bb51dda5f464` — "Build MessagingModule + send/list message REST data plane"
- **sibling** `723b5b6a-5565-438f-bde4-7e85ba283781` — "Wire /messaging Socket.IO gateway: WS-upgrade auth + room-per-channel fan-out"
- **sibling** `d999d29c-4f60-497b-95fb-875ae40410b9` — "Build message UI: composer + virtualized message list with pending/failed states"

Self-FK + assignment columns verified in DB: seed `parent_task_id IS NULL`; both siblings `parent_task_id = a0c322b4`; all three `status='todo'`, `wave_id IS NULL`, `milestone_id = M3`. ~3200 net LOC, ~25 files (within rubric). T-8 rule 1 (live-probe authz via wave-11 verified fixture) encoded in all three task prose.

### Action 8 — promotion / stockout: N/A
M3 still active (slot occupied). No promotion. todo queue M4..M13 → no milestone-stockout; roadmap-planning NOT fired.

### Action 9 — daily-checkpoint: NOT FIRED
`unassigned_queue_depth = 0` → checkpoint condition not met.

### Action 10 — routing
Only ritual fired: milestone-decomposition → `automatic` route = inline `milestone-decomposer` spawn. Applied. No BOARD, no founder defer.

## Pause discipline (rule 13)
No measured trigger present (no STATUS change, no hard-stop verdict, no founder message, no `.loop-paused.yaml`, no `.loop-resume.yaml`). Decomposition firing is not a pause condition. `loop_state: ready`.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 (M3, in_progress)"
  - "todo queue head: eb2a1688-c6b5-416c-84b4-3ede41d07b4c (M4)"
  - "active child tasks: open=3 done=1 seed_candidates=3 (all 3 carried tech-debt, not messaging seeds → effective messaging-slice seed count 0)"
  - "unassigned queue depth: 0"
  - "closure: none (open_count=3; messaging scope unshipped)"
  - "promotion: none (M3 still active)"
  - "decomposition fired: true (reason decomposition-needed; one bundle, 1 seed + 2 siblings)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 11
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_child_summary:
  open: 3
  done: 1
  seed_candidates: 3
next_todo_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
unassigned_queue_depth: 0
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82, reason: decomposition-needed, decision: applied, by: milestone-decomposer (automatic, inline), fired_at: 2026-06-30}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "one bundle — seed a0c322b4 (MessagingModule REST data plane) + siblings 723b5b6a (/messaging Socket.IO gateway), d999d29c (message UI). ~3200 LOC. First foundational M3 messaging slice; reactions/threads/mentions/attachments/presence/member-list deferred to later M3 waves.", decision: decomposition-complete, by: milestone-decomposer}
loop_state: ready
note: "Feature-stockout override: seed_candidates=3 but all carried M2 tech-debt (46f16288, 25523fb0, d058283d), not messaging seeds; messaging-slice effective seed count 0 → decomposition correctly fired. Override + closure-hold recorded by decomposer in product-decisions.md."
```
