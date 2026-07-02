# Wave 36 — L-2 Distill Observations

Synthesized from wave-36 artifacts (M7 test-hardening: durable regression coverage for
the privacy authz/IDOR/PII boundary shipped in wave-35; PR #50 merge be1bbab; all blocks
APPROVED first round — V-2 triage returned 0 findings, V-3 fast-fix skipped). Inputs read:
stages/P-0-problem-framer.md, stages/P-2-spec.md, stages/B-6-review.md,
blocks/B/gate-verdict.md, blocks/T/gate-verdict.md, blocks/T/findings-aggregate.md,
stages/V-1-karen.md, stages/V-1-jenny.md, stages/V-2-triage.md, blocks/V/gate-verdict.md.
Prior archives consulted: process/waves/_archive/wave-{31,32,33,34,35}/blocks/L/observations.md;
wave-{23,24,25}/blocks/L/observations.md (test-deferral / integration-tier lineage).
Principles files read: BUILD-PRINCIPLES (8 rules), CI-PRINCIPLES (7 rules; rule 7 promoted
from wave-35 obs-4), PRODUCT-PRINCIPLES (3 rules), VERIFY-PRINCIPLES (2 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      Wave-35 shipped the M7 privacy authz boundary (profile-visibility roster filtering,
      data-export session-scoping, scrubPii PII scrub) with the security properties proven
      ONLY by ephemeral T-8 live reproduction that evaporated after fixture teardown. No
      durable committed regression tests were authored at the B-block that introduced the
      boundary. Wave-36 was required as an entire dedicated follow-up wave to backfill the
      missing coverage: 2 real-Postgres integration specs, 3 unit/controller specs, plus
      2 controller session-scoping tests (B-6 M2 fixup). The P-0 problem-framer named the
      gap explicitly: "there is a genuine deeper cause (wave-35 B-block should have authored
      these inline with the implementation, a build-discipline gap)" and recommended L-2
      capture the observation for BUILD-PRINCIPLES promotion "if it recurs." The wave's
      load-bearing acceptance criterion (AC-5 in P-2-spec.md) stated: "Integration tier
      must PROVABLY execute (real-DB row counts, not skipped — wave-17/24 false-green lesson)"
      — underscoring that the prior missing-test gap and the false-green risk are co-present
      when security tests are deferred. The generalizable class: when a wave introduces an
      authz, IDOR, or PII-scrub boundary, durable committed regression tests for that boundary
      must be authored in the same wave as the boundary code; ephemeral T-8 live reproduction
      does not substitute for a committed test file, and its absence creates a test-debt
      requiring a dedicated backfill wave.
    source:
      - process/waves/wave-36/stages/P-0-problem-framer.md
        # "there is a genuine deeper cause (wave-35 B-block should have authored these
        #   inline with the implementation, a build-discipline gap)"
        # "Recommend L-2 capture the process observation ('author regression tests inline
        #   with the security-boundary code that motivates them; do not defer to a follow-up
        #   wave') for BUILD-PRINCIPLES promotion if it recurs."
      - process/waves/wave-36/stages/P-2-spec.md
        # "Integration tier must PROVABLY execute (real-DB row counts, not skipped —
        #   wave-17/24 false-green lesson)."
        # "security_scope: user-data-authz + data-export (tests OF the shipped boundary)"
      - process/waves/wave-36/blocks/B/gate-verdict.md
        # "This is a test-hardening wave where the tests ARE the product, so the gate
        #   turns on test honesty and provable CI execution."
      - process/waves/wave-36/blocks/T/gate-verdict.md
        # "This is a test-hardening wave whose deliverable IS the durable regression suite
        #   ... did the new real-Postgres integration specs ACTUALLY RUN in CI (not silently
        #   skip), and are their assertions honest? Both answers are yes."
      - process/waves/wave-36/stages/V-1-karen.md
        # F2: "The integration tests ACTUALLY RAN in CI, 0 skipped (THE load-bearing claim)
        #   ... The wave-17/24 false-green class did NOT recur — this coverage is real."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST CLEAN INSTANCE of the precise class: "security-boundary code shipped in wave N
      with no committed regression tests (ephemeral T-8 live reproduction only); a dedicated
      follow-up wave N+1 required solely to backfill durable tests."

      Wave-24 ("M5 debt — real-Postgres integration test tier") is the nearest adjacent
      case: it was also a dedicated test-backfill wave for authz boundaries (listServerMembers
      member-gate, rbac.getEffectivePermissions, can(manage_assignments)). However:
        (a) wave-24's boundaries shipped with ZERO verification of any form — not even
            ephemeral T-8 live reproduction. Wave-36's boundary (wave-35) WAS T-8-proven
            ephemerally; the gap is the absent committed artifact, not the absent proof.
        (b) wave-24's L-2 did not isolate this class; its obs-1 focused entirely on the
            CI false-green execution-count mechanism (the confirmed wave-17 lineage).
        (c) wave-24 was categorized at L-2 as "M5 debt / under-floor override-ship" on
            the milestone-size track, not the test-timing track.
      The wave-36 class is therefore the first clean L-2 isolation of the specific mechanism:
      ephemeral T-8 reproduction used as the proof of record, no committed artifact authored,
      follow-up wave required.

      Near-dup check against BUILD rule 4: BUILD rule 4 requires "Reproduce one negative path
      per authz or injection boundary at B-6 Phase-2." Wave-35 B-6 DID satisfy rule 4 —
      T-8 live reproduction was the adversarial pass. The gap is that rule 4 requires
      REPRODUCTION (running a probe) but does not require AUTHORING a committed test file.
      This candidate adds an authoring obligation rule 4 leaves open. Different requirement
      type; not a near-dup.

      Near-dup check against wave-23 obs-2: wave-23 obs-2 was "specialist deferred authz
      coverage to the T-8 STAGE within the same wave" — an intra-wave deferral from B-block
      to T-8. That class is already covered by BUILD rule 4. Wave-36 obs-1 is an inter-wave
      deferral: T-8 ran in wave-35 but no committed test was authored; an entire follow-up
      wave was consumed. Different granularity. Not a near-dup.

      Near-dup check against BUILD rules 1-8: no existing rule addresses the authoring
      obligation (committed test file) for authz/IDOR boundaries at the B-block that ships
      the boundary. BUILD slot 9 is open, though it has multiple competing 1st-instance HOLDs
      (wave-31 obs-1 strong, wave-31 obs-4 warning, wave-32 obs-1 linter-blocked,
      wave-33 obs-3 informational). Wave-31 obs-1 (strong) takes slot priority if it confirms
      before wave-36 obs-1.

      Falsifiability: checkable at B-6 Phase 1 for any wave introducing an authz or IDOR
      boundary: does the PR contain at least one committed test file (integration spec or
      controller-layer unit) asserting the boundary's enforcement property? A PR whose only
      test evidence is "T-8 will verify live" with no committed test file in the diff fails
      this rule. Exception: a boundary where the test harness does not yet exist AND building
      the harness would itself be a separate wave may defer — but must file an explicit
      follow-up task.
    promotion_gates:
      generalizable: true
        # Applies at B-6 Phase 1 for any wave that ships an authz filter, IDOR scope,
        # or PII-scrub boundary. The question: does the PR diff contain at least one
        # committed file in a test directory (integration/ or *.spec.ts) that imports
        # the real SUT and asserts the boundary property (e.g., excluded-from-roster,
        # self-scoped data, PII fields scrubbed)? A PR that tests only happy paths or
        # defers authz proof entirely to ephemeral T-8 live reproduction fails this check.
      falsifiable: true
        # At B-6 Phase 1: `git diff --name-only HEAD~1 | grep -E 'spec|test'` must yield
        # at least one file per authz/IDOR boundary in the diff. For each such boundary,
        # the test file must import the real SUT (no vi.mock on the module under test) and
        # assert a property unique to the boundary (e.g., excluded user id absent from
        # roster; export data contains only session user's rows). A B-6 Phase 1 APPROVE
        # that does not confirm committed test artifacts for each authz boundary fails this
        # rule. Grep signal: no file matching `test/integration/**/*.spec.ts` or
        # `**/*.spec.ts` in the diff for a wave that introduces a new authz boundary.
      cited: true
        # P-0-problem-framer.md (explicit gap diagnosis: "wave-35 B-block should have
        #   authored these inline with the implementation, a build-discipline gap";
        #   L-2 promotion criterion: "if it recurs");
        # P-2-spec.md (binding AC: "Integration tier must PROVABLY execute — wave-17/24
        #   false-green lesson"; security_scope field naming this as tests OF the boundary);
        # B/gate-verdict.md (wave framing: "tests ARE the product" — the entire wave's
        #   load-bearing purpose was to fill the committed-test gap);
        # T/gate-verdict.md (independently confirmed: "durable regression suite" as the
        #   deliverable, 12 real-Postgres specs provably ran, false-green class not recurred);
        # V-1-karen.md F2 (load-bearing claim independently verified: "0 skipped, THIS
        #   coverage is real" — confirming the prior wave's gap was real and now closed).
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9]
      When a wave ships an authz or IDOR boundary, author at least one durable regression
      test for it in the same wave.
      Why: Ephemeral T-8 live reproduction evaporates after fixture teardown, leaving the
      boundary unprotected.
      Rule line = 97 chars; why line = 75 chars. No forbidden tokens. No wave refs.
    promotion_status: HOLD. First clean instance. Promote to BUILD-PRINCIPLES rule 9 on
      second confirming wave where an authz or IDOR boundary ships without a committed
      regression test and a dedicated follow-up wave is required to backfill it, OR where
      an explicit B-6 Phase-1 check for committed test artifacts prevents the gap.
      Note: wave-31 obs-1 (strong) is the highest-priority competing slot-9 candidate.


  - id: obs-2
    summary: >
      CI-PRINCIPLES rule 5 ("Assert a nonzero executed-count from the CI integration job
      log; a green exit with zero specs run is a false-green") was validated under adversarial
      conditions this wave. Both new integration specs use the exact skipIf guard mechanism
      that caused the wave-17/wave-24 false-green: `describe.skipIf(!process.env.DATABASE_URL_TEST)`.
      The P-2 spec bound this explicitly as a load-bearing AC: "Integration tier must PROVABLY
      execute (real-DB row counts, not skipped — wave-17/24 false-green lesson)." The CI job
      (DATABASE_URL_TEST set from postgres:16 service; confirmed at steps env level) made the
      skipIf guard evaluate false. The executed-count check was performed three independent
      times across the wave: T-4 integration stage (CI run 28612547810), V-1 karen (job
      84845085352), and V-3 head-verifier (same run re-verified). All three confirmed 12
      integration tests with real per-test timings (34-68ms), 0 skipped, and non-vacuous
      sanity assertions (countRows >= 2 before boundary assertions) that make an empty-roster
      vacuous pass structurally impossible. The wave-17/24 false-green did NOT recur. This is
      an informational validation instance for CI rule 5; it is not a new observation.
    source:
      - process/waves/wave-36/stages/P-2-spec.md
        # "Integration tier must PROVABLY execute (real-DB row counts, not skipped —
        #   wave-17/24 false-green lesson). BINDING."
      - process/waves/wave-36/blocks/T/gate-verdict.md
        # "I pulled the CI test-job log (84845085352, headSha 211888998 = current HEAD).
        #   DATABASE_URL_TEST is set in the job env (***localhost:5432/studyhall_test), so
        #   the describe.skipIf(SKIP) guard evaluates false."
        # "No SKIPPED: DATABASE_URL_TEST decoy line appears in the log. The wave-17/24
        #   false-green class did NOT recur — this coverage is real, not decorative."
      - process/waves/wave-36/stages/V-1-karen.md
        # F2: "Skip-decoy check: zero SKIPPED: DATABASE_URL_TEST / it.skip markers fired
        #   for either spec in the log ... Integration-run summary: Test Files 11 passed
        #   (11) / Tests 51 passed (51)."
      - process/waves/wave-36/blocks/V/gate-verdict.md
        # "T-block CI run 28612547810 ... shows both new specs executing with real per-test
        #   timings (34-42ms) — 7 IDOR + 5 roster-visibility = 12 tests — including the
        #   non-vacuous sanity: users/server_members has 2 real rows after seed write-proofs
        #   and the provable roster length drops from 2 to 1 before/after delta."
    severity: informational
    candidate_principles_file: none (CI-PRINCIPLES rule 5 already covers this;
      this is a reinforcement instance, not a new observation)
    recurrence: >
      REINFORCEMENT of CI-PRINCIPLES rule 5 (promoted at wave-24, lineage wave-17+wave-24).
      Wave-36 is a validation instance: the same skipIf mechanism that caused prior false-
      greens was present in the delivered specs and the rule's underlying discipline (explicit
      count verification, independently performed three times) held. No new failure mode
      observed. No new promotion track opened.
    promotion_status: NOT A NEW CANDIDATE. CI-PRINCIPLES rule 5 encodes this discipline.
      This wave reinforces the rule by applying the count-check under exact false-green
      conditions (identical skipIf guard, DATABASE_URL_TEST as the gating env var) without
      a recurrence. Record for lineage completeness; no promotion action.


  - id: obs-3
    summary: >
      The initial wave-36 integration test for data-export IDOR proved the SERVICE layer
      is self-scoped (AccountDataService.getAccountData(userId) returns only that user's data)
      but left the CONTROLLER layer — the actual enforcement point where userId is derived
      exclusively from req.session.getUserId() — without a test. A B-6 Phase 2 code-reviewer
      finding (M2) identified this gap: the route has NO ?userId param, so the honest IDOR
      proof is structural (assert userId cannot be supplied from request body or query and
      overrides the session), not just functional (assert the service scopes by userId when
      given one). Without the controller test, an attacker-supplied body param that happens
      to reach the service would be invisible to the service-only test. The fix added
      controller session-scoping tests for both getAccountData and exportAccountData, asserting
      the service is called with 'session-scoped-id-99' (the session mock value) and not with
      any other caller-controlled value. V-1 jenny explicitly described the correct layering:
      "the integration test proves the service is userId-param-scoped; the actual IDOR defense
      (userId sourced from req.session.getUserId(), never from route/query/body override) is
      proven at the controller layer." The generalizable class: for any endpoint where userId
      is derived exclusively from the session (no route/query/body param for it), a
      service-layer integration test is necessary but not sufficient for the IDOR proof;
      a controller-layer test asserting session-derivation is the honest enforcement-point
      assertion.
    source:
      - process/waves/wave-36/blocks/B/gate-verdict.md
        # Phase 2 M2 (fixed): "controller-layer IDOR defense (getAccountData/exportAccountData
        #   deriving userId from session, not attacker input) was untested → added controller
        #   session-scoping tests. Commit on branch."
      - process/waves/wave-36/stages/V-1-jenny.md
        # AC-2: "Note on intent-coverage: the integration test proves the service is
        #   userId-param-scoped; the actual IDOR defense (userId sourced from
        #   req.session.getUserId(), never from route/query/body override) is proven at
        #   the controller layer — see AC-2's dedicated controller test below. Together
        #   they cover the spec intent."
        # "Controller session-scoping (the real IDOR defense): getAccountData/exportAccountData
        #   assert toHaveBeenCalledWith('session-scoped-id-99') — userId comes from session,
        #   and an attacker-supplied body/query id cannot substitute it. This is the honest
        #   defensive assertion, not a tautology."
      - process/waves/wave-36/stages/V-1-karen.md
        # F4 (B-6 fixups): "Controller session-scoping tests exist for BOTH endpoints:
        #   privacy.controller.spec.ts:203 getAccountData derives userId from session
        #   (not body/query) — structural IDOR proof and :231 mirror for exportAccountData;
        #   both assert the service is called with the session userId."
      - process/waves/wave-36/stages/B-6-review.md
        # "2 Medium test-quality findings FIXED in-branch (M1 real scrubPii SUT;
        #   M2 controller IDOR session-scoping tests)"
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "IDOR defense proven only at service integration layer, not at
      controller session-scoping layer; B-6 Phase 2 caught the gap" class in L-2 history.

      The class is generalizable: applies at any B-block wave introducing an endpoint where
      userId is derived exclusively from the session (req.session.getUserId() or equivalent)
      with no route/query/body param. For such endpoints, the test suite must include both:
        (a) a service-layer integration or unit test proving the service scopes correctly
            when given a userId, AND
        (b) a controller-layer test asserting the service is called with the session-derived
            userId (not with an attacker-controlled value).
      Part (b) is the load-bearing IDOR proof because it tests the dispatch path, not just
      the service's behavior when the correct userId is supplied.

      Near-dup check against BUILD rule 4: BUILD rule 4 requires "Reproduce one negative
      path per authz or injection boundary at B-6 Phase-2." Rule 4 is the mechanism that
      CAUGHT M2 (Phase 2 adversarial review). This candidate names the specific two-layer
      test shape rule 4's adversarial pass identified as missing. Rule 4 says HOW to probe;
      this candidate says WHAT specific layer must be present for a session-scoped IDOR
      boundary. Not a near-dup; complementary.

      Near-dup check against T-8.md rules 1-2: T-8 rule 2 addresses malformed :id route
      params; T-8 rule 1 addresses the security test stage protocol. Neither specifies the
      two-layer controller+service test obligation for session-scoped IDOR. No near-dup.

      Near-dup check against BUILD rules 1-8 and VERIFY rules 1-2: no existing rule
      addresses the controller-layer test obligation for session-only-userId endpoints.

      BUILD slot 9 is the candidate slot (same competing queue as obs-1 above).
      Alternative: T-8.md slot 3 (T-8 has 2 rules; slot 3 open), since this is equally
      a security-layer test obligation. Promotion target TBD at confirmation.

      Falsifiability: checkable at B-6 Phase 1 for any endpoint in the diff where the
      handler body calls req.session.getUserId() (or equivalent) and there is no userId
      route/query/body parameter: does the test suite include a controller-layer test
      asserting toHaveBeenCalledWith(<session-derived-value>) on the downstream service
      call? A test suite with only a service-layer integration test for such an endpoint
      fails this rule.
    promotion_gates:
      generalizable: true
        # Applies at B-6 Phase 1 / T-8 for any wave adding or modifying an endpoint
        # whose only userId source is the session (no route param :userId, no query ?userId,
        # no body userId field). Grep signal: handler body contains
        # req.session.getUserId() (or similar session extraction) AND no route-param or
        # body destructuring for userId. For such endpoints: confirm the test suite includes
        # a controller test asserting the service was called with the session-derived value.
      falsifiable: true
        # Checkable at B-6 Phase 1: for each endpoint in the diff where userId is session-
        # only, does the PR include a test file for the controller that mocks the session
        # (req.session.getUserId returning a fixed value) and asserts the service was called
        # with exactly that value? A controller test that only asserts HTTP 200 or response
        # shape — without asserting WHICH userId the service received — fails this rule for
        # a session-scoped endpoint. Proxy signal: absence of `toHaveBeenCalledWith` on the
        # service mock in any controller spec for the endpoint.
      cited: true
        # B/gate-verdict.md Phase 2 M2 (gap: controller-layer IDOR untested; fix: controller
        #   session-scoping tests for both getAccountData and exportAccountData; commit on
        #   branch — confirming the gap was real and cheaply fixed at B-6);
        # V-1-jenny.md AC-2 (explicit two-layer framing: "integration test proves service
        #   self-scoped; IDOR defense (userId from session, never body/query) proven at
        #   controller layer; together they cover the spec intent");
        # V-1-karen.md F4 (source-claim verification: both controller session-scoping tests
        #   confirmed present, deriving from session not body/query, structural IDOR proof).
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9 or T-8.md rule 3]
      For a session-scoped endpoint (userId from session only), include both a service
      integration test and a controller test asserting the session-derived userId is used.
      Why: A service-only test proves scoping given a userId but not that session is
      the sole source; the controller test is the structural IDOR proof.
      Rule line = 118 chars; why line = 96 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote on second confirming wave where B-6
      Phase 2 or T-8 catches a missing controller session-scoping test on a session-only-userId
      endpoint, OR where an explicit B-6 Phase-1 check for the two-layer test shape prevents
      the gap from reaching the code reviewer.
```

---

## Prior held observations — second-instance status (wave-30 through wave-35)

| origin | obs | class | wave-36 status |
|--------|-----|-------|----------------|
| wave-35 | obs-4 | Non-git Railway deploy: railway up + served-bundle content assertion + migration before boot | **PROMOTED to CI-PRINCIPLES rule 7** (two-wave confirmation wave-34+wave-35; rule authored; no tracking needed). |
| wave-35 | obs-1 | Identical-behavior privacy options = privacy-theater; honest selector collapses them | NOT CONFIRMED. Wave-36 is a pure test-hardening wave; no new UI settings selector was authored. Remains 1-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-35 | obs-2 | Spec data: contract diverges from P-3 architecture decision; P-4 REWORK required | NOT CONFIRMED. Test-only wave; no P-2/P-3 data model authoring. Remains 1-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-34 | obs-2 | D-3 gate checked brief states but not brief interactions; named entry control omitted from mockup | NOT CONFIRMED. design_gap_flag=false; no D-block this wave. Remains 2-wave HOLD (DESIGN-PRINCIPLES / D-3 rubric candidate). |
| wave-33 | obs-1 | Plan names a framework-specific error class absent from the actual stack; gate catches it | NOT CONFIRMED. Test-only wave; no P-3 plan with error-interception class names. Remains 3-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-33 | obs-2 | Error-mapping fix must fire against a real upstream error from the actual code path | NOT CONFIRMED. No error-mapping fix cycle; test-hardening wave. Remains 3-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-33 | obs-3 | Clone the shipped error-walk helper depth for new error codes on the same stack | NOT CONFIRMED. No new pg error-code mapping authored. Remains 3-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-32 | obs-1 | Wiring new api method into existing component invalidates explicit-enumeration mock factory | NOT CONFIRMED. No new api method wired into an existing frontend component. Remains linter-blocked (BUILD slot 9 candidate). |
| wave-32 | obs-3 | Typed api-client method added but consumer fetches inline in parallel | NOT CONFIRMED. No new api-client method; test-only wave (no api.ts changes). Remains 4-wave HOLD (BUILD candidate). |
| wave-31 | obs-1 | Credential-endpoint gate: membership check before loading or branching on resource | NOT CONFIRMED. No new credential-issuing endpoint introduced. Remains 5-wave HOLD (BUILD rule 9 candidate, strong; highest-priority competing slot-9 holder). |
| wave-31 | obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() bridge | NOT CONFIRMED. No new ESM-only npm dependency added. Remains 5-wave HOLD (BUILD candidate). |
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code ?? default | NOT CONFIRMED. No query on a nullable FK status table. Remains 6-wave HOLD (BUILD candidate). |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED. No cron or background job with external side effect. Remains 6-wave HOLD (BUILD candidate). |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED. V-2 triage returned 0 findings (empty). Remains 6-wave HOLD (VERIFY rule 3 candidate). |
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | NOT CONFIRMED. Test-only wave; no plan-level operator-fix authoring. Remains 7-wave HOLD (PRODUCT rule 4 candidate). |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites catches reviewer-missed occurrence | NOT CONFIRMED. V-3 fast-fix was skipped (fast_fix_queue empty, 0 blocking findings). Remains 7-wave HOLD (VERIFY rule 3 candidate). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED. Wave-36 is a valid follow-up test-hardening wave; not an override-ship. Remains 7-wave HOLD (PRODUCT candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED. No gitleaks interaction (clean CI). Remains 8-wave HOLD (CI candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED. No CI-config fix cycle. Remains 8-wave HOLD (CI candidate). |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED. No EXPLAIN-based integration test. Remains 9-wave HOLD (T-4 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED. Not a performance wave. Remains 9-wave HOLD (T-7 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 caught it | NOT CONFIRMED. No store-keyed unit fixture. Remains 10-wave HOLD (T-2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED. The b7feab30 stub-date fix used literal string '2026' in non-test source, not a date-dependent test fixture; the class does not fire. Remains 10-wave HOLD (T-2 candidate). |

---

## Signals evaluated and dropped

**Signal: 3-run independent CI execution verification (C-1, C-block, T-block):**
Wave-36's load-bearing claim was verified against 3 distinct CI runs: the PR-branch run at
C-1 (28611692591), the merged-main run at C-block (28612286928), and the T-block re-check
(28612547810). The redundant verification reflects the specific caution level warranted by
a wave whose only deliverable is tests using the exact skipIf mechanism from prior false-greens.
The multi-run discipline is correct caution for THIS WAVE but not a new generalizable
principle — CI rule 5 already encodes the executed-count check and does not require n > 1
runs. DROPPED as wave-specific caution, absorbed into obs-2.

**Signal: B-6 Phase 2 M1 — scrubPii replica replaced with real exported function:**
The initial beforeSend test was a verbatim replica of the inline scrubPii function (not an
import of the real function), because the function was not exported. B-6 Phase 2 (M1) caught
this and the fix was to export scrubPii from instrument.ts and import it directly. This is a
correct code-quality catch by BUILD rule 4's adversarial Phase 2 review. The generalizable
class ("inline callbacks used as beforeSend / middleware / hook that are not exported should
be extracted and exported so they can be tested directly") is real but specific to the Sentry
SDK integration pattern and to test authors who encounter unexportable callbacks. The class
is narrower than obs-3 (controller-layer IDOR) and the fix pattern (extract-export-test) is
already implicit in the no-mock-the-SUT discipline. No distinct principle beyond BUILD rule 4.
DROPPED as correctly handled by existing rule 4 mechanism; extraction noted in SDK-doc.

**Signal: V-2 empty triage on a test-hardening wave is not structurally notable:**
V-2 returned 0 findings (0 inputs from T-block, karen, jenny). On a test-hardening wave
where the deliverable IS the tests and both V-1 reviewers independently re-derived the
load-bearing claim, 0 findings is the correct gate behavior, not a new process observation.
The interesting causal mechanism (binding AC-5 on integration execution prevents coverage
theater) is already captured in obs-2 (CI rule 5 reinforcement). DROPPED as gate mechanism
working correctly.

**Signal: Candidate 1 (test-deferral) assessed as BUILD-PRINCIPLES vs BUILD rule 4
near-dup — final ruling recorded here:**
The near-dup concern between obs-1 and BUILD rule 4 was assessed carefully. BUILD rule 4
requires REPRODUCTION (running a negative-path probe at B-6 Phase 2). Wave-35 satisfied
rule 4 (T-8 ran live reproduction of the boundary). The gap was the absent COMMITTED TEST
FILE. A builder reading rule 4 as currently written ("Reproduce one negative path") has no
instruction to commit a test file. The candidate adds the authoring obligation rule 4 omits.
Ruling: not a near-dup; complementary. Maintaining obs-1 as a HOLD with the distinct rule
shape. Recorded here for future L-2 reviewers considering the same question.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Security-boundary authz/IDOR tests deferred to follow-up wave; no committed artifact in shipping wave | warning | 1st clean instance | BUILD-PRINCIPLES | HOLD — rule 9 candidate; promote on 2nd confirming wave where authz boundary ships without committed regression test requiring backfill wave |
| obs-2 | CI-PRINCIPLES rule 5 validated under exact false-green conditions — skipIf guard, 3-run verification, 0 recurrences | informational | reinforcement of CI rule 5 | none (rule already exists) | NOT A NEW CANDIDATE — informational validation instance only |
| obs-3 | Two-layer IDOR proof: service integration + controller session-scoping test; service-only is insufficient for session-only-userId endpoints | warning | 1st instance | BUILD-PRINCIPLES (or T-8.md) | HOLD — BUILD slot 9 or T-8 slot 3 candidate; promote on 2nd confirming wave |

**Observations emitted: 3 (obs-1, obs-2, obs-3)**
**Severities: 2 warning (obs-1, obs-3), 1 informational (obs-2)**
**Candidate files: BUILD-PRINCIPLES (obs-1 + obs-3), none (obs-2)**
**Promotion-eligible this wave: NONE (obs-1 and obs-3 are first-instance HOLDs; obs-2 is not a new candidate)**
**Dropped: 3-run CI verification (wave-specific caution, absorbed into obs-2); M1 scrubPii
replica (BUILD rule 4 mechanism, narrow, absorbed into SDK-doc note); V-2 empty triage
(gate mechanism working correctly)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave. Both HOLDs are 1st-instance.**

**obs-1** (BUILD-PRINCIPLES rule 9 candidate, warning severity) is the primary new HOLD. The
class is clean and the cost is measurable: an entire wave (wave-36) was consumed solely to
backfill tests that should have been authored in wave-35. The candidate rule is falsifiable
at B-6 Phase 1 (committed test file check per authz boundary in the diff). The promotion
barrier is recurrence: the precise mechanism (ephemeral T-8 only → dedicated backfill wave)
must fire a second time. The P-0 problem-framer explicitly named the promotion criterion
("if it recurs"), making the promotion gate unambiguous. Watch for: any wave that ships an
authz/IDOR/PII-scrub boundary without a committed regression test in the same PR.

Competing BUILD slot-9 candidates (all 1st-instance HOLDs):
  - wave-31 obs-1 (strong): credential-endpoint membership-before-load — highest priority
    by severity; if it confirms before wave-36 obs-1 or obs-3, it takes slot 9.
  - wave-31 obs-4 (warning): ESM-only npm lazy-cached import bridge.
  - wave-32 obs-1 (warning, linter-blocked): enumerated-mock factory staleness.
  - wave-33 obs-3 (informational): clone shipped error-walk helper depth.
  Wave-36 obs-1 and obs-3 (both warning) are at the same severity level as wave-31 obs-4
  and wave-32 obs-1. First-to-confirm takes the slot.

**obs-3** (BUILD-PRINCIPLES rule 9 or T-8.md rule 3 candidate, warning severity) is the
second new HOLD. The class is falsifiable (controller test asserting session-derived userId
for session-only-userId endpoints). The promotion decision on TARGET FILE (BUILD vs T-8.md)
can be deferred to the confirming wave: if the gap recurs and is caught at B-6 Phase 2, the
rule belongs in BUILD; if caught at T-8, it belongs in T-8.md. T-8.md slot 3 is open;
BUILD slot 9 is contested by obs-1 and the prior candidates above.

**Note on wave-35 obs-4 promotion (CI-PRINCIPLES rule 7):**
CI-PRINCIPLES rule 7 is now present in the file ("For a non-git-connected Railway service,
assert a change-unique marker appears in the served bundle after deploy"). The wave-35 obs-4
PROMOTE recommendation has been applied. The competing 1st-instance CI HOLDs (wave-28 obs-1
entropy-scanner, wave-28 obs-2 CI-config-fix) retain slot status as CI-PRINCIPLES slot 8
candidates; neither confirmed this wave.
