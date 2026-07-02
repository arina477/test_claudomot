# Wave 32 — L-2 Distill

## Action 1-2 — Tasks marked done
- 78f51968 (seed) → done (verified). Single-spec bundle, no siblings.

## Action 3 — Observations (knowledge-synthesizer)
4 observations at process/waves/wave-32/blocks/L/observations.md (+ 2 pre-existing B-2/B-5 notes):
- obs-1 (warning): wiring new api method into existing component invalidates its enumerated mock (2nd instance w23+w32) → BUILD candidate.
- obs-2 (warning, HOLD): :id route param without format validator → 500 not 400 (T-8 catch) → T-8 candidate (1st isolation).
- obs-3 (info, HOLD): typed api method added but consumer fetches inline (B-4 drift) → BUILD candidate (1st).
- obs-4 (info): credential-independent build + defer-live-verify (2nd instance w31+w32) → PRODUCT candidate.

## Action 5 — karen vetting
- obs-1 (BUILD rule 9): substance APPROVE (2nd-instance w23+w32 evidence verified real in archives), but the synthesizer FABRICATED char counts (all 4 lines busted limits). karen flagged.
- obs-4 (PRODUCT rule 3): substance APPROVE (2nd-instance w31+w32 verified), same fabricated-count issue.

## Action 6 — Lint + promote
- **PRODUCT rule 3: PROMOTED** ✓ — after karen cap-1 rewrite, linter PASS (rule 119≤120, why 91≤100). Appended to command-center/principles/PRODUCT-PRINCIPLES.md.
- **BUILD rule 9: DROPPED** — 2nd linter failure (why line held at 104>100 even after the cap-1 karen rewrite; karen miscounted as 99). Per L-2 "no second rewrite" rule → dropped. Substance is sound; observation retained in observations.md for a future wave's L-2 with a ~4-char-tighter why line.

## Per-file cap respected: 1 PRODUCT promotion, 0 BUILD (dropped). Distinct files.

## Process note (for head-learn / future L-2)
Both the synthesizer AND karen mis-reported char counts (synthesizer by 20-40, karen by ~4). Recommend L-2 require a mechanical `awk '{print length}'` count embedded in each candidate block, not a model-asserted number. The orchestrator's own linter caught both.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 78f51968 done"
  - "observations: process/waves/wave-32/blocks/L/observations.md (4 observations)"
  - "principles promotions: 1 (PRODUCT-PRINCIPLES rule 3)"
tasks_marked_done: [78f51968-2c48-4368-93d4-7d3f02111a7b]
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 2
karen_verdicts:
  - {candidate_id: obs-1, target_file: BUILD-PRINCIPLES.md, verdict: APPROVE-substance-then-linter-DROP}
  - {candidate_id: obs-4, target_file: PRODUCT-PRINCIPLES.md, verdict: APPROVE}
linter_runs:
  - {candidate_id: obs-1, target_file: BUILD-PRINCIPLES.md, attempt: 2, verdict: FAIL, rejection_code: "linter:why>100 (104)"}
  - {candidate_id: obs-4, target_file: PRODUCT-PRINCIPLES.md, attempt: 2, verdict: PASS}
candidates_dropped_by_linter:
  - {candidate_id: obs-1, target_file: BUILD-PRINCIPLES.md, final_reason: "why line 104>100 after cap-1 rewrite; substance sound, retained for future"}
promotions_applied:
  - {file: PRODUCT-PRINCIPLES.md, line: "rule 3", rule: "Build an external-SDK feature's credential-independent ACs now with a placeholder key; defer live verify to T-5/C-2."}
```
