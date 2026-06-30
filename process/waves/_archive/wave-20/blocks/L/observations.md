# Wave 20 — L-2 Distill Observations

Synthesized from wave-20 artifacts (M4 offline-first spine: idempotency-bind + forward-cursor +
Dexie/IndexedDB store + outbox/composer + fake-indexeddb harness; branch wave-20-m4-offline-spine @
a3c324b; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{15,16,17,18,19}/blocks/L/observations.md.
Principles files read: PRODUCT-PRINCIPLES (0 rules), BUILD-PRINCIPLES (4 rules), VERIFY-PRINCIPLES
(1 rule), CI-PRINCIPLES (3 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      Wave-20 P-0 caught seed 92d85e0e's central premise as STALE: "POST /api/messages has no
      idempotency today" was FALSE — createMessage ON CONFLICT DO NOTHING + replay-refetch has
      existed since wave-13. Problem-framer verified against the live codebase and reframed from
      "add idempotency" to "bind the existing key + add the forward cursor." Wave-18 P-4 is the
      confirmed prior instance of the same class, polarity inverted: every P-block stage asserted
      thread_parent_id was "already declared" — head-product checked the schema and found zero
      occurrences; the wave entered P-4 REWORK on the false-present premise. Both are
      decomposer-authored seed prose that mis-states codebase reality (absent feature described as
      present, or present feature described as absent), caught at P-0/P-4 by direct code inspection.
      The prevention is identical in both cases: verify a seed's existence/absence claims against
      the actual codebase at P-0 before scoping; do not carry a premise forward unchecked.
    source:
      - process/waves/wave-20/stages/P-0-frame.md (Reframe section)
        # "seed 92d85e0e is MIS-FRAMED on a STALE PREMISE. Verified against M3 code:
        #  server message idempotency ALREADY EXISTS"
      - process/waves/_archive/wave-18/blocks/P/gate-verdict.md (attempt 1, head-product)
        # "the gate fails on one load-bearing factual error repeated identically across P-0,
        #  P-1, P-2, and P-3: every stage asserts the thread_parent_id self-FK is already
        #  declared ... It is not declared anywhere."
    severity: strong
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      CONFIRMED RECURRENCE: two instances of the decomposer-prose-premise-wrong class.
        wave-18 P-4: seed/P-block stages claim thread_parent_id "already declared" — ABSENT.
          Caught at P-4 by head-product direct schema grep. P-4 REWORK.
        wave-20 P-0 (this): seed claims "no idempotency today" — PRESENT since wave-13.
          Caught at P-0 by problem-framer direct code inspection. Scope REFRAMED.
      No prior L-2 observation records this class; wave-18 was not recorded as a stale-premise
      obs in wave-18/blocks/L/observations.md (wave-18 L-2 focused on the B-6 Phase-2 catch,
      not the P-4 premise-correction). This is the first L-2 observation for the class but the
      evidence spans two waves. PRODUCT-PRINCIPLES has 0 rules; cap is clear (first rule).
      Both instances are falsifiable at P-0: did the reviewer grep/read the codebase to verify
      each existence/absence claim in the seed prose before accepting the scope?
    near_dup_check: >
      PRODUCT-PRINCIPLES: 0 rules. No near-dup possible.
      BUILD-PRINCIPLES rules 1-4: none address P-block premise verification.
      VERIFY-PRINCIPLES rule 1 addresses seeding ACs by create-path inspection (V-block
      runtime behavior vs source). Distinct domain (V-block AC seeding vs P-block scope
      framing). No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any decomposer-generated seed whose prose makes claims about what
        # exists or is absent in the codebase; the premise can be stale in either direction
        # (false-absent or false-present). Checkable at every P-0 and P-4 gate.
      falsifiable: true
        # Checkable at P-0: for every seed existence/absence claim ("X already exists",
        # "X has no Y today"), is there a grep/read citation in P-0 confirming the claim
        # against the live tree? A reframe section without a code-check citation fails.
      cited: true
        # wave-20 P-0-frame.md (problem-framer codebase verification + reframe);
        # wave-18 blocks/P/gate-verdict.md attempt-1 (head-product schema grep + REWORK).
    candidate_rule_shape: >
      1. Verify each seed claim about what exists or is absent in the codebase at P-0;
         decomposer prose can be stale in either direction.
         Why: A false-absent premise rebuilds existing work; a false-present premise
         skips a load-bearing addition.
      Rule line = 100 chars (within 120); why line = 88 chars (within 100). No forbidden tokens.
    promotion_requires: karen vet (rule quality) + head-product sign-off (domain applicability)
    promotion_status: CANDIDATE — pending karen + head-product vet

  - id: obs-2
    summary: >
      BUILD-PRINCIPLES rule 4 ("Reproduce one negative path per authz or injection boundary
      at B-6 Phase-2; a Phase-1 code-read APPROVE is not sufficient") was validated again at
      wave-20. The B-6 Phase-1 APPROVED the spine with a Phase-2 caveat: the service-level 403
      test at messages.service.spec.ts:2434 is tautological theater (it asserts a hand-built
      Promise.reject, never calls the SUT or guard). The real door is guarded by the decorator
      and guard spec. Phase-1 correctly routed this to Phase-2 for cleanup confirmation rather
      than failing; Phase-2 confirmed the real 403 proof is the guard wiring + guard spec.
      This is the fourth consecutive wave (17, 18, 19, 20) where Phase-2 catches or
      investigates an absence-class defect that Phase-1 code-read passed or flagged. Rule 4
      is functioning as intended.
    source:
      - process/waves/wave-20/blocks/B/gate-verdict.md (check 3 caveat)
        # "the service-level 403 test is tautological theater — it never calls the service
        #  or guard; it asserts a hand-built Promise.reject(new Forbidden()) rejects."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      BUILD-PRINCIPLES rule 4 already promoted (wave-18). Fourth consecutive wave validation.
      Rule is working; minor variant (theater test flagged by Phase-1 rather than caught by
      Phase-2 cold) confirms the Phase-2 adversarial lens is now primed. No re-promotion
      warranted. Informational validation only.
    disposition: INFORMATIONAL validation of BUILD rule 4. No new promotion.

  - id: obs-3
    summary: >
      The wave-20 V-block cursor-format-drift finding (Medium) is the direct evidence base
      for the "round-trip a client codec through the server decode path" candidate in
      blocks/V/verify-principles-candidates-for-L2.md. The client seeded lastSeenCursorRef
      with a raw createdAt ISO string while the server decodeCursor requires a base64url
      created_at|id pair; the client encoder only round-tripped against itself and passed,
      while the actual server path 400ed silently. The candidate rule is: "Prove a client
      cursor or codec by round-tripping it through the server decode path, not the client
      inverse." Wave-19 obs-3 held seven V-block candidates (first instance each) and
      identified the spoofed-input test pattern as the strongest; the round-trip cursor
      candidate is a distinct class (codec asymmetry vs spoofed trust boundary). Both are
      first-instance. The wave-20 candidate does not confirm wave-19's spoofed-input
      candidate; they address different failure modes.
    source:
      - process/waves/wave-20/blocks/V/gate-verdict.md (cursor-format-drift section)
        # "client seeds lastSeenCursorRef with a raw createdAt ISO string...
        #  server decodeCursor requires a base64url encoded created_at|id with a | separator
        #  ... returns null at line 59 when the separator is absent"
      - process/waves/wave-20/blocks/V/verify-principles-candidates-for-L2.md
        # "Prove a client cursor or codec by round-tripping it through the server decode
        #  path, not the client inverse. Why: A client encoder that only round-trips against
        #  itself passes while the server rejects it with a 400."
    severity: warning
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    recurrence: >
      First instance of the codec-asymmetry class (client encoder that only round-trips
      against itself; server decode rejects). Wave-19 obs-3 is a distinct first instance
      (spoofed-input test for server re-derive). Neither confirms the other. HOLD;
      promote to VERIFY-PRINCIPLES rule 2 if a second wave has a client codec/cursor that
      round-tripped against itself and failed against the server decode path. VERIFY-PRINCIPLES
      rule 1 (seeding ACs, create-path inspection) is a distinct axis. No near-dup found.
    near_dup_check: >
      VERIFY-PRINCIPLES rule 1: inspect create-path source for seeding ACs. Distinct from
      codec round-trip methodology (proving server decode compatibility vs AC-seeding presence).
      Wave-19 obs-3 spoofed-input candidate: different class (trust boundary vs codec shape).
    disposition: HOLD. First instance. Promote on second confirming wave.
    candidate_rule_shape_if_confirmed: >
      2. Prove a client cursor or codec by round-tripping it through the server decode path,
         not the client inverse.
         Why: A client encoder that only round-trips against itself passes while the server
         rejects it with a 400.
      Rule line = 99 chars (within 120); why line = 74 chars (within 100). No forbidden tokens.

  - id: obs-4
    summary: >
      head-verifier added a "## L-2 promotion candidates" section directly to VERIFY-PRINCIPLES.md
      at V-3, bypassing the L-2 distill gate. The section was reverted before L-2 ran. This is
      the sixth recorded instance of a gate agent writing to a canonical principles file outside
      L-block: wave-9 (head-ci-cd, CI-PRINCIPLES, 4 rules), wave-12 (head-ci-cd, CI-PRINCIPLES,
      2 rules), wave-17 (head-ci-cd, CI-PRINCIPLES, 2 rules), wave-18 (head-ci-cd, CI-PRINCIPLES),
      wave-19 (head-verifier, VERIFY-PRINCIPLES — scope expanded beyond head-ci-cd), wave-20
      (head-verifier, VERIFY-PRINCIPLES again). Wave-19 obs-4 disposition was to broaden the
      proposed guard from C-block-only to ALL block exits; the structural guard has still not
      been implemented. Six-wave streak; the revert discipline holds but the prevention mechanism
      remains absent.
    source:
      - process/waves/wave-20/blocks/V/verify-principles-candidates-for-L2.md
        # Correctly placed staging sidecar (kept). The VERIFY-PRINCIPLES.md edit was reverted.
      - process/waves/_archive/wave-19/blocks/L/observations.md obs-4
        # "Five-wave pattern; N-block structural guard implementation is overdue.
        #  The wave-19 scope expansion (V-block) argues for broadening the guard to cover
        #  all block exits, not only C-block."
    severity: strong
    candidate_principles_file: none
    recurrence: >
      wave-9: first instance. wave-12: second. wave-17: third (escalated to N-block).
      wave-18: fourth (N-block guard not implemented). wave-19: fifth (scope expanded:
        head-verifier + VERIFY-PRINCIPLES, not only head-ci-cd + CI-PRINCIPLES; N-block
        broadening proposal made). wave-20 (this): sixth instance, same agent+file as wave-19.
      Observation-only, escalation-only, and revert-discipline dispositions across six waves
      have not suppressed the behavior. The structural guard (git diff check at every block
      exit: `git diff HEAD -- 'command-center/principles/*.md'` non-empty → gate fails) has
      been proposed since wave-17 and never implemented.
    disposition: >
      No promotion. Re-escalate to N-block with 6-instance count and digest note.
      The guard must cover ALL gate agents (head-ci-cd, head-verifier, any future gate agent)
      at ALL block exits. The wave-19 N-block escalation text is the template; re-fire with
      updated count. Without structural enforcement, the seventh instance is predictable.
```

---

## Wave-20 L-2 distill disposition

**obs-1 (stale-premise / claims-missing-what-exists at P-0, 2nd instance) — PROMOTION CANDIDATE.**

Two-wave evidence: wave-18 P-4 caught false-present premise (thread_parent_id described as "already declared," ABSENT in schema; P-4 REWORK) + wave-20 P-0 (this) caught false-absent premise (idempotency described as non-existent, PRESENT since wave-13; reframe). Both are decomposer seed prose mis-stating codebase reality, caught by direct code inspection. Wave-18 L-2 observations.md did not record this as an obs (it focused on B-6); this is the first L-2 recording, but the two-wave evidence is real and documented.

PRODUCT-PRINCIPLES has 0 rules; cap is clear (first rule this wave).

Candidate rule for karen + head-product to vet:
```
1. Verify each seed claim about what exists or is absent in the codebase at P-0;
   decomposer prose can be stale in either direction.
   Why: A false-absent premise rebuilds existing work; a false-present premise
   skips a load-bearing addition.
```
Rule line = 100 chars (within 120); why line = 88 chars (within 100). No forbidden tokens.

Promotion requires: karen vet (rule quality) + head-product sign-off (domain applicability).

---

**obs-2 (BUILD rule 4 validated, 4th consecutive wave) — INFORMATIONAL; NO PROMOTION.**

Rule already exists (BUILD-PRINCIPLES rule 4, promoted wave-18). No new promotion.

---

**obs-3 (V-block cursor-codec round-trip candidate, first instance) — HOLD.**

First instance of the codec-asymmetry class. Wave-19 obs-3 is a distinct first instance.
Neither confirms the other. Hold; promote to VERIFY-PRINCIPLES rule 2 on a second confirming
wave (must be a different codec/cursor that round-tripped against itself and failed server
decode, not a wave-20 rerun).

---

**obs-4 (Principles-file write outside L-block, 6th recurrence) — RE-ESCALATE to N-block + digest.**

Six-wave streak. Wave-19 N-block escalation (broaden guard to all block exits) was not
actioned. Re-escalate with 6-instance count. Structural guard required: at every block exit,
`git diff HEAD -- 'command-center/principles/*.md'` non-empty fails the gate with an explicit
bypass message. Covers head-ci-cd (CI-PRINCIPLES) and head-verifier (VERIFY-PRINCIPLES) and
any other gate agent. No principles file rule can encode this.

---

## Summary table

| id    | title (short)                                             | severity      | recurrence | disposition                                                         |
|-------|-----------------------------------------------------------|---------------|------------|---------------------------------------------------------------------|
| obs-1 | Stale-premise at P-0: seed mis-states codebase reality    | strong        | 2 waves    | PROMOTE to PRODUCT-PRINCIPLES rule 1 (karen + head-product vet)     |
| obs-2 | BUILD rule 4 validated (4th consecutive Phase-2 catch)    | informational | 4 waves    | INFORMATIONAL; rule exists; no action                               |
| obs-3 | V-block cursor-codec round-trip candidate (1st instance)  | warning       | 1 wave     | HOLD; promote to VERIFY-PRINCIPLES rule 2 on 2nd confirming wave    |
| obs-4 | Principles-file bypass outside L-block (6th recurrence)   | strong        | 6 waves    | RE-ESCALATE N-block + digest (6-instance count; all block exits)    |

**Promotions this wave: 1 candidate (obs-1 to PRODUCT-PRINCIPLES rule 1), conditional on karen + head-product sign-off.**
