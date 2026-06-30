# N-2 — Seed (wave-14 → seeds wave-15)

Mode: `automatic`. head-next owns this block.

## Actions

- **Action 1 — Pick the seed:** The literal "oldest top-level todo under M3" returns the 3 parked tech-debt rows first by `created_at` (2026-06-29). Per N-2 Action 1, LLM re-orders when multiple candidates exist: parked tech-debt is NOT M3's next feature slice. The just-decomposed @mentions seed `3d238446` (created 2026-06-30) is the intended wave-15 seed. → **seed = `3d238446-25b9-4c3d-91ca-0fc3dbae17f2`** (Implement @mention parsing, persistence, and realtime fan-out).
- **Action 2 — Load siblings:** `cd585f04` (composer member-picker autocomplete), `c3f3f62a` (render mention pills + unread-mention affordance). 2 siblings.
- **Action 3 — Validate bundle:** all 3 rows confirmed `status='todo'`, `wave_id IS NULL`, `milestone_id=6198650e…`; siblings carry `parent_task_id=3d238446`. **PASS.**
- **Action 5 — claimed_task_ids:** `[3d238446, cd585f04, c3f3f62a]`.

Dependency sequencing: seed (backend parse/persist/fan-out) is foundational; both siblings consume it; no sibling depends on an unbuilt later sibling. WIP-limited (1 seed + 2 tight siblings, ~2200 LOC).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 3d238446-25b9-4c3d-91ca-0fc3dbae17f2"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: 3d238446-25b9-4c3d-91ca-0fc3dbae17f2
seed_task_title: "Implement @mention parsing, persistence, and realtime fan-out"
bundled_sibling_ids: [cd585f04-c1d5-48b2-9d45-d01ecd3ae15f, c3f3f62a-86c3-41cd-ba14-ce5e731e2d37]
claimed_task_ids: [3d238446-25b9-4c3d-91ca-0fc3dbae17f2, cd585f04-c1d5-48b2-9d45-d01ecd3ae15f, c3f3f62a-86c3-41cd-ba14-ce5e731e2d37]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
queue_exhausted: false
validation_failed: false
note: "Seed re-ordered past 3 parked tech-debt top-level todos (waves 7/9) per N-2 Action 1 LLM-reorder allowance — they are not M3's next feature slice. @mentions bundle is the next-most-valuable M3 slice authored by milestone-decomposer this tick."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: "Bundle WIP-limited to 1 seed + 2 tightly-scoped siblings. Seed has parent_task_id IS NULL; both siblings parent_task_id = seed.id. All carry milestone_id=M3, wave_id=NULL, status=todo. Dependencies sequenced — seed before consumers. Authored by milestone-decomposer ritual, not hand-INSERTed. Validation passed against live DB."
  next_action: PROCEED_TO_N-3
```
