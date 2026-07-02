# N-2 — Seed (wave-36)

Pick the next bundle under M7 for wave-37. Seed + siblings authored by N-1's decomposition fire.

## Actions

- **Action 1 — Seed:** `0b33df33-fafb-4572-ba32-6a6450cf63a6` — "Add persistent in-app notifications model + read/list API" (`parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`, milestone M7). Only one seed candidate under M7 — no re-ordering needed.
- **Action 2 — Siblings:** `f3f52d9a-984a-44a4-9a82-293e90be93b7` (mark-notification-read endpoints), `edac03e0-be3c-4b89-b3c7-e9d367ec275b` (web notifications center). Both `parent_task_id = seed.id`, `wave_id IS NULL`, `status='todo'`.
- **Action 3 — Validate:** DB re-read confirmed all three rows: `status='todo'`, `wave_id IS NULL`, `milestone_id=6e2f68d8`, siblings `parent_task_id=0b33df33`. PASS.
- **Action 5 — claimed_task_ids:** `[0b33df33, f3f52d9a, edac03e0]` — dependency-sequenced seed → s1 → s2 (no forward deps). B-0 of wave-37 claims this batch; L-2 closes it.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 0b33df33-fafb-4572-ba32-6a6450cf63a6"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: 0b33df33-fafb-4572-ba32-6a6450cf63a6
seed_task_title: "Add persistent in-app notifications model + read/list API"
bundled_sibling_ids:
  - f3f52d9a-984a-44a4-9a82-293e90be93b7
  - edac03e0-be3c-4b89-b3c7-e9d367ec275b
claimed_task_ids:
  - 0b33df33-fafb-4572-ba32-6a6450cf63a6
  - f3f52d9a-984a-44a4-9a82-293e90be93b7
  - edac03e0-be3c-4b89-b3c7-e9d367ec275b
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
queue_exhausted: false
validation_failed: false
note: "Tight WIP-limited bundle: 1 seed + 2 siblings, all credential-independent."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: "Bundle WIP-limited to one seed + 2 tightly-scoped siblings. Seed parent_task_id IS NULL; both siblings parent_task_id = seed.id. Every row milestone_id=M7, wave_id=NULL, status='todo'. Dependencies sequenced (model → read-endpoints → web center); no sibling depends on unbuilt later work. Authored by the milestone-decomposer ritual, DB-validated. Not hand-INSERTed."
  next_action: PROCEED_TO_N-3
```
