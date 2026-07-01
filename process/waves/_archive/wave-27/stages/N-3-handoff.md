# N-3 — Handoff (wave-27 → wave-28)

head-next signoff: **APPROVED** (next_action: PROCEED_TO_wave-28_P-0).

## Actions

- **Action 1 — next wave + loop state:** current wave `27` → next `28`. No pause trigger fired (no `.loop-paused.yaml`, no `.loop-resume.yaml`, STATUS `RUNNING` unchanged, no hard-stop gate-verdict, no founder message; M5 park-or-key is a record-only founder-pending carry, not a measured pause per rule 13). `loop_state: ready`.
- **Action 2 — pre-create wave-28:** `process/waves/wave-28/` (blocks P/D/B/C/T/V/L/N + stages) + `checklist.md` seeded with seed `d058283d`, solo bundle, active M5.
- **Action 3 — this deliverable:** written before the Action 4 archive move so it archives with the wave.
- **Action 4 — archive:** `git mv process/waves/wave-27/ process/waves/_archive/wave-27/` (single move).
- **Action 5a — close wave row:** `UPDATE waves SET status='ok' WHERE id = (SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → closes wave_number 27 (`246e65b9-8358-4c06-b958-19b2db721a2a`). Trigger sets `ended_at`. Wave-28's `waves` row is NOT opened here — deferred to wave-28 P-0 Action 0a per rule 15.
- **Action 5b — loop-handoff anchor:** `process/session/.last-wave-completed.yaml` + `process/session/status-check.yaml` (current_wave 28, block P, stage P-0, STATUS RUNNING).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 28"
  - "next wave checklist: process/waves/wave-28/checklist.md"
  - "archive: process/waves/_archive/wave-27/ (git mv, single move)"
  - "waves row 27 (246e65b9) closed: status running->ok"
prev_wave: 27
next_wave: 28
loop_state: ready
seed_task_id: d058283d-a979-4528-9cd6-3ff48b4cfbc1
bundled_sibling_ids: []
claimed_task_ids: [d058283d-a979-4528-9cd6-3ff48b4cfbc1]
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "Clean single-move handoff. M5 stays in_progress (open=8, not closed). Exactly one handoff: wave-28 P-0 opened, no pause. Carry flag: invite-code rotation is owner-gated auth/security-adjacent (P-4 security gate may apply at wave-28)."

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    No premature close: M5 open=8, stays in_progress. Current wave closed via a single waves UPDATE
    (row 246e65b9, 27, running->ok, located via status='running') — exactly one running wave closed,
    no zombie. Entire wave-27 dir archived in one git mv. Exactly one handoff: wave-28 P-0 opened via
    .last-wave-completed.yaml + status-check.yaml; wave-28 waves row deferred to wave-28 P-0 Action 0a
    per rule 15. No pause written — loop_state=ready, all four measured triggers negative; M5
    park-or-key is a record-only carry, not a pause trigger. No orphaned state: canonical state in
    Postgres, wave dir in archive, carry flag travels via seed task identity.
  next_action: PROCEED_TO_wave-28_P-0
```
