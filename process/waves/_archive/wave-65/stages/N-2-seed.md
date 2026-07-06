# N-2 — Seed (wave-65 → wave-66)

## Actions

- **Action 1 — seed pick:** oldest top-level todo under M12 with `wave_id IS NULL` = `6018bdee-1b99-47b2-8235-b3786c29c2d5` — "Offline empty-state copy polish: neutral wording for a never-synced server's channel sidebar". (The only seed candidate; `10e7543f` is `blocked` so excluded by the query.)
- **Action 2 — siblings:** none (`parent_task_id=6018bdee` returns 0 rows). Single-task bundle — valid.
- **Action 3 — validate:** `status=todo` ✓, `wave_id IS NULL` ✓, `milestone_id=36378340…` (=M12) ✓, `parent_task_id IS NULL` (top-level seed) ✓. Validation **pass**.
- **Action 5 — claimed_task_ids:** `[6018bdee-1b99-47b2-8235-b3786c29c2d5]`.

## head-next gate — N-2

Stage-exit checklist:
- [x] WIP-limited: one seed + 0 siblings (tight bundle).
- [x] seed `parent_task_id IS NULL`; no siblings to FK-check.
- [x] bundle carries `milestone_id=$active` (M12), `wave_id=NULL`, `status='todo'`.
- [x] dependency sequencing N/A (single task, no intra-bundle blocker).
- [x] bundle authored by ritual (V-1-jenny follow-up seed created upstream); NOT hand-INSERTed at N-2 — N-2 only identifies.

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Single-task bundle. Seed 6018bdee validated against the live DB — todo, wave_id NULL,
    milestone_id=M12, top-level. No bundle bloat, no out-of-ritual INSERT (N-2 identifies only).
    claimed_task_ids emitted for B-0 claim + L-2 close.
  next_action: PROCEED_TO_N-3

n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 6018bdee-1b99-47b2-8235-b3786c29c2d5"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 6018bdee-1b99-47b2-8235-b3786c29c2d5
seed_task_title: "Offline empty-state copy polish: neutral wording for a never-synced server's channel sidebar"
bundled_sibling_ids: []
claimed_task_ids: [6018bdee-1b99-47b2-8235-b3786c29c2d5]
active_milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
queue_exhausted: false
validation_failed: false
note: "Single-task bundle. V-1-jenny wave-65 non-blocking gap G2 follow-up."
```
