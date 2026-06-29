# N-2 — Seed (wave-7 → wave-8 bundle)

Block N (Next), stage N-2. Mode: `automatic`. head-next owns the block.

## Actions

- **Action 1 — pick the seed:** the strict `ORDER BY created_at LIMIT 1` would return 46f16288 (a tech-debt follow-up). Per N-2 Action 1's explicit LLM re-ordering allowance ("prefer whichever the milestone scope needs next"), the seed is the fresh decomposition output `c7443638` "Build two-tier server invite backend (ad-hoc invites + permanent code)" — the invites/join feature slice the M2 success metric needs next. The 3 tech-debt rows (46f16288, 4a2ad286, 25523fb0) remain as unassigned M2 follow-ups (`wave_id IS NULL`) for a later bundle.
- **Action 2 — load siblings:** 3 siblings under c7443638 — 77e2041a (invite-preview + join-server membership API), 72fc08ea (invite-join page with preview + join flow), 54407e1d (invite-create + share UI entry point in app shell).
- **Action 3 — validate bundle (DB re-confirm):** PASS. All 4 rows: `status='todo'`, `wave_id IS NULL`, `milestone_id=41e61975-…`; seed `parent_task_id IS NULL`; each sibling `parent_task_id = c7443638`.
- **Action 5 — emit claimed_task_ids:** `[c7443638, 77e2041a, 72fc08ea, 54407e1d]`.

Dependency sequencing (no forward deps): seed (invite table + minting) → 77e2041a (consumes invite table/code for preview+join) → 72fc08ea (invite-join page consumes the join API); 54407e1d (share UI) depends only on the seed's create/rotate endpoints. B-block sequences implementation.

## head-next gating verdict

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle limits WIP to one seed + 3 tightly-scoped siblings, all on the invites/join slice.
    Seed has parent_task_id IS NULL; every sibling has parent_task_id = seed.id. Every bundled
    task carries milestone_id = M2, wave_id = NULL, status = 'todo' (DB-confirmed). Dependencies
    sequenced with no forward references. Bundle authored by the milestone-decomposer ritual,
    not hand-INSERTed. RBAC/roles, kick/ban, server-settings deliberately excluded (later bundles).
  next_action: PROCEED_TO_N-3
```

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: c7443638-a32f-460c-887f-ecd575f2cede"
  - "bundled siblings: 3"
  - "validation: pass"
seed_task_id: c7443638-a32f-460c-887f-ecd575f2cede
seed_task_title: "Build two-tier server invite backend (ad-hoc invites + permanent code)"
bundled_sibling_ids:
  - 77e2041a-198d-48a1-bc95-6900bd03ec44
  - 72fc08ea-610c-4244-b747-218e3efbc5ae
  - 54407e1d-1936-458d-b586-0d49d9cf9482
claimed_task_ids:
  - c7443638-a32f-460c-887f-ecd575f2cede
  - 77e2041a-198d-48a1-bc95-6900bd03ec44
  - 72fc08ea-610c-4244-b747-218e3efbc5ae
  - 54407e1d-1936-458d-b586-0d49d9cf9482
active_milestone_id: 41e61975-c92e-49b1-9ae5-45498dd04925
queue_exhausted: false
validation_failed: false
note: "wave-8 = M2 invites + join-flow bundle. 3 M2 tech-debt follow-ups remain unassigned for a future bundle."
```
