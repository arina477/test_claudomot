# Wave 39 — L-2 Distill Observations

Synthesized from wave-39 artifacts (M7 settings-doorway user menu: UserMenu popover wired to
the dead ChannelSidebar settings button; Profile / Privacy / Log out over existing routes;
PR #53 squash-merged 21f02ee; V-block APPROVED first round — V-2 0 blocking, V-3 APPROVED).
Inputs read:
process/waves/wave-39/stages/P-0-frame.md, stages/B-5-verify.md, stages/B-6-review.md,
stages/B-6-review-output.md, stages/C-1-pr-ci-merge.md, stages/C-2-deploy-and-verify.md,
stages/T-2-unit.md, stages/V-1-karen.md, stages/V-2-triage.md, stages/V-3-fast-fix.md.
Prior archives consulted: process/waves/_archive/wave-{34,35,36,37,38}/blocks/L/observations.md
(prior-held queue + recurrence checks on all candidate classes).
Principles files read: BUILD-PRINCIPLES (8 rules), PRODUCT-PRINCIPLES (3 rules),
VERIFY-PRINCIPLES (2 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      B-6 code-reviewer caught a CRITICAL that 340 passing CI tests missed: UserMenu.tsx's
      logout action (`await Session.signOut(); navigate('/login')`) had no error handling.
      When Session.signOut() rejects (offline, backend 5xx, CSRF/session-revoke race —
      all real in production), onClose() has already fired and unmounted the menu; the
      rejection propagates as an unhandled promise rejection; and navigate('/login') never
      runs. The user is left in a half-authenticated state with no error surfaced and no
      retry affordance. This was invisible to the 340-test suite because mockSignOut was
      always `() => Promise.resolve()` — the reject path was never tested. The fix (91bcb5a)
      wrapped signOut in try/catch/finally with navigate('/login') in the finally block,
      ensuring the redirect fires on both success and failure. A reject-path regression test
      was added in the same commit ([C1] test: mockSignOut.mockRejectedValueOnce; asserts
      navigate called with '/login'). The generalizable class: any async user-exit or
      session-side-effect action (signOut, token revoke, session-close) must have an error
      path that still routes the user to a safe state; and the unit tests for that action must
      include a mock-rejection case — not only the always-resolving happy-path mock. The
      gap is structurally invisible to type-checking and to test suites where the mock always
      resolves: only an adversarial code reviewer or a deliberate reject-path test can catch it.
    source:
      - process/waves/wave-39/stages/B-6-review-output.md
        # C1: "Failure sequence when Session.signOut() rejects: onClose() already ran -> menu
        #   unmounted; signOut() throws -> navigate('/login') never runs; unhandled promise
        #   rejection; user left in half-authenticated limbo."
        # "There is no try/catch anywhere in the path. This is the single worst production
        #   outcome in the diff: the primary purpose of the feature (logging out) silently
        #   fails and abandons the user."
        # Test-gap note: "The 340 passing tests mock signOut as () => Promise.resolve() —
        #   the reject path (C1) is never tested, which is precisely why the CRITICAL is
        #   invisible to the suite."
      - process/waves/wave-39/stages/B-6-review.md
        # "findings_critical: C1 logout no error-handling (rejected signOut strands user)
        #   — FIXED 91bcb5a: try/catch/finally, navigate('/login') in finally (always runs)"
        # "final_verdict: APPROVE"
      - process/waves/wave-39/stages/T-2-unit.md
        # "341 web tests (8 new UserMenu tests incl. the [C1] logout-reject-still-navigates
        #   guard)... reject-path: mockRejectedValueOnce; navigate('/login') asserted."
      - process/waves/wave-39/stages/V-1-karen.md
        # "Claim 3 — UserMenu.test.tsx C1 guard test — TRUE (genuine, not decorative):
        #   it('[C1] navigates to /login even when Session.signOut() rejects')... mockSignOut.
        #   mockRejectedValueOnce(new Error('network error')); clicks Log out; waitFor asserting
        #   mockSignOut called once AND mockNavigate called with '/login' AND onClose called once."
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST RECORDED INSTANCE of the "async user-exit/session-side-effect action has no error
      path; test suite uses an always-resolving mock so the reject path is never exercised;
      B-6 adversarial code reviewer catches the CRITICAL at review time" class in L-2 history
      (searched wave-5 through wave-38: no prior obs records this specific mechanism).

      Near-dup check against BUILD rule 4: BUILD rule 4 requires "Reproduce one negative path
      per authz or injection boundary at B-6 Phase-2." C1 was caught by Phase-2 adversarial
      review, which satisfies rule 4's mechanism. However, rule 4 targets authz and injection
      boundaries — it does not name the class of async side-effect actions (signOut, token
      revoke, session-close) where the reject path strands a user with no route to a safe
      state. This candidate is complementary to rule 4: rule 4 says to run an adversarial pass;
      this candidate names the specific obligation for async exit/side-effect actions — error
      path required, and mock rejection in the test suite required. Not a near-dup.

      Near-dup check against BUILD rules 5-8: rule 5 (reconnect-loop coalescing flag) is
      about concurrent triggering, not error paths. Rules 6-8 address format/lint discipline.
      No near-dup.

      Near-dup check against VERIFY rules 1-2: neither addresses the pre-merge obligation for
      async action error paths or mock rejection coverage. No near-dup.

      The class is falsifiable at B-6 Phase 1: for each async action in the diff that calls
      an external session or auth SDK method and then executes a navigation or state transition,
      does the action have an error path (try/catch or .catch) that still lands the user in a
      safe state? And does the unit test suite include at least one mock-rejection case for that
      action? A handler with only `await sideEffect(); navigate(...)` (no error path) fails
      the first check. A test file that mocks the side-effect as always-resolving, with no
      `mockRejectedValueOnce` variant, fails the second.

      HOLD. First instance. Promote to BUILD-PRINCIPLES rule 9 on second confirming wave where:
        (a) an async user-exit or session-side-effect action ships without an error path and
            a CRITICAL or HIGH finding surfaces at B-6 or in production, OR
        (b) an explicit pre-B-6 check for reject-path coverage prevents the gap.
    promotion_gates:
      generalizable: true
        # Applies at B-6 Phase 1/Phase 2 for any wave introducing or modifying an async
        # action that calls an external auth/session SDK (signOut, revokeToken, closeSession,
        # or equivalent) and then executes a navigation or state transition. The check:
        # does the handler wrap the SDK call in try/catch (or .catch) so the downstream
        # navigation/state transition still fires on the reject path? A handler whose reject
        # path produces an unhandled promise rejection and leaves the user in a partial
        # state fails this check. Grep signal: `await <sdkMethod>(); navigate(` or
        # `await <sdkMethod>(); setState(` with no surrounding try/catch/finally.
      falsifiable: true
        # Two independent checkpoints:
        # 1. At B-6 Phase 1: for each async action calling a session/auth SDK method,
        #    does the action body wrap the SDK call so the user-facing outcome still
        #    occurs on rejection? Checkable by inspecting the handler; a missing try/catch
        #    is a visible structural absence.
        # 2. At B-6 Phase 1 or T-2 code review: does the test file include at least one
        #    test that uses mockRejectedValueOnce (or equivalent) on the SDK mock and
        #    then asserts the expected user-facing outcome (navigation, state reset) still
        #    fires? A test file with only Promise.resolve() mocks for an async side-effect
        #    action fails this check.
      cited: true
        # B-6-review-output.md C1: full failure-sequence analysis (onClose runs first;
        #   signOut rejects; navigate never called; unhandled rejection; half-auth limbo;
        #   no try/catch anywhere in the path; "single worst production outcome in the diff");
        # B-6-review-output.md test-gap note: "340 tests mock signOut as Promise.resolve() —
        #   the reject path is never tested; CRITICAL invisible to the suite";
        # B-6-review.md: findings_critical C1 FIXED 91bcb5a (try/catch/finally + navigate in
        #   finally); fix_up_commits [91bcb5a]; final_verdict APPROVE;
        # T-2-unit.md: 8 UserMenu tests including [C1] reject guard; mockRejectedValueOnce
        #   arrangement; navigate('/login') asserted on reject path;
        # V-1-karen.md Claim 3: C1 guard test confirmed genuine (not decorative) — real
        #   arrangement and real assertion; 0 skip/todo markers.
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9]
      For any async action that calls a session/auth SDK method, include an error path so the
      user-facing outcome still fires on rejection; add a mock-rejection test case.
      Why: An always-resolving mock hides the reject path; a rejected side-effect strands the
      user with no error and no route to a safe state.
      Rule line = 117 chars; why line = 89 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The CRITICAL severity and the concrete cost (user stranded in
      half-auth state, unhandled rejection; primary feature purpose silently fails) make
      this the highest-priority new BUILD-PRINCIPLES slot-9 candidate this wave. The rule is
      falsifiable at B-6 Phase 1 (structural check: missing try/catch on async auth SDK call)
      and at T-2 (coverage check: no mock-rejection variant in the test file). Watch for:
      any wave adding an async auth/session SDK call followed by navigate() or setState()
      without a wrapping error path, where the test file uses only always-resolving mocks.


  - id: obs-2
    summary: >
      Wave-38 obs-1 recorded: "B-5 omits the repo-root lint command due to the 'root/CI owns
      lint' rationalization; deterministic lint errors reach C-1 (1 fix-up cycle)." Wave-39
      applied the lesson proactively: B-5-verify.md documents "lint (pnpm lint = biome ci .):
      PASS exit 0 (wave-38 lesson)." The react-specialist ran biome ci locally before pushing.
      C-1 recorded 0 fix-up cycles; all 7 CI jobs green on the first push. This is a
      confirmation-by-application: the prior observation was read, the corrective behaviour
      was adopted, and the defect class did not recur. Under the promotion rule, obs-1 requires
      a second FAILURE instance to confirm the underlying gap is systemic. A deliberate
      application-of-lesson (success path) does not constitute a second confirming failure
      instance. Status: wave-38 obs-1 remains 1-wave HOLD. The proactive adoption is
      recorded here as evidence the rule is actionable and prevents the gap.
    source:
      - process/waves/wave-39/stages/B-5-verify.md
        # "lint (pnpm lint = biome ci .): PASS exit 0 (7 pre-existing noNonNullAssertion
        #   warnings in apps/web/src/shell, not wave-39; 0 errors). CI lint command run
        #   locally (wave-38 lesson)."
      - process/waves/wave-39/stages/C-1-pr-ci-merge.md
        # "Required-check results: lint (biome ci) pass 19s."
        # "fix_up_cycles: 0"
      - process/waves/_archive/wave-38/blocks/L/observations.md
        # obs-1: "B-5 verify ran typecheck and unit tests but not `biome ci .` (the exact
        #   lint command CI enforces from the repo root). Three deterministic Biome errors
        #   slipped to CI (C-1 run 28650289759, lint job FAIL, exit 1) and required a fix-up
        #   commit. HOLD. First instance."
    severity: informational
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      CONFIRMATION-BY-APPLICATION of wave-38 obs-1 (BUILD-PRINCIPLES rule 9 / rule 7 sharpen
      candidate). The prior failure class (B-5 omits biome ci; lint errors reach CI) did NOT
      recur because the lesson was explicitly applied. This is not a second failure instance
      and does not advance the promotion bar. Wave-38 obs-1 remains 1-wave HOLD.

      Promotion bar for wave-38 obs-1: a second FAILURE instance where B-5 omits the CI lint
      command (regardless of the rationale) and deterministic lint errors surface at C-1. A
      wave where the lesson is consciously applied and no lint errors reach CI is evidence the
      rule is actionable, but does not satisfy the second-failure criterion. Both paths are
      informative: confirming applications show operationalizability; re-failures show
      systemic need. Only re-failures advance the promotion bar.
    promotion_gates:
      generalizable: true
      falsifiable: true
        # Checkable at B-5: did the B-5 transcript record running the exact CI lint command
        # (biome ci . or equivalent from the repo root)? A B-5 transcript that records only
        # tsc + unit without a lint-command line fails this check.
      cited: true
        # B-5-verify.md: lint step explicitly run with "wave-38 lesson" citation; exit 0;
        # C-1 fix_up_cycles: 0 (contrast with wave-38's fix-up commit dffef53 from the same
        #   class of omission).
    promotion_status: >
      HOLD (wave-38 obs-1 status unchanged). This wave provides an application-confirmation
      but not a second failure instance. Promote wave-38 obs-1 to BUILD-PRINCIPLES on a
      second confirming wave where B-5 omits the repo-root lint command and deterministic
      lint errors reach C-1.


  - id: obs-3
    summary: >
      V-1 karen independently re-verified the live-served minified bundle against the specific
      hash and change-unique markers cited by C-2, on top of C-2's own content assertion.
      C-2 reported served bundle `/assets/index-QN5fEltz.js` containing marker `User menu`;
      karen independently confirmed: the live root returns HTTP 200 referencing the exact same
      bundle path; grepping the live bundle returns "User menu" (1 occurrence); bundle size
      1,693,258 bytes matches C-2's 1,693,259 (within trailing-newline rounding); corroborating
      markers (/settings/privacy x2, /settings/profile x2, haspopup x5, Your profile and
      settings x1) are all present. Karen explicitly cited this as verifying the content
      assertion rather than relying solely on C-2's deployment-state SUCCESS report. This
      wave is the second instance of a V-1 reviewer independently re-deriving the served-bundle
      content check: wave-34 saw karen and jenny independently grep the live bundle and both
      found 0/0 markers (false-green catch). Wave-35 obs-4 was promoted to CI-PRINCIPLES
      rule 7 on the strength of waves 34+35. Now, wave-39 shows the V-1 lane also applying
      the same independent check against a TRUE positive (bundle IS correct), demonstrating
      the pattern works symmetrically as a validity check, not only as a false-green detector.
      The generalizable class for V-1: when C-2 asserts a served-bundle content marker, V-1
      karen re-derives that assertion against the live bundle independently (not by trusting
      the C-2 claim alone), and reports the exact bundle path, marker count, and size match.
      This is the load-bearing verification behaviour for a non-git Railway deploy.
    source:
      - process/waves/wave-39/stages/V-1-karen.md
        # "Claim 4 — Deploy serves the merge commit — TRUE:
        #   curl https://web-production-bce1a8.up.railway.app/ -> HTTP 200.
        #   index.html references /assets/index-QN5fEltz.js — exact match to C-2's cited hash.
        #   Served bundle contains 'User menu' (1 occurrence). Bundle size 1,693,258 bytes
        #   (matches C-2's 1,693,259 within a trailing-newline rounding)."
        # "The new UserMenu code IS the code serving traffic."
      - process/waves/wave-39/stages/C-2-deploy-and-verify.md
        # "SERVED-BUNDLE CONTENT ASSERTION (wave-34 false-green guard)... grep 'User menu' in
        #   served bundle -> FOUND."
        # "note: Served-bundle content assertion PASSED against the wave-34 false-green guard."
      - process/waves/_archive/wave-34/blocks/L/observations.md
        # obs-1: false-green deploy; karen + jenny independently grepped served bundle (0/0
        #   markers); root cause (non-git GraphQL redeploy); CI-PRINCIPLES rule 7 candidate.
      - command-center/principles/CI-PRINCIPLES.md
        # rule 7 (promoted wave-35): "For non-git Railway services, assert a change-unique
        #   marker is present in the served bundle after deploy; digest-diff alone is a
        #   false-green." (This wave: CI rule 7 applied at C-2 and independently verified
        #   at V-1 karen — both lanes.)
    severity: informational
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    recurrence: >
      REINFORCEMENT / SCOPE EXTENSION of CI-PRINCIPLES rule 7 and the V-1 verification pattern.
      CI rule 7 (promoted at wave-35) mandates the served-bundle content assertion at C-2.
      Wave-39 shows the V-1 lane independently applying the same assertion as a source-claim
      reality check — confirming C-2's citation, not just trusting it. This is the third
      wave (34: false-green discovery; 35: true-positive C-2 assertion; 39: true-positive V-1
      independent re-check) in which the served-bundle content pattern fires.

      The candidate here is NOT a new rule for VERIFY-PRINCIPLES (VERIFY rules 1-2 exist; this
      is a reinforcement of an existing practice, not a gap). However, it is the first wave in
      which V-1 karen's independent re-derivation of the served-bundle assertion is documented
      as a deliberate lane check rather than a catch. This is a positive-practice informational
      note for the V-1 lane: V-1 should independently fetch and grep the served bundle when
      C-2 claims a content assertion, rather than only reading C-2's verdict.

      Whether to elevate to a VERIFY rule depends on recurrence: if a future wave shows V-1
      catching a discrepancy between C-2's claimed bundle marker and the actually-served bundle
      (i.e., C-2's assertion was wrong), that would constitute a new failure class warranting
      a VERIFY rule about independent re-derivation of deploy claims. Not present this wave.

      NOT A NEW CANDIDATE. Informational reinforcement; no promotion track opened.
    promotion_status: >
      NOT A NEW CANDIDATE. CI-PRINCIPLES rule 7 encodes the content-assertion obligation
      at C-2. This observation notes that V-1 karen independently re-derived the same check
      this wave and records it for lineage. A VERIFY rule on V-1 independent bundle check
      would require a wave where V-1's re-derivation catches a C-2 false-claim (C-2 asserted
      marker present but V-1 finds it absent). Record for lineage; no promotion action.


  - id: obs-4
    summary: >
      The P-0 SELECTIVE-EXPANSION pattern: a task framed as "wire one dead button to a single
      route" was correctly expanded by the ceo-reviewer to a small 3-item user menu (Profile /
      Privacy / Log out) because the button was the single doorway to ALL existing-but-unreachable
      settings surfaces. The original framing (wire button to /settings/profile only) would
      have shipped a second dead-end: /settings/privacy (named M7 headline differentiator)
      would remain URL-only, reachable by no shell entry. The ceo-reviewer's SELECTIVE-EXPANSION
      verdict explicitly applied an anti-dead-end framing: "wiring to a single hardcoded
      destination ships a SECOND dead-end." The problem-framer had flagged the adjacent gap
      as a separate sibling seed (settings cross-nav), but the ceo-reviewer recognized that a
      small user menu SUBSUMES the sibling concern and eliminates the need for a separate wave.
      The head-product mediator accepted the SELECTIVE-EXPANSION and carried the guardrail
      (existing routes only, no new settings pages/panels) into P-2/P-3. The wave was 0 fix-up
      cycles at C-1, APPROVED at V-block first round. The generalizable class: when a task
      targets a shell entry-point button or nav element that is the SOLE doorway to a set of
      existing-but-unreachable surfaces, wiring it to only one destination ships a second dead
      end for all other surfaces. The expansion to a small multi-destination menu is the
      correct scope when the surfaces already exist, the menu is cheap (N items over N existing
      routes), and a narrow fix would leave named product differentiators unreachable at launch.
    source:
      - process/waves/wave-39/stages/P-0-frame.md
        # "ceo-reviewer verdict: SELECTIVE-EXPANSION. Wiring to a single hardcoded /settings/
        #   profile ships a SECOND dead-end: /settings/privacy (M7's named privacy differentiator)
        #   is ALSO only reachable via this same button."
        # "Proposes: make the entry a small user MENU (popover) reaching BOTH existing routes
        #   /settings/profile + /settings/privacy + Log out. Cheap (2-3 items over existing
        #   routes, no new pages/endpoints/data)."
        # "Guardrail: menu over existing routes ONLY, no new settings UI/panels."
        # "head-product mediation: ACCEPT ceo SELECTIVE-EXPANSION. Rationale: the button is
        #   THE single doorway to all settings; a hardcoded single-destination nav leaves
        #   privacy (M7's headline differentiator) unreachable — a launch-readiness miss."
        # "problem-framer's PROCEED and ceo's SELECTIVE-EXPANSION are not in conflict: both
        #   agree privacy must also be reachable; the menu solves both at once."
    severity: warning
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      1ST RECORDED INSTANCE of the "sole-doorway entry point wired to one destination ships
      a second dead-end for all other existing-but-unreachable surfaces; SELECTIVE-EXPANSION
      to a small multi-destination menu is the correct scope" class in L-2 history.

      Near-dup check against PRODUCT rules 1-3: rule 1 verifies seed claims about what
      exists/is absent; rule 2 verifies the seed's named target entity. Neither addresses
      scope framing for entry-point tasks where the entry is a shared doorway to multiple
      surfaces. Rule 3 addresses credential-independent builds. No near-dup.

      Near-dup check against prior PRODUCT-PRINCIPLES candidates (wave-33 obs-1 plan error
      class, wave-35 obs-1 privacy-theater, wave-35 obs-2 spec/plan divergence, wave-38 obs-2
      live-probe before architecture commitment): none address the shared-doorway expansion
      class. No near-dup.

      The class is generalizable: applies at P-0 for any task whose seed targets a shell
      entry-point (button, nav item, breadcrumb, FAB, link in a shared nav bar) that is the
      SOLE entry to a product area containing multiple existing-but-unreachable routes. The
      check: wiring to one destination leaves how many other destinations unreachable after
      the task ships? If the answer is > 0 existing surfaces, the correct expansion is to wire
      all of them via a multi-destination affordance (menu, drawer, picker) if the cost is
      proportional to the doorway's scope. An expansion that adds new surfaces (pages,
      endpoints, data) is still out of scope; the criterion is "over existing routes only."

      Falsifiability: checkable at P-0 / P-1. Given a task scoped to "wire entry E to
      destination D," enumerate all routes/surfaces that (a) currently exist and are routed,
      (b) have no other shell entry, and (c) are intended to be user-reachable. If the count
      is > 1 and the single-destination wiring leaves the others URL-only with no shell entry,
      the task qualifies for SELECTIVE-EXPANSION. A P-0 that accepts the narrow single-
      destination scope without this check fails the rule for any doorway entry-point task.

      HOLD. First instance. Promote to PRODUCT-PRINCIPLES rule 4 on second confirming wave
      where: (a) a P-0 SELECTIVE-EXPANSION on a sole-doorway entry point is accepted and
      produces a clean wave (no out-of-scope additions, no increase in fix-up cycles), OR
      (b) a P-0 that accepts a narrow sole-doorway wiring ships the partial fix and a
      follow-up wave is required to reach the other existing-but-unreachable surfaces.

      Competing PRODUCT-PRINCIPLES rule 4 candidates (all 1st-instance HOLDs):
        - wave-35 obs-1 (strong): privacy-theater identical-behavior selector (4-wave HOLD)
        - wave-35 obs-2 (warning): spec data contract / P-3 plan divergence (4-wave HOLD)
        - wave-33 obs-1 (warning): plan names framework error class absent from stack (6-wave HOLD)
        - wave-29 obs-1 (warning): plan-level operator fix must lock single expression (10-wave HOLD)
        - wave-38 obs-2 (warning): P-3 empirical probe of live external service (2-wave HOLD)
        - wave-39 obs-4 (warning): sole-doorway expansion (this wave, 1-wave HOLD)
      First-to-confirm takes the slot. Wave-35 obs-1 (strong, 4-wave HOLD) takes priority by
      severity if it confirms before any warning candidate.
    promotion_gates:
      generalizable: true
        # Applies at P-0 for any task targeting a shell nav element that is the only entry
        # to a product area containing multiple existing-but-unreachable routes. The check:
        # after this task ships, how many existing product surfaces remain reachable only
        # via direct URL? If > 0 and those surfaces are named in product scope (milestone,
        # founder_bets, feature-list), the task qualifies for SELECTIVE-EXPANSION to a
        # multi-destination affordance over existing routes. Expanding to new surfaces
        # (new pages, endpoints, data) is separately governed by scope rules.
      falsifiable: true
        # Checkable at P-0 / P-1: enumerate routes matching (a) exists + routed, (b) no
        # other shell entry, (c) in-scope for current milestone. If the narrow task would
        # leave count(b) > 1 at ship time, the single-destination wiring fails this check.
        # A P-0 that narrows to one destination without this enumeration is NOT falsified by
        # this rule alone — it requires the enumerator to identify > 1 existing orphaned
        # surface. Trigger: spec or P-0 frame names a product differentiator that is "already
        # built / only reachable via URL" and the task wires only one other destination.
      cited: true
        # P-0-frame.md: ceo-reviewer SELECTIVE-EXPANSION verdict with explicit "second dead-end"
        #   framing; privacy named as M7 headline differentiator; guardrail carried into P-2;
        # P-0-frame.md: head-product ACCEPT mediation: "button is THE single doorway; hardcoded
        #   single-destination nav leaves privacy unreachable — a launch-readiness miss";
        # C-1-pr-ci-merge.md: 0 fix-up cycles; all 7 CI jobs green (no scope-creep cost);
        # V-3-fast-fix.md: APPROVED first round (0 blocking; clean expansion confirmed).
    candidate_rule_shape: >
      [target: PRODUCT-PRINCIPLES rule 4]
      When a task wires a sole-doorway entry to one existing route, verify no other
      existing-but-unreachable routes share that doorway; expand to cover all.
      Why: Wiring one destination leaves every other existing surface reachable only via
      URL, shipping a second dead-end that requires its own follow-up wave.
      Rule line = 115 chars; why line = 96 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. Clean wave (0 fix-up cycles, V-block APPROVED first round)
      confirms the expansion was well-scoped. Watch for second confirming wave.
```

---

## Prior held observations — second-instance status (wave-34 through wave-38)

| origin | obs | class | wave-39 status |
|--------|-----|-------|----------------|
| wave-38 | obs-1 | B-5 omits repo-root lint command; "root/CI owns lint" rationalization; deterministic lint errors reach CI | APPLIED (not re-failed). B-5-verify.md explicitly ran `biome ci .` with "wave-38 lesson" citation; C-1 fix_up_cycles: 0. Lesson operationally confirmed. Remains 1-wave HOLD (BUILD-PRINCIPLES rule 9 / rule 7 sharpen candidate). See obs-2 above. |
| wave-38 | obs-2 | P-3 empirically probes live external service before committing to access-semantics architecture | NOT CONFIRMED. Frontend-only wave; no external service integration at P-3. Remains 2-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-38 | obs-3 | process.env.X = undefined stringification trap; Biome noDelete suggested fix stringifies key to truthy "undefined" | NOT CONFIRMED. Frontend-only wave; no NestJS spec teardown with process.env manipulation. Remains 2-wave HOLD (BUILD-PRINCIPLES or T-2.md candidate). |
| wave-38 | obs-4 | T-8 rule 2 scope gap: public unauthenticated :id endpoints unprobed for malformed input | NOT CONFIRMED. No new public API endpoints introduced. Remains 2-wave HOLD (T-8.md rule 2 amendment candidate). |
| wave-37 | obs-2 | HTTP verb mismatch (client POST vs controller @Patch) passes service-layer tests; controller route-metadata assertion catches it | NOT CONFIRMED. Frontend-only wave; no new controller routes. Remains 2-wave HOLD (CI-PRINCIPLES or T-2.md candidate). |
| wave-37 | obs-3 | Bootstrap-once list + live-count-only hook leaves list surface stale on reopen | NOT CONFIRMED. UserMenu opens fresh (no list+live-counter hook; component mounts and unmounts per open cycle). Remains 2-wave HOLD (BUILD-PRINCIPLES or T-2.md candidate). |
| wave-36 | obs-1 | Security-boundary authz/IDOR tests deferred to follow-up wave; no committed artifact in shipping wave | NOT CONFIRMED. No authz or IDOR boundary introduced (frontend-only settings nav). Remains 3-wave HOLD (BUILD-PRINCIPLES rule 9 candidate). |
| wave-36 | obs-3 | Two-layer IDOR proof: service integration + controller session-scoping test for session-only-userId endpoints | NOT CONFIRMED. No session-scoped endpoints. Remains 3-wave HOLD (BUILD-PRINCIPLES or T-8.md rule 3 candidate). |
| wave-35 | obs-1 | Identical-behavior privacy options = privacy-theater; honest selector collapses them | NOT CONFIRMED. Wave-39 is a navigation menu wave; no privacy settings selector authored. Remains 4-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate, strong; highest-priority by severity). |
| wave-35 | obs-2 | Spec data contract diverges from P-3 architecture decision; P-4 REWORK required | NOT CONFIRMED. Frontend-only wave; no data model. Remains 4-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-34 | obs-2 | D-3 gate checked brief states but not brief interactions; named entry control omitted from mockup | NOT CONFIRMED. design_gap_flag deferred at P-0 to P-1; D-block was skipped (existing popover pattern found, no new D-block brief). Remains 5-wave HOLD (DESIGN-PRINCIPLES / D-3 rubric candidate). |
| wave-33 | obs-1 | Plan names a framework-specific error class absent from the actual stack | NOT CONFIRMED. Frontend-only wave; no framework error class named in plan. Remains 6-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-33 | obs-2 | Error-mapping fix must fire against a real upstream error from the actual code path | NOT CONFIRMED. No error-mapping fix cycle. Remains 6-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-33 | obs-3 | Clone the shipped error-walk helper depth for new error codes on the same stack | NOT CONFIRMED. Frontend-only wave; no new pg error-code mapping. Remains 6-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-32 | obs-1 | Wiring new api method into existing component invalidates explicit-enumeration mock factory | NOT CONFIRMED. No api.ts changes; no existing component modified to wire a new api method. Remains linter-blocked HOLD (BUILD-PRINCIPLES slot 9 candidate). |
| wave-32 | obs-3 | Typed api-client method added but consumer fetches inline in parallel | NOT CONFIRMED. No new api-client method. Remains 7-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-31 | obs-1 | Credential-endpoint gate: membership check before loading or branching on resource | NOT CONFIRMED. No new credential-issuing endpoint. Remains 8-wave HOLD (BUILD-PRINCIPLES rule 9 candidate, strong; highest-priority BUILD slot-9 holder). |
| wave-31 | obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() bridge | NOT CONFIRMED. No new ESM-only npm dependency. Remains 8-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code ?? default | NOT CONFIRMED. No DB query on a nullable FK. Remains 9-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED. No cron or background job. Remains 9-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED. V-2 triage: 0 blocking, 0 non-blocking; 3 noise items disposed. Remains 9-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | NOT CONFIRMED. No plan-level operator-fix. Remains 10-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites catches reviewer-missed occurrence | NOT CONFIRMED. V-3 Phase 2 skipped (fast-fix queue empty). Remains 10-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED. Valid M7 feature wave; no override-ship. Remains 10-wave HOLD (PRODUCT-PRINCIPLES candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED. gitleaks secret-scan PASS at C-1 (clean, exit 0). Remains 11-wave HOLD (CI-PRINCIPLES candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED. No CI-config fix cycle. Remains 11-wave HOLD (CI-PRINCIPLES candidate). |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED. No EXPLAIN-based integration test. Remains 12-wave HOLD (T-4 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED. Not a performance wave. Remains 12-wave HOLD (T-7 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 caught it | NOT CONFIRMED. No store-keyed unit fixture. Remains 13-wave HOLD (T-2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED. No date-dependent test fixture. Remains 13-wave HOLD (T-2 candidate). |

---

## Signals evaluated and dropped

**Signal: H1 (onClose fires before async action — orphaned handler) as a separate BUILD observation:**
H1 is structurally related to C1 (both stem from the close-then-act ordering in handleSelect).
However, H1 is a structural race on the async orphaning pattern, while C1 is the concrete
production failure class (no error path on signOut → user stranded). H1 was fixed in the same
commit as C1 (91bcb5a: act-then-close reordering). The broader class (async action in a soon-
to-unmount component) is a consequence of the same root: the error path missing in C1 is what
makes H1's orphaning dangerous. The generalizable lesson is captured by obs-1's candidate rule
(async session/auth SDK call must have error path + reject-path test). H1 adds nuance (close
ordering) but is narrow enough to be a sub-consequence of the C1 class, not an independent
principle. Absorbed into obs-1. DROPPED as standalone observation.

**Signal: M2 / M3 accessibility regressions (focus management, arrow-key roving) as a BUILD observation:**
M2 (focus lost after menu-item selection) and M3 (role="menu" declared but focus-in-on-open
and arrow-key roving absent) were caught by B-6 Phase 2. M2's focus-after-nav was classified
as LOW (focus goes to destination page) and M3 as MEDIUM accepted-debt (deferred; same
limitation as reference AddReactionPopover). Neither produced a blocking finding or a fast-fix
round. The class (announcing role=menu while implementing a plain popover without full ARIA
keyboard pattern) is real but narrow to components declaring ARIA menu roles. It is not
generalizable beyond ARIA-role-announces-pattern-not-implemented cases, which are already
implicitly covered by BUILD rule 4's adversarial check obligation. DROPPED: too narrow for a
principle; accepted-debt disposition correct; no follow-up task filed.

**Signal: V-2 0-blocking, 0-non-blocking triage as a process insight:**
V-2 returned 0 blocking and 0 non-blocking findings (3 noise items: JWT-TTL semantics,
avatar-preview-contrast test-fixture artifact, 429-under-test-loop rate-limit). A 0-finding
triage is the expected gate outcome when B-6 fixed all critical/high findings pre-merge and
T-block found no new issues. This reflects gate mechanism working correctly, not a new
observation. DROPPED.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Async signOut had no error path; always-resolving mock hid the reject path; B-6 caught CRITICAL; reject-path test added | strong | 1st instance | BUILD-PRINCIPLES | HOLD — rule 9 candidate; promote on 2nd confirming wave |
| obs-2 | Wave-38 obs-1 (biome ci at B-5) applied proactively this wave; 0 CI fix-up cycles | informational | confirmation-by-application | BUILD-PRINCIPLES | CONFIRM-APPLIED — wave-38 obs-1 status unchanged (still 1-wave HOLD); no new promotion |
| obs-3 | V-1 karen independently re-derived the served-bundle content assertion vs C-2's claimed hash; confirmed true-positive | informational | reinforcement of CI rule 7 + V-1 verification pattern | VERIFY-PRINCIPLES | NOT A NEW CANDIDATE — CI rule 7 encodes the C-2 obligation; V-1 re-derivation is positive practice; no gap |
| obs-4 | P-0 SELECTIVE-EXPANSION: sole-doorway button wired to one route ships a second dead-end; menu over existing routes is the correct expansion | warning | 1st instance | PRODUCT-PRINCIPLES | HOLD — rule 4 candidate; promote on 2nd confirming wave |

**Observations emitted: 4 (obs-1, obs-2, obs-3, obs-4)**
**Severities: 1 strong (obs-1), 1 warning (obs-4), 2 informational (obs-2, obs-3)**
**Candidate files: BUILD-PRINCIPLES (obs-1 new hold; obs-2 applied-confirmation), PRODUCT-PRINCIPLES (obs-4)**
**Promotion-eligible this wave: NONE (obs-1 and obs-4 are first-instance HOLDs; obs-2 and obs-3 are informational non-candidates)**
**Dropped: H1 close-ordering race (absorbed into obs-1); M2/M3 a11y (narrow, accepted-debt, BUILD rule 4 mechanism); V-2 0-finding triage (gate mechanism correct)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave. One first-instance HOLD (strong), one first-instance
HOLD (warning), two informational non-candidates.**

**obs-1** (BUILD-PRINCIPLES rule 9 candidate, strong severity) is the highest-priority new HOLD.
The class is structurally invisible to type-checking and always-resolving test mocks: the only
detection mechanisms are adversarial code review (what B-6 Phase 2 did) or a deliberate
mock-rejection test case (which the fix added). The rule is falsifiable at B-6 Phase 1:
grep the handler for `await <sdkMethod>()` followed by `navigate()` or `setState()` without
a surrounding try/catch. Falsifiable at T-2: grep the test file for `mockRejectedValueOnce`
or equivalent on the auth SDK mock. A handler with neither fails both checks. Watch for: any
wave adding async auth/session SDK calls (signOut, revoke, close) inside a component action
that then navigates or changes state.

Priority note for BUILD slot 9: wave-31 obs-1 (strong: credential-endpoint membership-before-
load) is the longest-running strong candidate (8-wave HOLD). It takes slot 9 if it confirms
before wave-39 obs-1. Wave-39 obs-1 is newer but same severity. Both are strong; first-to-
confirm takes the slot.

**obs-4** (PRODUCT-PRINCIPLES rule 4 candidate, warning severity) is the second new HOLD.
The sole-doorway expansion class has a measurable outcome: the correct expansion (3-item menu)
was delivered in 0 extra waves with 0 fix-up cycles. The counterfactual (narrow wiring to one
destination) would have required a follow-up wave for the privacy surface. The rule is
falsifiable at P-0 (enumerate orphaned existing routes after task ships). The competing
rule 4 candidates are numerous; wave-35 obs-1 (strong, 4-wave HOLD) takes priority by severity.

**wave-38 obs-1 application note** (obs-2 above): the wave-38 B-5 lint lesson was explicitly
cited and applied at B-5 this wave, producing 0 CI fix-up cycles (vs wave-38's 1 fix-up commit
for the same class). This is the strongest indication to date that the candidate BUILD rule
(run the exact CI lint command at B-5) is operationally effective when applied. The promotion
bar (second FAILURE instance) has not been met but the operationalizability signal is strong.
Watch for: any B-5 transcript that documents "no X-level lint script" without also recording
having run the repo-root lint command.

**Competing BUILD slot-9 candidates (all HOLDs):**
  - wave-31 obs-1 (strong, 8-wave HOLD): credential-endpoint membership-before-load
  - wave-39 obs-1 (strong, this wave): async auth SDK call with no error path + reject-path test
  - wave-36 obs-1 (warning, 3-wave HOLD): authz tests deferred to follow-up wave
  - wave-36 obs-3 (warning, 3-wave HOLD): two-layer IDOR proof for session-only-userId endpoints
  - wave-37 obs-3 (warning, 2-wave HOLD): bootstrap-once list + live-count-only hook stale on reopen
  - wave-38 obs-1 (warning, 2-wave HOLD): B-5 omits repo-root lint command
  - wave-38 obs-3 (warning, 2-wave HOLD): process.env = undefined stringification trap
  - wave-32 obs-1 (warning, linter-blocked HOLD): enumerated-mock factory staleness
  - wave-33 obs-3 (informational HOLD): clone shipped error-walk helper depth
  - wave-32 obs-3 (informational, 7-wave HOLD): typed api-client method vs inline consumer
  First-to-confirm takes the slot; wave-31 obs-1 and wave-39 obs-1 (both strong) have priority
  over all warning-severity candidates.
