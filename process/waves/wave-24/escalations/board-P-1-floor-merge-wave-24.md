# BOARD — P-1-floor-merge-wave-24

**Mode:** automatic | **Threshold:** 4+/7 (process/sizing) | **3rd instance** of the identical floor-merge (w23 precedent, product-decisions 2026-07-02).

## Question
Wave-24 seed 02fa8011 (~500 LOC test-infra: extend the existing wave-17 real-PG harness with presence + member-gate + rbac/assignments-authz integration specs) is below the single-spec floor (>1,500 LOC); mandated decomposition-expansion returned incomplete-scope (M5's sole unbuilt scope = reminders, cred-blocked). Options: A override-ship + log exception · B hold-until-roadmap-planning · C cancel seed.

## Votes (7)
| Member | Vote | Hard-stop | One-line |
|---|---|---|---|
| strategist | APPROVE A | none | On-thesis build-quality; closes F23-T-4 authz-integration gap; holding idles loop for zero gain. |
| realist | APPROVE A | none | "EXTEND not build" verified (pg-harness.ts:14 names task 02fa8011; 1 current consumer); integration ≠ redundant with one-time pentest (continuous regression net). |
| risk-officer | APPROVE A | none | Test-only, lowest blast radius; only risk is wave-17 false-green → T-block-verifiable (assert nonzero executed + real-DB row counts). |
| counter-thinker | APPROVE A | none | Steel-manned opposition (pick-user-visible/pause-for-key/coverage-theater) qualifies but doesn't overturn; authz regression tests on freshly-shipped code are least-theater coverage. |
| industry-expert | APPROVE A | none | Authz boundaries getting integration coverage is a converged norm; thin-consumer-of-shared-harness is right pattern; LOC floor doesn't map to test-hardening. |
| user-advocate | ABSTAIN | none | Pure infra, no user-perceivable surface; abstains cleanly per card. |
| founder-proxy | APPROVE A | none | Near-identical wave-23 precedent (product-decisions L300-305); founder's recorded "floor-merge ceremony adds no value" for test/infra-reuse (L216-217, L263-266); keep-shipping/defer-only-on-credentials disposition. |

## Decision: APPROVE A — override-ship (6/7, ABSTAIN 1; default threshold 4+/7 cleared; no hard-stops)

Run wave-24 as the ~500-LOC under-floor test-infra slice. Log the floor exception. claimed_task_ids = [02fa8011].

## Convergent dissent / carries (5 members flagged; act on these)
1. **Resend key = M5's real unblock — escalate MORE sharply to founder** (strategist + counter-thinker + realist + founder-proxy). 3rd consecutive floor-override means M5's only demand-facing scope (reminders) keeps deferring on a founder-clearable key. The loop must surface this so debt waves don't mask that M5 is stalled. → strengthened the founder digest.
2. **Floor-rubric revision** (industry-expert + founder-proxy): the LOC floor is a feature-wave guard; it doesn't fit test-hardening / cred-blocked-milestone phases. → L-2 / roadmap-planning candidate (do NOT re-litigate a 4th per-wave). Note: an L-2 attempt to codify this (wave-23 obs-4) was karen-REJECTED as non-falsifiable — a falsifiable framing (name the external dependency) is needed.
3. **T-4 false-green condition (risk-officer, binding):** T-block MUST verify per-CI-job the integration tier actually executed — nonzero executed count + real-DB round-trip row-count as each spec's load-bearing assertion. A green exit with 0/skipped specs is a false-green and fails the gate (wave-17 lesson).
