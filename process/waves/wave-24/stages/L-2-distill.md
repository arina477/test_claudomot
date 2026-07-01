# Wave 24 — L-2 Distill

## Task done-marking
UPDATE 1 → 02fa8011 (real-PG integration test tier) → done, verified.

## Knowledge synthesis
knowledge-synthesizer (agentId a0685ea131b526c3a) → 5 observations at `process/waves/wave-24/blocks/L/observations.md`:
- **obs-1 (STRONG)** — verify-integration-tier-executed (nonzero, not just green). 2-wave pattern (w17 false-green incident + w24 guard-held-via-manual-check + BOARD binding T-4). Distinct from CI rules 1-4 → **CI-PRINCIPLES rule 5 candidate (PROMOTED).**
- **obs-2 (informational)** — BUILD rule 6 (formatter-before-report) HELD its 1st validation wave (B-4 no format-drift fix-up). No re-promotion.
- **obs-3 (informational)** — PRODUCT rule 1 (verify-what-exists) 2nd post-promotion application (caught the stale wave-14 "build a tier" prose → extend-not-build). Working.
- **obs-4 (WARNING)** — under-floor override-ship, 4th instance (w16/21/23/24) → PRODUCT-PRINCIPLES rule 2 re-submitted with "named external block" qualifier (**REJECTED by karen again**, see below).
- **obs-5 (informational)** — carries: principles-write-guard 4th consecutive hold (structural git-diff guard still unimplemented); Resend key blocked M5 reminders 3+ waves (5-member BOARD escalation → founder digest); prior VERIFY HOLDs unchanged; chrome-absent 67881a58.

## Promotion
karen (agentId aa2023f0f52279cc9) vetted 2 candidates:
- **CI rule 5 (assert-integration-executed): APPROVE** — falsifiable (a reviewer can check the CI integration job asserts executed-count>0), distinct from rules 1-4 (execution-verification axis), 2-wave pattern. Linter → **OK**. **PROMOTED + committed.**
- **PRODUCT rule 2 v2 (override-ship on named external block): REJECT** — STILL non-falsifiable. karen's grounded reason: `incomplete-scope` is contractually the VAGUE-PROSE signal (milestone-decomposition-ritual.md:~100), the "named external block" lives in the decomposer's free-text gap string not a structured token, so a reviewer still can't mechanically distinguish external-block from under-authored-prose. 2nd rejection. karen's re-anchor path for a FUTURE attempt: key the rule to the BOARD escalation artifact (naming a dependency + unblock owner), a read-time-verifiable pair — but that's a different rule subject (needs confirmation). obs-4 stays a soft signal.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 02fa8011 done"
  - "observations: process/waves/wave-24/blocks/L/observations.md (5)"
  - "principles promotions: 1 (CI-PRINCIPLES rule 5)"
tasks_marked_done: [02fa8011-1d44-4a02-a808-eba7191fba1b]
observations_emitted: 5
promotion_candidates: 2
karen_verdicts:
  - {candidate: ci-assert-integration-executed, target: CI-PRINCIPLES.md, verdict: APPROVE}
  - {candidate: product-override-ship-named-external, target: PRODUCT-PRINCIPLES.md, verdict: REJECT, reason: "still non-falsifiable — named-block in free-text prose not a structured token; 2nd rejection"}
linter_runs: [{candidate: ci-assert-integration-executed, verdict: OK}]
promotions_applied: [{file: CI-PRINCIPLES.md, line: 145, rule: "Assert a nonzero executed-count from the CI integration job log; a green exit with zero specs run is a false-green."}]
note: "M5 stays in_progress (L-1: 6 done/10 open). CHANGELOG skipped (test-only, wave-17 precedent). Founder-digest carries persist (Resend key 3+ waves, chrome-absent, principles-guard 4th hold). obs-4 re-anchor-to-BOARD-artifact path noted for future L-2."
```

## Exit
Task done. 5 observations. 1 promotion (CI rule 5). L-block exits → N-block.
