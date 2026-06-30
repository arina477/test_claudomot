# N-2 — Seed (wave-15 → wave-16)

## Actions

### Action 1 — Pick the seed
Oldest top-level `todo`, `wave_id IS NULL`, `parent_task_id IS NULL` under M3:
- **Seed:** `46f16288-4c13-4d8c-ad68-6925d1f51d84` — "Add browser E2E coverage for the authed create-server flow" (`created_at` 2026-06-29 17:27:03).

Three equivalent candidates exist (`46f16288`, `25523fb0`, `d058283d`); N-1 fired-and-failed decomposition so no feature seed exists to prefer. Per Action 1 ("when in doubt, take the oldest `created_at`") → `46f16288`. This is a legitimate scope-adjacent quality seed; the other two drain in subsequent waves.

### Action 2 — Load siblings
`SELECT ... WHERE parent_task_id='46f16288...' AND status='todo' AND wave_id IS NULL` → **no rows**. Single-task bundle (valid).

### Action 3 — Validate
`46f16288`: `status='todo'`, `wave_id` NULL, `milestone_id=6198650e...` (M3), `parent_task_id` NULL. → **PASS**.

### Action 5 — claimed_task_ids
`[46f16288-4c13-4d8c-ad68-6925d1f51d84]`

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 46f16288-4c13-4d8c-ad68-6925d1f51d84"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 46f16288-4c13-4d8c-ad68-6925d1f51d84
seed_task_title: "Add browser E2E coverage for the authed create-server flow"
bundled_sibling_ids: []
claimed_task_ids: [46f16288-4c13-4d8c-ad68-6925d1f51d84]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
queue_exhausted: false
validation_failed: false
note: "Single-task bundle. Seed is a carry-over create-server E2E coverage task (wave-7 V-3 carry + T-9 significant). Two further top-level tech-debt seeds (25523fb0, d058283d) remain queued for future waves; M3 threads/attachments feature decomposition deferred to a future N-1 once top-level todo count reaches 0."
```

---
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    WIP-limited to one seed + zero siblings — minimal viable next step, no bundle bloat.
    Seed has parent_task_id IS NULL; no siblings to sequence. Bundle re-validated against
    the live DB (status=todo, wave_id NULL, milestone_id=M3, parent_task_id NULL) — all
    pass. No out-of-ritual INSERT; the seed was already in the queue (authored as a prior
    V-3 carry follow-up, parent_task_id NULL = candidate seed, per roadmap-lifecycle
    § Bundles). claimed_task_ids populated for B-0/L-2.
  next_action: PROCEED_TO_N-3
