# N-2 — Seed (wave-51 → wave-52)

Pick the next bundle under active milestone M8 for wave-52. N-2 identifies only; never writes `status` (B-0 claims, L-2 closes).

## Actions

- **Action 1 — Pick the seed**: candidates are top-level M8 tasks (`parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`). 8 candidates exist (7 prior-slice DM-polish stragglers + the fresh focus-room seed `d123d9e0`). **Selected: `d123d9e0-bdcd-4815-91c5-ac90b6852997`** — "Add joinable focus-room surface + ephemeral join-presence backend". LLM re-order rationale (permitted by N-2 Action 1): the focus-room bundle is the **founder-directed study-group headline** — the ceo-reviewer BOARD seat recommended the joinable focus-room in BOTH wave-50 and wave-51 P-0. The 7 DM-polish stragglers are prior-slice V-2 debt deliberately kept un-seeded across waves 45-49; successive BOARD verdicts deferred them. The directed headline outranks debt. Decision documented in `product-decisions.md` (decomposer entry, commit d2bd9d0).

- **Action 2 — Load siblings**: `WHERE parent_task_id = d123d9e0 AND status='todo' AND wave_id IS NULL` → `aad849ac-3273-4a11-ad05-8efef1c5da87` + `ef84b378-df1d-4bf1-b669-6624d210170f`. Multi-task bundle (3 tasks).

- **Action 3 — Validate the bundle** (live DB re-confirm, all 3 ids):
  | id | status | wave_id | milestone_id | parent_task_id |
  |---|---|---|---|---|
  | `d123d9e0` (seed) | todo | NULL | M8 | NULL |
  | `aad849ac` (sib) | todo | NULL | M8 | `d123d9e0` |
  | `ef84b378` (sib) | todo | NULL | M8 | `d123d9e0` |
  All checks PASS: every task `todo`, `wave_id IS NULL`, `milestone_id = M8`; seed `parent_task_id IS NULL`; both siblings `parent_task_id = seed`. Validation: **pass**.

- **Action 5 — Emit claimed_task_ids**: `[d123d9e0, aad849ac, ef84b378]`. Propagates to N-3 handoff, B-0 claim batch, L-2 close batch.

Bundle is WIP-limited (1 seed + 2 tight siblings, presence-only slice-1). Multi-task bundle → wave-52 P-block sizes/specs (likely multi-spec; may split at P-1 — decomposer flagged `ef84b378` as the split point). That sizing is P-block's job, not N-2's.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: d123d9e0-bdcd-4815-91c5-ac90b6852997"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: d123d9e0-bdcd-4815-91c5-ac90b6852997
seed_task_title: "Add joinable focus-room surface + ephemeral join-presence backend"
bundled_sibling_ids:
  - aad849ac-3273-4a11-ad05-8efef1c5da87
  - ef84b378-df1d-4bf1-b669-6624d210170f
claimed_task_ids:
  - d123d9e0-bdcd-4815-91c5-ac90b6852997
  - aad849ac-3273-4a11-ad05-8efef1c5da87
  - ef84b378-df1d-4bf1-b669-6624d210170f
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: "head-next N-2 signoff APPROVED. Focus-room directed headline seeded over prior-slice DM stragglers (which stay seedable)."
```
