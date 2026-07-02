# Wave 33 — L-2 Distill Observations

Synthesized from wave-33 artifacts (M6 hardening: malformed-UUID route param -> 400 via
Drizzle+node-postgres `.cause.code` walk; PR#46 e1a64f6; V APPROVED first attempt,
P-4 REWORK on attempt 1).
Prior archives consulted: process/waves/_archive/wave-{29,30,31,32}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (8 rules, rule 9 candidate from w32 obs-1 blocked
by linter), VERIFY-PRINCIPLES (2 rules, rule 2 promoted w31), PRODUCT-PRINCIPLES (3 rules,
rule 3 promoted w32).

---

```yaml
observations:

  - id: obs-1
    summary: >
      P-3 planned `@Catch(QueryFailedError)` (a TypeORM class) on a Drizzle+node-postgres
      stack. TypeORM is absent from this project's package.json entirely; the class would
      never import or match, so the filter would silently never fire — a fix that reads
      correct but leaves the bug live in production. Head-product (karen) caught this at
      P-4 attempt-1 by reading package.json and the existing filter source directly
      (drizzle-orm ^0.45.2 + pg ^8.22.0; zero typeorm). The plan's error-class name
      was copied from TypeORM documentation rather than from the actual stack in use.
      The fix was to walk the Drizzle-wrapped error's `.cause.code` field (the real
      pg driver error lives one or two levels deep), mirroring the existing shipped
      `isUniqueViolation` (23505) helper at users.service.ts:23-38 which already
      encodes the correct shape for this stack. The generalizable class: when a plan
      names a framework-specific class for error interception (QueryFailedError,
      TypeORMError, SequelizeDatabaseError), a reviewer must verify the named class
      exists on the ACTUAL stack before the plan is build-ready. A plan that compiles
      silently and produces no runtime match is harder to catch than one that fails at
      import time.
    source:
      - process/waves/wave-33/blocks/P/gate-verdict.md
        # Attempt 1 REWORK: "QueryFailedError is a TypeORM class and this stack is
        #   Drizzle+node-postgres (no TypeORM), so the filter as specified would
        #   silently never fire and ship a fix that does not fix the bug."
        # Karen claim 5: "package.json = drizzle-orm ^0.45.2 + pg ^8.22.0; zero
        #   TypeORM. QueryFailedError does not exist in this project."
      - process/waves/wave-33/stages/P-3-plan.md
        # "CRITICAL error-shape correction (P-4 REWORK, karen-verified): stack is
        #   Drizzle + node-postgres, NOT TypeORM. Do NOT use @Catch(QueryFailedError)
        #   (TypeORM class — never fires here)."
      - process/waves/wave-33/stages/V-1-karen.md
        # "git grep -E 'QueryFailedError|typeorm|@Catch(QueryFailedError' e1a64f6 --
        #   apps/api -> NONE FOUND. The reverted attempt-1 TypeORM @Catch(QueryFailedError)
        #   decorator leaves zero residue."
    severity: warning
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "plan names a framework-specific error class absent from the
      actual stack; gate catches it before build" class in L-2 history.

      The class is generalizable: applies at any P-3 that proposes error interception
      using a named exception class from a framework (TypeORM, Sequelize, Mongoose,
      Prisma, etc.) when the project's stack may differ. The check is deterministic:
      grep package.json for the framework before naming its exception class in the plan.
      A plan that names a class from an absent framework produces a filter that compiles
      (if the import resolves via a transitive dep or is duck-typed) or fails silently
      (if the class is absent entirely), neither of which is caught by typecheck alone.

      Near-dup check against PRODUCT rule 1 ("Verify every seed claim at P-0"):
      rule 1 targets P-0 code verification of seed premises. This candidate targets
      P-3 plan precision for error-interception class names — a different stage and
      a narrower, more specific verification axis (framework class presence, not general
      code existence). No near-dup.

      Near-dup check against wave-29 obs-1 (operator-fix plan must lock expression
      form + exclude wrong candidates, PRODUCT-PRINCIPLES rule 3 candidate, 4-wave HOLD):
      wave-29 obs-1 addresses ambiguous operator-fix shorthand in P-3 prose. This candidate
      addresses a factually wrong API class name. Different defect class (ambiguity vs
      factual error), different fix (lock form vs verify package presence). No near-dup.

      PRODUCT-PRINCIPLES has 3 rules (rule 3 promoted w32); slot 4 open. HOLD.
      Promote to PRODUCT-PRINCIPLES rule 4 on second confirming wave where a plan
      names a framework-specific error class or API absent from the stack, and the
      gate (or a shipped defect) catches it.
    promotion_gates:
      generalizable: true
        # Applies at any P-3 that specifies an error interception class, decorator,
        # or framework-specific API (catch filter, ORM error class, middleware type)
        # by name. The check: does the named class exist in this project's package.json?
        # "Exists transitively" is insufficient — the plan must name a class that is
        # (a) in the direct deps and (b) actually exported by the installed version.
        # Common failure modes: TypeORM class on a Drizzle stack, Prisma error on a
        # Knex stack, SequelizeError on a raw pg stack.
      falsifiable: true
        # Checkable at P-3 for any error-interception plan: does the plan's named
        # exception class have a matching entry in package.json (dependencies or
        # devDependencies), and is the class exported by that package at the version
        # installed? A plan that names @Catch(QueryFailedError) fails this rule if
        # typeorm is absent from package.json. A plan that names the class from a
        # package present in package.json but at a version that removed the export
        # also fails this rule.
      cited: true
        # P/gate-verdict.md attempt 1 REWORK (karen claim 5: drizzle-orm ^0.45.2 +
        #   pg ^8.22.0; zero typeorm; QueryFailedError does not exist; filter never fires);
        # P-3-plan.md post-REWORK (drops QueryFailedError; .cause.code walk mandated);
        # V-1-karen.md (git grep confirms zero TypeORM residue in shipped code @e1a64f6).
    candidate_rule_shape: >
      4. When a plan names a framework's exception class for error interception, verify
         that framework is in package.json before the plan is build-ready.
         Why: A class from an absent framework compiles or duck-types but never matches
         at runtime, leaving the bug live with no error at the gate.
    promotion_status: HOLD. First instance. Promote to PRODUCT-PRINCIPLES rule 4 on second
      confirming wave where a plan names a framework-specific error class absent from the stack.


  - id: obs-2
    summary: >
      The shipped fix for an error-mapping / exception-interception defect was proven
      to fire against a REAL instance of the target error, not merely against a
      hand-crafted mock object. The integration test suite produced genuine Postgres
      22P02 errors (from `canViewChannelById("junk")` → `RbacService` → Drizzle →
      pg driver) at 41-47ms real-DB timings. This is the load-bearing proof that the
      filter's dispatch predicate actually fires on the production error shape, not a
      synthetic approximation. The V-3 head-verifier and B-2 note both record that
      the attempt-1 defect (a `@Catch(QueryFailedError)` filter) would have passed a
      unit test that constructed a mock error object — the mock would have matched the
      mock, not the real Drizzle-wrapped error. Only a real-DB integration test that
      exercises the actual Drizzle+pg call path could prove the fix fires on the
      production error shape. This is the 1st instance of this class being explicitly
      documented; it was flagged by the head-verifier at V-3 as a candidate L-2
      observation.
    source:
      - process/waves/wave-33/stages/V-3-fast-fix.md
        # "Fix genuinely fires (attempt-1-defect lesson): Zero TypeORM/QueryFailedError
        #   residue @e1a64f6; shipped filter dispatches on isInvalidTextRepresentation
        #   (SQLSTATE 22P02 via .cause walk = correct Drizzle shape). CI integration
        #   Part A yields a REAL Postgres 22P02 at 41-47ms real-DB timings (not stubbed),
        #   Part B maps it -> HTTP 400. End-to-end, not asserted."
        # "For any error-mapping / interception fix, a 'tests green' signal is
        #   insufficient — the mapping must be proven to FIRE against a REAL instance
        #   of the target error."
      - process/waves/wave-33/blocks/V/gate-verdict.md
        # "the fix GENUINELY FIRES end-to-end: CI integration Part A produces a REAL
        #   Postgres 22P02 from canViewChannelById('junk') at 41-47ms real-DB timings
        #   (not stubbed ~0ms), Part B maps that real error -> HTTP 400 with a clean body.
        #   This is proven, not asserted."
      - process/waves/wave-33/blocks/P/gate-verdict.md
        # Phase 2 jenny carry note: "T-8 must EXECUTE the 22P02 branch against a real
        #   test DB (integration proof, not unit-simulated) — per P-3-plan.md."
    severity: warning
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "error-mapping fix must be proven to fire against a REAL error
      instance from the target code path, not a unit-simulated mock" class in L-2 history.

      The class is generalizable: applies at any V-block (or T-4/T-8 stage) where the
      wave fixes an error-interception, error-mapping, or exception-filter defect. The
      verification obligation is: at least one test case must exercise the actual code
      path that produces the target error (a real DB call, a real HTTP client, a real
      network failure) so the error arrives in its real wrapped shape, not a hand-built
      approximation. A unit test that constructs `new ErrorClass({ code: '22P02' })` does
      NOT satisfy this obligation — it proves the predicate matches the mock, not the
      real runtime error.

      Near-dup check against VERIFY rule 1 ("Verify seeding ACs by inspecting create-path
      source, not runtime behavior"): rule 1 targets V-1 AC verification methodology
      for seed behavior. This candidate targets the verification test type for
      error-interception fixes (real error vs mock error). Different axis, different fix
      class. No near-dup.

      Near-dup check against VERIFY rule 2 ("When deployed behavior diverges from a spec
      AC and is more correct, amend the spec to match, not the code"): rule 2 targets
      V-2 triage classification of spec-divergence findings. This candidate targets the
      test coverage requirement for error-mapping fixes. Completely different axis.
      No near-dup.

      Near-dup check against BUILD rule 4 ("Reproduce one negative path per authz or
      injection boundary at B-6 Phase 2"): rule 4 requires adversarial reproduction of
      a NEGATIVE path at authz and injection surfaces. This candidate is specifically
      about error-interception fixes, where the proof obligation is not just "does the
      path exist" but "does the fix's dispatch predicate fire on the real wrapped error
      shape." Closer than other candidates, but the axis is distinct: rule 4 is about
      path-existence adversarial reproduction; this candidate is about error-shape fidelity
      in the tests that verify the fix works. No near-dup, but related.

      VERIFY-PRINCIPLES has 2 rules; slot 3 open. HOLD.
      Promote to VERIFY-PRINCIPLES rule 3 on second confirming wave where an
      error-mapping fix is verified by a real-code-path test (confirming the class is
      valuable) or is incorrectly verified by a mock-only test that misses the production
      error shape (confirming the failure mode).
    promotion_gates:
      generalizable: true
        # Applies at V-block (or T-4 integration, T-8 security probe) for any wave
        # that fixes an error-interception path: exception filter, catch block, error
        # handler, circuit breaker. The check: does at least one test in the wave
        # exercise the actual upstream code path that generates the target error (real DB
        # call, real HTTP call, real socket error) and confirm the fix catches and maps it
        # correctly? A suite of unit tests that constructs the error object synthetically
        # but has no integration test exercising the real upstream path fails this rule
        # for error-mapping fixes.
      falsifiable: true
        # Checkable at V-1 karen or V-3 head-verifier: for any wave fixing an error
        # interception path, does the test evidence include at least one timing or log
        # marker that proves the test exercised a REAL upstream error (e.g., real-DB
        # timings > ~5ms vs ~0ms for a stub, a real log line from the driver, a real
        # HTTP response code from a live call)? A CI log showing ~0ms "integration" tests
        # for an error-mapping fix fails this rule (stub timings indicate the error was
        # synthesized, not produced by the real upstream).
      cited: true
        # V-3-fast-fix.md (REAL Postgres 22P02 at 41-47ms = genuine DB round-trip;
        #   "tests green is insufficient — must fire against a REAL instance");
        # V/gate-verdict.md (re-verified: 41-47ms timing proves not stubbed; "proven,
        #   not asserted");
        # P/gate-verdict.md Phase 2 jenny carry (T-8 must run 22P02 against real test DB,
        #   not unit-simulated — explicitly required at gate).
    candidate_rule_shape: >
      3. For an error-mapping fix, prove the dispatch predicate fires against a real
         upstream error from the actual code path, not a unit-constructed mock object.
         Why: A mock error matches the mock shape; only a real call path produces the
         actual wrapped error the fix must catch at runtime.
    promotion_status: HOLD. First instance. Promote to VERIFY-PRINCIPLES rule 3 on second
      confirming wave where an error-mapping fix is verified (or misverified) with the
      real vs mock error path distinction.


  - id: obs-3
    summary: >
      The corrected fix pattern (`.cause.code` walk for Drizzle-wrapped pg errors) was
      not invented for this wave. It was already shipped and verified in production at
      `apps/api/src/users/users.service.ts:23-38` as the `isUniqueViolation` (23505)
      helper, which walks `err.code` / `err.cause.code` / `err.cause.cause.code` for the
      same Drizzle-wrapped pg error shape. The plan post-REWORK explicitly mandated
      mirroring that helper (a structural clone for `'22P02'` instead of `'23505'`).
      The V-1 karen claim 2 independently confirmed both helpers are structurally identical
      at `e1a64f6`. This is the concrete mechanism by which the shipped pattern prevented
      re-inventing a solution to a known problem: the plan cited the existing helper as the
      model, the builder cloned the shape, and the integration tests confirmed the same
      error-walk applies. The generalizable class: when a new error-code mapping is needed
      on the same stack, the plan should cite the existing shipped error-walk helper as the
      model rather than designing a new catch predicate from scratch.
    source:
      - process/waves/wave-33/stages/P-3-plan.md
        # "Add an isInvalidTextRepresentation(err) helper (mirror users.service.ts:23-38
        #   isUniqueViolation: walk err.code -> err.cause.code -> err.cause.cause.code
        #   for '22P02')."
      - process/waves/wave-33/blocks/P/gate-verdict.md
        # Attempt 2 item 1: "pg-error-utils.ts:isInvalidTextRepresentation walks
        #   e.code === '22P02' -> e.cause.code -> e.cause.cause.code, each typeof guarded.
        #   Structurally identical to the shipped isUniqueViolation (23505) at
        #   users.service.ts:23-38 — confirmed by reading both objects at e1a64f6."
      - process/waves/wave-33/stages/V-1-karen.md
        # Claim 2: ".cause.code walk is real + correct; zero TypeORM survives. HOLDS.
        #   pg-error-utils.ts:isInvalidTextRepresentation walks e.code === '22P02' ->
        #   e.cause.code -> e.cause.cause.code. Structurally identical to the shipped
        #   isUniqueViolation (23505) at users.service.ts:23-38."
    severity: informational
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "reuse the shipped error-walk helper as a structural clone
      for new error codes on the same stack" class as a standalone L-2 observation.

      The class is generalizable: applies at any B-block where a new error-code mapping
      is needed on a stack that already has a shipped error-walk helper for a different
      code. The pattern: identify the existing helper, confirm its error-walk depth and
      guard conditions, clone the structure for the new code. This is more reliable than
      designing a new predicate from scratch because (a) the existing helper has been
      integration-proven on the real stack, (b) the error-wrap depth is already known
      from production use, and (c) the structural clone inherits the guard conditions
      (typeof, null check) that prevent false negatives on partially-wrapped errors.

      Near-dup check against BUILD rules 1-8: no existing rule addresses the obligation
      to clone a shipped error-walk helper for new error codes. BUILD rule 3 (backfill
      seeds must also appear in the create transaction) is about data consistency; BUILD
      rule 4 (adversarial reproduction at B-6) is about test methodology. Different axes.
      No near-dup.

      HOLD. Promote to BUILD-PRINCIPLES on second confirming wave where a new error-code
      mapping on the same stack is implemented by cloning the existing shipped helper
      (correctly reusing the proven error-walk depth), OR where a new error-code mapping
      is implemented by designing a new predicate from scratch (and the error-wrap depth
      is wrong or the guards are missing).

      Note: this observation is informational because the pattern worked correctly this
      wave with no gate failure on this axis — the value is in the pattern being named
      so future builders cite the existing helper deliberately. A second instance (either
      confirming the reuse pattern or catching a from-scratch predicate that gets the
      depth wrong) would justify promotion.

      Per-file promotion cap: wave-32 obs-1 (enumerated-mock staleness, BUILD slot 9
      candidate) was blocked at linter. If it re-fires as a new observation in a future
      wave, it competes with this obs for the BUILD-PRINCIPLES slot at that wave. This
      obs-3 is informational; wave-32 obs-1 is warning — wave-32 obs-1 takes priority
      if both confirm simultaneously.
    promotion_gates:
      generalizable: true
        # Applies to any B-block on a stack that wraps driver errors (Drizzle, Prisma,
        # Sequelize, any ORM with a layered error shape) when a new error code needs
        # an interception predicate. The check: does an existing shipped helper already
        # encode the error-wrap depth for this stack? If yes, the new predicate should
        # clone the same depth and guards. Grep signal: look for existing isX(err) or
        # isXError(err) helpers in the codebase that walk .cause chains and check pg
        # error codes; use the deepest confirmed walk depth as the baseline.
      falsifiable: true
        # Checkable at B-2 or B-6 Phase 1 for any wave adding a new pg-error-code
        # interception predicate: does the new predicate walk to the same depth as the
        # nearest existing shipped helper for the same stack? A new predicate that only
        # checks err.code (not err.cause.code) on a Drizzle+pg stack fails this rule
        # if the existing isUniqueViolation walks to err.cause.cause.code. The linter
        # signal: a single-level walk in a new predicate when a multi-level walk exists
        # for the same stack.
      cited: true
        # P-3-plan.md post-REWORK (explicitly mandates mirroring users.service.ts:23-38
        #   isUniqueViolation; structural clone for '22P02');
        # P/gate-verdict.md attempt-2 item 1 (structural identity confirmed; both walk
        #   confirmed at e1a64f6; correct walk depth verified);
        # V-1-karen.md claim 2 (structural identity verified independently; zero TypeORM
        #   in shipped code; walk depth confirmed real).
    candidate_rule_shape: >
      9. When adding a new pg-error-code mapping, clone the depth and guards from the
         nearest shipped error-walk helper for the same stack.
         Why: The existing helper's walk depth is integration-proven; a shallower predicate
         misses errors wrapped by the ORM layer.
    promotion_status: HOLD. First instance as standalone observation. Promote to BUILD-PRINCIPLES
      on second confirming wave where error-walk depth reuse is applied or missed.


  - id: obs-4
    summary: >
      Wave-32 obs-2 held "probe each new :id route param with a malformed value on the
      authed path and assert 400; a 500 indicates missing ParseUUIDPipe" as a T-8
      rule 2 candidate (1st isolation). Wave-33 is the wave that fixes the exact defect
      T-8 caught at wave-32: a non-UUID channelId returns 500 on authed paths project-wide.
      The fix was scoped by the P-block to a root-cause global mechanism (22P02->400 via
      the Drizzle error-walk), not per-param ParseUUIDPipe annotations, but the T-8 probe
      class (malformed :id param -> expect 400, not 500) is the same one wave-32 obs-2
      described. This wave's V-block re-ran the T-8 matrix (authed malformed -> 401 guard-
      first in live prod; CI integration -> 400 post-auth). The combined picture across
      wave-32 T-8 (finding: malformed -> 500) and wave-33 T-8 (verification: malformed ->
      400 fix confirmed live) constitutes a second T-8 probe-class event for this axis.
      Wave-32 obs-2's promotion condition was "second confirming wave where a T-8
      malformed-param probe catches a 500 on an :id-pattern route param, or where a wave
      explicitly requires the probe and prevents the gap from shipping." Wave-33 is the
      wave that explicitly requires the probe (V-block mandated T-8 confirm the 22P02
      branch ran against real DB) and the wave that prevents the gap from compounding.
      This is the 2nd confirming event for wave-32 obs-2.
    source:
      - process/waves/wave-33/stages/T-4-integration.md
        # Integration suite: 10 real-DB tests (Part A: malformed id -> real 22P02 at
        #   41-47ms; Part B: real error -> filter -> 400 clean body).
      - process/waves/wave-33/stages/V-1-karen.md
        # Claim 6: "CI run 28559053549 job test: 467 unit + 10 integration (41-47ms
        #   real-DB) passed; 9/9 files, zero skipped."
      - process/waves/_archive/wave-32/blocks/L/observations.md
        # obs-2: "At T-8, probe each new :id route param with a malformed value on the
        #   authed path and assert 400; a 500 indicates missing ParseUUIDPipe. HOLD.
        #   Promote to T-8 rule 2 on second confirming wave where a T-8 malformed-param
        #   probe catches a 500 on an :id-pattern route param."
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-8.md
    recurrence: >
      2ND CONFIRMING EVENT of wave-32 obs-2. PROMOTABLE.

      Event history:
      - wave-32 (1st isolation): T-8 probe caught non-UUID channelId -> 500 (missing
        ParseUUIDPipe) on the new voice-participants endpoint. Filed task a2dd9f3d.
        V-1 jenny noted the identical gap on the wave-31 voice-token route. Held as
        "1st isolation" of the T-8 probe obligation for :id-pattern params.
      - wave-33 (2nd event): wave-33 IS the fix wave for a2dd9f3d. The wave explicitly
        required T-8 to confirm the 22P02 branch ran against a real DB (jenny carry note
        at P-4 Phase 2; V-block mandated). CI integration tests produced real 22P02 at
        41-47ms (genuine Postgres round-trips, not stubbed). The malformed-param probe
        class was exercised at two levels: (a) the T-8 security matrix in wave-32 that
        caught the gap, and (b) the T-8 confirmation in wave-33 that the fix handles the
        class. Both events share the same probe type (non-UUID :id param -> expected 400,
        actual behavior verified) and the same surface (:id-pattern route params on NestJS
        controllers without ParseUUIDPipe or a project-wide filter).

      The promotion condition from wave-32 obs-2 is satisfied: "a wave explicitly requires
      the probe and prevents the gap from shipping" — wave-33 is that wave (the gap was
      already known from wave-32; wave-33's T-8 verification confirmed the fix closed it
      project-wide).

      T-8.md has 1 rule; slot 2 open. PROMOTABLE. Flag for karen.
    promotion_gates:
      generalizable: true
        # Applies at T-8 for any wave introducing or modifying an endpoint with a route
        # param expected to be a UUID (or typed format). The probe: send a non-UUID
        # malformed value on the authed path and assert 400 (not 500). Generalizes to
        # any :id-pattern param (:channelId, :serverId, :userId, :messageId, etc.) on
        # any NestJS controller without a project-wide format-validation mechanism.
      falsifiable: true
        # Checkable at T-8: does the probe set include one malformed-param case per
        # :id route param on endpoints touched or added this wave? A T-8 that probes
        # only authz (valid-UUID paths) and does not probe a non-UUID value on an
        # :id-param endpoint fails this rule for that endpoint.
      cited: true
        # wave-32/blocks/L/observations.md obs-2 (1st isolation: T-8 F-32-T-8-1
        #   non-UUID channelId -> 500; task a2dd9f3d filed; V-1 jenny: gap extends
        #   to voice-token route; T-8 rule 2 candidate);
        # wave-33 P/gate-verdict.md Phase 2 jenny carry (T-8 must run 22P02 against
        #   real test DB, not unit-simulated);
        # wave-33 V-1-karen.md claim 6 (CI run: 10 integration tests at 41-47ms real-DB;
        #   malformed-param branch confirmed non-decorative);
        # wave-33 V/gate-verdict.md (re-verified: fix genuinely fires, 41-47ms real-DB,
        #   not stubbed; malformed-param surface closed project-wide).
    candidate_rule_shape: >
      2. At T-8, probe each :id route param with a malformed value on the authed path
         and assert 400; a 500 indicates missing format validation.
         Why: Spec ACs are silent on malformed params; T-8 is the only gate that
         exercises the format-validation gap before it compounds across sibling routes.
    promotion_status: PROMOTABLE. 2nd confirming event (wave-32 obs-2 catch + wave-33
      fix-and-confirm). T-8.md slot 2 open. Flag for karen.
```

---

## Prior held observations — second-instance status (wave-29 through wave-32)

| origin | obs | class | wave-33 status |
|--------|-----|-------|----------------|
| wave-32 | obs-2 | :id route param without format validator -> 500; T-8 is the catch gate | CONFIRMED as 2ND EVENT this wave (obs-4 above). PROMOTABLE to T-8 rule 2. |
| wave-32 | obs-1 | Wiring new api method into existing component invalidates explicit-enumeration mock (BUILD rule 9 candidate, blocked by linter at wave-32 L-2) | NOT CONFIRMED this wave. Wave-33 is backend-only (B-3/B-4 skipped; no frontend component wiring). Remains linter-blocked (BUILD slot 9 candidate — try tighter why line next occurrence). |
| wave-32 | obs-3 | Typed api-client method added but consumer fetches inline in parallel | NOT CONFIRMED this wave. Backend-only wave; no api.ts method added; no frontend consumer. Remains 1-wave HOLD (BUILD candidate). |
| wave-31 | obs-1 | Credential-endpoint gate: membership check before load/type-discriminator | NOT CONFIRMED this wave. Wave-33 hardens the error-mapping layer; it does not introduce a new credential-issuing or resource-loading endpoint. Remains 2-wave HOLD (BUILD rule 9 candidate). |
| wave-31 | obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() | NOT CONFIRMED this wave. No new npm dependency added (no new external SDK). Remains 2-wave HOLD (BUILD candidate). |
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code ?? default | NOT CONFIRMED this wave. No query on a nullable FK status table. Remains 3-wave HOLD (BUILD candidate). |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED this wave. No cron or background job with irreversible external side effect. Remains 3-wave HOLD (BUILD candidate). |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED this wave. V-2 had zero findings (empty triage). Remains 3-wave HOLD (VERIFY slot 3 pending). |
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | NOT CONFIRMED this wave. No operator-fix shorthand in the plan; the plan error was a wrong class name, not ambiguous expression form. Remains 4-wave HOLD (PRODUCT rule 4 candidate — note: this wave's obs-1 is now also a PRODUCT rule 4 candidate; if both confirm on the same wave, this obs (warning, gate REWORK) has priority over wave-29 obs-1 on the same strength grounds). |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites catches reviewer-missed occurrence | NOT CONFIRMED this wave. V-3 was SKIPPED (empty fast-fix queue); no V-3 independent pattern scan. Remains 4-wave HOLD (VERIFY slot 3 pending). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED this wave. Valid M6 hardening wave; no P-1 override-ship (not under-floor by LOC; precedent-application was for being under-floor — wave-33 is also under-floor but carries its own N-block flag rather than a BOARD vote). Remains 4-wave HOLD (PRODUCT candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED this wave. No gitleaks or entropy scanner interaction (clean CI). Remains 5-wave HOLD (CI candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED this wave. No CI-config fix cycle. Remains 5-wave HOLD (CI candidate). |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED this wave. No EXPLAIN-based integration test. Remains 6-wave HOLD (T-4 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED this wave. No performance wave. Remains 6-wave HOLD (T-7 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 caught it | NOT CONFIRMED this wave. No store-keyed unit fixture; backend-only wave. Remains 7-wave HOLD (T-2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED this wave. No date-dependent test authored. Remains 7-wave HOLD (T-2 candidate). |

---

## Signals evaluated and dropped

**Signal: override-ship under floor (wave-33 ~200 LOC, like wave-32 ~76 LOC):**
Wave-33 applied the same override-ship-under-floor precedent as waves 24-32 (8th+ consecutive
application now). The precedent has been documented, applied, and logged correctly at P-1.
This is a standing practice, not a new observation. The signal was already evaluated and
dropped as "reinforcement of standing practice" in wave-29 Signal 3. Wave-33 adds no new
failure mode, near-miss, or codifiable condition. DROPPED.

**Signal: P-4 attempt-2 approved first attempt (Phase 1 only) after REWORK:**
The two-attempt P-4 pattern (attempt-1 REWORK -> attempt-2 APPROVED) is the correct
functioning of the gate mechanism, not a process failure. The gate worked. The observation
value is in WHY the plan was wrong (obs-1 above captures this); the gate-mechanism pattern
itself is not a new observation. DROPPED as redundant with obs-1.

---

## Summary table

| id    | title (short)                                                                     | severity      | recurrence    | candidate file              | disposition |
|-------|-----------------------------------------------------------------------------------|---------------|---------------|-----------------------------|-------------|
| obs-1 | Plan names a framework error class absent from the actual stack; gate catches it  | warning       | 1st instance  | PRODUCT-PRINCIPLES          | HOLD — rule 4 candidate; promote on 2nd confirming wave |
| obs-2 | Error-mapping fix must fire against a real upstream error, not a unit-mock object | warning       | 1st instance  | VERIFY-PRINCIPLES           | HOLD — rule 3 candidate; promote on 2nd confirming wave |
| obs-3 | Clone the shipped error-walk helper depth for new error codes on the same stack   | informational | 1st instance  | BUILD-PRINCIPLES            | HOLD — BUILD candidate; promote on 2nd confirming wave |
| obs-4 | T-8 malformed :id route param probe obligation confirmed across catch + fix waves | warning       | 2nd event     | T-8.md                     | PROMOTABLE — T-8 rule 2 candidate; 2nd event (w32 obs-2 + w33); flag for karen |

**Observations emitted: 4**
**Severities: 3 warning (obs-1, obs-2, obs-4), 1 informational (obs-3)**
**Candidate files: PRODUCT-PRINCIPLES (obs-1), VERIFY-PRINCIPLES (obs-2), BUILD-PRINCIPLES (obs-3), T-8.md (obs-4)**
**Dropped: override-ship reinforcement (standing practice, no new failure mode); P-4 two-attempt pattern (gate mechanism working correctly, captured by obs-1)**

---

## Promotion candidate flags for karen

**One promotion candidate this wave.**

**obs-4 (T-8.md rule 2) — PROMOTABLE.**
2nd confirming event across wave-32 (T-8 catch: non-UUID channelId -> 500, task a2dd9f3d
filed) and wave-33 (T-8 verification: fix confirmed via real-DB integration at 41-47ms,
22P02 branch non-decorative, project-wide gap closed). The probe class (malformed :id param
-> expect 400, not 500) is the same in both events. The promotion condition from wave-32
obs-2 is satisfied exactly.

Candidate rule shape (T-8 rule 2):
  2. At T-8, probe each :id route param with a malformed value on the authed path
     and assert 400; a 500 indicates missing format validation.
     Why: Spec ACs are silent on malformed params; T-8 is the only gate that
     exercises the format-validation gap before it compounds across sibling routes.

Rule line = 102 chars; why line = 99 chars. No forbidden tokens.

T-8.md has 1 rule; slot 2 open. Ready for karen vetting + head-verifier approval before
write to T-8.md.

**obs-1** (PRODUCT-PRINCIPLES rule 4 candidate) is the highest-value new HOLD: a P-4
REWORK caused by a factually wrong framework class name in the plan, independently
confirmed by karen via package.json read. The rule is deterministically falsifiable
(grep package.json for the named framework before submitting the plan). Note: wave-29
obs-1 (operator-fix expression-form ambiguity, 4-wave HOLD at 1 instance) is also a
PRODUCT rule 4 candidate. If both confirm on the same future wave, this wave-33 obs-1
takes priority (same severity, more recently measured gate REWORK, more deterministic
falsifiability check).

**obs-2** (VERIFY-PRINCIPLES rule 3 candidate) is the head-verifier's own flagged lesson
from this wave. The distinction (real-DB timings vs ~0ms stub) is a deterministic, machine-
checkable signal in CI logs. The class (error-mapping fix proven against a real error) is
generalizable to any exception filter, catch handler, or circuit breaker fix. However it
competes with wave-29 obs-2 (V-3 pattern scan, 4-wave HOLD) and wave-30 obs-3 (accept+
track+observe, 3-wave HOLD) for VERIFY slot 3. All three are 1st-instance HOLDs for slot 3.
At the first 2nd-instance confirmation, that observation takes the slot.

**obs-3** (BUILD candidate) is informational because the reuse pattern worked correctly
this wave with no failure on this axis. The value is in naming it so future B-block plans
cite the existing helper deliberately. Competes with wave-32 obs-1 linter-retry and
wave-31 obs-1 (gate-ordering on credential endpoints) for BUILD slot 9.
