# N-3 — Handoff (wave-5 → wave-6)

Final stage of the wave-5 loop. Not pausing: none of Action 1's three pause conditions hold
(N-2 not queue-exhausted; no stockout-pending-founder; no decomposition-pending-founder). Loop state = ready.

## Actions

- **Action 1 (next wave + loop state):** next wave = 6; `loop_state: ready`.
- **Action 2 (pre-create):** `process/waves/wave-6/` dir tree + `checklist.md` created, pre-filled with seed
  `da242f6b`, active milestone M1, and the two open founder-ops dependencies (`84e09891`, `a1299e88`) as a
  carry-forward reminder block.
- **Action 3 (this deliverable):** written before archive.
- **Action 4 (archive):** `git mv process/waves/wave-5/ process/waves/_archive/wave-5/` + commit.
- **Action 5a (wave-close):** `UPDATE waves SET status='ok'` on the running row (wave_number 5, id ae9e80b2);
  trigger sets `ended_at`.
- **Action 5b (handoff anchor):** `process/session/.last-wave-completed.yaml` overwritten with the snapshot below.

## Milestone state machine snapshot

- M1 `5a6efc9e-9de7-4594-a75d-d45e30d9a417` stays `in_progress` (no transition this wave — closure blocked by
  invariant 3, open_count=3). 10 done / 3 open children.
- No promotion, no closure, no decomposition, no roadmap-planning, no daily-checkpoint fired.
- Two founder-ops children remain tracked under M1 (recoverable by wave-6 P-0): `84e09891` (Railway Bucket
  creds, in_progress), `a1299e88` (Resend DNS, todo).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 6"
  - "next wave checklist: process/waves/wave-6/checklist.md"
  - "archive commit: see chore: N-3 archive wave-5"
  - "wave-close: waves wave_number 5 (ae9e80b2) status running->ok"
prev_wave: 5
next_wave: 6
loop_state: ready
seed_task_id: da242f6b-bce7-49c7-a7cc-69ca4849fc6e
bundled_sibling_ids: []
claimed_task_ids: [da242f6b-bce7-49c7-a7cc-69ca4849fc6e]
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: >
  Option A disposition. M1 stays in_progress; wave-6 finishes its last engineering loose end (da242f6b CI
  boot probe). Two founder-ops children (84e09891 creds, a1299e88 DNS) stay tracked under M1, fully
  recoverable from the DB by wave-6 P-0. No premature close, no preemptive pause, no zombie running wave,
  no dropped state. head-next APPROVED all three N-stages.
```

head_signoff (head-next): APPROVED — exactly one of {open next P-0, pause} (open wave-6; preemptive-pause
avoided, no measured trigger); single running wave closed (no zombie/double-close); single-move archive;
handoff anchor carries seed + claimed_task_ids + M1 snapshot; founder-ops children recoverable.
