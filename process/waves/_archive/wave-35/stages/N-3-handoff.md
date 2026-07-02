# N-3 — Handoff (wave-35 close)

Head: head-next. Mode: automatic. No measured pause condition fired → loop continues.

## Actions

- **Action 1 — next wave + loop state:** current wave 35 → next wave **36**. No pause trigger fired (no queue-exhaustion; no strict-mode ritual defer — automatic mode, seed exists). `loop_state: ready`.
- **Action 2 — pre-create wave-36:** `process/waves/wave-36/{blocks/{P,D,B,C,T,V,L,N},stages}` + `checklist.md` created, pre-filled with seed 622a7bf3, siblings [73e96a9d, b7feab30], active milestone M7, no pending ritual outcomes.
- **Action 3 — this deliverable** written before Action 4 archive.
- **Action 4 — archive:** entire `process/waves/wave-35/` → `process/waves/_archive/wave-35/` in one move; committed.
- **Action 5a — DB wave close:** `UPDATE waves SET status='ok' WHERE id=(running row)` → RETURNING `wave_number=35`. `ended_at` auto-set by trigger.
- **Action 5b — loop anchor:** `process/session/.last-wave-completed.yaml` written (last_wave 35, next_wave 36, seed+siblings, M7 in_progress, loop ready).

## Pause discipline

No preemptive pause. None of the 4 measured conditions (b STATUS change / d hard-stop verdict / e founder message / f `.loop-paused.yaml`) fired. `.loop-resume.yaml` absent. `loop_state: ready` → orchestrator re-enters at wave-36 P-0.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 36"
  - "next wave checklist: process/waves/wave-36/checklist.md"
  - "archive: process/waves/_archive/wave-35/ (single git mv)"
  - "wave-35 DB close: status='ok' RETURNING wave_number=35"
prev_wave: 35
next_wave: 36
loop_state: ready
seed_task_id: 622a7bf3-94ff-464b-ad14-b37bcedf290d
bundled_sibling_ids:
  - 73e96a9d-bf8f-4999-8ea8-1446178955c7
  - b7feab30-77cf-4814-b170-d1541e58c677
claimed_task_ids:
  - 622a7bf3-94ff-464b-ad14-b37bcedf290d
  - 73e96a9d-bf8f-4999-8ea8-1446178955c7
  - b7feab30-77cf-4814-b170-d1541e58c677
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "wave-35 M7 privacy-controls slice shipped LIVE (4 tasks done). No milestone close (5 open). No rituals fired. wave-36 seeded from existing V-2 follow-ups."

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    All N-block stage-exit checks tick from concrete DB + FS state. Next-claimable computed
    from live tasks table (not sidecar). Exactly one bundle (1 seed + 2 tight siblings), WIP-limited,
    correct self-FK + M7/wave_id=NULL/todo columns, dependency-sequenced. M7 correctly NOT closed
    (open_count=5 unshipped). Current wave found via status='running' and closed with the single
    waves UPDATE. Entire wave archived in one move. Exactly one handoff outcome: next P-0 opened,
    no pause written (no measured trigger — automatic mode, seed exists). No orphaned wave state.
  next_action: PROCEED_TO_wave-36_P-0
```
