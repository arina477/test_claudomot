# L-2 — Distill (wave-49 study timer)

## Action 1-2 — claimed tasks marked done (via head-learn)
All 4 claimed tasks UPDATE'd → `status='done'` (guard `status IN ('todo','in_progress','blocked')`, RETURNING 4/4), verified done:
- `1387d845-...` done (seed: schema + server-scoped backend spine)
- `cb81bf03-...` done (Socket.IO fan-out)
- `c3daf6d3-...` done (widget: display + controls)
- `832b83b7-...` done (phase auto-advance + reconnect reconciliation)
No skips, no stale IDs.

## Action 3-4 — knowledge-synthesizer observations
`process/waves/wave-49/blocks/L/observations.md` — 4 observations (under the 6-cap):
- **obs-A (STRONG, promotion candidate):** B-5 CI-command-parity gap — B-5 produced no deliverable + ran neither `biome ci .` nor the full suite → lint/test escapes (incl. a real prod bug) reached C-1 as 4 fix-up cycles. **3rd confirmed instance** (wave-38, wave-42, wave-49) → structural.
- **obs-B (WARNING, 1st-instance HOLD):** realtime namespace mismatch invisible to mocked-both-sides tests → needs a real socket round-trip test. Candidate T-4.md (hold for 2nd instance).
- **obs-C (WARNING, 1st-instance HOLD):** responsive impl not validated against adopted D-3 design at each specified breakpoint (F-1 slim-bar). Candidate BUILD (hold for 2nd instance).
- **obs-D (INFORMATIONAL):** real-PG integration caught the pause `ends_at` bug units missed — confirmation of existing BUILD rule 9, no new class.

## Action 5-6 — promotion vetting
- **obs-A → BUILD-PRINCIPLES rule 10 candidate.** karen (a95570f42021a3fbb): **APPROVE** — distinct from rules 1-9 (stage-gate full-CI-suite vs rule 7's per-task lint), falsifiable, generalizable, within char limits per karen's count.
- **Deterministic linter: FAIL (why line 104 chars > 100).** Cap-1 karen rewrite (a14a2b2d31b950ddc) → re-linted → **FAIL again (101 > 100, 1 char over).**
- Per L-2 Action 6 "no second rewrite," **candidate DROPPED.** Reason `linter:why>100`. Recorded in observations.md under obs-A. **0 promotions applied this wave.** The STRONG 3rd-instance lesson persists in observations.md and re-nominates on next recurrence (or a future L-2 with a pre-trimmed ≤100-char why line). Deferred on a 1-char format technicality, NOT a semantic rejection — karen's semantic APPROVE stands.

## Action 7 — observation pipeline
All 4 observations retained in `observations.md` for future cross-wave synthesis. obs-B/obs-C are live 1st-instance holds (watch for 2nd instance → promotion).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 1387d845 done, cb81bf03 done, c3daf6d3 done, 832b83b7 done"
  - "observations: process/waves/wave-49/blocks/L/observations.md (4 observations)"
  - "principles promotions: 0 (obs-A karen-APPROVED but linter-dropped after cap-1 rewrite)"
tasks_marked_done: [1387d845, cb81bf03, c3daf6d3, 832b83b7]
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 1
karen_verdicts: [{candidate_id: obs-A, target_file: BUILD-PRINCIPLES.md, verdict: APPROVE}]
linter_runs:
  - {candidate_id: obs-A, target_file: BUILD-PRINCIPLES.md, attempt: 1, verdict: FAIL, rejection_code: "linter:why>100 (104)"}
  - {candidate_id: obs-A, target_file: BUILD-PRINCIPLES.md, attempt: 2, verdict: FAIL, rejection_code: "linter:why>100 (101)"}
candidates_dropped_by_linter: [{candidate_id: obs-A, target_file: BUILD-PRINCIPLES.md, final_reason: "why line 1 char over ≤100 after cap-1 rewrite; re-nominates on next recurrence"}]
promotions_applied: []
note: "obs-A is a STRONG 3rd-instance structural lesson; semantically APPROVED by karen, dropped only on a 1-char linter overflow per the no-second-rewrite contract. Preserved in observations.md."
```
