# N-1 — Survey & triggers (wave-49)

Headless N-block execution (spawn-pattern; head-next owns the block). All survey
signals read from canonical Postgres (`milestones` / `tasks` / `waves`), not a
sidecar. Mode: `automatic`. No measured pause trigger fires (b/d/e/f all absent).

## Survey phase (Actions 1–4) — DB-verified

- **Action 1 — active milestone:** M8 — Educator tools & deeper academics
  (`84e17739-af5e-4396-beb9-b6f3d6836fc4`), `status='in_progress'`. Exactly one
  `in_progress` row — no invariant violation.
- **Action 2 — todo queue (no stockout):** 5 rows —
  M9 Monetization (`3e507bc0`), M10 Compliance (`97d65b49`),
  M11 Growth: server discovery (`8d88e691`), M12 Offline-first moat (`36378340`),
  M13 Institution partnerships (`b7400254`). `next_todo_id` not needed (active slot filled).
- **Action 3 — M8 child summary:** open=9, done=27, seed_candidates=9.
- **Action 4 — unassigned queue depth:** 13.

## Trigger phase (Actions 6–10) — nothing fires

- **Action 6 — closure check:** M8 open=9 > 0 → NO closure. M8 stays `in_progress`.
- **Action 7 — per-wave decomposition:** seed_candidates=9 > 0 → decomposition
  NOT needed. milestone-decomposer NOT spawned.
- **Action 8 — promotion / stockout:** active milestone present → no promotion;
  todo queue = 5 (non-empty) → no stockout cascade.
- **Action 9 — daily-checkpoint:** seed candidates exist → no checkpoint
  (unassigned depth 13 is orthogonal; not fired because a seed exists).
- **Action 10 — route:** no ritual proposals to route.

**Net: clean continuation. No rituals fire.**

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4 (M8, in_progress)"
  - "todo queue head: present (5 todo milestones — no stockout)"
  - "active child tasks: open=9 done=27 seed_candidates=9"
  - "unassigned queue depth: 13"
  - "closure: none (open_count=9 > 0)"
  - "promotion: none (active slot filled)"
  - "decomposition fired: false (seed_candidates=9 > 0)"
  - "rituals fired: []"
prev_wave: 49
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 9
  done: 27
  seed_candidates: 9
next_todo_id: null
unassigned_queue_depth: 13
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: >
  Clean continuation. Active milestone M8 retains 9 seed candidates after the
  orchestrator NULLed the 2 V-2 finding tasks' wave_id (tracked memory lesson:
  V-2 follow-up wave_id must be NULL for N-2 seed, else it strands). No measured
  pause trigger (b/d/e/f) present.
```

## Stage-exit checklist (head-next gate)

- [x] Next-claimable computed from live `tasks` (not sidecar/bash-var).
- [x] Exactly one trigger outcome selected: **next-task** (clean continuation) — firing
      condition: seed_candidates=9 > 0, active milestone present, todo queue non-empty.
- [x] Null-claimable → checkpoint rule N/A (claimable exists).
- [x] Decomposition not triggered (seed candidate present).
- [x] roadmap-planning not triggered (`todo` milestones exist).

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All four survey signals read from canonical Postgres and match the trigger
    ladder outcome. Exactly one outcome (clean continuation) with cited firing
    conditions. No pipeline-stall risk: a seed candidate exists so the loop
    advances to N-2 without a checkpoint or decomposition. No preemptive pause —
    no measured trigger fired under automatic mode.
  next_action: PROCEED_TO_N-2
```
