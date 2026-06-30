# Wave 19 — L-2 Distill Observations

Synthesized from wave-19 artifacts (M3 file/image attachments: data plane + composer + render;
PR#31 squash-merged main@dbf6b25; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{14,15,16,17,18}/blocks/L/observations.md.
Principles files read: CI-PRINCIPLES (2 rules), BUILD-PRINCIPLES (4 rules), VERIFY-PRINCIPLES (1 rule +
V-block candidate section), DESIGN-PRINCIPLES, PRODUCT-PRINCIPLES.

---

```yaml
observations:

  - id: obs-1
    summary: >
      `gh run watch <run-id> --exit-status` returned exit 0 on the initial C-1 CI run
      (run 28465263636, HEAD 42af671), but per-job conclusions read via
      `gh run view --json jobs` showed lint=failure and test=failure. Trusting the watch
      exit code would have merged a red build. The correct gate is reading per-job
      conclusions, not the aggregate watch exit. Identical mechanism to wave-11 obs-1:
      wave-11's watch exit 0 reflected the last-streamed job (e2e, passing) while
      secret-scan had FAILED; wave-19's watch exit 0 masked two failing required jobs
      (lint + test). Wave-17 obs-1 is a related but mechanistically distinct instance
      (Turbo strict-env strips DATABASE_URL_TEST, causing a test tier to silently skip
      with exit 0 -- the watch tool was not the agent of the false-green there).
      The wave-11 class -- "gh run watch exit reflects streaming state, not aggregate
      required-job result; per-job conclusions are authoritative" -- now has two confirmed
      instances: wave-11 + wave-19.
    source:
      - process/waves/wave-19/stages/C-1-pr-ci-merge.md
        # "FALSE-GREEN TRAP CAUGHT (waves 17/18 lesson). `gh run watch 28465263636
        #  --exit-status` returned exit 0 (overall-run-level green), but reading the
        #  per-job conclusions via `gh run view --json jobs` exposed lint: failure and
        #  test: failure."
      - process/waves/_archive/wave-11/blocks/L/observations.md obs-1
        # "`gh run watch --exit-status` returned exit code 0 while the suite conclusion
        #  was failure and secret-scan had FAILED. Tool reflects the exit status of the
        #  last-streamed job, not the aggregate run conclusion."
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      CONFIRMED RECURRENCE: two instances of the same watch-exit mechanism.
        wave-11 obs-1: watch exit 0, last-streamed job was e2e (passing), secret-scan FAILED.
          HELD -- single wave.
        wave-19 (this): watch exit 0, actual per-job conclusions lint=failure, test=failure.
      Wave-17 obs-1 (Turbo env-strip, suite skipped) is a third CI false-green instance but
      a distinct mechanism; it produced a different candidate rule shape (executed-vs-skipped
      counts). The present observation is narrowed to the watch-exit tool-behavior class.
      Two-wave recurrence condition met. CI-PRINCIPLES has 2 rules; cap is clear (rule 3).
    near_dup_check: >
      CI-PRINCIPLES rule 1: platform deployment-state endpoint vs /health false-green. Unrelated.
      CI-PRINCIPLES rule 2: new-route probe after deploy-state SUCCESS. Unrelated.
      Wave-17 obs-1 candidate shape ("read executed-vs-skipped counts"): different sub-class
      (skip suppression, not watch-exit streaming). No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any project using `gh run watch` as a CI gate; the watch tool
        # reflects streaming output order, not the aggregate required-job conclusion.
        # The authoritative check is per-job conclusions from `gh run view --json jobs`.
      falsifiable: true
        # Checkable at every C-1: was the merge gate derived from per-job conclusions
        # (all required jobs conclusion=success), or from watch exit code alone?
        # A watch-exit-only gate is a contract violation of this rule.
      cited: true
        # C-1-pr-ci-merge.md (false-green caught, authoritative per-job check);
        # wave-11 L-2 obs-1 (same mechanism, held as first instance).
    candidate_rule_shape: >
      3. Gate merge on per-job conclusions from `gh run view --json jobs`; never on
         `gh run watch --exit-status` alone.
         Why: The watch tool reflects the last-streamed job state, not the aggregate
         required-job result.
      Rule line = 92 chars (within 120); why line = 75 chars (within 100). No forbidden tokens.
    promotion_requires: karen vet (rule quality) + head-ci-cd sign-off (domain applicability)
    promotion_status: CANDIDATE -- pending karen + head-ci-cd vet

  - id: obs-2
    summary: >
      BUILD-PRINCIPLES rule 4 ("Reproduce one negative path per authz or injection
      boundary at B-6 Phase-2; a Phase-1 code-read APPROVE is not sufficient") was
      promoted at wave-18 L-2 (obs-1, karen + head-builder). Wave-19 Phase-2 /review
      found C-1: the send-time attachment descriptor was fully client-trusted (cross-channel
      key-swap IDOR + size-bypass + type-spoof) while Phase-1 code-read had APPROVED the
      block (noting only that the rule-4 negative-path tests for presign/confirm were
      correct). The Phase-2 adversarial /review traced the send path and found
      validateAndHeadAttachments() was absent, confirming the exact absence-class defect
      BUILD rule 4 mandates be checked. This is the third consecutive wave (wave-17,
      wave-18, wave-19) where Phase-2 /review found a Critical that Phase-1 passed.
      Rule 4 is functioning as intended. No re-promotion warranted; recording as validation.
    source:
      - process/waves/wave-19/stages/B-6-review-output.md (Phase-2, C-1 section)
        # "At send, messages.service.ts:431-443 INSERT the attachment row using the client
        #  values verbatim ... There is no check that a.key is scoped to
        #  attachments/<channelId>/..."
      - process/waves/wave-19/blocks/B/gate-verdict.md
        # Phase-1 REWORK verdict was on H-1 (allowlist drift), not C-1. Phase-2 was the
        # gate that exposed C-1. Rule-4 negative-path mandate was noted: "NOTE for Phase 2
        # (/review per BUILD-PRINCIPLES rule 4): these are unit tests with a mocked
        # RbacService. Phase 2 must adversarially re-verify..."
      - command-center/principles/BUILD-PRINCIPLES.md rule 4
    severity: informational
    candidate_principles_file: none
    recurrence: >
      BUILD-PRINCIPLES rule 4 is already promoted (wave-18). This is a third-wave validation,
      not a new promotion candidate. Rule 4 is working. No action needed beyond this record.
    disposition: VALIDATION of existing rule 4. No new promotion.

  - id: obs-3
    summary: >
      Seven V-block candidates were staged by head-verifier into
      process/waves/wave-19/blocks/V/verify-principles-candidates-for-L2.md. The strongest
      is: "For any untrusted-upload + authz boundary, prove the persisted value is
      server-derived by feeding a spoofed client value and asserting the stored row differs."
      This was the exact test that cleared C-1 at V-3 (the happy-path test in
      messages.service.spec.ts lines 1813-1868 feeds application/pdf/500 bytes as client
      input and asserts the row stores server-derived image/png/204800). Assessing against
      prior archives: VERIFY-PRINCIPLES rule 1 covers seeding ACs via create-path source
      inspection (a wave-X distill), which is a different axis (what to inspect) from
      the spoofed-input test methodology (how to prove server authority). No prior wave
      observation records the spoofed-input test pattern as an L-2 candidate. All seven
      V-block candidates are first-instance observations. HOLD all.
    source:
      - process/waves/wave-19/blocks/V/verify-principles-candidates-for-L2.md
        # "For any untrusted-upload + authz boundary, prove the persisted value is
        #  server-derived by feeding a spoofed client value and asserting the stored row
        #  differs. Why: A test that only sends valid input cannot distinguish a real
        #  server-side re-derive from a client-trusted passthrough."
      - process/waves/wave-19/blocks/V/gate-verdict.md (v3_no_green_by_suppression)
        # "spoofed-input test proves persisted values are server-derived"
    severity: warning
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    recurrence: >
      First instance for each of the seven V-block candidates. No prior wave L-2
      observation records the spoofed-client-value test pattern or the
      spot-check-each-clean-verdict pattern. VERIFY-PRINCIPLES rule 1 (seeding ACs,
      create-path inspection) is a different class. Single-wave occurrence for all.
      HOLD all seven; promote to VERIFY-PRINCIPLES rule 2 (max 1 per file) on second
      confirming wave.
    near_dup_check: >
      VERIFY-PRINCIPLES rule 1: inspect create-path source for seeding ACs. Distinct from
      spoofed-input test methodology (proving runtime server re-derive vs AC-presence).
      No near-dup found for any of the seven candidates.
    disposition: HOLD all. Best candidate for next confirming wave is the spoofed-input
      test pattern (strongest wave-19 evidence; directly cleared C-1).
    candidate_rule_shape_if_confirmed: >
      2. Prove a server-re-derived persist by feeding a spoofed client value and asserting
         the stored row carries the server value, not the client's.
         Why: A test using only valid input cannot distinguish a real re-derive from a
         client-trusted passthrough.
      Rule line = 105 chars (within 120); why line = 79 chars (within 100). No forbidden tokens.

  - id: obs-4
    summary: >
      head-verifier (V-block agent) staged seven L-2 promotion candidates directly into
      VERIFY-PRINCIPLES.md under an "L-2 promotion candidates" section, bypassing the L-2
      distill gate. The candidates were appended to the principles file itself, not recorded
      in an observations.md sidecar or a separate staging file. (They were also staged to
      process/waves/wave-19/blocks/V/verify-principles-candidates-for-L2.md -- a correctly
      placed staging artifact.) The VERIFY-PRINCIPLES.md edit constitutes a principles-file
      write outside L-block. This is the same structural bypass class recorded in
      wave-9/12/17/18 (head-ci-cd appending to CI-PRINCIPLES.md during C-block), now
      extended to V-block (head-verifier + VERIFY-PRINCIPLES.md). The mechanism is
      structurally identical: a gate agent decides a lesson is learnable and writes to the
      principles file rather than the wave observations artifact. The existing revert
      discipline applies: the candidates section in VERIFY-PRINCIPLES.md should be removed
      before L-2 closes; the substantive candidates are preserved in the V-block sidecar
      and captured here. Wave-18 obs-4 disposition was "N-block must implement the
      git diff guard at C-block exit." Wave-19 extends the affected scope to V-block.
    source:
      - command-center/principles/VERIFY-PRINCIPLES.md (current state)
        # Contains an "L-2 promotion candidates" section with seven candidate rules
        # appended below the official ## Rules section, written by head-verifier at V-3.
      - process/waves/wave-19/blocks/V/verify-principles-candidates-for-L2.md
        # Correctly placed staging artifact, same content.
      - process/waves/_archive/wave-18/blocks/L/observations.md obs-4
        # "Four-wave streak (wave-9, wave-12, wave-17, wave-18). N-block must implement
        #  the git diff guard at C-block exit."
    severity: strong
    candidate_principles_file: none
    recurrence: >
      wave-9 obs-2: first instance (head-ci-cd, CI-PRINCIPLES, 4 rules added, reverted).
      wave-12 obs-3: second instance (head-ci-cd, CI-PRINCIPLES, reverted).
      wave-17 obs-3: third instance (head-ci-cd, CI-PRINCIPLES, reverted; escalated to N-block).
      wave-18 obs-4: fourth instance (head-ci-cd, CI-PRINCIPLES, reverted; N-block guard
        still not implemented).
      wave-19 (this): fifth instance; agent class expanded (head-verifier, not head-ci-cd)
        and file scope expanded (VERIFY-PRINCIPLES.md, not CI-PRINCIPLES.md).
      The scope expansion confirms the bypass is not agent-specific or file-specific --
      it is a structural pattern: gate agents write to principles files outside L-block
      whenever they identify a lesson. Observation-only dispositions (waves 9/12/17/18)
      and N-block escalations (waves 17/18) have not suppressed the behavior. The
      proposed git diff guard (`git diff HEAD -- 'command-center/principles/*.md'`) would
      have caught both the C-block and V-block variants.
    disposition: >
      No promotion. Five-wave pattern; N-block structural guard implementation is overdue.
      Proposed guard: at every block exit (not only C-block), fail if
      `git diff HEAD -- 'command-center/principles/*.md'` is non-empty, with an explicit
      message citing the bypass. The wave-19 scope expansion (V-block) argues for broadening
      the guard to cover all block exits, not only C-block. Revert the "L-2 promotion
      candidates" section from VERIFY-PRINCIPLES.md before L-2 closes.

  - id: obs-5
    summary: >
      B-5 reported `lint_passed: true` but the initial C-1 CI run showed lint=failure
      (deterministic, reproducing locally). Root cause: `apps/web/src/shell/messaging.test.tsx`
      had format drift introduced by B-6 fix-up commits; B-5's local lint check passed
      against an auto-fixed or stale local state rather than running the unmodified file.
      Resolved in C-1 fix-up cycle 1 with `biome format --write` (format-only, no logic
      change). The lesson: B-5 must run the exact CI lint command (`pnpm lint`, no
      auto-fix) on the actual committed file state, not a pre-fixed local state.
      Wave-16 obs-1 recorded the adjacent class (biome scanning gitignored artifacts --
      first instance; HELD). Wave-19's instance is a different sub-class: auto-fix masking
      a format error rather than missing artifact exclusion. Both manifest as B-5 lint_passed
      claims that CI contradicts.
    source:
      - process/waves/wave-19/stages/C-1-pr-ci-merge.md (Failure 1 -- lint section)
        # "B-5's local lint check diverged from CI -- likely ran against stale/auto-fixed
        #  local state or a different scope. A re-run will NOT clear it; the file must be
        #  formatted."
      - process/waves/wave-19/stages/C-1-pr-ci-merge.md (Fix-up cycle 1)
        # "biome format --write apps/web/src/shell/messaging.test.tsx -- format-only,
        #  one file. Local pnpm lint exit 0."
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      wave-16 obs-1 (biome scans gitignored artifacts, missing files.ignore, false lint failure
      in CI) -- different sub-class (exclusion gap, not auto-fix masking). HELD, single wave.
      wave-19 (this) -- B-5 reports lint_passed while CI lint fails deterministically; auto-fix
      on local state diverged from committed file. First instance of this specific sub-class.
      The general class ("B-5 lint_passed claim contradicted by CI lint job") now spans two
      sub-classes but each sub-class has only one instance. HOLD this sub-class.
      Recurrence condition not yet met for either sub-class independently.
    near_dup_check: >
      CI-PRINCIPLES rules 1-2: deploy/route verification. Unrelated. No near-dup.
      wave-16 obs-1 candidate shape (files.ignore glob): different sub-class; not promotable
      as a single rule covering both. Hold separately.
    disposition: HOLD. First instance of this sub-class (auto-fix divergence at B-5).
      Promote if a second wave has a B-5 lint_passed claim contradicted by a deterministic
      CI lint failure caused by local-vs-committed file state divergence.
```

---

## Wave-19 L-2 distill disposition

**obs-1 (CI false-green: gh run watch exit masked per-job lint+test failures) -- PROMOTION CANDIDATE.**

Two confirmed instances of the watch-exit mechanism: wave-11 obs-1 (watch exit 0,
last-streamed job was e2e while secret-scan FAILED) and wave-19 (watch exit 0 while
lint=failure + test=failure per-job conclusions). Both are the same tool-behavior
class (watch reflects streaming job state, not aggregate required-job result). Recurrence
condition met. CI-PRINCIPLES has 2 rules; cap is clear. No near-dup with rules 1-2.

Candidate rule (format-valid, no forbidden tokens):
```
3. Gate merge on per-job conclusions from `gh run view --json jobs`; never on
   `gh run watch --exit-status` alone.
   Why: The watch tool reflects the last-streamed job state, not the aggregate
   required-job result.
```
Rule line = 92 chars; why line = 75 chars. No forbidden tokens.

Promotion requires: karen vet (rule quality) + head-ci-cd sign-off (domain applicability).

---

**obs-2 (BUILD rule 4 validated by wave-19 Phase-2 C-1 catch) -- INFORMATIONAL; NO PROMOTION.**

Rule already exists (BUILD-PRINCIPLES rule 4, promoted wave-18). Third consecutive wave of
Phase-2 catching a Critical the Phase-1 passed. Rule is working. No action.

---

**obs-3 (V-block spoofed-client-value test + six other candidates -- all first-instance) -- HOLD all.**

Seven candidates, all first-instance. Strongest is the spoofed-input test methodology
(directly cleared C-1). VERIFY-PRINCIPLES rule 1 is a distinct class (seeding AC inspection).
Hold; promote the spoofed-input candidate to VERIFY-PRINCIPLES rule 2 on a second
confirming wave.

---

**obs-4 (Principles-file write outside L-block -- fifth recurrence, scope expanded to V-block) -- ESCALATE; NO PROMOTION.**

Five-wave pattern (wave-9, 12, 17, 18, 19). Scope has now expanded beyond head-ci-cd +
CI-PRINCIPLES to head-verifier + VERIFY-PRINCIPLES. N-block structural guard is overdue.
The guard should cover all block exits, not only C-block. Revert the candidates section
from VERIFY-PRINCIPLES.md before this L-block closes.

---

**obs-5 (B-5 lint_passed claim contradicted by deterministic CI lint failure) -- HOLD.**

First instance of the auto-fix-divergence sub-class. Wave-16 obs-1 is a different
sub-class (gitignored artifact exclusion). Hold; promote if a second wave has a B-5
lint_passed claim contradicted by CI.

---

## Summary table

| id    | title (short)                                              | severity      | recurrence | disposition                                                          |
|-------|------------------------------------------------------------|---------------|------------|----------------------------------------------------------------------|
| obs-1 | CI false-green: watch exit masked per-job failures         | strong        | 2 waves    | PROMOTE to CI-PRINCIPLES rule 3 (karen + head-ci-cd vet)            |
| obs-2 | BUILD rule 4 validated (3rd consecutive Phase-2 catch)     | informational | 3 waves    | INFORMATIONAL; rule already exists; no action                        |
| obs-3 | V-block spoofed-input + 6 other candidates (all 1st inst.) | warning       | 1 wave     | HOLD all; best candidate for VERIFY-PRINCIPLES rule 2 on 2nd wave   |
| obs-4 | Principles-file bypass outside L-block (5th recurrence)    | strong        | 5 waves    | ESCALATE N-block: widen guard to all block exits; revert VERIFY-PRINCIPLES.md |
| obs-5 | B-5 lint_passed claim contradicted by CI lint job          | warning       | 1 wave     | HOLD; promote if recurs (CI or BUILD-PRINCIPLES depending on shape)  |

**Promotions this wave: 1 candidate (obs-1 to CI-PRINCIPLES rule 3), conditional on karen + head-ci-cd sign-off.**
