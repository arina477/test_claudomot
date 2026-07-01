# Wave 23 — N-2 Seed

## Seed pick (Action 1)
Per head-next: seed = `02fa8011` — "Real-Postgres integration test tier for presence/services". Reinforced by wave-23 F23-T-4 (new authz surface had no real-DB integration test) + recurring integration-tier thinness; a harness future seeds compound on.

## Siblings (Action 2)
None — `parent_task_id = 02fa8011` returns 0 rows. Solo bundle (valid).

## Validation (Action 3) — PASS
02fa8011: status=todo, wave_id=NULL, milestone_id=a5232e16 (M5), parent_task_id=NULL. All checks pass.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 02fa8011-1d44-4a02-a808-eba7191fba1b"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 02fa8011-1d44-4a02-a808-eba7191fba1b
seed_task_title: "Real-Postgres integration test tier for presence/services"
bundled_sibling_ids: []
claimed_task_ids: [02fa8011-1d44-4a02-a808-eba7191fba1b]
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
queue_exhausted: false
validation_failed: false
note: "Solo test-infra seed. Reminders deferred (Resend key pending). head-next: wave-25 can seed c18b8089 (mention parity) on top of the new harness."
```

## Exit
Seed identified + validated. claimed_task_ids = [02fa8011]. → N-3.
