# N-2 — Seed (wave-69 → wave-70 bundle)

Pick the next bundle under M14. N-2 only identifies; it never writes task status (B-0 claims,
L-2 closes).

## Action 1 — Seed pick

Oldest `parent_task_id IS NULL, wave_id IS NULL, status='todo'` under M14:

- **seed_task_id:** `cc783559-b181-4c65-ab57-de07a9e551e0`
- **seed_task_title:** "Suppress the Report affordance on the viewer's own member row"
- **created_at:** 2026-07-07 01:27:58+00 (sole candidate — unambiguous)

This is a V-3 fast-fix follow-on; its `wave_id` was reset to NULL so it is seedable (fixing the
recurring milestone-followup-strands papercut).

## Action 2 — Siblings

`parent_task_id = cc783559 AND status='todo' AND wave_id IS NULL` → **0 rows.** Single-task bundle
(valid). Expected: cc783559 is a standalone follow-on.

## Action 3 — Validation

Re-confirmed against DB for the claimed set:

| Check | cc783559 |
|---|---|
| status = 'todo' | PASS |
| wave_id IS NULL | PASS |
| milestone_id = M14 (6a9424fe) | PASS |
| parent_task_id IS NULL (seed) | PASS |

Validation: **pass.** No concurrent-write race.

## Action 5 — claimed_task_ids

`claimed_task_ids = [cc783559-b181-4c65-ab57-de07a9e551e0]`

Propagates to N-3 handoff, B-0 claim batch (wave-70), and L-2 close batch.

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle is WIP-limited to one seed + zero siblings — no bloat. Seed has parent_task_id IS NULL;
    no sibling depends on an unbuilt later sibling (there are none). All bundled columns validated:
    milestone_id=M14, wave_id=NULL, status='todo'. The bundle was authored by the milestone-decomposer
    ritual in a prior wave (not hand-INSERTed here). Thin-by-design; wave-70 P-1 RESCOPE-AUTO-MERGE
    enriches it.
  next_action: PROCEED_TO_N-3
```

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: cc783559-b181-4c65-ab57-de07a9e551e0"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: cc783559-b181-4c65-ab57-de07a9e551e0
seed_task_title: "Suppress the Report affordance on the viewer's own member row"
bundled_sibling_ids: []
claimed_task_ids: [cc783559-b181-4c65-ab57-de07a9e551e0]
active_milestone_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
queue_exhausted: false
validation_failed: false
note: "Single-task bundle (V-3 follow-on). wave-70 P-1 RESCOPE-AUTO-MERGE expected to expand M14 scope."
```
