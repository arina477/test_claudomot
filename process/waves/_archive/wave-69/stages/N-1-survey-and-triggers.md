# N-1 — Survey & triggers (wave-69)

Combined survey + trigger evaluation for the M14 milestone state machine. All signals
re-read from live BRAIN Postgres (`$CLAUDOMAT_DB_URL`) — no sidecar / bash-var carry.

## Survey signals (Actions 1–4)

- **Action 1 — active milestone:** exactly 1 `in_progress` row → M14 (`6a9424fe-c943-4b26-9110-6915661a6fb9`, "Trust & Safety: moderation for public discovery"). No invariant violation (≤1 in_progress).
- **Action 2 — todo queue:** 3 `status='todo'` milestones exist → `next_todo_id` non-null (not needed; slot occupied).
- **Action 3 — M14 child summary:** open=1, done=3, seed_candidates=1.
- **Action 4 — unassigned queue depth:** 17.

Wave-69 shipped M14's FIRST bundle (report substrate + directory unlist + owner/mod
report-action loop via wave-41 ModerationService + report UI/inbox) — 3 tasks now done.

## Trigger evaluation (Actions 6–10)

| Trigger | Fired? | Firing condition cited |
|---|---|---|
| Closure (Action 6) | NO | `open_count=1 ≠ 0`; M14 launch-gate scope (block/appeals/admin-queue/review-queue) still unshipped. Milestone stays `in_progress`. |
| Per-wave decomposition (Action 7) | NO | Gated on `seed_candidates=0`; here `seed_candidates=1`. A live seed exists; N-2 picks it. Firing now would be an out-of-gate INSERT. |
| Slot promotion (Action 8a) | NO | Active slot occupied by M14. |
| Stockout cascade (Action 8b) | NO | `next_todo_id != null` (3 todo milestones). |
| Daily-checkpoint (Action 9) | NO | Requires `seed_candidates=0`; a seed candidate exists, so not triggered. |

**Verdict:** No trigger fires. The single existing seed candidate (`cc783559`, a V-3 fast-fix
follow-on whose `wave_id` was reset to NULL so it is seedable) becomes the wave-70 seed. The thin
single-task bundle is expected and self-healing: wave-70 P-1 RESCOPE-AUTO-MERGE will pull in more
M14 scope. Firing decomposition preemptively would violate the Action-7 `seed_candidates=0` gate.

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (not a sidecar). Exactly zero triggers fire,
    each with its condition cited against a re-queried signal. Null-claimable ladder N/A — a seed
    candidate exists. No todo-milestone stockout (3 exist). Decomposition correctly withheld (gated
    on seed_candidates=0, actual=1); the thin seed is handed to wave-70 P-1 RESCOPE-AUTO-MERGE.
  next_action: PROCEED_TO_N-2
```

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6a9424fe-c943-4b26-9110-6915661a6fb9 (M14, in_progress)"
  - "todo queue head: non-null (3 todo milestones)"
  - "active child tasks: open=1 done=3 seed_candidates=1"
  - "unassigned queue depth: 17"
  - "closure: none (open=1, scope unshipped)"
  - "promotion: none (M14 active)"
  - "decomposition fired: false (seed_candidates=1, Action-7 gates on 0)"
  - "rituals fired: []"
prev_wave: 69
active_milestone_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
active_milestone_child_summary:
  open: 1
  done: 3
  seed_candidates: 1
next_todo_id: present-not-needed
unassigned_queue_depth: 17
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "Thin single-task seed (cc783559) is expected; wave-70 P-1 RESCOPE-AUTO-MERGE enriches the bundle. No pause trigger fired."
```
