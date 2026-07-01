# N-1 — Survey & triggers (wave-31)

All signals read from the live Postgres tables (`milestones` / `tasks` / `waves`) via psql this turn — not from any sidecar or bash-var hand-off (SCHEMA.md § current-wave anchor + recipes). Mode: `automatic`.

## Survey phase (Actions 0–5)

- **Action 0 — head-next spawned** for the N-block lifetime (`subagent_type: head-next`); ACK received; gated all three stages APPROVED.
- **Action 1 — Active milestone:** exactly ONE `in_progress` row → M6 `8702a335-90ec-40ff-8c7d-a91bb7790a27` "Voice/video study rooms". Invariant holds (at most one in_progress).
- **Action 2 — `todo` queue (7):** M7 privacy/launch (`6e2f68d8`, head), M8 educator (`84e17739`), M9 monetization (`3e507bc0`), M10 compliance (`97d65b49`), M11 growth (`8d88e691`), M12 offline-moat (`36378340`), M13 institutions (`b7400254`). `next_todo_id = M7 (6e2f68d8)`.
- **Action 3 — M6 child-task summary:** `open_count=1`, `done_count=2`, `seed_candidates=1`, total=3.
  - done: `d8a85de0` VoiceModule LiveKit token-mint (seed, done, wave=31); `1dd1f2ca` client join surface (sibling of d8a85de0, done, wave=31).
  - seed candidate (open): `78f51968` "Add who's-in-room voice occupancy indicator" — status=todo, wave_id NULL, parent_task_id NULL (top-level, unclaimed).
- **Action 4 — Unassigned queue depth:** 12.
- **Action 5 — reserved:** no action.

## Trigger phase (Actions 6–10)

- **Action 6 — Closure check:** M6 `open_count=1` (≠0). Even setting that aside, LLM scope judgment on M6 prose: `## Success metric` = "students drop in + talk + screen-share + degrade to audio-only gracefully" — NOT met (only token-mint + join shipped this slice). `## Scope` items still unshipped: drop-in room (mic/cam/screen-share/audio-fallback/presence-rings) + who's-in-room occupancy. → M6 does **NOT** close. Stays `in_progress`. (Guards premature-milestone-close.)
- **Action 7 — Per-wave decomposition:** `seed_candidates=1` (≠0) → does **NOT** fire. A seed already exists (`78f51968`); N-2 will pick it. No out-of-ritual INSERT.
- **Action 8 — Promotion + stockout:** `active_milestone != null` → no promotion, no stockout cascade.
- **Action 9 — Daily-checkpoint:** precondition "Action 7 found no seed candidate" is false (seed candidate exists) → does **NOT** fire. (No pipeline-stall risk: queue non-empty, buildable seed present.)
- **Action 10 — Route proposals:** none fired; nothing to route.

Clean N-1: no transitions, no rituals, no invariant violations.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 8702a335-90ec-40ff-8c7d-a91bb7790a27 (M6, in_progress)"
  - "todo queue head: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007 (M7)"
  - "active child tasks: open=1 done=2 seed_candidates=1"
  - "unassigned queue depth: 12"
  - "closure: none (M6 metric not met, scope unshipped)"
  - "promotion: none"
  - "decomposition fired: false"
  - "rituals fired: []"
prev_wave: 31
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
active_milestone_child_summary:
  open: 1
  done: 2
  seed_candidates: 1
next_todo_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
unassigned_queue_depth: 12
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "M6 stays in_progress — first voice slice (token-mint + join) shipped LIVE; occupancy + drop-in-room/screen-share/audio-fallback are future M6 waves. Seed for wave-32 = 78f51968."
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from live tasks this turn (no stale-state read). Trigger
    ladder walked top-to-bottom: closure correctly withheld (M6 open_count=1, metric
    unmet, scope unshipped — premature-close avoided, one-in_progress invariant holds);
    decomposition, promotion/stockout, checkpoint all correctly did not fire (a buildable
    seed 78f51968 exists, queue non-empty — no pipeline-stall). Clean N-1.
  next_action: PROCEED_TO_N-2
```
