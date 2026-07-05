# N-3 — Handoff (wave-50)

head-next (agent `abae158f52302344f`) gated this stage: **APPROVED**. Clean single-move handoff. No pause (no measured trigger fires under `automatic`).

## Actions

- **Action 1 — next wave + loop state:** next wave = 51. Loop does NOT pause: N-2 emitted a valid seed (`39fc1c5e`, wave_id NULL), no stockout, no strict-mode deferral. `loop_state: ready`.
- **Action 2 — pre-create wave-51 dir + checklist:** `process/waves/wave-51/{blocks,stages}` + checklist seeded from DISPATCHER template; pre-filled seed `39fc1c5e`, 0 siblings, milestone M8.
- **Action 3 — this deliverable** written before archive.
- **Action 4 — archive:** single `git mv process/waves/wave-50 → process/waves/_archive/wave-50`.
- **Action 5a — close wave-50 DB row:** `UPDATE waves SET status='ok'` on the running row (`660cefa8`, wave_number 50). Trigger set `ended_at`. RETURNING wave_number = 50.
- **Action 5b — write `.last-wave-completed.yaml`** (loop-handoff anchor).

M8 is NOT closed (open=7 → premature-close guard). No `milestones` UPDATE.

## Pause check (all negative)

| trigger | state | fires? |
|---|---|---|
| (b) STATUS changed | RUNNING (unchanged) | no |
| (d) hard-stop verdict | none | no |
| (e) founder message | none since last tick | no |
| (f) `.loop-paused.yaml` | absent | no |
| `.loop-resume.yaml` | absent | — |

No pause. Opening wave-51 P-0. Writing a pause here would be a preemptive-pause violation (rule 13).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 51"
  - "next wave checklist: process/waves/wave-51/checklist.md"
  - "archive commit: see N-block closeout commit"
  - "wave-50 row closed: waves 660cefa8 status='running'→'ok', RETURNING wave_number=50"
prev_wave: 50
next_wave: 51
loop_state: ready
seed_task_id: 39fc1c5e-7fcc-473a-9f50-71cdb53f8759
bundled_sibling_ids: []
claimed_task_ids: ["39fc1c5e-7fcc-473a-9f50-71cdb53f8759"]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "automatic mode; no measured pause trigger. M8 stays in_progress (open=7). head-next N-3 signoff APPROVED."
```

## head-next N-3 signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  handoff:
    milestone_close: false
    wave_close_update: "UPDATE waves SET status='ok' WHERE status='running' ORDER BY wave_number DESC LIMIT 1"
    archive_move: "git mv process/waves/wave-50 process/waves/_archive/wave-50"
    handoff_target: open-next-P0
    next_wave: 51
    next_wave_milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4
    seed_to_claim: 39fc1c5e-7fcc-473a-9f50-71cdb53f8759
    pause_written: false
    pause_evidence: null
    loop_state: ready
  rationale: >
    Clean single-move handoff. M8 not closed (open=7). wave-50 closed via the one waves UPDATE on the
    running row. Entire wave-50 dir archived in one move. Exactly one of {open next P-0, pause}: open
    wave-51 P-0, because a seedable task exists and NO measured pause trigger fires. No wave-scoped state
    orphaned — next P-0 recovers everything from the four tables + archive.
  next_action: PROCEED_TO_wave-51_P-0
```
