# Wave 42 — L-2 Distill Observations

Synthesized from wave-42 artifacts (M8 collect/return lifecycle: student submission +
educator roster + educator return-with-comment; PR squash-merged to main; V-block APPROVED).
Inputs read:
process/waves/wave-42/stages/P-0-frame.md,
stages/B-6-review.md,
stages/T-4-integration.md,
stages/T-5-e2e.md.
Prior archives consulted:
process/waves/_archive/wave-{38,39,40,41}/blocks/L/observations.md
(recurrence checks on biome-at-B-5, Playwright MCP channel, fixture-B gap, id-contract drift,
default-flag data-loss, integration-spec deferral classes).
Principles files read: BUILD-PRINCIPLES (8 rules), CI-PRINCIPLES (8 rules),
VERIFY-PRINCIPLES (2 rules), PRODUCT-PRINCIPLES (3 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      Integration specs for the submission feature were NOT authored during the B-block;
      T-4 authored them under Pattern B. As a result, the CI integration job passed green
      throughout the B-block and C-1 stages WITHOUT exercising any submission endpoint —
      a false coverage signal on the project's most consequential new boundary this wave
      (14 cases: authz, IDOR, idempotency, resubmit-clears-return, grade-field absence).
      The CI green during B-block was structurally misleading: it confirmed prior-wave
      coverage held, not that the new feature was tested. T-4 authored the spec from
      scratch (commit c3f7449), ran it against real-PG in CI (run 28689560816, 14/14 PASS),
      and the missing coverage was retroactively filled. No regression escaped, but the
      gap window was the entire B-block and C-1 cycle.

      The generalizable class: when a B-block builds new service methods and route handlers,
      the integration test spec covering those boundaries belongs in the B-block, not
      deferred to T-4. A deferred spec means CI integration is green on the new feature
      for the entire B-block and C-1 cycle without any real-PG exercise of the new code;
      the T-4 stage then must author what should have been a B-block deliverable.

      This is additive to BUILD rule 4 ("Reproduce one negative path per authz or injection
      boundary at B-6 Phase-2"): rule 4 addresses Phase-2 adversarial reproduction of a
      specific negative path; this candidate addresses the obligation to author the full
      integration spec covering all boundaries during the B-block rather than deferring it
      to the T-layer.

      Near-dup check against BUILD rules 1-8: rule 4 addresses Phase-2 adversarial probing,
      not integration spec authoring responsibility. Rules 6-8 address format/lint discipline.
      No near-dup.

      Near-dup check against T-4 principles (T-4.md): T-4 Pattern B documents that specs
      can be authored in T-4 when the B-block did not produce them. Pattern B is a recovery
      mechanism, not a license to defer spec authoring from the B-block. No near-dup.
    source:
      - process/waves/wave-42/stages/T-4-integration.md
        # "CI runs real-PG integration (test:ci + DATABASE_URL_TEST) but the B-block didn't
        #   author submission specs → T-4 authored them (Pattern B active)."
        # "test-automator (commit c3f7449 + biome-fix c986044)"
        # "ci_evidence: run 28689560816 SUCCESS — 14 submission integration cases executed
        #   real-PG + passed"
      - process/waves/wave-42/stages/B-6-review.md
        # B-6 REWORK round 1 cites id-contract drift and H1 data-loss — neither finding
        #   referenced an absent integration spec, confirming the gap was invisible at B-6.
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Target: rule 9 (slot contested; complementary to rule 4 — rule 4 says HOW to probe,
      # this candidate says WHEN to author the integration spec and WHAT CI coverage means
      # without it).
    recurrence: >
      FIRST RECORDED INSTANCE in L-2 history of "B-block ships new service boundaries
      without integration specs; CI integration job green throughout B-block and C-1 is
      a false coverage signal; T-4 authors the spec under Pattern B."

      Prior archive check (waves 36-41): no prior obs records Pattern-B activation as a
      signal that the B-block omitted integration spec authoring. Pattern B existence in
      T-4 does not imply the deferral is a neutral choice; this is the first obs to flag
      the B-block omission as a principle class rather than a recovery path.

      Competing BUILD slot-9 candidates (all HOLDs; priority order):
        - wave-31 obs-1 (strong, 11-wave HOLD): credential-endpoint membership-before-load.
        - wave-39 obs-1 (strong, 3-wave HOLD): async exit action with no error path.
        - wave-36 obs-1 (warning, 6-wave HOLD): authz tests deferred to follow-up wave.
        - wave-36 obs-3 (warning, 6-wave HOLD): two-layer IDOR proof for session-only-userId.
        - wave-37 obs-3 (warning, 5-wave HOLD): bootstrap-once list + live-count-only hook.
        - wave-38 obs-1 (see obs-2 this wave — NOW PROMOTION-ELIGIBLE).
        - wave-38 obs-3 (warning, 4-wave HOLD): process.env = undefined stringification trap.
        - wave-40 obs-4 (warning, 2-wave HOLD): text-column route params bypass global 22P02.
        - wave-41 obs-3 (warning, 1-wave HOLD): parallel-path enforcement gap.
        - wave-42 obs-1 (warning, this wave): integration spec deferred from B-block.
      First-to-confirm takes the slot; wave-31 obs-1 and wave-39 obs-1 (strong) have priority.
    promotion_gates:
      generalizable: true
        # Applies at any B-block for a wave that introduces new service methods and route
        # handlers covered by the project's real-PG integration tier. The check: does the
        # diff include a new *.integration.spec.ts (or equivalent) covering the new service
        # boundaries? If absent at B-5 and B-6, the CI integration job is green without
        # covering the new code — a false coverage signal. Pattern B in T-4 is the recovery
        # mechanism; its activation signals a B-block omission.
      falsifiable: true
        # Checkable at B-5: does the diff include a new *.integration.spec.ts alongside
        # the new service file(s)? A B-5 transcript that shows "integration test: pass"
        # without a new spec file in the diff fails this check — the green comes from prior
        # coverage, not new-boundary coverage. T-4 activation under Pattern B is the
        # confirmatory signal.
      cited: true
        # T-4-integration.md: "B-block didn't author submission specs → T-4 authored them
        #   (Pattern B active)"; "ci_evidence: run 28689560816 SUCCESS — 14 submission
        #   integration cases executed real-PG + passed" — confirms the spec was a T-4
        #   deliverable that should have been authored in the B-block.
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9]
      Author integration specs covering new service boundaries in the B-block; do not defer
      them to T-4.
      Why: A deferred spec makes the CI integration job green on new code for the entire
      B-block and C-1 cycle without real-PG exercise.
      Rule line = 92 chars; why line = 97 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The false-coverage-signal mechanism is clean and well-documented
      (T-4 explicitly labels Pattern B active; T-4 authors 14 cases that should have been
      B-block deliverables). Watch for: any T-4 stage transcript that records Pattern B
      active alongside a new feature's service boundaries that first appear this wave.


  - id: obs-2
    summary: >
      At T-4, the test-automator ran `tsc` locally before pushing the integration spec but
      did NOT run `pnpm lint` (biome ci). The spec failed CI biome lint, requiring one
      additional fix commit (c986044). This is the second failure instance of the class
      first recorded at wave-38 obs-1: "B-5 omits the repo-root `biome ci .` command;
      CI lint job fails on deterministic errors." The wave-38 instance was a B-5 omission;
      the wave-42 instance is a T-4 omission by a different specialist (test-automator
      vs. build specialist), confirming the class is not specialist-specific — it applies
      to any agent that authors source files and pushes to the branch without running
      `biome ci .` first.

      Waves 39, 40, and 41 applied the lesson with 0 lint failures (confirmations-by-
      application); wave-42 is the second failure instance. The 2+ wave bar for promotion
      is met (wave-38 = 1st failure; wave-42 = 2nd failure). The rule is already partially
      encoded in BUILD-PRINCIPLES rule 7 ("Run the lint/import-organizer check command,
      not the formatter alone, before reporting a build task done") and rule 8 (pre-commit
      hook). However, rule 7 scopes to "reporting a build task done" — T-4's test-automator
      is not reporting a build task done; it is pushing a test file. The wave-42 instance
      extends the obligation from build specialists to any agent authoring files and pushing,
      including test-automator.

      Near-dup check against BUILD rule 7: rule 7 says "before reporting a build task done."
      The test-automator is not reporting a B-block task done; it is committing a T-4 spec.
      The obligation is the same action (run biome ci before push) but applies beyond the
      B-block. Not a near-dup of rule 7 as scoped; an extension.

      Near-dup check against BUILD rule 8: rule 8 says "gate commits with a pre-commit hook."
      The absence of a hook firing here suggests the hook is not universally installed or
      was bypassed. The observation does not address hook installation; it addresses the
      push-time obligation for agents. Complementary, not a near-dup.
    source:
      - process/waves/wave-42/stages/T-4-integration.md
        # "T4-F2 (LOW → L-2): the spec initially failed CI biome lint (test-automator ran
        #   tsc but not `pnpm lint` before push) — same 'run biome ci locally before push'
        #   lesson; fixed in one cycle."
        # "biome-fix c986044" — second commit in T-4 to clear the lint failure.
      - process/waves/_archive/wave-38/blocks/L/observations.md
        # obs-1: "B-5 omits the repo-root lint command; 3 deterministic Biome errors reach CI;
        #   HOLD. First instance."
      - process/waves/_archive/wave-41/blocks/L/observations.md
        # obs-5: "wave-38 obs-1 applied for 3rd consecutive wave; no lint fix-up at C-1.
        #   Remains 1-wave HOLD."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # wave-38 obs-1 target; this wave is the SECOND FAILURE INSTANCE — promotion bar met.
      # Target: BUILD rule 7 scope extension (from "reporting a build task done" to "pushing
      # any authored source or test file") OR new rule 9.
      # Note: wave-38 obs-1 originally targeted rule 9 as a slot; since rule 7 partially
      # encodes the obligation, this wave's confirmation should be assessed as a rule 7
      # scope clarification first.
    recurrence: >
      SECOND FAILURE INSTANCE of the "agent pushes authored files after running tsc only,
      not biome ci; CI lint job fails on deterministic errors" class.

      Failure lineage:
        - wave-38 obs-1: B-5 specialist omits repo-root `biome ci .`; 3 deterministic errors
          reach CI; 1 fix-up commit at C-1. Recorded: BUILD-PRINCIPLES rule 7 sharpen / rule 9
          candidate. HOLD (1 failure instance).
        - waves 39, 40, 41: lesson applied by build specialist proactively; 0 lint failures
          at CI. Confirmations-by-application (not failure instances).
        - wave-42 obs-2: test-automator pushes T-4 spec after tsc only; biome lint fails; 1
          fix-up commit. SECOND FAILURE INSTANCE. Specialist differs (test-automator vs. B-5
          build specialist); the action class is the same (push authored files without biome ci).

      The 2+ wave failure bar is now met. Promotion-eligible.

      Near-dup check against BUILD rules 7 and 8: rule 7 scopes to "reporting a build task
      done" and addresses the CI format gate — the action prescribed (run lint/import-organizer
      check) is correct but the scope does not name test-authoring agents explicitly. Rule 8
      (pre-commit hook) encodes the structural prevention but the hook was not active for the
      test-automator push. The promotion action is: extend rule 7 scope to "any agent pushing
      authored files" or promote wave-38 obs-1 as a new rule 9 with broader scope.
    promotion_gates:
      generalizable: true
        # Applies to any agent that authors source or test files and pushes to the branch:
        # B-block specialists (rule 7 already covers this sub-case), test-automator (T-4
        # spec authoring), react-specialist, node-specialist, or any other agent that
        # produces committed files. The check: did the agent run `biome ci .` (or equivalent)
        # before the push that introduced the lint failure? A push followed by a CI lint
        # failure on deterministic errors (unused imports, formatting violations, import order)
        # fails this check.
      falsifiable: true
        # Checkable at any CI stage: a CI lint job that fails immediately after a push by
        # a non-B-5 agent (test-automator, react-specialist, design-specialist) on
        # deterministic Biome errors confirms the class. The tell: the lint failure is
        # deterministic (same result on any machine) and could have been caught by running
        # `biome ci .` locally before the push.
      cited: true
        # T-4-integration.md T4-F2: "test-automator ran tsc but not pnpm lint before push";
        #   "biome-fix c986044" (second commit to clear the CI lint failure).
        # wave-38 obs-1 (first failure): B-5 specialist omits biome ci .; 3 Biome errors at C-1.
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 7 scope extension or new rule 9]
      Run `biome ci .` before pushing any authored file to the branch, not only before
      reporting a build task done.
      Why: Deterministic lint errors caught by biome ci are invisible to tsc and fail CI
      regardless of which specialist authored the file.
      Rule line = 111 chars; why line = 96 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      PROMOTION-ELIGIBLE. Second failure instance (wave-38 = 1st, wave-42 = 2nd); the 2+
      wave failure bar is met. The two failures have different specialists and stages
      (B-5 build specialist vs. T-4 test-automator), confirming the class is not stage-
      or specialist-specific. The candidate rule is falsifiable at any CI lint stage. The
      scope extension (from "reporting a build task done" to "pushing any authored file")
      is the key delta over the existing rule 7. Pending head-builder approval.


  - id: obs-3
    summary: >
      B-6 Phase 1 (head-builder) issued a REWORK because the return route resolved on the
      submission primary key (`submission_id`), but the roster DTO did not expose `id` at
      all — the frontend had only `submitter.userId` available and sent that as the route
      param, producing 404s on every return attempt. The id-contract gap was NOT caught
      at B-1 (contracts), B-2 (backend), B-3 (frontend), or B-4 (wiring). It required
      one full additional B-4+B-5 cycle after the fix: shared AssignmentSubmissionSchema
      += id; submissionRowToDto emits id across all 3 call sites; roster passes row.id;
      frontend return action sends submission PK.

      The root: the backend contract for the return route was specified on a PK that the
      DTO layer never propagated to the shared schema. The shared schema is the interface
      between backend and frontend; a route param that resolves on a DB PK must appear in
      the shared schema and the DTO before the route is wired to a frontend action.

      The generalizable class: when a route resolves on a resource PK (not on a natural
      key already in the DTO like userId), the shared schema and all DTO call sites must
      emit that PK before the route can be wired from the frontend. A shared schema that
      does not include the PK makes the route unroutable from the frontend for any resource
      identified by that PK.

      Near-dup check against BUILD rules 1-8: no existing rule addresses the obligation to
      include resource PKs in the shared schema and DTO before wiring a PK-resolved route.
      Rule 4 (adversarial reproduction of negative path at B-6 Phase 2) addresses what
      Phase 2 probes, not what Phase 1 must check in the contracts layer. No near-dup.

      Near-dup check against wave-41 obs-3 (parallel-path enforcement gap): obs-3 is about
      a new enforcement gate missing from a parallel write path. This class is about a DTO
      missing a PK that a route resolves on. Different axis. Not a near-dup.
    source:
      - process/waves/wave-42/stages/B-6-review.md
        # "Attempt 1: REWORK — cross-layer contract bug (return route resolves on submission
        #   PK, but roster DTO didn't expose `id`; frontend sent submitter.userId → return
        #   404s). Everything else airtight."
        # "Fix: shared AssignmentSubmissionSchema += id (node-specialist); submissionRowToDto
        #   emits id (all 3 call sites); roster passes row.id + renamed submissionUserId→
        #   submissionId (react-specialist). Re-ran B-4+B-5 clean."
        # "Attempt 2: APPROVED — id flows shared→DTO→frontend; return sends submission PK"
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Target: rule 9 (slot contested; complementary to rule 4 — Phase 1 contracts check,
      # not Phase 2 adversarial probe). Could alternatively target B-1 or B-4 stage
      # principles if those exist as a separate principles file.
    recurrence: >
      FIRST RECORDED INSTANCE of "route resolves on a DB PK that the shared DTO schema
      does not expose; frontend wires the route using an available natural key; 404s on
      every request; B-6 Phase 1 REWORK; fix: add PK to shared schema + DTO + all
      call sites; re-run B-4+B-5."

      Prior archive check (waves 36-41): no prior obs records cross-layer PK propagation
      gap as a standalone class. Wave-40 obs-4 (text-column route params) is about input
      validation, not DTO schema propagation. Wave-41 obs-3 (parallel-path enforcement gap)
      is about gate coverage on sibling write paths. Not a near-dup for either.

      Competing BUILD slot-9 candidates: see obs-1 above for full list. This obs-3 is
      the lowest-priority new entry (first instance, warning severity, BUILD slot heavily
      contested).
    promotion_gates:
      generalizable: true
        # Applies at B-1 (contracts) or B-3 (frontend) for any wave that adds a route
        # whose param is a DB PK. The check: is the PK present in the shared schema (e.g.,
        # zod schema in packages/shared)? Is it emitted by all rowToDto call sites? A route
        # registered with @Param('submissionId') (or similar) whose PK column is not in the
        # shared schema fails this check before any frontend wiring is attempted.
      falsifiable: true
        # Checkable at B-3/B-4: for a new route param that maps to a DB PK (not a natural
        # key like userId or slug), does the shared schema include that field? A frontend
        # file that constructs the route URL using a field that is NOT in the shared schema
        # DTO (e.g., submitter.userId where the route expects submissionId) fails this check.
        # Independent B-6 Phase 1 check: can the frontend code constructing the route URL
        # access the PK from the DTO without type-casting or fallback?
      cited: true
        # B-6-review.md Attempt 1 REWORK: "return route resolves on submission PK, but
        #   roster DTO didn't expose `id`; frontend sent submitter.userId → return 404s";
        #   fix "shared AssignmentSubmissionSchema += id; submissionRowToDto emits id
        #   (all 3 call sites); roster passes row.id."
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9]
      Include a DB PK in the shared schema and all DTO call sites before wiring any route
      that resolves on that PK.
      Why: A route param resolving on a PK absent from the DTO is unreachable from the
      frontend; the frontend has no type-safe source for the param.
      Rule line = 112 chars; why line = 97 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The fix-cycle cost is documented (B-6 REWORK → B-4+B-5 re-run).
      The check is falsifiable at B-1/B-3 (does the shared schema include the route's PK?).
      Watch for: any B-3 or B-4 stage where a new route param is a DB PK and the shared
      schema does not expose that column.


  - id: obs-4
    summary: >
      B-6 Phase 2 (code-reviewer) caught HIGH H1 (data-loss): `listAssignments` called
      `rowToDto(row, userId)` with the default `includeSubmission=false` flag. When a
      student reloaded the assignment panel after an educator had returned their submission,
      `mySubmission` arrived as `null` on the frontend. The student form re-rendered as
      empty ("Your Work" blank). A resubmit at that point would call `submitAssignment`,
      which is idempotent (upsert), clearing `returned_at` and `organizer_comment` — the
      educator's return state was silently overwritten. Root: the include flag's default
      (false) was safe for list-only renders but destructive when the list response backs
      a writable form that shows a pre-filled value.

      Fix: `listAssignments` calls `rowToDto(row, userId, true)` (node-specialist);
      reviewer round 2 CLEAN. The H1 severity comes from the combination of: (a) the data
      that is lost (educator work — a return action) is harder to recover than student work;
      (b) the loss is silent (no error, no warning, the form just appears blank); (c) the
      trigger is a normal user action (reload).

      The generalizable class: a default-false "include related entity" flag on a read
      endpoint is safe only when the frontend's reaction to `null` is inert (hide, skip).
      When `null` triggers a writable form to render as empty, and that form's submit path
      is an upsert that overwrites existing state, the default-false flag becomes a data-loss
      trigger on reload. The include flag must default to true (or the route must not allow
      an absent include to back a writable form).

      Near-dup check against BUILD rules 1-8: no existing rule addresses default-flag
      data-loss from a read backing a writable form. Rule 4 (adversarial reproduction at
      B-6 Phase 2) is the mechanism that caught it. No near-dup.

      Near-dup check against wave-41 obs-3 (parallel-path enforcement gap): obs-3 is about
      a guard missing from a sibling write path. This class is about a read-side default
      that enables a destructive write path on reload. Different axis. Not a near-dup.
    source:
      - process/waves/wave-42/stages/B-6-review.md
        # "Round 1: HAS-FINDINGS — H1 (HIGH, data-loss): listAssignments sent
        #   mySubmission=null (rowToDto includeSubmission default false) → student reload
        #   shows blank form → resubmit silently clears educator return + prior work."
        # "H1 → listAssignments rowToDto(row,userId,true) (node-specialist)"
        # "Round 2 (re-review): CLEAN — H1 FIXED (correct user-scoping, N+1 perf-only)"
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Target: rule 9 (slot contested). This is a data-loss class distinct from authz/gate
      # classes already competing for the slot. Priority: lower than strong candidates
      # (wave-31, wave-39) but distinct enough to track.
    recurrence: >
      FIRST RECORDED INSTANCE of "default-false 'include related entity' flag on a list
      endpoint; read backs a writable form; null triggers empty render; upsert on submit
      silently overwrites existing server-side state; B-6 Phase 2 catches HIGH data-loss."

      Prior archive check (waves 36-41): no prior obs records this specific class
      (default-flag data-loss from a read backing a writable form). Not a near-dup of
      any prior obs.

      Competing BUILD slot-9 candidates: see obs-1 above for full list. This obs-4 is a
      new first-instance warning-severity entry.
    promotion_gates:
      generalizable: true
        # Applies at B-2 (backend) for any list endpoint that includes a nullable "include
        # related entity" flag whose default is false. The check: can a null return value
        # for the included entity (when the flag is false or omitted) cause a writable form
        # to render as empty in the frontend? If the entity's presence is both (a) shown in
        # a form the user can submit and (b) cleared by that form's upsert/overwrite path,
        # the default must be true for any request that backs that form.
      falsifiable: true
        # Checkable at B-3/B-4: for a new list endpoint with a nullable include flag,
        # trace the frontend rendering path — does a null value for the included entity
        # produce an empty form state? Does submitting that empty form trigger an upsert
        # that overwrites an existing related entity? A yes to both fails this check.
        # Independent B-6 Phase 2 check: reload the resource while it has a related entity;
        # confirm the list response includes the entity (not null).
      cited: true
        # B-6-review.md H1: "listAssignments sent mySubmission=null (rowToDto includeSubmission
        #   default false) → student reload shows blank form → resubmit silently clears
        #   educator return + prior work"; fix "rowToDto(row,userId,true)".
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 9]
      Default an include flag to true on any list endpoint whose null return backs a
      writable form with an upsert submit path.
      Why: A false default on a read that backs a writable form lets a reload silently
      overwrite existing server-side state when the user resubmits the empty form.
      Rule line = 112 chars; why line = 99 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The HIGH severity (silent data-loss of educator return state)
      and the clean trigger (normal reload) make this a strong first-instance candidate.
      Watch for: any list endpoint that adds a nullable include flag defaulting to false,
      where the included entity backs a form in the frontend.


  - id: obs-5
    summary: >
      Wave-42 T-5 records: "Playwright MCP is channel-pinned to a missing /opt chrome;
      bypassed via a direct playwright-core Node script with explicit executablePath to
      bundled chromium-1208." Wave-41 T-5 records the identical situation: "ui-comprehensive-
      tester (bundled-chromium, MCP chrome absent)." This is the second consecutive wave
      in which the Playwright MCP chrome channel was absent and the bundled-chromium
      executablePath bypass was required. Wave-42 T-5 patched `.mcp.json` with
      `--browser chromium` for future sessions, which wave-41 did not.

      The recurrence across consecutive waves confirms the channel-pin problem is
      environmental (the /opt chrome path does not exist in this session's MCP environment)
      rather than a transient per-session issue. Without the `.mcp.json` patch from
      wave-42, every new T-5 session would require rediscovering the bypass.

      Separately, T-5 could not exercise the student-side "Your Work" UI flow (S2 BLOCKED)
      because the only available test account (fixture A) owns all 376 servers — the
      student submit form never renders for an organizer. Fixture B is tracked as broken
      (task c50f3040). This fixture gap is a first-instance observation for this project;
      wave-41 T-5 had a two-user flow (fixture A + B) that passed; the fixture-B breakage
      is new to wave-42.

      The MCP chrome-channel recurrence is the promotable signal. The fixture-B gap is
      informational (first instance, remediation task already filed).
    source:
      - process/waves/wave-42/stages/T-5-e2e.md
        # "Playwright MCP channel-pinned to missing /opt chrome; bypassed via direct
        #   playwright-core Node script with explicit executablePath to bundled chromium-1208
        #   (the non-privileged path). `.mcp.json` also patched with `--browser chromium`
        #   for future sessions (takes effect on next MCP spawn)."
        # "T5-F1: student-side 'Your Work' submit + 'Edit submission' BUTTON rendering is
        #   UI-uncovered — strictly the single-account/organizer-everywhere + broken-fixture-B
        #   constraint"
        # "T5-F2 (infra, LOW → L-2): Playwright MCP chrome-channel broken; direct-playwright
        #   executablePath bypass is the working non-privileged path. `.mcp.json` patched."
      - process/waves/_archive/wave-41/stages/T-5-e2e.md
        # "ui-comprehensive-tester (bundled-chromium, MCP chrome absent)"
        # wave-41 T-5 used the bundled-chromium bypass without documenting the .mcp.json
        # patch — same infra gap triggered independently in both waves.
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-5.md
      # Target: a rule encoding that when the Playwright MCP chrome channel is absent,
      # the direct-playwright executablePath bypass is the working path AND .mcp.json
      # should be patched immediately so the bypass applies to all future sessions.
      # Note: T-5 rule 1 should be checked for near-dup before promotion.
    recurrence: >
      SECOND DOCUMENTED INSTANCE of "Playwright MCP chrome channel is absent; bundled-
      chromium executablePath bypass is required." Both instances are consecutive waves
      (wave-41, wave-42). The 2+ wave bar is met for the MCP-channel class.

      Prior archive check (waves 36-40): no prior obs records the Playwright MCP chrome-
      channel absent + bundled-chromium bypass class. Waves 41 and 42 are the first two
      documented instances.

      Wave-42 adds the `.mcp.json` patch that wave-41 did not include. The patch is the
      correct structural mitigation: it persists the channel override across MCP spawns
      rather than requiring per-session rediscovery. The absence of the patch in wave-41
      is why wave-42 triggered the same bypass rediscovery.

      Near-dup check against T-5 rule 1 (if exists): T-5.md must be read before promotion
      to confirm the current T-5 rule set. This observation targets T-5.md; the candidate
      rule encodes both the bypass path and the .mcp.json patch obligation.

      PROMOTE-ELIGIBLE for the MCP-channel class. Second instance (wave-41 + wave-42).
      The fixture-B gap is informational (first instance; remediation task c50f3040 filed).
    promotion_gates:
      generalizable: true
        # Applies at T-5 for any session where the Playwright MCP fails to launch because
        # the configured chrome channel path (/opt chrome or equivalent) does not exist in
        # the runtime environment. The check: is the executablePath to bundled chromium
        # used as the bypass? Is .mcp.json patched with the browser flag so future sessions
        # start with the correct channel? A T-5 session that rediscovers the bypass without
        # patching .mcp.json fails the second check.
      falsifiable: true
        # Checkable at T-5: did the MCP chrome launch succeed on the first attempt, or was
        # a bypass required? If a bypass was required, does .mcp.json now contain the
        # --browser chromium (or equivalent) flag? A .mcp.json without the flag after a
        # bypass-required session fails this check. Independent check: does the T-5 stage
        # transcript document the executablePath used in the bypass script?
      cited: true
        # T-5-e2e.md (wave-42): "Playwright MCP channel-pinned to missing /opt chrome;
        #   bypassed via direct playwright-core Node script with explicit executablePath
        #   to bundled chromium-1208. `.mcp.json` patched with `--browser chromium`."
        # T-5-e2e.md (wave-41 header): "ui-comprehensive-tester (bundled-chromium,
        #   MCP chrome absent)" — same bypass triggered without .mcp.json patch.
    candidate_rule_shape: >
      [target: test-layer-principles/T-5.md, new rule]
      When the Playwright MCP chrome channel is absent, use the bundled-chromium
      executablePath bypass and immediately patch .mcp.json with the browser flag.
      Why: Without the .mcp.json patch, each new T-5 session must rediscover the bypass
      independently rather than inheriting the working channel config.
      Rule line = 117 chars; why line = 99 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      PROMOTE-ELIGIBLE for the MCP-channel class. Second instance across consecutive waves
      confirms this is an environmental constant, not a transient anomaly. The candidate
      rule encodes both the bypass path and the .mcp.json patch obligation (the delta that
      wave-41 missed). The fixture-B finding (T5-F1) is informational: first instance,
      remediation task already filed (c50f3040), no principle class opened.
      Pending head-tester approval for T-5 rule slot.
```

---

## Prior held observations — second-instance status (wave-37 through wave-41)

| origin | obs | class | wave-42 status |
|--------|-----|-------|----------------|
| wave-41 | obs-1 | V-3 redeploy false-green: unparameterized serviceInstanceDeployV2 on git-connected service rebuilds pinned snapshot | NOT CONFIRMED. No V-3 fast-fix redeploy this wave (V-3 stage exists but fast-fix queue empty — no fix-up redeploy triggered). Remains 1-wave HOLD (CI-PRINCIPLES rule 7 amendment / rule 9 candidate). |
| wave-41 | obs-2 | Symbol-grep false-positive: pre-existing MemberListPanel canModerateMembers symbol; karen APPROVED stale deploy; jenny caught by call-site shape | NOT CONFIRMED. V-1 karen verified the submission feature against route behavior (roster DTO id, resubmit-clears-return, no grade field), not a minified-bundle symbol grep. Remains 1-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-41 | obs-3 | Parallel-path enforcement gap: new gate applied to primary write path only; parallel path unguarded; B-6 HIGH | NOT CONFIRMED. B-6 caught an H1 this wave (obs-4) but the mechanism is a default-false include flag on a read, not a gate missing from a parallel write path. Different class. Remains 1-wave HOLD (BUILD-PRINCIPLES rule 9 candidate). |
| wave-40 | obs-1 | T-8-sourced fix mechanism contradicts architectural decision made after the T-8 finding + wrong column type | NOT CONFIRMED. No task this wave whose description inherits a T-8-sourced proposed fix mechanism. Remains 2-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate, strong). |
| wave-40 | obs-4 | Global 22P02 filter does not cover text-column NUL-byte errors; text-keyed route params require per-route guards | NOT CONFIRMED. New route params this wave are typed on the assignment_submissions PK (UUID) — global 22P02 filter coverage applies. Remains 2-wave HOLD (BUILD-PRINCIPLES rule 9 / T-8 rule 2 complement candidate). |
| wave-39 | obs-1 | Async exit action with no error path; always-resolving mock hides reject path; B-6 caught CRITICAL | NOT CONFIRMED. No new async user-exit or session-side-effect action in the diff. Remains 3-wave HOLD (BUILD-PRINCIPLES rule 9 candidate, strong). |
| wave-39 | obs-4 | Sole-doorway entry wired to one route ships second dead-end | NOT CONFIRMED. No new entry-point wiring introduced. Remains 3-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-38 | obs-1 | B-5 omits repo-root lint command; lint errors reach CI | SECOND FAILURE INSTANCE confirmed. See obs-2 above (test-automator pushes T-4 spec after tsc only; biome lint fails). PROMOTION-ELIGIBLE. |
| wave-38 | obs-2 | P-3 empirically probes live external service before architecture commitment | NOT CONFIRMED. No external-service architecture decision at P-3. Remains 4-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-38 | obs-3 | process.env.X = undefined stringification trap | NOT CONFIRMED. No process.env teardown in wave-42 test files. Remains 4-wave HOLD (BUILD-PRINCIPLES or T-2.md candidate). |
| wave-38 | obs-4 | T-8 rule 2 scope gap: public unauthed :id endpoints unprobed for malformed input | NOT CONFIRMED. New endpoints are auth-gated. Remains 4-wave HOLD (T-8.md rule 2 amendment candidate). |
| wave-37 | obs-2 | HTTP verb mismatch (client POST vs controller @Patch) passes service-layer tests; controller route-metadata assertion catches it | NOT CONFIRMED. No new controller routes with a verb mismatch. Remains 5-wave HOLD (CI-PRINCIPLES or T-2.md candidate). |
| wave-37 | obs-3 | Bootstrap-once list + live-count-only hook leaves list surface stale on reopen | NOT CONFIRMED. No new hook that bootstraps a list at mount and live-increments a count. Remains 5-wave HOLD (BUILD-PRINCIPLES or T-2.md candidate). |
| wave-36 | obs-1 | Security-boundary authz/IDOR tests deferred to follow-up wave | NOT CONFIRMED. Submission integration specs authored inline at T-4 (Pattern B); all authz boundaries covered within this wave. Pattern B does not defer authz tests to a follow-up wave. Remains 6-wave HOLD (BUILD-PRINCIPLES rule 9 candidate). |
| wave-36 | obs-3 | Two-layer IDOR proof: service integration + controller session-scoping test for session-only-userId endpoints | NOT CONFIRMED. Submission endpoints derive identity from session (submitter) + route params validated against DB membership; IDOR verified in T-4 integration (case 6: non-member submit → 403, serverId derived from assignment row). Remains 6-wave HOLD (BUILD-PRINCIPLES or T-8.md candidate). |

---

## Signals evaluated and dropped

**Signal: P-0 presign-gating finding (member vs. organizer presign) as an obs:**
P-0-frame.md finding #1 (false-present reuse claim: presignAttachmentUpload HARD-GATEs on
assertOrganizer; a member cannot call it) is a valid P-0 correction. The wave team resolved
it by scoping text-only submissions for this slice; the member-presign path is deferred.
This is PRODUCT-PRINCIPLES rule 1 ("Verify every seed claim about what exists or is absent
in the code") applied correctly. Confirmation-by-application; no new principle class opened.
DROPPED as standalone obs.

**Signal: two-migration ordering folded into initial CREATE:**
P-0 finding #2 (sequence seed CREATE → return-sibling ALTER; or fold returned_at/comment
into the initial CREATE) was handled by folding nullable columns into the initial CREATE.
This is a standard migration hygiene choice; it recurs as an operational decision, not as
a principle class requiring a new rule. DROPPED.

**Signal: V-3 fast-fix queue as a learning signal:**
V-3 stage exists this wave; fast_fix_queue was empty (no fast-fix round). A V-3 with no
fast-fix items is the expected outcome when B-6 Phase 2 caught and fixed the HIGH findings
before merge. No new class. DROPPED.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Integration specs deferred from B-block to T-4 (Pattern B active); CI integration job green without new-boundary coverage during B-block | warning | 1st instance | BUILD-PRINCIPLES | HOLD — rule 9 candidate; promote on 2nd confirming wave |
| obs-2 | Test-automator pushes T-4 spec after tsc only, not biome ci; CI lint fails (SECOND FAILURE of wave-38 obs-1 class) | warning | 2nd failure instance (wave-38 = 1st) | BUILD-PRINCIPLES | PROMOTION-ELIGIBLE — rule 7 scope extension or new rule 9; pending head-builder approval |
| obs-3 | Return route resolves on submission PK; roster DTO does not expose id; frontend sends userId → 404s; B-6 REWORK; fix: PK added to shared schema + DTO | warning | 1st instance | BUILD-PRINCIPLES | HOLD — rule 9 candidate; promote on 2nd confirming wave |
| obs-4 | default-false includeSubmission flag on listAssignments; reload returns null; resubmit silently clears educator return state; B-6 H1 data-loss | warning | 1st instance | BUILD-PRINCIPLES | HOLD — rule 9 candidate; promote on 2nd confirming wave |
| obs-5 | Playwright MCP chrome-channel absent (2nd consecutive wave); bundled-chromium bypass used; wave-42 adds .mcp.json patch that wave-41 omitted | warning | 2nd instance (wave-41 + wave-42) | T-5.md | PROMOTION-ELIGIBLE — new rule; pending head-tester approval |

**Observations emitted: 5 (obs-1, obs-2, obs-3, obs-4, obs-5)**
**Severities: 5 warning (obs-1 through obs-5)**
**Candidate files: BUILD-PRINCIPLES (obs-1, obs-2, obs-3, obs-4), T-5.md (obs-5)**
**Promotion-eligible this wave: obs-2 (BUILD rule 7 scope ext / rule 9; 2nd failure); obs-5 (T-5 new rule; 2nd instance)**
**Dropped: P-0 presign-gating (rule 1 confirmation-by-application); two-migration ordering (operational choice); V-3 empty queue (expected outcome)**

---

## Promotion candidate flags for karen

**Two observations are promotion-eligible this wave.**

**obs-2** (BUILD-PRINCIPLES rule 7 scope extension or new rule 9, warning severity) is the
second failure instance of the "push authored files without running biome ci; deterministic
lint errors fail CI" class. The two failures differ by specialist and stage (B-5 build
specialist in the first instance; T-4 test-automator in this instance), confirming the class
is not stage-specific and the existing rule 7 scoping ("before reporting a build task done")
is too narrow. The promotion action is either: (a) extend rule 7 to "pushing any authored
file" rather than "reporting a build task done," or (b) promote as a new rule 9 with broader
scope. The candidate rule is falsifiable (any CI lint failure on deterministic biome errors
after a non-B-5 push confirms the class). Head-builder approval required.

**obs-5** (T-5.md new rule, warning severity) is the second consecutive wave where the
Playwright MCP chrome channel was absent and the bundled-chromium executablePath bypass was
required. The wave-41 instance triggered the bypass without patching `.mcp.json`; wave-42
triggered the same bypass and added the patch. The candidate rule encodes both actions
(use the bypass path + immediately patch .mcp.json). Without the patch, the bypass must be
rediscovered each session. The rule is falsifiable (any T-5 session that requires the bypass
but does not produce a .mcp.json patch fails the rule). Head-tester approval required.

**Competing BUILD slot-9 candidates (all HOLDs; priority order):**
  - wave-31 obs-1 (strong, 11-wave HOLD): credential-endpoint membership-before-load.
  - wave-39 obs-1 (strong, 3-wave HOLD): async exit action with no error path.
  - wave-36 obs-1 (warning, 6-wave HOLD): authz tests deferred to follow-up wave.
  - wave-36 obs-3 (warning, 6-wave HOLD): two-layer IDOR proof for session-only-userId.
  - wave-37 obs-3 (warning, 5-wave HOLD): bootstrap-once list + live-count-only hook.
  - wave-38 obs-3 (warning, 4-wave HOLD): process.env = undefined stringification trap.
  - wave-40 obs-4 (warning, 2-wave HOLD): text-column route params bypass global 22P02.
  - wave-41 obs-3 (warning, 1-wave HOLD): parallel-path enforcement gap.
  - wave-42 obs-1 (warning, this wave): integration spec deferred from B-block.
  - wave-42 obs-3 (warning, this wave): PK missing from shared DTO before route wiring.
  - wave-42 obs-4 (warning, this wave): default-false include flag backs writable form.
  obs-2 is PROMOTION-ELIGIBLE and takes priority over HOLD candidates for the slot (it has
  met the 2-wave bar). If rule 7 amendment is preferred over rule 9, obs-2 affects rule 7
  scope rather than competing for slot 9.

**Competing PRODUCT-PRINCIPLES rule-4 candidates (all HOLDs — no change this wave):**
  - wave-35 obs-1 (strong, 7-wave HOLD): privacy-theater identical-behavior selector.
  - wave-40 obs-1 (strong, 2-wave HOLD): T-8-sourced fix mechanism contradicts live decision.
  All others at warning severity remain HOLD; no new PRODUCT-PRINCIPLES candidate this wave.

---

## L-2 promotion disposition (wave-42) — pending karen vetting

**obs-2 → BUILD rule 7 scope amendment (or rule 9):** PROMOTE-ELIGIBLE. Second failure
instance. karen to vet candidate rule shape and approve or redirect to rule 7 amendment.

**obs-5 → T-5.md new rule:** PROMOTE-ELIGIBLE. Second instance. karen to vet candidate
rule shape; head-tester approval required for T-5 layer.

**obs-1, obs-3, obs-4 → BUILD rule 9 first-instance HOLDs:** No promotion. karen to note
the three new slot-9 entrants behind the existing priority queue.

---
## L-2 promotion disposition (wave-42) — 1 promotion
karen vetted 2 promotion-eligible candidates:
- **obs-5 → T-5 rule 2 (Playwright MCP .mcp.json persistence):** APPROVE → PROMOTED (linter PASS after 1 cap-1 rewrite). Scoped to the non-dup delta vs rule 1 (persist the fix, not re-teach the bypass). 2nd consecutive-wave instance.
- **obs-2 → BUILD/CI (lint-before-push for test files):** REJECT — near-dup of existing BUILD rule 7 + CI rule 4 (both already prescribe running the linter, not just typecheck/formatter, before code leaves the author). Under append-only, the right fix is an in-place scope edit of BUILD rule 7 at head-builder's discretion, not an L-2 net-new near-dup. Recurrence bar met but binary/new bar fails.
- obs-1 (integration-specs-deferred-to-T4), obs-3 (id-contract-drift), obs-4 (data-loss-include-flag): first-instance HOLDs → future synthesis.
