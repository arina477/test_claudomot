# Wave 55 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-55/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, B-0-branch-and-schema,
B-1-contracts, B-2-backend, B-3-frontend, B-4-wiring, B-5-verify, B-6-review, B-6-review-output,
C-1-pr-ci-merge, C-2-deploy-and-verify, T-1-static, T-2-unit, T-3-contract, T-4-integration,
T-5-e2e, T-6-layout, T-7-perf, T-8-security, T-9-journey, V-1-jenny, V-1-karen, V-1-summary,
V-2-triage, V-3-fast-fix).
Prior archives consulted: process/waves/_archive/wave-{50,51,52,53,54}/blocks/L/observations.md
(recurrence checks on premise-falsification class, floor-override class, and all prior held HOLDs).
Principles files read: PRODUCT-PRINCIPLES.md (5 rules), BUILD-PRINCIPLES.md (10 rules),
CI-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules), T-4.md (0 rules), T-5.md (3 rules),
T-8.md (3 rules).

---

- **[obs-1 — VERDICT ON RECURRENCE QUESTION: wave-54 obs-2 vs wave-55 P-0 catch — DISTINCT LESSONS,
  each 1st instance of its own sub-class, but both are applications of existing PRODUCT-PRINCIPLES
  rule 1]**

  The prompt asks whether the wave-54 P-0 catch (seed premise "vulnerability class still open" was
  FALSE — class already closed; matched antipatterns [1,7]) and the wave-55 P-0 catch (seed's
  positive assertion was REDUNDANT with an existing control; load-bearing cell was the untested
  NEGATIVE; matched antipattern [3]) constitute the SAME recurring lesson or DISTINCT lessons.

  Rigorous analysis:

  **Wave-54 structural class:**
  The problem-framer falsified an existence claim — the seed asserted a vulnerability class (WS
  info-disclosure, 22P02-to-client leak) was still OPEN across multiple gateways. Direct code
  inspection (safeErrorMessage grep, hard-coded literal strings in catch blocks) showed the class
  was already CLOSED. The seed's implicit premise "there are remaining open leak sites" was false.
  The reframe collapsed a multi-file sweep to a verify-only regression-lock. Antipatterns matched:
  [1] false-present/false-absent code claim; [7] validation theater (guards against a non-existent
  leak). The predicate falsified: "the vulnerability class is open at these specific sites."

  **Wave-55 structural class:**
  The problem-framer falsified an assertion-value claim — the seed asserted adding a POSITIVE
  control (who_can_dm='server-members' co-member IS returned) would close the last untested enum
  corner. Direct code inspection (dm.service.ts:704-711 predicate) showed 'server-members' and
  'everyone' are handled IDENTICALLY; the existing 'everyone' control already exercises the same
  code path. The positive assertion is therefore REDUNDANT (proves nothing new). The load-bearing
  untested cell is the NEGATIVE (disjoint 'server-members' user EXCLUDED) — a behavior the seed
  had not identified. The reframe expanded the scope from one redundant positive to the full
  2-cell truth-table. Antipattern matched: [3] demo-path / happy-path tunnel vision (proposing only
  the passing case of a privacy-tier differentiator). The predicate falsified: "the positive
  assertion for this enum value constitutes meaningful new coverage."

  **Predicate-level distinction:**
  Wave-54 falsifies a code-state claim: "gap X still exists" (it does not). The correction is
  reductive — the wave does less work than the seed proposed.
  Wave-55 falsifies a coverage-value claim: "assertion Y covers the untested behavior" (it covers
  nothing new; the untested behavior is different from what the seed named). The correction is
  both reductive (the redundant positive is demoted from "load-bearing" to "harmless but
  redundant") and additive (the negative cell is identified and added as the real deliverable).

  These are structurally distinct sub-classes. Wave-54's is a false-state-of-the-world premise;
  wave-55's is a false-coverage-value premise. Both trigger antipattern #1 in the meta-sense
  (seed claim about what is absent in the test suite is imprecise), but wave-54 additionally
  matches #7 (validation theater, a sweep that would produce no real tests) while wave-55 matches
  #3 (demo-path, happy-path assertion that doesn't test the differentiating behavior).

  **Coverage by existing PRODUCT-PRINCIPLES rule 1:**
  PRODUCT-PRINCIPLES rule 1 states: "Verify every seed claim about what exists or is absent in
  the code at P-0; decomposer prose drifts both ways."
  Why: "A false-absent premise rebuilds existing work; a false-present one skips a needed addition."

  Wave-54 obs-2 concluded: the wave-54 instance is an application of rule 1 (false-present claim
  about an open vulnerability class). Wave-54 L-2 logged it as HOLD — first instance of the
  security-class-premise-falsification VARIANT.

  Wave-55 instance: the seed's false-coverage-value claim is also an application of rule 1 in
  a broader reading — the seed presents the positive assertion as covering absent integration
  behavior, but code inspection reveals the behavior is not absent for that assertion (the
  'everyone' control already covers the same predicate). Rule 1's "absent in the code" phrase
  primarily targets existence claims (a function, a guard), but the underlying principle —
  verify P-0 that the seed's claim about what is missing is actually true — covers the
  wave-55 case as well.

  **Assessment:**
  (i) Are wave-54 and wave-55 the SAME structural class? NO. The predicates differ. Wave-54:
  false code-state (class open/closed). Wave-55: false coverage-value (assertion redundant with
  an existing control; real gap is a different cell). They share the meta-pattern (P-0 code
  inspection falsifies a seed premise) but belong to distinct sub-classes of that meta-pattern.
  This is NOT a second instance of wave-54 obs-2.

  (ii) Is wave-55's lesson already covered by PRODUCT-PRINCIPLES rule 1? YES, substantially.
  Rule 1's formulation covers the parent meta-pattern. The wave-55 sub-class (redundant happy-path
  assertion vs. untested negative-control cell) is a specific application of rule 1's "decomposer
  prose drifts both ways" and "a false-present one skips a needed addition" — the seed presented
  the positive cell as the addition needed; code inspection revealed the real needed addition was
  the negative cell. Rule 1 already encodes that P-0 must verify what is truly absent.

  Wave-55's specific texture — that a privacy-tier differentiator requires asserting what it
  BLOCKS, not only what it admits; that a positive-only happy-path test leaves the exclusion
  boundary unverified — is a genuine additional nuance beyond rule 1's literal text. But this
  nuance (test privacy fences with negative controls) is also encoded in VERIFY-PRINCIPLES rule 4:
  "A negative-case test passes verification only if a positive control admits the value the
  negative excludes. Why: Without a positive control a query returning nothing satisfies the
  negative vacuously." Rule 4 addresses the complementary case (a negative needs a positive
  control for non-vacuousness), and by symmetry the wave-55 lesson is the mirror (a positive
  asserts the admittance side; the exclusion side must be separately verified).

  **Conclusion for obs-1:** Wave-55's P-0 catch is a DISTINCT lesson from wave-54's (different
  predicate class). It is the FIRST INSTANCE of the "positive-only assertion is redundant with
  an existing control; the load-bearing untested cell is the NEGATIVE" sub-class. PRODUCT-PRINCIPLES
  rule 1 substantially covers the parent; VERIFY-PRINCIPLES rule 4 covers the complementary
  direction. No promotion warranted at first instance.

  Source artifacts:
  - process/waves/wave-55/stages/P-0-problem-framer.md (verdict: REFRAME; matched_antipatterns:
    [3]; "'server-members' and 'everyone' IDENTICALLY (same code path)"; "positive-only
    'server-members' assertion proves nothing beyond what test (a)'s existing everyone-control
    already proves")
  - process/waves/wave-55/stages/P-0-frame.md (Reframe section: "positive-only
    'server-members' assertion is REDUNDANT with the existing 'everyone' control"; "The load-
    bearing UNTESTED cell was the NEGATIVE")
  - process/waves/_archive/wave-54/blocks/L/observations.md (obs-2: "FIRST INSTANCE: seed
    premise about an entire vulnerability class being open was false"; "PRODUCT-PRINCIPLES rule 1
    already encodes the core lesson"; "HOLD — 1st instance of the security-class variant")

  Severity: informational (no production consequence; the reframe was resolved at P-0 before
  implementation; the wave shipped the correct 2-cell truth-table; clean gates throughout).
  Candidate principles file: none at this time. PRODUCT-PRINCIPLES rule 1 covers the parent
  class; VERIFY-PRINCIPLES rule 4 covers the symmetry. A distinguishing rule for the
  "positive-only happy-path assertion is redundant when an existing control exercises the same
  code path; test the exclusion cell to prove the differentiator" sub-class would require a
  second confirming instance.
  Recurrence: FIRST INSTANCE of this sub-class (false-coverage-value at P-0; positive assertion
    redundant with existing control; real gap is the untested negative cell). Distinct from
    wave-54 obs-2 (false-state-of-the-world premise). HOLD.
  Promotion flag: HOLD — 1st instance of this sub-class; rule 1 + rule 4 provide
    substantial coverage of adjacent territory; watch for a second wave where a seed's positive-
    only assertion is shown redundant with an existing control and the real gap is the untested
    negative or edge cell.

---

- **[obs-2 — RECURRING (6th instance): sub-floor test-only coverage wave resolved by override-ship
  via PRODUCT rule 5; recurrence count updated]**

  Wave-55 P-1 decompose tripped the single-spec floor (~40-80 LOC vs. 1,500-LOC threshold).
  Resolution: override-ship by rule (PRODUCT-PRINCIPLES rule 5; mvp-thinner floor_constraint_active
  + zero valid split candidates + unanimous P-0 scope endorsement + genuine privacy-boundary
  regression fence on a named differentiator surface). The P-1 file explicitly records "obs-B 6th
  instance (waves 50-55)."

  This obs is a STATUS UPDATE only: the floor-override-by-rule class now has 6 confirmed
  instances. PRODUCT-PRINCIPLES rule 5 was promoted at wave-52 L-2 and covers the resolution
  path mechanically. The system is operating as designed. No new learning gap.

  Recurrence lineage:
  - wave-50 obs-B: 1st instance (multi-spec sub-floor, feature-completion + V-2-debt fix).
  - wave-51 obs-B: 2nd instance (single-spec sub-floor, DM layout defect fix). HOLD-SECONDARY
    (slot contested by wave-51 obs-A; carried to wave-52).
  - wave-52 obs-4: 3rd instance (multi-spec sub-floor, joinable focus room). Promoted as
    PRODUCT-PRINCIPLES rule 5 at wave-52 L-2 (karen APPROVE).
  - waves 53, 54: instances 4 and 5 (not separately recorded as obs in those ledgers; the rule
    was already promoted so the status check absorbed them silently).
  - wave-55: 6th instance. Rule applied correctly; no override friction beyond logging.

  Source artifacts:
  - process/waves/wave-55/stages/P-1-decompose.md (floor_resolution: "override-ship
    (PRODUCT rule 5 / obs-B 6th; privacy-boundary test, no valid merge candidate)")

  Severity: informational (rule 5 functioning correctly; zero override friction; no new gap).
  Candidate principles file: none (PRODUCT-PRINCIPLES rule 5 already exists and was applied).
  Recurrence: 6th instance. Rule 5 in force. No action needed.
  Promotion flag: NO — rule already promoted; this is a health-check confirmation.

---

- **[obs-3 — CLEAN-WAVE NOTE: test-only wave with sub-floor reframe; all gates APPROVED, zero
  findings, zero fix-up cycles; P-0 reframe mechanism functioning]**

  Wave-55 is the second consecutive test-only coverage wave (wave-54 was also test-only). Both
  waves had a P-0 REFRAME at the problem-framer stage that materially changed the deliverable
  before any code was written. Both completed with all gates APPROVED and zero findings.

  The P-0 reframe pipeline (problem-framer + ceo-reviewer + mvp-thinner + orchestrator mediation)
  is demonstrably functioning: two consecutive waves entered P-0 with an imprecise seed framing,
  were corrected at P-0 without entering B-block under the wrong scope, and shipped the correct
  deliverable. This is a positive signal about system health, not a gap.

  Specific quality of the wave-55 reframe: the problem-framer correctly identified that
  (a) the positive-only seed was redundant with the existing 'everyone' control via code inspection
  of dm.service.ts:704-711; (b) the load-bearing untested cell was the NEGATIVE exclusion case;
  and (c) the seed's wave provenance was inaccurate ("wave-46/47" vs. actual wave-48 task
  03ccf636). All three corrections were code-evidence-based, not opinion-based. The ceo-reviewer
  independently reached the same conclusion about the negative cell from a strategic angle (a
  privacy control's worth is in what it BLOCKS). The mvp-thinner correctly scoped the wave as a
  2-cell coherent unit and did not oppose the negative addition (routed it to ceo-reviewer lane).
  The resulting deliverable — a genuine 2-cell integration truth-table on a privacy tier —
  is a more valuable regression fence than the original single-positive-assertion seed.

  This is not a promotion candidate (no gap surfaced; positive confirmation of a working mechanism).
  It is recorded as a clean-wave note for system-health tracking.

  Source artifacts:
  - process/waves/wave-55/stages/P-0-problem-framer.md (REFRAME; antipattern [3]; code
    evidence at dm.service.ts:704-711)
  - process/waves/wave-55/stages/P-0-ceo-reviewer.md (SELECTIVE-EXPANSION; "a privacy
    control's worth is entirely in what it BLOCKS")
  - process/waves/wave-55/stages/V-3-fast-fix.md (phase1_head_verifier_verdict: APPROVED;
    phase2 SKIPPED — empty fast-fix queue)

  Severity: informational (positive signal; no gap).
  Candidate principles file: none.
  Promotion flag: NO.

---

- **[obs-4 — status check on prior held observations]**

  Updating carried status from wave-54 obs-3 and all prior HOLDs:

  | origin | obs | class | wave-55 status |
  |--------|-----|-------|----------------|
  | wave-54 obs-2 | Seed premise about entire WS info-disclosure class being open was false; P-0 code-check collapsed sweep to verify-only; 1st instance of security-class-premise variant | NOT CONFIRMED as a second instance. Wave-55's P-0 catch is a distinct sub-class (false-coverage-value, not false-code-state). Wave-54 obs-2 HOLD maintained. Watch for a second wave where a security sweep's class-level premise is falsified at P-0 and the wave collapses to verify-only. |
  | wave-52 obs-3 (a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. V-3 head-verifier independently re-verified the negative assertion non-vacuous (USER_Q server-members + disjoint, excluded solely by inArray fence) before passing. Karen and jenny both independently probed all 6 ACs in V-1. The behavior the proposed VERIFY lesson formalizes continues to occur correctly. Still no case where a zero-finding gate passed a defect through unprobed; remains 1st-instance HOLD for VERIFY-PRINCIPLES rule 5. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. Wave-55 T-5 used a single tester (pattern B, 1 ui-comprehensive-tester). Remains multi-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate all compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-55 is test-only; no compute-on-read walk. Remains multi-wave HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite; T-4.md rule 1 | NOT CONFIRMED. Wave-55 is test-only; no new socket gateway introduced. Remains multi-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. Wave-55 is test-only; D-block skipped. Remains multi-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains multi-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. T-5 ran cleanly. Remains multi-wave HOLD. |
  | wave-45 obs-2 | playwright test --list false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities. Remains multi-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains multi-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used file:line git-show inspection against deployed tree. Remains multi-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains multi-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No architectural conflict; test-only wave. Remains multi-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params. Remains multi-wave HOLD. |

  Severity: informational (status checks only).
  Candidate principles file: none.
  Promotion flag: NO (status check; no new confirmation or escalation this wave).

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Wave-55 P-0 positive-redundant/negative-unverified catch is DISTINCT from wave-54 obs-2 (different predicate); both are applications of PRODUCT-PRINCIPLES rule 1; no new gap | informational | 1st instance of false-coverage-value sub-class; distinct from wave-54's false-code-state sub-class | none (rule 1 + rule 4 cover adjacent territory) | HOLD — 1st instance; promote on 2nd wave where a seed's positive-only assertion is shown redundant with existing control and the real gap is the untested negative cell |
| obs-2 | Sub-floor coverage wave resolved by PRODUCT rule 5 override-ship; 6th instance; rule functioning correctly | informational | 6th instance (waves 50-55); PRODUCT rule 5 already promoted at wave-52 | none | NO ACTION — rule 5 in force and correctly applied |
| obs-3 | Clean-wave note: P-0 reframe pipeline functioning; second consecutive test-only wave corrected at P-0 before B-block entry | informational | positive signal; no gap | none | NO PROMOTION — clean-wave health-check |
| obs-4 | Status check on prior held observations | informational | status checks | none | STATUS CHECK ONLY |

**Observations emitted: 4 (obs-1 through obs-4)**
**Severities: all informational (clean test-only wave; no production change; P-0 reframe resolved before B-block; all gates APPROVED; zero findings; zero fix-up cycles)**
**Promotion-eligible this wave: NONE**
**Nominations for karen vetting: NONE this wave**

Recurrence verdict on the specific question posed:
- Wave-54 obs-2 and wave-55 obs-1 are DISTINCT LESSONS (not the same recurring class).
- Wave-54: falsified a CODE-STATE claim ("vulnerability class is open" — it was closed).
  Matched antipatterns [1, 7]. Reductive correction (wave does less than proposed).
- Wave-55: falsified a COVERAGE-VALUE claim ("positive assertion covers new behavior" — it
  is redundant with the existing 'everyone' control; the real untested behavior is the negative
  cell). Matched antipattern [3]. Both reductive (positive demoted) and additive (negative
  identified and added).
- Both are applications of PRODUCT-PRINCIPLES rule 1, but of distinct sub-classes. Neither
  constitutes a second instance of the other. Each remains a 1st-instance HOLD of its
  respective sub-class.
