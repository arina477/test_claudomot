# N-3 — Handoff (wave-40)

## Actions

- **Action 1 — Next wave number + loop state:** current wave `40`. Loop PAUSES: N-2 emitted `queue_exhausted: true` and no ritual is in-flight that will produce work (decomposition correctly not fired; the sole open M7 scope is founder-credential-blocked). Do NOT increment the wave counter. `next_wave: paused`.
- **Action 2 — Pause marker:** did NOT pre-create a next-wave directory. Wrote `process/session/.loop-paused.yaml` (paused_reason: founder-credential-fork; the two-path fork; resume conditions). Resume counterpart written by the Studio Brain Worker into `.loop-resume.yaml` when the founder answers.
- **Action 3 — This deliverable:** written before Action 4 so it archives with the wave.
- **Action 4 — Archive:** `git mv process/waves/wave-40/ process/waves/_archive/wave-40/`, commit `chore: N-3 archive wave-40`, pushed to `main`.
- **Action 5a — Close wave row:** `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1) RETURNING wave_number;` → returned `40`. `ended_at` auto-set by trigger.
- **Action 5b — Loop-handoff anchor:** wrote `process/session/.last-wave-completed.yaml` (last_wave=40, next_wave=paused, loop_state=paused, active_milestone M7 in_progress, pause block).

## Verdict

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: paused"
  - "archive commit: chore: N-3 archive wave-40 (see git log on main)"
  - "wave row closed: waves.status='ok' RETURNING wave_number=40"
prev_wave: 40
next_wave: paused
loop_state: paused
seed_task_id: null
bundled_sibling_ids: []
claimed_task_ids: []
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: >
  Founder-credential-fork PAUSE. M7 HELD in_progress (last H1 / MVP-completing milestone;
  open_count=1, sole open row a1299e88 founder-credential-blocked, non-terminal → not
  closeable). wave-40 (avatar hardening: 2 LOW 500s→4xx) shipped LIVE + all gates APPROVED.
  STATUS: BLOCKED written, trigger f-loop-paused-yaml, measurement shape board-escalation
  (precedent-application of wave-37 N-1-m7-disposition BOARD 7/7 APPROVE Option A). Loop
  terminal until founder resumes (edit STATUS: RUNNING or answer via .loop-resume.yaml).

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Every N-3 exit check ticked. M7 not closed (unshipped, founder-gated AC — no premature
    milestone close). Current wave closed via the single waves UPDATE (RETURNING wave_number=40
    — no zombie running wave). Entire wave directory archived in one git mv. Exactly ONE handoff
    outcome: a measured pause (NOT open-next-P-0 too, NOT neither). Pause written ONLY on a measured
    condition — queue-exhausted-under-active-milestone with a founder-reserved fork, carrying the
    wave-37 BOARD 7/7 precedent — NOT anticipatory. No wave state orphaned: the two paths + the
    blocked task recover from the DB (tasks WHERE milestone_id=6e2f68d8 AND status='blocked') +
    .last-wave-completed.yaml + .loop-paused.yaml + the archive.
  next_action: ESCALATE_TO_founder
```
