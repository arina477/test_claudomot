# N-3 — Handoff (wave-61)

Mode: `automatic`. Block-exit stage. N-1 = STOCKOUT → founder-checkpoint; N-2 = queue-exhausted. This N-3 closes + archives wave-61 and writes a MEASURED pause (not anticipatory).

## Action 1 — Next wave number + loop state

Current wave = 61. Loop **PAUSES** — N-2 emitted `queue_exhausted: true` AND no ritual is in-flight that will produce autonomous work (M8 drainable-exhausted; M9/M12 founder-reserved & non-promotable; 13-todo unassigned queue not N-2-seedable; todo milestones exist so no roadmap-planning). The only meaningful next step is the founder's M9-vs-M12 direction call.

→ `next_wave: paused`. Wave counter NOT incremented. No `wave-62/` directory created.

## Action 2 — Pause marker (NOT next-wave dir)

Wrote `process/session/.loop-paused.yaml` with `paused_reason: queue-exhausted`, resume conditions = founder direction answer. N-3 writes only the pause side; the resume counterpart (`.loop-resume.yaml`) is worker-authored when the founder answers.

## Action 3 — This deliverable

Written before the archive move so it archives with the wave.

## Action 4 — Single-move archive

`git mv process/waves/wave-61/ process/waves/_archive/wave-61/` + commit. Archive commit SHA recorded below.

## Action 5 — Final state emission

**5a. Close wave row.** `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1) RETURNING wave_number;` → wave-61 (sole running row, id 32cd63cc). `'ok'` even on pause-loop (the wave itself completed). Trigger auto-sets `ended_at`.

**5b. Loop-handoff anchor.** `.last-wave-completed.yaml`: last_wave=61, next_wave=paused, loop_state=paused, empty claimed list, M8 in_progress.

## Deliverable

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: paused"
  - "archive commit: <see status file / commit SHA below>"
  - "waves close: wave-61 (32cd63cc) status running→ok, RETURNING wave_number=61"
  - "pause: STATUS: BLOCKED + .loop-paused.yaml (measured stockout, trigger f/board-escalation)"
prev_wave: 61
next_wave: paused
loop_state: paused
seed_task_id: null
bundled_sibling_ids: []
claimed_task_ids: []
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "GENUINE STOCKOUT → founder-checkpoint. M8 stays in_progress (999a14d1 retained deferral, NOT closed). No next-wave opened — exactly one disposition = measured pause. Founder decision awaiting: M9 (Monetization/pricing, founder-reserved) vs M12 (Offline-first moat, highest-value autonomous direction, needs founder blessing + rough success metric) vs 'keep polishing'. Foregrounded at process/session/updates/checkpoint-2026-07-06-m8-tail-vs-m12-offline-first.md."
```

## head-next N-3 signoff

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: { head-next: APPROVED }
  failed_checks: []
  rationale: "See head-next verdict block (appended after archive + close)."
  next_action: ESCALATE_TO_founder
