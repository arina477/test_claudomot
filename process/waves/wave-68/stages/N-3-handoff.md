# N-3 — Handoff (wave-68 → wave-69)

Block: N (Next), final stage of the wave loop. head-next owns the block. Mode: automatic. STATUS: RUNNING.

## Actions

**Action 1 — Next wave number + loop state.** Current wave = 68. Next wave = **69**. Loop state = **ready** (not pausing). Pause check: N-2 did NOT emit `queue_exhausted` (a validated 1-seed + 2-sibling bundle exists); no stockout roadmap-planning deferred to an absent founder; no decomposition deferred. Under automatic mode, no rule-13 measured pause trigger fired (b STATUS unchanged / RUNNING, d no hard-stop verdict or monitor wait or infra-readiness failure, e no founder message, f no `.loop-paused.yaml`). No preemptive pause — the brain opens wave-69 P-0.

**Action 2 — Pre-create wave-69 directory + checklist.** `process/waves/wave-69/blocks/{P,D,B,C,T,V,L,N}` + `stages/` created; `checklist.md` seeded from the DISPATCHER template, pre-filled with the M14 first bundle (seed 9f2bb017 + siblings d7250881, 96d5ed58), active milestone M14, no pending rituals.

**Action 3 — This deliverable** written before the archive move (Action 4), so it archives with the wave.

**Action 4 — Archive wave-68.** Single move: `git mv process/waves/wave-68 → process/waves/_archive/wave-68`. All wave-68 stage files (including untracked C/T/V deliverables committed first) + blocks + N-block deliverables travel in one move. Archive commit recorded below.

**Action 5a — Close the wave-68 `waves` row.** `UPDATE waves SET status='ok' WHERE id = (running row, wave_number 68)`. The `set_wave_ended_at()` trigger stamps `ended_at`. Ran AFTER the archive move (row is FS-independent). RETURNING wave_number confirmed 68.

**Action 5b — Loop-handoff anchor** `process/session/.last-wave-completed.yaml` overwritten for the wave-68→69 handoff; `status-check.yaml` advanced to wave-69, STATUS RUNNING.

## head-next stage-exit gate (N-3)

- [x] Active milestone (M11) had no unshipped AC before it was marked done — M11 done was applied at L-1 via BOARD 7/7 on a fully-reachable metric; M14 (the new active milestone) is freshly promoted, not being closed.
- [x] Current wave closed via the single `waves` UPDATE on the `status='running'` row (wave 68).
- [x] Entire wave directory archived in one move to `_archive/wave-68/`.
- [x] Handoff opens the next wave's P-0 (wave-69 checklist created) — NOT a pause. Exactly one.
- [x] No pause written — no measured rule-13 (b/d/e/f) condition fired; anticipatory pause forbidden.
- [x] No orphaned wave-scoped state — next P-0 recovers everything from the DB (waves row + M14 + the todo bundle) + `.last-wave-completed.yaml` + the archive.

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Wave-68 closed cleanly: all preceding stages checked, wave-68 deliverables committed, the
    entire wave directory archived in one move, and the single running waves row closed to
    status='ok'. Handoff opens wave-69 P-0 with the validated M14 moderation first bundle as the
    seed; no measured pause condition fired so the loop continues (no anticipatory pause). All
    cross-wave state lives in Postgres (waves row + M14 in_progress + 3 todo M14 tasks) and the
    handoff anchor — nothing orphaned.
  next_action: PROCEED_TO_wave-69-P-0

n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 69"
  - "next wave checklist: process/waves/wave-69/checklist.md"
  - "archive commit: see chore: N-3 archive wave-68 (sha recorded at commit time)"
  - "waves row close: UPDATE waves status='ok' RETURNING wave_number=68"
prev_wave: 68
next_wave: 69
loop_state: ready
seed_task_id: 9f2bb017-fd19-464d-ab2b-c13ed75c04bb
bundled_sibling_ids:
  - d7250881-eb30-40fc-880a-95cf055c2425
  - 96d5ed58-ccc9-482a-a469-ec714edb7962
claimed_task_ids:
  - 9f2bb017-fd19-464d-ab2b-c13ed75c04bb
  - d7250881-eb30-40fc-880a-95cf055c2425
  - 96d5ed58-ccc9-482a-a469-ec714edb7962
active_milestone_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
active_milestone_status: in_progress
state_transitions_applied_this_wave:
  - {milestone: "M11 (8d88e691)", from: in_progress, to: done}
  - {milestone: "M14 (6a9424fe)", from: "(new)", to: todo}
  - {milestone: "M14 (6a9424fe)", from: todo, to: in_progress}
note: "M11 close applied at L-1; N-1 authored+promoted M14 (moderation) under standing L-1 BOARD 7/7 precedent; N-2 seeded M14 first bundle; wave-68 archived + closed. Stray t6-*.png test screenshots left untracked in repo root (non-load-bearing T-6 byproducts)."
```

## Next
→ `claudomat-brain/DISPATCHER.md` → re-enter at P-0 of wave-69 (orchestrator reads `process/waves/wave-69/checklist.md`; P-0 Action 0a opens the wave-69 waves row).
