# N-3 — Handoff (wave-8 → wave-9)

> Block: N (Next). Final stage of the wave loop. Stage N-3 of N-1 → N-2 → N-3. Mode: automatic. head-next gating.

## Action 1 — Next wave number + loop state
Current wave = 8. Next wave = **9**. Loop state = **ready** — NOT pausing:
- N-2 emitted a valid bundle (`queue_exhausted: false`).
- No stockout cascade (11 `todo` milestones exist).
- No deferred decomposition (decomposition was a contractual no-op, not a defer).
- No measured pause trigger fired (no founder message, no hard-stop verdict, no `.loop-paused.yaml`, STATUS unchanged = RUNNING). Anticipatory pause is forbidden under automatic — the loop continues.

## Action 2 — Pre-created next wave
`process/waves/wave-9/` created with `blocks/{P,D,B,C,T,V,L,N}` + `stages/`, and `checklist.md` pre-filled with: wave 9, seed `863c10ef`, siblings `08ff762f` + `5331b7d5`, active milestone M2, and the 3 binding conditions from the wave-9 seed BOARD decision (backfill idempotency/collision-safety; revoke affordance + server-side authz; RBAC = wave-10 seed unconditionally).

## Action 3 — This deliverable
Written before Action 4 archive so it travels with the wave.

## Action 4 — Archive
`git mv process/waves/wave-8/ process/waves/_archive/wave-8/` + commit. (See final commit.)

## Action 5a — DB wave close
`UPDATE waves SET status='ok'` on the `running` row (wave_number 8). `ended_at` auto-set by the `set_wave_ended_at()` trigger.

## Action 5b — Loop handoff anchor
`process/session/.last-wave-completed.yaml` overwritten with the wave-9 handoff state.

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 9"
  - "next wave checklist: process/waves/wave-9/checklist.md"
  - "archive commit: see N-3 archive commit on main"
  - "waves UPDATE: wave_number 8 -> status=ok (RETURNING confirmed)"
prev_wave: 8
next_wave: 9
loop_state: ready
seed_task_id: 863c10ef-4f58-4451-9172-d319e751ec07
bundled_sibling_ids:
  - 08ff762f-c4fb-4f80-87f6-e12796a2a485
  - 5331b7d5-511c-4370-9d86-b6729b60ced5
claimed_task_ids:
  - 863c10ef-4f58-4451-9172-d319e751ec07
  - 08ff762f-c4fb-4f80-87f6-e12796a2a485
  - 5331b7d5-511c-4370-9d86-b6729b60ced5
active_milestone_id: 41e61975-c92e-49b1-9ae5-45498dd04925
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: { board: "N-1-seed-priority-wave-9 5-1-1 (carried)" }
  failed_checks: []
  rationale: >
    M2 correctly NOT marked done — RBAC/kick-ban/server-settings scope unshipped. Exactly
    one running wave closed via the single waves UPDATE (wave_number 8 -> ok). Entire wave-8
    directory archived in one git mv. Handoff opens wave-9 P-0 (next-wave seed present) and
    writes NO pause — exactly one of {open P-0, pause}. No wave-scoped state orphaned: seed +
    siblings + active milestone + binding conditions all recoverable from the DB +
    .last-wave-completed.yaml + wave-9 checklist. No preemptive pause (no measured trigger
    fired). Loop state: ready.
  next_action: PROCEED_TO_P-0
note: "Wave-9 seeds the BOARD-adopted invite-completion bundle; RBAC carried as wave-10's unconditional seed per the binding conditions in the wave-9 checklist."
```
