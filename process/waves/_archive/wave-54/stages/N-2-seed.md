# N-2 — Seed (wave-54)

## Action 1 — Pick the seed

Per the N-1 disposition, the seed is re-ordered ahead of pure oldest-`created_at` per N-2 Action 1 (value-first LLM re-order): the DM-privacy `server-members` positive-control case is a genuinely-missing control on the who-can-DM bet differentiator (`ad1a3685`), strictly higher-value than the remaining polish/hardening tail.

- **seed_task_id:** `344eabde-bc21-4978-9473-d5b46b7276b1`
- **seed_task_title:** DM privacy: add who_can_dm='server-members' positive-control integration case for /dm/candidates

## Action 2 — Load siblings

Query on `parent_task_id = 344eabde…`, `status='todo'`, `wave_id IS NULL` → **0 rows**. Single-task bundle (valid).

- **bundled_sibling_ids:** `[]`

## Action 3 — Validate the bundle

```
id        status  wave_id  milestone_id                          parent_task_id
344eabde  todo    NULL     84e17739-af5e-4396-beb9-b6f3d6836fc4  NULL
```

Per-row check on `344eabde`:
- status = 'todo' ✓
- wave_id IS NULL ✓
- milestone_id = 84e17739 (active M8) ✓
- parent_task_id IS NULL (seed is top-level) ✓

Validation: **PASS.**

## Action 5 — Emit claimed_task_ids

`claimed_task_ids = [344eabde-bc21-4978-9473-d5b46b7276b1]` — propagates to N-3 handoff, B-0 claim batch (wave-55), and L-2 close batch.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 344eabde-bc21-4978-9473-d5b46b7276b1"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 344eabde-bc21-4978-9473-d5b46b7276b1
seed_task_title: "DM privacy: add who_can_dm='server-members' positive-control integration case for /dm/candidates"
bundled_sibling_ids: []
claimed_task_ids: [344eabde-bc21-4978-9473-d5b46b7276b1]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "Single-seed bundle. DM-scale pair c5051444+874bd233 remains a natural later 2-task bundle."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle limits WIP to one seed + 0 siblings (tight). Seed 344eabde has
    parent_task_id IS NULL; every bundle column re-confirmed against the live tasks
    table — status='todo', wave_id NULL, milestone_id=M8. No siblings to sequence.
    Bundle was authored by the milestone-decomposer ritual in an earlier wave (not
    hand-INSERTed at N-2). Seed re-order is a value-first pick over oldest-created_at,
    permitted by N-2 Action 1. claimed_task_ids populated for B-0/L-2.
  next_action: PROCEED_TO_N-3
```
