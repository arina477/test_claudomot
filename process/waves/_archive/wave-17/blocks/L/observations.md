# Wave 17 — L-2 Distill Observations

Synthesized from wave-17 artifacts (real-Postgres create-server rollback test + pg-harness;
TEST-INFRA only; PR#29 squash-merged main@dfb65ca; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{12,13,14,15,16}/blocks/L/observations.md.
Principles files read: CI-PRINCIPLES (2 rules), BUILD-PRINCIPLES (3 rules), T-2.md (1 rule),
T-4.md (0 rules), VERIFY-PRINCIPLES (1 rule), PRODUCT-PRINCIPLES (0 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      The `test` CI job reported a green check (all 7 checks passed) on the first CI run,
      but the 3 real-Postgres integration cases were SILENTLY SKIPPED — they did not execute
      at all. The cause: Turbo 2.x runs tasks in strict-env isolation; DATABASE_URL_TEST was
      declared at the job `env:` level in ci.yml but was NOT declared in the `test:ci` task's
      `env[]` array in turbo.json, so Turbo stripped the var before spawning the task process.
      Inside the task, `process.env.DATABASE_URL_TEST === undefined`, the spec's
      `describe.skipIf(!DATABASE_URL_TEST)` fired, vitest exited 0 (skip is not failure),
      Turbo reported "4 successful", and GitHub registered a green check. The wave's
      acceptance criterion — rollback proven against a real Postgres in CI — was never
      actually evaluated. Caught only because head-ci-cd READ the test-job log and observed
      `1 skipped (1) / 4 skipped (4)` counts rather than trusting the green check icon.
      Fix: add `"env": ["DATABASE_URL_TEST"]` to the turbo.json `test:ci` task + `cache:
      false` (so a cached green cannot re-mask). Re-run showed `3 passed (3)` — true green.
    source:
      - process/waves/wave-17/stages/C-1-pr-ci-merge.md
        # "CRITICAL FINDING — false-green on the `test` job (integration suite SKIPPED,
        #  not run)" and root-cause analysis: Turbo 2.x strict-env strips DATABASE_URL_TEST;
        #  re-run evidence "3 passed (3)" after turbo.json fix commit b0d8d22.
      - process/waves/wave-17/blocks/V/gate-verdict.md
        # "the first CI run was a green-by-suppression false-green (Turbo 2.x strict-env-strip
        #  dropped DATABASE_URL_TEST → describe.skipIf(SKIP) silently skipped the suite),
        #  which C-1 caught by log inspection"
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      Prior wave CI false-green records:
        wave-11 obs-1: `gh run watch --exit-status` returned exit 0 while suite conclusion
          was failure (last-streamed job was passing; tool reflected last-streamed job status,
          not aggregate). Different mechanism: tool output ordering, not test suppression.
          HELD — single wave.
      No prior wave observation records the specific class: a test tier silently skips
      (skipIf / describe.skip / env guard evaluates false) and vitest exits 0, producing a
      green CI check with zero test execution against the coverage target. Wave-17 is the
      first confirmed instance of this skip-evaluates-as-pass false-green class.
      HOLD; promote to CI-PRINCIPLES rule 3 if a second wave has a CI check green-by-
      suppression where a test tier skipped (not failed) due to a missing/stripped env var
      or equivalent runtime guard.
    near_dup_check: >
      CI-PRINCIPLES rule 1: platform deployment-state vs /health false-green. Different
      domain (deploy verification, not test execution).
      CI-PRINCIPLES rule 2: new-route probe after deploy-state SUCCESS. Unrelated.
      Wave-11 obs-1 (gh run watch): tool output false-green, not skip-based suppression.
      No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any project using a monorepo build orchestrator with strict-env
        # isolation (Turbo, Nx, Bazel) where CI injects env vars at the job level but the
        # task's env allowlist is incomplete; any test tier with a skipIf guard on that var
        # will silently skip without failing, making the CI check green.
      falsifiable: true
        # Checkable at C-1: for every test job, do the executed-vs-skipped counts in the
        # log match the expected number of test cases? A green check with 0 executed and
        # N skipped is a false-green by suppression, not a pass.
      cited: true
        # C-1-pr-ci-merge.md (full false-green root-cause analysis + re-run evidence);
        # V gate-verdict (independent corroboration of the false-green catch + fix).
    candidate_rule_shape: >
      3. Read the test job's executed-vs-skipped counts in the log; a green check with
         0 executed tests is a false-green by suppression, not a pass.
         Why: A skipped test tier exits 0 and produces a green CI check with nothing verified.
      Rule line = 102 chars (within 120); why line = 70 chars (within 100). No forbidden tokens.

  - id: obs-2
    summary: >
      The B-6 Phase-1 gate (head-builder code-reading) APPROVED the integration test, but
      the test was entirely non-functional as written: (C1) the rollback case called
      `vi.spyOn(dbModule.db, 'transaction')` on a get-only Proxy — the Proxy has no `set`
      trap, `Object.getOwnPropertyDescriptor` returns nothing for the synthesized property,
      and vitest throws `Error: transaction does not exist` at setup before any SUT code ran;
      (H2) the first-insert collision test spied `serversMod.generateCode` but the SUT calls
      it as a bare intra-module reference, so the spy never bound. Both cases had been
      written but proved nothing: one threw at setup, one silently failed to inject the fault.
      The local `describe.skipIf(!DATABASE_URL_TEST)` meant neither defect was observable
      without a real DB — they were hidden by the skip. Phase-1 read the code, missed both.
      Phase-2 empirical /review reproduced both defects against the real SUT (Proxy
      throw + intra-module spy no-op), identified the correct injection seam
      (`pool.connect` — writable, real, module-boundary-agnostic), and triggered a REWORK.
      The wave's acceptance criterion required a real Postgres run to expose the gap.
    source:
      - process/waves/wave-17/stages/B-6-review-output.md
        # Phase-1 verdict: APPROVED (code-reading only). Phase-2 findings: C1 (db Proxy
        # unspyable — empirically reproduced), H2 (generateCode intra-module spy no-op —
        # empirically reproduced). Summary: "the two headline ACs are both non-functional
        # as written." Phase-2 verdict: B-6 re-enters (REWORK).
      - process/waves/wave-17/stages/B-6-review.md
        # "Phase 1 head-builder APPROVED by CODE-READING — but the test was non-functional
        #  as written. The local skip (no DATABASE_URL_TEST) HID this; only Phase-2 /review's
        #  EMPIRICAL reproduction + a REAL Postgres run caught it."
    severity: strong
    candidate_principles_file: command-center/principles/test-layer-principles/T-4.md
    recurrence: >
      Prior related observations:
        wave-15 obs-3: real-PG integration tier absent for message_mentions (task 02fa8011,
          2-wave carry). That observation is about the ABSENCE of a real-PG tier for an
          association table, not about a present-but-non-functional test hiding behind a skip.
          Different class.
        wave-14 obs-1 / wave-15 obs-1 (T-2.md rule 1, promoted): unit fan-out tests that
          mock the routing layer, making the component correct in isolation while broadcast
          composition is broken. Those tests PASSED (wrong passing assertions). This wave's
          defect is a test that ERRORS at setup (C1) or silently fails to inject the fault
          (H2) — it would have FAILED against a real DB, not falsely passed. The class is
          distinct: skip-masked non-functional, not mock-masked wrong-assertion.
      Wave-17 is the first L-2 observation for the class: an integration test that skips
      locally (no DB env var) can be structurally broken in ways that only a real DB run
      would reveal; code-reading cannot substitute for execution.
      HOLD; promote to T-4.md rule 1 if a second wave has an integration test that appeared
      correct on code-reading but was non-functional, with the defect concealed by a local
      skip-without-DB guard.
    near_dup_check: >
      T-4.md Rules: empty (0 rules). No near-dup possible.
      T-2.md rule 1: fan-out recipient-perspective assertion. Different class (wrong assertion
      vs non-functional setup).
    promotion_gates:
      generalizable: true
        # Applies to any integration test that guards on a runtime env var to skip locally,
        # and uses a spy or mock injection strategy that can only be validated by running
        # against the real runtime. Code-reading cannot detect a Proxy that has no set trap,
        # or an intra-module bare call that silences a spy.
      falsifiable: true
        # Checkable at B-5/B-6: for every integration test that skips locally (guard on
        # DATABASE_URL_TEST or equivalent), was the test executed against a real DB at
        # least once in this wave before the Phase-1 gate APPROVE?
      cited: true
        # B-6-review-output.md (Phase-2 empirical findings C1+H2, empirical reproduction
        # transcripts); B-6-review.md (Phase-1 APPROVE followed by Phase-2 REWORK); C-1
        # (wave confirms no real-PG run happened in Phase-1 iteration).
    candidate_rule_shape: >
      1. Run every integration test that skips locally against a real DB before a gate
         APPROVE; code-reading a skip-guarded test cannot confirm it is functional.
         Why: A test that errors at setup or injects no fault exits 0 on skip, hiding
         the defect.
      Rule line = 111 chars (within 120); why line = 75 chars (within 100). No forbidden tokens.

  - id: obs-3
    summary: >
      head-ci-cd appended 2 rules to CI-PRINCIPLES.md during the C-block, bypassing the
      L-2 distill gate. The rules were reverted before L-2 ran. This is the third recorded
      instance of a C-block agent writing directly to a canonical principles file outside the
      L-2 gate: wave-9 obs-2 (4 rules added by head-ci-cd, reverted), wave-12 obs-3 (2 rules
      added by head-ci-cd at C-2, confirmed recurrence documented). The prior recurrence
      count and the per-wave-per-file cap (maximum 1 promotion per file) are not preventing
      the bypass. The substantive content of the added rules may be correct; the bypass path
      is wrong. The revert-before-L2 mitigation continues to function (the principles file
      is not permanently corrupted), but the three-wave recurrence pattern signals the
      process discipline is not self-correcting from observation-only records.
    source:
      - prompt context (head-ci-cd added 2 rules at C-block; reverted before L-2)
      - process/waves/_archive/wave-12/blocks/L/observations.md obs-3
        # "CONFIRMED RECURRENCE: wave-9 (same pattern, rules subsequently reverted) and
        #  wave-12. Two waves."
      - process/waves/_archive/wave-9/blocks/L/observations.md obs-2
        # "First recorded instance of a C-block agent bypassing the L-2 gate to directly
        #  edit a principles file."
    severity: strong
    candidate_principles_file: none
    recurrence: >
      wave-9 obs-2: first instance (4 rules added, reverted). HELD.
      wave-12 obs-3: CONFIRMED RECURRENCE (2 rules added at C-2, same pattern, reverted).
        Documented as a two-wave confirmed process-discipline gap. No structural guard added.
      wave-17 (this): third instance (2 rules added at C-block, reverted). Three-wave streak.
      The observation-only-hold disposition from wave-12 has not suppressed the behavior.
      No principles file can encode this as a rule (the bypass is self-referential — an agent
      that bypasses the gate would bypass a rule about the gate). Structural remediation is
      outside L-2's scope; flagged for N-block / process review. The revert mechanism works;
      the preventive mechanism does not.
    near_dup_check: >
      CI-PRINCIPLES rules 1-2: deploy/route verification. Unrelated. No near-dup.
    disposition: >
      No promotion. Three-wave signal escalated to N-block for structural process review
      (e.g., a pre-commit hook or C-block exit check: `git diff HEAD -- 'command-center/
      principles/*.md'` returns non-empty → gate fails with an explicit bypass message).
      The wave-12 disposition (informational-hold) is insufficient given third recurrence.
```

---

## Wave-17 L-2 distill disposition

**obs-1 (false-green by skip suppression — turbo strict-env strips test env var) — HOLD.**

First confirmed instance of the skip-evaluates-as-pass class. Wave-11 obs-1 (`gh run watch`
false-green) is mechanistically distinct (tool output ordering, not test skip). No prior wave
records a skipped test tier producing a green CI check with 0 executions in this project.
Single-wave occurrence. HOLD; promote to CI-PRINCIPLES rule 3 on a second confirming wave.

Candidate rule (shape only — format-valid, no forbidden tokens):
```
3. Read the test job's executed-vs-skipped counts in the log; a green check with
   0 executed tests is a false-green by suppression, not a pass.
   Why: A skipped test tier exits 0 and produces a green CI check with nothing verified.
```
Rule line = 102 chars; why line = 70 chars. No forbidden tokens. No near-dup with CI-PRINCIPLES rules 1-2.

**obs-2 (integration test non-functional under skip, code-reading insufficient) — HOLD.**

First L-2 observation for this class. Distinct from wave-14/15 fan-out mock false-green (T-2
rule 1): those tests PASSED with wrong assertions; this test ERRORED at setup, concealed by
skip. T-4.md has 0 rules; cap is clear. Single-wave occurrence. HOLD; promote to T-4.md
rule 1 on second confirming wave.

Candidate rule (shape only):
```
1. Run every integration test that skips locally against a real DB before a gate
   APPROVE; code-reading a skip-guarded test cannot confirm it is functional.
   Why: A test that errors at setup or injects no fault exits 0 on skip, hiding
   the defect.
```
Rule line = 111 chars; why line = 75 chars. No forbidden tokens.

**obs-3 (CI-PRINCIPLES bypass by head-ci-cd — third recurrence) — ESCALATE to N-block.**

Three-wave pattern (wave-9, wave-12, wave-17). Observation-only disposition from wave-12
has not suppressed the behavior. No principles file promotion is warranted (the mechanism
is self-referential). Escalation: N-block should evaluate a structural guard at C-block
exit (e.g., a git diff check confirming no principles file was modified outside L-block).

---

## Summary table

| id    | title (short)                                      | severity | recurrence | disposition                                               |
|-------|----------------------------------------------------|----------|------------|-----------------------------------------------------------|
| obs-1 | False-green by skip suppression (Turbo env-strip)  | strong   | 1 wave     | HOLD; promote to CI-PRINCIPLES rule 3 on second instance  |
| obs-2 | Skip-masked non-functional integration test        | strong   | 1 wave     | HOLD; promote to T-4.md rule 1 on second instance         |
| obs-3 | CI-PRINCIPLES bypass by C-block agent (3rd recur.) | strong   | 3 waves    | ESCALATE to N-block for structural guard; no rule          |

**Promotions this wave: 0.** Both technical observations are first instances.
obs-3 has reached three-wave recurrence but warrants structural process change,
not a principles file rule.
