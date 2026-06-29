# N-2 — Seed (wave-3 → seeds wave-4)

Mode: automatic. head-next gating: APPROVED (PROCEED_TO_N-3).

## Actions

- **Action 1 — pick seed:** Two equivalent-status candidates (`2a655960` profile customization, `478e9d43` branch protection). Picked **`2a655960`** by reading prose (LLM re-order permitted when multiple candidates exist).
  - **Rationale:** `2a655960` is the natural M1 completion — it finishes the customizable-profile scope (`users` columns username/avatar_url/accent_color + profile GET/PATCH API + username uniqueness + FilesModule avatar upload + accent color) that the wave-3 frontend stubbed as display_name-only. Coherent full-stack feature; directly continues wave-3 (settings-profile page shell + display_name editing already shipped, live auth backend in place). It was the explicit RESCOPE-AUTO-SPLIT sibling deferred from wave-3 ("profile polish as the next wave" per founder decision recorded in the task `## Why`). Selecting it now closes that split.
  - **Deferred (recorded as near-term M1 backlog for subsequent waves):** `478e9d43` branch-protection (security: a security filter was direct-pushed bypassing CI this wave), `839af17f` auth rate-limiting (launch-blocker), `a1299e88` Resend-domain verification (real-user email delivery), `c51589cd` CI browser E2E. (`478e9d43` is the other live seed candidate; the rest carry wave_id provenance.) These remain `todo` under M1 and are re-selectable as future seeds.
- **Action 2 — load siblings:** `SELECT … WHERE parent_task_id='2a655960…'` → 0 rows. Single-task bundle (valid).
- **Action 3 — validate bundle:** re-confirmed `2a655960` → status=todo, wave_id IS NULL, milestone_id=M1, parent_task_id IS NULL. **Validation PASS.**
- **Action 5 — emit claimed_task_ids:** `[2a655960]`.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 2a655960-a429-432d-8633-e8f149368ca3"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 2a655960-a429-432d-8633-e8f149368ca3
seed_task_title: "Profile customization backend + avatar upload"
bundled_sibling_ids: []
claimed_task_ids:
  - 2a655960-a429-432d-8633-e8f149368ca3
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
queue_exhausted: false
validation_failed: false
note: "Single-task bundle (1 seed + 0 siblings); WIP-limit honored. Completes the M1 profile-module scope. wave_id stays NULL — B-0 of wave-4 claims + sets wave_id."
```
