# Wave 22 — N-3 Handoff

## Loop state
Loop READY (not paused). N-2 produced a valid seed (8aa67564); no queue-exhaustion, no founder-deferred ritual.

## Next wave
- Wave 23 directory + checklist pre-created at `process/waves/wave-23/checklist.md`.
- Seed: 8aa67564 (manage_assignments permission split). 0 siblings. claimed_task_ids = [8aa67564].
- Active milestone M5 (a5232e16) stays in_progress.

## Archive + close
- wave-22 archived via single `git mv` → `process/waves/_archive/wave-22/`.
- waves row closed: status running → ok (wave_number 22).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 23"
  - "next wave checklist: process/waves/wave-23/checklist.md"
  - "archive commit: see chore: N-3 archive wave-22"
prev_wave: 22
next_wave: 23
loop_state: ready
seed_task_id: 8aa67564-a142-4628-b658-f020d4d2872c
bundled_sibling_ids: []
claimed_task_ids: [8aa67564-a142-4628-b658-f020d4d2872c]
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "M5 bundle 1 (assignments spine) shipped LIVE + verified + closed. Bundle 2 = manage_assignments authz split. Reminders deferred to founder Resend-key digest item."
```

## Exit
Wave 22 complete. → P-0 of wave 23.
