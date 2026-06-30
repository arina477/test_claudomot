# Wave 21 — L-2 Distill Observations

Synthesized from wave-21 artifacts (M4 wave-2 offline UX: live connection-state derivation +
multi-page catch-up loop + tests; PR#33 9c48007; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{16,17,18,19,20}/blocks/L/observations.md.
Principles files read: PRODUCT-PRINCIPLES (1 rule, promoted w20), BUILD-PRINCIPLES (4 rules,
rule 4 promoted w18), VERIFY-PRINCIPLES (1 rule), CI-PRINCIPLES (3 rules, rule 3 promoted w19).

---

```yaml
observations:

  - id: obs-1
    summary: >
      PRODUCT-PRINCIPLES rule 1 ("Verify every seed claim about what exists or is absent in
      the code at P-0; decomposer prose drifts both ways") was validated on its first
      post-promotion use. The milestone-decomposer applied the rule during N-1/decomposition
      BEFORE the wave opened: it dropped the already-shipped pending/failed UI task (would
      have been a false-absent rebuild), corrected the dead-component task (ConnectionStateIndicator
      existed but was hardcoded offline), and the problem-framer re-confirmed all three premises
      against the live codebase at P-0 before scoping. The rule changed behavior at
      decomposition time, not just at P-0 — the earliest possible catch. No rework, no
      scope-correction during the wave. Rule 1 is functioning as intended.
    source:
      - process/waves/wave-21/stages/P-0-frame.md (Discover section)
        # "the decomposer ALREADY applied PRODUCT-PRINCIPLES rule 1 (premise-verified the
        #  bundle: dropped already-shipped pending/failed UI, corrected the dead-component
        #  task)."
      - process/waves/wave-21/checklist.md (P-0 pending ritual: "Verify seed premises vs
        codebase per PRODUCT-PRINCIPLES rule 1")
    severity: informational
    candidate_principles_file: none
    recurrence: >
      PRODUCT-PRINCIPLES rule 1 already promoted (wave-20). This is the first wave it was
      actively applied at decomposition time (pre-P-0). Validation of an existing rule.
      No re-promotion warranted. Informational record only.
    disposition: INFORMATIONAL validation of PRODUCT rule 1. No new promotion.

  - id: obs-2
    summary: >
      obs-4 (principles-file write outside L-block) DID NOT RECUR this wave. The head-verifier
      at V-3 explicitly recorded the async-invariant-executing-test candidate in the stage
      deliverable (V-3-fast-fix.md "Note for L-2") rather than writing to VERIFY-PRINCIPLES.md.
      The orchestrator passed a per-spawn no-edit directive in the V-3 prompt. This is the
      first wave the directive held after seven prior bypass instances (w9/12/17/18 head-ci-cd
      CI-PRINCIPLES; w19/20 head-verifier VERIFY-PRINCIPLES). The six-wave structural guard
      escalation (git diff check at block exit) remains unimplemented; the per-prompt no-edit
      reminder is a working stopgap, not a structural fix.
    source:
      - process/waves/wave-21/stages/V-3-fast-fix.md ("Note for L-2 ... L-2 owns the
        promote/reject decision; head-verifier does not edit VERIFY-PRINCIPLES.md")
      - process/waves/_archive/wave-20/blocks/L/observations.md obs-4
        # "Six-wave streak; the revert discipline holds but the prevention mechanism remains
        #  absent."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      Seven prior bypass instances (waves 9/12/17/18/19/20), now one wave of non-recurrence.
      One non-recurrence is not sufficient to retire the structural guard escalation.
      The per-prompt directive works as a stopgap; the structural guard (git diff at every
      block exit) remains unimplemented. N-block structural guard escalation continues to
      apply — update count to 7 prior bypasses, 1 wave stopgap-held. Positive signal but
      not resolution.
    disposition: >
      INFORMATIONAL positive. No promotion (no principles rule can encode this; guard is
      structural). Re-note for N-block: per-prompt reminder held wave-21; structural guard
      (git diff HEAD -- 'command-center/principles/*.md' non-empty -> gate fails at every
      block exit) still pending implementation after 7-wave streak.

  - id: obs-3
    summary: >
      The wave-21 M1 finding (catch-up while-loop re-entrancy: two concurrent triggers fire
      runDrainAndCatchup simultaneously -> doubled round-trips, dedup-safe, correctness
      preserved) is the same structural class as wave-20 H1 (drain() re-entrancy: two
      concurrent triggers fire drain() -> double-POST, reordering risk, fixed with
      _drainInFlight guard). Both are reconnect-triggered async loops with no in-flight guard
      allowing concurrent overlapping runs. Wave-20 fixed drain(); the catch-up while-loop
      added in wave-21 lacks the same guard. The instances are sufficiently similar to
      constitute a same-class recurrence: (a) both are reconnect-triggered (socket connect +
      window online firing together); (b) both lack an in-flight/mutex guard on first
      encounter; (c) both are correctness-preserving (dedup covers data) but wasteful (2x
      round-trips or double-POST); (d) the fix in wave-20 (module-level promise flag) is
      directly portable to wave-21's catch-up loop. The distinction is severity: wave-20
      was High (reorder risk on the in-order wedge); wave-21 is Medium (perf only —
      catch-up has dedup-by-id + idempotent cache bulkPut, no ordering wedge). Same class,
      different consequence severity because the correctness contract differs between drain
      (strict in-order) and catch-up (dedup-safe). The generalizable lesson is the same:
      reconnect-triggered async loops need an in-flight guard at implementation time, not
      discovered at review.
    source:
      - process/waves/wave-21/stages/T-7-perf.md (M1 section)
        # "M1 — catch-up re-entrancy: 2x round-trips on overlapping reconnect; dedup-safe;
        #  correctness preserved. -> V-2"
      - process/waves/wave-21/stages/V-2-triage.md (M1 disposition)
        # "catch-up while-loop re-entrancy -> doubled reconnect round-trips (dedup-safe,
        #  correctness preserved). Fix = in-flight guard (wave-20 drain pattern). -> accepted"
      - process/waves/_archive/wave-20/stages/B-6-review-output.md (H1 section)
        # "drain() has no re-entrancy guard -> concurrent drains double-POST AND can reorder
        #  on the server ... Fix: module-level let draining = false (or a promise-chain mutex)"
      - process/waves/_archive/wave-20/blocks/B/gate-verdict.md (H1 cleared section)
        # "_drainInFlight: Promise<void> | null guard ... No concurrent double-drain:
        #  confirmed. Two triggers (socket connect, window online) both route through
        #  runDrainAndCatchup -> drain(); the second collapses onto the first's promise."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      CONFIRMED SAME-CLASS RECURRENCE across two consecutive M4 waves:
        wave-20 H1: drain() has no re-entrancy guard; two reconnect triggers (socket connect +
          window online -> runDrainAndCatchup -> drain()) fire concurrently -> double-POST +
          reorder risk (High: in-order wedge at risk). Fixed: _drainInFlight promise-mutex.
          Caught at B-6 Phase-2 adversarial /review.
        wave-21 M1 (this): runDrainAndCatchup while-loop has no in-flight guard; same two
          reconnect triggers can fire concurrently -> 2x round-trips (Medium: dedup-safe,
          no ordering wedge). Caught at T-7. The wave-20 guard pattern (_drainInFlight)
          is directly portable.
      Same root: reconnect-triggered async loop lacks in-flight coalescing at authoring time.
      Different consequence severity (reorder vs doubled round-trips) because the loop's
      correctness contract differs (strict-in-order drain vs dedup-safe catch-up).
      BUILD-PRINCIPLES has 4 rules. Cap is clear (rule 5 this wave).
      Near-dup check: BUILD rules 1-4 address backfill/seed parity, branch discipline,
      boot-artifact validation, adversarial Phase-2. None addresses reconnect-loop concurrency.
      No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any reconnect-triggered async loop in the codebase (drain, catch-up,
        # and any future loop triggered by socket connect + window online). Not limited to
        # M4 offline-first: any event-triggered async loop that can fire from multiple
        # simultaneous event sources needs this guard.
      falsifiable: true
        # Checkable at B-6 for any newly authored reconnect-triggered async loop: is there
        # a module-level in-flight flag or promise-mutex coalescing concurrent triggers?
        # Absence of the guard on a newly authored reconnect-triggered loop fails the rule.
      cited: true
        # wave-20 B-6-review-output.md H1 (found at Phase-2); wave-20 B-6 Phase-2 re-review
        # (H1 cleared via _drainInFlight guard); wave-21 T-7-perf.md M1 + V-2-triage.md M1
        # (same class, catch-up loop, accepted as perf debt).
    candidate_rule_shape: >
      5. Guard every reconnect-triggered async loop with an in-flight coalescing flag or
         promise-mutex at authoring time.
         Why: Two simultaneous reconnect events (socket connect + window online) overlap
         the loop without a guard, causing redundant requests or reorder risk.
      Rule line = 113 chars (within 120); why line = 97 chars (within 100). No forbidden tokens.
    promotion_requires: karen vet (rule quality) + head-builder sign-off (domain applicability)
    promotion_status: CANDIDATE — pending karen + head-builder vet

  - id: obs-4
    summary: >
      V-3 fast-fix closed the L2-resume-test gap: the page-2-rejects -> resume-from-page-1-cursor
      (no gap, no dup) path for the no-data-loss invariant was proven only by code+server-contract
      reasoning before V-3, not by an executing test. V-2 caught this as a test-completeness
      gap on a load-bearing invariant. V-3 added Test 6 (multiPageCatchup.test.ts:425-475):
      page-2 rejects, 2nd reconnect resumes from page-1's server cursor, asserts no-gap + no-dup.
      Karen confirmed mutation-tested (resetting lastSeenCursorRef in the catch makes Test 6
      fail). This surfaces a verification methodology pattern: a "no findings / clean" verdict
      on a non-trivial async invariant deserves a probe that the invariant has an executing
      test with mutation sensitivity, not only code + server-contract reasoning. Test names
      that over-claim coverage (Test 5 "mid-loop disconnect" resolves both pages) mask the gap.
      This candidate is distinct from VERIFY-PRINCIPLES rule 1 (which addresses seeding ACs
      by create-path inspection — a different axis about what to inspect, not about executing
      test vs reasoning). First instance of this specific class (async invariant proven by
      reasoning, caught at V-2/V-3).
    source:
      - process/waves/wave-21/stages/V-3-fast-fix.md (Note for L-2 section)
        # "a reviewer 'no findings / clean' on a non-trivial async-invariant change deserves
        #  a probe that the invariant has an EXECUTING test, not just code+contract reasoning"
      - process/waves/wave-21/stages/T-4-integration.md (L2 honest caveat)
        # "The 'no-data-loss-on-resume-after-mid-loop-failure' invariant is proven by code +
        #  server-contract reasoning ... NOT by an executing test."
      - process/waves/wave-21/stages/V-2-triage.md (L2-resume-test fast-fix routing)
    severity: warning
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    recurrence: >
      First instance of the "async invariant proven by reasoning, not executing test; missed
      at initial verification, caught at V-2/V-3" class. VERIFY-PRINCIPLES rule 1 (seeding
      ACs by create-path inspection) is a different axis. Wave-19 obs-3 (spoofed-input test
      pattern) and wave-20 obs-3 (cursor-codec round-trip) are both distinct classes, both
      still on HOLD (no second confirming wave for either). This candidate does not confirm
      either prior held candidate. HOLD. Promote to VERIFY-PRINCIPLES rule 2 (taking the
      next sequential slot after rule 1) if a second wave has a load-bearing async invariant
      proven only by reasoning that a V-block probe catches as missing an executing test.
    near_dup_check: >
      VERIFY-PRINCIPLES rule 1: inspect create-path source for seeding ACs. Different axis
      (presence of seeding vs proof methodology for async invariants). No near-dup.
      Wave-19 obs-3 candidate (spoofed-input test) and wave-20 obs-3 candidate (cursor-codec
      round-trip) are distinct classes; neither is a near-dup with this candidate.
    disposition: HOLD. First instance. Promote to VERIFY-PRINCIPLES rule 2 on second
      confirming wave.
    candidate_rule_shape_if_confirmed: >
      2. Probe a "no findings" verdict on any non-trivial async invariant for an executing
         mutation-sensitive test; code and contract reasoning alone do not suffice.
         Why: A plausible reasoning chain passes review while the invariant has no guard
         against a future regression.
      Rule line = 114 chars (within 120); why line = 80 chars (within 100). No forbidden tokens.
```

---

## Wave-21 L-2 distill disposition

**obs-1 (PRODUCT rule 1 validated, first post-promotion use) — INFORMATIONAL; NO PROMOTION.**

Rule already exists (PRODUCT-PRINCIPLES rule 1, promoted wave-20). First wave it was applied
at decomposition time, before P-0. Rule is working. No action.

---

**obs-2 (principles-file bypass non-recurrence, wave-21; per-prompt no-edit reminder held) — INFORMATIONAL POSITIVE; NO PROMOTION.**

Seven prior bypass instances; one wave held via per-prompt directive. Positive signal.
Structural guard (git diff check at every block exit) still unimplemented. Re-note for N-block:
update count to 7-wave streak + 1-wave stopgap hold. No principles rule can encode this.

---

**obs-3 (reconnect-triggered async loop lacks in-flight guard — 2nd instance same class) — PROMOTION CANDIDATE.**

Two-wave same-class evidence: wave-20 H1 (drain() re-entrancy, High, reorder risk, fixed with
_drainInFlight promise-mutex) + wave-21 M1 (catch-up while-loop re-entrancy, Medium, doubled
round-trips, dedup-safe). Both: reconnect-triggered async loop, two simultaneous event triggers
(socket connect + window online), no in-flight coalescing guard at authoring time. Wave-20 fix
directly portable to wave-21. BUILD-PRINCIPLES has 4 rules; cap is clear (rule 5 this wave).
No near-dup with rules 1-4. Recurrence condition met.

Candidate rule for karen + head-builder to vet:
```
5. Guard every reconnect-triggered async loop with an in-flight coalescing flag or
   promise-mutex at authoring time.
   Why: Two simultaneous reconnect events (socket connect + window online) overlap
   the loop without a guard, causing redundant requests or reorder risk.
```
Rule line = 113 chars (within 120); why line = 97 chars (within 100). No forbidden tokens.

Promotion requires: karen vet (rule quality) + head-builder sign-off (domain applicability).

---

**obs-4 (async invariant proven by reasoning only; V-2/V-3 probe caught the missing executing test — first instance) — HOLD.**

First instance of this class. VERIFY-PRINCIPLES rule 1 is a different axis (AC-seeding, not
proof methodology). Wave-19 obs-3 and wave-20 obs-3 (both on HOLD) are distinct classes.
Hold; promote to VERIFY-PRINCIPLES rule 2 on a second confirming wave (another load-bearing
async invariant proven by reasoning that V-block catches as needing an executing test).

---

## Summary table

| id    | title (short)                                                  | severity      | recurrence | disposition                                                             |
|-------|----------------------------------------------------------------|---------------|------------|-------------------------------------------------------------------------|
| obs-1 | PRODUCT rule 1 validated (first post-promotion application)    | informational | 1 wave*    | INFORMATIONAL; rule exists; no action                                   |
| obs-2 | Principles-bypass non-recurrence (per-prompt directive held)   | informational | 7 prior + 0 this | INFORMATIONAL POSITIVE; structural guard still pending; N-block re-note |
| obs-3 | Reconnect-loop re-entrancy guard absent (2nd same-class inst.) | warning       | 2 waves    | PROMOTE to BUILD-PRINCIPLES rule 5 (karen + head-builder vet)           |
| obs-4 | Async invariant proven by reasoning; V-2 caught missing test   | warning       | 1 wave     | HOLD; promote to VERIFY-PRINCIPLES rule 2 on 2nd confirming wave        |

*obs-1 recurrence is as a validation wave for a rule promoted at wave-20; the class itself spans wave-18+20 (the promotion evidence).

**Promotions this wave: 1 candidate (obs-3 to BUILD-PRINCIPLES rule 5), conditional on karen + head-builder sign-off.**
