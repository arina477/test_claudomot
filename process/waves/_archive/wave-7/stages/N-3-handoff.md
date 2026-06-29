# N-3 — Handoff (wave-7 → wave-8)

Block N (Next), stage N-3. Mode: `automatic`. head-next owns the block. Final stage of the wave loop.

## Actions

- **Action 1 — next wave + loop state:** next wave = 8. Loop NOT pausing — N-2 produced a valid bundle (`queue_exhausted: false`), no ritual deferred to founder, no measured pause trigger fired (STATUS=RUNNING; no `.loop-paused.yaml`/`.loop-resume.yaml`; no founder message; no stage hard-stop). `loop_state: ready`.
- **Action 2 — pre-create wave-8:** `process/waves/wave-8/{blocks/{P,D,B,C,T,V,L,N},stages}` created; `process/waves/wave-8/checklist.md` seeded with M2 active milestone + wave-8 bundle (seed c7443638 + 3 siblings).
- **Action 3 — this deliverable** written before the archive move.
- **Action 4 — archive:** single-move `git mv process/waves/wave-7/ process/waves/_archive/wave-7/` committed to main.
- **Action 5a — close wave row:** `UPDATE waves SET status='ok'` on the running wave_number=7 row (`ae7669bd-6f01-4cd1-a0f2-44e8798a0c9c`); trigger auto-sets `ended_at`.
- **Action 5b — handoff anchor:** `process/session/.last-wave-completed.yaml` rewritten (last_wave 7, next_wave 8, seed + siblings, active_milestone M2 in_progress, loop_state ready). Committed + pushed to main (restart-loss lesson).

## head-next gating verdict

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    M2 NOT closed — scope unshipped (invites/RBAC/settings remain), open_count=3; premature-close
    avoided. Exactly one running wave (wave_number=7) closed via the single waves UPDATE. Entire
    wave-7 directory archived in one move. Handoff opens the next wave's P-0 (wave-8) — never both a
    pause and an open. No pause written: no measured trigger (b/d/e/f) fired; anticipatory pause is
    forbidden. No orphaned wave-scoped state — wave-8 P-0 recovers seed + siblings + active milestone
    from the DB tasks/milestones rows and .last-wave-completed.yaml.
  next_action: PROCEED_TO_wave-8-P-0
```

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 8"
  - "next wave checklist: process/waves/wave-8/checklist.md"
  - "archive commit: see chore: N-3 archive wave-7 + seed wave-8 (pushed to main)"
  - "waves close: wave_number=7 status running→ok (id ae7669bd-6f01-4cd1-a0f2-44e8798a0c9c)"
prev_wave: 7
next_wave: 8
loop_state: ready
seed_task_id: c7443638-a32f-460c-887f-ecd575f2cede
bundled_sibling_ids:
  - 77e2041a-198d-48a1-bc95-6900bd03ec44
  - 72fc08ea-610c-4244-b747-218e3efbc5ae
  - 54407e1d-1936-458d-b586-0d49d9cf9482
claimed_task_ids:
  - c7443638-a32f-460c-887f-ecd575f2cede
  - 77e2041a-198d-48a1-bc95-6900bd03ec44
  - 72fc08ea-610c-4244-b747-218e3efbc5ae
  - 54407e1d-1936-458d-b586-0d49d9cf9482
active_milestone_id: 41e61975-c92e-49b1-9ae5-45498dd04925
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "M2 first bundle (create-server) shipped wave-7; M2 stays in_progress. wave-8 = M2 invites+join. 3 M2 tech-debt follow-ups (46f16288, 4a2ad286, 25523fb0) remain unassigned for a future bundle."
```
