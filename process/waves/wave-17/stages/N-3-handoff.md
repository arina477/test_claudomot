# N-3 — Handoff (wave-17 → wave-18)

## Actions

- **Action 1 — next wave + loop state:** current `<N>=17`, next `<N+1>=18`. No pause condition fired: N-2 found a seed (not queue-exhausted); decomposition fired inline and completed under `automatic` (not deferred to founder); BOARD was clean unanimous (no split, no hard-stop, no founder escalation); no `.loop-paused.yaml` / `.loop-resume.yaml`; STATUS RUNNING unchanged. → `loop_state: ready`; increment counter.
- **Action 2 — pre-create wave-18:** `process/waves/wave-18/{blocks/{P,D,B,C,T,V,L,N},stages}` created; `process/waves/wave-18/checklist.md` written with seed `497c2ae6` + 2 siblings, active milestone M3, BOARD provenance, and pending-ritual notes (likely UI wave; attachments + parked tech-debt deferred).
- **Action 3 — this deliverable:** written before the archive move.
- **Action 4 — archive wave-17:** single `git mv process/waves/wave-17/ process/waves/_archive/wave-17/` + commit (sha recorded below; this file's path becomes `_archive/wave-17/stages/N-3-handoff.md` post-move).
- **Action 5a — close wave row:** `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1) RETURNING wave_number;` → returned `17`. Trigger auto-set `ended_at`.
- **Action 5b — loop-handoff anchor:** `process/session/.last-wave-completed.yaml` overwritten (last_wave 17, next_wave 18, seed+siblings, M3 in_progress, loop_state ready).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 18"
  - "next wave checklist: process/waves/wave-18/checklist.md"
  - "archive commit: <see git log — chore: N-3 archive wave-17>"
  - "waves row closed: wave_number 17 → status ok"
prev_wave: 17
next_wave: 18
loop_state: ready
seed_task_id: 497c2ae6-844b-4910-9f21-677a536d2dc2
bundled_sibling_ids:
  - 6c008dd6-d904-457b-966b-dcafe029a7d6
  - 0b728319-bc09-4847-bef5-3b9c2f3a228c
claimed_task_ids:
  - 497c2ae6-844b-4910-9f21-677a536d2dc2
  - 6c008dd6-d904-457b-966b-dcafe029a7d6
  - 0b728319-bc09-4847-bef5-3b9c2f3a228c
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "M3 stays in_progress (open=6, threads+attachments unshipped). BOARD N-1-ordering-wave-17 7/7 APPROVE B applied — wave-18 builds threads. No pause: clean unanimous, no hard-stop, STATUS RUNNING."
```

## head_signoff (head-next) — block exit

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: { board: "N-1-ordering-wave-17 (7/7 APPROVE B)" }
  failed_checks: []
  rationale: >
    Active milestone NOT closed — M3 has 6 open tasks and two unshipped acceptance criteria
    (thread replies, attachments), so closure was correctly withheld. The current wave is closed via
    the single UPDATE on waves (status='running' → 'ok', wave_number 17). The entire wave directory
    is archived in one git mv to _archive/wave-17/. Exactly one of {open next P-0, write pause} taken:
    the next wave's P-0 is opened (loop_state: ready) — NOT a pause, because no measured pause
    condition fired (BOARD clean/unanimous, no hard-stop, no founder message, no .loop-paused.yaml,
    STATUS RUNNING). No anticipatory pause. All cross-wave state lives in the DB (waves row, tasks
    bundle, M3 status) + .last-wave-completed.yaml + the wave-18 checklist — the next P-0 recovers
    everything.
  next_action: PROCEED_TO_P-0   # re-enter at P-0 of wave-18 per DISPATCHER
```
