# N-3 — Handoff (wave-29)

Mode: **automatic**. head-next gate: **APPROVED**. Outcome: **PAUSE** (measured hard-stop).

## Action 1 — Next wave number + loop state
Current wave = 29. Loop **pauses** (N-2 emitted `queue_exhausted: true` AND the resolution is a founder-reserved milestone disposition — no ritual in-flight that will produce work under automatic). Do NOT increment the wave counter. `next_wave: paused`.

## Action 2 — Pause marker (no next-wave dir)
Not pausing? No — pausing. So: do NOT create wave-30 directory. Write `process/session/.loop-paused.yaml` (pause reason = decomposition-pending-founder / M5 decomposable-scope exhausted; founder park-or-key decision required).

## Action 3 — This deliverable
Written before Action 4 archive so it is archived with the wave.

## Action 4 — Archive
`git mv process/waves/wave-29/ process/waves/_archive/wave-29/` (single move).

## Action 5 — Final state emission
- **5a.** Close wave-29 DB row: `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1) RETURNING wave_number` → expect `29`. Trigger sets `ended_at`. (`'ok'` even on pause — the wave still completed.)
- **5b.** Write `process/session/.last-wave-completed.yaml`: last_wave 29, next_wave paused, next_wave_seed_task null (queue-exhausted), active_milestone M5 in_progress, loop_state paused.

## Pause classification — MEASURED, not preemptive
Two measured conditions:
1. **milestone-decomposer `incomplete-scope` verdict** (stage-internal specialist hard-stop; read DB, made no writes) — trigger (d).
2. **Founder-reserved disposition, externally blocked** — only path forward is a founder decision (Path A: supply Resend key → build reminders → close M5; Path B: pivot to M6 voice/video, fully buildable now without any key). Surfaced in founder-digest 2026-07-01, still open. 8th/9th consecutive under-floor M5-debt wave.

`pause_evidence` (written to status-check.yaml): `trigger: d-hard-stop-verdict`, `measurement.shape: board-escalation` (decomposition-incomplete escalation resolving to a founder-reserved milestone disposition).

M5 correctly NOT marked done — unshipped AC (reminders arc). No zombie wave (single running row → single close). No dropped state (DB + archive + digest recover everything for next P-0). Exactly one handoff action: write pause (do NOT open wave-30).

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: paused"
  - "archive commit: (see chore: N-3 archive wave-29 commit)"
  - "waves row 29 closed: status='ok' (RETURNING 29)"
prev_wave: 29
next_wave: paused
loop_state: paused
seed_task_id: null
bundled_sibling_ids: []
claimed_task_ids: []
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
head_signoff:
  verdict: APPROVED
  stage: N-3
  rationale: "M5 not closed (unshipped reminders AC); wave-29 closed via single waves UPDATE (found by status='running'); single-move archive; exactly one handoff action = write pause (measured trigger cited); no dropped state (DB+archive+digest); no zombie wave; no double/missing handoff. Pause well-evidenced, not preemptive."
note: "Founder resumes via Path A (Resend key) or Path B (build M6 voice/video). BLOCKED terminal — no ScheduleWakeup."
```
