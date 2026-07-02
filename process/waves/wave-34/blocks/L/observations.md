# Wave 34 — L-2 Distill Observations

Synthesized from wave-34 artifacts (M6 FINAL voice slice: screen-share + audio-only fallback;
PR #47 merge 87db7ec + PR #48 fast-fix merge 6ddaddb; V APPROVED after 1 fast-fix round that
also required a corrected redeploy).
Prior archives consulted: process/waves/_archive/wave-{30,31,32,33}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (8 rules), CI-PRINCIPLES (6 rules), VERIFY-PRINCIPLES
(2 rules, rule 2 promoted w31), PRODUCT-PRINCIPLES (3 rules, rule 3 promoted w32),
T-8.md (1 rule, rule 2 promoted w33).

---

```yaml
observations:

  - id: obs-1
    summary: >
      The V-3 fast-fix deploy of PR #48 (6ddaddb) reported CI green + Railway deployment
      SUCCESS with a new image digest, but the live web product was still serving the
      STALE pre-fast-fix bundle (zero occurrences of `audio-only-toggle-btn` in the served
      bytes). The gate passed falsely because it asserted only (a) deployment-state SUCCESS
      and (b) new digest != baseline digest — neither of which proves the MERGED SOURCE was
      actually built and is now being served. The underlying mechanism: the web Railway
      service is NOT git-connected (repoTriggers.edges = []). A GraphQL
      `serviceInstanceDeployV2` redeploy on a non-git-connected service re-builds the
      EXISTING source snapshot (the same pre-merge tree) into a fresh Docker image. This
      yields a genuinely new image digest and a new deployment id — both of which the gate
      treated as proof of a new build — but the served artifact contains none of the merged
      changes. Karen and jenny independently fetched the live `/assets/index-*.js` bundle
      and grepped it for the two fast-fix-unique markers (`audio-only-toggle-btn` /
      `Switch to audio-only`); both were absent (0/0) from the 1,557,244-byte stale bundle.
      A local production build of the 6ddaddb tree produced a distinct bundle hash that
      contained both markers (1/1). The correction: head-ci-cd used `railway up --service web`
      (CLI-push model — uploads and BUILDS the local tree from 6ddaddb) rather than a
      GraphQL snapshot redeploy. The corrected deploy yielded a real BUILDING→DEPLOYING→SUCCESS
      cycle (~65s) and a new bundle (`index-BkNvqunA.js`) with both markers present (1/1),
      independently re-confirmed by head-ci-cd, jenny, and head-verifier. The generalizable
      class: for any Railway service that is NOT git-connected, a GraphQL redeploy must
      never be used as the deploy mechanism, and a digest-diff gate is insufficient as the
      deploy-verification signal — the load-bearing check is whether a change-unique marker
      (from the merged source) is present in the bytes the live CDN/edge is actually serving.
    source:
      - process/waves/wave-34/stages/V-3-jenny-reverify.md
        # "Root cause of the false-green deploy: C-2 fast-fix gate asserted only new-image-digest
        #   != baseline; that does not prove a non-git redeploy incorporated the merged commit.
        #   No served-bundle content assertion ran."
        # "served_bundle: /assets/index-Bv_FSPoS.js — audio-only-toggle-btn: 0, Switch to
        #   audio-only: 0 — ABSENT — fast-fix not deployed."
        # "correct_build_of_source: local_dist_bundle index-B58rI52w.js — audio-only-toggle-btn: 1"
      - process/waves/wave-34/stages/V-3-karen-reverify.md
        # "served bundle index-Bv_FSPoS.js: audio-only-toggle-btn: 0 occurrences.
        #   Cross-check: fresh production build of 6ddaddb tree → bundle index-B58rI52w.js
        #   — grep shows audio-only-toggle-btn: 1, Switch to audio-only: 1. The code compiles
        #   into a bundle carrying the markers. The served bundle differs in hash and lacks them."
        # "V-3-fastfix-ci.md: deploy reason: 'redeploy', service_git_connected: false
        #   (repoTriggers.edges = []). A serviceInstanceDeployV2 call on a non-git-connected
        #   service redeploys the currently-configured source snapshot — it does not pull the
        #   newly-merged GitHub commit."
      - process/waves/wave-34/stages/V-3-fastfix-ci.md
        # "Genuine new build (not cached old revision): PASS — new image digest
        #   sha256:265659726b... != baseline sha256:d23f0a29..."
        # [This is the gate that was invalid. It asserted digest-diff, not content-in-served-bytes.]
      - process/waves/wave-34/stages/V-3-redeploy.md
        # "Root cause: web Railway service is NOT git-connected. A GraphQL
        #   serviceInstanceDeployV2 redeploy re-serves the existing source snapshot — it does
        #   NOT build the merged code. The prior digest-diff gate was INVALID: a snapshot
        #   rebuild yields a new digest from the SAME source, so 'digest changed' falsely read
        #   as 'new code shipped.'"
        # "served_bundle_before: index-Bv_FSPoS.js (markers 0/0 — stale false-green).
        #   served_bundle_after: index-BkNvqunA.js (markers 1/1 — fast-fix live)."
        # "served_bundle_content_assertion: PASS — the assertion that would have caught the
        #   original false-green."
      - process/waves/wave-34/blocks/V/gate-verdict.md
        # "False-green catch = WIN. The multi-reviewer system caught a deploy that would have
        #   shipped un-reachable code behind a green pipeline. Root-caused (non-git Railway
        #   service → GraphQL redeploy re-serves stale snapshot; digest-diff gate invalid)
        #   before any redeploy. Iron Law honored."
      - process/waves/wave-34/stages/V-3-fast-fix.md
        # "Non-git Railway services must deploy via railway up (CLI-push build), NOT a GraphQL
        #   snapshot redeploy; served-bundle content assertion (grep live /assets/index-*.js
        #   for a change-unique marker) > digest-diff."
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "non-git Railway service deployed via GraphQL snapshot redeploy
      yields a false-green: new digest from same source, change never shipped" class in L-2
      history.

      Memory note `railway-deploy-is-cli-push-not-git-trigger.md` already encodes the
      deploy-mechanism rule (railway up, not git-trigger). That note covers the MECHANISM
      (how to deploy); this observation covers the GATE (how to verify the deploy is real).
      The failure mode is: even when the mechanism is wrong, the gate passes — because it
      measures digest-diff (a property of the image) rather than content-in-served-bytes
      (the only property that proves the change reached users). The two lessons are
      complementary and distinct: the memory note prevents the wrong mechanism; this
      observation prevents the gate from failing to catch it when the wrong mechanism is used.

      The class is generalizable: applies at C-2 (or any V-3 fast-fix deploy gate) on ANY
      non-git-connected Railway service, OR more broadly on any platform where a "redeploy"
      or "rebuild from cache" operation can produce a new artifact identifier without
      incorporating newly-merged source. The canonical verification shape: after any deploy
      that was triggered (not git-pushed), fetch the live root HTML, extract the referenced
      JS bundle path, fetch that bundle, and assert that at least one string unique to the
      change is present in the bytes.

      Near-dup check against CI-PRINCIPLES rules 1-6: no existing rule addresses
      served-bundle content assertion as the deploy-verification step. CI rule 1 (deploy
      verification reads the Railway deployment-state endpoint, NOT /healthz) addresses
      which state to poll; this candidate adds a second dimension (the state can report
      SUCCESS while serving stale content — deployment-state alone is not sufficient).
      Different axis, no near-dup.

      Near-dup check against memory note `railway-deploy-is-cli-push-not-git-trigger.md`:
      the note says "run railway up per changed service at C-2." This observation says "even
      if you used the wrong mechanism, the gate MUST still assert served-bundle content, not
      just digest-diff." Orthogonal layers. No near-dup.

      Near-dup check against VERIFY-PRINCIPLES rules 1-2: neither addresses deploy-integrity
      verification. This candidate targets the C-2/deploy gate, not the V-1/V-2 review
      methodology. No near-dup.

      CI-PRINCIPLES has 6 rules; slot 7 open. HOLD.
      Promote to CI-PRINCIPLES rule 7 on second confirming wave where either:
        (a) a non-git Railway service is deployed via a mechanism that does not build from
            the merged commit, and the gap is caught at C-2 or V-block, OR
        (b) a deploy gate asserts only deployment-state + digest-diff for a non-git service,
            and a reviewer proves the served bundle lacks a change-unique marker.
    promotion_gates:
      generalizable: true
        # Applies at C-2 (or V-3 fast-fix re-deploy) for any Railway service where
        # the deploy is not triggered by a git push to a connected repo. The check:
        # after the deploy completes, fetch the live-served bundle/artifact and assert
        # a change-unique string is present in the bytes. The trigger signal: deploy reason
        # contains "redeploy" or is initiated via GraphQL serviceInstanceDeployV2 (not
        # railway up / not a git-connected trigger). Non-git services include any service
        # where repoTriggers.edges = [] in Railway's GraphQL schema.
      falsifiable: true
        # Checkable at C-2: after declaring the deploy done, fetch
        # `curl <live-root>` → extract the `src="/assets/index-*.js"` path → fetch that
        # bundle → grep for a string present in the diff but not in the prior bundle.
        # A C-2 stage that declares SUCCESS with only (a) deployments[0].status==SUCCESS
        # and (b) new imageDigest != old imageDigest, WITHOUT a served-bundle content
        # assertion, fails this rule for a non-git-connected Railway service.
      cited: true
        # V-3-jenny-reverify.md (served bundle index-Bv_FSPoS.js: 0/0 markers — false-green
        #   proved; correct local build index-B58rI52w.js: 1/1; gap = no content assertion);
        # V-3-karen-reverify.md (independent grep: 0 occurrences audio-only-toggle-btn;
        #   service_git_connected: false; serviceInstanceDeployV2 re-serves snapshot);
        # V-3-fastfix-ci.md (the failed gate: digest-diff PASS, no served-bundle grep;
        #   false-green origin artifact);
        # V-3-redeploy.md (corrected via railway up; served_bundle_content_assertion: PASS;
        #   BUILDING→DEPLOYING→SUCCESS cycle proves local tree actually built);
        # V/gate-verdict.md (false-green catch: root-caused before redeploy; Iron Law honored;
        #   L-2 carry flagged by head-verifier).
    candidate_rule_shape: >
      7. For non-git-connected Railway services, assert a change-unique marker is present in
         the served bundle after deploy; deployment-state SUCCESS + digest-diff is not sufficient.
         Why: A snapshot redeploy yields a new digest from the same source — a false-green that
         passes every deployment-state check while serving stale code.
      Rule line = 122 chars; why line = 100 chars. No forbidden tokens.
      Note: if linter enforces <120/100 chars, trim rule to "For a non-git Railway service,
      assert a change-unique marker in the served bundle; digest-diff alone is a false-green."
      (99 chars rule, 100 chars why — trim why to "A snapshot redeploy builds the same source
      into a new digest, serving stale code behind a green gate." = 89 chars.)
    promotion_status: HOLD. First instance. Promote to CI-PRINCIPLES rule 7 on second
      confirming wave where a non-git deploy gate passes on digest-diff while the served
      bundle lacks the change, or where a content assertion catches the gap.


  - id: obs-2
    summary: >
      The audio-only manual toggle was a named interaction requirement at three independent
      upstream layers (spec AC1 / mvp-thinner §audio_fallback_ac_61e52c3e / D-1 brief §6),
      but the D-2 aidesigner mockup silently omitted the control-cluster ENTRY toggle
      while rendering the BANNER states (auto/manual/restoring) that presuppose it. The
      D-3 gate reviewed the audio-only-state.html mockup against "all brief-declared
      in-scope states" and approved it — but did not check the mockup against brief §6's
      interaction/control requirement (a control-cluster toggle as the entry affordance).
      Because the D-3 gate checks STATES (are all brief-listed states rendered?) rather
      than INTERACTIONS (is every brief-listed control present?), the entry toggle omission
      was invisible to the gate rubric. B-3 faithfully implemented the adopted design and
      left `enterManual()` unwired with an explicit "future use" comment — the builder
      noted the design showed only the banner states, not the entry control. The gap was
      not caught until T-5 (live, un-invokable via any user path) and jenny V-1 (spec-DRIFT
      adjudication with the full 4-step provenance trace). Jenny's V-1 explicitly named the
      root as D-3: "neither reviewer checked the mockup against brief §6's control-cluster
      entry toggle — so the design shipped a self-inconsistent surface (satisfied its own
      §3 states, silently dropped its own §6 entry control)." The generalizable class: the
      D-3 gate must diff the adopted mockup against every NUMBERED BRIEF SECTION that names
      a control, interaction, or affordance (not only against the brief's state list), to
      catch a design that renders the resulting states but omits the user-reachable trigger
      that produces them.
    source:
      - process/waves/wave-34/stages/V-1-jenny.md
        # "D-2/D-3 design DRIFT — the origin of the miss. The adopted mockup
        #   audio-only-state.html rendered the banner permutations (auto/manual/restoring)
        #   and the restore control, but did NOT render the entry toggle in the control
        #   cluster. Its 'manual' state is shown as an already-entered state ('Trigger: User
        #   toggled video off') — the toggle that performs that entry was never designed.
        #   The D-3 gate reviewed the banner/restore states against brief §3/§4/§7/§9 and
        #   passed them, but neither reviewer checked the mockup against brief §6's
        #   control-cluster entry toggle."
        # "drift_origin: D-2/D-3 adopted design omitted brief-§6 control-cluster entry
        #   toggle; D-3 gate did not diff mockup vs brief §6; B-3 faithfully inherited
        #   the omission (enterManual built but unwired)"
        # "requirement_provenance: spec AC1 (61e52c3e): 'OR the member opts in via a
        #   manual toggle'; P-0-mvp-thinner.md:72,86-90: manual toggle explicitly IN-scope,
        #   mvp-critical; D-1-brief §6 (line 29): 'Manual: a toggle (in the control
        #   cluster) -> audio-only on/off'"
      - process/waves/wave-34/blocks/D/gate-verdict.md
        # "Gap 2 — audio-only-state — APPROVED. All in-scope states: PASS — normal-hidden,
        #   auto, manual, restoring."
        # [The gate verdict lists states only — no check against brief §6's control
        #   entry affordance. This is the omission the obs-2 class identifies.]
      - process/waves/wave-34/stages/P-0-mvp-thinner.md
        # "a single user-facing audio-only toggle IS in-scope, not gold-plate …
        #   both the auto trigger and one manual toggle are mvp. The gold-plate line is at
        #   GRANULARITY … not at the existence of the manual control."
      - process/waves/wave-34/stages/V-3-fast-fix.md
        # "Fix: wired enterManual() to a control-cluster 'Audio-only' toggle
        #   (VoiceStudyRoom.tsx)" — confirms the correction was a single bounded add,
        #   proving the miss was purely the absent design + gate check, not a hard
        #   implementation problem.
    severity: strong
    candidate_principles_file: command-center/principles/DESIGN-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "D-3 gate checked brief STATES but not brief INTERACTIONS;
      a control named in the brief but absent from the mockup was not caught" class in
      L-2 history.

      State-only checking is insufficient when a brief has numbered sections that separately
      enumerate (a) the states a component occupies (§3/§4/§7 in this wave) and (b) the
      controls/interactions that PRODUCE those states (§6 in this wave). A mockup can
      render all declared states correctly while omitting the control that enters them.
      The gap is invisible when the gate rubric is "are all brief-listed states rendered?"
      and the missing control is in a different brief section than the states. The correct
      rubric addition: for each brief section that names a CONTROL, AFFORDANCE, or
      INTERACTION (not a state), assert that control is visually present in the mockup in
      the position the brief specifies (e.g., "in the control cluster" per brief §6 here).

      Near-dup check against existing principles files: DESIGN-PRINCIPLES.md does not exist
      as a separate file (the project's CLAUDE.md references DESIGN-SYSTEM.md for the
      design pipeline; the D-3 gate rubric is in the stage file). No existing principles
      file covers the D-3 gate rubric for brief-interaction compliance. The closest
      candidate would be a DESIGN-PRINCIPLES.md rule or a D-3 stage annotation. If
      DESIGN-PRINCIPLES.md does not exist in this project, the candidate file is wherever
      the D-3 gate rubric lives (the D-block stage file or the DESIGN-SYSTEM.md).
      This file should be confirmed at L-2 promotion time.

      Near-dup check against BUILD-PRINCIPLES: no BUILD rule addresses D-3 gate rubric.
      Near-dup check against PRODUCT-PRINCIPLES rules 1-3: none address design gate rubric.
      Near-dup check against VERIFY-PRINCIPLES rules 1-2: these target V-block review
      methodology, not D-3 gate rubric. No near-dup.

      HOLD. Promote on second confirming wave where:
        (a) a D-3 gate approves a mockup that omits a control or affordance named in the
            brief, and the omission reaches code or T-block before being caught, OR
        (b) a D-3 gate explicitly adds a brief-interaction diff step and thereby catches
            a design that renders correct states but omits a named trigger/entry-control.
    promotion_gates:
      generalizable: true
        # Applies at D-3 for any design gap whose brief has numbered sections separately
        # listing (a) states/visual appearances and (b) controls/interactions/affordances.
        # The check: for each brief section that names a control, button, toggle, or
        # affordance (as opposed to a visual state), is that element visually present in
        # the mockup at the position the brief specifies? A mockup that shows the resulting
        # states but not the entry control fails this check.
      falsifiable: true
        # Checkable at D-3: for each numbered brief section that contains the words
        # "control," "toggle," "button," "affordance," or a control-placement phrase
        # (e.g., "in the control cluster"), does the adopted mockup show that element
        # in the specified position? A D-3 gate verdict that lists only "All in-scope
        # states: PASS" without confirming presence of every named interactive element
        # fails this rule when any brief section specifies a control not visible in the
        # mockup.
      cited: true
        # V-1-jenny.md (spec-DRIFT adjudication; 4-step provenance: AC1 → mvp-thinner
        #   → D-1 §6 → D-2/D-3 gap; "neither reviewer checked the mockup against brief §6's
        #   control-cluster entry toggle"; "design shipped a self-inconsistent surface");
        # D/gate-verdict.md (APPROVED on audio-only-state; gate listed "All in-scope states:
        #   PASS" — did not include a brief-§6 interaction check);
        # P-0-mvp-thinner.md (manual toggle is IN-scope, mvp-critical, not gold-plate —
        #   establishes the control's canonical upstream status);
        # V-3-fast-fix.md (correction was one bounded add — wiring the already-built
        #   enterManual() to a button; design omission was the only gap).
    candidate_rule_shape: >
      [target: DESIGN-PRINCIPLES or D-3 stage rubric addendum]
      At D-3, for each brief section naming a control, toggle, or affordance, assert it is
      visually present in the adopted mockup at the brief's specified placement.
      Why: A mockup can render all required states while omitting the trigger that enters
      them; state-only checking misses the gap.
    promotion_status: HOLD. First instance. Promote on second confirming wave where a
      D-3 gate misses a brief-named control, OR where an explicit interaction-diff check
      prevents the omission from reaching code.


  - id: obs-3
    summary: >
      Wave-33 obs-1 held "when a plan names a framework's exception class for error
      interception, verify that framework is in package.json before the plan is
      build-ready" as a PRODUCT-PRINCIPLES rule 4 candidate (1st instance: P-4 REWORK
      caused by TypeORM class on a Drizzle+pg stack). Wave-34 does not confirm this class
      (P-4 APPROVED first attempt; no plan-level error-class naming error). Status:
      wave-33 obs-1 remains a 1-wave HOLD.

      This status entry is included to maintain the held-observations ledger for the next
      L-2 reviewer. The observation itself is not reproduced here; see
      process/waves/_archive/wave-33/blocks/L/observations.md obs-1.
    source:
      - process/waves/_archive/wave-33/blocks/L/observations.md
        # obs-1: "Plan names a framework error class absent from the actual stack; gate
        #   catches it. HOLD. Promote to PRODUCT-PRINCIPLES rule 4 on second confirming wave."
    severity: informational
    recurrence: >
      NOT CONFIRMED this wave. Wave-34 is a feature wave (M6 final voice slice, no error-
      interception plan). P-4 APPROVED first attempt with no error-class mis-naming.
      Remains 1-wave HOLD.
    promotion_status: NOT CONFIRMED. Wave-33 obs-1 HOLD unchanged. Remains PRODUCT-PRINCIPLES
      rule 4 candidate; promote on second confirming wave where a plan names a framework-specific
      error class absent from the stack.
```

---

## Prior held observations — second-instance status (wave-30 through wave-33)

| origin | obs | class | wave-34 status |
|--------|-----|-------|----------------|
| wave-33 | obs-1 | Plan names a framework-specific error class absent from the actual stack; P-4 catches it | NOT CONFIRMED. W34 is a feature wave; P-4 APPROVED first attempt; no error-class naming error. Remains 1-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-33 | obs-2 | Error-mapping fix must fire against a real upstream error from the actual code path, not a unit-constructed mock | NOT CONFIRMED. W34 is a frontend-dominated feature wave. No error-interception fix cycle. The fast-fix had no error-mapping change. Remains 1-wave HOLD (VERIFY-PRINCIPLES rule 3 candidate). |
| wave-33 | obs-3 | Clone the shipped error-walk helper depth for new error codes on the same stack | NOT CONFIRMED. No new pg error-code mapping authored. Remains 1-wave HOLD (BUILD-PRINCIPLES candidate). |
| wave-32 | obs-1 | Wiring new api method into existing component invalidates explicit-enumeration mock factory (BUILD rule 9 candidate, linter-blocked at wave-32 L-2) | NOT CONFIRMED this wave. The V-3 fast-fix added a component button wired to `enterManual()` + 5 new tests; the mock factory update was in the same commit (vi.mock for useAudioOnlyFallback already set up). No cross-module explicit-enumeration mock staleness occurred. Remains BUILD slot 9 candidate (linter-blocked — try tighter why line next occurrence). |
| wave-32 | obs-3 | Typed api-client method added but consumer fetches inline in parallel | NOT CONFIRMED. No new api-client method added; fast-fix is web-only (no api.ts change). Remains 1-wave HOLD (BUILD candidate). |
| wave-31 | obs-1 | Credential-endpoint gate: membership check before load/type-discriminator on credential-issuing endpoints | NOT CONFIRMED. W34 did not introduce a credential-issuing endpoint; existing voice-token gate order unchanged. Remains 2-wave HOLD (BUILD rule 9 candidate). |
| wave-31 | obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() bridge | NOT CONFIRMED. No new ESM-only npm dependency added; livekit-server-sdk bridge unchanged from w31. Remains 2-wave HOLD (BUILD candidate). |
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code ?? default | NOT CONFIRMED. No DB query on a nullable FK status table authored. Remains 3-wave HOLD (BUILD candidate). |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED. No cron or background job with external side effect. Remains 3-wave HOLD (BUILD candidate). |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED. V-2 had exactly one blocking finding (F-34-AUDIO-TOGGLE — spec-DRIFT, corrected via fast-fix) and one non-blocking (F-34-ARIA, folded into fast-fix). No spec-consistent design-limitation requiring accept+track+observe disposition. Remains 3-wave HOLD (VERIFY rule 3 candidate). |
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | NOT CONFIRMED. No operator-fix shorthand in the plan; P-4 APPROVED first attempt. Remains 4-wave HOLD (PRODUCT rule 4 candidate). Note: wave-33 obs-1 is also a PRODUCT rule 4 candidate; both are 1st-instance HOLDs; wave-33 obs-1 is the more recent and has measured gate cost (REWORK). |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites catches reviewer-missed occurrence | NOT CONFIRMED. V-3 head-verifier pattern scan was the false-green deploy check (three independent grepping of the served bundle), not a local-pattern scan for same-pattern neighbors. The false-green itself is a distinct class (obs-1 above). Remains 4-wave HOLD (VERIFY rule 3 candidate). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED. Valid M6 feature wave; no override-ship. Remains 4-wave HOLD (PRODUCT candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED. No gitleaks interaction (clean CI). Remains 5-wave HOLD (CI candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED. No CI-config fix cycle. Remains 5-wave HOLD (CI candidate). |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED. No EXPLAIN-based integration test. Remains 6-wave HOLD (T-4 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED. No performance wave. Remains 6-wave HOLD (T-7 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 caught it | NOT CONFIRMED. No store-keyed unit fixture. Remains 7-wave HOLD (T-2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED. No date-dependent test authored. Remains 7-wave HOLD (T-2 candidate). |

---

## Signals evaluated and dropped

**Signal: credential-independent-build + live-verify pattern completed (wave-34 confirming PRODUCT rule 3):**
Wave-34 is the first wave to live-verify voice (LiveKit keys now present). PRODUCT-PRINCIPLES rule 3
("When an external-SDK feature has credential-independent ACs, build now with a placeholder key and
defer only the live-connect verify to T-5/C-2") was promoted at wave-32. Wave-34 is the first
EXECUTION of the deferred live-verify, confirming the rule's deferred-to-T-5/C-2 path actually
works end-to-end (2-participant live LiveKit connection, SFU server-truth, screen-share track-set
change). This is confirming execution of a promoted rule, not a new L-2 observation. DROPPED as
standing practice confirmed, not a new signal.

**Signal: V-3 fast-fix bounded to 1 round (no cap escalation):**
The fast-fix cycle resolved in exactly 1 round (wire the toggle + corrected deploy) with no
cap escalation. This is the expected, correct behavior of the gate mechanism — not a process
insight. The interesting events within the round (false-green deploy, double REJECT from both
reviewers) are captured in obs-1 above. No standalone observation value in the 1-round count
itself. DROPPED as gate mechanism working correctly.

**Signal: multi-reviewer system caught the false-green where a single-reviewer pass would not:**
Karen and jenny both independently grepped the served bundle in the same V-3 reverify stage,
both obtained 0/0 markers, and both REJECTED. The diversity of independent checks (not one
reviewer, not one method) is what made the false-green irreversible. This is correct and notable,
but it is a property of the V-block's mandatory two-reviewer structure (already enforced by the
gate), not a new learnable observation. The lesson it generates (served-bundle content assertion)
is already captured in obs-1. DROPPED as a mechanism-win without a distinct principle beyond obs-1.

---

## Summary table

| id    | title (short)                                                                         | severity | recurrence   | candidate file         | disposition |
|-------|---------------------------------------------------------------------------------------|----------|--------------|------------------------|-------------|
| obs-1 | Non-git Railway redeploy yields false-green; digest-diff gate insufficient; served-bundle content assertion required | strong | 1st instance | CI-PRINCIPLES | HOLD — rule 7 candidate; promote on 2nd confirming wave |
| obs-2 | D-3 gate checked brief states but not brief interactions; named entry control omitted from mockup, undetected until T-block | strong | 1st instance | DESIGN-PRINCIPLES (or D-3 rubric) | HOLD — candidate; promote on 2nd confirming wave |
| obs-3 (ledger) | Wave-33 obs-1 HOLD status | informational | NOT CONFIRMED | — | Status entry only; see wave-33 archive |

**Observations emitted: 2 (obs-1, obs-2) + 1 held-status ledger entry (obs-3)**
**Severities: 2 strong**
**Candidate files: CI-PRINCIPLES (obs-1), DESIGN-PRINCIPLES / D-3 rubric (obs-2)**
**Dropped: credential-independent-build live-verify (standing practice, rule 3 already promoted);
V-3 1-round cap (gate mechanism working); multi-reviewer false-green catch (property of mandatory
two-reviewer structure, lesson absorbed into obs-1)**

---

## Promotion candidate flags for karen

**No observations are promotable this wave. Both are 1st-instance HOLDs.**

**obs-1** (CI-PRINCIPLES rule 7 candidate) is the highest-value new HOLD: a false-green deploy
with a pipeline-green CI + Railway deployment-state SUCCESS + new image digest — all passing —
while the live product served the stale pre-fix bundle. Caught independently by karen and jenny
via the same grepping method (served-bundle content assertion). The root cause (non-git Railway
service + GraphQL redeploy builds existing snapshot, not merged commit) is deterministic and the
fix (railway up CLI-push + served-bundle content assertion at C-2) is unambiguous. The
candidate rule is falsifiable at C-2 for any non-git Railway service: fetch the live bundle,
grep for a change-unique marker, assert it is present.

Note on competing CI-PRINCIPLES slot-7 candidates:
- wave-28 obs-1 (entropy scanner false-positives, 5-wave HOLD, 1st instance) remains 1st-instance.
- wave-28 obs-2 (CI-config fix pushed unverified, 5-wave HOLD, 1st instance) remains 1st-instance.
- obs-1 from this wave (strong, measured false-green with triple independent re-confirmation) is
  the highest-severity of the three. If obs-1 confirms on a future wave, it takes slot 7 over
  the wave-28 1st-instance HOLDs per the 2nd-instance priority rule.

**obs-2** (DESIGN-PRINCIPLES / D-3 rubric candidate) is a strong candidate because the omission
propagated through three artifact layers (design mockup → D-3 gate → B-3 implementation) before
being caught at T-5/V-1, required a V-3 fast-fix round, and jenny's V-1 explicitly traced the
root to the D-3 gate rubric gap. The fix is deterministic and falsifiable: at D-3, enumerate
every brief section containing a control/toggle/affordance word and assert each is visible in
the adopted mockup at the brief's specified placement.

Note on candidate file: if DESIGN-PRINCIPLES.md does not exist in this project's principles
directory, the target is an annotation added to the D-3 stage file's rubric (blocking check
for brief-interaction completeness, not just brief-state completeness). Confirm target file
at promotion time.
