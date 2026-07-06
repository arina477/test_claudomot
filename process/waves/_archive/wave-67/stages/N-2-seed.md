# N-2 — Seed (wave-67)

Block N (Next), stage 2 of 3. head-next gate: **APPROVED**.

## Actions

**Action 1 — Seed pick.** Query (`milestone_id=M11 AND status='todo' AND wave_id IS NULL AND parent_task_id IS NULL ORDER BY created_at LIMIT 1`) returned one row:
- `seed_task_id = 2bd37c4c-eca8-4eda-900b-0276fe46f1b3`
- `seed_task_title = "Publish-to-directory: let a server owner make their server public + set description/topic (the M11 write-half)"`

**Action 2 — Load siblings.** Query (`parent_task_id = 2bd37c4c AND status='todo' AND wave_id IS NULL`) returned **0 rows** → single-task bundle (valid). `bundled_sibling_ids = []`.

**Action 3 — Validate bundle.** Re-confirmed against DB (`WHERE id = ANY([2bd37c4c])`):
- `status = 'todo'` ✓
- `wave_id IS NULL` ✓
- `milestone_id = 8d88e691` (= active M11) ✓
- (no siblings to parent-check)
- **Validation: PASS.**

**Action 5 — Emit claimed_task_ids.** `claimed_task_ids = [2bd37c4c-eca8-4eda-900b-0276fe46f1b3]` — propagates to N-3 handoff, B-0 claim batch, L-2 close batch.

## Note on bundle sizing

The seed is a substantial write-half task (publish backend + owner settings UI + folded memberCount:0 fix F67-T5-1 + live-DB test). Per the per-wave decomposition model it remains a single top-level seed now; the **next wave's P-1** sizes/decomposes it (RESCOPE-AUTO-SPLIT into siblings if above the wave ceiling, or proceeds as-is). N-2 does not hand-decompose. WIP-limit respected: one seed, zero siblings.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 2bd37c4c-eca8-4eda-900b-0276fe46f1b3"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 2bd37c4c-eca8-4eda-900b-0276fe46f1b3
seed_task_title: "Publish-to-directory: let a server owner make their server public + set description/topic (the M11 write-half)"
bundled_sibling_ids: []
claimed_task_ids: [2bd37c4c-eca8-4eda-900b-0276fe46f1b3]
active_milestone_id: 8d88e691-5e39-492f-83a9-73a1a9440af3
queue_exhausted: false
validation_failed: false
note: "Single-task bundle. Next wave's P-1 sizes/decomposes the write-half seed."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Seed 2bd37c4c validated live: status=todo, wave_id NULL, milestone_id=M11, parent_task_id NULL.
    Siblings query returns zero → valid single-task bundle, WIP within limit. Not hand-INSERTed
    (pre-existing sole M11 open task; N-2 only identifies). claimed_task_ids=[2bd37c4c] emitted for
    B-0/L-2. Next wave's P-1 sizes/decomposes per the per-wave model. No bundle bloat.
  next_action: PROCEED_TO_N-3
```
