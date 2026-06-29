# N-2 — Seed (wave-4 → wave-5)

Bundle picked under M1 per founder "a bit of both" direction (head-next APPROVED item 6/7).

- Seed: `839af17f` — Add rate limiting to auth endpoints (@nestjs/throttler). Shippable now, no founder dependency, security win (@nestjs/throttler ~10/min per architecture). parent_task_id NULL, wave_id NULL, todo. Oldest of the founder-named pair.
- Sibling: `84e09891` — Set Railway Bucket creds + verify avatar upload live. parent_task_id=839af17f, wave_id NULL, todo. NEEDS founder Railway Bucket creds (still pending) — avatar presign path is deployed (503-graceful when storage unset), so no regression if creds lag; task stays open/blocked until creds arrive.
- Validation (Action 3): PASS — both rows status=todo, wave_id NULL, milestone_id=5a6efc9e (M1), sibling parent=seed.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 839af17f-fa3d-4212-a17b-d34bfbb231d7"
  - "bundled siblings: 1 (84e09891-2b2f-4b68-b6e2-e2ef340ef32a)"
  - "validation: pass"
seed_task_id: 839af17f-fa3d-4212-a17b-d34bfbb231d7
seed_task_title: "Add rate limiting to auth endpoints (@nestjs/throttler)"
bundled_sibling_ids: [84e09891-2b2f-4b68-b6e2-e2ef340ef32a]
claimed_task_ids: [839af17f-fa3d-4212-a17b-d34bfbb231d7, 84e09891-2b2f-4b68-b6e2-e2ef340ef32a]
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
queue_exhausted: false
validation_failed: false
note: "84e09891 carries a founder Railway-Bucket-creds dependency — propagated to wave-5 checklist for B-block to plan the ask."
```
