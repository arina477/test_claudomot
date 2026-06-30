# N-3 — Handoff (wave-15)

## Actions

- **Action 1 — next wave / loop state:** next wave = **16**. No pause condition: N-2 found a valid seed (not queue-exhausted); no ritual deferred to founder; mode is `automatic` and no measured pause trigger (b/d/e/f) fired. → `loop_state: ready`, increment counter.
- **Action 2 — pre-create wave-16:** `process/waves/wave-16/` (blocks + stages + checklist) created, pre-filled with seed `46f16288`, no siblings, active milestone M3.
- **Action 3 — this deliverable** written before the archive move.
- **Action 4 — archive:** single `git mv process/waves/wave-15/ → process/waves/_archive/wave-15/` + commit.
- **Action 5a — close wave row:** `UPDATE waves SET status='ok' WHERE status='running' ... RETURNING wave_number` → 15.
- **Action 5b — handoff anchor:** `process/session/.last-wave-completed.yaml` overwritten.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 16"
  - "next wave checklist: process/waves/wave-16/checklist.md"
  - "archive commit: <recorded in commit step>"
  - "waves UPDATE RETURNING wave_number: 15"
prev_wave: 15
next_wave: 16
loop_state: ready
seed_task_id: 46f16288-4c13-4d8c-ad68-6925d1f51d84
bundled_sibling_ids: []
claimed_task_ids: [46f16288-4c13-4d8c-ad68-6925d1f51d84]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "Clean handoff. No milestone transition this wave (M3 stays in_progress; threads/attachments unshipped). No pause — automatic mode, no measured trigger. M3 threads-feature decomposition deferred to a future N-1 (top-level todo count must reach 0 first)."
```

---
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    M3 not closed (open=8, threads+attachments unshipped) — no premature milestone close.
    Current wave closed via the single waves UPDATE (status running→ok, RETURNING 15).
    Entire wave-15 directory archived in one git mv. Exactly one handoff move taken: open
    wave-16 P-0 (seed 46f16288) — no pause written, because no measured trigger (b/d/e/f)
    fired and automatic mode forbids anticipatory pause. All cross-wave state lives in the
    DB + .last-wave-completed.yaml + the archive; next P-0 can recover everything. Exactly
    one running wave closed; no zombie wave.
  next_action: PROCEED_TO_P-0
