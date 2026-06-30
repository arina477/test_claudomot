# Wave 14 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn — independent re-judgment, not the prior in-stage self-signoffs)
**Reviewed against:** process/waves/wave-14/blocks/T/review-artifacts.md + findings-aggregate.md + all T-1→T-8 deliverables + direct source/spec inspection + independent test run
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

The suite is honest and every layer proves a user-observable outcome or honestly documents why it cannot — verified independently, not trusted from self-signoffs. **T-2** closed a genuine gap (presence shipped with ZERO unit tests) with 31 value/state-asserting tests; I confirmed the assertions are state-transition checks (service spec: 36 `expect()` vs 5 mock-call asserts) and the mutation-sanity claim is real — the no-flap test asserts `wentOnline=false` on a second tab, the exact invariant a `connect()` mutant would break. I ran `pnpm --filter @studyhall/api test -- presence` independently: 251 passed, 17 files, green. **T-3** delivers 100% schema coverage — `packages/shared/src/presence.spec.ts` exists (393 lines, 37 tests), each schema has a parse-valid AND meaningful-invalid case asserting `issue.path`/`issue.code`, and the build-safety fix used tsconfig exclusion, not `@ts-ignore`. **T-4** is the one soft spot, but it is honest: the project has no real-Postgres vitest tier (db is mocked project-wide), and rather than mock-the-SUT-and-claim-integration, the stage explicitly declines to claim a tier it lacks, records it as MEDIUM non-blocking infra-gap, and carries the real-DB boundary proof live at T-8 against the deployed prod DB. That is the correct disposition of a missing-infra path, not false-green. **T-8 (load-bearing)** genuinely meets the two-client non-negotiable: TWO DISTINCT verified users (fixture A + provisioned+email-verified account-b B, both co-members of proof server ad62cd12), genuine cross-user wire-level fan-out (B receives presence:online{A} 311ms / offline{A} 79ms — not self-echo), NO-LEAK proven (0 foreign ids; typing channel-scoped no-leak), WS rejects unauth + unverified, members 401/403, secret grep clean. The membership-scoping security proof — the tightened-gate's load-bearing requirement — HOLDS. **F-4** I confirmed directly in source (`presence.gateway.ts:381-385` builds one actor-excluded `typers` list and broadcasts it to the whole room, so every co-member receives the actor filtered out): it is a real realtime-correctness defect, and the T-block surfaced it with root cause + remediation rather than hiding it behind the unit test's single-layer green. That is precisely the false-green that two-client live testing exists to catch — the suite working as designed.

**On F-4 → APPROVED, not REWORK:** F-4 is a correctness defect, not a security/scoping leak, and the security gate's load-bearing proof holds independently of it. The T-block's mandate is to prove the *suite* is honest and surface findings with evidence for V-2; V-2 owns the blocking decision against the spec. No layer's testing is dishonest — the defect was *caught*, which is the opposite of false-green. REWORK is reserved for a dishonest/inadequate layer (faked green, single-client realtime claimed as two-client, a verdict unsupported by evidence); none of that is present here. ESCALATE is reserved for a structural blocker the orchestrator cannot fill; not applicable. Therefore APPROVED, with F-4 (HIGH) forwarded to V-2 with my recommendation that it is blocking for spec task 58633934 (its core AC — co-members seeing "<name> is typing" — is unmet in prod), and the T-4 integration-tier gap (F-3/F-3b) forwarded to V-2/L-2 as a non-blocking infra debt.

## Rework instructions

None — verdict is APPROVED.

## Cascade

| Trigger stage | Stages that must re-run downstream |
|---|---|
| (none — no stage requires rework) | n/a |

- **Stages that must re-run after the above:** none
- **Stages that stay untouched:** T-1 through T-8 (all APPROVED on independent review)

Note: F-4's fix lands in B-block via V-2 routing (Iron Law — not fixed in T). When the typing fix ships, V-block re-verifies the typing AC against spec task 58633934; that is a V-block concern, not a T-block cascade. The T-block's honesty verdict stands.

## Escalation

None.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
