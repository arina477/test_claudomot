# N-3 — Handoff (wave-10 → wave-11)

Mode: automatic. head-next gate: APPROVED.

## Actions

- **Action 1 — next wave + loop state:** next_wave = 11. loop_state = ready. NO pause: none of the measured triggers (b STATUS change / d hard-stop verdict / e founder message / f .loop-paused.yaml) fired. M2 completion is a "natural break" — pausing on it with no measured trigger would be the forbidden anticipatory pause (rule 13). Proceed to wave-11 P-0.
- **Action 2 — pre-create:** `process/waves/wave-11/` dir tree + `checklist.md` created (seed 4a2ad286, M3 active, single-task bundle).
- **Action 3 — this deliverable** written before archive.
- **Action 4 — single-move archive:** `git mv process/waves/wave-10/ process/waves/_archive/wave-10/` + commit.
- **Action 5a — close wave row:** `UPDATE waves SET status='ok'` on the running wave-10 row (`abe06365…`). Runs after archive.
- **Action 5b — loop anchor:** `process/session/.last-wave-completed.yaml` overwritten.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 11"
  - "next wave checklist: process/waves/wave-11/checklist.md"
  - "archive commit: see git log (chore: N-3 archive wave-10)"
  - "wave-10 row closed: status=ok (RETURNING wave_number 10)"
prev_wave: 10
next_wave: 11
loop_state: ready
seed_task_id: 4a2ad286-c068-406b-a2b3-4fee2a4d528b
bundled_sibling_ids: []
claimed_task_ids: [4a2ad286-c068-406b-a2b3-4fee2a4d528b]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_status: in_progress
state_transitions_applied_this_wave:
  - {milestone: "M2 (41e61975…)", from: in_progress, to: done}
  - {milestone: "M3 (6198650e…)", from: todo, to: in_progress}
note: "M2 FEATURE-COMPLETE → done; M3 promoted (founder-pre-authorized M2→M3 core pivot). Wave-11 seed = verified-prod fixture (L escalation). 4 open M2 tasks reassigned to M3. No preemptive pause."
```
