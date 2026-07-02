# N-2 — Seed (wave-32) — RE-RUN (resolved)

> Overwrites the prior REJECTED N-2 deliverable. Seed a2dd9f3d now passes the picker
> (`wave_id IS NULL`) after the orchestrator's rule-15/17 resolution.

## Action 1 — Pick the seed

```sql
SELECT id FROM tasks
WHERE milestone_id='8702a335-90ec-40ff-8c7d-a91bb7790a27'
  AND status='todo' AND wave_id IS NULL AND parent_task_id IS NULL
ORDER BY created_at LIMIT 1;
```
**Result: a2dd9f3d.** Now satisfies every clause including `wave_id IS NULL`.

- `seed_task_id`: `a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354`
- `seed_task_title`: "Harden voice endpoint param validation (non-UUID channelId 500→400)"

Single candidate; no re-ordering needed.

## Action 2 — Load siblings

`SELECT ... WHERE parent_task_id = a2dd9f3d AND status='todo' AND wave_id IS NULL` → **0 rows.** Single-task bundle (tightly-scoped hardening task — no siblings warranted). WIP-limit respected.

## Action 3 — Validate the bundle

Live re-check of `a2dd9f3d` this turn:

| Field | Required | Actual | OK |
|---|---|---|---|
| status | `todo` | `todo` | ✓ |
| wave_id | `NULL` | NULL (blank) | ✓ |
| milestone_id | `8702a335` (M6) | `8702a335-90ec-40ff-8c7d-a91bb7790a27` | ✓ |
| parent_task_id | `NULL` (seed) | NULL (blank) | ✓ |

**Validation PASS.** No concurrent-write race.

## Action 5 — Emit claimed_task_ids

`claimed_task_ids = [a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354]` — propagates to N-3 handoff (`.last-wave-completed.yaml`), wave-33 B-0 claim batch, and wave-33 L-2 close batch.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354
seed_task_title: "Harden voice endpoint param validation (non-UUID channelId 500→400)"
bundled_sibling_ids: []
claimed_task_ids:
  - a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
queue_exhausted: false
validation_failed: false
note: "Single-task bundle (credential-independent M6 hardening). Seed valid after wave_id->NULL resolution."
```

## head-next signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle is one seed + zero siblings — WIP-limited and tightly scoped (param-validation
    hardening needs no companion tasks). Seed has parent_task_id NULL; milestone_id=M6,
    wave_id NULL, status=todo all confirmed against the live table this turn. No intra-bundle
    dependency sequencing needed (single task). Bundle originates from wave-32 V-2 triage
    (F-32-T-8-1), a legitimate in-ritual authoring path; N-block hand-INSERTed nothing.
  next_action: PROCEED_TO_N-3
```
