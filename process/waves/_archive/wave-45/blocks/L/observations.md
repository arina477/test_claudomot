# Wave 45 — L-2 Distill Observations

Synthesized from wave-45 artifacts (M8 tech-debt hygiene: Playwright bundled-chromium config
fix + biome lint hygiene on useTyping.ts; PR squash-merged to main; V-block APPROVED).
Inputs read:
process/waves/wave-45/stages/P-1-decompose.md,
process/waves/wave-45/escalations/board-P-1-floor-merge-wave-45.md,
process/waves/wave-45/stages/B-3-frontend.md,
process/waves/wave-45/stages/B-5-verify.md,
process/waves/wave-45/stages/T-5-e2e.md,
process/waves/wave-45/stages/V-2-triage.md,
process/waves/wave-45/blocks/P/gate-verdict.md.
Prior archives consulted:
process/waves/_archive/wave-{40,41,42,43,44}/blocks/L/observations.md
(recurrence checks on browser-resolution config, --list false-green, lint-swap-vs-guard,
P-1 floor escalation pattern, and all prior held HOLDs).
Principles files read: BUILD-PRINCIPLES (9 rules), CI-PRINCIPLES (8 rules),
VERIFY-PRINCIPLES (2 rules), PRODUCT-PRINCIPLES (3 rules), T-5.md (2 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      Wave-45 fixed the Playwright bundled-chromium blocker at the CONFIG level rather
      than via per-invocation bypass. The fix has two parts: (a) `channel: undefined`
      added to all three playwright.config.ts project blocks (overrides the
      `...devices['Desktop Chrome']` spread's `channel:'chrome'` inherit); (b)
      `PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright` added to the `e2e` and
      `test:e2e` scripts in apps/web/package.json, overriding an ambient root-owned
      path at session scope. The fix is committed and applies to every invocation path
      (bare `npx playwright test`, `pnpm --filter @studyhall/web e2e`, future CI scripts)
      without requiring any per-session bypass or .mcp.json patch.

      T-5 rules 1 and 2 (promoted wave-42) encode the bypass protocol: rule 1 = "on MCP
      launch failure, drive bundled chromium directly"; rule 2 = "after bypass, write the
      browser flag into .mcp.json before exit." The wave-45 fix makes the bypass protocol
      unnecessary going forward — browser resolution now lives in the committed config, not
      ambient env or session-level patches.

      The generalizable class: when a Playwright runner's browser resolution fails due to
      ambient env or per-invocation config gaps, the correct resolution is to own the
      browser path in the committed config files (playwright.config.ts + the e2e script's
      env), not to patch around it per-session. A config file that does NOT explicitly
      neutralise an ambient `PLAYWRIGHT_BROWSERS_PATH` may resolve the correct browser in
      an expected environment but silently fail when the ambient path is wrong.

      Near-dup check against T-5 rule 1 ("On Playwright MCP launch failure, drive the
      bundled chromium directly"): rule 1 addresses the bypass recovery action; this obs
      addresses the preventive fix (own it in config). Complementary, not a near-dup.

      Near-dup check against T-5 rule 2 ("After the MCP-failure bypass, write the browser
      flag into .mcp.json before exit"): rule 2 addresses the .mcp.json session persistence
      after a bypass; this obs addresses the committed-config ownership that eliminates the
      need for bypasses. Complementary — rule 2 ensures the bypass is not rediscovered;
      this obs's candidate rule ensures the config is the source of truth so bypasses are
      not needed.

      Near-dup check against BUILD-PRINCIPLES rules 1-9: no existing rule addresses where
      browser path resolution must live in the committed test config. No near-dup.

      Near-dup check against CI-PRINCIPLES rules 1-8: no existing rule addresses test-runner
      browser resolution in committed config. No near-dup.

      FIRST RECORDED INSTANCE of "Playwright runner's ambient PLAYWRIGHT_BROWSERS_PATH
      silently resolves the wrong (root-owned, unreadable) browser; fix: neutralise the
      ambient path and set the correct base dir in the e2e package.json script +
      channel:undefined in playwright.config.ts."

      Note: the wave-42 T-5 obs-5 (PROMOTED to T-5 rule 2) recorded the .mcp.json patch
      as the session-persistence fix. That rule covered the MCP path. The wave-45 fix
      addresses the canonical entry (`pnpm --filter @studyhall/web e2e`) — the config-level
      prevention that makes both T-5 rules 1 and 2 unnecessary when the committed config
      is correct.
    source:
      - process/waves/wave-45/stages/B-3-frontend.md
        # "B-3 REWORK: ambient `PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright` points at
        #   root-owned 0700 browsers (unreadable); the user-owned browsers are in
        #   `~/.cache/ms-playwright`. Fix: added `PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/
        #   ms-playwright` to apps/web/package.json `e2e`/`test:e2e` scripts."
        # "devops-engineer: `channel: undefined` override instead of `Desktop Chromium`
        #   device (absent in v1.61.1). ADJUDICATED: accepted — idiomatic + durable."
      - process/waves/wave-45/stages/B-5-verify.md
        # "FIRST run FAILED (browsers-path defect) → B-3 rework → RE-RUN: 2/2 chromium-
        #   smoke specs launched + passed on bundled chromium against live."
      - process/waves/wave-45/stages/T-5-e2e.md
        # "Ambient `PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright` was SET in the shell
        #   (the broken value the fix must neutralise). Bundled chromium present at
        #   `~/.cache/ms-playwright/chromium-1208` + `chromium-1228`."
        # "Browser LAUNCHED on bundled chromium despite ambient broken PLAYWRIGHT_BROWSERS_PATH."
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-5.md
      # Target: T-5 rule 3 (open slot). The candidate rule is complementary to rules 1+2:
      # rules 1+2 encode the bypass protocol; rule 3 would encode the prevention (own
      # browser resolution in the committed config). The distinction is meaningful:
      # rules 1+2 are recovery; rule 3 is prevention. A project that follows rule 3
      # should never need rules 1+2.
    recurrence: >
      FIRST RECORDED INSTANCE of the "committed playwright config does not own browser
      resolution; ambient PLAYWRIGHT_BROWSERS_PATH silently resolves wrong browser" class.

      Background context: waves 41-43 all used the executablePath bypass + .mcp.json patch
      (T-5 rules 1+2 applied). Wave-45 is the first wave where the ROOT FIX was made to the
      committed config, eliminating the need for the bypass going forward. This is a
      prevention-class obs, not a recurrence of the bypass class.

      HOLD. First instance of the "prevent via committed config" class. Promote on a second
      confirming wave where (a) a Playwright runner's browser resolution is broken by ambient
      env and the fix is correctly made to the committed config, OR (b) a committed config
      that lacks PLAYWRIGHT_BROWSERS_PATH override causes a browser-resolution failure.
    promotion_gates:
      generalizable: true
        # Applies at any T-5 or B-5 stage for a Playwright project where browser
        # resolution relies on ambient env vars or per-session config instead of the
        # committed playwright.config.ts and package.json e2e script. Check: does
        # playwright.config.ts have `channel: undefined` (or explicit launch options)
        # per project? Does the e2e script in package.json export
        # PLAYWRIGHT_BROWSERS_PATH to the user-owned browser cache? A config that
        # doesn't own these settings silently depends on the session environment.
      falsifiable: true
        # Checkable at B-5 or T-5: run `pnpm --filter @studyhall/web e2e` in a shell
        # where `PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright` (or any non-existent path)
        # is set. If the runner fails to launch, the config does not own browser resolution.
        # Pass condition: the test runs with the correct bundled browser regardless of
        # ambient PLAYWRIGHT_BROWSERS_PATH.
      cited: true
        # B-3-frontend.md REWORK: "ambient PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
        #   points at root-owned 0700 browsers; user-owned browsers are in ~/.cache/
        #   ms-playwright. Fix: added PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright
        #   to apps/web/package.json e2e/test:e2e scripts."
        # T-5-e2e.md: "Browser LAUNCHED on bundled chromium despite ambient broken
        #   PLAYWRIGHT_BROWSERS_PATH. No channel/executable error, no bypass. Fix confirmed."
    candidate_rule_shape: >
      [target: T-5.md rule 3]
      Set browser resolution in the committed playwright config and e2e script env, not in
      session-level patches, so all invocation paths use the same browser.
      Why: An ambient PLAYWRIGHT_BROWSERS_PATH silently resolves a wrong browser on any
      invocation path that does not inherit a prior session's patch.
      Rule line = 116 chars; why line = 96 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The B-3 REWORK cost is documented (one fix cycle). The
      candidate rule is complementary to T-5 rules 1+2 (recovery) by addressing prevention.
      Watch for: any wave where Playwright browser resolution fails because the committed
      config does not neutralise an ambient PLAYWRIGHT_BROWSERS_PATH, OR where the browser
      resolution works in one invocation path (MCP) but not another (canonical pnpm entry).


  - id: obs-2
    summary: >
      After B-3 implemented the playwright.config.ts `channel: undefined` fix, the
      devops-engineer verified it by running `npx playwright test --list`: "enumerated
      5 tests, no 'channel chrome / executable doesn't exist' error." This passed. B-5
      smoke then ran the actual runner and FAILED: "Executable doesn't exist at
      /opt/ms-playwright/chromium_headless_shell-1228/..." The `--list` command
      enumerates test files and resolves config syntax without launching a browser; it
      does not exercise the browser binary path. A browser-resolution fix passes `--list`
      even when the browser binary is unreachable.

      The generalizable class: verifying a Playwright config or browser-resolution change
      via `playwright test --list` is insufficient — `--list` proves config syntax is valid
      but does not prove a browser would launch. The only faithful verification of a
      browser-resolution change is an actual test run that launches the browser.

      Near-dup check against BUILD-PRINCIPLES rules 1-9: no existing rule addresses the
      distinction between `--list` (syntax/enumeration check) and an actual test run
      (browser launch proof) for test-infra verification. Rule 4 (adversarial reproduction
      at B-6 Phase 2) addresses a different axis. No near-dup.

      Near-dup check against T-5 rules 1-2: neither rule addresses the --list false-green
      pattern. T-5 rule 1 addresses MCP launch failure recovery. No near-dup.

      Near-dup check against VERIFY-PRINCIPLES rules 1-2: rule 1 (verify seeding ACs by
      inspecting create-path source, not runtime behavior) is about AC seeding direction.
      Rule 2 (amend spec to match correct behavior) is about spec drift. Neither addresses
      test-infra verification method. No near-dup.

      FIRST RECORDED INSTANCE of "`playwright test --list` passes for a browser-resolution
      config change but the actual test run fails because `--list` does not launch the
      browser." The B-5 smoke is the correct catch-point for this class.
    source:
      - process/waves/wave-45/stages/B-3-frontend.md
        # "Verify: `npx playwright test --list` enumerated 5 tests, no 'channel chrome /
        #   executable doesn't exist' error; tsc clean for config."
        # (Initial verification; B-5 smoke subsequently failed with Executable doesn't
        #   exist despite this --list pass.)
        # "B-3 REWORK: B-5 smoke caught that `channel: undefined` alone was insufficient:
        #   launch failed with `Executable doesn't exist at /opt/ms-playwright/...`"
      - process/waves/wave-45/stages/B-5-verify.md
        # "Action 4 smoke: `pnpm/npx playwright test --project=chromium-smoke` — FIRST run
        #   FAILED (browsers-path defect) → B-3 rework → RE-RUN: 2/2 chromium-smoke specs
        #   launched + passed on bundled chromium against live."
        # "smoke_note: initial smoke caught the browsers-path defect → B-3 rework → re-run
        #   2/2 pass on bundled chromium"
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
      # Target: BUILD rule 10 (open slot). The obligation: verify a test-runner config
      # change by actually executing a test that exercises the changed layer (browser
      # launch), not by a syntax/enumeration check that bypasses that layer. This
      # generalizes beyond Playwright: any test-infra change that modifies a binary
      # resolution path, env var, or launch config must be verified by a run that
      # actually exercises that path.
    recurrence: >
      FIRST RECORDED INSTANCE of "test-infra config change verified by listing/enumerating
      tests (no binary launch); B-5 smoke run proves the binary resolution is wrong; fix
      required." No prior obs in waves 40-44 records this exact class.

      Near-dup check against BUILD rule 9 (integration spec in B-block): rule 9 addresses
      when to author integration specs, not how to verify a test-infra config change.
      Not a near-dup.

      HOLD. First instance. The cost is a B-3 REWORK cycle (devops-engineer spawned again;
      fix: add PLAYWRIGHT_BROWSERS_PATH override to package.json scripts). The candidate
      rule is falsifiable at any B-block stage: if the verification of a test-runner config
      change appears only as `--list` output (or equivalent enumeration command) with no
      actual test run, the check fails this rule. B-5 smoke is the correct catch-point.
    promotion_gates:
      generalizable: true
        # Applies at B-3/B-5 for any test-infra change that modifies browser resolution
        # (playwright.config.ts channel/executablePath, package.json e2e env), test-runner
        # launch config, or binary paths. The check: does the verification include an
        # actual test execution that launches the target binary? An invocation that only
        # lists/enumerates tests (playwright test --list, jest --listTests, or equivalent)
        # does not satisfy this check.
      falsifiable: true
        # Checkable at B-5 review: does the B-3 stage's "Verify" section include an
        # actual test run result (exit code, test count, browser launched)? A verify
        # section that shows only `--list` output or `tsc clean` for a browser-resolution
        # config change fails this check. Independent check: does B-5 smoke succeed on
        # the first run, or does it catch a defect that --list missed?
      cited: true
        # B-3-frontend.md: "Verify: `npx playwright test --list` enumerated 5 tests,
        #   no channel/executable error; tsc clean for config." (pre-rework)
        # B-5-verify.md: "FIRST run FAILED (browsers-path defect)" — confirmed that
        #   --list passed but actual launch failed.
    candidate_rule_shape: >
      [target: BUILD-PRINCIPLES rule 10]
      Verify a test-runner config change by running at least one test that exercises the
      changed binary path, not by listing tests or typechecking alone.
      Why: A listing command validates config syntax without launching the binary, so a
      wrong binary path passes enumeration but fails on actual launch.
      Rule line = 119 chars; why line = 97 chars. No forbidden tokens. No wave refs.
    promotion_status: >
      HOLD. First instance. The B-3 REWORK cost is documented (one extra devops-engineer
      spawn + package.json fix commit). The candidate rule is falsifiable at B-5 review.
      Watch for: any wave where a test-infra config change is verified by `--list`,
      `--dry-run`, `tsc`, or equivalent enumeration-only checks without an actual test
      execution, and B-5 or T-block subsequently catches a binary or launch failure.


  - id: obs-3
    summary: >
      Wave-45 is the 7th sub-floor P-1 escalation for this project (prior instances
      noted by founder-proxy at the BOARD: w16/21/23/24/25/26/27 and now w45; floor-merge
      wave-44 was the most recent). Each escalation results in unanimous or near-unanimous
      BOARD override-and-ship because the LOC/task-count floor rubric is a "thin-FEATURE
      guard, not a debt-wave guard" (industry-expert BOARD vote, wave-45). The LOC floor
      requires >2,500 net LOC or >=6 tasks for a multi-spec wave; a hygiene or infra wave
      that correctly scopes to a small-footprint fix will never reach this threshold.

      Assessment of project-side promotability:
      The floor rubric lives in `claudomat-brain/` (brain-owned, vendored, replaced on
      sync). A project-side PRODUCT-PRINCIPLES rule CANNOT change or override the rubric.
      The rubric fires correctly — its purpose is to prevent thin-feature slices, and the
      BOARD's override mechanism handles the infra/hygiene exception correctly each time.
      The question is whether there is a project-side behavior that a principle could
      improve. Two sub-cases:

      (a) "Don't force-bundle product scope to meet the floor" — this is implicit in the
      BOARD override process; wave-45's P-1 explicitly notes "MERGE-via-decomposition
      blocked (would front-run metric-barred M8 scope)" and escalates. The system already
      makes the correct call. A principle that says "escalate rather than bundle" is
      encoding the correct behavior but ALSO describing what the brain already does
      correctly; it would be documenting a non-problem.

      (b) "For an infra/hygiene wave below the LOC floor, escalate immediately without
      attempting MERGE" — this is valid as a project-specific convention that could save
      the MERGE assessment step for waves where MERGE is known to be blocked (as in
      wave-45, where the only un-built scope was metric-barred). However, this is a
      P-1 procedural optimization, not a principle about correct behavior.

      The BOARD's wave-45 carry-forward (counter-thinker: "wave-46 must NOT be a 3rd
      debt bundle — re-escalate M8 metric if still unanswered") is the actionable signal.
      That is an N-block carry-forward, not a promotable principle.

      ASSESSMENT: NOT a project-principles promotion candidate. The brain rubric is the
      correct fix target; the project cannot amend it. The BOARD override path works
      correctly. No project-side behavior needs encoding. Recording as informational
      cross-wave pressure for the brain rubric's future evolution.
    source:
      - process/waves/wave-45/escalations/board-P-1-floor-merge-wave-45.md
        # "7th floor-merge instance (w16/21/23-27)" — founder-proxy vote note.
        # "industry-expert: Give infra/hygiene a standing sub-floor carve-out."
        # "realist: Log biome task as lint-hygiene NOT crash-fix."
        # Wave-45 BOARD 7/7 unanimous override-and-ship (infra/hygiene carve-out).
      - process/waves/wave-45/stages/P-1-decompose.md
        # "MERGE-via-decomposition strategically blocked: M8's only un-built Scope is
        #   the metric-barred discretionary product scope deferred at wave-44 N-1."
        # "floor_merge_attempt: 0 — expansion assessed as inappropriate, floor
        #   disposition escalated directly."
    severity: informational
    candidate_principles_file: null
      # NOT a project-principles promotion candidate.
      # Brain-rubric issue. BOARD override works correctly. No project-side principle
      # encoding the correct behavior would add value over the existing escalation path.
    recurrence: >
      7TH SUB-FLOOR P-1 ESCALATION of the "infra/hygiene/test-debt wave below LOC floor;
      BOARD overrides with infra/hygiene carve-out" class. All 7 instances resolved
      correctly via BOARD override. This is a strong signal that the brain's LOC floor
      rubric needs an infra/hygiene exemption at the rule level, not a project-side
      workaround. The project cannot amend the brain rubric (vendored). Recording as
      cross-wave pressure on the brain rubric evolution; not a project-principles track.
    promotion_status: >
      NOT A PROJECT-PRINCIPLES PROMOTION CANDIDATE. The brain rubric is the correct fix
      target. The 7-instance pattern is strong evidence for a brain-side rubric amendment
      (infra/hygiene carve-out at P-1), but the project cannot make that change. The BOARD
      override path works correctly each time. Cross-wave pressure recorded here for
      lineage; no project-side principle encodes an improvement over the existing behavior.
```

---

## Prior held observations — second-instance status check (wave-45)

| origin | obs | class | wave-45 status |
|--------|-----|-------|----------------|
| wave-44 | obs-1 | Responsive/layout fix introduces overlay without full WCAG dialog contract; B-6 H1 a11y; modal-stacking regression caught at round 2 | NOT CONFIRMED. Wave-45 has no new overlay or dialog surfaces (pure config + lint hygiene). Remains 1-wave HOLD (BUILD rule 10 candidate). |
| wave-44 | obs-3 | T-block credential/session error filed without second-attempt repro verification; 3-wave strand | NOT CONFIRMED. No new T-block filing of a credential error. Remains 1-wave HOLD (VERIFY rule 3 candidate). |
| wave-43 | obs-2 | createSession missing weekly defensive guard; service-layer defense independent of Zod controller path | NOT CONFIRMED. No new service method with a controller-layer Zod guard but missing service-layer guard. Remains 2-wave HOLD (BUILD rule 9 adjacent). |
| wave-41 | obs-1 | V-3 redeploy false-green: unparameterized serviceInstanceDeployV2 on git-connected service | NOT CONFIRMED. No Railway redeploy in wave-45. Remains 4-wave HOLD (CI rule 7 scope amendment candidate). |
| wave-41 | obs-2 | Symbol-grep false-positive: canModerateMembers in old bundle from pre-existing component | NOT CONFIRMED. No V-1/V-3 bundle verification via symbol-name grep. Remains 4-wave HOLD (VERIFY rule 3 candidate). |
| wave-41 | obs-3 | Parallel-path enforcement gap: assertNotMuted on createMessage only; createReply unguarded | NOT CONFIRMED. No new enforcement gate on a primary write path. Remains 4-wave HOLD (BUILD rule 9 candidate). |
| wave-40 | obs-1 | T-8-sourced fix mechanism contradicts architectural decision made after the T-8 finding | NOT CONFIRMED. No T-8-sourced fix mechanism in scope. Remains 5-wave HOLD (PRODUCT rule 4 candidate, strong). |
| wave-40 | obs-4 | Global 22P02 filter does not cover text-column NUL-byte errors; text-keyed route params require per-route guards | NOT CONFIRMED. No new text-keyed route params. Remains 5-wave HOLD (BUILD rule 9 candidate). |

---

## Signals evaluated and dropped

**Signal: `!` → `as Typer` lint-hygiene swap (task 4e994e96):**
The biome refactor traded `typers[N]!.displayName` (non-null assertion) for
`(typers[N] as Typer).displayName` (type cast). Both are compile-only; byte-identical
output across all 5 buckets (V-2 karen confirmed). The devops-engineer B-3 note: "cast-
vs-guard is a lint-satisfying swap on already-safe code, acceptable for a hygiene wave."
The realist BOARD vote confirmed "lint-hygiene NOT crash-fix — the `!` sites are
length-guarded." The general class "prefer real type-narrowing over lint-suppression
swaps" is a real principle, but: (a) in this case `as Typer` WAS the correct choice
(destructure fails under noUncheckedIndexedAccess); (b) no prior obs records this class;
(c) the correct behavior was chosen. DROPPED — wave-specific execution choice, not a
principle class.

**Signal: P-1 floor rubric N/A for infra/hygiene waves (7th escalation):**
Evaluated in obs-3 above. NOT a project-principles candidate; brain-rubric issue only.
Recorded as obs-3 (informational, cross-wave pressure item).

**Signal: V-2 carry-forward note on "hardening superset of AC flagged then cleared as
non-drift" (noise suppression N2 pattern):**
V-2-triage.md explicitly noted: "N2 is a recurring 'shipped implementation is a
hardening superset of the AC, flagged then cleared as non-drift' shape — note for L-2,
not yet a promotion." This is a recurring noise pattern at V-2 (jenny flags behavior
that is MORE correct than the AC as drift; V-2 correctly suppresses it). It is not a
new promotion class: the correct disposal is the existing VERIFY-PRINCIPLES rule 2
("When deployed behavior diverges from spec AC and is more correct, amend the spec to
match"). N2 is a VERIFY rule 2 confirmation-by-application. DROPPED as standalone obs.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Browser resolution belongs in committed playwright config + e2e script env; ambient PLAYWRIGHT_BROWSERS_PATH silently resolves wrong browser; B-5 smoke is the catch-point | warning | 1st instance (prevention class; T-5 rules 1+2 cover bypass-recovery) | T-5.md rule 3 | HOLD — promote on 2nd confirming wave where config omission causes browser-resolution failure |
| obs-2 | `playwright test --list` passed for browser-resolution config change but actual launch failed at B-5 smoke; `--list` proves syntax not binary launch | warning | 1st instance | BUILD-PRINCIPLES rule 10 | HOLD — promote on 2nd confirming wave where enumeration-only check passes but actual binary launch fails |
| obs-3 | 7th P-1 sub-floor escalation for infra/hygiene wave; BOARD override correct each time; LOC floor rubric is brain-owned; no project-side principle addressable | informational | 7th instance (brain-rubric, not project-principle) | null (not a project-principles candidate) | NOT A PROJECT-PRINCIPLES CANDIDATE — brain-rubric issue; BOARD override works correctly; cross-wave pressure recorded |

**Observations emitted: 3 (obs-1, obs-2, obs-3)**
**Severities: 2 warning (obs-1, obs-2), 1 informational (obs-3)**
**Candidate files: T-5.md (obs-1), BUILD-PRINCIPLES (obs-2)**
**Promotion-eligible this wave: NONE (obs-1 and obs-2 are first-instance HOLDs; obs-3 is a non-candidate)**
**Dropped: `!` vs `as Typer` swap (correct choice in context; wave-specific); V-2 hardening-superset noise (VERIFY rule 2 confirmation); P-1 floor rubric (brain-owned, not project-principle)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave. Two first-instance HOLDs; one informational non-candidate.**

**obs-1** (T-5.md rule 3 candidate, warning severity) is the first instance of "the committed
playwright config does not own browser resolution; ambient PLAYWRIGHT_BROWSERS_PATH resolves
the wrong browser." The candidate rule is prevention-class (complementary to T-5 rules 1+2
which are recovery-class). The rule is falsifiable at B-5: run the canonical e2e entry in a
shell with a broken ambient PLAYWRIGHT_BROWSERS_PATH; if the runner fails, the config does not
own browser resolution. Watch for: any Playwright project where the e2e script does not
export PLAYWRIGHT_BROWSERS_PATH to the user-owned cache, or playwright.config.ts does not
have `channel: undefined` to neutralise the spread's inherited channel field.

**obs-2** (BUILD-PRINCIPLES rule 10 candidate, warning severity) is the first instance of
"`playwright test --list` passes for a browser-resolution config change but B-5 smoke fails
because `--list` does not launch the binary." The candidate rule is falsifiable at B-5 review:
does the B-3 verify section include an actual test run result for a test-runner config change?
A verify section showing only `--list` output fails the rule. Watch for: any wave where a
test-infra change (browser path, launch env, runner config) is verified by listing/dry-running
tests without an actual test execution.

**Head-builder action item (carried from wave-43/44):**
BUILD rule 7 scope edit — three failure instances of biome-ci-not-before-push (waves 38,
42, 43) + no new failure in waves 44/45 (wave-45 B-5 records `biome ci`: 0 fixes, 0
warnings). Karen's wave-42 ruling stands: in-place scope edit at head-builder's discretion.
This action item is carried unchanged. Wave-45 adds no new pressure on this item.

---
## L-2 promotion disposition (wave-45) — 0 promotions
No promotion-eligible candidates (both observations are first-instance HOLDs; obs-3 is a
non-candidate):
- obs-1 (browser-resolution in committed config): 1st instance → HOLD (T-5 rule 3 candidate;
  prevention-class complement to rules 1+2).
- obs-2 (--list false-green for browser-resolution change): 1st instance → HOLD (BUILD rule 10
  candidate; test-infra verification method).
- obs-3 (7th P-1 sub-floor escalation): NOT a project-principles candidate; brain-rubric issue;
  BOARD override correct.
karen NOT spawned (0 candidates per L-2 Action 5).
