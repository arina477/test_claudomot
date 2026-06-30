# N-3 — Handoff (wave-12 → wave-13)

Close the wave loop for wave-12; open wave-13. Mode: `automatic`. Loop NOT pausing.

## Actions

**Action 1 — Next wave + loop state.** Current wave = 12. Next = 13. No pause condition: decomposition completed inline under `automatic` (not deferred to founder), seed exists, no queue-exhaustion, no stockout. `loop_state: ready`.

**Action 2 — Pre-create wave-13.** Created `process/waves/wave-13/blocks/{P,D,B,C,T,V,L,N}` + `stages/` + `checklist.md` seeded with wave-13 number, seed e12886d7, siblings d78df376 + f323a71f, active milestone M3.

**Action 3 — This deliverable** written before the archive move.

**Action 4 — Archive.** `git mv process/waves/wave-12/ → process/waves/_archive/wave-12/` (single move), committed + pushed.

**Action 5 — Final state.** Wave-12 row closed in DB (`status='ok'`, ended_at trigger-set). `.last-wave-completed.yaml` rewritten with wave-13 handoff + M3 snapshot.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 13"
  - "next wave checklist: process/waves/wave-13/checklist.md"
  - "archive commit: see N-3 archive commit on main"
  - "wave-12 row closed: status=ok (RETURNING wave_number=12)"
prev_wave: 12
next_wave: 13
loop_state: ready
seed_task_id: e12886d7-532b-4824-906a-7f336bacfd65
bundled_sibling_ids: [d78df376-26e4-4569-b2d1-bb8c7bc81519, f323a71f-9047-426c-ab20-6f0e488460fd]
claimed_task_ids: [e12886d7-532b-4824-906a-7f336bacfd65, d78df376-26e4-4569-b2d1-bb8c7bc81519, f323a71f-9047-426c-ab20-6f0e488460fd]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: >
  M3 stays in_progress — core text data plane shipped in wave-12, remaining ## Scope (edit/delete,
  reactions, threads, mentions, attachments, presence/typing, member-list) unshipped. No milestone
  close, no promotion, no stockout. Stale C-2 pause residue in status-check.yaml reconciled at N-1
  (C-2 verdict APPROVED, deploy shipped, M3 live) — no live pause trigger fired.

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    M3 had no unshipped acceptance criterion mis-marked done — it correctly stays in_progress (no
    premature milestone close). The current running wave (8f5fb910, wave_number 12) is closed via the
    single waves UPDATE (status ok). The entire wave-12 directory is archived in one git mv to
    _archive/wave-12. The handoff opens wave-13's P-0 (next-wave dir + checklist) and writes NO pause —
    exactly one of {open next P-0, pause}, and the measured conditions for pause (b/d/e/f) did not fire
    (the C-2 residue is historical, reconciled against an APPROVED verdict; no founder message; no
    .loop-paused.yaml; STATUS RUNNING unchanged by another agent). No wave-scoped state orphaned: the
    next P-0 recovers seed + siblings + milestone from .last-wave-completed.yaml + the DB + the archive.
  next_action: PROCEED_TO_P-0
```
