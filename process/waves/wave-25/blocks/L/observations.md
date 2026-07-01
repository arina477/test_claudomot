# Wave 25 — L-2 Distill Observations

Synthesized from wave-25 artifacts (M5 mention parser parity + editMessage atomicity:
shared slug grammar, CJS-avoidance mirror + parity contract test, editMessage db.transaction,
real-PG rollback integration spec; PR#37 dbe55a2; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{20,21,22,23,24}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (6 rules, rule 6 promoted w23), CI-PRINCIPLES (5 rules,
rule 5 promoted w24), PRODUCT-PRINCIPLES (1 rule), VERIFY-PRINCIPLES (1 rule),
T-1.md (0 rules), T-4.md (0 rules), T-5.md (0 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      BUILD-PRINCIPLES rule 6 ("B-block specialists run the formatter on all touched files
      before reporting done, not only typecheck") was correctly followed this wave: the B-2
      specialist ran `biome format --write` on new files before reporting. However, `biome
      format --write` does NOT run the `organizeImports` linter pass; only `biome check --write`
      (or `biome ci`) does. B-4 wiring caught a `biome ci` organizeImports failure
      (import sort order in `edit-message-mentions-rollback.spec.ts`) that `biome format --write`
      passed. The specialist followed rule 6 as literally written yet the wiring stage still
      caught a lint-gate failure — the rule's "formatter" phrasing is too narrow. The precise
      local equivalent of the CI gate is `biome check` (format + organizeImports + lint in one
      pass), not `biome format` alone. This is a new sub-class of the format-drift recurrence
      pattern: format-clean but organizeImports-dirty. B-4 L-block candidate note explicitly
      names this refinement: "run `biome check` (format + organizeImports + lint), not
      `biome format` alone." Near-dup check against BUILD rule 6: rule 6 says "formatter" which
      specialists interpreted as `biome format`; this candidate proposes tightening the
      instruction to the full check command that matches the CI gate.
    source:
      - process/waves/wave-25/stages/B-4-wiring.md
        # "biome format --write (run by the B-2 specialist per BUILD rule 6) does NOT run
        #  organizeImports; the biome ci gate does. Format-only local verify masked a
        #  lint-gate failure."
        # L-block candidate: "run biome check (format + organizeImports + lint), not
        #  biome format alone"
        # drift_defects: [{kind: organizeImports lint-gate failure, stage: B-2}]
      - process/waves/wave-25/stages/B-5-verify.md
        # "biome check --write applied by specialists during B-4/B-5 defect fixes"
      - command-center/principles/BUILD-PRINCIPLES.md rule 6
        # "B-block specialists run the formatter on all touched files before reporting done,
        #  not only typecheck." — wave-23 promoted rule; "formatter" interpreted as
        #  biome format, which does not include organizeImports.
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      Rule 6 was followed literally (biome format --write ran) yet the wiring stage caught
      an organizeImports drift on a NEW spec file authored this wave. This is a first
      instance of the organizeImports sub-class. Earlier format-drift instances (w19, w22,
      w23 x2) were all pure formatting errors caught before or at CI; none involved
      organizeImports specifically. BUILD rule 6 exists (promoted w23) and was applied;
      this candidate proposes a precision refinement to the rule's command specification
      rather than a new rule. Whether this surfaces as a rule 6 amendment or a new BUILD
      rule is karen's call; the falsifiable check is identical: did the specialist run
      `biome check` (matching the CI gate) or only `biome format`?
      BUILD-PRINCIPLES has 6 rules; slot 7 open.
      Near-dup check: BUILD rule 6 (formatter before reporting done). This candidate
      directly qualifies rule 6's phrasing; it is either an amendment to rule 6 or a
      near-dup that is NOT independent enough to be a separate rule. Karen should assess
      amendment vs new rule.
    promotion_gates:
      generalizable: true
        # Applies to any project using biome where `biome format` and `biome ci` diverge
        # on the organizeImports pass. More broadly: the CI gate command (biome ci / biome
        # check) is the canonical local check; a subset command (biome format) is not
        # sufficient even if the formatter runs.
      falsifiable: true
        # Checkable at any B-block specialist deliverable: did the deliverable cite
        # `biome check` (or the project's full CI-equivalent command) rather than
        # `biome format`? A deliverable citing only `biome format --write` fails the
        # refinement even if it cites BUILD rule 6 compliance.
      cited: true
        # B-4-wiring.md (classification, L-block note, drift_defects organizeImports);
        # B-5-verify.md (biome check --write applied in fix cycle);
        # BUILD-PRINCIPLES.md rule 6 (existing rule; this candidate refines it).
    candidate_rule_shape: >
      Amendment to BUILD rule 6: replace "formatter" with "biome check --write" (or
      project's full CI-equivalent lint command), making explicit that format + lint +
      organizeImports all run together.
      OR if karen treats as separate rule:
      7. Run the full CI lint command (biome check) on new files before reporting done,
         not only the format subcommand.
         Why: The formatter alone skips the organizeImports pass that the CI gate enforces.
      Rule line = 99 chars; why line = 72 chars. No forbidden tokens.
    promotion_requires: karen vet (rule quality; amendment vs new rule decision) +
      head-builder sign-off (domain applicability).
    promotion_status: >
      CANDIDATE (first instance of organizeImports sub-class). Wave-23 obs-1 had 4 format-
      drift instances before promotion; this candidate proposes a precision refinement on an
      existing rule rather than a new pattern. Karen may fast-track as an amendment (not
      subject to 2-wave bar for refinements to existing rules) or hold for a second instance.

  - id: obs-2
    summary: >
      Copying a fault-injection wrapper between integration specs is unsafe when the SUT's
      pg-pool connection style differs. wave-25 editMessage integration spec copied
      `wrapPoolConnect` from `create-server-rollback.spec.ts`; the wrapper only handled the
      Promise-style `pool.connect()` path (createServer's pattern), but editMessage calls
      `pool.query()` for pre-transaction SELECTs, which routes through `connect(cb)` (callback
      style). The wrapper never intercepted the callback path, so the rollback spec hung at
      the first pre-flight SELECT (5000ms CI timeout on the first CI run). C-1 fix `a730caf`
      added dual-convention support. editMessage has no production hang risk; the bug was
      purely in the test harness. The generalizable lesson: a fault injector that wraps a pool
      connection method must handle both the Promise and callback-style `connect()` conventions,
      OR the spec should inject a real database-level failure (constraint, trigger) that fires
      inside the transaction rather than at the pool layer.
    source:
      - process/waves/wave-25/stages/C-1-pr-ci-merge.md
        # "Root cause = test-harness bug: editMessage runs 4 SELECTs OUTSIDE the transaction
        #  that route through pg-pool's callback-style pool.query()→connect(cb); the
        #  fault-injection wrapper only handled the Promise-style connect() path → hung on
        #  the first pre-flight SELECT before the txn opened."
        # "Fix a730caf: dual-convention support in the fault injection; no production code
        #  changed."
        # L-block candidate: "Copying a fault-injection harness pattern (wrapPoolConnect)
        #  across specs is unsafe when the SUT's query shape differs."
      - process/waves/wave-25/stages/T-4-integration.md
        # "a prior CI cycle caught it hanging at 5000ms → fixed in a730caf"
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-4.md
    recurrence: >
      First instance of the pg-pool-convention-mismatch fault-injection class. T-4.md has
      0 rules; slot 1 open. No prior L-2 observation records this class. HOLD. Promote to
      T-4 rule 1 if a second wave has an integration spec fault-injector that mismatches the
      SUT's pg-pool connection style (Promise vs callback-style connect) OR if a fault
      injector that wraps the pool layer hangs/misfires on first CI run for the same reason.
      Broadened falsifiable shape: at T-4 for any spec using a pool-level fault wrapper,
      does the spec verify that the wrapper handles BOTH pg connect conventions?
      Near-dup check: T-4.md (0 rules), CI-PRINCIPLES (no rule on test-harness portability).
      No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any project using node-postgres (pg) where a test harness wraps
        # pool.connect() for fault injection. The two conventions (Promise-style and
        # callback-style via pool.query) are both present in the pg API and both are valid
        # application code patterns.
      falsifiable: true
        # Checkable at T-4 for any spec using a pool-level connect wrapper: does the
        # wrapper stub both the async/promise path AND the callback path? A wrapper that
        # only stubs one path fails this rule if the SUT uses the other in the same call
        # chain.
      cited: true
        # C-1-pr-ci-merge.md (root cause, fix a730caf, L-block candidate);
        # T-4-integration.md (CI timeout 5000ms, first-execution evidence).
    candidate_rule_shape: >
      1. When fault-injecting at the pg-pool layer, stub both the Promise and callback
         connect() conventions.
         Why: pool.query() uses callback-style connect; a Promise-only stub hangs on
         pre-transaction queries.
      Rule line = 95 chars; why line = 75 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to T-4 rule 1 on second confirming wave.

  - id: obs-3
    summary: >
      This project's Railway services deploy ONLY via CLI image push (`railway up`), NOT via
      git-auto-deploy. Squash-merging to main triggers no Railway deploy. C-2 first-verification
      found both services serving 200 on /health from ~10h-old pre-`dbe55a2` revisions — a
      stale-health-check false-green. CI-PRINCIPLES rule 1 (deployment-state + commit-freshness
      correlation, not /health alone) surfaced it: /health has no commit or uptime field, so
      /health-only would have false-passed. Resolution required `railway up --service <api|web>`
      from current HEAD for both services. The C-2 stage explicitly flags this as a HIGH-value
      cross-wave observation: "THIS project's Railway services have NO git trigger — a merge to
      main does NOT deploy. C-2 must actively railway up each service." Deployment-mechanism
      understanding is distinct from deployment-state verification (CI rule 1): rule 1 tells
      you HOW to verify; this candidate tells you WHAT action triggers a deploy (the mechanism).
    source:
      - process/waves/wave-25/stages/C-2-deploy-and-verify.md
        # "Root cause: these Railway services deploy ONLY via CLI image push (railway up,
        #  cliCaller=claude_code), NOT git-auto-deploy — the squash-merge to main triggered
        #  no deploy."
        # "head-ci-cd correctly REFUSED to serviceInstanceRedeploy (would re-ship the stale
        #  image green). CI-PRINCIPLES rule 1 (deployment-state + commit correlation, not
        #  /health alone) is what surfaced it."
        # L-block candidate: "THIS project's Railway services have NO git trigger —
        #  HIGH value — cross-wave."
        # "note: First-verification caught a stale-revision false-green (services deploy via
        #  railway up CLI, not git trigger)"
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      First L-2 instance of the "no-git-trigger deploy mechanism" class. project.yaml's
      deploy_targets is the project-owned source of the CLI-push fact. The CI-PRINCIPLES
      rules section has 5 rules; slot 6 open. Near-dup check against existing rules:
      CI rule 1 (deployment-state via platform endpoint, not /health): addresses the
      VERIFICATION method. This candidate addresses the DISPATCH trigger (merge to main
      does not deploy; must railway up). Complementary; not redundant.
      CI rules 2-5 address route probing, gh-run-watch, formatter, integration-executed-count.
      No near-dup found. HOLD at first instance. Promote if a future C-2 stage catches a
      stale-deploy false-green caused by assuming a git trigger that does not exist, or if
      the Railway CLI-push-only configuration changes and a C-2 stage incorrectly assumes
      the old trigger.
    promotion_gates:
      generalizable: true
        # Applies to any project whose CI/CD platform does not auto-deploy on git push/merge;
        # the pattern is common on Railway (self-hosted image push model) and any platform
        # configured for explicit CLI deploys. The falsifiable check is: does C-2 actively
        # invoke the deploy command, or does it assume deployment happened automatically?
      falsifiable: true
        # Checkable at C-2: did the orchestrator explicitly invoke the platform deploy
        # command (railway up, fly deploy, etc.) for each changed service, AND verify
        # the resulting deployment-state ID post-dates the merge commit? Assuming the merge
        # auto-deployed without checking deployment-state timestamps fails this rule.
      cited: true
        # C-2-deploy-and-verify.md (root cause, mechanism, L-block candidate note,
        #   deployment-state freshness verification — both services caught as stale);
        # CI-PRINCIPLES.md rule 1 (complementary: what C-2 caught the gap with).
    candidate_rule_shape: >
      6. Explicitly invoke the deploy command per changed service at C-2; never assume a
         merge auto-triggered a deploy.
         Why: Some platform configs deploy only on explicit CLI push; a merged branch leaves
         the prior revision live.
      Rule line = 107 chars; why line = 77 chars. No forbidden tokens.
    promotion_requires: karen vet (rule quality) + head-ci-cd sign-off (domain applicability).
    promotion_status: >
      HOLD. First instance. The C-2 stage's explicit "HIGH value — cross-wave" flag and the
      fact that CI rule 1 alone would not have prevented the stale-deploy trap (only the
      deployment-state freshness correlation did) support eventual promotion. Karen and
      head-ci-cd to assess at second confirming wave.

  - id: obs-4
    summary: >
      The CJS-only `@studyhall/shared` package cannot export runtime VALUES to the vite/web
      production bundle. When `apps/web/src/shell/MessageList.tsx` imported
      `extractMentionSlug` (a runtime function) directly from `@studyhall/shared`, typecheck
      and vitest passed (they resolve .ts source / handle CJS), but the vite/rollup bundler
      failed: `cjs-module-lexer` cannot resolve the `Object.defineProperty` re-export getter.
      The fix — already a documented codebase convention (`messagingSocket.ts:32-40`) — is to
      mirror runtime constants/functions locally in the web app and enforce parity via a
      contract test that imports both the shared original and the local mirror. Only TYPES
      (interfaces, type aliases) are safely importable from `@studyhall/shared` into web; any
      runtime value import must be mirrored. This was a B-3 defect caught only at the
      production build step, not at typecheck or unit test. The parity contract test
      (`mention-slug-parity.test.ts`) is the durable enforcement: a single-source drift
      breaks CI rather than silently diverging.
    source:
      - process/waves/wave-25/stages/B-5-verify.md
        # "Build defect found + resolved (B-3 re-entry). Initial B-5 build FAILED: vite/rollup
        #  could not resolve the runtime value extractMentionSlug from the CJS-only
        #  @studyhall/shared (cjs-module-lexer misses the Object.defineProperty re-export
        #  getter). Typecheck/vitest passed (they resolve source .ts / handle CJS) — only the
        #  production bundler hit it."
        # "Classification: build tag → B-3 defect. Root cause: the web bundle cannot import
        #  runtime VALUES from the CJS shared package; the codebase has a documented
        #  'CJS avoidance pattern' (messagingSocket.ts:32-40) — web imports types only,
        #  mirrors runtime constants locally."
      - process/waves/wave-25/stages/V-1-jenny.md
        # "Implementation nuance (NOT a drift): the client does not literally import the
        #  runtime value from @studyhall/shared; it uses a physical mirror at
        #  apps/web/src/shell/mentionSlug.ts... This is a documented CJS-avoidance pattern
        #  (shared is CJS-only; vite/rollup cjs-module-lexer cannot resolve the value export
        #  through the Object.defineProperty re-export getter — same established convention
        #  as messagingSocket.ts)."
      - process/waves/wave-25/stages/B-6-review.md
        # "Approach deviation (client web-local mirror + parity test vs direct shared import)
        #  BLESSED as proportionate to the documented CJS-avoidance convention."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      First L-2 instance of the CJS-shared-value-to-vite-web class. The codebase has a
      prior instance (messagingSocket.ts:32-40) that established the convention, but it was
      never surfaced as a BUILD principle. Wave-25 is the first time a B-3 spec violated the
      convention and the violation was caught at the production build step. HOLD. Promote to
      BUILD-PRINCIPLES rule 7 (or inline with rule group) if a second wave has a B-block
      specialist import a runtime value from @studyhall/shared into the web app, causing a
      vite build failure.
      Near-dup check: BUILD rules 1-6. None addresses CJS/ESM shared package import
      constraints. No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any project with a CJS-only shared package consumed by a vite-bundled
        # web app. The failure mode (typecheck+unit green, prod build fails) is general:
        # any runtime value re-exported through Object.defineProperty is invisible to
        # cjs-module-lexer. The fix pattern (local mirror + contract test) is portable.
      falsifiable: true
        # Checkable at B-3 for any import from @studyhall/shared into apps/web: is the
        # import a TYPE (interface, type alias) or a runtime VALUE (function, const)?
        # A runtime value import from the CJS shared package into web fails this rule;
        # the required pattern is local mirror + parity contract test.
      cited: true
        # B-5-verify.md (build defect, classification, root cause, CJS-avoidance convention
        #   reference, fix commit 53162de);
        # V-1-jenny.md (CJS-avoidance documented, cjs-module-lexer explanation, parity test);
        # B-6-review.md (approach deviation blessed).
    candidate_rule_shape: >
      7. Import only types from a CJS-only shared package into the web bundle; mirror
         runtime values locally and enforce parity with a contract test.
         Why: vite/rollup cjs-module-lexer cannot resolve Object.defineProperty re-exports
         at build time.
      Rule line = 107 chars; why line = 82 chars. No forbidden tokens.
    promotion_status: HOLD. First instance (prior codebase instance pre-dates L-2 tracking).
      Promote to BUILD-PRINCIPLES rule 7 on second confirming wave (another B-block spec
      importing a runtime value from @studyhall/shared into web, failing the build step).

  - id: obs-5
    summary: >
      Playwright MCP chrome-channel-absent blocked T-5 for the fourth confirmed UI wave
      (wave-16 task 67881a58 opened, wave-22, wave-23, wave-25). Wave-24 was test-only with
      no Playwright work. The validated operational substitute is now confirmed across multiple
      waves: drive the bundled chromium directly via the installed `playwright-core` module
      (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) without issuing
      `browser_close` against the idle MCP instances. T-5 completed successfully this wave
      using that path (4/4 scenarios PASS, both passes, zero flakes). The T-5 principles file
      has 0 rules; the validated fallback is a T-5 process rule candidate. Wave-23 obs-3
      noted "No principles rule applicable — this is an operational infra issue." This
      re-assessment: the bundled-chromium path via playwright-core is not operational
      improvisation — it is a documented, repeatable, validated substitute that every T-5
      tester should know to reach for when the MCP chrome channel is absent. A T-5 rule
      encodes that validated substitute so future testers do not report BLOCKED or abort.
    source:
      - process/waves/wave-25/stages/T-5-e2e.md
        # "All 10 Playwright MCP instances fail at browser launch: Chromium distribution
        #  'chrome' is not found at /opt/google/chrome/chrome."
        # "I drove the validated bundled Chromium (~/.cache/ms-playwright/chromium-1228/
        #  chrome-linux64/chrome) directly via the installed playwright-core module.
        #  Rendering path (React client tokenizer + MentionPill) is identical to what the
        #  MCP would exercise; only the driver differs. No browser_close was issued against
        #  any MCP instance (they never launched a context)."
        # All 4 scenarios PASS on both passes. Zero flakes.
      - process/waves/_archive/wave-23/blocks/L/observations.md obs-3
        # Task 67881a58 open since wave-16; 3rd+ UI wave blocked; no principles rule
        #  recorded (treated as operational infra issue only).
    severity: informational
    candidate_principles_file: command-center/principles/test-layer-principles/T-5.md
    recurrence: >
      CONFIRMED 4-INSTANCE PATTERN (UI waves with Playwright MCP chrome-absent):
        wave-16: task 67881a58 created (first occurrence).
        wave-22: F22-T-5 noted (second occurrence).
        wave-23: F23-T-5, V-2 founder-digest escalation; wave-23 obs-3 INFORMATIONAL.
        wave-25: bundled chromium executed successfully (4th occurrence; substitute validated).
      T-5.md has 0 rules; slot 1 open. The bundled-chromium path is the confirmed substitute
      (renders the same DOM; only the driver differs). No `browser_close` against idle MCP
      instances is the existing always-on rule (CLAUDE.md § Always-on rules rule 5) and
      must be maintained. Near-dup check: T-5.md (0 rules), no prior observations encode
      the bundled-chromium substitute. No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any T-5 tester on a host where Playwright MCP defaults to the
        # chrome channel and /opt/google/chrome/chrome is absent. The bundled chromium
        # path (~/.cache/ms-playwright/chromium-N/chrome-linux64/chrome) is the
        # consistent fallback when npm package playwright-core is installed.
      falsifiable: true
        # Checkable at T-5: when all MCP playwright instances fail at browser launch
        # citing the chrome channel, did the tester attempt the playwright-core bundled
        # chromium path before reporting BLOCKED? Reporting BLOCKED without attempting
        # the bundled-chromium substitute fails this rule.
      cited: true
        # T-5-e2e.md (chrome-absent symptom, bundled-chromium path, no browser_close,
        #   4/4 scenarios PASS both passes, zero flakes);
        # wave-23 obs-3 (3rd instance, INFORMATIONAL; did not encode rule).
    candidate_rule_shape: >
      1. When MCP Playwright instances fail on the chrome channel, fall back to bundled
         chromium via playwright-core; never issue browser_close on unstarted instances.
         Why: The chrome channel binary is absent on most CI hosts; bundled chromium
         provides identical DOM rendering.
      Rule line = 118 chars; why line = 74 chars. No forbidden tokens.
    promotion_requires: karen vet (rule quality) + head-tester sign-off (domain applicability).
    promotion_status: >
      CANDIDATE — 4-instance recurrence met; validated operational substitute confirmed;
      T-5.md has 0 rules (slot 1 open). Wave-23 obs-3 was INFORMATIONAL (no rule proposed);
      wave-25 advances it to a promotion candidate by confirming the substitute path works
      and arguing it belongs in T-5 as process knowledge, not just an infra note.
      Pending karen reassessment + head-tester vet.
```

---

## Wave-25 L-2 distill disposition

**obs-1 (BUILD rule 6 precision refinement: `biome check` vs `biome format`) — WARNING CANDIDATE.**

BUILD rule 6 (promoted w23) was correctly followed but the "formatter" phrasing led the specialist to run `biome format --write`, which does not run `organizeImports`. B-4 caught an organizeImports import-order lint failure. The CI gate (`biome ci`) and `biome check` both run organizeImports; `biome format` does not. This is a first-instance sub-class of the format-drift pattern that rule 6 was promoted to prevent. Karen to assess: amendment to rule 6 (replace "formatter" with "biome check") vs a new rule. If karen treats this as an amendment to an existing rule rather than a new 2-wave-evidence rule, it may proceed without a second confirming wave.

Candidate amendment to BUILD rule 6:
```
6. B-block specialists run `biome check --write` on all touched files before reporting done,
   not only typecheck.
   Why: Format drift then surfaces only at the wiring stage or in CI, costing an extra fix cycle.
```
OR new rule (if not an amendment):
```
7. Run the full CI lint command (biome check) on new files before reporting done,
   not only the format subcommand.
   Why: The formatter alone skips the organizeImports pass that the CI gate enforces.
```

---

**obs-2 (Fault-injection pg-pool convention portability: Promise vs callback-style connect) — WARNING HOLD.**

First instance: `wrapPoolConnect` copied from createServer spec into editMessage spec; wrapper only handled Promise-style `connect()` but editMessage's pre-txn SELECTs use callback-style `pool.query()→connect(cb)`. Spec hung 5000ms on first CI run. T-4.md has 0 rules; slot 1 open. HOLD. Promote to T-4 rule 1 on second confirming wave.

---

**obs-3 (Railway CLI-push-only deploy mechanism: merge to main does NOT deploy) — WARNING HOLD.**

First L-2 instance. C-2 caught a stale-revision false-green on both services because the project deploys ONLY via `railway up` CLI, not git-trigger. CI rule 1 (deployment-state + freshness correlation) surfaced it. This candidate targets the DISPATCH trigger (not the verification method). CI-PRINCIPLES has 5 rules; slot 6 open. HOLD. Promote to CI-PRINCIPLES rule 6 on second confirming wave.

---

**obs-4 (CJS shared package: runtime values cannot be imported into vite/web bundle) — WARNING HOLD.**

First L-2 instance. B-3 violated the documented CJS-avoidance convention (`messagingSocket.ts:32-40`) by importing a runtime function from `@studyhall/shared` into `apps/web`. Typecheck and unit tests passed; production build failed (`cjs-module-lexer`). Fix: web-local mirror + parity contract test. BUILD-PRINCIPLES has 6 rules; slot 7 open. HOLD. Promote on second confirming wave.

---

**obs-5 (Playwright MCP chrome-absent: bundled chromium validated substitute — 4th UI wave) — INFORMATIONAL PROMOTION CANDIDATE.**

Task 67881a58 open since wave-16. Four confirmed UI waves blocked by chrome-channel-absent (w16, w22, w23, w25). Wave-25 validated the bundled-chromium fallback path (playwright-core, chromium-1228) — 4/4 scenarios PASS, zero flakes. T-5.md has 0 rules; slot 1 open. Wave-23 obs-3 was INFORMATIONAL (no rule). This candidate advances to a promotion candidate by encoding the validated substitute as a T-5 process rule.

Candidate rule for karen + head-tester to vet:
```
1. When MCP Playwright instances fail on the chrome channel, fall back to bundled
   chromium via playwright-core; never issue browser_close on unstarted instances.
   Why: The chrome channel binary is absent on most CI hosts; bundled chromium
   provides identical DOM rendering.
```
Rule line = 118 chars (within 120); why line = 74 chars (within 100). No forbidden tokens.

---

## Summary table

| id    | title (short)                                                            | severity      | recurrence           | disposition                                                                             |
|-------|--------------------------------------------------------------------------|---------------|----------------------|-----------------------------------------------------------------------------------------|
| obs-1 | BUILD rule 6 precision: biome check vs biome format (1st organizeImports) | warning       | 1 wave (rule refinement) | CANDIDATE — karen: amendment to rule 6 vs new rule 7; head-builder vet               |
| obs-2 | Fault-injection pg-pool Promise vs callback-style mismatch               | warning       | 1 wave               | HOLD — T-4 rule 1 candidate; promote on 2nd confirming wave                             |
| obs-3 | Railway CLI-push-only deploy: merge does not trigger deploy              | warning       | 1 wave               | HOLD — CI-PRINCIPLES rule 6 candidate; promote on 2nd confirming wave                  |
| obs-4 | CJS shared package: runtime values unresolvable by vite web bundler      | warning       | 1 wave               | HOLD — BUILD rule 7 candidate; promote on 2nd confirming wave                           |
| obs-5 | Playwright MCP chrome-absent: bundled-chromium substitute (4th UI wave)  | informational | 4 waves              | PROMOTE CANDIDATE to T-5 rule 1 (karen + head-tester vet)                               |

**Promotions this wave: 1 strong candidate (obs-5 to T-5 rule 1) conditional on karen + head-tester vet; 1 conditional candidate (obs-1, karen's amendment-vs-rule call); 3 HOLDs.**

**Dropped from the 6 strong signal candidates provided:**
- "CI-gated integration specs get their FIRST real execution in CI" — FOLDED into obs-2 (the hanging-on-first-CI-run aspect is caused by the harness portability bug, not a standalone class). The false-green guard working correctly (CI-rule-5 surfacing a TRUE red) is already captured as evidence in obs-2. Separately, CI-PRINCIPLES rule 5 already addresses the zero-execution false-green class; this wave's instance was a genuine red, not a false-green, so rule 5 is not gapped.
