# N-3 — Handoff (wave-64)

## Actions

**Action 1 — next wave number + loop state:** current wave = 64. Next = **65**. Loop is NOT pausing: N-2 emitted a valid seed (`queue_exhausted: false`); no ritual deferred to founder; no measured rule-13 pause trigger fired (mode `automatic`, STATUS RUNNING). `loop_state: ready`.

**Action 2 — pre-create next wave:** `process/waves/wave-65/{blocks/{P,D,B,C,T,V,L,N},stages}` created; `process/waves/wave-65/checklist.md` written, pre-filled with seed `db3ade72`, empty sibling list, active milestone M12. No `.loop-paused.yaml` written (loop not pausing).

**Action 3 — this deliverable:** written before Action 4 archive.

**Action 4 — archive:** entire `process/waves/wave-64/` moved to `process/waves/_archive/wave-64/` in one `git mv`, committed. (SHA recorded in verdict_evidence after commit.)

**Action 5a — close waves row:** `UPDATE waves SET status='ok'` on the current `running` row (`de490532…`, wave_number 64). `set_wave_ended_at()` trigger auto-stamps `ended_at`.

**Action 5b — loop-handoff anchor:** `process/session/.last-wave-completed.yaml` overwritten with the wave-65 handoff snapshot. `process/session/status-check.yaml` STATUS stays RUNNING.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 65"
  - "next wave checklist: process/waves/wave-65/checklist.md"
  - "archive commit: see chore(next) commit for wave-64 archive"
  - "waves row closed: de490532-15a1-447c-8800-65e4c69c6c00 (wave_number 64) status running→ok"
prev_wave: 64
next_wave: 65
loop_state: ready
seed_task_id: db3ade72-6504-4700-93b1-9d99b4098f38
bundled_sibling_ids: []
claimed_task_ids: [db3ade72-6504-4700-93b1-9d99b4098f38]
active_milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
active_milestone_status: in_progress
state_transitions_applied_this_wave:
  - {task: 10e7543f-431f-44ac-8af0-3c0882ca9885, from: todo, to: blocked}
note: "M12 stays in_progress (scope unshipped: conflict-resolution UI + assignment-media leg). No pause — no measured rule-13 trigger fired."

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Milestone close correctly withheld — M12 has unshipped ACs (conflict-resolution UI,
    assignment-media leg), so no premature close. Exactly one running wave (de490532)
    closed via the single waves UPDATE — no zombie wave. Entire wave-64 directory archived
    in one git mv. Handoff opens wave-65's P-0 (checklist pre-created, seed + milestone
    recoverable from DB + .last-wave-completed.yaml) and writes NO pause — a pause would
    be preemptive since no measured trigger fired. Exactly one of {open P-0, pause}: open.
    No orphaned wave-scoped state.
  next_action: PROCEED_TO_P-0
```
