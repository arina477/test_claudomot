# N-3 — Handoff (wave-65 → wave-66)

Mode: `automatic`. No rule-13 pause trigger fired → **NO pause**. Loop continues.

## Actions

- **Action 1 — next wave / loop state:** next wave = **66**. `queue_exhausted=false`, no ritual deferred to founder → `loop_state: ready`. Wave counter increments.
- **Action 2 — pre-create wave-66:** `process/waves/wave-66/blocks/{P,D,B,C,T,V,L,N}` + `stages/` created; `process/waves/wave-66/checklist.md` pre-filled (seed 6018bdee, no siblings, active milestone M12). No `.loop-paused.yaml` written (no pause).
- **Action 3 — this deliverable** written before the archive move.
- **Action 4 — single-move archive:** `git mv process/waves/wave-65/ → process/waves/_archive/wave-65/` in one move; uncommitted wave-65 process deliverables (N-block stages + checklist) staged in the same commit so `main` is clean.
- **Action 5a — close wave-65 `waves` row:** `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → RETURNING `wave_number=65`.
- **Action 5b — loop-handoff anchor:** `process/session/.last-wave-completed.yaml` overwritten with the wave-66 handoff snapshot.

## head-next gate — N-3

Stage-exit checklist:
- [x] no unshipped AC before a milestone `done` transition — N/A (M12 NOT marked done; open>0, scope unshipped). No premature close.
- [x] current wave closed via single `waves` UPDATE (found by `status='running'`).
- [x] entire wave directory archived in one move to `_archive/wave-65/`.
- [x] handoff opens the next wave's P-0 (wave-66 checklist created) — pause NOT written. Exactly one of {open P-0, pause}.
- [x] pause written ONLY on a measured condition — none fired → no pause (no anticipatory pause).
- [x] pause_evidence N/A (not pausing).
- [x] no orphaned wave-scoped state — next P-0 recovers everything from DB (`waves`, `tasks`, `milestones`) + archive + `.last-wave-completed.yaml`.

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Clean single-move archive of wave-65; wave-65 waves row closed via the single UPDATE
    (RETURNING wave_number=65). M12 correctly NOT closed (unshipped conflict-resolution UI clause).
    Next wave 66 opened with seed 6018bdee — no pause written because no measured rule-13 trigger
    fired (STATUS RUNNING unchanged, no .loop-paused.yaml/.loop-resume.yaml, no founder message, no
    hard-stop verdict). Exactly one handoff action taken (open P-0). All cross-wave state lives in the
    DB + archive + .last-wave-completed.yaml; nothing orphaned.
  next_action: PROCEED_TO_P-0  # wave-66

n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 66"
  - "next wave checklist: process/waves/wave-66/checklist.md"
  - "archive commit: see chore commit in wave-65 archive move"
  - "waves row closed: wave_number=65 status=ok"
prev_wave: 65
next_wave: 66
loop_state: ready
seed_task_id: 6018bdee-1b99-47b2-8235-b3786c29c2d5
bundled_sibling_ids: []
claimed_task_ids: [6018bdee-1b99-47b2-8235-b3786c29c2d5]
active_milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "No pause — no measured rule-13 trigger. M12 stays in_progress (conflict-resolution UI clause + blocked assignment-media leg remain). Conflict-resolution UI deferred to deliberate P-0/founder framing."
```
