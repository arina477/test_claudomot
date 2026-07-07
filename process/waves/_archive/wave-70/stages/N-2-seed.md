# N-2 — Seed (wave-70)

Block: N (Next). Mode: `automatic`. Next-wave bundle picked from canonical Postgres under active milestone M14.

## Actions

- **Action 1 — pick seed:** oldest top-level candidate under M14 (`parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`) = `1193aebf-0b83-4cb2-bec8-0caa98339241` — "Reflect blocked state on the member-row Block affordance (Block↔Unblock toggle)" (V-2 FINDING-1, MEDIUM UX polish).
- **Action 2 — siblings:** `SELECT ... WHERE parent_task_id='1193aebf' AND status='todo' AND wave_id IS NULL` → 0 rows. Single-task bundle (valid).
- **Action 3 — validate:** seed row confirmed `status=todo`, `wave_id IS NULL`, `milestone_id=6a9424fe-c943-4b26-9110-6915661a6fb9`, `parent_task_id IS NULL`. Validation PASS.
- **Action 5 — claimed_task_ids:** `[1193aebf-0b83-4cb2-bec8-0caa98339241]`.

## Self-healing thin seed

`1193aebf` is a thin UI-polish task. The second M14 seed candidate `1c633d2f` (GET /blocks display-name/avatar enrichment) is deliberately LEFT in the queue with `wave_id IS NULL` (verified NULL — required so it stays seedable, per the stored "V-2 milestone follow-up wave_id must be NULL for N-2 seed" memory). Wave-71 P-1 RESCOPE-AUTO-MERGE will expand this thin bundle — likely pulling in `1c633d2f` — so the wave is right-sized without N-2 force-bundling here (WIP-limited bundle, no bundle-bloat).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 1193aebf-0b83-4cb2-bec8-0caa98339241"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 1193aebf-0b83-4cb2-bec8-0caa98339241
seed_task_title: "Reflect blocked state on the member-row Block affordance (Block↔Unblock toggle)"
bundled_sibling_ids: []
claimed_task_ids: [1193aebf-0b83-4cb2-bec8-0caa98339241]
active_milestone_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
queue_exhausted: false
validation_failed: false
note: >
  Thin single-task UI-polish seed. Sibling 1c633d2f left in queue (wave_id NULL, verified)
  for wave-71 P-1 RESCOPE-AUTO-MERGE self-heal. No bundle-bloat.

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Seed selection correct: oldest parent_task_id-NULL / wave_id-NULL / todo task under M14 =
    1193aebf. Sibling query returned 0 rows (valid single-task bundle). All four per-row
    validation checks pass. claimed_task_ids well-formed for B-0 batch-claim and L-2 batch-close.
    WIP limited to one seed, zero siblings — minimum viable next step, no bundle-bloat. Sibling
    1c633d2f correctly left in queue (wave_id NULL) for wave-71 P-1 RESCOPE-AUTO-MERGE self-heal.
  next_action: PROCEED_TO_N-3
```
