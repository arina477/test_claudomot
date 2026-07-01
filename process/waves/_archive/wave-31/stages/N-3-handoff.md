# N-3 — Handoff (wave-31 → wave-32)

Final stage of the wave loop. Increment counter, archive wave-31, close the `waves` row, emit readiness for wave-32 P-0.

## Actions

- **Action 1 — Next wave + loop state:** current `<N>=31` → next `<N+1>=32`. No pause condition holds: N-2 emitted `queue_exhausted: false`; no stockout/decomposition deferred to founder; no measured pause trigger (b STATUS unchanged=RUNNING / d no hard-stop, no monitor, no infra-fail / e no founder message / f no `.loop-paused.yaml`, no `.loop-resume.yaml`). → `loop_state: ready`; increment counter to 32.
- **Action 2 — Pre-create wave-32:** `process/waves/wave-32/{blocks/{P,D,B,C,T,V,L,N},stages}` + `checklist.md` from the DISPATCHER ledger template, pre-filled: wave 32, seed `78f51968`, siblings `[]`, active milestone M6 (`8702a335`, in_progress), LiveKit-creds-pending carry.
- **Action 3 — This deliverable** written before the archive move (Action 4).
- **Action 4 — Archive:** single `git mv process/waves/wave-31/ → process/waves/_archive/wave-31/`.
- **Action 5a — Close wave row:** `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → RETURNING wave_number = 31. `set_wave_ended_at()` trigger sets `ended_at`. Do **NOT** open wave-32's `waves` row (P-0 Action 0a's job).
- **Action 5b — Anchor:** overwrite `process/session/.last-wave-completed.yaml`.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 32"
  - "next wave checklist: process/waves/wave-32/checklist.md"
  - "archive commit: recorded in N-block commit (final push)"
  - "waves row 31 closed: status='ok' (RETURNING wave_number=31)"
prev_wave: 31
next_wave: 32
loop_state: ready
seed_task_id: 78f51968-2c48-4368-93d4-7d3f02111a7b
bundled_sibling_ids: []
claimed_task_ids: [78f51968-2c48-4368-93d4-7d3f02111a7b]
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "Clean close-and-open. Zero milestone transitions (M6 held in_progress). Single-UPDATE close, single-move archive, opens exactly one of {next P-0, pause} = wave-32 P-0. LiveKit-creds-pending carry for wave-32 live-verify (founder heads-up standing)."
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Single-move close-and-open. No milestone transition (M6 held in_progress). Wave-31
    closed via exactly one UPDATE waves SET status='ok' via the running-anchor — no
    zombie-running-wave, within the waves column-write grant. Entire wave-31 directory
    archived in one git mv. Opens exactly one of {next P-0, pause}: opens wave-32 P-0
    (.last-wave-completed.yaml loop_state=ready + wave-32 dir/checklist +
    status-check.yaml P-0/RUNNING), writes NO pause — none warranted (no b/d/e/f trigger);
    a pause on this post-ship break would be the preemptive-pause failure, correctly
    avoided. N-3 does NOT INSERT wave-32's waves row (P-0 Action 0a). No orphaned state —
    seed, M6 in_progress, next-wave pointer all recoverable from DB + archive.
  next_action: PROCEED_TO_wave-32/P-0
```
