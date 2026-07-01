# N-2 — Seed (wave-27)

head-next signoff: **APPROVED** (next_action: PROCEED_TO_N-3).

## Bundle pick (Actions 1–5, verified via psql)

- **Action 1 — seed:** oldest top-level `todo` under active M5 = `d058283d-a979-4528-9cd6-3ff48b4cfbc1` — "Rotate permanent server invite_code (owner-gated regenerate)" (created 2026-06-29). Chosen over the newer `d23a0740` (2026-06-30) by oldest `created_at`.
- **Action 2 — siblings:** `SELECT ... WHERE parent_task_id = d058283d AND status='todo' AND wave_id IS NULL` → **0 rows**. Solo-task bundle.
- **Action 3 — validation:** `d058283d` row = `status='todo'`, `wave_id=NULL`, `milestone_id=a5232e16` (M5 active), `parent_task_id=NULL` → all four checks **PASS**.
- **Action 5 — claimed_task_ids:** `[d058283d-a979-4528-9cd6-3ff48b4cfbc1]`.

## Carry flag for wave-28 P-0

`d058283d` touches invite-code regeneration (owner-gated) — an **auth/security-adjacent** surface. The P-4 security-scope-tightened gate may apply at wave-28. This is a carried flag only; N-block does NOT expand scope.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: d058283d-a979-4528-9cd6-3ff48b4cfbc1"
  - "bundled siblings: 0"
  - "validation: pass (status=todo, wave_id=NULL, milestone_id=M5, parent=NULL)"
seed_task_id: d058283d-a979-4528-9cd6-3ff48b4cfbc1
seed_task_title: "Rotate permanent server invite_code (owner-gated regenerate)"
bundled_sibling_ids: []
claimed_task_ids: [d058283d-a979-4528-9cd6-3ff48b4cfbc1]
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
queue_exhausted: false
validation_failed: false
note: "Solo-task bundle. Carry flag for wave-28 P-0: invite-code rotation is owner-gated auth/security-adjacent — P-4 security-scope-tightened gate may apply."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Solo seed (d058283d) with zero siblings — within the one-seed + 0-N-sibling WIP limit, no bloat.
    Seed selection correct: oldest top-level todo under active M5 (2026-06-29) over newer d23a0740.
    Action 3 validation passes on all four columns (parent NULL, status todo, wave_id NULL,
    milestone_id M5). Zero siblings makes dependency sequencing vacuously satisfied. Seed is a
    pre-existing ritual-authored top-level todo, not a hand-INSERT. Auth/security-adjacent invite-code
    carry flag correctly recorded for wave-28 P-0, not an N-block scope expansion.
  next_action: PROCEED_TO_N-3
```
