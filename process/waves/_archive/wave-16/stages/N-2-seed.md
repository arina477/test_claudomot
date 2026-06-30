# N-2 — Seed (wave-16 → wave-17 bundle)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 25523fb0-edef-46e4-928b-55e78495d181"
  - "bundled siblings: 0"
  - "validation: pass (status=todo, wave_id NULL, milestone_id=M3, parent_task_id NULL)"
seed_task_id: 25523fb0-edef-46e4-928b-55e78495d181
seed_task_title: "Add a real-Postgres mid-transaction-failure rollback test for create-server"
bundled_sibling_ids: []
claimed_task_ids: [25523fb0-edef-46e4-928b-55e78495d181]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
queue_exhausted: false
validation_failed: false
note: >
  SEED CHOICE + DEPENDENCY REASONING (25523fb0 vs 02fa8011):
  N-2 Action 1 picks the OLDEST seedable row (parent_task_id IS NULL, wave_id IS NULL,
  status=todo) under M3. Only two rows qualify: 25523fb0 (2026-06-29 17:27, oldest) and
  d058283d (invite-code rotation). 25523fb0 wins on created_at.
  The pre-survey raised whether 02fa8011 (Real-PG integration test tier) should be picked
  FIRST as the dependency enabler. Resolved NO, on two independent grounds:
  (1) CONTRACT: 02fa8011 is not a seed candidate — it carries wave_id=wave-14 (a stale
      claim from a closed 'ok' wave) so N-2's seed query (wave_id IS NULL) cannot return
      it. It is unpickable here by definition.
  (2) SUBSTANCE: 25523fb0's own description specifies a self-contained real-Postgres (or
      in-process-Postgres) harness for the create-server rollback path; it does NOT
      hard-depend on 02fa8011's presence-services tier being built first. Both want a
      real-PG harness, but 25523fb0 stands up its own — so picking it is dependency-safe
      (no unbuilt blocker), and the harness it establishes is exactly what 02fa8011 can
      later reuse. The enabler emerges from THIS wave rather than gating it.
  Single-task bundle (no siblings) — valid. 02fa8011's 3rd-recurrence escalation concern
  (wave-14+15 carry) is flagged to wave-17 P-0 for re-parent/re-decompose into a seedable
  row; it is NOT an N-block task-status edit.
```
