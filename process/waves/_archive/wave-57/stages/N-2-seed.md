# N-2 — Seed — wave-57

Mode: automatic. head-next gated APPROVED. Bundle validated live against Postgres.

## Actions

- **Action 1 — Pick seed:** `a1dda389-0bd8-4ac4-afc4-89355db9c5ca` — "Harden delete-any-message E2E: make 2-client fan-out a deterministic hard assertion". Chosen over the oldest-created `f8eb49c1` because it carries the highest residual value of the 5 low-value M8 candidates — converting a soft-check cross-client realtime fan-out into a deterministic hard assertion on a **moderation** feature is real test-quality work on a safety-relevant surface (source: wave-45 V-2 F2). `999a14d1` (pagination) deliberately NOT seeded — premature at zero users, explicit do-not-auto-drain.
- **Action 2 — Siblings:** none. Single-task bundle.
- **Action 3 — Validate:** live DB confirms `status=todo`, `wave_id IS NULL`, `milestone_id=84e17739…` (M8), `parent_task_id IS NULL`. Validation PASS.
- **Action 5 — claimed_task_ids:** `[a1dda389-0bd8-4ac4-afc4-89355db9c5ca]`.

Single-seed keeps WIP maximally disciplined given the tail is genuinely low-value.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: a1dda389-0bd8-4ac4-afc4-89355db9c5ca"
  - "bundled siblings: 0"
  - "validation: pass (status=todo, wave_id NULL, parent_task_id NULL, milestone_id M8)"
seed_task_id: a1dda389-0bd8-4ac4-afc4-89355db9c5ca
seed_task_title: "Harden delete-any-message E2E: make 2-client fan-out a deterministic hard assertion"
bundled_sibling_ids: []
claimed_task_ids: [a1dda389-0bd8-4ac4-afc4-89355db9c5ca]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "Single-seed bundle. 999a14d1 (pagination) not seeded — do-not-auto-drain. head-next gate: APPROVED."
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {head-next: APPROVED}
  failed_checks: []
  rationale: "Single-seed (a1dda389, 0 siblings) — WIP-disciplined, no bundle bloat. All four seed columns verified live. Task pre-authored by prior decomposition — claimed not INSERTed. Least-low-value candidate chosen; do-not-drain 999a14d1 correctly excluded."
  next_action: PROCEED_TO_N-3
```
