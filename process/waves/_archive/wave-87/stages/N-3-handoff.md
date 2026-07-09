# N-3 — Handoff (wave-87 → wave-88)

## Loop state (Action 1)

Pause evaluation per always-on rule 13 — checked all measured triggers:
- **(e) founder message since last tick:** NONE. The only inbound was an automated worker-restart resume, not a founder message.
- **(d) hard-stop / infra-readiness:** NONE. No gate-verdict hard-stop; DB reachable (all N queries returned cleanly, no 28xxx/42501/connection-refused); no `[claudomat-db-readiness-FAIL]` sentinel.
- **(f) `.loop-paused.yaml`:** absent.
- **(b) STATUS changed by another agent:** STATUS is `RUNNING` (unchanged).
- `.loop-resume.yaml`: absent.

No trigger fired → **`loop_state: ready`**. Wave counter increments to 88. No preemptive pause.

## Archive + close (Actions 2, 4, 5)

- Next wave dir `process/waves/wave-88/` + checklist pre-created (seed `6eed0fc2`, 0 siblings, no active milestone).
- Wave-87 archived in one `git mv` to `process/waves/_archive/wave-87/`.
- Wave-87 DB row closed: `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → returned wave_number 87.
- `process/session/.last-wave-completed.yaml` written (last_wave 87, next_wave 88, seed).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 88"
  - "next wave checklist: process/waves/wave-88/checklist.md"
  - "archive commit: see wave-87 archive commit"
prev_wave: 87
next_wave: 88
loop_state: ready
seed_task_id: 6eed0fc2-6f5e-42cd-8be4-b2364a5d066b
bundled_sibling_ids: []
claimed_task_ids: [6eed0fc2-6f5e-42cd-8be4-b2364a5d066b]
active_milestone_id: null
active_milestone_status: null
state_transitions_applied_this_wave: []
note: "Bug-fix phase; roadmap complete. Seed = service-worker cache-bust (live bug, verified against apps/web/vite.config.ts). No pause trigger fired."

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Exactly one of {open next P-0, write pause} taken — opened wave-88 (ready), no pause, since no
    measured trigger fired (checked e/d/f/b + .loop-resume, all clear). Wave-87 closed via the single
    waves UPDATE (RETURNING wave_number 87) and archived in one move. No premature milestone close
    (no active milestone). Handoff state (seed, claimed_task_ids, milestone snapshot) persisted to
    .last-wave-completed.yaml + the DB — next P-0 can recover everything. No zombie running wave, no
    dropped state.
  next_action: PROCEED_TO_wave-88-P-0
```
