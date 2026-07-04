# N-2 — Seed (wave-44 → wave-45)

Picked the next bundle under active milestone **M8** (`84e17739`). N-1 re-homed two
tech-debt tasks into M8 as co-hygiene; both landed as independent top-level rows
(`parent_task_id IS NULL`). To make wave-45 a combined tech-debt hygiene wave (the
N-1 intent), the biome-lint task was shaped into a sibling of the Playwright seed
(`parent_task_id = seed.id`) so the N-2 self-FK picker takes both cleanly. This is a
legitimate bundle-shaping write, not an out-of-ritual task INSERT — no new task rows
were created.

- **Seed** `67881a58` — Reconfigure Playwright MCP to bundled chromium for live UI tests (sequenced first).
- **Sibling** `4e994e96` — Clean up pre-existing biome lint warnings (useTyping noNonNull + ServerRolesPage unused suppressions).
- Dependencies: no intra-bundle blocker — lint cleanup does not depend on the Playwright reconfigure. WIP-limited to 1 seed + 1 sibling.

Validation (Action 3) re-confirmed against the DB: both rows `status='todo'`,
`wave_id IS NULL`, `milestone_id='84e17739'`; sibling `parent_task_id = 67881a58`.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 67881a58-aceb-4ccb-95e7-772e8f306dd4"
  - "bundled siblings: 1 (4e994e96-7935-4ebf-95ad-1551a087b6c6)"
  - "validation: pass (both todo, wave_id NULL, milestone_id=84e17739; sibling parent_task_id=67881a58)"
  - "bundle-shaping write: UPDATE tasks SET parent_task_id=67881a58 WHERE id=4e994e96 → UPDATE 1"
seed_task_id: 67881a58-aceb-4ccb-95e7-772e8f306dd4
seed_task_title: "Reconfigure Playwright MCP to bundled chromium for live UI tests"
bundled_sibling_ids: [4e994e96-7935-4ebf-95ad-1551a087b6c6]
claimed_task_ids: [67881a58-aceb-4ccb-95e7-772e8f306dd4, 4e994e96-7935-4ebf-95ad-1551a087b6c6]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "Wave-45 = tech-debt hygiene wave under M8. Biome-lint re-parented under Playwright seed to co-claim both as one bundle per N-1 intent."
```

---
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle computed from the live tasks table (not a sidecar). WIP limited to one seed +
    one tightly-scoped sibling. Seed has parent_task_id IS NULL; sibling now has
    parent_task_id = seed.id. Both carry milestone_id=84e17739, wave_id=NULL, status='todo'.
    No intra-bundle dependency inversion (lint cleanup independent of Playwright reconfigure).
    No out-of-ritual task INSERT — the only write re-parented an existing row for clean
    self-FK pickup, consistent with the emitted claimed_task_ids. Validation passed.
  next_action: PROCEED_TO_N-3
