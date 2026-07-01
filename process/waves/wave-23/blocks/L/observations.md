# Wave 23 — L-2 Distill Observations

Synthesized from wave-23 artifacts (M5 bundle 2 — delegated assignment-organizer authz:
manage_assignments permission split + /me effective-permissions + assignments CTA gate;
PR#35 489c86a; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{18,19,20,21,22}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (5 rules), CI-PRINCIPLES (4 rules, rule 4 promoted w22),
PRODUCT-PRINCIPLES (1 rule), VERIFY-PRINCIPLES (1 rule), DESIGN-PRINCIPLES.

---

```yaml
observations:

  - id: obs-1
    summary: >
      B-block specialists keep reporting "typecheck clean" without running the formatter,
      authoring biome-format drift on every wave. CI-PRINCIPLES rule 4 (promoted wave-22:
      "run the formatter check at the wiring stage before commit") caught both instances in
      wave-23 PRE-CI: the B-2 backend-developer committed rbac.module.ts + rbac.service.ts
      with format errors (caught at B-4 wiring, 3rd instance); the rework backend-developer
      at B-6 committed rbac.service.spec.ts with format drift (caught at B-5 Action 1 biome
      check --write, 4th instance). In wave-19, messaging.test.tsx was committed after B-6
      fix-up without the formatter (caught in CI; B-5 lint_passed claimed). In wave-22,
      assignments.test.tsx was committed from B-3 without the formatter (same CI catch; same
      B-5 false-green; promoted to CI-PRINCIPLES rule 4). The wave-23 instances differ in
      one structural respect: they were caught by rule 4 at the wiring/verify stage before
      CI (the promoted rule working), but the CAUSE of drift was identical to waves 19 and
      22 -- the specialist ran only typecheck and tests before reporting done. This is now a
      4-instance pattern (w19, w22, w23-B2, w23-B6) with a consistent root cause. CI-PRINCIPLES
      rule 4 is the detection gate; what is absent is a BUILD-level specialist discipline rule
      that prevents authoring drift in the first place. The two rules are complementary: if
      every B-block specialist ran the formatter before reporting, rule 4 would always be a
      no-op. Recurrence condition for a BUILD-PRINCIPLES candidate is met.
    source:
      - process/waves/wave-23/stages/B-4-wiring.md
        # "2 format errors in apps/api/src/rbac/rbac.module.ts + rbac.service.ts -- introduced
        #  by B-2 (f779bb5), typecheck-clean but format-dirty. 3rd instance of the
        #  biome-format-drift-passes-local-fails-CI pattern (w19/w22/w23) -- exactly what
        #  CI-PRINCIPLES rule 4 (promoted wave-22) exists to catch. Rule 4 working: caught at
        #  B-4, not in CI."
        # "L-block note: The biome-format-drift recurrence (3rd instance) + the fact that the
        #  specialist B-2 report claimed typecheck-clean without running biome format is a
        #  candidate B-block-process observation... BUILD-PRINCIPLES candidate on specialist
        #  format discipline."
      - process/waves/wave-23/stages/B-2-backend.md
        # "Typecheck: pnpm --filter @studyhall/api typecheck -> exit 0" -- no formatter step
        #  in the specialist deliverable.
      - process/waves/wave-23/stages/B-6-review.md
        # "biome-format-drift from B-block specialist commits recurred TWICE this wave
        #  (B-2 rbac files caught at B-4; B-6 new spec file) -- now the 3rd+4th instances
        #  after w19/w22. ... they keep reporting 'typecheck clean' without formatting."
      - process/waves/wave-23/blocks/B/gate-verdict.md
        # "Biome format-drift from specialist commits recurred TWICE this wave... This is
        #  the 3rd and 4th instances of the same pattern after waves 19 and 22. Flag for
        #  L-2 distill consideration: B-block specialists should run biome format before
        #  reporting done -- candidate to reinforce CI-PRINCIPLES rule 4 or seed a
        #  BUILD-PRINCIPLES rule (subject to the 1-rule-per-wave promotion bar and Karen
        #  verification at L-2). Recording here only; no rework triggered."
      - process/waves/_archive/wave-22/blocks/L/observations.md obs-1
        # w22 first instance of CI-triggered catch (assignments.test.tsx; B-3 commit without
        #  formatter; CI fail). Promoted to CI-PRINCIPLES rule 4.
      - process/waves/_archive/wave-19/blocks/L/observations.md obs-5
        # First instance (messaging.test.tsx; B-6 fix-up committed without formatter; CI
        #  fail; B-5 lint_passed). HELD; promoted on w22 recurrence.
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      4 confirmed instances:
        wave-19 obs-5 (messaging.test.tsx, B-6 fix-up commit without formatter, CI-caught).
          Held -- first instance of sub-class.
        wave-22 obs-1 (assignments.test.tsx, B-3 commit without formatter, CI-caught).
          Promoted to CI-PRINCIPLES rule 4 (wiring-stage check).
        wave-23 instance 1 (rbac.module.ts + rbac.service.ts, B-2 commit without formatter,
          caught at B-4 wiring by rule 4). 3rd instance.
        wave-23 instance 2 (rbac.service.spec.ts, B-6 rework commit without formatter,
          caught at B-5 Action 1 biome check --write). 4th instance.
      All 4 share the same root cause: the B-block specialist ran typecheck and tests but
      not the formatter before reporting done. CI-PRINCIPLES rule 4 is the downstream
      catcher; this BUILD candidate addresses the upstream authoring step.
      BUILD-PRINCIPLES has 5 rules; cap is clear (rule 6 this wave). Near-dup check:
        BUILD rule 1: prod artifact boot. Unrelated.
        BUILD rule 2: push branch after B/D stages. Unrelated.
        BUILD rule 3: seed in create transaction. Unrelated.
        BUILD rule 4: negative path per authz boundary at B-6 Phase-2. Unrelated.
        BUILD rule 5: reconnect-triggered async loop guard. Unrelated.
        CI-PRINCIPLES rule 4: run formatter check at wiring stage, not only test+typecheck.
          The wiring stage is the ORCHESTRATOR running a check; this candidate targets
          the SPECIALIST running the formatter before reporting. Complementary; not redundant.
      No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any B-block specialist on any project using a combined lint+format
        # CI command (biome, eslint+prettier, ruff, etc.) where typecheck and test pass
        # without invoking the formatter. The specialist's typecheck-only sign-off produces
        # format drift regardless of what the wiring stage catches later.
      falsifiable: true
        # Checkable at every B-block stage: does the specialist deliverable include a
        # formatter invocation (biome format --write, or project equivalent) on all touched
        # files? A deliverable citing only typecheck + pnpm test without a formatter step
        # fails this rule.
      cited: true
        # B-4-wiring.md (3rd instance, rule 4 catch, "typecheck-clean but format-dirty");
        # B-2-backend.md (typecheck-only sign-off, no formatter step);
        # B-6-review.md + gate-verdict.md (4th instance, same pattern, "L-2 candidate");
        # wave-22 obs-1 (2nd instance, CI-PRINCIPLES rule 4 promoted from it);
        # wave-19 obs-5 (first instance, held, then promoted on w22 recurrence).
    candidate_rule_shape: >
      6. B-block specialists run the formatter on all touched files before reporting done,
         not only typecheck and test.
         Why: Typecheck-clean without formatting shifts drift removal downstream to the
         wiring stage.
      Rule line = 99 chars (within 120); why line = 81 chars (within 100). No forbidden
      tokens. No wave refs.
    promotion_requires: karen vet (rule quality) + head-builder sign-off (domain applicability)
    promotion_status: CANDIDATE -- 4-instance recurrence met; pending karen + head-builder vet

  - id: obs-2
    summary: >
      BUILD-PRINCIPLES rule 4 ("Reproduce one negative path per authz or injection boundary
      at B-6 Phase-2; a Phase-1 code-read APPROVE is not sufficient") was validated again,
      with a new variant: the B-2 backend-developer explicitly deferred the /me/permissions
      authz boundary's unit test coverage to T-8, citing "T-8 asserts" in three places in
      the B-2 deliverable (getEffectivePermissions non-member 403, IDOR-safe identity, and
      owner-lockout). B-6 Phase-1 REWORK (attempt 1) caught that getEffectivePermissions
      had zero in-block unit references despite the /me/permissions endpoint being one of
      the wave's two whole-point authz boundaries. The assignment-write door had its 403
      path covered (assignments.service.spec.ts:217); the /me door did not. The rework added
      7 unit tests covering all 6 branches including the key non-member->ForbiddenException
      assertion (rbac.service.spec.ts:662). Attempt 2 APPROVED. Prior validations of rule 4
      (waves 17, 18, 19, 20, 22) were all Phase-2 catches of absence-class defects that
      Phase-1 code-read had passed. Wave-23's variant is Phase-1 itself catching a coverage
      gap -- different enforcement point, same underlying principle (authz boundary without
      in-block negative proof). The new sub-pattern to record: a specialist explicitly citing
      a downstream stage ("T-8 asserts") as a substitute for in-block authz unit coverage
      is a BUILD rule 4 miss regardless of whether T-8 would catch it.
    source:
      - process/waves/wave-23/stages/B-2-backend.md
        # "getEffectivePermissions semantics (BOARD cond 2 + 4) ... Identity from SESSION
        #  only (no client userId) -> IDOR-safe (BOARD cond 2; T-8 asserts). Owner-lockout
        #  (BOARD cond 4): owner superuser path covers it -- owner always sees full grants;
        #  T-8 asserts." [Third "T-8 asserts" citation for the non-member 403 boundary.]
      - process/waves/wave-23/blocks/B/gate-verdict.md (attempt-1 REWORK section)
        # "getEffectivePermissions (rbac.service.ts:278) -- the entire session-scoped
        #  effective-permissions surface -- has zero unit test references... The B-2
        #  deliverable explicitly punts the assertion to T-8 ('T-8 asserts', 3x)."
        # Attempt-2 APPROVED after 7-test describe block added, non-member->403 genuine.
      - process/waves/wave-23/stages/B-5-verify.md
        # "api unit 21 files/388 passed; web 14 files/216 passed" (pre-rework count).
      - command-center/principles/BUILD-PRINCIPLES.md rule 4
        # Promoted wave-18; confirmed again wave-23 Phase-1.
    severity: informational
    candidate_principles_file: none
    recurrence: >
      BUILD-PRINCIPLES rule 4 already promoted (wave-18). Validation instances: wave-17
      (spy non-functional), wave-18 (membership guard absent), wave-19 (send-path client-
      trusted attachment key), wave-20 (tautological 403 theater test), wave-22 (cross-server
      attachment scope absent), wave-23 (Phase-1 -- /me authz coverage deferred to T-8).
      Six consecutive validation waves. Rule is working. The wave-23 sub-pattern (specialist
      explicitly citing a downstream stage as coverage substitute) is worth recording as a
      named anti-pattern but does not warrant a separate rule (it is a specific instance of
      the rule's general mandate). No re-promotion warranted. Informational record.
    disposition: >
      INFORMATIONAL validation of BUILD rule 4. New sub-pattern recorded: a specialist
      deliverable citing "T-8 asserts" or any downstream stage as a substitute for in-block
      authz unit coverage is a Phase-1 REWORK trigger under rule 4. No new promotion.

  - id: obs-3
    summary: >
      Playwright chrome-absent (task 67881a58) blocked the visual E2E and layout test layers
      for the third consecutive UI wave (wave-16, wave-22, wave-23). Every Playwright MCP
      instance is pinned to the branded Google Chrome channel (/opt/google/chrome/chrome),
      which is not installed and cannot be installed without root. The Playwright-bundled
      chromium-1228 is present but the MCP fleet was started without --browser chromium. The
      T-5 tester BLOCKED 4/5 visual scenarios (CTA visible, CTA opens form, role-editor
      checkbox, checkbox toggle); the core authz boundary (A3: /me/permissions HTTP probes)
      was verified via direct HTTP. T-6 live visual-diff was also blocked. V-2 escalated the
      issue to founder digest ("3rd+ UI wave blocked"). Task 67881a58 has been open since
      wave-16. Wave-18 obs-3 recorded the same infra fault for realtime waves (5 consecutive
      socket.io wire-probe waves) as an N-block infra note; wave-23 extends this to the
      visual E2E layer specifically. The host-side fix is known and documented in the T-5
      stage file: npx playwright install chrome (requires root access) OR restart the MCP
      fleet with --browser chromium (bundled chromium is present). No principles rule is
      applicable -- this is an operational infra issue, not a process or code pattern.
    source:
      - process/waves/wave-23/stages/T-5-e2e.md
        # "F23-T-5 (Low, non-blocking, recurring): Playwright chrome-absent blocks visual
        #  E2E (task 67881a58; 3rd+ wave). Host-side fix: npx playwright install chrome OR
        #  start the MCP fleet with --browser chromium (bundled chromium-1228 is present).
        #  Escalate to founder digest -- this now recurs every UI wave."
      - process/waves/wave-23/stages/T-6-layout.md
        # "Live visual-diff BLOCKED by the Playwright chrome-absent infra (task 67881a58
        #  -- same blocker as T-5, F23-T-5). Not re-logged as a new finding."
      - process/waves/wave-23/stages/V-2-triage.md
        # "F23-T-5 ... Playwright chrome-absent is the recurring infra limitation tracked
        #  by 67881a58. Now blocks the visual test layer on the 3rd+ UI wave -> escalated
        #  to founder digest (host-side fix: npx playwright install chrome or start the
        #  MCP fleet with --browser chromium)."
      - process/waves/_archive/wave-18/blocks/L/observations.md obs-3
        # "Playwright MCP chrome-channel-blocked again at T-5 ... 5th consecutive wave
        #  where realtime verification was completed via socket.io wire probe instead."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      UI waves with visual E2E blocked by chrome-absent: wave-16 (task 67881a58 created),
      wave-22 (F22-T-5 noted), wave-23 (F23-T-5, V-2 founder-digest escalation).
      Wave-18 obs-3 recorded realtime waves using socket.io wire probe as the operational
      path; the visual E2E blockage is a distinct manifestation of the same infra fault
      (no Chrome binary, MCP fleet not started with bundled chromium).
      No principles rule applicable. N-block action: update task 67881a58 with 3rd UI-wave
      confirmation; confirm founder-digest escalation is actionable (one-time MCP fleet
      restart with --browser chromium resolves for the session without root).
    disposition: >
      INFORMATIONAL. No promotion. N-block escalation: update task 67881a58 (open since
      wave-16). Founder digest entry for MCP fleet restart with --browser chromium.

  - id: obs-4
    summary: >
      The under-floor size exception via BOARD override-ship has been invoked three times
      for milestones whose remaining scope is externally blocked. Wave-23 P-1 explicitly
      notes it extends "wave-16/wave-21 precedent to authz-completion waves." The consistent
      mechanism: (1) wave sizes below the multi-spec floor; (2) the mandatory decomposer
      expansion fires and returns incomplete-scope because remaining scope is externally
      blocked (cred-blocked, infra-gated, or carrier-wave dependency); (3) BOARD is invoked
      and returns override-ship 6+/7 rather than requiring the wave to be padded with
      unrelated debt; (4) the shipped slice is a coherent, independently valuable end-to-end
      unit. Wave-23's BOARD resolution (P-1-floor-merge-wave-23, 6/7 APPROVE A) is the third
      confirmed instance and the first in the authz-completion sub-class. The decomposer
      "incomplete-scope" result is the shared pivot: it confirms that no non-bloat adjacent
      scope exists and forces the BOARD decision point. The emerging rule is: when mandatory
      expansion returns incomplete-scope due to an external block, BOARD override-ship is
      the correct resolution; debt-padding distorts wave focus and does not satisfy the
      floor's intent. PRODUCT-PRINCIPLES has 1 rule (rule 1: seed premise verification at
      P-0). Rule 2 slot is open. Candidate shape is achievable but the rule must distinguish
      "incomplete-scope from external block" from "incomplete-scope from poor decomposition."
    source:
      - process/waves/wave-23/stages/P-1-decompose.md
        # "Fired milestone-decomposer expand-current-bundle ... -> incomplete-scope. M5
        #  Scope = {assignment feature (SHIPPED) + reminder arc (cred-blocked on founder
        #  Resend key, logged deferral)}. No unblocked, non-duplicate adjacent scope to
        #  floor-fill; debt-padding is bloat. No DB write. floor_merge_attempt: 1 (cap
        #  reached). ... BOARD 6/7 APPROVE A (override-ship) ... Floor exception logged
        #  (extends wave-16/wave-21 precedent to authz-completion waves)."
      - process/waves/wave-23/stages/P-1-decompose.md (board_decision field)
        # "P-1-floor-merge-wave-23 -> 6/7 APPROVE override-ship"
      - process/waves/_archive/wave-21/stages/P-1-decompose.md (implied by wave-23 cite)
        # Wave-21 P-1 references wave-16 as first precedent; wave-23 P-1 references both.
    severity: warning
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      CONFIRMED 3-INSTANCE PATTERN: wave-16 (test-infra wave, floor exception, first
      precedent), wave-21 (M4 offline-first wave, floor exception, second instance),
      wave-23 (M5 authz-completion wave, floor exception, third instance). All three:
      mandatory floor-fill expansion returned incomplete-scope due to external block;
      BOARD override-ship rather than padding; coherent end-to-end slice shipped.
      PRODUCT-PRINCIPLES has 1 rule; cap is clear (rule 2 this wave, IF promotion is
      decided). Near-dup check: PRODUCT rule 1 (seed premise verification at P-0) is a
      different axis (P-0 scope framing vs P-1 floor exception routing). No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any wave whose milestone has remaining scope externally blocked
        # (credential-gated, dependency-gated, founder-decision-gated). Not class-specific
        # to authz or infra waves.
      falsifiable: true
        # Checkable at P-1: when floor is missed AND decomposer returns incomplete-scope,
        # did the orchestrator route to BOARD rather than padding the wave with debt?
        # Padding with unrelated debt while expansion returns incomplete-scope fails this.
      cited: true
        # wave-23 P-1-decompose.md (board_decision, "extends wave-16/wave-21 precedent");
        # wave-21 P-1 (cited as first precedent in wave-23); wave-16 (cited by wave-21).
    candidate_rule_shape: >
      2. Route to BOARD for override-ship when the mandatory floor-fill expansion returns
         incomplete-scope; do not pad the wave with debt or unrelated scope.
         Why: External blocks make a coherent in-scope slice preferable to an inflated
         wave that dilutes focus.
      Rule line = 110 chars (within 120); why line = 82 chars (within 100). No forbidden
      tokens. No wave refs.
    promotion_requires: >
      karen vet (rule quality) + head-product sign-off (domain applicability).
      NOTE: rule shape assumes decomposer "incomplete-scope" is the trigger condition.
      Karen should assess whether "incomplete-scope due to external block" vs "incomplete-
      scope due to poor decomposition" is distinguishable at rule-read time, or if the
      rule needs a qualifier (e.g., "when decomposer cites an external block as the reason
      for incomplete-scope").
    promotion_status: >
      CANDIDATE -- 3-instance recurrence met; rule shape adequate but qualifier question
      for karen. Eligible for PRODUCT-PRINCIPLES rule 2. Pending karen + head-product vet.

  - id: obs-5
    summary: >
      The per-spawn no-edit directive (prohibiting principles-file writes outside L-block)
      held for the third consecutive wave (waves 21, 22, 23). No B-block, T-block, or V-block
      specialist or gate agent appended to any *-PRINCIPLES.md during wave-23. The B-4
      wiring deliverable, the B-6 head-builder gate-verdict, and the T-5/V-2 stage files all
      correctly directed their observations to "L-2" or "feed to L-2" rather than to the
      principles files directly. The eight-wave prior bypass streak (waves 9, 12, 17, 18, 19,
      20 = core; waves 21 and 22 = 0 via stopgap) has not recurred across three consecutive
      waves. This is the strongest positive signal to date that the per-prompt directive is a
      functioning stopgap. However, the structural guard (git diff HEAD --
      'command-center/principles/*.md' non-empty at any non-L block exit = gate fails) remains
      unimplemented after being proposed at wave-17, escalated at waves 18 and 19, and re-
      escalated at waves 20, 21, and 22. Three consecutive hold waves do not retire the
      structural guard requirement: the directive is a per-spawn instruction dependent on
      prompt fidelity, not a structural enforcement. N-block task for the structural guard
      remains open.
    source:
      - process/waves/wave-23/stages/B-4-wiring.md
        # "L-block note: The biome-format-drift recurrence ... Feed to L-2 (may reinforce
        #  CI-PRINCIPLES rule 4 or spawn a BUILD-PRINCIPLES candidate)." -- did NOT append
        #  to any principles file.
      - process/waves/wave-23/blocks/B/gate-verdict.md
        # "L-block observation candidate (process note, NOT a gate blocker) ... Recording
        #  here only; no rework triggered." -- did NOT append to any principles file.
      - process/waves/wave-23/stages/B-6-review.md
        # "Candidate for L-2: reinforce rule 4 OR a BUILD-PRINCIPLES rule that B-block
        #  specialists run biome format --write on touched files before reporting ...
        #  Feed to L-2." -- did NOT append.
      - process/waves/wave-23/checklist.md
        # "Carried obs (record-only, founder digest): principles-write-outside-L-block
        #  durable structural guard...still UNIMPLEMENTED -- 2nd consecutive hold via
        #  per-spawn reminder (lower urgency)." [checklist authored pre-wave; wave-23 itself
        #  is the third hold wave, extending the 2-wave count cited at checklist authoring.]
      - process/waves/_archive/wave-22/blocks/L/observations.md obs-3
        # "Two consecutive non-recurrence waves is a stronger positive signal than wave-21's
        #  single hold, but is not sufficient to retire the structural guard escalation."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      8 prior bypass instances (waves 9, 12, 17, 18, 19, 20 = 6 instances;
        then waves 21, 22 = 0 instances via per-prompt stopgap).
      Wave-23 = 0 instances. Three consecutive hold waves (21 + 22 + 23).
      Per-prompt no-edit directive held all three. No principles file was edited outside
      L-block in any of waves 21, 22, or 23.
      The structural guard (git diff HEAD -- 'command-center/principles/*.md' at every
      non-L block exit) was proposed wave-17, escalated waves 18-22, and remains unimplemented.
    disposition: >
      INFORMATIONAL POSITIVE. No promotion (no principles rule can encode a structural guard;
      the fix is procedural). N-block update: per-prompt directive held waves 21 + 22 + 23
      (3 consecutive). Prior bypass streak: 8 waves. Structural guard still pending. Update
      N-block escalation count to reflect 3-wave stopgap hold. Do not retire escalation.
```

---

## Wave-23 L-2 distill disposition

**obs-1 (biome-format-drift authored by B-block specialists, 4th instance) — STRONG PROMOTION CANDIDATE.**

Four confirmed instances across waves 19, 22, 23 (twice): each time a B-block specialist
committed without running the formatter; CI-PRINCIPLES rule 4 (wiring-stage check, promoted
wave-22) caught both wave-23 instances before CI. Root cause is identical across all 4: the
specialist ran typecheck and tests but not the formatter before reporting done. The wave-22
promotion addressed the detection side (wiring stage); this candidate addresses the authoring
side (specialist discipline). Complementary, not redundant.

BUILD-PRINCIPLES has 5 rules; cap is clear (rule 6 this wave). No near-dup with rules 1-5 or
CI-PRINCIPLES rule 4 (different enforcement points: specialist authoring vs wiring-stage check).

Candidate rule for karen + head-builder to vet:
```
6. B-block specialists run the formatter on all touched files before reporting done,
   not only typecheck and test.
   Why: Typecheck-clean without formatting shifts drift removal downstream to the
   wiring stage.
```
Rule line = 99 chars (within 120); why line = 81 chars (within 100). No forbidden tokens.

Promotion requires: karen vet (rule quality) + head-builder sign-off (domain applicability).

---

**obs-2 (BUILD rule 4 validated, new variant: specialist deferred authz coverage to T-8) — INFORMATIONAL; NO PROMOTION.**

Rule already promoted (wave-18). Six consecutive validation waves. Wave-23 variant (Phase-1
REWORK catching deferred-to-T-8 authz coverage) is a new enforcement-point sub-pattern: a
specialist citing a downstream stage as coverage substitute is itself a Phase-1 REWORK trigger.
No new promotion. Informational record of sub-pattern.

---

**obs-3 (Playwright chrome-absent, 3rd+ UI wave blocked) — INFORMATIONAL; NO PROMOTION.**

Task 67881a58 open since wave-16. V-2 escalated to founder digest with host-side fix documented.
No principles rule applicable. N-block: update task 67881a58; confirm founder-digest delivery;
document that --browser chromium restart resolves for the session without root access.

---

**obs-4 (under-floor BOARD override-ship for externally-blocked milestone scope, 3rd instance) — WARNING PROMOTION CANDIDATE.**

Three confirmed instances (waves 16, 21, 23). Pattern is clear: decomposer incomplete-scope
due to external block; BOARD override-ship preferred over padding; coherent slice ships.
PRODUCT-PRINCIPLES has 1 rule; cap is clear (rule 2 this wave). Candidate rule shape is
format-valid but karen should assess whether "incomplete-scope due to external block" is
distinguishable from poor decomposition at rule-read time.

Candidate rule for karen + head-product to vet:
```
2. Route to BOARD for override-ship when the mandatory floor-fill expansion returns
   incomplete-scope; do not pad the wave with debt or unrelated scope.
   Why: External blocks make a coherent in-scope slice preferable to an inflated
   wave that dilutes focus.
```
Rule line = 110 chars (within 120); why line = 82 chars (within 100). No forbidden tokens.

Promotion requires: karen vet (rule quality) + head-product sign-off (domain applicability).

---

**obs-5 (principles-file bypass: 3rd consecutive hold wave via per-prompt directive) — INFORMATIONAL POSITIVE; NO PROMOTION.**

Three consecutive non-recurrence waves (21 + 22 + 23). Per-prompt directive is holding.
Structural guard (git diff at every non-L block exit) remains unimplemented after 8-wave
prior bypass streak. Update N-block escalation: 3-wave hold, guard still pending.

---

## Summary table

| id    | title (short)                                                   | severity      | recurrence         | disposition                                                                    |
|-------|-----------------------------------------------------------------|---------------|--------------------|--------------------------------------------------------------------------------|
| obs-1 | Biome-format-drift authored by B-block specialists (4th inst.)  | strong        | 4 waves            | PROMOTE to BUILD-PRINCIPLES rule 6 (karen + head-builder vet)                  |
| obs-2 | BUILD rule 4 validated, new variant: T-8 deferral sub-pattern   | informational | 6 waves (rule val) | INFORMATIONAL; rule exists; sub-pattern recorded; no action                    |
| obs-3 | Playwright chrome-absent: 3rd+ UI wave blocked (task 67881a58)  | informational | 3 UI waves         | INFORMATIONAL; N-block: update task + founder-digest; no principles rule        |
| obs-4 | Under-floor override-ship for externally-blocked scope (3rd)    | warning       | 3 waves            | PROMOTE CANDIDATE to PRODUCT-PRINCIPLES rule 2 (karen + head-product vet)      |
| obs-5 | Principles-bypass: 3rd consecutive hold (w21/w22/w23)           | informational | 8 prior + 0 x3     | INFORMATIONAL POSITIVE; structural guard still pending; update N-block count    |

**Promotions this wave: 2 candidates (obs-1 to BUILD-PRINCIPLES rule 6; obs-4 to PRODUCT-PRINCIPLES rule 2), both conditional on karen + domain-expert sign-off.**

---
## L-2 promotion outcomes (orchestrator)
- obs-1 → BUILD-PRINCIPLES rule 6: PROMOTED (karen APPROVE + linter OK).
- obs-4 → PRODUCT-PRINCIPLES rule 2: DROPPED (karen REJECT — non-falsifiable; `incomplete-scope` is contractually the vague-prose signal per milestone-decomposition-ritual.md:100,183, not the external-block signal the rule assumes; a read-time reviewer cannot distinguish the two causes). Stays as a soft signal; revisit if a 4th instance + a falsifiable framing (name the external dependency) emerges.
