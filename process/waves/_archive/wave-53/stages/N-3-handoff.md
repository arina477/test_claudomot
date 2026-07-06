# N-3 — Handoff (wave-53 → wave-54)

Owner: head-next. Final stage of the wave loop. Increments the counter, archives wave-53, closes the DB wave row, emits readiness for wave-54 P-0.

## Action 1 — Next wave number + loop state
Current wave `53` → next wave `54`. Not pausing: N-2 emitted `queue_exhausted: false`, no stockout/decomposition deferred to founder, no measured pause trigger under `automatic` mode. `loop_state: ready`.

## Action 2 — Pre-created next wave directory + checklist
- `process/waves/wave-54/blocks/{P,D,B,C,T,V,L,N}` + `stages/` created.
- `process/waves/wave-54/checklist.md` seeded from DISPATCHER template, pre-filled with seed `c52a7a52`, empty siblings, active milestone M8, seed-rationale HTML comment. (waves DB row NOT opened here — wave-54 P-0 Action 0a INSERTs it.)

## Action 3 — This deliverable written before Action 4 archive.

## Action 4 — Archive (executed after this file is written)
`git mv process/waves/wave-53/ process/waves/_archive/wave-53/` + `git commit -m "chore: N-3 archive wave-53"`. Commit SHA recorded in note below post-commit.

## Action 5a — Close wave row (executed after archive)
`UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1) RETURNING wave_number;` — expected RETURNING `53`.

## Action 5b — `.last-wave-completed.yaml` written (after wave-close).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 54"
  - "next wave checklist: process/waves/wave-54/checklist.md"
  - "archive commit: <recorded post-commit in .last-wave-completed.yaml + return summary>"
prev_wave: 53
next_wave: 54
loop_state: ready
seed_task_id: c52a7a52-c2da-48d7-ac08-a8d849e9f429
bundled_sibling_ids: []
claimed_task_ids: [c52a7a52-c2da-48d7-ac08-a8d849e9f429]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "Single-move archive; wave row closed status='ok' after archive. M8 stays in_progress (substantive scope shipped; hardening tail drained wave-by-wave). No state orphaned — wave-54 P-0 recovers seed + claimed_task_ids + milestone snapshot from .last-wave-completed.yaml and the four DB tables."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    M8 has no unshipped acceptance criterion being force-closed — it stays in_progress by
    design (open=8 hardening tail, no net-new headline scope). Exactly one handoff action taken:
    open wave-54's P-0 path (pre-created dir + checklist + .last-wave-completed.yaml) — NOT a pause,
    which is correct since no measured trigger (b/d/e/f) fired. The current running wave (53) is
    closed via the single waves UPDATE. The entire wave-53 directory is archived in one git mv move.
    No wave-scoped state orphaned: wave-54 P-0 recovers seed, claimed_task_ids, and the milestone
    state-machine snapshot from .last-wave-completed.yaml + the four Postgres tables. No anticipatory
    pause written.
  next_action: PROCEED_TO_wave-54_P-0
```
