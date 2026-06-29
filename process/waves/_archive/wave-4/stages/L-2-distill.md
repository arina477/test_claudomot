# L-2 — Distill (wave-4 profile customization)

## Action 1+2 — Mark claimed task done + verify
```sql
UPDATE tasks SET status='done'
WHERE id='2a655960-a429-432d-8633-e8f149368ca3' AND status IN ('todo','in_progress','blocked')
RETURNING id;   -- returned 1 row
SELECT id, status FROM tasks WHERE id='2a655960-a429-432d-8633-e8f149368ca3';  -- 2a655960...|done
```
Single-task bundle (seed only, no siblings). Verified `done`.

## Action 3 — knowledge-synthesizer
Spawned over `process/waves/wave-4/` + prior `_archive/wave-{1,3}/blocks/L/observations.md` + principles files. Emitted **4 observations** to `process/waves/wave-4/blocks/L/observations.md` (obs-1 strong/candidate, obs-2 warning/candidate, obs-3 informational, obs-4 warning/context). Within the 0-6 bound — no pruning.

## Action 4 — Promotion candidates (2)
- **obs-1** → T-4.md — integration tests must drive the REAL driver/ORM error, not a synthetic stub. Generalizable/falsifiable/cited.
- **obs-2** → PRODUCT-PRINCIPLES.md — surface account-gated external creds at planning. Self-rated warning.

## Action 5 — karen vetting
Spawned karen on obs-1 (the only candidate clearing the head-learn bar; obs-2 was warning-grade + planned-deferral, not advanced). karen verdict: **REJECT**.
- Code claims verified: `users.service.ts:23-38,85-92` walks `err.cause.code`/`err.cause.cause.code` → 409 ConflictException (**PASS**); `db/schema/users.ts:17` `users_username_lower_idx` on `lower(username)` (**PASS**).
- **Claim REFUTED:** the "regression test" `users.service.spec.ts:10-16,26-45,74-82` mocks the DB and hand-builds `makeDrizzleUniqueViolation()` — a synthetic error object — and does NOT drive a real duplicate insert. The proposed rule's own justifying artifact violates the rule. No truthful exemplar exists to canonize.
- Also: format length violations (rule 137>120, why 113>100 chars); single-wave occurrence of the specific mechanism vs T-4 contract's 2+-wave requirement.

## Action 6 — Promotion
**ZERO promotions.** No principles file edited. Linter not run (no candidate reached the candidate-file stage). obs-1 parked with a re-submit condition (real integration test + recurrence) appended to observations.md. obs-2 held for an unplanned third instance.

## Action 7 — Pipeline state
Observations recorded; promote-zero is the common, correct outcome. Soft signal for N-1/founder: the dup-username fix shipped correct PRODUCTION behavior but the test is still a synthetic-stub unit test — the exact anti-pattern obs-1 names. A real integration test (real/PGlite/testcontainer Postgres duplicate insert → assert 409) is worth authoring in a hardening wave; route to head-tester/test-automator. This is a soft recommendation, not a blocking finding.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 2a655960-a429-432d-8633-e8f149368ca3 done (UPDATE 1; verified done)"
  - "observations: process/waves/wave-4/blocks/L/observations.md (4 observations)"
  - "principles promotions: 0 across [] (karen REJECT obs-1: justifying test is synthetic stub + single-wave + format; obs-2 warning-grade planned-deferral not advanced)"
tasks_marked_done: [2a655960-a429-432d-8633-e8f149368ca3]
tasks_skipped_with_reason: []
observations_emitted: 4
promotion_candidates: 2
karen_verdicts:
  - {candidate_id: obs-1, target_file: command-center/principles/test-layer-principles/T-4.md, verdict: REJECT}
linter_runs: []
candidates_dropped_by_linter: []
promotions_applied: []
note: "Promote-zero. obs-1 rejected by karen (synthetic-stub test refutes the rule's own exemplar + single-wave mechanism + length). obs-2 held (planned deferral, not unplanned recurrence). Restraint = correct outcome."
```
