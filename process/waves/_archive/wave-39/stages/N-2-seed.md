# N-2 — Seed (wave-39)

Bundle picked under active milestone M7 `6e2f68d8`. Live-DB validated; N-2 identifies only,
never writes status/wave_id (B-0 of wave-40 claims the batch).

## Actions

- **Action 1 — pick seed:** single top-level candidate under M7 with `status='todo'`,
  `wave_id IS NULL`, `parent_task_id IS NULL` → `7525b759-33e7-480f-bdf5-5aedf4594c1d`
  "Harden avatar endpoints against malformed/edge input (two 500s → 4xx)".
  (Backend-only hardening of the two LOW 500s surfaced at wave-38 T-8: ParseUUIDPipe on
  `GET /users/:id/avatar`, catch missing-object on confirm. The only buildable seed —
  `a1299e88` Resend is `blocked`/founder-gated, not a candidate.)
- **Action 2 — siblings:** `parent_task_id = 7525b759` → 0 rows → **single-task bundle**.
  (`a1299e88` is not a sibling — it is `blocked` and parent-NULL, not under this seed.)
- **Action 3 — validate bundle `[7525b759]`:** status=`todo` ✓, wave_id `NULL` ✓,
  milestone_id=`6e2f68d8` ✓, parent_task_id `NULL` (top-level seed) ✓. **Validation PASS.**
- **Action 5 — claimed_task_ids:** `[7525b759-33e7-480f-bdf5-5aedf4594c1d]`.

WIP-limit honored: one seed, tight scope (two backend edge-case fixes), no bloat.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 7525b759-33e7-480f-bdf5-5aedf4594c1d"
  - "bundled siblings: 0 (single-task bundle)"
  - "validation: pass (todo / wave_id NULL / milestone_id=M7 / parent NULL)"
seed_task_id: 7525b759-33e7-480f-bdf5-5aedf4594c1d
seed_task_title: "Harden avatar endpoints against malformed/edge input (two 500s → 4xx)"
bundled_sibling_ids: []
claimed_task_ids: [7525b759-33e7-480f-bdf5-5aedf4594c1d]
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
queue_exhausted: false
validation_failed: false
note: "Single buildable seed under M7; Resend task a1299e88 excluded (blocked/founder-gated, not a sibling)."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: "Bundle WIP-limited to one seed + zero siblings. Seed has parent_task_id IS NULL; no sibling FK to sequence. All assignment columns correct against the live tasks table: milestone_id=M7, wave_id=NULL, status=todo. Not hand-INSERTed — 7525b759 is a pre-authored M7 child (V-2/decomposition provenance). No intra-bundle dependency risk (single task). The blocked Resend row is correctly excluded from the bundle."
  next_action: PROCEED_TO_N-3
```
