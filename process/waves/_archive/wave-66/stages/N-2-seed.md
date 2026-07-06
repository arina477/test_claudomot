# N-2 — Seed (wave-66)

Block: N (Next). Stage: N-2. Mode: `automatic`.

## Action 1 — pick the seed

Seed query (`parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`, under M12) returned **0 rows**. → jump to Action 4 (empty-queue path).

## Action 4 — empty-queue path

No seed exists because N-1 Action 7 did NOT fire decomposition — the only unshipped M12 clause (offline conflict-resolution UI) is ill-posed (no offline-EDIT surface exists; writes are an append-only outbox), so a decomposer spawn would return `incomplete-scope`. Under `automatic`, that incomplete-scope escalation is a founder-reserved milestone-disposition (Option A close-and-promote vs Option B build-net-new-edit-surface), routed to the founder by N-1. The loop pauses; there is no bundle to hand the next wave.

The single open M12 child `10e7543f` is `status='blocked'` (not `todo`) and is deliberately NOT a seed candidate — it is un-buildable (blocked on a non-existent online assignment-attachment view surface).

Emitting queue-exhausted. N-3 archives wave-66 and exits with `loop_state: paused` so P-0 does not spin on nothing.

## Deliverable

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: null"
  - "bundled siblings: 0"
  - "validation: skipped (queue exhausted)"
seed_task_id: null
seed_task_title: ""
bundled_sibling_ids: []
claimed_task_ids: []
active_milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
queue_exhausted: true
validation_failed: false
note: "Queue-exhausted by design: M12 has no buildable seed (seed_candidates=0; sole open child blocked/un-buildable). Upstream N-1 reason: incomplete-scope decomposition on ill-posed conflict-resolution clause → founder-reserved milestone-disposition. Loop pauses at N-3."
```

## head-next gate

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Seed query run against the live tasks table returned 0 rows — queue-exhausted is real, not a
    stale read. The blocked child 10e7543f is correctly excluded as a seed candidate (status='blocked',
    un-buildable). No bundle fabricated. Empty-queue path correctly records the upstream N-1
    founder-reserved disposition as the cause. claimed_task_ids empty; N-3 will pause the loop.
  next_action: PROCEED_TO_N-3
```
