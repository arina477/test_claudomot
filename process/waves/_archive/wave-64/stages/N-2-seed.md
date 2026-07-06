# N-2 — Seed (wave-64)

## Actions

**Action 1 — pick seed:** `db3ade72-6504-4700-93b1-9d99b4098f38` — "Offline hydration for the message list (unlock previously-viewed media on cold offline open)". Sole seed candidate under M12 (`parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`) after N-1 blocked the descoped `10e7543f`.

**Action 2 — siblings:** none (`parent_task_id = db3ade72` returns 0 rows). Single-task bundle — valid.

**Action 3 — validate:** PASS.
- `status='todo'` ✓
- `wave_id IS NULL` ✓
- `milestone_id = 36378340-0ea5-428e-bc94-03750fb103f6` (M12) ✓
- seed `parent_task_id IS NULL` ✓ (no siblings to parent-check)

**Action 5 — claimed_task_ids:** `[db3ade72-6504-4700-93b1-9d99b4098f38]`. B-0 of wave-65 claims this batch; L-2 closes it.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: db3ade72-6504-4700-93b1-9d99b4098f38"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: db3ade72-6504-4700-93b1-9d99b4098f38
seed_task_title: "Offline hydration for the message list (unlock previously-viewed media on cold offline open)"
bundled_sibling_ids: []
claimed_task_ids: [db3ade72-6504-4700-93b1-9d99b4098f38]
active_milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
queue_exhausted: false
validation_failed: false
note: "Single-task bundle; WIP-limited to one seed. Reuses proven read-through pattern; unlocks wave-64 attachment cache on cold offline open."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle WIP-limited to one seed with zero siblings — no bundle bloat, no unbuilt
    intra-bundle dependency. Seed re-confirmed against the live tasks table: status=todo,
    wave_id NULL, milestone_id=M12, parent_task_id NULL. Authored via the V-2 follow-up
    path (jenny-sourced), not a hand-INSERT at N-2. claimed_task_ids populated for B-0/L-2.
  next_action: PROCEED_TO_N-3
```
