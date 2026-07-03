# Wave 38 — L-2 Distill Observations

Synthesized from wave-38 artifacts (M7 avatar storage go-live: presigned-GET redirect for
Tigris private bucket; PR #52 squash-merged 8b590e1; V-block APPROVED first round — V-2
0 blocking findings, V-3 APPROVED). Inputs read:
process/waves/wave-38/stages/P-3-plan.md, stages/B-2-backend.md, stages/B-5-verify.md,
stages/C-1-pr-ci-merge.md, stages/T-2-unit.md, stages/T-4-integration.md,
stages/T-8-security.md, stages/V-2-triage.md, blocks/V/gate-verdict.md.
Prior archives consulted: process/waves/_archive/wave-{35,36,37}/blocks/L/observations.md
(prior-held queue + recurrence checks on all 4 candidate classes).
Principles files read: BUILD-PRINCIPLES (8 rules), CI-PRINCIPLES (7 rules),
PRODUCT-PRINCIPLES (3 rules), T-8.md (2 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      B-5 verify ran typecheck and unit tests but not `biome ci .` (the exact lint command
      CI enforces from the repo root). The B-5 transcript recorded "lint: no api-level lint
      script (root/CI owns lint)" as the documented rationale for skipping it. Three
      deterministic Biome errors on the wave's own new code -- two `lint/performance/noDelete`
      violations in files.controller.spec.ts and one `suppressions/unused` stale suppression
      in files.controller.ts -- slipped to CI (C-1 run 28650289759, lint job FAIL, exit 1)
      and required a fix-up commit (dffef53, fix-up cycle 1 of 5). These errors are not
      caught by typecheck or by a format-only hook; they are enforced exclusively by
      `biome ci .`. BUILD rules 6 and 7 were both violated: rule 6 requires running the
      formatter on all touched files before reporting done; rule 7 requires running the
      lint check command, not the formatter alone. BUILD rule 8 mandates a pre-commit hook
      for "format/import-sort check" -- but the `noDelete` and `suppressions/unused` rules
      Biome enforces under `biome ci .` are lint rules beyond format/import-sort, so rule 8's
      hook scope as described does not cover them. The gap rule 7 leaves open: it states
      "run the lint check command" without specifying that the command must be the exact one
      CI runs from the repo root, not a per-package alias. The rationalization "root/CI owns
      lint" is the proximate cause: the specialist correctly understood that no api-level
      package.json script exists for lint and incorrectly concluded that running lint was
      therefore not a B-5 obligation. The candidate closes that gap: at B-5, run `biome ci .`
      (or whatever the CI lint gate command is) from the repo root, regardless of whether a
      per-package alias exists.
    source:
      - process/waves/wave-38/stages/B-5-verify.md
        # "lint: no api-level lint script (root/CI owns lint)." -- documented rationale for
        #   skipping the lint step at B-5 verify; only typecheck + unit were run
      - process/waves/wave-38/stages/C-1-pr-ci-merge.md
        # "Found 3 errors, 12 warnings, exit 1. All 3 blocking errors are on wave-38-
        #   introduced apps/api/src/files/ code."
        # "Root-cause / process gap: B-5 verify + B-6 review reported green on typecheck +
        #   524 unit, but the local verification lane did not run biome ci ."
        # Fix-up commit dffef53: "2x noDelete in files.controller.spec.ts → = undefined;
        #   stale useImportType suppression removed from files.controller.ts"
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "B-5 omits the repo-root lint command due to the 'root/CI owns
      lint' rationalization; deterministic lint errors reach C-1" class as a standalone L-2
      observation.

      Near-dup check against BUILD rule 6: rule 6 requires running the formatter on all
      touched files before reporting done. B-5 ran neither formatter nor lint. Rule 6 was
      violated, but it addresses formatter only, not the broader lint command. No near-dup
      with this candidate, which targets the lint command specifically.

      Near-dup check against BUILD rule 7: rule 7 requires "Run the lint/import-organizer
      check command, not the formatter alone." The B-5 execution violated rule 7. However,
      rule 7 does not specify WHICH command to run or that it must be the exact CI command
      from the repo root; the wave-38 instance shows the rationalization "no api-level lint
      script" is used to side-step rule 7's obligation. The candidate adds specificity rule 7
      lacks: the command is the one CI enforces, regardless of per-package alias availability.

      Near-dup check against BUILD rule 8: rule 8 mandates "a pre-commit hook running the
      format/import-sort check on staged files." Rule 8's hook scope ("format/import-sort")
      does not cover noDelete or stale-suppression lint rules enforced by `biome ci .`. A
      hook implementing rule 8 as written would NOT have caught these three errors. The
      candidate is therefore additive to rule 8 (broader scope), not a near-dup.

      Near-dup check against CI-PRINCIPLES rule 4 ("Run the formatter check command at the
      wiring stage before commit"): rule 4 targets wiring stage and names "formatter check."
      This candidate targets B-5 stage and names the CI lint command. Different stage and
      broader command scope. Not a near-dup.

      HOLD. First instance. Promote to BUILD-PRINCIPLES (additive to rule 7 or as rule 9)
      on a second confirming wave where B-5 omits the CI lint command and deterministic lint
      errors surface at C-1, OR where an explicit B-5 checklist entry for the repo-root lint
      command prevents the gap.
    promotion_gates:
      generalizable: true
        # Applies at any B-5 stage in a project where CI enforces a lint gate beyond
        # format/import-sort (e.g., Biome lint rules, ESLint with extra plugins). The
        # check: does the B-5 verification lane include running the same lint command the
        # CI job uses, from the same working directory? A B-5 that runs only typecheck +
        # unit + formatter fails this rule if the CI lint gate enforces additional rules.
        # Triggerable: B-5 transcript shows "no X-level lint script" as a documented skip
        # rationale, followed by a C-1 lint job failure on that wave's own code.
      falsifiable: true
        # Checkable at B-5: does the B-5 transcript show the exact CI lint command
        # (e.g., `biome ci .`, `eslint --max-warnings=0`) was run and returned exit 0?
        # A B-5 transcript that shows only tsc + unit without a lint run fails this rule.
        # Alternatively, checkable at C-1: did the first CI run require a lint fix-up
        # cycle for deterministic (non-flake) lint errors on the wave's own new code?
        # A fix-up cycle for deterministic lint errors is evidence B-5 omitted the lint step.
      cited: true
        # B-5-verify.md ("lint: no api-level lint script (root/CI owns lint)" -- documented
        #   skip rationale; typecheck + unit only; no biome ci . run);
        # C-1-pr-ci-merge.md (3 deterministic Biome errors on wave's own code; "local
        #   verification lane did not run biome ci ."; fix-up cycle 1 of 5; dffef53).
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9 or additive sharpen of rule 7]
      At B-5, run the exact lint command the CI gate enforces from the repo root; a missing
      per-package alias is not a valid reason to skip it.
      Why: CI lint rules beyond format-check are only enforced by the repo-root lint command,
      not by formatter or per-package scripts.
      Rule line = 99 chars; why line = 94 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. Promote on second confirming wave where B-5 omits the exact CI
      lint command and deterministic lint errors surface at C-1, OR where an explicit B-5
      checklist entry for the repo-root lint command prevents the gap from reaching CI.


  - id: obs-2
    summary: >
      The P-3 plan probed the live Tigris bucket empirically before committing to the avatar
      render architecture. Four probes against the real endpoint (https://t3.storageapi.dev,
      real bucket studyhall-avatars-ngavql0) established: anonymous GET of a static object
      URL returns 403; PutBucketPolicy returns NotImplemented; per-object x-amz-acl:public-read
      is ignored (still 403 anonymously); presigned GET returns 200. This empirical result
      changed the architectural choice before any B-block code was written: the originally
      assumed static-public-URL approach (resolvePublicUrl) was ruled out and a presigned-GET
      redirect endpoint was chosen instead. Without the probe, the plan would have designed
      against a static-URL assumption that silently fails at C-2 or T-5 (all avatar renders
      return 403 anonymously). The redirect-endpoint architecture was then locked in the plan,
      confirmed at P-4, and built at B-block without rework. The generalizable class: when
      P-3 designs an integration whose feasibility depends on an external service's access
      semantics (public vs private, auth required, policy support), the plan must include an
      empirical probe of those semantics against the live service before committing to the
      architecture. Assumed semantics from docs or S3 API defaults are unreliable for
      cloud-operator-configured settings (bucket policy, ACL, endpoint behavior).
    source:
      - process/waves/wave-38/stages/P-3-plan.md
        # § Architecture deltas: "Empirically determined against the real Tigris bucket...
        #   anonymous GET → HTTP 403; PutBucketPolicy → NotImplemented;
        #   per-object x-amz-acl:public-read → ignored (still 403); Presigned GET → 200."
        # "Chosen approach: serve avatars through a stable, unauthenticated redirect endpoint
        #   that resolves a fresh presigned GET per hit."
        # "Why NOT make the bucket public: empirically impossible via S3 API."
      - process/waves/wave-38/blocks/P/gate-verdict.md
        # P-4 APPROVED: the presigned-GET redirect architecture (derived from the empirical
        #   probe) was confirmed; no REWORK on the data model or approach
    severity: warning
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "P-3 empirically probes a live external service's access semantics
      before choosing an architecture that depends on them" class as a standalone L-2
      observation.

      Near-dup check against PRODUCT rules 1-3: rule 1 addresses verifying P-0 seed claims
      about what exists in the codebase (P-0 stage, code existence check). Rule 2 addresses
      verifying the named cost entity at P-0. Rule 3 addresses building credential-independently
      when a live credential is not yet available. None address P-3 empirical probing of
      external service behavior (bucket policy, access model, endpoint semantics) before
      design commitment. No near-dup.

      Near-dup check against external-sdk-integration-rules.md: that rule governs the
      research process for NEW external SDKs (naming, version, dependency, doc template).
      Wave-38 used an existing SDK (@aws-sdk/client-s3, already installed); the probe was
      about the BUCKET's operator-configured access policy, not the SDK API surface. Different
      axis. No near-dup.

      Note: this is a positive-practice observation. The probe WAS done and the architecture
      was correct. The risk class articulated is the counterfactual: a P-3 that assumes the
      external service is public (or assumes a bucket policy API works) would produce an
      incorrect implementation, discovered only at C-2 or T-5. In wave-38, the probe
      prevented a full B-block rewrite (the redirect-endpoint approach is significantly
      different from a static-URL approach in the controller, service, and data model).

      HOLD. First instance. Promote to PRODUCT-PRINCIPLES rule 4 on second confirming wave
      where an empirical P-3 probe prevents an architecture based on wrong external-service
      assumptions, OR where a P-3 without such a probe produces a wrong architectural choice
      that reaches C-2 or T-5 before the incorrect assumption is discovered.
    promotion_gates:
      generalizable: true
        # Applies at P-3 for any wave integrating with an external storage or API service
        # where the access model (public vs private, auth required, policy support, endpoint
        # behavior) is cloud-operator-configurable rather than fixed by the SDK API contract.
        # The check: does the plan include at least one empirical result from probing the live
        # external service confirming the access model the architecture depends on? A P-3 that
        # states "bucket is public" or "unsigned requests are accepted" from docs alone, without
        # a live probe result, fails this check for configurable external services.
      falsifiable: true
        # Checkable at P-4: does the architecture section include at least one empirical result
        # (HTTP status, API response, error code) from probing the live external service's
        # access model? A plan whose architecture depends on "bucket is public" or "policy X
        # is supported" but cites only SDK docs, not a live probe result, fails this rule when
        # the behavior is operator-configurable. Countercheck: if the service is consumed
        # exactly as documented with no operator-configurable surface, this rule does not apply.
      cited: true
        # P-3-plan.md § Architecture deltas: all four probe results listed (403, NotImplemented,
        #   ACL ignored, presigned 200); architecture choice explicitly derived from probe
        #   results; static-URL approach ruled out by probe evidence, not by inference;
        # P-4 APPROVED: the empirically-grounded architecture passed the gate without REWORK,
        #   confirming the probe-first approach produced a correct design.
    candidate_rule_shape: >
      [target: PRODUCT-PRINCIPLES rule 4]
      When P-3 designs an integration that depends on an external service's access semantics,
      probe the live service empirically before committing to the architecture.
      Why: Operator-configured policies are not reliably predictable from docs; a wrong
      assumption discovered at C-2 costs a full B-block rewrite.
      Rule line = 117 chars; why line = 96 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance (positive-practice observation; counterfactual cost is a full
      B-block rewrite of a wrong static-URL implementation). Promote to PRODUCT-PRINCIPLES
      rule 4 on second confirming wave. Competing rule 4 candidates: wave-35 obs-1 (privacy-
      theater selector, strong severity, 3-wave HOLD), wave-35 obs-2 (spec data vs P-3
      divergence, warning, 3-wave HOLD), wave-33 obs-1 (framework error class in plan,
      warning, 5-wave HOLD). Wave-38 obs-2 (warning) joins the queue. First-to-confirm
      takes the slot per 2nd-instance priority rule.


  - id: obs-3
    summary: >
      The C-1 lint fix-up commit (dffef53) replaced two `delete process.env.PUBLIC_API_URL`
      statements in files.controller.spec.ts with `process.env.PUBLIC_API_URL = undefined`
      to satisfy Biome's `lint/performance/noDelete` rule. This is Biome's own suggested
      fix (the C-1 stage records the errors as "FIXABLE -- Biome suggests = undefined").
      However, Node.js stringifies all values assigned to `process.env` properties; so
      `process.env.X = undefined` does NOT remove the key -- it sets `process.env.X` to
      the string `"undefined"` (truthy). Any subsequent code or test that checks
      `if (process.env.X)` or `process.env.X !== undefined` will behave as if the env var
      IS set. The correct Biome-compliant form for removing a process.env key is
      `Reflect.deleteProperty(process.env, 'KEY')`, which removes the property without
      triggering the `noDelete` lint rule. In wave-38, all 524 unit tests passed after the
      `= undefined` fix, indicating the affected test assertions were not sensitive to the
      string-vs-absent distinction in this wave (most likely because NestJS unit tests
      consume env vars through a mocked ConfigService, not directly via process.env). The
      pattern is therefore latent: the committed teardown code is semantically wrong and
      will silently corrupt absent-env test assertions in any future spec that reads
      process.env directly instead of through a ConfigService mock.
    source:
      - process/waves/wave-38/stages/C-1-pr-ci-merge.md
        # "lint/performance/noDelete — `delete process.env.PUBLIC_API_URL` (FIXABLE --
        #   Biome suggests = undefined)" -- C-1 records Biome's own suggested form
        # "Fix-up cycle 1: node-specialist... dffef53: 2x noDelete in
        #   files.controller.spec.ts → = undefined" -- confirmed that = undefined was applied
        # T-2 evidence: "524 unit tests pass" post-fix -- tests were not sensitive to
        #   stringification in this wave
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Alternative: test-layer-principles/T-2.md (test teardown convention)
    recurrence: >
      1ST INSTANCE of the "`process.env.X = undefined` stringification trap committed to
      test teardown by applying Biome `noDelete`'s suggested fix form" in L-2 history.

      The class is generalizable: the trap fires whenever a test clears a process.env key
      using `= undefined` (or `= null`, which likewise stringifies) and then exercises
      absent-env behavior in the same file or a sibling describe block. The specific trigger
      in this project: Biome's noDelete rule + its "FIXABLE" auto-suggestion actively leads
      builders toward the incorrect form. Any builder or auto-fixer applying the noDelete
      suggestion to test teardown code will commit the stringification trap unless they know
      the Biome-compliant correct form is Reflect.deleteProperty(process.env, 'KEY').

      Near-dup check against BUILD rules 1-8: no existing rule addresses process.env
      teardown semantics in tests. BUILD rule 7 (run the lint check command) covers the
      enforcement mechanism that surfaced the noDelete violation but not the correct fix
      form for env var teardown. No near-dup.

      Near-dup check against T-2.md: T-2.md has no rules addressing env var teardown
      conventions. No near-dup. T-2.md slot 2 is a candidate target if the class is framed
      as a unit-test convention rather than a build convention.

      Severity note: this is a latent risk, not an observed test-logic failure in wave-38.
      The 524 unit tests passed because the spec likely uses NestJS ConfigService mocks
      at the unit level (not direct process.env reads). The risk materializes in a future
      spec that does read process.env directly after a teardown using = undefined.

      HOLD. First instance (latent risk; no observed test false-positive this wave). Promote
      on second confirming wave where the = undefined pattern causes a visible test false-
      positive or false-negative for an absent-env path, OR where an explicit code-review
      note or linter configuration (custom Biome rule or ESLint plugin) prevents the pattern
      from being committed.
    promotion_gates:
      generalizable: true
        # Applies to any test file in a project enforcing Biome noDelete (or any linter
        # that forbids `delete`) where tests clear process.env keys for absent-env code path
        # testing. The check: does any test teardown contain `process.env.X = undefined`
        # (or = null) where the intent is to remove the key and subsequently test absent-env
        # behavior? Grep signal: `process\.env\.\w+ = undefined` or `= null` in test files
        # with afterEach/afterAll/beforeEach/within-test reset.
      falsifiable: true
        # Checkable at B-5 or T-2 code review: for each `process.env.X = undefined` in
        # test teardown, does any subsequent test in the same file check the absent-env
        # code path (e.g., `process.env.X === undefined`, `!process.env.X`, behavior when
        # the service is instantiated without the env var)? If yes, the test has the
        # stringification trap and will pass vacuously. Safe fix form for code review:
        # replace `process.env.X = undefined` with `Reflect.deleteProperty(process.env, 'X')`.
      cited: true
        # C-1-pr-ci-merge.md: noDelete lint error + "FIXABLE -- Biome suggests = undefined"
        #   label; fix-up commit dffef53 applied = undefined form x2 in test teardown;
        # This is a latent-risk observation; the committed pattern is the evidence; no test
        #   failure was observed in wave-38 because of the NestJS ConfigService mock boundary.
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9 or T-2.md new rule]
      To clear a process.env key in test teardown, use Reflect.deleteProperty; assigning
      undefined stringifies to the string "undefined" and leaves the key set and truthy.
      Why: Node.js coerces process.env values to strings; "undefined" fools absent-env
      checks in any direct process.env read after teardown.
      Rule line = 114 chars; why line = 82 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance (latent risk pattern committed; no test-logic failure observed
      this wave). Promote on second confirming wave where = undefined in test teardown causes
      a visible test false-positive or prevents the absent-env code path from being exercised,
      OR where an explicit convention check prevents Reflect.deleteProperty being replaced.


  - id: obs-4
    summary: >
      T-8 FIND-1: the new unauthenticated public endpoint `GET /users/:userId/avatar`
      returns 500 (Internal Server Error) when `:userId` contains a decoded NUL byte
      (`%00`). Root cause: `:userId` is passed to the query layer without UUID validation;
      the NUL byte triggers an uncaught driver-level error before any data is returned.
      Remediation filed as task 7525b759: add ParseUUIDPipe to the route param and return
      400 for malformed ids. T-8 rule 2 (promoted at wave-33) states: "At T-8, probe each
      :id route param with a malformed non-UUID value on the authed path and assert 400,
      not 500." The structural gap in rule 2: its "authed path" scope excludes public
      unauthenticated endpoints. FIND-1 is on a public route where any anonymous caller
      can trigger reliable 500s (no auth gate limits them). The wave-33 fix that closed
      the project-wide 22P02 class was a Drizzle error-walk filter applied to authed
      controller routes; it does not cover this new public controller endpoint added in
      wave-38, nor would any authed-path filter cover a route marked @SkipAuth() on a
      different controller. Every new public unauthenticated endpoint with an :id route
      param inherits the missing-ParseUUIDPipe gap unless it explicitly adds validation.
      The wave-38 T-8 tester did probe the public endpoint with malformed input (Probe 4
      included %00), so the finding was caught -- but this was due to thorough diligence,
      not because T-8 rule 2 mandated probing on the unauthed path. The candidate extends
      rule 2's scope to cover public endpoints, where the attack surface is broader.
    source:
      - process/waves/wave-38/stages/T-8-security.md
        # Probe 4, FIND-1: "`%00` / `a%00b` (decoded NUL byte) → 500 Internal server error"
        # "Remediation: validate :userId with ParseUUIDPipe before DB/storage access;
        #   return 400 for malformed ids."
        # (The endpoint is unauthenticated -- @SkipThrottle was on the original B-2 note,
        #   throttle was added at T-8 follow-up; @SkipAuth marks it public)
      - process/waves/wave-38/stages/V-2-triage.md
        # "F-T8-1 | T-8 | LOW | non-blocking | Task 7525b759 (M7): ParseUUIDPipe on
        #   GET /users/:id/avatar (NUL-byte → 500)."
      - command-center/principles/test-layer-principles/T-8.md
        # Rule 2 (promoted at wave-33): "At T-8, probe each :id route param with a malformed
        #   non-UUID value on the authed path and assert 400, not 500."
        # "authed path" -- this is the scope gap identified in wave-38
      - process/waves/_archive/wave-33/blocks/L/observations.md
        # obs-4: wave-33 is the promotion event for T-8 rule 2; the class was channel-ID
        #   authed-path only; public endpoints were not in scope at promotion time
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-8.md
    recurrence: >
      1ST INSTANCE of the "T-8 rule 2 class (malformed :id param → 500, missing ParseUUIDPipe)
      fires on a PUBLIC unauthenticated endpoint whose :id param lacks format validation;
      T-8 rule 2's 'authed path' scope excludes it from the mandatory probe" as a distinct
      observation class after rule 2's promotion.

      Lineage:
      - wave-32 (1st isolation of class): T-8 caught non-UUID channelId → 500 on authed
        voice path. Held as T-8 rule 2 candidate.
      - wave-33 (promotion event): Drizzle error-walk fix closed the 22P02 class on authed
        channelId routes; obs-4 promoted to T-8 rule 2. Rule 2 text specifies "authed path."
      - wave-38 (this wave): same structural gap on a NEW public/unauthenticated endpoint
        (GET /users/:userId/avatar), introduced in this wave without ParseUUIDPipe. T-8
        found it via Probe 4 (%00 input) -- due to thorough tester diligence, not rule 2
        obligation. Rule 2's "authed path" language does not mandate probing public endpoints.

      This is the first instance of the PUBLIC-ENDPOINT extension of T-8 rule 2's scope.
      The candidate would amend rule 2 to cover both authed AND public unauthed :id params.

      Near-dup check against T-8 rule 2 as written: rule 2 IS the closest existing rule but
      its "authed path" language is the scope gap. This observation is a scope extension, not
      a new class. The candidate form is a rule 2 amendment (add "authed or public" to scope)
      or a new rule 3.

      Near-dup check against T-8 rule 1 ("Live-probe the authz path against prod with a
      verified prod fixture"): rule 1 targets authz gate verification (401/403 without auth).
      This candidate targets input format validation on :id params of public endpoints.
      Different probe class. No near-dup.

      Public-endpoint severity argument: anonymous callers can trigger the 500 reliably (no
      auth overhead), making the exposure broader than the authed-path class. The finding is
      non-exploitable for data leak (generic 500 body) but is a reliable DoS/log-noise surface
      for any anonymous actor. This is a stronger argument for the probe obligation on public
      endpoints than on authed ones.

      HOLD. First instance of the public-endpoint extension. Promote T-8 rule 2 amendment
      (or rule 3) on second confirming wave where T-8 catches a malformed-param 500 on a
      public unauthenticated endpoint with an :id param, OR where an explicit T-8 checklist
      item for public endpoints prevents the gap from shipping without a ParseUUIDPipe.
    promotion_gates:
      generalizable: true
        # Applies at T-8 for any wave introducing a public unauthenticated endpoint with a
        # route param expected to be a UUID (or typed format). The probe: send a malformed
        # value (non-UUID string, NUL byte, embedded null) on the public path and assert 400
        # (not 500). Anonymous callers reach this path with no auth overhead; exposure is
        # therefore broader than the authed-path class. Grep signal: handler annotated with
        # @SkipAuth() or equivalent + route param destructured without ParseUUIDPipe in the
        # controller method signature.
      falsifiable: true
        # Checkable at T-8: does the probe matrix include at least one malformed-param case
        # per :id route param on new public endpoints (not only authed ones)? A T-8 that
        # probes malformed params on authed paths only, while leaving new public endpoints
        # unprobed for malformed input, fails this rule extension for those endpoints.
        # Rule 2 check: does the T-8 artifact show a probe for the unauthenticated path
        # with a malformed :id value and assert 400? If the probe is absent for a public
        # endpoint, the rule extension is not satisfied.
      cited: true
        # T-8-security.md FIND-1: %00 NUL byte → 500 on public GET /users/:userId/avatar;
        #   root cause: missing ParseUUIDPipe; remediation: validate before DB access;
        # V-2-triage.md F-T8-1: LOW non-blocking, task 7525b759 filed;
        # T-8.md rule 2: "authed path" language confirmed as the scope gap (rule 2 text
        #   cited verbatim above; public endpoints are outside its current scope).
    candidate_rule_shape: >
      [target: T-8.md rule 2 amendment]
      Amend T-8 rule 2 to read: "probe each :id route param with a malformed non-UUID value
      on every path (authed and public) and assert 400, not 500."
      Amended why: An unvalidated :id param on a public route is reachable by any anonymous
      caller, making reliable 500s a reliable DoS surface with no auth friction.
      Rule line = 103 chars; why line = 96 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance of the public-endpoint scope extension of T-8 rule 2. Promote the
      rule 2 amendment on second confirming wave where a new public endpoint's :id param ships
      without ParseUUIDPipe and T-8 catches a malformed-param 500 on the public path.
```

---

## Prior held observations — second-instance status (wave-31 through wave-37)

| origin | obs | class | wave-38 status |
|--------|-----|-------|----------------|
| wave-37 | obs-2 | HTTP verb mismatch (client POST vs controller @Patch) passes service-layer tests; controller route-metadata assertion catches it at CI | NOT CONFIRMED. No new controller routes with a verb mismatch between frontend client and controller decorator. Remains 1-wave HOLD (CI-PRINCIPLES or T-2.md candidate). |
| wave-37 | obs-3 | Bootstrap-once list + live-count-only hook leaves list surface stale on reopen | NOT CONFIRMED. Wave-38 is backend-only (zero frontend changes). Remains 1-wave HOLD (BUILD-PRINCIPLES or T-2.md candidate). |
| wave-36 | obs-1 | Security-boundary authz/IDOR tests deferred to follow-up wave; no committed artifact in shipping wave | NOT CONFIRMED. Wave-38 shipped the integration test (avatar-render.spec.ts) inline in the same wave as the endpoint; no dedicated backfill wave required. Remains 2-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-36 | obs-3 | Two-layer IDOR proof: service integration + controller session-scoping test for session-only-userId endpoints | NOT CONFIRMED. The new public avatar endpoint is public by design (not session-scoped); confirm endpoint checks own-prefix before DB access (ownership gate, not session-scope IDOR class). Remains 2-wave HOLD (BUILD-PRINCIPLES or T-8.md candidate). |
| wave-35 | obs-1 | Identical-behavior privacy options = privacy-theater; honest selector collapses them | NOT CONFIRMED. No settings selector authored. Remains 3-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-35 | obs-2 | Spec data: contract diverges from P-3 architecture decision; P-4 REWORK required | NOT CONFIRMED. P-4 APPROVED on first attempt; no data model divergence between spec and plan. Remains 3-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-34 | obs-2 | D-3 gate checked brief states but not brief interactions; named entry control omitted from mockup | NOT CONFIRMED. design_gap_flag=false; no D-block. Remains 4-wave HOLD (DESIGN-PRINCIPLES / D-3 rubric candidate). |
| wave-33 | obs-1 | Plan names a framework-specific error class absent from the actual stack | NOT CONFIRMED. No framework error class naming in P-3 plan. Remains 5-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-33 | obs-2 | Error-mapping fix must fire against a real upstream error from the actual code path | NOT CONFIRMED. No error-mapping fix cycle this wave. Remains 5-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-33 | obs-3 | Clone the shipped error-walk helper depth for new error codes on the same stack | NOT CONFIRMED. No new pg error-code mapping authored. Remains 5-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-32 | obs-1 | Wiring new api method into existing component invalidates explicit-enumeration mock factory | NOT CONFIRMED. Wave-38 is backend-only; no frontend wiring into existing components (zero api.ts changes). Remains linter-blocked HOLD (BUILD-PRINCIPLES slot 9 candidate). |
| wave-32 | obs-3 | Typed api-client method added but consumer fetches inline in parallel | NOT CONFIRMED. No frontend changes. Remains 6-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-31 | obs-1 | Credential-endpoint gate: membership check before loading or branching on resource | NOT CONFIRMED. Confirm endpoint checks own-prefix (key.startsWith('avatars/${userId}/')) before any DB/storage call -- this is an IDOR ownership check, not the credential-issuing membership-before-load class. Remains 7-wave HOLD (BUILD-PRINCIPLES rule 9 candidate, strong). |
| wave-31 | obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() bridge | NOT CONFIRMED. No new ESM-only dependency added. Remains 7-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code ?? default | NOT CONFIRMED. No nullable-FK exclusion query authored. Remains 8-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED. No cron or background job with external side effect. Remains 8-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED. V-2 non-blocking findings were routed to tasks + noise; no accept+track+observe disposition. Remains 8-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | NOT CONFIRMED. No operator-fix ambiguity in P-3 plan. Remains 9-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites catches reviewer-missed occurrence | NOT CONFIRMED. V-3 had no fast-fix queue (no blocking findings from V-2). Remains 9-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED. Wave-38 is a valid M7 feature wave; no override-ship. Remains 9-wave HOLD (PRODUCT-PRINCIPLES candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED. gitleaks PASS at C-1 (clean, exit 0). Remains 10-wave HOLD (CI-PRINCIPLES candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED. No CI-config fix cycle. Remains 10-wave HOLD (CI-PRINCIPLES candidate). |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED. No EXPLAIN-based integration test. Remains 11-wave HOLD (T-4 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED. Not a performance wave. Remains 11-wave HOLD (T-7 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 caught it | NOT CONFIRMED. No store-keyed unit fixture. Remains 12-wave HOLD (T-2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED. No date-dependent test fixture introduced. Remains 12-wave HOLD (T-2 candidate). |

---

## Signals evaluated and dropped

**Signal: FIND-2 (confirm 500 on own-scoped never-uploaded key) as L-2 candidate:**
FIND-2 is a LOW, own-scoped, non-exploitable edge case: a user who confirms an avatar key
for an object that was never uploaded gets a 500 instead of an actionable 404/400. The
cross-user confirm rejection (Probe 2) already gates cross-user access; FIND-2 is a
graceful-degradation gap on a legitimate but incomplete single-user workflow. The fix
(catch missing-object and return 404/400) is correct spec-completion work, bundled with
F-T8-1 in task 7525b759. This is narrower than a principle and specific to the
storage-confirm/missing-object pattern. No generalizable gap beyond the existing BUILD
rule 4 adversarial negative-path obligation. DROPPED as wave-specific correction.

**Signal: K-C2-overclaim (C-2 "404-not-503 proves storage-live" false reasoning) as process signal:**
Karen identified that C-2's inline reasoning ("404-not-503 proves storage configured") was
a false proof: the 404 fires in users.controller.ts before resolveAvatarUrl runs, so the
503 branch is structurally unreachable for a no-avatar user and the 404 cannot prove the
storage path was exercised. V-2 correctly classified this as a doc-text nit (noise); the
underlying storage-live proof was independently established by jenny's live round-trip at
V-1 and by T-5 end-to-end results. This is a reasoning-quality nit on a stage artifact, not
a generalizable principle class. The interesting mechanism (redirect endpoint creates a path
where the 404 fires before the storage call) is specific to the redirect-endpoint pattern.
DROPPED as wave-specific doc-text correction, correctly handled inline.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | B-5 omits repo-root lint command; "root/CI owns lint" rationalization; 3 deterministic Biome errors reach CI (fix-up cycle 1) | warning | 1st instance | BUILD-PRINCIPLES | HOLD — rule 9 or rule 7 sharpen candidate; promote on 2nd confirming wave |
| obs-2 | P-3 empirically probed live Tigris bucket before committing to presigned-GET redirect architecture; probe prevented wrong static-URL implementation | warning | 1st instance | PRODUCT-PRINCIPLES | HOLD — rule 4 candidate; promote on 2nd confirming wave |
| obs-3 | `process.env.X = undefined` (Biome noDelete suggested fix) stringifies to the string "undefined" (truthy), not absent; correct form is Reflect.deleteProperty | warning | 1st instance | BUILD-PRINCIPLES (or T-2.md) | HOLD — rule 9 / T-2 candidate; latent risk, no observed test failure this wave |
| obs-4 | T-8 FIND-1: new public unauthenticated endpoint `:userId` returns 500 on NUL-byte; T-8 rule 2's "authed path" scope excludes public endpoints from the probe obligation | warning | 1st instance (public-endpoint extension of T-8 rule 2) | T-8.md | HOLD — rule 2 amendment candidate; promote on 2nd confirming wave |

**Observations emitted: 4 (obs-1, obs-2, obs-3, obs-4)**
**Severities: 4 warning (obs-1, obs-2, obs-3, obs-4)**
**Candidate files: BUILD-PRINCIPLES (obs-1, obs-3), PRODUCT-PRINCIPLES (obs-2), T-8.md (obs-4)**
**Promotion-eligible this wave: NONE (all first-instance HOLDs)**
**Dropped: FIND-2 confirm-missing-object (wave-specific correction, BUILD rule 4 territory);
K-C2-overclaim (doc-text nit, wave-specific reasoning error on redirect-endpoint artifact)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave. All four are first-instance HOLDs.**

**obs-1** (BUILD-PRINCIPLES rule 9 / rule 7 sharpen candidate, warning) is the process-quality
hold with a direct cost: 1 fix-up cycle (dffef53) was required to close CI. The rule gap is
specific: BUILD rule 7 says "run the lint check command" but does not specify the command must
be the exact one CI runs from the repo root; rule 8's hook scope ("format/import-sort") does
not cover broader Biome lint rules. The candidate rule is falsifiable at B-5 (did the B-5
transcript show `biome ci .` or equivalent ran?) and at C-1 (was a lint fix-up cycle required
for deterministic errors on the wave's own code?). Watch for: any wave whose B-5 transcript
documents "no X-level lint script" as a lint-skip rationale, followed by a C-1 lint failure.

**obs-2** (PRODUCT-PRINCIPLES rule 4 candidate, warning) is a positive-practice hold. The
probe was done correctly and the architecture was right. The counterfactual cost (full B-block
rewrite of a wrong static-URL implementation) is the argument for the rule. The rule is
falsifiable at P-4 (does the architecture section include an empirical probe result for any
external service access semantic the design depends on?). Competing rule 4 candidates by hold
age: wave-33 obs-1 (5-wave), wave-35 obs-1 (3-wave, strong severity), wave-35 obs-2 (3-wave).
obs-2 joins as a 1-wave HOLD. First-to-confirm takes the slot.

**obs-3** (BUILD-PRINCIPLES rule 9 or T-2.md candidate, warning) is a latent-risk hold.
The stringification trap is real (Node.js process.env coercion is documented behavior) but was
not observed to cause a test failure in wave-38. The risk materializes in a future spec that
reads process.env directly (not via ConfigService mock) after a teardown using `= undefined`.
The candidate rule (Reflect.deleteProperty for env var teardown) is falsifiable by grep.
Watch for: `process\.env\.\w+ = undefined` in afterEach/afterAll teardown in any test file,
especially in files added under the Biome noDelete rule's enforcement pressure.

**obs-4** (T-8.md rule 2 amendment candidate, warning) is the most actionable hold: T-8
rule 2 exists and is correct for authed paths but its "authed path" scope is the documented
gap. The wave-38 FIND-1 is the first post-promotion instance on a public path. The amendment
is narrow (change "authed path" to "authed or public path") and the rule remains falsifiable.
Watch for: any T-8 on a wave that adds a public unauthed endpoint with an :id route param,
where the probe set covers authed paths only and leaves the public endpoint unprobed for
malformed input.

**Competing BUILD-PRINCIPLES slot 9 candidates (obs-1 and obs-3 join the queue):**
All first-instance HOLDs for slot 9:
  - wave-31 obs-1 (strong): credential-endpoint membership-before-load -- highest priority
    by severity and age; takes the slot if it confirms before any warning-severity candidate.
  - wave-36 obs-1 (warning): security-boundary authz tests deferred to follow-up wave.
  - wave-36 obs-3 (warning): two-layer IDOR proof for session-only-userId endpoints.
  - wave-37 obs-3 (warning): bootstrap-once list + live-count-only hook stale on reopen.
  - wave-38 obs-1 (warning): B-5 omits repo-root lint command (joins queue this wave).
  - wave-38 obs-3 (warning): process.env = undefined stringification trap (joins queue).
  - wave-32 obs-1 (warning, linter-blocked): enumerated-mock factory staleness.
  - wave-32 obs-3 (informational): typed api-client method vs inline consumer.
  - wave-33 obs-3 (informational): clone shipped error-walk helper depth.
  First-to-confirm takes the slot.
