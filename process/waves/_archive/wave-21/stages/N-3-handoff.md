# N-3 — Handoff (wave-21 → wave-22)

Closes the M4 offline-first WEDGE chapter (waves 20–21); opens M5 (academic tooling: assignments).

## Actions

### Action 1 — Next wave number + loop state
Current wave = 21. Next = **22**. **No pause:** no measured trigger fired (M4 close + M5 activate were mechanical state-machine actions; decomposition succeeded inline → viable seed; no `queue_exhausted`, no stockout-pending-founder, no decomposition-pending-founder; no founder message, no hard-stop verdict, no `.loop-paused.yaml`, no STATUS change). `loop_state: ready`.

### Action 2 — Pre-create wave-22 directory + checklist
`process/waves/wave-22/blocks/{P,D,B,C,T,V,L,N}/` + `stages/` created. `process/waves/wave-22/checklist.md` written: wave 22, active milestone M5 (a5232e16), seed 01fcefb8, siblings [916ecff7, a5f25f9b], full carry-ins (rule-1 premise-verification, design_gap-likely-TRUE → D-block, Resend SDK-research deferred, M5 backlog debt rows, carried obs).

### Action 3 — N-3 deliverable
This file. Written before Action 4 archive.

### Action 4 — Archive wave-21
`git mv process/waves/wave-21/ process/waves/_archive/wave-21/` + commit. (SHA recorded in handoff note + final state.)

### Action 5a — Close wave-21 DB row
`UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → RETURNING wave_number = 21. `set_wave_ended_at()` trigger auto-sets `ended_at`.

### Action 5b — Loop-handoff anchor
`process/session/.last-wave-completed.yaml` overwritten (see below).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 22"
  - "next wave checklist: process/waves/wave-22/checklist.md"
  - "archive commit: see N-3 commit SHA in final state / handoff"
prev_wave: 21
next_wave: 22
loop_state: ready
seed_task_id: 01fcefb8-141e-4f65-b646-18005e780196
bundled_sibling_ids:
  - 916ecff7-713e-4a92-9061-cb40f7e2364e
  - a5f25f9b-1c24-4d02-824b-6234f98cce3a
claimed_task_ids:
  - 01fcefb8-141e-4f65-b646-18005e780196
  - 916ecff7-713e-4a92-9061-cb40f7e2364e
  - a5f25f9b-1c24-4d02-824b-6234f98cce3a
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_status: in_progress
state_transitions_applied_this_wave:
  - {milestone: "M4 (eb2a1688)", from: in_progress, to: done}
  - {milestone: "M5 (a5232e16)", from: todo, to: in_progress}
note: >
  M4 WEDGE complete (waves 20-21): exactly-once+in-order offline send + cached reads + live connection-state
  + multi-page catch-up all LIVE. M5 academic-tooling chapter opened. STATUS RUNNING; loop_state ready.
```

## Exit criteria
- [x] wave-22 directory + checklist exist.
- [x] wave-21 fully archived under `_archive/`.
- [x] `.last-wave-completed.yaml` reflects handoff incl. milestone snapshot.
- [x] `n_stage_verdict: COMPLETE`.

## head_signoff
```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Active milestone closed only after every ## Scope AC shipped + ## Success metric met (no premature close;
    non-scope children re-homed first). Current wave closed via the single waves UPDATE on the status='running'
    row (no zombie running wave). Entire wave-21 directory archived in one git mv. Handoff opens the next wave's
    P-0 (wave-22) and writes NO pause — exactly one of {open next P-0, pause}. No pause written because no measured
    trigger fired (anticipatory pause forbidden; the brain decides breaks here, and the measured state says CONTINUE).
    All cross-wave state recoverable from DB (milestones M4=done/M5=in_progress, the assignments bundle in tasks,
    wave-21 status='ok') + archive + .last-wave-completed.yaml — next P-0 re-derives nothing.
  next_action: PROCEED_TO_P-0   # wave-22
```
