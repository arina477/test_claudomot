# Wave 89 — L-2 Distill Observations

Synthesized from wave-89 artifacts (academic-identity Save button enabled + scroll/focus on
failed-validation save; web commit b27277db, PR #110). Prior archive consulted: wave-13
(nearest accessible L-block observations — waves 14-88 L-blocks not present in archive on
disk). Principles files read: PRODUCT-PRINCIPLES.md (6 rules), BUILD-PRINCIPLES.md (19 rules).

---

```yaml
observations:

  - id: obs-1
    title: >
      P-0 trigger-reachability gap: problem-framer verified the handler was absent but not
      that the error state is enterable by real user input, shipping a no-op wave.
    summary: >
      Wave-89's P-0 problem-framer correctly verified that handleAcademicSave lacked
      scroll+focus on the error path (code-path gap: LIVE). It did not verify whether
      academicClientError can ever become truthy through real user input. Every academic
      field carries a native maxLength attribute equal to the validator cap, and the server
      Zod .max() mirrors it. Keyboard entry and paste are blocked at the browser level before
      the value can exceed the cap, so academicClientError is unreachable in practice.
      V-1 jenny caught this at the verification stage (Finding I1); head-verifier
      independently confirmed and classified it a spec-GAP in the P-0 seed premise.
      The shipped code is correct and harmless (the error-path returns before patchProfile;
      valid save is unaffected), but the wave defends a state no real user can enter.
      The framing in P-0-problem-framer.md documents exactly the gap: "Symptom-vs-cause:
      clean" — but that analysis examined whether the handler lacked focus, not whether
      the client-error state is externally enterable. The distinction is:
        (a) "does the code-path / handler exist?" (checked)
        (b) "can a real user reach the state that triggers that path?" (not checked)
      P-0 rule 1 covers (a). The wave-89 gap is (b): trigger-state reachability.
    source:
      - process/waves/wave-89/stages/P-0-problem-framer.md
        # "Symptom-vs-cause: clean — the symptom and the cause are the same layer.
        #  No wrong-layer, demo-path, premature-abstraction, or scope-creep antipattern matched."
        # (No check made whether academicClientError is enterable via real input.)
      - process/waves/wave-89/stages/V-1-jenny.md
        # Finding I1: "every academic field carries maxLength={ACADEMIC_MAX.<field>}... the
        #  browser blocks keyboard entry and paste beyond the cap... through typing, paste,
        #  and server-load, the over-length branch never fires in the deployed app."
      - process/waves/wave-89/stages/V-1-summary.md
        # jenny_verdict: APPROVE; spec_gap_count: 1; finding: "wave defends an unreachable state
        #  — native maxLength on academic fields prevents academicClientError from ever firing
        #  via real input; correct+harmless but no-op-in-practice."
      - process/waves/wave-89/stages/V-3-fast-fix.md
        # "Ruling: ship-safe, DO NOT revert... it's a spec-GAP in the P-0 seed premise,
        #  not a code defect."
      - process/waves/wave-89/stages/P-0-frame.md
        # Framing records "gap LIVE (verified against ProfilePage.tsx): NO save handler
        #  calls scrollIntoView/.focus() on a failed-validation save." No mention of
        #  checking whether client-error state is reachable via real user input.
    severity: strong
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      First confirmed occurrence of this specific failure class: trigger-state reachability
      not verified at P-0, causing the wave to ship a no-op. The invocation brief describes
      this as "the 3rd consecutive no-op seed" but the prior two were seed EVAPORATIONS at
      P-0 (already-fixed or deferred-unreachable bugs caught before the wave ran) — a
      PRODUCT-PRINCIPLES rule 1 class (false-absent premise). Wave-89 is structurally
      distinct: the seed premise survived P-0 verification, the wave ran to completion, and
      the no-op was discovered at V-1. The failure mode differs: the code-path gap was real;
      the error was that the trigger state for that path was guarded one layer higher (native
      maxLength). This is the first recorded instance of the trigger-reachability class.
    near_dup_check: >
      PRODUCT-PRINCIPLES rule 1: "Verify every seed claim about what exists or is absent in
      the code at P-0; decomposer prose drifts both ways." Rule 1's scope is existence /
      absence of code artifacts (does handler X exist, is feature Y absent). Wave-89's gap
      is not a false-absent or false-present code claim — the handler gap was correctly
      identified as absent. The gap is that existence of the handler gap does not imply the
      trigger state is reachable. Rule 1 asks "is the code present/absent?" Wave-89 requires
      additionally asking "can real input reach the error state that invokes that code?" These
      are orthogonal checks; rule 1 does not subsume trigger-reachability.

      PRODUCT-PRINCIPLES rule 4: "Gate a 'state unreachable here' claim by also checking
      whether it can arrive pre-set from a prior surface transition." Rule 4 addresses a
      surface asserting a state is UNREACHABLE that can nevertheless ARRIVE from an upstream
      transition. That is the inverse/mirror of wave-89: rule 4 protects against
      UNDER-defending (don't claim a state can't arrive when it can). Wave-89 is
      OVER-defending (claiming the state IS enterable when it cannot be entered via real
      input). Both are reachability failures, but opposite polarity:
        rule 4 = "don't miss a state that CAN arrive"
        wave-89 lesson = "don't defend a state that CANNOT be entered by real input"
      These are materially distinct rules; rule 4 does not cover wave-89's failure mode.

      BUILD-PRINCIPLES: 19 rules, all focused on code authoring, testing, seam verification,
      DB boundaries, and mutation guards. None address P-0 seed framing or error-state
      reachability. No near-dup.

      Conclusion: the wave-89 lesson is NOT covered by rule 1 (different check), NOT the same
      as rule 4 (opposite polarity), and has no near-dup in BUILD-PRINCIPLES. It is a
      genuine first-instance candidate.
    promotion_gates:
      generalizable: true
        # Applies to any P-0 verification of a client-side error path. Any form field with
        # a native maxLength matching a validator cap produces this class of gap. Also applies
        # to server-enforced floors (e.g., numeric min/max via HTML input type=number min/max
        # mirroring a validator) or any browser-level input constraint that guards the
        # validator path. The check is: "does the browser or input element prevent the
        # invalid state before the validator can fire?" Stack-independent in principle.
      falsifiable: true
        # Checkable at P-0: for every error state the seed targets, confirm that real user
        # input (keyboard, paste, form submit) can produce a value that makes that state
        # truthy, given the full constraint stack (HTML attributes + client validator +
        # server validator). If a native browser attribute blocks the value at the input
        # level, the state is unreachable and the seed premise is invalid.
      cited: true
        # P-0-problem-framer (absence of the check), V-1-jenny Finding I1, V-1-summary
        # (spec_gap_count:1), V-3-fast-fix (spec-GAP in seed premise) all reference the
        # same gap independently.
    candidate_rule_shape: >
      At P-0, confirm the error state the seed targets is enterable by real user input,
      not only that the handler for it is absent.
      Why: A handler gap is real but inert if a native browser constraint blocks the
      input that triggers it.

      Rule line char count: 98 (within 120).
      Why line char count: 75 (within 100).
      Forbidden-token check: no "we", "our", "the team", "during wave-", "wave-<N>",
      "because ... because", em-dash, or long parenthetical. Clean.
      Format: exactly 2 non-empty lines. Clean.
    disposition: HOLD
    hold_reason: >
      First occurrence. The promotion bar requires 2+ waves of recurrence. The pattern is
      well-documented, generalizable, falsifiable, and has no near-dup, but single-wave
      instances stay in observations until a second wave confirms. Hold in observations;
      promote to PRODUCT-PRINCIPLES if a subsequent wave's P-0 misses trigger-state
      reachability (any form of input-constraint blocking that makes a validated error state
      unreachable while the fix-handler check passes).

  - id: obs-2
    title: "Component test fireEvent bypasses maxLength: test-path reachability distinct from real-input reachability"
    summary: >
      The wave-89 test suite exercises the over-length academic error path using
      fireEvent.change in jsdom. The test file itself documents this explicitly:
      "fireEvent.change bypasses the maxLength attribute in jsdom, so we can push
      over-length" and "dead-code-in-practice, reachable only via fireEvent.submit".
      The tests are internally correct (they verify the handler behaves correctly when
      given an over-length value), but they exercise a state the deployed browser
      prevents. V-1 jenny classified the tests as authoritative at their stated scope
      ("component tests authoritative") while simultaneously noting they document the
      production unreachability. This creates a class of test that is green, correct at
      its stated scope, and yet defends a path that has no real-user trigger. The lesson
      is distinct from obs-1: obs-1 is about P-0 seed verification; obs-2 is about
      recognizing that component tests using fireEvent can validate unreachable production
      paths, making them correct-but-inert coverage rather than regression insurance.
    source:
      - process/waves/wave-89/stages/V-1-jenny.md
        # "profile-academic.test.tsx:152 (fireEvent.change bypasses the maxLength attribute
        #  in jsdom, so we can push over-length) and :162 (dead-code-in-practice, reachable
        #  only via fireEvent.submit). The head-tester ruled component tests authoritative,
        #  and they ARE internally correct — but they exercise a state the browser prevents."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      First observed documentation of fireEvent bypassing maxLength producing correct-but-inert
      coverage. No prior archive records this specific pattern. Not a test defect (the tests
      are correct for their scope); informational note on a coverage class. Hold.
    disposition: HOLD
    hold_reason: >
      Informational. No promotion candidate — the pattern doesn't rise to a rule without a
      second confirming instance, and the correct mitigation (note in test comment that the
      path is unreachable via real input) is already present in the wave-89 test file itself.
      Observed as a consequence of obs-1, not an independent defect.

  - id: obs-3
    title: "Backlog-drain signal: 3rd wave with no effective real-world user impact (distinct failure modes)"
    summary: >
      Wave-89 is described by both problem-framer and head-verifier as the Nth consecutive
      wave with no effective real-world user impact. However, the failure modes differ across
      the series:
        - Prior waves (described as "4+ seeds evaporated at P-0"): seed EVAPORATION class
          (already-fixed or deferred-unreachable bugs killed at P-0 before the wave ran).
          This is a PRODUCT-PRINCIPLES rule 1 class.
        - Wave-89: trigger-reachability gap (seed survived P-0, wave ran to completion,
          no-op discovered at V-1). This is the obs-1 class.
      The convergence of multiple no-op failure modes under backlog-drain conditions is itself
      informational: as the bug backlog empties, P-0 premises become more likely to rest on
      partially-verified claims (the remaining bugs are marginal, interaction-dependent, or
      guarded by adjacent constraints). This is a systemic signal about the project phase
      rather than a specific rule violation.
    source:
      - process/waves/wave-89/stages/P-0-frame.md
        # "Backlog-drain signal (informational; founder-deferred — reinforced this wave)...
        #  4+ consecutive N-2 seeds evaporated at P-0; wave-88's N-2 found 3 MORE candidates
        #  already fixed."
      - process/waves/wave-89/stages/V-3-fast-fix.md
        # "strategic_escalation: '3rd consecutive no-op seed; roadmap-replan is the highest-
        #  leverage move; surfaced to founder digest + flagged for N-block'"
    severity: informational
    candidate_principles_file: none
    recurrence: >
      The backlog-drain signal itself has been escalating across multiple waves. This
      observation consolidates the signal but does not propose a new rule. The surfacing
      mechanism (founder digest + N-block flag) is already operational.
    disposition: HOLD
    hold_reason: >
      Informational systemic signal. The appropriate response (roadmap-replan decision by
      founder) is already flagged to the N-block and founder digest. No rule is needed;
      the signal is about project phase, not a repeatable process gap with a mechanical fix.
```

---

## Wave-89 L-2 distill disposition

**Promotion candidates assessed: obs-1**

**obs-1 (P-0 trigger-state reachability not checked) — SINGLE-WAVE; HOLD.**

The candidate lesson — "At P-0, verify the error state is enterable by real user input, not only that the handler for it is absent" — is well-formed, generalizable, falsifiable, and has no near-dup in PRODUCT-PRINCIPLES or BUILD-PRINCIPLES. The de-dup analysis confirms:

- Rule 1 ("verify what exists or is absent in code") does NOT subsume it: rule 1 targets code-artifact presence/absence; trigger-state reachability is an orthogonal check about input-constraint layers.
- Rule 4 ("gate a 'state unreachable here' claim by checking upstream surfaces") does NOT cover it: rule 4 protects against under-defending reachable states (don't miss a state that CAN arrive). Wave-89 is the opposite polarity (over-defending a state that CANNOT be entered). These are related but materially distinct; rule 4 would not have caught wave-89's gap.

However: first occurrence only. Recurrence condition not met. Hold in observations until a second wave confirms. Candidate rule for the next qualifying wave:

```
At P-0, confirm the error state the seed targets is enterable by real user input,
not only that the handler for it is absent.
Why: A handler gap is real but inert if a native browser constraint blocks the
input that triggers it.
```

Rule line = 98 chars (within 120). Why line = 75 chars (within 100). No forbidden tokens. No near-dup confirmed.

**obs-2 (fireEvent bypasses maxLength: correct-but-inert coverage) — INFORMATIONAL; NO PROMOTION.**
Consequence of obs-1 rather than an independent defect class. First and only observed instance. No promotion candidate.

**obs-3 (backlog-drain multi-failure-mode convergence) — INFORMATIONAL; NO PROMOTION.**
Phase signal already surfaced via founder digest and N-block. No mechanical rule applies.

**Summary table:**

| id    | title (short)                                 | severity      | recurrence | disposition                                              |
|-------|-----------------------------------------------|---------------|------------|----------------------------------------------------------|
| obs-1 | P-0 trigger-state reachability not checked    | strong        | 1 wave     | HOLD; promote if recurs (PRODUCT-PRINCIPLES candidate)   |
| obs-2 | fireEvent bypasses maxLength: inert coverage  | informational | 1 wave     | HOLD; no promotion candidate                             |
| obs-3 | Backlog-drain: multi-failure-mode convergence | informational | n/a        | HOLD; phase signal already surfaced to N-block           |
