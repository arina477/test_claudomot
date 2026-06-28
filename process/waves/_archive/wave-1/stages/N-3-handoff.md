# N-3 — Handoff (wave 1 → wave 2)

Final stage of the wave-1 loop. Archive wave-1, close the wave row, hand off to wave-2 P-0.

## Action 1 — Next wave number + loop state
Current wave = 1 → next wave = **2**. **No pause** — none of the pause conditions hold:
- N-2 did not emit `queue_exhausted` (single-task bundle picked).
- No stockout-cascade roadmap-planning deferred to founder (active milestone non-null).
- No milestone-decomposition deferred to founder (decomposition not fired; seed already existed).
- No measured pause trigger (rule #13): `status-check.yaml` STATUS=RUNNING, no `.loop-paused.yaml`, no founder
  message this tick, no stage hard-stop verdict. Anticipatory pause is forbidden — the loop continues.

→ Increment to wave 2; `loop_state: ready`.

## Action 2 — Pre-create next wave's directory + checklist
Created `process/waves/wave-2/blocks/{P,D,B,C,T,V,L,N}/` + `process/waves/wave-2/stages/` and
`process/waves/wave-2/checklist.md` (seed `b9118041`, milestone M1, security-scope carry-forward, no deferred rituals).

## Action 4 — Archive
`git mv process/waves/wave-1/ process/waves/_archive/wave-1/` (single move; this deliverable rides along), committed.

## Action 5a — Close the wave row (DB)
`UPDATE waves SET status='ok' WHERE id` of the current `running` row (`4616fa23-6e2b-423f-976f-e72341dcbf0a`,
wave_number 1). `set_wave_ended_at()` trigger auto-sets `ended_at`. RETURNING wave_number = 1.

## Action 5b — Loop-handoff anchor
`process/session/.last-wave-completed.yaml` overwritten with the handoff snapshot below.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 2"
  - "next wave checklist: process/waves/wave-2/checklist.md"
  - "archive commit: see N-3 archive commit (chore: N-3 archive wave-1)"
  - "wave row closed: 4616fa23-6e2b-423f-976f-e72341dcbf0a → status=ok (RETURNING wave_number=1)"
prev_wave: 1
next_wave: 2
loop_state: ready
seed_task_id: b9118041-06c0-4478-9d15-dfc715e3b97a
bundled_sibling_ids: []
claimed_task_ids:
  - b9118041-06c0-4478-9d15-dfc715e3b97a
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: >
  Wave-1 shipped the foundation scaffold (cbf25dd5). M1 stays in_progress — auth + profiles scope remains.
  Wave-2 seed = auth backend (b9118041). Security-scope tightened gate + T-8 carried forward to wave-2.
  No wave-scoped state orphaned: seed, siblings, milestone, and claimed_task_ids all recoverable from the
  DB + .last-wave-completed.yaml + wave-2 checklist.
```

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    M1 not closed (an unshipped AC remains — auth + profiles), so no premature milestone-done transition.
    Exactly one running wave closed via the single waves UPDATE (status running→ok, found by status='running').
    Entire wave-1 directory archived in one git mv. Exactly one of {open next P-0, write pause} chosen — the
    next P-0 path (wave-2), since no measured pause trigger fired (no anticipatory pause). No orphaned
    wave-scoped state: wave-2 P-0 recovers seed/siblings/milestone/claimed_task_ids from DB + handoff anchor +
    wave-2 checklist. Security-scope carry-forward propagated.
  next_action: PROCEED_TO_wave-2-P-0
```
