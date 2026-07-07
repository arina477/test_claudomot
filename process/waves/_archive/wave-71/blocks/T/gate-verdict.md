# Wave 71 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-71/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

The T-block suite is honest and coverage is adequate for the wave's actual surface (GET /blocks read-enrichment + the member-row Block↔Unblock P0 toggle). Every load-bearing claim was independently verified against code and git, not accepted on the deliverable's assertion.

**T-5 (primary deliverable) genuinely proves both live behaviors — not coverage theater.** The E2E covers the exact P0 regression: after Block→confirm the member row flips `block-member-btn`→`unblock-member-btn` LIVE with no reload / unchanged URL, full cycle run 2× with 0 flake, backed by real network evidence (POST /blocks 201, DELETE /blocks/:id 204). Enrichment is proven with a real fixture (row shows displayName `studyhallfixtureb` + `@studyhallfixtureb` + `ST` initials, explicitly NOT a raw UUID). Own-row suppression and cross-surface store consistency (block on member row → appears in settings without refresh, and reverse) are both asserted — this is the two-surface consistency check, not a single-client echo. Prod was cleaned after (GET /blocks []).

**The P0-fix regression test is REAL, not mock-masked — the single most important honesty check.** `apps/web/src/shell/block-dialog-store.test.tsx` (new, 221 lines) explicitly does NOT mock `useBlocks` (the system under test); it mocks only the api-layer boundary (`api.blockUser`/`getBlocks`), renders the real `MemberListPanel`, drives the real `BlockConfirmDialog`, and asserts the user-observable DOM flip (row → Unblock) propagating through the real module-level store's subscription. It uses `_resetBlocksStore()` for per-test isolation (no order-dependent global state), asserts `blockUser` called exactly once (no double-POST), and — critically — carries a mutation-sensitive error-path test proving the exact P0 symptom stays fixed: on `api.blockUser` rejection the row does NOT flip to Unblock, the optimistic add rolls back, no double-POST, and an error toast shows. This is the opposite of both coverage theater and mock-the-system-under-test.

**T-3/T-4 coverage is honest.** T-4 runs 3 new enrichment cases vs real postgres:16 with per-test isolation; case 20 asserts `displayName === 'Bob Blocked'` AND `.not.toBe(USER_B)` against a seeded value — mutation-sensitive, real-DB, never mocking the SUT. The three cases form the fallback transition table (real display_name → username → 'Unknown user') that exactly mirrors the service's `?? … ?? 'Unknown user'` chain. The no-IDOR own-list scope is preserved (`WHERE blocker_id = session`; the LEFT JOIN adds display columns without widening scope — verified in `blocks.service.ts:175-191`).

**T-8-LIGHT is HONEST and justified — the safety-untouched claim is TRUE, independently confirmed.** `git diff --name-only main...wave-71-block-ui-polish` shows `blocks.controller.ts` and `dm.service.ts` are NOT in the wave diff at all (zero diff confirmed by name). The only server change is `blocks.service.ts` (the `listBlocks` LEFT JOIN enrichment) — the block authz methods (`createBlock`/`removeBlock`/`isBlockedBetween`) and the 5 DM-HIDE seams are untouched, so the wave-70 T-8 launch-gate live proof (13/13) genuinely remains valid. Skipping a full live DM-HIDE re-probe is legitimate because the safety code is verifiably unchanged; the sole T-8-relevant new surface is the enrichment no-IDOR, which is integration-covered and T-5-confirmed (A sees only A's list). Secret-grep clean. This is not a dodge — it is correct scope discipline. T-7 (perf) skip is justified (light read-enrichment, no heavy path).

**Findings honestly surfaced.** The one open finding — member-row block/moderation affordances are hover-only + need a wide viewport — is correctly classified MINOR / a11y, out of this wave's scope, and routed to V-2. It is disclosed, not buried, and does not gate the suite. Blocking-classification remains V-2's call, not this gate's.

No coverage theater, no mock-the-SUT, no single-client realtime, no flaky-retry masking (the one study-timer flake was rerun→passed and is an unrelated pre-existing test, not a wave assertion silenced with blind retries), no false safety-untouched claim.

## Escalation
N/A

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
