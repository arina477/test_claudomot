# N-2 — Seed (wave-5 → wave-6)

Bundle picked under active milestone M1 `5a6efc9e-9de7-4594-a75d-d45e30d9a417`.

## Actions

- **Action 1 (pick seed):** oldest top-level claimable under M1 = `da242f6b-bce7-49c7-a7cc-69ca4849fc6e`
  — "Add a CI job that boots the compiled API (`node dist/src/main.js`) and curls `/health`". Sole seed
  candidate; LLM preference unambiguous (the only engineering-unblocked top-level todo; the other two M1
  open children are founder-ops — `a1299e88` is a sibling, `84e09891` is in_progress/claimed).
- **Action 2 (siblings):** none — `da242f6b` has no `todo`/`wave_id IS NULL` children. Single-task bundle (valid).
- **Action 3 (validate):** PASS. `da242f6b`: status=todo, wave_id=NULL, milestone_id=M1, parent_task_id=NULL.
  All four predicates hold.
- **Action 5 (claimed_task_ids):** `[da242f6b-bce7-49c7-a7cc-69ca4849fc6e]`.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: da242f6b-bce7-49c7-a7cc-69ca4849fc6e"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: da242f6b-bce7-49c7-a7cc-69ca4849fc6e
seed_task_title: "Add a CI job that boots the compiled API (node dist/src/main.js) and curls /health"
bundled_sibling_ids: []
claimed_task_ids: [da242f6b-bce7-49c7-a7cc-69ca4849fc6e]
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
queue_exhausted: false
validation_failed: false
note: >
  Single-task bundle finishing M1's last engineering loose end (compiled-dist boot probe — guards against
  the version.ts-style dist/runtime path regression that crashed wave-5's first C-2 deploy). No siblings.
  Pre-authored row (L-2 follow-up), not hand-INSERTed. head-next APPROVED N-2.
```

head_signoff (head-next): APPROVED — WIP-limited single seed (no bundle bloat); four validation predicates
pass; pre-existing row (no out-of-ritual INSERT); claimed_task_ids propagates clean to N-3 / B-0 / L-2.
