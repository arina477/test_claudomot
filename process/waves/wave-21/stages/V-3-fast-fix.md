# Wave 21 — V-3 Fast-fix

**Block:** V (Verify) | **Topic:** M4 wave-2 offline UX (live connection-state + multi-page reconnect catch-up) — MERGED (PR#33), LIVE | **Mode:** automatic

## Phase 1 — Gate verdict
**APPROVED** (verdict at `blocks/V/gate-verdict.md`). Both V-1 reviewers ran with evidence-backed APPROVE (Karen 5/5 load-bearing claims verified; jenny all ACs MATCH, no drift). The two load-bearing invariants — honest connection signal + no-data-loss catch-up — are verified-real (V-1 + T-4 + B-6) and probed, not accepted at face value. V-2 triage assigned severity+disposition to every finding: 0 blocking, 11 non-blocking accepted/deferred, 1 genuine test-completeness gap → fast-fix queue. APPROVED with non-empty queue → Phase 2.

## Phase 2 — Fast-fix loop (Round 1 of cap 3)

### Finding: L2-resume-test (Low — test-completeness on the LOAD-BEARING no-data-loss invariant)
The resume-after-mid-loop-failure path (page-2 `getMessagesAfter` rejects after page-1 succeeds → 2nd reconnect resumes from page-1's last SERVER cursor with no gap/no dup) was proven only by code + server-contract reasoning, not by an executing test. Test 5's name ("mid-loop disconnect") over-claimed but resolved both pages.

### Fix (Iron Law: specialist-routed — react-specialist, ≤20 LOC budget)
- **Added** Test 6 to `apps/web/src/shell/multiPageCatchup.test.ts` (lines 425-475): `RESUME invariant: page-2 reject → second reconnect resumes from page-1 cursor, no gap, no dup`.
  - Mock queue: page1 resolves (nextCursor=cursor1) → page2 rejects → page2 resolves (nextCursor=null).
  - Asserts (a) page-1 rows persist after the rejecting drain (:459); (b) 2nd drain's `getMessagesAfter` `after` arg === `cursor1` = page-1 server cursor, observing `lastSeenCursorRef` survived the failure (:466); (c) no-dup — each page-1 id exactly once (:471); (d) no-gap — page-2 ids present (:472).
- **LOC:** 20 lines of genuine new setup/assertion logic (within budget). No production code touched.
- **Verify (local, by specialist):** multiPageCatchup 6/6 PASS; typecheck green; build green; biome 0 errors on touched file.
- **Commit + push:** `test(web): V-3 prove catch-up resume-after-mid-loop-failure no-data-loss (wave-21)` → main 6a37f8f (automatic mode, branch merged → direct push).
- **CI:** run 28477376782 — all 6 required checks PASS (exit 0), incl. E2E + secret-scan/gitleaks.

### Re-verification (Action 2e)
- **Karen (always re-fires): APPROVE.** Mutation-tested, not just read. Mutation A (reset `lastSeenCursorRef=null` in the catch — the exact "cursor lost on failure" bug) makes Test 6 FAIL (loop never re-runs, call #3 never fires, times out). The no-dup `toHaveLength(1)` matcher is strict; no `.skip`, no loosened matcher, no green-by-suppression. The test would fail if the resume invariant broke in production. SUT (`runDrainAndCatchup`) not mocked — only the network boundary.
- **jenny (conditional re-fire — fired, fix touches spec-covered no-data-loss AC): APPROVE.** L2 AC-coverage gap genuinely closed; Tests 1-5 confirmed NOT to cover reject-then-resume (Test 5 resolves both pages); no spec drift; no over-claim; resume-from-server-cursor assertion consistent with AC2/AC3.

## Disposition
Clean APPROVE. Fast-fix queue empty (1 processed, 1 fixed, 0 to B re-entry). 1 round used, cap (3) respected. No escalation. No green-by-suppression. Block exits → L.

## Note for L-2 (distill candidate — NOT written to any principles file per V-3 no-principles-edit rule)
Candidate observation for L-2 to consider promoting (or rejecting per the ≤1-rule bar): a reviewer "no findings / clean" on a non-trivial async-invariant change deserves a probe that the invariant has an EXECUTING test, not just code+contract reasoning — V-2 caught exactly this gap (Test 5 name over-claimed coverage it didn't have). Pairs with jenny's L-1 note that Test 6 is a regression guard on the advance-cursor-before-next-await ordering. L-2 owns the promote/reject decision; head-verifier does not edit VERIFY-PRINCIPLES.md.

```yaml
phase1_head_verifier_verdict: APPROVED
skipped: false
queue_items_processed: 1
queue_items_fixed: 1
queue_items_moved_to_b_re_entry: []
fast_fix_rounds: 1
loc_per_fix: [L2-resume-test: 20]
re_verification:
  karen: APPROVE
  jenny: APPROVE
cap_escalation: false
escalation_destination: none
```
