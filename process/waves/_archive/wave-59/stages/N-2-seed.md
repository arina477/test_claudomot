# N-2 — Seed (wave-59)

Per N-1: HOLD M8 in_progress; seed the oldest drainable M8 tail item (loop-preserving while M12/M9 sit as founder-direction flags). All queries against live Postgres this turn.

## Action 1 — Pick the seed
```
SELECT id, title FROM tasks
WHERE milestone_id='84e17739-af5e-4396-beb9-b6f3d6836fc4'
  AND status='todo' AND wave_id IS NULL AND parent_task_id IS NULL
ORDER BY created_at LIMIT 1;
→ 5bcbd27f — "DM off-token surface substitutions (server rail / picker modal / disabled-send)"
```
Oldest seedable (created 2026-07-04 12:25:45). 874bd233 (14:40) is the later drainable; 999a14d1 (2026-07-06) is do-not-auto-drain (wave-56 deferral) and is NOT picked.

`seed_task_id = 5bcbd27f`, `seed_task_title = "DM off-token surface substitutions (server rail / picker modal / disabled-send)"`.

## Action 2 — Load siblings
```
SELECT id, title FROM tasks WHERE parent_task_id='5bcbd27f-...' AND status='todo' AND wave_id IS NULL;
→ 0 rows
```
`bundled_sibling_ids = []` → single-task bundle (valid).

## Action 3 — Validate the bundle
```
SELECT id, status, wave_id, milestone_id, parent_task_id FROM tasks WHERE id = ANY(ARRAY['5bcbd27f-...']::uuid[]);
→ 5bcbd27f | todo | NULL | 84e17739 (M8) | NULL
```
Per-row: status='todo' ✓, wave_id IS NULL ✓, milestone_id=active M8 ✓, parent_task_id IS NULL ✓ (seed). **Validation PASS.**

## Action 5 — claimed_task_ids
`claimed_task_ids = [5bcbd27f]`. Propagates to N-3 handoff (`next_wave_claimed_task_ids`), B-0 (claim batch), L-2 (close batch).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 5bcbd27f-16f3-4928-a535-c4104da34a19"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 5bcbd27f-16f3-4928-a535-c4104da34a19
seed_task_title: "DM off-token surface substitutions (server rail / picker modal / disabled-send)"
bundled_sibling_ids: []
claimed_task_ids: [5bcbd27f-16f3-4928-a535-c4104da34a19]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "Single-task bundle. Oldest drainable M8 tail item; loop-preserving while M12 (offline-first) + M9 (paid plans) sit as soft founder-direction flags. 999a14d1 (do-not-auto-drain) untouched."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Single-task bundle seeded on 5bcbd27f, the oldest drainable M8 tail task
    (created 2026-07-04 12:25:45), validated against live Postgres this turn. All
    seven N-2 exit checks pass: WIP-limit honored (1 seed + 0 siblings, no bloat);
    seed carries parent_task_id IS NULL, status='todo', wave_id IS NULL,
    milestone_id=84e17739 (active M8); no intra-bundle dependencies; provenance
    clean — 5bcbd27f is a pre-existing M8 tail from a prior V-2/decomposition
    follow-up and N-2 only IDENTIFIES it (no out-of-ritual INSERT this wave);
    strand guard satisfied (wave_id IS NULL); and the do-not-auto-drain task
    999a14d1 is correctly excluded and untouched. Consistent with the N-1 verdict
    to HOLD M8 and drain its tail.
  next_action: PROCEED_TO_N-3
```
