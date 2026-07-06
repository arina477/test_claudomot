# N-2 — Seed (wave-58 → wave-59 bundle)

Pick the next bundle under active milestone M8 for wave-59.

## Actions

- **Action 1 — Seed pick:** oldest drainable top-level `todo` child of M8 (`parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`, ORDER BY created_at LIMIT 1) → **f8eb49c1** ("Unit-test buildTypingLabel transition table (typing-indicator label)", created 2026-07-04 07:03). 999a14d1 (newest, do-not-auto-drain) correctly sorts last and is not picked.
- **Action 2 — Siblings:** 0 rows under f8eb49c1 → single-task bundle (valid).
- **Action 3 — Validate:** f8eb49c1 → status='todo', wave_id=NULL, milestone_id=84e17739 (M8), parent_task_id=NULL. All checks pass.
- **Action 5 — claimed_task_ids:** `[f8eb49c1]`.

## head-next gate

APPROVED (head-next agent, N-2).

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    All six N-2 stage-exit checks tick from the live-DB validation just run.
    Bundle is the tightest possible WIP unit — 1 seed (f8eb49c1), 0 siblings.
    Seed parent_task_id IS NULL; milestone_id=84e17739 (M8), wave_id=NULL,
    status='todo' all confirmed by the WHERE id=ANY([f8eb49c1]) validation query.
    wave_id=NULL is load-bearing (a non-NULL wave_id would strand the follow-up,
    never seedable) and is confirmed NULL. Dependency sequencing is N/A for a
    single-task bundle. The seed is a pre-existing M8 tail task (created
    2026-07-04 via prior decomposition), not a fresh hand-INSERT this wave —
    N-2 identifies only and writes no status. Oldest-drainable pick is correct:
    ORDER BY created_at LIMIT 1 yields f8eb49c1; the newer do-not-auto-drain
    999a14d1 sorts last and is durably excluded (created_at ordering + DB prose
    marker established at N-1). No bundle bloat, no out-of-ritual INSERT, no
    stale-state read. Milestone-close is deferred to N-3, not evaluated here.
  next_action: PROCEED_TO_N-3
```

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: f8eb49c1-5758-462d-93a7-60ca9e11d44b"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: f8eb49c1-5758-462d-93a7-60ca9e11d44b
seed_task_title: "Unit-test buildTypingLabel transition table (typing-indicator label)"
bundled_sibling_ids: []
claimed_task_ids: [f8eb49c1-5758-462d-93a7-60ca9e11d44b]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
queue_exhausted: false
validation_failed: false
note: >
  Single-task bundle. Oldest drainable M8 tail seed. 999a14d1 (getDmCandidates pagination)
  excluded — do-not-auto-drain per its DB prose + sorts last by created_at.
```
