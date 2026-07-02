# N-2 — Seed (wave-32)

## Action 1 — Pick the seed

Query (N-2 Action 1, roadmap-lifecycle line 214):
```sql
SELECT id FROM tasks
WHERE milestone_id='8702a335-90ec-40ff-8c7d-a91bb7790a27'
  AND status='todo' AND wave_id IS NULL AND parent_task_id IS NULL
ORDER BY created_at LIMIT 1;
```
**Result: 0 rows.** The only open M6 top-level `todo` task, a2dd9f3d, has `wave_id = d25f8c47` (wave-32), so the `wave_id IS NULL` clause excludes it.

## Action 4 — Empty-queue / invalid-seed path

This is the empty-queue path, reached NOT because the queue is genuinely empty but because the sole candidate cannot satisfy the seed contract:

- a2dd9f3d is a wave-32 V-2 follow-up (F-32-T-8-1, jenny spec-gap) INSERTed with `milestone_id=M6` AND `wave_id=d25f8c47` per line 90.
- Its scope (malformed non-UUID channelId → 400 instead of 500) is genuinely unshipped — 78f51968's ACs cover only the happy-path 200 + RBAC gate, not the UUID-cast hardening.
- No stage clears `wave_id` (line 156); N-3 closes only the `waves` row. So a2dd9f3d can never surface to this picker as authored.
- Verified: no milestone-scoped, top-level, `todo` task with a non-NULL `wave_id` has ever been picked as a seed in this project.

N-2 cannot emit a valid `claimed_task_ids`. This is a hard-stop, not a routine queue-exhausted state (N-1 could not fire decomposition to fix it without risking duplicate M6 scope). Escalated to N-3 as `validation-failed` / `queue_exhausted` → loop pauses.

```yaml
n_stage_verdict: DEFERRED
verdict_evidence:
  - "seed task id: null"
  - "bundled siblings: 0"
  - "validation: failed (only M6 candidate a2dd9f3d fails wave_id IS NULL; unresolvable in-ritual)"
seed_task_id: null
seed_task_title: ""
bundled_sibling_ids: []
claimed_task_ids: []
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
queue_exhausted: true
validation_failed: true
note: "M6 candidate a2dd9f3d wave_id=d25f8c47 (wave-32) — excluded by seed picker; no clear-to-NULL writer. Latent lifecycle defect. Founder/BOARD ruling needed."
```

## head-next signoff

```yaml
head_signoff:
  verdict: REJECTED
  stage: N-2
  reviewers: {}
  failed_checks:
    - "proposed seed a2dd9f3d fails N-2 Action 1 (wave_id IS NULL); picker returns 0 rows for M6"
  rationale: "a2dd9f3d satisfies every seed clause except wave_id IS NULL (=d25f8c47). No stage clears wave_id. Cannot emit a wave-33 bundle. Rejected pending upstream lifecycle ruling."
  next_action: REWORK_N-2
```
