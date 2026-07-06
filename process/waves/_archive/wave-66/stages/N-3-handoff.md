# N-3 — Handoff (wave-66)

Block: N (Next). Stage: N-3. Mode: `automatic`. Final stage of the wave loop.

## Action 1 — next wave number + loop state

wave-66 shipped cleanly (M12 offline empty-state copy polish; all gates APPROVED; merged d094f9c; deployed; L-block done — claimed task `6018bdee` done, commit a87066d). **The loop PAUSES** — N-2 emitted `queue_exhausted: true` and the upstream N-1 milestone-disposition is a founder-reserved strategic fork (rule-13 trigger `d`, measured structural hard-stop). Do NOT increment the wave counter; do NOT pre-create a next-wave directory.

## Action 2 — pause marker (no next-wave directory)

Not creating `wave-67/`. Writing `process/session/.loop-paused.yaml` with `paused_reason: decomposition-pending-founder` (the proximate cause: N-1 Action 7 incomplete-scope decomposition escalated to founder as a milestone-disposition). Founder-facing digest authored at `process/session/updates/`.

## Action 3 — this deliverable

Written before the Action 4 archive so it is archived with the wave.

## Action 4 — single-move archive

`git mv process/waves/wave-66/ → process/waves/_archive/wave-66/` + commit. (All wave-66 process deliverables were already committed in prior stages; this commit carries the N-block deliverables + the move.)

## Action 5 — final state emission

- **5a.** Close the wave-66 `waves` row: `UPDATE waves SET status='ok' WHERE id = (SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → expected `RETURNING wave_number = 66`.
- **5b.** `process/session/.last-wave-completed.yaml` with `next_wave: paused`, `loop_state: paused`, M12 snapshot (`in_progress`, unchanged).

## Deliverable

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: paused"
  - "pause marker: process/session/.loop-paused.yaml"
  - "founder digest: process/session/updates/milestone-disposition-M12-2026-07-06.md"
  - "archive commit: <sha recorded post-commit>"
prev_wave: 66
next_wave: paused
loop_state: paused
seed_task_id: null
bundled_sibling_ids: []
claimed_task_ids: []
active_milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "wave-66 shipped clean (M12 offline empty-state copy polish, merged d094f9c). Loop paused on a founder-reserved M12 milestone-disposition (seed-scarcity + ill-posed conflict-resolution clause). M12 unchanged (in_progress). Wave-66 row closed status='ok'. No ScheduleWakeup — BLOCKED is terminal until founder resumes."
```

## head-next gate

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    wave-66 closed cleanly regardless of the pause: single-move archive to _archive/wave-66/, the sole
    running waves row (wave 66) closed status='ok', .last-wave-completed.yaml written. Exactly ONE
    handoff outcome chosen — a measured pause (not both open-next-P-0 and pause; not neither). The pause
    cites rule-13 trigger d with an infra/structural measurement (board-escalation shape: founder-reserved
    milestone-disposition with no buildable seed). No wave-scoped state orphaned: M12 stays in_progress,
    the blocked child and all disposition context recover from the DB + archive + the founder digest.
    No anticipatory pause — the firing condition is the Action-7 incomplete-scope escalation the mode
    file routes to founder. No premature milestone close (M12 not marked done; success metric untouched).
  next_action: ESCALATE_TO_founder
```
