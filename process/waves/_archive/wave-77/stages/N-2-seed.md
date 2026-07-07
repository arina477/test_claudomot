# N-2 — Seed (wave-77 → wave-78 bundle)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 4be3b084-c86f-48f6-b3fc-fe9e95d60556"
  - "bundled siblings: 1"
  - "validation: pass (seed + sibling: status=todo, wave_id NULL, milestone_id=M13; sibling parent_task_id=seed)"
seed_task_id: 4be3b084-c86f-48f6-b3fc-fe9e95d60556
seed_task_title: "Allow clearing academicRole back to unset"
bundled_sibling_ids:
  - 3b3530d8-f452-4e26-b50d-be2d3dabf384
claimed_task_ids:
  - 4be3b084-c86f-48f6-b3fc-fe9e95d60556
  - 3b3530d8-f452-4e26-b50d-be2d3dabf384
active_milestone_id: b7400254-9c16-4b97-a898-2619b949fc5e
queue_exhausted: false
validation_failed: false
note: >
  Bundle judgment: the two M13 seed candidates are both small, cohesive member-profile-card UX polish
  filed at wave-77 V-2 — same surface (member profile card), same origin, independent behaviors (seed
  touches UpdateProfileSchema + profile editor select; sibling branches the card fetch error handler).
  Re-parented 3b3530d8 under seed 4be3b084 (parent_task_id = seed) to form ONE coherent "profile card
  polish" bundle for wave-78: seed + 1 sibling. Within WIP limit, not bloat; bundling beats orphaning
  the second seed into a thin repeat wave. head-next gate APPROVED the bundle-both decision. N-2 does NOT
  set wave_id/status — B-0 of wave-78 claims the bundle in one batch. Reparent committed to DB before
  N-3 archive move so wave-78 P-0 recovers the bundle from tasks (milestone_id=M13, seed+sibling, wave_id NULL).
```
