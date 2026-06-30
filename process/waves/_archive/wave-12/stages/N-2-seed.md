# N-2 — Seed (wave-12 → wave-13)

Pick the next bundle under M3 for wave-13. Mode: `automatic`.

## Actions

**Action 1 — Pick the seed.** Candidates (top-level, `wave_id IS NULL`, `status='todo'`, under M3): 4 rows — 3 parked tech-debt (46f16288, 25523fb0, d058283d) + 1 fresh messaging-feature seed `e12886d7`. LLM re-ordering per N-2 Action 1: the milestone `## Scope` ordering needs the next messaging-feature slice, not the parked debt. Seed = `e12886d7-532b-4824-906a-7f336bacfd65` — "Implement message edit and delete with realtime fan-out". The 3 debt tasks have no siblings and are not the next scope-advancing slice; they remain parked future seeds.

**Action 2 — Load siblings.** `parent_task_id = e12886d7`, `wave_id IS NULL`, `status='todo'`:
- `d78df376-26e4-4569-b2d1-bb8c7bc81519` — "Add message reactions: toggle endpoint + realtime fan-out"
- `f323a71f-9047-426c-ab20-6f0e488460fd` — "Extend message UI for edit, delete tombstones, and reactions"

**Action 3 — Validate the bundle.** Re-confirmed against DB:
- `e12886d7`: status=todo, wave_id=NULL, milestone_id=6198650e…, parent_task_id=NULL ✓ (seed)
- `d78df376`: status=todo, wave_id=NULL, milestone_id=6198650e…, parent_task_id=e12886d7 ✓ (sibling)
- `f323a71f`: status=todo, wave_id=NULL, milestone_id=6198650e…, parent_task_id=e12886d7 ✓ (sibling)
Validation PASS. Dependencies sequenced: edit/delete backend → reactions backend → UI consumes both (no sibling depends on an unbuilt later sibling).

**Action 5 — claimed_task_ids:** `[e12886d7-532b-4824-906a-7f336bacfd65, d78df376-26e4-4569-b2d1-bb8c7bc81519, f323a71f-9047-426c-ab20-6f0e488460fd]`.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: e12886d7-532b-4824-906a-7f336bacfd65"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: e12886d7-532b-4824-906a-7f336bacfd65
seed_task_title: "Implement message edit and delete with realtime fan-out"
bundled_sibling_ids: [d78df376-26e4-4569-b2d1-bb8c7bc81519, f323a71f-9047-426c-ab20-6f0e488460fd]
claimed_task_ids: [e12886d7-532b-4824-906a-7f336bacfd65, d78df376-26e4-4569-b2d1-bb8c7bc81519, f323a71f-9047-426c-ab20-6f0e488460fd]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
queue_exhausted: false
validation_failed: false
note: "Bundle = M3 'complete the core message lifecycle' slice (edit/delete + reactions). Reuses MessagingModule + existing /messaging room-per-channel fan-out; no new namespace, no new auth surface."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    WIP-limited bundle (1 seed + 2 siblings, ~2200-2800 LOC, ~24-32 files — within the 1500-5000 LOC /
    <=60 file rubric). Seed parent_task_id IS NULL; both siblings parent_task_id = seed.id. All carry
    milestone_id=M3, wave_id=NULL, status=todo — confirmed against the live DB. Dependencies sequenced
    (no sibling depends on an unbuilt later sibling). Bundle authored by the milestone-decomposer ritual,
    not hand-INSERTed. claimed_task_ids populated for B-0 claim + L-2 close.
  next_action: PROCEED_TO_N-3
```
