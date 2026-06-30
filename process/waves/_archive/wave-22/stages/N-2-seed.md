# Wave 22 — N-2 Seed

## Seed pick (Action 1)
Per head-next recommendation + N-1 signals: seed = `8aa67564` — "Add dedicated manage_assignments permission (split from manage_channels)". Continues the assignments authz arc; autonomous (no external credential); documented wave-22 G2 follow-on.

## Siblings (Action 2)
None — `parent_task_id = 8aa67564` returns 0 rows. Solo bundle (valid).

## Validation (Action 3) — PASS
8aa67564: status=todo, wave_id=NULL, milestone_id=a5232e16 (M5), parent_task_id=NULL. All checks pass.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 8aa67564-a142-4628-b658-f020d4d2872c"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 8aa67564-a142-4628-b658-f020d4d2872c
seed_task_title: "Add dedicated manage_assignments permission (split from manage_channels)"
bundled_sibling_ids: []
claimed_task_ids: [8aa67564-a142-4628-b658-f020d4d2872c]
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
queue_exhausted: false
validation_failed: false
note: "Solo-task bundle. Resend/reminders deferred to founder digest; manage_assignments keeps the assignments theme advancing autonomously."
```

## Exit
Seed identified + validated. claimed_task_ids = [8aa67564]. → N-3.
