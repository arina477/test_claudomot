# N-1 — Survey & triggers (wave-9)

> head-next: APPROVED N-1 entry. Mode: automatic. Decompose RBAC for wave-10 seed; M2 stays in_progress.

## Survey phase (Actions 1–4)

- **Action 1 — active milestone:** M2 `41e61975-c92e-49b1-9ae5-45498dd04925` (in_progress). Exactly one in_progress row — no invariant violation.
- **Action 2 — todo queue head:** M3 `6198650e` (Real-time messaging) is highest-tier todo, but irrelevant this tick — M2 is active and not closing.
- **Action 3 — M2 child-task summary:** `open=4 done=11 seed_candidates=4`. The 4 seed_candidates are all tech-debt follow-ups (46f16288 browser-E2E, 4a2ad286 verified-prod-fixture, 25523fb0 PG-rollback-test, d058283d invite-rotation) — NOT feature seeds. No RBAC task existed.
- **Action 4 — unassigned queue depth:** 0.

## Trigger phase (Actions 6–10)

- **Action 6 — closure check:** NOT closed. `open_count=4` (≠0) AND M2 ## Scope RBAC clause unshipped + ## Success metric "members see the right channels per role" UNMET. M2 stays in_progress.
- **Action 7 — per-wave decomposition:** FIRED. The literal `seed_candidates==0` reading is a no-op (4 rows exist), but the governing path is the scope-driven fallthrough: M2 scope unshipped AND no seed candidate satisfies the unshipped RBAC scope slice. RBAC is BOARD-bound as the unconditional wave-10 feature seed (wave-8 N 5-1-1, re-affirmed wave-9 L; wave-9 binding condition #3). Decomposition fired with reason `decomposition-needed` against M2.
- **Action 8 — slot promotion / stockout:** N/A (M2 active, not closed).
- **Action 9 — daily-checkpoint:** NOT fired — `unassigned_queue_depth=0` fails the Action 9 condition.
- **Action 10 — route per mode (automatic):** milestone-decomposition → spawned `milestone-decomposer` sub-agent inline. Returned `decomposition-complete`: 1 seed + 3 siblings. Decision-log appended + committed (`73791d8`).

## Bundle authored (verified in DB)

- Seed: `35f191f4-2b63-4c8b-bf7e-a5c074310ec6` — Build RbacModule: roles table, RbacService.can(), role CRUD + assignment
- Sibling: `2c927c44-0b29-485d-9640-33401624b973` — Channel-level permission overrides + ChannelPermissionGuard
- Sibling: `7a10f13d-413f-46a2-a006-f60c0ab529f2` — Owner-lockout safeguard: last-owner invariant
- Sibling: `0b9bcf35-a6f1-40df-9da3-e9135307b900` — Role-management UI in server settings
- All: `parent_task_id` correct (seed NULL; siblings = seed.id), `status=todo`, `wave_id=NULL`, `milestone_id=M2`. M2 status confirmed still `in_progress`.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 41e61975-c92e-49b1-9ae5-45498dd04925 (M2, in_progress)"
  - "todo queue head: 6198650e (M3) — not promoted; M2 active"
  - "active child tasks: open=4 done=11 seed_candidates=4 (all tech-debt; no feature seed)"
  - "unassigned queue depth: 0"
  - "closure: none (open_count=4, RBAC scope unshipped)"
  - "promotion: none"
  - "decomposition fired: true (RBAC bundle, BOARD-bound wave-10 seed)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 9
active_milestone_id: 41e61975-c92e-49b1-9ae5-45498dd04925
active_milestone_child_summary:
  open: 4
  done: 11
  seed_candidates: 4
next_todo_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
unassigned_queue_depth: 0
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 41e61975-c92e-49b1-9ae5-45498dd04925, reason: decomposition-needed, decision: fired-inline, by: milestone-decomposer, fired_at: 2026-06-29T19:30:00Z}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "1 seed + 3 siblings authored for RBAC (commit 73791d8)", decision: decomposition-complete, by: milestone-decomposer}
loop_state: ready
note: "RBAC decomposition fired explicitly per BOARD pre-authorization despite 4 existing tech-debt seed_candidates — they are not feature seeds. M2 stays in_progress."
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: "Trigger ladder correctly resolved — scope-driven decomposition fallthrough fires RBAC (Action 7); daily-checkpoint excluded (queue depth 0); premature M2 close excluded (open_count=4, scope unmet). Bundle authored via milestone-decomposer ritual, not hand-INSERT. M2 stays in_progress."
  next_action: PROCEED_TO_N-2
```
