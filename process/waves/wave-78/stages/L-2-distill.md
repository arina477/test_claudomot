# Wave 78 — L-2 Distill

## Task done-marking (Action 1-2)
Both claimed tasks todo/in_progress→done + verified: 4be3b084 (academicRole clearable) done; 3b3530d8 (card fail-closed hidden-vs-error) done. UPDATE 2.

## Synthesis (Action 3-4)
knowledge-synthesizer emitted **4 observations** → `process/waves/wave-78/blocks/L/observations.md` (1 strong, 1 warning, 2 informational). Dedup: both wave-77 promotions (BUILD-16 delegate-authz-to-seam, T-8-4 assert-body) already SHIPPED — NOT re-proposed; wave-78's uniform-404 body work is a 3rd-instance confirming T-8-4 (recorded only). wave-77 obs-4 (privacy-hidden/fetch-failure conflation) RESOLVED this wave (successor = obs-1).
- **obs-1 (STRONG 1st) → BUILD-PRINCIPLES rule 17** — fail-closed hidden-vs-error branch direction.
- obs-2 (WARNING, HOLD 1st) → VERIFY squash-merge content-not-ancestry — HOLD for 2nd instance.

## Vetting + linting + promotion (Action 5-6)
karen vetted obs-1 → **APPROVE**: falsifiable, generalizable, distinct from rule 16 (server-authz axis vs client-branch-direction), not a test-layer dup; **strong 1st-instance JUSTIFIED** (security-critical privacy oracle, binary, costly-if-ignored, invisible to happy-path + code-read APPROVE). Linter PASS (rule 92... 117 incl "17. ", why ≤100, 2 lines, no forbidden tokens). Promoted.

## Promotion applied
- **BUILD-PRINCIPLES.md rule 17** — "Default a hidden-vs-error UI branch to hidden with an explicit error-allowlist, never a not-equal-status default."
obs-2 held (needs 2nd instance).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 4be3b084 done, 3b3530d8 done"
  - "observations: process/waves/wave-78/blocks/L/observations.md (4 observations)"
  - "principles promotions: 1 (BUILD-PRINCIPLES.md rule 17)"
tasks_marked_done: [4be3b084-c86f-48f6-b3fc-fe9e95d60556, 3b3530d8-f452-4e26-b50d-be2d3dabf384]
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 1
karen_verdicts:
  - {candidate_id: BUILD-17, target_file: command-center/principles/BUILD-PRINCIPLES.md, verdict: APPROVE}
linter_runs:
  - {candidate_id: BUILD-17, target_file: BUILD-PRINCIPLES.md, attempt: 1, verdict: PASS, rejection_code: ""}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: command-center/principles/BUILD-PRINCIPLES.md, line: 17, rule: "Default a hidden-vs-error UI branch to hidden with an explicit error-allowlist, never a not-equal-status default."}
note: "Strong 1st-instance promotion (security-critical anti-oracle branch direction); the pattern was a real fail-open defect caught by the B-6 /review adversarial pass and hardened to fail-closed."
```
