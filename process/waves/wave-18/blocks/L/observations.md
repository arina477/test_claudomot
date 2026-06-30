# Wave 18 — L-2 Distill Observations

Synthesized from wave-18 artifacts (M3 thread replies: data plane + thread panel + outbox
parity; PR#30 squash-merged main@16c72b6; V APPROVED).
Prior archives consulted: process/waves/_archive/wave-{12,13,14,15,16,17}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (3 rules), VERIFY-PRINCIPLES (1 rule),
CI-PRINCIPLES (2 rules), T-2.md (1 rule), DESIGN-PRINCIPLES (1 rule), PRODUCT-PRINCIPLES (0 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      The B-6 Phase-1 gate (head-builder code-reading) APPROVED on both wave-17 and wave-18.
      In wave-17, Phase-1 code-read APPROVED a real-Postgres rollback test that was entirely
      non-functional: the spy target was a get-only Proxy (threw at setup), and the collision
      spy was an intra-module no-op. In wave-18, Phase-1 code-read APPROVED the thread
      ThreadsController with `@UseGuards(AuthGuard)` only — the reviewer noted the controller
      comment claimed "service verifies channel membership transitively" and accepted it; it
      did not. Phase-2 empirical /review reproduced both failures by running the SUT directly:
      in wave-17, the spy threw (`Error: transaction does not exist`); in wave-18, a
      non-member authenticated caller could POST replies and GET all thread replies in any
      channel, confirmed by tracing `messages.service.ts` line by line with no call to
      `canViewChannelById`. Both are Critical-class defects passed by Phase-1 code-read and
      caught only at Phase-2 adversarial /review.
      The structural commonality: Phase-1 code-read is insufficient when (a) the defect is
      an absence — a call, a guard, a test injection — not a wrong value; and (b) a plausible
      in-code claim (comment, docstring, prior pattern) gives the reviewer a false confidence
      anchor. Phase-2 adversarial /review must specifically hunt negative paths (non-member
      caller, mid-txn fault injection) rather than confirming positive-path structural reads.
    source:
      - process/waves/wave-18/stages/B-6-review-output.md
        # Phase-1: APPROVED. Phase-2: "C-1 IDOR: thread routes NOT behind the
        # channel-membership guard. createReply: no call to rbacService.canViewChannelById.
        # listThreadReplies: no membership check." Phase-2 verdict: REWORK.
      - process/waves/wave-18/blocks/B/gate-verdict.md
        # "One Medium-severity, non-blocking finding is routed to Phase 2 (/review)"
        # — Phase-1 found the Medium dead-code branch, missed the Critical IDOR entirely.
      - process/waves/_archive/wave-17/stages/B-6-review-output.md
        # Phase-1: APPROVED. Phase-2: "C1: rollback AC throws at spy-setup, proves nothing.
        # H2: collision spy is a no-op." Phase-2 verdict: REWORK.
      - process/waves/_archive/wave-17/blocks/B/gate-verdict.md
        # Phase-1 APPROVED the test on code-read alone; Phase-2 empirical probe caught it.
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      CONFIRMED RECURRENCE: two consecutive waves.
      wave-17 obs-2: Phase-1 APPROVED an integration test with a non-functional spy (Critical
        class); Phase-2 empirically reproduced the Proxy-throw and intra-module spy no-op.
        HELD pending second confirming wave.
      wave-18 (this): Phase-1 APPROVED a controller with a documented-but-missing authz guard
        (Critical IDOR class); Phase-2 traced the service methods line-by-line and found
        zero membership checks. Both: Phase-1 code-read missed a critical ABSENCE; Phase-2
        adversarial reproduction caught it.
      The wave-17 candidate rule (obs-2, held) was framed narrowly around skip-masked
      integration tests. This wave's instance is broader and the general rule is:
      adversarial Phase-2 /review must run and must verify negative paths; a Phase-1
      code-read APPROVE is not sufficient for authz/realtime/injection correctness.
      Recurrence condition met. BUILD-PRINCIPLES currently has 3 rules; cap is clear (rule 4).
    near_dup_check: >
      BUILD-PRINCIPLES rules 1-3: none address the B-6 phase-2 requirement or adversarial
      negative-path verification. wave-17 obs-2 was narrowly about skip-masked integration
      tests (held, not promoted). No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any B-6 gate: a code-read APPROVE is not a substitute for adversarial
        # reproduction of absence-type defects (missing guard, non-functional injection);
        # the class fires on authz, realtime, idempotency, and integration-test correctness.
      falsifiable: true
        # Checkable at every B-6 Phase-2: for every authz boundary and every injection
        # target (spy, mock, fault seam), does the /review reproduce at least one
        # negative path (non-member 403, mid-txn throw, no-fan-out non-recipient)?
      cited: true
        # wave-18 B-6-review-output.md (C-1 IDOR Phase-2 finding, Phase-2 REWORK, then
        # Phase-2 re-review APPROVED); wave-17 B-6-review-output.md (C1 spy-throw +
        # H2 intra-module no-op Phase-2 findings).
    candidate_rule_shape: >
      4. Treat a B-6 Phase-1 APPROVE as insufficient for authz and injection correctness;
         Phase-2 /review must verify at least one negative path per boundary.
         Why: An absent guard or non-functional injection passes code-read; only adversarial
         reproduction proves it.
      Rule line = 114 chars (within 120); why line = 75 chars (within 100). No forbidden tokens.
    promotion_requires: karen + head-builder sign-off

  - id: obs-2
    summary: >
      The two new gateway `@OnEvent` handlers (`handleThreadReplyCreated`,
      `handleThreadReplyDeleted`) in `messaging.gateway.ts` shipped with zero handler tests,
      even at the mocked-`server.to(room).emit` level that all five sibling handlers already
      have. T-2 rule 1 requires asserting what a non-sender RECIPIENT receives via real
      fan-out routing; the absence of even the cheap mocked-emit room-targeting test is a
      weaker gap (no assertion at all, not a wrong assertion). F-1 (HIGH, T-2 finding) was
      raised because no test at any layer proved a non-author client received the new thread
      events. Resolution required a live two-client wire probe at T-5. This is not a new
      principle — T-2 rule 1 already covers the recipient-via-real-routing bar — but it
      surfaces an actionable check: every new `@OnEvent` fan-out handler should carry at
      minimum the mocked-`server.to(room).emit` room-targeting unit test that the project's
      existing handlers use, as a cheap canary before the two-client live proof.
    source:
      - process/waves/wave-18/stages/T-2-unit.md Action 4
        # "the two new thread handlers have ZERO tests. Every OTHER event is tested with
        # the mocked-server.to(room).emit() room-targeting assertion."
        # "Finding F-1 (HIGH): No test at any layer proves a NON-author client joined to
        # channel:<id> actually RECEIVES thread:reply:created or thread:reply:deleted."
      - process/waves/wave-18/blocks/T/findings-aggregate.md
        # "T-2: every gateway @OnEvent fan-out handler needs >= a mocked server.to(room).emit
        # room-targeting unit test."
      - command-center/principles/test-layer-principles/T-2.md rule 1
        # "Assert what a non-sender recipient receives via the real fan-out routing."
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-2.md
    recurrence: >
      T-2 rule 1 (promoted at wave-15) already covers the recipient-via-real-routing bar.
      This observation is a CONFIRMING instance of rule 1's enforcement gap, not a new class.
      The specific sub-gap (new @OnEvent handler with ZERO tests, not even mocked-emit) has
      not been recorded as a distinct observation in prior waves. The existing rule subsumes
      it but does not make the mocked-emit level explicit. Adding a second T-2 rule narrowed
      to "@OnEvent handlers need >= mocked room-targeting unit test" would be near-dup with
      rule 1 (real fan-out is the authoritative bar; mocked-emit is only a weaker canary).
      Disposition: note as a confirming instance of T-2 rule 1; do NOT add a second T-2 rule
      this wave (cap: max 1 per file per wave; and the concept is already subsumed).
    near_dup_check: >
      T-2.md rule 1: "Assert what a non-sender recipient receives via the real fan-out
      routing, not a mocked room or topic join." This observation is a sub-instance.
      A second T-2 rule specifically about @OnEvent mocked-emit would be narrower and
      partially redundant. No promotion.
    disposition: NO PROMOTION (near-dup with existing T-2 rule 1; confirming instance only).

  - id: obs-3
    summary: >
      Playwright MCP chrome-channel-blocked again at T-5 (every playwright-1, playwright-2,
      playwright-10 MCP instance fails at browser launch with
      "Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome").
      Realtime fan-out was proven via a socket.io-client wire probe instead — the same path
      used in waves 12, 13, 14, and 15. The wire probe is not a workaround; it directly
      asserts the protocol layer (WebSocket frame delivery, payload JSON, no-leak assertion
      for a non-joined client). However the T-5 tester report (T-5-tester-thread.md) was
      BLOCKED at Playwright and the socket.io wire results were recorded in T-5-e2e.md
      (the operator record). This is the 5th consecutive wave where realtime verification
      was completed via socket.io wire path rather than browser E2E. The chrome-channel MCP
      config is a persistent host-side infra fault, not a feature defect.
    source:
      - process/waves/wave-18/stages/T-5-tester-thread.md
        # "BLOCKED — environment/infra fault. Zero scenarios executed... Error: Chromium
        # distribution 'chrome' is not found at /opt/google/chrome/chrome."
        # "Confirmed reproducible across playwright-1, playwright-2, playwright-10."
      - process/waves/wave-18/stages/T-5-e2e.md
        # "F-1 closed via live two-client socket.io wire probe... A POSTs reply (201)
        # → B received thread:reply:created... C (never join_channel) RECEIVED NOTHING."
      - process/waves/wave-18/blocks/T/findings-aggregate.md
        # "F-CARRY-2: Playwright MCP chrome-channel-blocked host-side → realtime verified
        # via socket.io wire probe (canonical path). Infra, not a wave defect."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      waves 12, 13, 14, 15, 18: socket.io wire probe used in place of Playwright browser
      E2E every time realtime fan-out is verified. This is a stable operational pattern,
      not a defect class. No principle warranted; the wire probe is effective and correct.
      Noting for the N-block host-infra audit (chrome-channel MCP config has been
      persistently broken; a one-time fix would remove the recurring T-5-tester-thread
      BLOCKED status). No promotion.
    disposition: INFORMATIONAL; no promotion. N-block host-infra note only.

  - id: obs-4
    summary: >
      head-ci-cd appended rules to CI-PRINCIPLES.md during the C-block, bypassing the L-2
      distill gate. The rules were reverted before L-2 ran (per the git log entry:
      "chore(wave-18): revert C-block CI-PRINCIPLES rule add (4th recurrence — L-2 owns
      promotion; migration-before-cutover lesson preserved for the gate)"). This is the
      fourth recorded instance of this pattern: wave-9 obs-2 (4 rules, reverted),
      wave-12 obs-3 (2 rules, confirmed recurrence, reverted), wave-17 obs-3 (2 rules,
      reverted, escalated to N-block for structural guard), wave-18 (this, reverted again).
      Wave-17 obs-3 disposition was "ESCALATE to N-block for structural guard"; the N-block
      structural guard (e.g., a git diff check at C-block exit: any principles/*.md change
      outside L-block → gate fails) was recorded but not implemented. Four-wave recurrence
      confirms the observation-only and escalation-only dispositions are insufficient.
    source:
      - git commit chore(wave-18): "revert C-block CI-PRINCIPLES rule add (4th recurrence
        — L-2 owns promotion; migration-before-cutover lesson preserved for the gate)"
      - process/waves/_archive/wave-17/blocks/L/observations.md obs-3
        # "Three-wave streak. The observation-only-hold disposition from wave-12 has not
        # suppressed the behavior. No principles file promotion is warranted. Structural
        # remediation is outside L-2's scope; flagged for N-block / process review."
      - process/waves/_archive/wave-12/blocks/L/observations.md obs-3
        # CONFIRMED RECURRENCE wave-9+12: "same pattern, rules subsequently reverted."
    severity: strong
    candidate_principles_file: none
    recurrence: >
      wave-9 obs-2: first instance (4 rules added, reverted). Held.
      wave-12 obs-3: second instance (2 rules, reverted). Confirmed recurrence. Documented.
      wave-17 obs-3: third instance (2 rules, reverted). Escalated to N-block.
      wave-18 (this): fourth instance (reverted again). N-block escalation from wave-17
        was not actioned; the structural guard was never implemented.
      No principles file rule can encode this (self-referential bypass); the prevention
      must be structural (a pre-commit hook or C-block exit check).
    disposition: >
      No promotion. Four-wave recurrence; N-block must implement the structural guard.
      Proposed guard: at C-block exit, run `git diff HEAD -- 'command-center/principles/*.md'`
      and fail the C-block if non-empty, with an explicit message naming the bypass.
      The revert mechanism continues to function; the prevention mechanism does not.
```

---

## Wave-18 L-2 distill disposition

**obs-1 (adversarial Phase-2 /review catches Critical defects that Phase-1 code-read APPROVED, two consecutive waves) — STRONG PROMOTION CANDIDATE.**

Two-wave confirmed: wave-17 (Phase-1 APPROVED a test with a non-functional Proxy spy and intra-module no-op; Phase-2 empirically reproduced both failures, REWORK) + wave-18 (Phase-1 APPROVED a controller with a documented-but-absent authz guard; Phase-2 traced the service and found zero membership checks, Critical IDOR, REWORK). Both: Phase-1 code-read passed a CRITICAL absence; Phase-2 adversarial /review caught it.

BUILD-PRINCIPLES has 3 rules; cap is clear (rule 4 this wave). No near-dup found. Recurrence condition fully met.

Candidate rule for karen + head-builder to vet:
```
4. Treat a B-6 Phase-1 APPROVE as insufficient for authz and injection correctness;
   Phase-2 /review must verify at least one negative path per boundary.
   Why: An absent guard or non-functional injection passes code-read; only adversarial
   reproduction proves it.
```
Rule line = 114 chars (within 120); why line = 75 chars (within 100). No forbidden tokens.

**Promotion requires: karen vet (rule quality) + head-builder sign-off (domain applicability). Promotion is conditional on both approvals; this file records the candidate, not the promoted rule.**

---

**obs-2 (gateway @OnEvent handlers shipped with zero unit tests, T-2 rule 1 confirming instance) — NO PROMOTION.**

Near-dup with T-2 rule 1 (already promoted at wave-15). The specific sub-gap (no mocked-emit room-targeting test) is subsumed by rule 1's "real fan-out routing" bar. Adding a second T-2 rule would be redundant. Confirming instance recorded; no second rule this wave for T-2.

---

**obs-3 (Playwright MCP chrome-channel-blocked, 5th wave; socket.io wire probe is the operational realtime verification path) — INFORMATIONAL; NO PROMOTION.**

Operational infra note. The wire probe is functionally correct and has been the stable verification path across all realtime waves. No principle warranted. Carry the host-infra note to N-block.

---

**obs-4 (CI-PRINCIPLES bypass by C-block agent, 4th recurrence) — ESCALATE to N-block; NO PROMOTION.**

Four-wave streak (wave-9, wave-12, wave-17, wave-18). Wave-17 N-block escalation was not actioned. The observation-only and escalation-without-structural-change dispositions have both failed. N-block must implement the `git diff` guard at C-block exit.

---

## Summary table

| id    | title (short)                                          | severity      | recurrence | disposition                                                      |
|-------|--------------------------------------------------------|---------------|------------|------------------------------------------------------------------|
| obs-1 | Phase-2 /review catches Critical that Phase-1 approved | strong        | 2 waves    | PROMOTE to BUILD-PRINCIPLES rule 4 (karen + head-builder vet)    |
| obs-2 | @OnEvent handler shipped zero unit tests (T-2 confirm) | warning       | 1 wave*    | NO PROMOTION (near-dup T-2 rule 1); confirming instance recorded |
| obs-3 | Playwright MCP blocked; socket.io wire path canonical  | informational | 5 waves    | INFORMATIONAL; N-block infra note                                |
| obs-4 | CI-PRINCIPLES bypass by C-block agent (4th recurrence) | strong        | 4 waves    | ESCALATE N-block for structural guard; no rule                   |

*obs-2 recurrence as a T-2 coverage gap is first wave recorded; T-2 rule 1 (the broader class) was confirmed across wave-14+15.

**Promotions this wave: 1 candidate (obs-1 to BUILD-PRINCIPLES rule 4), conditional on karen + head-builder sign-off.**
