# Wave 40 — L-2 Distill Observations

Synthesized from wave-40 artifacts (M7 avatar endpoint hardening: GET /users/:userId/avatar
NUL/control-byte 500 → 400 via boundary guard; POST /profile/avatar/confirm NoSuchKey 500 →
404; PR #54 squash-merged 9c5054d; V-block APPROVED first round — V-2 0 blocking, V-3 APPROVED).
Inputs read:
process/waves/wave-40/stages/P-0-frame.md, P-0-problem-framer.md, P-1-decompose.md,
P-2-spec.md, P-3-plan.md, B-2-backend.md, B-5-verify.md, B-6-review-output.md,
C-1-pr-ci-merge.md, T-2-unit.md, T-5-e2e.md, T-8-security.md, V-1-karen.md, V-1-jenny.md,
V-2-triage.md, V-3-fast-fix.md.
Prior archives consulted: process/waves/_archive/wave-{38,39}/blocks/L/observations.md;
process/waves/_archive/wave-{32,33,34,35,36,37}/blocks/L/observations.md (recurrence checks
on server-roles flake and T-8 malformed-param class); B-5-verify.md across waves 32/35/36/37.
Principles files read: BUILD-PRINCIPLES (8 rules), PRODUCT-PRINCIPLES (3 rules),
CI-PRINCIPLES (7 rules), T-2.md (1 rule), T-5.md (1 rule), T-8.md (2 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      The wave-40 task description included "add ParseUUIDPipe to :userId" as the
      proposed fix for the NUL-byte 500 on GET /users/:userId/avatar — copied verbatim
      from the wave-38 T-8 finding's Remediation field (F-T8-1: "validate :userId with
      ParseUUIDPipe before DB/storage access; return 400 for malformed ids"). The P-0
      problem-framer issued a REFRAME on two compounding grounds, both discovered by
      checking the proposed mechanism against the current architecture.

      (1) ParseUUIDPipe contradicts the wave-33 global-filter decision. Wave-33 resolved
      the project-wide non-UUID-route-param 500 class by a GLOBAL exception filter mapping
      Postgres 22P02 (invalid_text_representation) → 400, explicitly rejecting the
      per-route ParseUUIDPipe approach. ParseUUIDPipe usage is zero across apps/api. The
      T-8 remediation was authored BEFORE wave-33 landed; the wave-33 decision retired it.
      Carrying the T-8 remediation forward without checking it against the wave-33 decision
      would have introduced ParseUUIDPipe on a route where it had been explicitly rejected.

      (2) The proposed fix targets the wrong error class. users.id is `text('id').primaryKey()`
      (populated by SuperTokens getUserId() — an opaque provider string, NOT contractually a
      UUID). ParseUUIDPipe would 400 legitimate avatar fetches for any user whose SuperTokens
      id is not UUID-shaped (a real, live population). And because the column is text (no uuid
      cast), a NUL byte does NOT raise Postgres 22P02; it triggers a driver-level
      untranslatable-character error that the existing filter never catches. ParseUUIDPipe
      would have simultaneously introduced a regression on legitimate ids AND failed to fix
      the original 500.

      The corrected fix (option A: control-byte boundary guard on the :userId param, no UUID
      shape imposed) was built, verified live at T-8 (all 5 probes PASS including non-UUID
      regression), and APPROVED at V-block first round with 0 non-blocking findings.

      The generalizable class: when a T-8 finding's Remediation field proposes a specific fix
      mechanism, that mechanism must be validated against (a) architectural decisions made
      AFTER the finding was recorded and (b) the actual column type / error class the fix
      would target. A T-8 remediation that was correct at time of authoring can be made
      incorrect by subsequent wave decisions that retire the proposed mechanism.
    source:
      - process/waves/wave-40/stages/P-0-problem-framer.md
        # verdict: REFRAME; matched_antipatterns: [2, 10]
        # "(a) users.id is text('id').primaryKey() populated by SuperTokens session.getUserId()
        #   — an opaque provider string, NOT contractually a UUID. ParseUUIDPipe would return
        #   400 on a legitimate avatar fetch for any user whose id is not UUID-shaped."
        # "(b) Because :userId hits a text column, a NUL byte does NOT raise 22P02... the true
        #   cause is 'the global filter's SQLSTATE mapping does not cover the text-column NUL-byte
        #   error', not 'the param needs UUID-shape validation'."
      - process/waves/wave-40/stages/P-0-frame.md
        # "problem-framer verdict: REFRAME... Fix #1 ParseUUIDPipe is WRONG: (a) contradicts
        #   wave-33's live global-filter decision; (b) users.id is text('id')... so ParseUUIDPipe
        #   would 400 on LEGITIMATE avatar fetches for non-UUID-shaped ids; (c) the NUL-byte 500
        #   is NOT a 22P02 (no uuid cast on a text column)"
        # "Final framing: fix #1 via control-byte boundary guard, NO ParseUUIDPipe"
      - process/waves/wave-40/stages/T-8-security.md
        # Probe 2: "GET /users/st-user-nonexistent-abc123/avatar → 404 (NOT 400 — guard imposes
        #   no UUID shape)... Guard is a control-byte filter only; arbitrary printable ids still
        #   resolve normally." — confirms regression-guard AC satisfied
      - process/waves/wave-40/stages/V-1-karen.md
        # Claim 3 TRUE: "git grep -i ParseUUIDPipe 9c5054d -- apps/api → NONE in tree."
      - process/waves/_archive/wave-38/stages/T-8-security.md
        # F-T8-1 Remediation: "validate :userId with ParseUUIDPipe before DB/storage access;
        #   return 400 for malformed ids." — the stale remediation the task inherited
    severity: strong
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      FIRST RECORDED INSTANCE of the "task's proposed fix mechanism (sourced from a T-8
      Remediation field) contradicts an architectural decision made AFTER the T-8 finding
      was recorded; the mechanism also targets the wrong error class for the actual column
      type" class in L-2 history.

      Near-dup check against PRODUCT-PRINCIPLES rule 1 ("Verify every seed claim about what
      exists or is absent in the code"): rule 1 covers existence/absence claims at P-0. The
      wave-40 instance is about the VALIDITY of a proposed FIX MECHANISM against the live
      architecture — not an existence claim. A false-absent premise (wave-38 antipattern #1)
      says "implement X when X already exists." The wave-40 antipattern #10 says "implement X
      using mechanism M, when M was explicitly retired by a project-wide architectural decision
      after M was specified." Different axis. Not a near-dup.

      Near-dup check against PRODUCT-PRINCIPLES rule 2 ("Verify at P-0 that the seed's named
      entity is the real cost source"): rule 2 is about whether the named entity (the target
      of the fix) is correct. The wave-40 issue is about whether the FIX MECHANISM is correct,
      not whether the target is wrong. Not a near-dup.

      Near-dup check against wave-38 obs (prior archives): wave-38's P-0 REFRAME caught
      antipattern #1 (false-absent premise: "implement server-side 2MB cap if missing" when it
      was already implemented). That class is covered by PRODUCT-PRINCIPLES rule 1. The wave-40
      class (antipatterns #2 + #10: stale T-8 mechanism contradicts live decision + wrong layer)
      has no prior formal obs. Not a confirming second instance of wave-38's class.

      Near-dup check against wave-33 obs-1 (still on HOLD, 7-wave): "Plan names a framework-
      specific error class absent from the actual stack." That is about the PLAN (P-3) naming
      an error class that doesn't exist. The wave-40 class is about the TASK DESCRIPTION
      inheriting a proposed fix that contradicts a live decision. Different source (T-8
      remediation field vs. P-3 plan), different mechanism (retired approach vs. non-existent
      class). Not a near-dup.

      The class is falsifiable at P-0: for any task whose description includes a proposed
      fix mechanism sourced from a T-8 finding, (a) identify the wave in which the T-8 finding
      was recorded; (b) check whether any architectural decision made AFTER that wave explicitly
      retired or superseded the proposed mechanism; (c) verify the proposed mechanism is
      compatible with the actual column types / error classes it targets. A task that names a
      mechanism (e.g., ParseUUIDPipe, a specific error class filter, a middleware approach)
      that was project-wide retired in a subsequent wave fails check (b).

      HOLD. First instance. Promote to PRODUCT-PRINCIPLES rule 4 on a second confirming wave
      where a task's T-8-sourced proposed fix mechanism is either (a) implemented without
      checking it against post-T-8 architectural decisions and causes a regression or fails to
      fix the original bug, OR (b) explicitly caught at P-0 by applying the candidate rule and
      a corrected mechanism is implemented cleanly.

      Competing PRODUCT-PRINCIPLES rule 4 candidates (all first-instance HOLDs):
        - wave-35 obs-1 (strong, 5-wave HOLD): privacy-theater identical-behavior selector
        - wave-35 obs-2 (warning, 5-wave HOLD): spec data contract / P-3 plan divergence
        - wave-33 obs-1 (warning, 7-wave HOLD): plan names framework error class absent from stack
        - wave-29 obs-1 (warning, 11-wave HOLD): plan-level operator fix must lock single expression
        - wave-38 obs-2 (warning, 3-wave HOLD): P-3 empirical probe of live external service
        - wave-39 obs-4 (warning, 2-wave HOLD): sole-doorway expansion
        - wave-40 obs-1 (strong, this wave): T-8-sourced fix mechanism contradicts live decision
      Strong candidates: wave-35 obs-1 and wave-40 obs-1 are both strong; first-to-confirm takes
      the slot; longest-standing strong candidate (wave-35 obs-1, 5 waves) has priority on age.
    promotion_gates:
      generalizable: true
        # Applies at P-0 for any wave targeting a task whose description includes a proposed fix
        # mechanism (ParseUUIDPipe, a named filter extension, a middleware insertion, a schema
        # change) that was sourced from a prior T-8 finding's Remediation field. The check:
        # (a) was any project-wide architectural decision made between the T-8 finding and this
        # wave that retired or superseded the proposed mechanism? (b) does the proposed mechanism
        # target the correct column type / error class? A T-8 remediation authored before a
        # project-wide pattern decision was made is structurally stale; the task description's
        # proposed fix inherits the staleness. Grep signal: task description contains
        # "ParseUUIDPipe" or names a specific error-handling pattern; journey-map or
        # PRODUCT-PRINCIPLES or L-2 archives record a subsequent project-wide decision on the
        # same class.
      falsifiable: true
        # Checkable at P-0: (1) read the task's proposed fix mechanism; (2) search the
        # journey-map (last_updated_waveN tag) and L-2 observations since the T-8 finding
        # for any decision that retired the proposed mechanism; (3) verify the proposed
        # mechanism is compatible with the actual column type (uuid vs. text) that the fix
        # targets. A task that proposes ParseUUIDPipe for a route param bound to a text
        # column fails check (3) regardless of check (2). A P-0 that accepts the proposed
        # mechanism without checks (2) and (3) fails this rule.
      cited: true
        # P-0-problem-framer.md: matched_antipatterns [2, 10]; full reasoning on both
        #   ParseUUIDPipe incompatibility with wave-33 global-filter decision and with the
        #   text-column error class (not 22P02 → filter never fires);
        # P-0-frame.md: final framing explicitly names ParseUUIDPipe as wrong + lists both
        #   failure modes (400 on legitimate non-UUID ids; non-fix for actual NUL-byte 500);
        # T-8-security.md (wave-38): F-T8-1 Remediation field that proposed ParseUUIDPipe
        #   (the stale origin of the task's proposed mechanism, authored before wave-33);
        # T-8-security.md (wave-40) Probe 2 PASS + V-1-karen.md Claim 3 TRUE: corrected fix
        #   produces 0 ParseUUIDPipe in tree; non-UUID id correctly 404s, never 400s.
    candidate_rule_shape: >
      [target: PRODUCT-PRINCIPLES rule 4]
      Validate a task's proposed fix mechanism against architectural decisions made after the
      T-8 finding was recorded and against the actual column type it targets.
      Why: A T-8 remediation becomes stale when project-wide patterns retire the proposed
      mechanism between the finding and its closure wave.
      Rule line = 117 chars; why line = 95 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The two-failure-mode cost (regression on legitimate non-UUID
      SuperTokens ids + non-fix for the original 500) establishes strong severity. The
      check is falsifiable at P-0 in two independent steps: (1) find any post-T-8 decision
      that retired the proposed mechanism; (2) verify the mechanism is compatible with the
      actual column type. Wave-40's P-0 applied both checks and caught the failure. Watch for:
      any task proposing a named error-handling mechanism (ParseUUIDPipe, a filter extension,
      a specific SQLSTATE mapping) where the task description echoes a T-8 remediation field
      that was authored before a project-wide architectural decision on the same class.


  - id: obs-2
    summary: >
      Two prior-wave held observations advanced this wave. wave-38 obs-1 (B-5 omits the
      repo-root lint command; "root/CI owns lint" rationalization) was applied for a second
      consecutive wave: wave-40's B-5-verify.md records "lint (pnpm lint = biome ci): PASS
      exit 0 (0 errors; api clean). CI lint run locally (wave-38 lesson)." C-1 fix_up_cycles:
      0 (contrast: wave-38 had 1 fix-up commit for the same class). This is the second
      consecutive wave-38-obs-1 application (wave-39 also applied it), reinforcing that the
      candidate rule is operationally effective when read. However, neither this wave nor
      wave-39 constitutes a second FAILURE instance (both are confirmations-by-application).
      wave-38 obs-1 remains on HOLD (1-wave HOLD); the promotion bar is a second wave where
      B-5 OMITS the CI lint command and deterministic lint errors reach C-1.

      wave-38 obs-4 (T-8 rule 2 scope gap: public unauthed :id endpoints not probed for
      malformed input) was NOT confirmed as a new catch. Wave-40's T-8 was a re-verification
      of the wave-38 catch: the two findings (F-T8-1 NUL-byte on GET /users/:userId/avatar;
      F-T8-2 NoSuchKey on confirm) were filed in wave-38 and fixed this wave. The wave-40
      T-8 confirmed the fix works (Probe 1: control-byte %00/%01/%1f/%7f all → 400; Probe 2:
      non-UUID id → 404 regression held). This is a positive-practice re-verify of the fixed
      behavior, not a new catch of the class on a NEW public endpoint. wave-38 obs-4 remains
      on HOLD; the promotion bar is a second wave where a NEW public unauthed endpoint's :id
      param ships without format validation and T-8 catches a malformed-param 500 on the
      public path.
    source:
      - process/waves/wave-40/stages/B-5-verify.md
        # "lint (pnpm lint = biome ci): PASS exit 0 (0 errors; api clean). CI lint run locally
        #   (wave-38 lesson)." — wave-38 obs-1 applied for a 2nd consecutive wave
      - process/waves/wave-40/stages/C-1-pr-ci-merge.md
        # "fix_up_cycles: 0" — contrast with wave-38's fix-up commit (dffef53) for same class
      - process/waves/wave-40/stages/T-8-security.md
        # Probe 1 PASS: all control-byte variants → 400; Probe 2 PASS: non-UUID → 404 (not 400)
        # overall: PASS regressions: none — confirms wave-38 T-8 class fixed, not a new catch
      - process/waves/_archive/wave-38/blocks/L/observations.md
        # obs-1: "B-5 omits the repo-root lint command; 3 Biome errors reach CI; HOLD. First
        #   instance." / obs-4: "T-8 rule 2 scope gap: public unauthed :id; HOLD. First instance."
    severity: informational
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # (wave-38 obs-1 target); T-8.md (wave-38 obs-4 target)
    recurrence: >
      CONFIRMATION-BY-APPLICATION of wave-38 obs-1 (BUILD-PRINCIPLES rule 9 / rule 7 sharpen
      candidate) for the second consecutive wave. wave-38 obs-1 remains a 1-wave HOLD.

      NOT-CONFIRMED for wave-38 obs-4 (T-8 rule 2 public-endpoint probe). wave-38 obs-4 is
      now a 3-wave HOLD (wave-38 = 1st instance; wave-39 = not confirmed, no new public
      endpoint; wave-40 = not confirmed as a new catch, is resolution of wave-38 finding).
      Promotion bar for obs-4: second wave where a new public unauthed :id endpoint ships
      without format validation and T-8 catches a malformed-param 500 on the public path.
    promotion_status: >
      NOT PROMOTION CANDIDATES this wave. wave-38 obs-1 remains 1-wave HOLD; wave-38 obs-4
      is now 3-wave HOLD. Two consecutive obs-1 applications (waves 39, 40) with 0 CI
      fix-up cycles each confirm operationalizability; the promotion bar is a second FAILURE.


  - id: obs-3
    summary: >
      The test `apps/web/src/shell/server-roles.test.tsx > ServerRolesPage > "marks role
      dirty and enables Save when role name changes"` (the `expect(saveBtn).not.toBeDisabled()`
      assertion) failed at C-1's CI test job in wave-40, requiring one documented flake-
      confirmation re-run. This is the third documented full-suite-parallel firing of this
      specific test across the project's L-2 history.

      Firing history:
      - wave-32 B-5: "fails ONLY in full-suite (cross-test-isolation), passes 24/24 isolated."
        Recorded in the wave-32 L-2 header as a watch item: "recurring across waves => shared-
        state leak in web test setup needs a fixture reset." Did NOT fire at C-1.
      - wave-35 B-5: "326/327 passed. The 1 failure: apps/web/src/shell/server-roles.test.tsx:199
        (save-role button disabled assertion). Verdict: pre-existing flake, NOT wave-caused. Re-
        ran in isolation → 24/24 passed. It fails only under full-suite parallelism."  Did NOT
        fire at C-1 (did not trigger the CI test job because wave-35 re-ran locally before push).
      - wave-40 C-1: fired at CI (`@studyhall/web#test:ci` job), requiring `gh run rerun --failed`
        with documentation of: zero web diff (impossible regression), passes on main (identical
        code), passes on re-run with zero code changes. Re-run went green.

      The test has also been carried as a documented flake without firing at C-1 in waves
      33, 34, 36, 37, 39.

      Root cause is a known async state-settling race: the Save button disabled assertion
      fires before React has settled the component's state after a controlled input change
      under full-suite parallel test execution. The test passes deterministically when run in
      isolation (the suite's parallel state-cross-contamination is absent).

      The wave-40 C-1 stage explicitly recommended: "route to a frontend specialist in a
      future wave to stabilize (await settled state before the toBeDisabled assertion). Does
      not gate this merge." Stabilization fix: wrap the state-change action in a `waitFor`
      that asserts the settable state is visible before asserting Save is enabled.

      The generalizable class: a web unit test that (a) passes in isolation, (b) fails under
      full-suite parallel CI execution due to async state-settling, and (c) has fired in full-
      suite runs across 3+ distinct waves without being fixed should be escalated to a
      stabilization task at L-block, rather than carried indefinitely as a documented flake.
      Each additional wave the flake is carried without being filed as a task raises the risk
      that a real regression is masked by the flake reclassification at C-1.
    source:
      - process/waves/wave-40/stages/C-1-pr-ci-merge.md
        # Flake classification: "server-roles.test.tsx > ServerRolesPage > 'marks role dirty
        #   and enables Save when role name changes' — expect(saveBtn).not.toBeDisabled()
        #   received a disabled element (async state-settling race)."
        # "Wave-40 diff touches zero web files... A regression is impossible in a file the diff
        #   never touches." "Re-run went green with zero code changes, confirming the flake."
        # "Follow-up recommendation: route to a frontend specialist to stabilize."
      - process/waves/_archive/wave-32/stages/B-5-verify.md
        # "server-roles.test.tsx 'marks role dirty...' fails ONLY in full-suite (cross-test-
        #   isolation), passes 24/24 isolated. Unrelated to voice. Pre-existing flake."
        # wave-32 L-2 header: "Watch: recurring across waves => shared-state leak in web test
        #   setup needs a fixture reset."
      - process/waves/_archive/wave-35/stages/B-5-verify.md
        # "326/327 passed. The 1 failure: apps/web/src/shell/server-roles.test.tsx:199 (save-
        #   role button disabled assertion). Verdict: pre-existing flake, NOT wave-caused.
        #   Re-ran in isolation → 24/24 passed."
      - process/waves/_archive/wave-36/stages/B-5-verify.md
        # "1 pre-existing server-roles flake (untouched by wave-36; 24/24 isolated)"
      - process/waves/_archive/wave-37/stages/C-1-pr-ci-merge.md
        # "documented flake server-roles.test.tsx did NOT fail"
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      3RD DOCUMENTED FULL-SUITE FIRING of this test (wave-32 B-5, wave-35 B-5, wave-40 C-1).
      The 2+ wave promotion bar is met. This is the first formal L-2 observation for the class;
      the wave-32 and wave-35 instances were documented in B-5 artifacts and an informal
      watch-note header, not as formal obs-N entries.

      Near-dup check against CI-PRINCIPLES rules 1-7: no existing rule addresses a documented
      flaky test that fires repeatedly in full-suite CI parallel execution across multiple waves.
      CI rule 3 (gate on per-job conclusions) and rule 5 (assert nonzero executed-count) address
      different CI process gaps. Rule 4 (formatter check at wiring stage) and rule 6 (run CI on
      every push) are unrelated. No near-dup.

      Near-dup check against BUILD-PRINCIPLES rules 1-8: no rule addresses persistent flake
      escalation. BUILD rule 4 (reproduce one negative path per authz boundary) is unrelated.
      No near-dup.

      Near-dup check against T-5 rule 1 (Playwright MCP launch failure): T-5 is Playwright E2E;
      the server-roles test is a vitest unit/component test. Different test layer. No near-dup.

      The class is falsifiable at L-2: for a documented flaky web test, count the number of
      distinct waves in which it fired in full-suite parallel execution (at B-5 or C-1). If
      the count is >= 3 and no stabilization task has been filed in that period, the promotion
      criterion is met and a task should be filed. Checkable by searching B-5 and C-1 artifacts
      for "server-roles" (or the named flake test) and counting waves with a documented fire.

      PROMOTE-ELIGIBLE. First formal L-2 observation; 3 documented full-suite fires (waves
      32/35/40) satisfy the 2+ wave bar. Stabilization task should be filed at N-2 (action:
      route server-roles.test.tsx 'marks role dirty' to react-specialist for waitFor-based
      state-settling stabilization). Pending head-ci-cd approval.
    promotion_gates:
      generalizable: true
        # Applies at L-2 for any project with a web unit/component test suite that runs under
        # parallel CI execution. The check: has any documented flaky test fired in full-suite
        # parallel execution (B-5 or C-1) in 3+ distinct waves? If so, has a stabilization
        # task been filed? A flake that is carried across 3+ waves without a stabilization
        # task in the backlog fails this rule. Grep signal: same test file name + flake
        # descriptor appearing in 3+ B-5-verify.md or C-1-pr-ci-merge.md artifacts across
        # different waves.
      falsifiable: true
        # Checkable at L-2 by counting wave-level firings: search B-5 and C-1 artifacts for
        # the flake descriptor across all waves. A count >= 3 with no stabilization task in
        # the tasks table (status in ('todo','in_progress','done')) triggers the rule. The
        # task criterion is independent of whether the flake gated any given C-1 (it may have
        # fired at B-5 and been cleared before push, as in wave-35).
      cited: true
        # C-1-pr-ci-merge.md (wave-40): "classic non-deterministic frontend flake (Delegation
        #   Pattern #6 — CI-vs-runner divergence)... Re-run went green with zero code changes."
        #   "Follow-up recommendation: route to react-specialist / devops-engineer in a future
        #   wave to stabilize (await settled state before the toBeDisabled assertion)."
        # B-5-verify.md (wave-32): "fails ONLY in full-suite (cross-test-isolation), passes
        #   24/24 isolated. Pre-existing flake." + wave-32 L-2 header watch note.
        # B-5-verify.md (wave-35): "server-roles.test.tsx:199 (save-role button disabled
        #   assertion). Verdict: pre-existing flake. Re-ran isolation → 24/24 passed."
    candidate_rule_shape: >
      [target: CI-PRINCIPLES rule 8]
      File a stabilization task when a documented web test fires in full-suite CI parallel
      runs but passes in isolation across 3+ waves.
      Why: An unfixed parallel-state race grows the probability of masking a real regression
      each wave the flake is carried without a fix.
      Rule line = 113 chars; why line = 91 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      PROMOTE-ELIGIBLE. First formal L-2 observation; 3 full-suite-parallel fires across
      waves 32, 35, and 40 satisfy the 2+ wave bar. The C-1 stage in wave-40 explicitly
      recommended a stabilization task. The rule is falsifiable at L-2 by counting wave-level
      firing occurrences. Action at N-2: file a stabilization task for server-roles.test.tsx
      'marks role dirty' (react-specialist; waitFor state-settling before toBeDisabled
      assertion; target T-2 layer). Promote CI-PRINCIPLES rule 8 on head-ci-cd approval.


  - id: obs-4
    summary: >
      B-6 review (LOW-3) explicitly noted that the global SupertokensExceptionFilter
      22P02-to-400 mapping does NOT cover the NUL-byte / untranslatable-character error class
      on text-typed route params: "The NUL→500 class exists structurally on any other endpoint
      that passes a client-controlled string into a text-column query (the 22P02 filter only
      catches uuid-cast failures). This wave correctly scopes to the two avatar endpoints; the
      guard is not generalised. No regression introduced. Candidate for a future cross-cutting
      guard/interceptor if the pattern recurs."

      The root is architectural: users.id is `text('id')` (no uuid cast), so a NUL byte in a
      query against it does NOT raise Postgres 22P02; it raises a driver-level
      untranslatable-character error (distinct SQLSTATE, distinct error shape). The global
      filter's coverage is SQLSTATE 22P02 (invalid_text_representation from uuid casts). Any
      other endpoint that takes a client-controlled string into a text-typed column is
      structurally exposed to the same class.

      The wave-40 fix correctly chose a localized per-route boundary guard (option A) rather
      than extending the global filter (option B). The P-3 plan documented the rationale:
      "option B requires knowing the exact error object the NUL byte produces (pg-driver
      client-side throw, possibly not a DrizzleQueryError → the filter's .cause walk may miss
      it); a boundary reject is predictable and testable." The fix was sound for the two
      scoped endpoints. The structural exposure on other text-keyed routes remains.

      The generalizable class: when a route param is bound to a text-typed column (not uuid),
      the project-wide 22P02 global filter does NOT provide a safety net for malformed
      client-controlled inputs; a per-route boundary guard rejecting control bytes / NUL is
      required. This is checkable at B-block and at T-8: does the new endpoint have a route
      param bound to a text column that accepts client-controlled strings without a boundary
      guard?
    source:
      - process/waves/wave-40/stages/B-6-review-output.md
        # LOW-3: "The NUL→500 class exists structurally on any other endpoint that passes a
        #   client-controlled string into a text-column query (the 22P02 filter only catches
        #   uuid-cast failures). This wave correctly scopes to the two avatar endpoints; the
        #   guard is not generalised. Candidate for a future cross-cutting guard/interceptor."
      - process/waves/wave-40/stages/P-3-plan.md
        # "the 500 fires when :userId containing a NUL byte reaches usersService.findAvatarKey
        #   — the pg driver rejects the NUL in the query string. This is NOT a Postgres 22P02
        #   (users.id is text('id'), no uuid cast happens), so the existing
        #   SupertokensExceptionFilter isInvalidTextRepresentation (22P02→400) branch does NOT
        #   catch it."
        # "Why Option A over Option B (extend SupertokensExceptionFilter): Option B requires
        #   knowing the exact error object the NUL byte produces... a boundary reject is
        #   predictable and testable."
      - process/waves/wave-40/stages/P-0-problem-framer.md
        # "(b) Because :userId hits a text column, a NUL byte does NOT raise 22P02 (there is
        #   no uuid cast), so the existing global 22P02 filter never catches it."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Alternative: command-center/principles/test-layer-principles/T-8.md (as a second rule
      # or extension: "for text-keyed route params, probe control-byte inputs at T-8 regardless
      # of the global uuid-cast filter, because text-column errors bypass 22P02 coverage")
    recurrence: >
      FIRST RECORDED INSTANCE of "the project's global 22P02 exception filter does not cover
      text-column NUL-byte errors; per-route boundary guards are required for text-keyed route
      params accepting client-controlled strings" as a standalone L-2 observation.

      Lineage:
      - wave-32/33: isolated + fixed the authed-path 22P02 class (uuid-cast channelId → 500).
        T-8 rule 2 promoted at wave-33 targeting authed uuid-cast :id params.
      - wave-38: F-T8-1 on GET /users/:userId/avatar (text-keyed, public). The T-8 finding's
        remediation proposed ParseUUIDPipe, which would not have fixed the text-column error
        class anyway (as the wave-40 REFRAME confirmed).
      - wave-40: corrected fix (boundary guard) + B-6 LOW-3 explicitly documents that the gap
        is STRUCTURAL, not just a missed annotation on these two endpoints.

      Near-dup check against T-8 rule 2 (promote wave-33): "probe each :id route param with a
      malformed non-UUID value on the authed path and assert 400, not 500." Rule 2 was scoped
      to "authed path" and targets the uuid-cast error class (22P02). wave-38 obs-4 (HOLD) is
      proposing to extend rule 2 to "authed or public path." The wave-40 obs-4 candidate is
      about the IMPLEMENTATION gap (text-column routes need per-route guards) complementing
      the T-8 PROCESS gap (obs-4 amends probe scope). Not a near-dup; complementary.

      Near-dup check against BUILD-PRINCIPLES rules 1-8: no existing rule addresses per-route
      boundary guards for text-typed route params. No near-dup.

      The class is falsifiable at B-block: for each new route param in the diff, (a) what
      column type does it resolve against? (b) if it is a text-typed column (not uuid), does
      the controller method have a control-byte / NUL boundary guard before the first DB call?
      A controller method that calls a service with an unguarded text-column :param is checkable
      by reading the handler body (is there a control-byte regex guard before the service call?).

      HOLD. First instance (discovered via B-6 adversarial code review noting structural
      exposure beyond the two fixed endpoints). Promote to BUILD-PRINCIPLES (additive to rule 4
      or as a new slot) on a second confirming wave where: (a) a new text-keyed route param
      ships without a control-byte boundary guard and T-8 or B-6 catches a malformed-input 500
      on the text-column path, OR (b) an explicit B-block checklist entry for text-column route
      params prevents the gap from shipping.
    promotion_gates:
      generalizable: true
        # Applies at B-block for any wave adding a new route handler with a route param that
        # resolves against a text-typed column. The check: does the handler include a control-
        # byte / NUL rejection guard before the first service call that passes the param to DB?
        # Grep signal: @Param('X') param: string in a controller method where the underlying
        # column is text-typed (not uuid-typed via Drizzle uuid() / pgColumn type), without a
        # preceding regex guard. The project's global SupertokensExceptionFilter covers 22P02
        # (uuid-cast errors) only; text-column errors are a different SQLSTATE and require a
        # separate guard.
      falsifiable: true
        # Checkable at B-6 Phase 1: for each new controller method in the diff that accepts a
        # @Param string resolved against a text column, does the handler body contain a control-
        # byte guard (/[\x00-\x1f\x7f]/.test(param) or equivalent) before calling the service?
        # A handler that passes the raw param to a text-column query without a guard fails this
        # check. Independent T-8 check: probe the route with a %00-encoded param and assert 400
        # (not 500). A 500 response confirms the gap.
      cited: true
        # B-6-review-output.md LOW-3: "The NUL→500 class exists structurally on any other
        #   endpoint that passes a client-controlled string into a text-column query (the 22P02
        #   filter only catches uuid-cast failures)... Candidate for a future cross-cutting
        #   guard/interceptor if the pattern recurs."
        # P-3-plan.md: explicitly distinguishes text-column (no 22P02) from uuid-column (22P02)
        #   as the architectural reason the global filter doesn't cover this case.
        # P-0-problem-framer.md: "(b) Because :userId hits a text column, a NUL byte does NOT
        #   raise 22P02 — the global filter's SQLSTATE mapping does not cover this."
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9 or additive to T-8 rule 2 amendment]
      For a route param resolved against a text-typed column, add a control-byte boundary guard
      before the first DB call; the global uuid-cast filter does not cover this error class.
      Why: A NUL byte in a text-column query raises a driver-level error, not 22P02, bypassing
      the global exception filter and producing a 500.
      Rule line = 119 chars; why line = 97 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance (positive structural observation from B-6 LOW-3; no new endpoint
      failed this wave beyond the two already fixed). Promote on second confirming wave.
      The class is related to wave-38 obs-4 (T-8 probe scope gap on public endpoints): obs-4
      addresses the T-8 process obligation (probe public endpoints for malformed :id); this
      obs-4 addresses the BUILD obligation (add per-route guard for text-column :param). Both
      target the same underlying exposure but at different layers. Competing BUILD slot 9
      candidates include wave-38 obs-1 (warning, 3-wave HOLD), wave-38 obs-3 (warning, 3-wave
      HOLD), wave-36 obs-1 (warning, 4-wave HOLD), and wave-31 obs-1 (strong, 9-wave HOLD).
      First-to-confirm takes the slot; wave-31 obs-1 (strong) has priority by severity.
```

---

## Prior held observations — second-instance status (wave-35 through wave-39)

| origin | obs | class | wave-40 status |
|--------|-----|-------|----------------|
| wave-39 | obs-1 | Async signOut had no error path; always-resolving mock hid the reject path; B-6 caught CRITICAL | NOT CONFIRMED. Backend-only wave; no frontend changes; no async auth SDK call in the diff. Remains 1-wave HOLD (BUILD-PRINCIPLES rule 9 candidate, strong). |
| wave-39 | obs-4 | P-0 SELECTIVE-EXPANSION: sole-doorway button wired to one route ships a second dead-end | NOT CONFIRMED. Backend-only wave; no nav/entry-point change introduced. Remains 2-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-38 | obs-1 | B-5 omits repo-root lint command; "root/CI owns lint" rationalization; lint errors reach CI | APPLIED (2nd consecutive; not re-failed). B-5 explicitly ran `biome ci .` citing "wave-38 lesson"; fix_up_cycles: 0. Remains 1-wave HOLD. See obs-2. |
| wave-38 | obs-2 | P-3 empirically probes live external service before architecture commitment | NOT CONFIRMED. Wave-40 is a localized boundary guard + S3-error-catch; no external-service access-semantics architecture decision at P-3. Remains 3-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-38 | obs-3 | process.env.X = undefined stringification trap; Biome noDelete suggested fix leaves key truthy | NOT CONFIRMED. No process.env teardown in wave-40 test files (AWS SDK mocked via vi.mock factory, no env manipulation). Remains 3-wave HOLD (BUILD-PRINCIPLES or T-2.md candidate). |
| wave-38 | obs-4 | T-8 rule 2 scope gap: public unauthed :id endpoints unprobed for malformed input | NOT CONFIRMED as new catch. Wave-40 T-8 was a re-verify of the wave-38 catch; the two endpoints were fixed this wave. No new public endpoint with missing validation introduced. Remains 3-wave HOLD (T-8.md rule 2 amendment candidate). See obs-2. |
| wave-37 | obs-2 | HTTP verb mismatch (client POST vs controller @Patch) passes service-layer tests; controller route-metadata assertion catches it | NOT CONFIRMED. No new controller routes with a verb mismatch; backend-only patch wave. Remains 3-wave HOLD (CI-PRINCIPLES or T-2.md candidate). |
| wave-37 | obs-3 | Bootstrap-once list + live-count-only hook leaves list surface stale on reopen | NOT CONFIRMED. No frontend hook changes; backend-only wave. Remains 3-wave HOLD (BUILD-PRINCIPLES or T-2.md candidate). |
| wave-36 | obs-1 | Security-boundary authz/IDOR tests deferred to follow-up wave; no committed artifact in shipping wave | NOT CONFIRMED. Both hardening fixes include inline tests covering the fixed path; no security-boundary test deferred. Remains 4-wave HOLD (BUILD-PRINCIPLES rule 9 candidate). |
| wave-36 | obs-3 | Two-layer IDOR proof: service integration + controller session-scoping test for session-only-userId endpoints | NOT CONFIRMED. The avatar endpoints are not session-scoped IDOR boundaries (userId guard is on the param, not a session ownership check). Remains 4-wave HOLD (BUILD-PRINCIPLES or T-8.md candidate). |
| wave-35 | obs-1 | Identical-behavior privacy options = privacy-theater; honest selector collapses them | NOT CONFIRMED. No privacy settings selector. Remains 5-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate, strong; highest-priority by severity). |
| wave-35 | obs-2 | Spec data contract diverges from P-3 architecture decision; P-4 REWORK required | NOT CONFIRMED. No data model; P-4 APPROVED first attempt. Remains 5-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-34 | obs-2 | D-3 gate checked brief states but not brief interactions; named entry control omitted from mockup | NOT CONFIRMED. design_gap_flag=false; D-block skipped (backend-only). Remains 6-wave HOLD (DESIGN-PRINCIPLES / D-3 rubric candidate). |
| wave-33 | obs-1 | Plan names a framework-specific error class absent from the actual stack | NOT CONFIRMED. No framework error class naming in P-3 plan. Remains 7-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-33 | obs-2 | Error-mapping fix must fire against a real upstream error from the actual code path | NOT CONFIRMED. T-8 probed the real endpoints live (Probe 1: %00→400 on prod); the fix WAS verified against the real error path. However, the class (error-mapping fix tested only in unit, not against a real upstream error) did not apply here. Remains 7-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-33 | obs-3 | Clone the shipped error-walk helper depth for new error codes on the same stack | NOT CONFIRMED. The HeadObject error handling uses direct name/metadata checks, not a recursive error-walk helper (different error-handling pattern). Remains 7-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-32 | obs-1 | Wiring new api method into existing component invalidates explicit-enumeration mock factory | NOT CONFIRMED. No frontend changes; no api.ts wiring. Remains linter-blocked HOLD (BUILD-PRINCIPLES slot 9 candidate). |
| wave-32 | obs-3 | Typed api-client method added but consumer fetches inline in parallel | NOT CONFIRMED. No new api-client method. Remains 8-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-31 | obs-1 | Credential-endpoint gate: membership check before loading or branching on resource | NOT CONFIRMED. No new credential-issuing endpoint. Remains 9-wave HOLD (BUILD-PRINCIPLES rule 9 candidate, strong; highest-priority BUILD slot-9 holder). |
| wave-31 | obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() bridge | NOT CONFIRMED. No new ESM-only dependency. Remains 9-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion | NOT CONFIRMED. No nullable-FK exclusion query. Remains 10-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED. No cron or background job. Remains 10-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED. V-2 triage: 0 blocking, 0 non-blocking; 3 noise items disposed correctly. Remains 10-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form | NOT CONFIRMED. No operator-fix ambiguity in P-3 plan. Remains 11-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites catches reviewer-missed occurrence | NOT CONFIRMED. V-3 fast_fix_queue empty; no fast-fix round. Remains 11-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED. Valid M7 feature wave with PRECEDENT-APPLICATION override-ship logged. Remains 11-wave HOLD (PRODUCT-PRINCIPLES candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED. gitleaks PASS at C-1 (exit 0, clean). Remains 12-wave HOLD (CI-PRINCIPLES candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED. No CI-config fix cycle. Remains 12-wave HOLD (CI-PRINCIPLES candidate). |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED. No EXPLAIN-based integration test. Remains 13-wave HOLD (T-4 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED. Not a performance wave. Remains 13-wave HOLD (T-7 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 caught it | NOT CONFIRMED. No store-keyed unit fixture. Remains 14-wave HOLD (T-2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED. No date-dependent test fixture. Remains 14-wave HOLD (T-2 candidate). |

---

## Signals evaluated and dropped

**Signal: T-8 all-PASS as a process insight (T-8 re-verify waves):**
All 5 T-8 probes passed (NUL-byte → 400, non-UUID regression → 404, NoSuchKey → 404, no
leak in 4xx bodies, happy path + unauth). A T-8 where the primary purpose is re-verification
of a prior finding is the expected outcome when the fix is correct. The V-block APPROVE (0
blocking, 0 non-blocking) corroborates this. The pattern "T-8 re-verify of a closed finding
all-passes" is the correct gate outcome, not a new observation class. DROPPED.

**Signal: P-0-frame.md mediation without full-reviewer re-spawn:**
The head-product mediator accepted the problem-framer REFRAME and proceeded without spawning
fresh Karen/Jenny at P-0 (P-4 carries the fresh gate). This is the documented mediation
protocol (the correction is additive to the WHAT, not a wrong-problem reframe; P-4 provides
the fresh validation). The P-4 gate passed (head-product APPROVED, Karen/Jenny APPROVE).
This is the mediation protocol working correctly, not a new class. DROPPED.

**Signal: FLOOR-TRIPS-OVERRIDE-SHIP at P-1 as a process signal:**
The wave tripped the minimum floor (~30 LOC for a 2-file hardening fix). P-1 applied the
wave-16/24 standing PRECEDENT-APPLICATION override-ship rule for T-8-evidenced robustness
hardening waves. This is the 4th application of this standing rule (after waves 24, 38, 39).
No principle candidate emerges; the standing rule is already established. DROPPED.

**Signal: V-1 jenny doc-drift LOW (journey-map route rows not updated with new 4xx):**
Jenny identified that map rows 92-93 carry wave-38 states and omit the new 400/404 behaviors,
but the wave-40 changelog annotation on the map is authoritative. V-2 correctly classified this
as noise (fold at next regen). A LOW doc-drift finding at V-1 that is correctly disposed as
noise is the expected gate outcome for a wave that didn't trigger a full T-9 journey regen.
Not a new principle class. DROPPED.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | P-0 REFRAME: task's T-8-sourced fix mechanism (ParseUUIDPipe) contradicts wave-33 global-filter decision + targets wrong column error class | strong | 1st instance | PRODUCT-PRINCIPLES | HOLD — rule 4 candidate; promote on 2nd confirming wave |
| obs-2 | wave-38 obs-1 (biome ci) applied 2nd consecutive wave; wave-38 obs-4 (T-8 public probe) not confirmed as new catch | informational | application-confirmation (obs-1); not-confirmed (obs-4) | BUILD-PRINCIPLES / T-8.md | HOLD status unchanged for both; wave-38 obs-1 remains 1-wave HOLD; wave-38 obs-4 now 3-wave HOLD |
| obs-3 | server-roles.test.tsx "marks role dirty" fires at CI (3rd full-suite parallel firing: waves 32, 35, 40); stabilization task recommended | warning | 3rd documented firing (2+ wave bar met) | CI-PRINCIPLES | PROMOTE-ELIGIBLE — file stabilization task; pending head-ci-cd approval |
| obs-4 | Global 22P02 filter does not cover text-column NUL-byte errors; text-keyed route params require per-route control-byte boundary guards | warning | 1st instance (B-6 LOW-3 structural note) | BUILD-PRINCIPLES | HOLD — rule 9 / T-8 rule 2 complement candidate; promote on 2nd confirming wave |

**Observations emitted: 4 (obs-1, obs-2, obs-3, obs-4)**
**Severities: 1 strong (obs-1), 2 warning (obs-3, obs-4), 1 informational (obs-2)**
**Candidate files: PRODUCT-PRINCIPLES (obs-1), CI-PRINCIPLES (obs-3), BUILD-PRINCIPLES (obs-4)**
**Promotion-eligible this wave: obs-3 (CI-PRINCIPLES rule 8 candidate; 3 documented fires; 2+ wave bar met)**
**Dropped: T-8 all-PASS re-verify (expected gate outcome); P-0 mediation without full-reviewer re-spawn (documented protocol); FLOOR-TRIPS-OVERRIDE-SHIP (4th standing-rule application, no new principle); V-1 doc-drift LOW noise (correct dispose)**

---

## Promotion candidate flags for karen

**obs-3 is the only promotion-eligible observation this wave.**

**obs-3** (CI-PRINCIPLES rule 8 candidate, warning severity) is the first formal L-2 observation
for the server-roles.test.tsx persistent-flake class, but the underlying recurrence spans 3
documented full-suite-parallel fires across waves 32, 35, and 40. The 2+ wave promotion bar is
met by waves 32 and 35; wave-40 is the confirming third. The C-1 stage in wave-40 explicitly
recommended filing a stabilization task. The candidate rule is falsifiable at L-2 (count
documented firings for each known flake across B-5 and C-1 artifacts). The stabilization fix is
known (waitFor state-settling before the toBeDisabled assertion). Action at N-2: file a
stabilization task for the react-specialist (vitest; server-roles.test.tsx; the "marks role
dirty and enables Save when role name changes" test).

**obs-1** (PRODUCT-PRINCIPLES rule 4 candidate, strong severity) is a first-instance HOLD. The
two-failure-mode cost (regression on legitimate non-UUID SuperTokens ids + non-fix for the
original NUL-byte 500) establishes strong severity. The rule is falsifiable at P-0 in two
independent steps: (1) does any post-T-8 decision retire the proposed mechanism? (2) is the
proposed mechanism compatible with the actual column type? Watch for: any task whose description
contains a T-8-sourced remediation naming a specific error-handling pattern where a subsequent
project-wide decision on the same class exists.

**obs-4** (BUILD-PRINCIPLES rule 9 or T-8 rule 2 complement candidate, warning severity) is a
first-instance HOLD. B-6 LOW-3 made the structural exposure explicit. The class is checkable
at B-block (any new @Param string handler on a text-column route with no control-byte guard
before the service call) and at T-8 (probe %00 on any new text-keyed route). Watch for: any
new controller method that accepts a @Param bound to a text-typed column and passes it directly
to a service/DB call without a preceding control-byte rejection.

**Competing BUILD-PRINCIPLES slot-9 candidates (all HOLDs):**
  - wave-31 obs-1 (strong, 9-wave HOLD): credential-endpoint membership-before-load — highest
    priority by severity and age; takes the slot on confirmation.
  - wave-39 obs-1 (strong, 1-wave HOLD): async auth SDK call with no error path + reject-path test.
  - wave-36 obs-1 (warning, 4-wave HOLD): authz tests deferred to follow-up wave.
  - wave-36 obs-3 (warning, 4-wave HOLD): two-layer IDOR proof for session-only-userId endpoints.
  - wave-37 obs-3 (warning, 3-wave HOLD): bootstrap-once list + live-count-only hook stale on reopen.
  - wave-38 obs-1 (warning, 1-wave HOLD): B-5 omits repo-root lint command.
  - wave-38 obs-3 (warning, 3-wave HOLD): process.env = undefined stringification trap.
  - wave-40 obs-4 (warning, this wave): text-column route params bypass global 22P02 filter.
  - wave-32 obs-1 (warning, linter-blocked HOLD): enumerated-mock factory staleness.
  - wave-33 obs-3 (informational, 7-wave HOLD): clone shipped error-walk helper depth.
  - wave-32 obs-3 (informational, 8-wave HOLD): typed api-client method vs inline consumer.
  First-to-confirm takes the slot; wave-31 obs-1 and wave-39 obs-1 (both strong) have priority
  over all warning-severity candidates.

**Competing PRODUCT-PRINCIPLES rule-4 candidates (all HOLDs):**
  - wave-35 obs-1 (strong, 5-wave HOLD): privacy-theater identical-behavior selector — highest
    priority by severity.
  - wave-40 obs-1 (strong, this wave): T-8-sourced fix mechanism contradicts live decision.
  - wave-35 obs-2 (warning, 5-wave HOLD): spec data contract / P-3 plan divergence.
  - wave-38 obs-2 (warning, 3-wave HOLD): P-3 empirical probe of live external service.
  - wave-39 obs-4 (warning, 2-wave HOLD): sole-doorway expansion.
  - wave-33 obs-1 (warning, 7-wave HOLD): plan names framework error class absent from stack.
  - wave-29 obs-1 (warning, 11-wave HOLD): plan-level operator fix single-expression lock.
  Both strong candidates (wave-35 obs-1 and wave-40 obs-1) compete equally on severity; wave-35
  obs-1 has priority by age (5-wave HOLD); first-to-confirm takes the slot.
