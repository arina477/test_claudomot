# Wave 72 — L-2 Distill

## Task done-marking (Actions 1-2)
All 3 claimed bundle tasks → done (verified): 9658fb0b (erasure API), e11f8746 (DTO), 898490b1 (Danger-Zone UI).

## Observations (Action 3) — knowledge-synthesizer
`process/waves/wave-72/blocks/L/observations.md` — 4 entries. Two cleared the 2-wave recurrence bar → promotion candidates; one novel-class 1st-instance held; HOLD statuses maintained.

## Promotions (Actions 5-6) — karen-vetted + deterministic-linter PASS
- **CI-PRINCIPLES rule 11** (2nd instance, wave-58 + wave-72): "Mark an e2e whose baseURL targets deployed prod as non-required; it verifies the deployed binary, not the branch." — a prod-baseURL e2e (StudyHall's `E2E_BASE_URL`) tests the deployed binary, so it went green while the wave-72 branch carried the undeployed white-screen regression.
- **BUILD-PRINCIPLES rule 15** (3rd instance, waves 65/69/72): "Wrap a multi-step mutation that must be all-or-nothing in a DB transaction, not separate auto-committed statements." — the wave-72 non-atomic PII-scrub+deleted_at+leave-servers sequence (caught by B-6 /review) is the 3rd confirming instance.
- **HELD (1st instance, not promoted):** the P0-causal "green CI `build` proves emit not run; a CJS `require(` artifact in a browser SPA bundle white-screens at runtime, invisible to the Node boot-probe" — genuine novel class + P0 severity, but 1st instance; recurrence bar not cleared. Retained in observations.md for next-recurrence promotion. (This wave's P0 was still fixed; the rule just isn't promoted yet.)

Both promotions passed karen (APPROVE) + a cap-1 karen rewrite (length trim) + the deterministic linter (rule ≤120, why ≤100, no forbidden tokens, exactly 2 lines).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 9658fb0b done, e11f8746 done, 898490b1 done"
  - "observations: process/waves/wave-72/blocks/L/observations.md (4 observations)"
  - "principles promotions: 2 (BUILD-PRINCIPLES rule 15, CI-PRINCIPLES rule 11)"
tasks_marked_done: [9658fb0b-567a-44f7-b873-c8d110e7d391, e11f8746-e85f-4900-ac82-a08c50f147d3, 898490b1-e658-4968-adfd-e75a85c75864]
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 3   # CI rule 11, BUILD B1 (rule 15), BUILD B2 (held)
karen_verdicts:
  - {candidate_id: CI-11, target_file: CI-PRINCIPLES.md, verdict: APPROVE}
  - {candidate_id: BUILD-B1, target_file: BUILD-PRINCIPLES.md, verdict: APPROVE}
  - {candidate_id: BUILD-B2-cjs-bundle, target_file: BUILD-PRINCIPLES.md, verdict: REJECT-held-1st-instance}
linter_runs:
  - {candidate_id: CI-11, attempt: 1, verdict: FAIL, rejection_code: "why>100"}
  - {candidate_id: CI-11, attempt: 2, verdict: PASS}
  - {candidate_id: BUILD-B1, attempt: 1, verdict: FAIL, rejection_code: "rule>120"}
  - {candidate_id: BUILD-B1, attempt: 2, verdict: PASS}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: BUILD-PRINCIPLES.md, rule: 15}
  - {file: CI-PRINCIPLES.md, rule: 11}
note: "B2 (CJS-in-browser-bundle white-screen, P0-causal) held to observations — 1st instance, per-file cap goes to the bar-clearing B1."
```
