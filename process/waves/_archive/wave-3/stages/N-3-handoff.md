# N-3 — Handoff (wave-3 close → wave-4 open)

Mode: automatic. head-next gating: APPROVED (PROCEED_TO_wave-4-P-0).

## Actions

- **Action 1 — next wave + loop state:** current wave = 3 → next = 4. No pause trigger: N-2 not queue-exhausted, no strict-mode founder defer (mode=automatic), no `.loop-paused.yaml` / `.loop-resume.yaml`, STATUS=RUNNING. **loop_state: ready.**
- **Action 2 — pre-create wave-4:** created `process/waves/wave-4/{blocks/{P,D,B,C,T,V,L,N},stages}` + `checklist.md` from the DISPATCHER ledger template; pre-filled seed `2a655960`, no siblings, active milestone M1.
- **Action 3 — this deliverable:** written before the archive move.
- **Action 4 — archive:** single `git mv process/waves/wave-3/ process/waves/_archive/wave-3/` + commit.
- **Action 5a — close wave row:** `UPDATE waves SET status='ok'` on the running row (`2fba4559…`, wave_number 3). Trigger sets `ended_at`. Runs after archive.
- **Action 5b — handoff anchor:** `.last-wave-completed.yaml` updated (loop_state ready, last_wave 3, next_wave 4, seed 2a655960).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 4"
  - "next wave checklist: process/waves/wave-4/checklist.md"
  - "archive commit: see chore: N-3 archive wave-3"
  - "wave-3 row closed: UPDATE waves status='ok' RETURNING wave_number=3"
prev_wave: 3
next_wave: 4
loop_state: ready
seed_task_id: 2a655960-a429-432d-8633-e8f149368ca3
bundled_sibling_ids: []
claimed_task_ids:
  - 2a655960-a429-432d-8633-e8f149368ca3
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "Clean single-move archive; one running wave closed; wave-4 P-0 opens next. No measured pause trigger fired — loop continues per automatic mode."
```
