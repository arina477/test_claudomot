# N-2 — Seed (wave-21 → seeds wave-22)

Pick the next bundle under the active milestone M5 — Academic tooling: assignments (`a5232e16`).

## Actions

### Action 1 — Pick the seed (LLM re-order applied)
M5's top-level `todo` / `wave_id IS NULL` / `parent_task_id IS NULL` candidate set has **7 rows**: 6 re-homed M3/M4 messaging/presence tech-debt (created 2026-06-29..06-30 earlier) + 1 freshly-authored assignments seed `01fcefb8` (created 2026-06-30 21:50, newest).

Naive oldest-first would surface invite-rotation debt `d058283d` — wrong for the assignments wave. **N-2 Action 1 LLM re-order authority applied** ("read prose, prefer whichever the milestone scope needs next"): wave-22 is the M5 academic-tooling/assignments wave; the 6 debt rows are independent backlog explicitly ruled out of the assignments arc by N-1 + the decomposer. **Seed selected: `01fcefb8` — "Implement assignments CRUD + per-member status spine."** This is the scope-aligned, decomposer-authored assignments-feature seed.

### Action 2 — Load siblings
`WHERE parent_task_id = '01fcefb8...' AND status='todo' AND wave_id IS NULL`:
- `916ecff7-713e-4a92-9061-cb40f7e2364e` — Build assignments-panel page + assignment-card primitive
- `a5f25f9b-1c24-4d02-824b-6234f98cce3a` — Test assignments CRUD + status spine (integration + E2E)

### Action 3 — Validate the bundle → PASS
| id | status | wave_id | milestone_id | parent_task_id | verdict |
|---|---|---|---|---|---|
| 01fcefb8 (seed) | todo | NULL | a5232e16 | NULL | pass |
| 916ecff7 (sib) | todo | NULL | a5232e16 | 01fcefb8 | pass |
| a5f25f9b (sib) | todo | NULL | a5232e16 | 01fcefb8 | pass |

All `status=todo`, `wave_id IS NULL`, `milestone_id = M5`; siblings' `parent_task_id = seed`. No race; validation passes.

### Action 5 — Emit claimed_task_ids
`claimed_task_ids = [01fcefb8-141e-4f65-b646-18005e780196, 916ecff7-713e-4a92-9061-cb40f7e2364e, a5f25f9b-1c24-4d02-824b-6234f98cce3a]`. Propagates to N-3 `.last-wave-completed.yaml`, B-0 (claim batch), L-2 (close batch).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 01fcefb8-141e-4f65-b646-18005e780196"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: 01fcefb8-141e-4f65-b646-18005e780196
seed_task_title: "Implement assignments CRUD + per-member status spine"
bundled_sibling_ids:
  - 916ecff7-713e-4a92-9061-cb40f7e2364e
  - a5f25f9b-1c24-4d02-824b-6234f98cce3a
claimed_task_ids:
  - 01fcefb8-141e-4f65-b646-18005e780196
  - 916ecff7-713e-4a92-9061-cb40f7e2364e
  - a5f25f9b-1c24-4d02-824b-6234f98cce3a
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
queue_exhausted: false
validation_failed: false
note: "Seed selected via N-2 Action 1 LLM re-order (assignments scope, not oldest-created); 6 re-homed debt rows left untouched as future-wave candidates."
```

## Exit criteria
- [x] Seed identified + siblings loaded.
- [x] Validation passed.
- [x] `claimed_task_ids` populated.
- [x] `n_stage_verdict: COMPLETE`.

## head_signoff
```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    WIP-limited bundle: one seed + 2 tightly-scoped siblings (assignments CRUD spine, its page/primitive,
    its tests) — no bloat (reminder/Resend arc deferred to a later M5 bundle). Seed has parent_task_id NULL;
    both siblings parent_task_id = seed.id; all carry milestone_id=M5, wave_id=NULL, status=todo. Dependencies
    sequenced (page + tests consume the CRUD spine; no sibling depends on an unbuilt later sibling). Bundle was
    authored by the milestone-decomposer ritual, not hand-INSERTed. Seed chosen by scope-need (N-2 Action 1),
    correctly avoiding the oldest-created re-homed debt row.
  next_action: PROCEED_TO_N-3
```
