# Wave 37 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn — T-9 gate, persistent across the T-block)
**Reviewed against:** process/waves/wave-37/blocks/T/review-artifacts.md + findings-aggregate.md + all T-1..T-8 stage deliverables
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

The wave-37 test suite is honest at every layer and each layer proves a user-observable outcome, not a mock-count or a green check. The load-bearing tier — T-4 integration — provably EXECUTED against real Postgres 16, not skipped-but-green: the `test` job of CI run 28622699260 (conclusion=success, all 7 jobs green, headSha 5725747) shows `notifications-authz.spec.ts` running 6 tests / 0 skipped with real-DB latencies (54/173/407/201/203/84 ms) — sanity 2-row write proof, owner-404 (B→A's notification → 404, A stays unread, A then marks own read OK), markRead idempotent, markAllRead A-scoped with B untouched, mention dedup (double-emit → exactly 1 row), and listForUser A-only-scoping with enrichment populated. The DB is the system under test, not a mock — this defeats the false-green / mock-the-SUT anti-patterns. Contract discipline holds: `notifications.controller.spec.ts` (14 tests) asserts route-method metadata (markRead=PATCH RequestMethod.PATCH=4, markAllRead=POST, list=GET) — a genuine method-drift guard, exactly the bug class that caused the pre-merge HIGH-1 (POST→404), plus 3 structural IDOR/session-scoping proofs. T-1 lint+typecheck green with 0 TS bypasses; T-2 api 521 + web 333 all passed (log-confirmed counts). Active-execution layers hold LIVE against prod: T-5 e2e proves the mention notification path with TWO DISTINCT clients (sender B + receiver A) — a real fan-out/delivery assertion, never a single client's own echo — using role/label queries (`aria-label="Notifications, N unread"`) not test-ids, covering loading/list/empty states and marking-read via PATCH. T-6 layout quantifies the emerald pill, the 9+ cap, and the unread/read distinction across a mixed page at three widths with no overflow. T-8 security reproduces the owner-404 IDOR LIVE (B→A's notification → 404, A stays unread — unauthorized asserted to get 404, not just the allowed user getting 200), self-scoping (0 items + `?userId` injection ignored), the 401 boundary on all three verbs (guard-order 401-first), and confirms the HIGH-1 POST→PATCH verb fix live. T-7 perf is a legitimate skip (not heavy). The two findings are honest and non-blocking: F37-T5-1 (LOW) is a narrow external-credential gap — no reminder-type notification row exists in prod because Resend is key-blocked (parked a1299e88) — but the mention path (the wave's actual delivered surface) is fully exercised at every layer, reminder-row rendering is unit-covered, AND the reminder generation path itself is real-PG integration-tested (`reminder-scan.spec.ts`, 5 cases, log-confirmed executing), so this is an honest gap gated by a founder key, consistent with the standing M5 park-or-key fork — not coverage theater; F37-T5-2 (INFO) is a benign pre-auth 401 that re-fetches 200. No coverage theater, no mock-the-SUT, no single-client realtime, no flaky-retry masking, no untestable-surface scope creep. Suite is fast (integration in sub-second per case, no flake reported). The block is honest; proceed to journey regen and Verify.

## Stage-exit checklist (applicable rows)
- [x] T-1: exported units assert return/state, not mock counts (controller.spec delegates + returns asserted; useNotifications state).
- [x] [STABLE] Any layer: mutation-sanity — controller method-drift test fails on a real POST/PATCH swap (the HIGH-1 bug class); integration owner-404 fails if authz is dropped.
- [x] T-2 unit: pure/service units assert observable output.
- [x] T-3 contract: GET/PATCH/POST route metadata asserted; shared Zod single-source; typed shapes.
- [x] T-4 integration: RAN against real Postgres 16, per-test isolation, DB NOT mocked (log-verified 6 tests 0 skipped, real latencies).
- [x] T-4: dedup + self-scoping asserted (mention dedup → exactly 1 row; listForUser A-only).
- [x] T-4: happy AND error paths (owner-404 error path + owner-success path both present); Tier-1 authz covered.
- [x] T-4/T-5: realtime verified with TWO clients (B sender + A receiver), never one client's echo.
- [x] [STABLE] T-5: no test-never-observed-to-fail treated as passing — live PATCH decrements bell (observable transition).
- [x] T-5: role/label/text queries, no getByTestId where a semantic query exists.
- [x] T-5: no flaky tests silenced with retries (0 flakes reported).
- [x] T-6 layout: dark-theme baselines with quantified unread/read diff (not 0/100%).
- [x] T-8 security: RBAC/ownership IDOR-tested — unauthorized asserted to get 404 (owner-404), not only allowed 200.
- [x] T-8: JWT/session lifecycle negative tests (401 on all 3 verbs, guard-first).
- [x] [STABLE] T-9: no Playwright agent called browser_close mid-run (bundled-chromium driver owns lifecycle; N/A).
- [x] T-7 perf: legitimately skipped (wave not heavy) per dispatcher.

## Rework instructions
N/A — APPROVED.

## Escalation
N/A — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
