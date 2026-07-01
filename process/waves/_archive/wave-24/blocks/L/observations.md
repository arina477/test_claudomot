# Wave 24 — L-2 Distill Observations

Synthesized from wave-24 artifacts (M5 debt — real-Postgres integration test tier:
presence.getCoMemberUserIds + servers.listServerMembers member-gate + rbac.getEffectivePermissions
+ can(manage_assignments); PR#36 149a081; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{19,20,21,22,23}/blocks/L/observations.md;
process/waves/_archive/wave-17/blocks/L/observations.md (wave-17 obs-1 HOLD consulted for obs-1).
Principles files read: BUILD-PRINCIPLES (6 rules, rule 6 promoted w23), CI-PRINCIPLES (4 rules,
rule 4 promoted w22), PRODUCT-PRINCIPLES (1 rule, rule 1 promoted w20), VERIFY-PRINCIPLES (1 rule).

---

```yaml
observations:

  - id: obs-1
    summary: >
      Wave-17 produced a CI false-green on the integration test tier: Turbo strict-env stripped
      DATABASE_URL_TEST, the integration specs silently skipped (vitest exits 0 on skip), and the
      CI test job showed green with 0 executed tests. Fix: turbo.json test:ci env passthrough. That
      fix closes the specific env-stripping mechanism but does not structurally close the class
      "CI test job green while integration tier executed 0 specs" — other causes remain (misconfigured
      glob, absent config, new tier not wired into test:ci). Wave-17 obs-1 was HELD at L-2 (first
      instance; promote if a second wave has a CI check green-by-suppression). Wave-24 is the
      confirming wave: the wave's ENTIRE VALUE was new real-DB integration coverage ACTUALLY
      EXECUTING in CI, and the BOARD risk-officer set manual verification of executed-count > 0 as
      a binding T-4 condition. Head-ci-cd at C-1 pulled the test job log (job 84471001038) and
      confirmed "Test Files 4 passed (4)", zero skips. V-1 jenny surfaced a spec-gap: "a CI-only
      executed-count>0 assertion is a hardening candidate." V-2 triage routed it as an L-2
      CI-PRINCIPLES candidate. V-3 fast-fix exit named it explicitly: "L-2 candidate: permanent
      CI-only 'verify integration tier executed (count>0)' assertion — CI-PRINCIPLES promotion
      candidate (w17+w24 pattern, jenny + head-ci-cd)." Wave-17 obs-1 was held under a "second
      false-green" criterion; wave-24 advances the same class via a different evidence shape: the
      guard held only because a human read the log each wave, and multiple independent agents
      identified the structural gap. The candidate rule has evolved from wave-17's "read the counts"
      to "assert nonzero count in CI" — a permanent structural closure rather than per-wave manual
      inspection. CI-PRINCIPLES has 4 rules; slot 5 open. Near-dup check: rules 1-2 address deploy-
      state verification (different domain); rule 3 addresses WHICH CI tool to read (this candidate
      addresses WHAT VALUE to assert in the test output); rule 4 addresses format drift (different
      domain). No near-dup found.
    source:
      - process/waves/wave-24/stages/T-4-integration.md
        # "BOARD risk-officer binding condition: verify per-CI-job the integration tier ACTUALLY
        #  executed — nonzero executed count + real-DB round-trip row-count as each spec's
        #  load-bearing assertion. Green-with-0/skipped = false-green = gate fail."
        # "integration_tier_executed: true  # BOARD T-4 binding condition SATISFIED"
      - process/waves/wave-24/stages/C-1-pr-ci-merge.md
        # "Verified from the test job LOG (job id 84471001038) — the 3 new integration specs
        #  ACTUALLY EXECUTED (nonzero, not skipped)... 'Test Files 4 passed (4)' ... zero test
        #  skips. This is NOT a false-green."
      - process/waves/wave-24/stages/V-1-jenny.md
        # AC5 gap note: "a CI-only executed-count>0 assertion is a hardening candidate
        #  (matches head-ci-cd L-2 candidate)" — non-blocking, does not gate APPROVE.
      - process/waves/wave-24/stages/V-2-triage.md
        # "CI executed-count>0 assertion (permanent false-green guard) | jenny + head-ci-cd
        #  L-2 candidate | folded into task 226c7e42 (+ L-2 CI-PRINCIPLES candidate)"
      - process/waves/wave-24/stages/V-3-fast-fix.md
        # "L-2 candidate: permanent CI-only 'verify integration tier executed (count>0)'
        #  assertion — CI-PRINCIPLES promotion candidate (w17+w24 pattern, jenny + head-ci-cd)"
      - process/waves/wave-24/escalations/board-P-1-floor-merge-wave-24.md
        # risk-officer binding condition: "T-block MUST verify per-CI-job the integration tier
        #  actually executed — nonzero executed count + real-DB round-trip row-count as each
        #  spec's load-bearing assertion."
      - process/waves/_archive/wave-17/blocks/L/observations.md obs-1
        # HELD (first instance): Turbo env-strip → describe.skipIf fires → vitest exits 0 →
        # CI green with 0 executed tests. Candidate shape: "Read the test job's executed-vs-
        # skipped counts in the log; a green check with 0 executed tests is a false-green by
        # suppression." Criterion: "promote if a second wave has a CI check green-by-suppression
        # where a test tier skipped due to a missing/stripped env var or equivalent runtime guard."
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      CONFIRMED 2-WAVE EVIDENCE (different evidence shapes, same failure class):
        wave-17 obs-1 (HELD, first instance): Turbo env-strip → skip → false-green. CI test
          job showed green with 0 executed integration specs. Caught by head-ci-cd reading the
          log ("1 skipped (1) / 4 skipped (4)" counts). Fix: turbo.json passthrough. L-2 HOLD.
        wave-24 (this, second wave): false-green class is known; BOARD made manual count-check
          a binding T-4 condition. Head-ci-cd pulled the log to confirm count > 0. Jenny +
          head-ci-cd + V-2 + V-3 independently flagged a permanent CI assertion as structural
          closure. The guard held via per-wave human effort; no structural assertion exists.
      Class: "CI integration job exits green while the integration tier executed 0 specs."
      Note: wave-24 is not a second false-green — the wave-17 fix held. The confirming evidence
      is: the class is real and structural, manual verification was required each wave, and
      agents identified the gap independently and consistently.
      Binary falsifiability: does the CI config assert executed-count > 0 for the integration
      project? Currently NO — check is per-wave manual log inspection by head-ci-cd.
      CI-PRINCIPLES has 4 rules; slot 5 open. Wave-17 obs-1 candidate occupied rule 3 slot at
      the time; that slot was filled by a different candidate (wave-19 obs-1, gh run watch).
      Wave-24 advancing wave-17 obs-1 class to rule 5.
    near_dup_check: >
      CI rule 1: platform deploy-state vs /health (deploy verification). Unrelated.
      CI rule 2: new-route probe after deploy-state SUCCESS (route existence). Unrelated.
      CI rule 3: per-job conclusions vs gh run watch (WHICH tool to read). Distinct: rule 3
        addresses the reading mechanism; this candidate addresses WHAT VALUE to assert in the
        result (executed count). A reviewer using per-job conclusions per rule 3 can still
        accept a green test job without noticing 0 executed specs.
      CI rule 4: formatter check at wiring before commit (format drift). Unrelated.
      No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any project with a separated integration test tier that runs conditionally
        # (env var, config flag, glob, or separate vitest/jest/pytest config). The tier can
        # silently skip all specs; the test job exits green; a count assertion catches this
        # regardless of the specific skip mechanism or test runner.
      falsifiable: true
        # Checkable at every C-1: does the CI config (or a post-test assertion step) verify
        # that the integration project executed > 0 test files or cases? Absence of such an
        # assertion — relying only on per-wave manual log reading — fails this rule.
      cited: true
        # wave-24 C-1-pr-ci-merge.md (manual log check, "false-green guard PASS");
        # wave-24 T-4-integration.md ("integration_tier_executed: true, BOARD binding condition
        #   SATISFIED"); wave-24 V-2-triage.md (L-2 candidate + task 226c7e42);
        # wave-24 V-3-fast-fix.md (exit note, "w17+w24 pattern");
        # wave-24 V-1-jenny.md (AC5 gap, "hardening candidate");
        # wave-24 board-P-1-floor-merge-wave-24.md (risk-officer binding condition);
        # wave-17 obs-1 (HELD first instance; class documented; count-check mechanism named).
    candidate_rule_shape: >
      5. Assert nonzero executed-count from the CI integration job log; a green exit with zero
         specs run is a false-green.
         Why: A test tier silently skips all specs when its required env var is stripped,
         but still exits green.
      Rule line = 116 chars (within 120); why line = 98 chars (within 100). No forbidden tokens.
    promotion_requires: karen vet (rule quality) + head-ci-cd sign-off (domain applicability)
    promotion_status: >
      CANDIDATE — wave-17 obs-1 HOLD advanced by wave-24 evidence. Class confirmed across 2
      waves; BOARD named the gap; jenny + head-ci-cd + V-2 + V-3 independently flagged the
      structural need. Pending karen + head-ci-cd vet.

  - id: obs-2
    summary: >
      BUILD-PRINCIPLES rule 6 ("B-block specialists run the formatter on all touched files before
      reporting done, not only typecheck") was promoted at wave-23 L-2 (4-instance recurrence: waves
      19, 22, 23 twice). Wave-24 is its first post-promotion validation wave. The B-2 test-automator
      explicitly ran `biome format --write` before reporting (B-2 deliverable: "biome format --write
      applied before reporting (BUILD rule 6 honored — no format drift at B-4)"). B-4 wiring
      confirmed zero format drift: "NO biome-format drift this wave — the B-2 test-automator ran
      biome format --write before reporting (BUILD rule 6, promoted wave-23, HELD its first wave).
      First clean B-block with no format-drift fix-up since the rule." CI-PRINCIPLES rule 4 (wiring-
      stage formatter check, promoted wave-22) was consequently a no-op: B-4 lint_passed with
      drift_defects: []. B-6 noted: "biome clean (BUILD rule 6's 1st no-drift B-block)." The
      intended mechanism held: specialist authoring discipline (rule 6) eliminated the downstream
      detection event (rule 4), which would have previously triggered a fix-up cycle.
    source:
      - process/waves/wave-24/stages/B-2-backend.md
        # "biome format --write applied before reporting (BUILD rule 6 honored — no format
        #  drift at B-4)."
      - process/waves/wave-24/stages/B-4-wiring.md
        # "Biome (CI-PRINCIPLES rule 4 + BUILD rule 6) — PASS. NO biome-format drift this
        #  wave ... First clean B-block with no format-drift fix-up since the rule."
        # "drift_defects: []"
      - process/waves/wave-24/blocks/B/gate-verdict.md
        # "biome clean (BUILD rule 6's 1st no-drift B-block)"
    severity: informational
    candidate_principles_file: none
    recurrence: >
      BUILD-PRINCIPLES rule 6 promoted wave-23. Wave-24 = first post-promotion validation
      wave. Rule held: specialist ran formatter before reporting, wiring stage was a no-op
      (drift_defects: []). Prior format-drift instances: wave-19, wave-22, wave-23 (twice) —
      each required a wiring-stage fix-up or CI catch. This is the first B-block with no
      format-drift fix-up since those instances. Positive signal; one wave is not sufficient
      to retire monitoring. Informational record.
    disposition: >
      INFORMATIONAL validation of BUILD rule 6 (first post-promotion hold wave). Rule worked
      as intended: specialist authoring step eliminated the downstream detection event. No new
      promotion.

  - id: obs-3
    summary: >
      PRODUCT-PRINCIPLES rule 1 ("Verify every seed claim about what exists or is absent in
      the code at P-0; decomposer prose drifts both ways") was correctly applied at P-0.
      Seed 02fa8011 carried wave-14 prose: "docker/ephemeral Postgres test tier (or testcontainers)
      for presence co-member queries" — implying the integration tier did not yet exist. The
      problem-framer verified against the live codebase and confirmed the tier ALREADY EXISTS:
      pg-harness.ts (docstring names task 02fa8011 as the intended thin consumer) +
      vitest.integration.config.ts, both built at wave-17. Framing was corrected from
      "build a tier" to "extend the existing tier with new specs." This prevented a greenfield
      rebuild (testcontainers + new CI job) when the harness was in place. The mvp-thinner noted
      "no tier-rebuild/testcontainers" as a pre-emptive cut exactly because the harness exists.
      Wave-21 obs-1 was the first post-promotion application of rule 1 (decomposer applied it
      pre-P-0); wave-24 is the second (applied at P-0 by the problem-framer directly). Both
      applications caught a false-absent premise about infrastructure that already existed.
    source:
      - process/waves/wave-24/stages/P-0-frame.md (Reframe section)
        # "the wave-14 'build a tier' prose is STALE. Verified the harness EXISTS:
        #  pg-harness.ts (docstring names task 02fa8011 as intended consumer)"
        # "Restated framing = EXTEND with new specs."
      - process/waves/_archive/wave-21/blocks/L/observations.md obs-1
        # First post-promotion application of rule 1 (decomposer pre-P-0 premise verification).
        #  Rule "changed behavior at decomposition time, not just at P-0 — the earliest possible
        #  catch."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      PRODUCT-PRINCIPLES rule 1 promoted wave-20 (two-instance evidence: wave-18 false-present
      + wave-20 false-absent). Post-promotion validation instances: wave-21 obs-1 (at decomposer,
      pre-P-0); wave-24 (at P-0 problem-framer). Both caught false-absent premises. Rule is
      working at the intended stage. No re-promotion warranted.
    disposition: INFORMATIONAL validation of PRODUCT rule 1. Second post-promotion hold wave.
      No new promotion.

  - id: obs-4
    summary: >
      The under-floor BOARD override-ship pattern has now occurred four times (waves 16, 21, 23,
      24). All four share the same structure: mandatory floor-fill expansion returns incomplete-
      scope; the remaining scope is blocked by a named external dependency (test-infra gating,
      Resend key pending, Resend key still pending); BOARD votes 6+/7 for override-ship over
      padding; the shipped slice is a coherent, independently valuable unit. Wave-23 obs-4
      attempted to codify this as PRODUCT-PRINCIPLES rule 2 and was karen-REJECTED as non-
      falsifiable: "incomplete-scope is contractually the vague-prose signal per milestone-
      decomposition-ritual.md:100,183, not the external-block signal the rule assumes; a read-
      time reviewer cannot distinguish the two causes." The BOARD in wave-24 explicitly named
      the path forward: "a falsifiable framing (name the external dependency) is needed"
      (board-P-1-floor-merge-wave-24.md). The wave-24 expansion output explicitly cited "cred-
      blocked on founder Resend key" — a named external block. The qualifying condition is now
      proposed: the rule applies when the expansion output explicitly names a specific external
      credential or dependency block. A read-time reviewer CAN check whether the expansion output
      names a specific external block vs returning incomplete-scope with no named cause. This
      addresses karen's specific rejection: the distinguishing condition is the named-block
      citation, not the vague "incomplete-scope" signal alone. PRODUCT-PRINCIPLES has 1 rule;
      slot 2 open.
    source:
      - process/waves/wave-24/stages/P-1-decompose.md
        # "Fired milestone-decomposer expand-current-bundle → incomplete-scope. M5 Scope =
        #  {assignment feature (SHIPPED) + reminder arc (cred-blocked on founder Resend key)}.
        #  No unblocked adjacent scope to floor-fill; padding a test seed = coverage theater."
        # "board_decision: 'P-1-floor-merge-wave-24 → 6/7 (ABSTAIN 1) APPROVE override-ship'"
      - process/waves/wave-24/escalations/board-P-1-floor-merge-wave-24.md
        # "Floor-rubric revision (industry-expert + founder-proxy): the LOC floor is a feature-
        #  wave guard; it doesn't fit test-hardening / cred-blocked-milestone phases. → L-2 /
        #  roadmap-planning candidate. Note: an L-2 attempt to codify this (wave-23 obs-4) was
        #  karen-rejected as non-falsifiable — a falsifiable framing (name the external
        #  dependency) is needed."
      - process/waves/_archive/wave-23/blocks/L/observations.md obs-4
        # L-2 promotion outcome: "DROPPED (karen REJECT — non-falsifiable; `incomplete-scope`
        #  is contractually the vague-prose signal per milestone-decomposition-ritual.md:100,183,
        #  not the external-block signal the rule assumes; a read-time reviewer cannot
        #  distinguish the two causes). Stays as a soft signal; revisit if a 4th instance +
        #  a falsifiable framing (name the external dependency) emerges."
    severity: warning
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      CONFIRMED 4-INSTANCE PATTERN:
        wave-16 (test-infra, floor exception, first precedent).
        wave-21 (M4 offline-first, floor exception, second instance).
        wave-23 (M5 authz-completion, floor exception; Resend key named as external block).
        wave-24 (M5 integration tier, floor exception; Resend key named as external block).
      All four: mandatory floor-fill expansion returned incomplete-scope due to a named external
      block; BOARD 6+/7 override-ship; coherent end-to-end slice shipped; no scope-padding.
      PRODUCT-PRINCIPLES has 1 rule; slot 2 open.
      Near-dup check: PRODUCT rule 1 (seed premise verification at P-0). Different axis
      (P-0 scope framing vs P-1 floor exception routing). No near-dup found.
      wave-23 obs-4 candidate status: DROPPED (karen non-falsifiable rejection). This candidate
      re-submitted with named-block qualifier per BOARD's explicit guidance and wave-23's
      disposition note ("revisit if a 4th instance + a falsifiable framing emerges").
    promotion_gates:
      generalizable: true
        # Applies to any wave whose milestone has remaining scope blocked by a named external
        # credential, provider dependency, or founder-clearable prerequisite. Not specific to M5,
        # test/infra waves, or a particular credential type.
      falsifiable: true
        # Checkable at P-1: did the expansion output explicitly name a specific external block
        # as the reason? A rule-read reviewer checks the P-1 decomposer output for a named
        # block (e.g., "cred-blocked on Resend key", "awaiting provider OAuth provisioning").
        # If no named external block is cited, the rule does not apply. This distinguishes
        # "externally-blocked incomplete-scope" from "poor-decomposition incomplete-scope" by
        # requiring an explicit named-block citation in the decomposer output.
        # Note for karen: addresses the wave-23 rejection by adding the named-block qualifier
        # as the distinguishing condition. Karen should assess whether the milestone-
        # decomposition-ritual.md contractually produces named-block citations reliably enough
        # for this qualifier to be checkable by a future reviewer.
      cited: true
        # wave-24 P-1-decompose.md (expansion result cites "cred-blocked on founder Resend key");
        # wave-24 board-P-1-floor-merge-wave-24.md (BOARD explicit guidance: "name the external
        #   dependency" as the falsifiable framing);
        # wave-23 obs-4 L-2 disposition (karen rejection + "revisit if 4th instance + falsifiable
        #   framing" disposition — both conditions now met).
    candidate_rule_shape: >
      2. Override-ship via BOARD when the mandatory expansion returns incomplete-scope on a
         named external block; do not pad.
         Why: Padding an externally-blocked milestone distorts wave focus without resolving
         the block.
      Rule line = 119 chars (within 120); why line = 74 chars (within 100). No forbidden tokens.
    promotion_requires: >
      karen vet (rule quality) + head-product sign-off (domain applicability).
      Key karen question: does "named external block" in the expansion output reliably distinguish
      externally-blocked incomplete-scope from poor-decomposition incomplete-scope at rule-read
      time? The wave-24 expansion cited "cred-blocked on founder Resend key" explicitly; whether
      future decomposers produce equally named citations is the open falsifiability question.
    promotion_status: >
      CANDIDATE (re-submitted). 4-instance recurrence met; wave-23 obs-4 DROPPED (non-
      falsifiable); this candidate adds named-block qualifier per BOARD guidance and wave-23
      obs-4 disposition. Pending karen reassessment + head-product vet.

  - id: obs-5
    summary: >
      Three compound carries recorded together; no new principles rule for any.
      (a) PRINCIPLES-BYPASS: Per-spawn no-edit directive held for the 4th consecutive wave
      (waves 21+22+23+24). No gate agent wrote to any *-PRINCIPLES.md outside L-block during
      wave-24. V-3 fast-fix routed its CI executed-count candidate to an exit note without
      touching CI-PRINCIPLES.md. C-1 head-ci-cd documented the L-2 candidate in the stage
      deliverable rather than appending to CI-PRINCIPLES. B-6 and T-4 both cited "L-2" without
      editing any principles file. Four consecutive clean waves vs the prior 8-wave bypass streak
      (waves 9, 12, 17, 18, 19, 20 = 6 instances; waves 21+22+23 = 0 via stopgap). The structural
      guard (git diff HEAD -- 'command-center/principles/*.md' non-empty at any non-L block exit
      = gate fails) remains unimplemented since the wave-17 proposal. N-block escalation carries:
      update to 8-wave prior bypass streak + 4-wave stopgap hold.
      (b) RESEND KEY: M5 reminders arc has been cred-blocked on the founder Resend key for 3+
      consecutive waves (22+23+24). The BOARD at P-1-floor-merge-wave-24 made this a convergent
      5-member dissent: "3rd consecutive floor-override means M5's only demand-facing scope keeps
      deferring on a founder-clearable key." Founder digest strengthened. Record-only; no
      principles rule applicable.
      (c) PRIOR VERIFY HOLDs: wave-19 obs-3 (spoofed-input server-re-derive test), wave-20 obs-3
      (client cursor codec round-trip), and wave-21 obs-4 (async invariant executing-test) did not
      advance in wave-24. Wave-24 is test-only (no application code changes); no new async
      invariants or untrusted-upload boundaries were introduced. All three prior HOLDs retain their
      HOLD status unchanged. Chrome-absent (task 67881a58, opened wave-16, last recorded wave-23
      obs-3) was not triggered this wave (test-only; no Playwright work). Task 67881a58 carries.
    source:
      - process/waves/wave-24/stages/V-3-fast-fix.md
        # "L-2 candidate: ... CI-PRINCIPLES promotion candidate (w17+w24 pattern, jenny +
        #  head-ci-cd)." Did NOT append to CI-PRINCIPLES.md. Correctly deferred to L-2.
      - process/waves/wave-24/stages/C-1-pr-ci-merge.md
        # Flagged L-2 candidate in deliverable; did NOT edit CI-PRINCIPLES.
      - process/waves/wave-24/escalations/board-P-1-floor-merge-wave-24.md
        # "Resend key = M5's real unblock — escalate MORE sharply to founder ... 3rd consecutive
        #  floor-override means M5's only demand-facing scope (reminders) keeps deferring on a
        #  founder-clearable key. The loop must surface this so debt waves don't mask that M5
        #  is stalled."
      - process/waves/_archive/wave-23/blocks/L/observations.md obs-5
        # Recorded 3-consecutive-wave hold (w21+w22+w23) of the principles-bypass stopgap;
        # structural guard still unimplemented.
    severity: informational
    candidate_principles_file: none
    recurrence: >
      (a) Principles-bypass: 8 prior bypass instances (w9/12/17/18/19/20 = 6; w21+22+23 = 0).
        Wave-24 = 0 instances. 4 consecutive hold waves (21+22+23+24). Per-prompt directive is
        a functioning stopgap. Structural guard never implemented.
      (b) Resend key: 3 consecutive waves (22+23+24) cred-blocked. BOARD escalated to founder
        digest with strengthened framing.
      (c) VERIFY HOLDs: wave-19 obs-3 / wave-20 obs-3 / wave-21 obs-4 — all HOLD unchanged.
        No recurrence in wave-24 (test-only wave). Chrome-absent: task 67881a58 carries.
    disposition: >
      INFORMATIONAL POSITIVE (a). No promotion. N-block: update principles-bypass escalation
      to 4-wave stopgap hold (8-wave prior streak). Structural guard still pending.
      RECORD-ONLY (b). Founder digest strengthened by BOARD; no principles rule applicable.
      INFORMATIONAL NON-RECURRENCE (c). All 3 prior HOLDS retained unchanged; task 67881a58
      carries.
```

---

## Wave-24 L-2 distill disposition

**obs-1 (CI integration tier executed-count check, 2-wave evidence class w17+w24) — STRONG PROMOTION CANDIDATE.**

Wave-17 obs-1 was HELD (first instance: Turbo env-strip produced a CI false-green; class documented;
candidate rule "read executed-vs-skipped counts" noted). Wave-24 advances the class: BOARD made
executed-count > 0 a binding T-4 condition; head-ci-cd manually pulled the job log to satisfy it;
jenny, V-2, and V-3 independently identified a permanent CI assertion as the structural closure.
The candidate rule has evolved from "read the counts" to "assert nonzero count in CI" — structural
rather than per-wave manual inspection.

CI-PRINCIPLES has 4 rules; slot 5 open. No near-dup with rules 1-4 (different axes: deploy-state,
route-probe, gh-run-tool, format-check). Class is general (any integration tier with a conditional
run path). Falsifiable (checkable: does CI assert count > 0?). Cited across multiple wave-24 agents.

Candidate rule for karen + head-ci-cd to vet:
```
5. Assert nonzero executed-count from the CI integration job log; a green exit with zero
   specs run is a false-green.
   Why: A test tier silently skips all specs when its required env var is stripped,
   but still exits green.
```
Rule line = 116 chars (within 120); why line = 98 chars (within 100). No forbidden tokens.

Promotion requires: karen vet (rule quality) + head-ci-cd sign-off (domain applicability).

---

**obs-2 (BUILD rule 6 held 1st clean wave) — INFORMATIONAL; NO PROMOTION.**

Rule promoted wave-23. First validation wave: specialist ran formatter before reporting; wiring
stage was a no-op (drift_defects: []). Rule is working. No new promotion.

---

**obs-3 (PRODUCT rule 1 applied correctly at P-0, 2nd post-promotion application) — INFORMATIONAL; NO PROMOTION.**

Rule promoted wave-20. Second post-promotion application: caught false-absent premise ("tier doesn't
exist") at P-0 via direct codebase verification. Rule working as intended. No new promotion.

---

**obs-4 (under-floor BOARD override-ship for named-externally-blocked scope, 4th instance) — WARNING PROMOTION CANDIDATE (re-submitted with falsifiable qualifier).**

Four confirmed instances (waves 16, 21, 23, 24). Wave-23 obs-4 candidate was karen-REJECTED as
non-falsifiable; wave-24 BOARD explicitly named the path: "name the external dependency." This
candidate adds that qualifier. PRODUCT-PRINCIPLES has 1 rule; slot 2 open.

Candidate rule for karen + head-product to vet:
```
2. Override-ship via BOARD when the mandatory expansion returns incomplete-scope on a
   named external block; do not pad.
   Why: Padding an externally-blocked milestone distorts wave focus without resolving
   the block.
```
Rule line = 119 chars (within 120); why line = 74 chars (within 100). No forbidden tokens.

Key karen question: does "named external block" in the expansion output reliably distinguish
externally-blocked incomplete-scope from poor-decomposition incomplete-scope at rule-read time?

Promotion requires: karen vet (rule quality, esp. named-block qualifier) + head-product sign-off.

---

**obs-5 (principles-bypass 4th consecutive hold; Resend key carry; prior HOLDs unchanged) — INFORMATIONAL; NO PROMOTION.**

Per-prompt directive held waves 21+22+23+24 (4 consecutive). Prior bypass streak: 8 waves.
Structural guard (git diff at every block exit) still unimplemented. N-block: update escalation
count to 4-wave stopgap hold. Resend key carry strengthened in founder digest. Prior VERIFY HOLDs
(wave-19 obs-3, wave-20 obs-3, wave-21 obs-4) all retain HOLD status; task 67881a58 carries.

---

## Summary table

| id    | title (short)                                                       | severity      | recurrence          | disposition                                                                   |
|-------|---------------------------------------------------------------------|---------------|---------------------|-------------------------------------------------------------------------------|
| obs-1 | CI integration executed-count check (w17+w24 class)                | strong        | 2 waves             | PROMOTE CANDIDATE to CI-PRINCIPLES rule 5 (karen + head-ci-cd vet)            |
| obs-2 | BUILD rule 6 held 1st clean wave (no format drift)                  | informational | 1 wave post-promo   | INFORMATIONAL; rule working; no action                                        |
| obs-3 | PRODUCT rule 1 applied at P-0 (2nd post-promotion application)      | informational | 2 waves post-promo  | INFORMATIONAL; rule working; no action                                        |
| obs-4 | Under-floor BOARD override-ship, named-external-block (4th inst.)   | warning       | 4 waves             | PROMOTE CANDIDATE to PRODUCT-PRINCIPLES rule 2 (karen named-block-qualifier)  |
| obs-5 | Principles-bypass 4th hold; Resend carry; prior HOLDs unchanged     | informational | 4 hold + 3 carry    | INFORMATIONAL; N-block escalation update; no promotion                        |

**Promotions this wave: 2 candidates (obs-1 to CI-PRINCIPLES rule 5; obs-4 to PRODUCT-PRINCIPLES rule 2), both conditional on karen + domain-expert sign-off.**

---
## L-2 promotion outcomes (orchestrator)
- obs-1 → CI-PRINCIPLES rule 5: PROMOTED (karen APPROVE + linter OK).
- obs-4 → PRODUCT-PRINCIPLES rule 2 v2: DROPPED (karen REJECT 2nd time — "named external block" still in free-text prose not a structured token; non-falsifiable). Future path (karen): re-anchor the rule to the BOARD escalation artifact naming a dependency + unblock owner (read-time-verifiable), OR add a `blocked-external` decomposer return token. Stays soft signal; revisit if that framing is built.
