# Wave 27 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, V-block gate)
**Reviewed against:** process/waves/wave-27/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

Both reviewers ran independently and APPROVE with cited, source-anchored evidence — not paraphrase. Karen (source-claim) verified 7 load-bearing claims with exact file:line + git-diff evidence (zero WRONG, zero UNVERIFIED); jenny (semantic-spec) verified both spec blocks MATCH deployed behavior against a re-confirmed live deploy (web `index-Dr2UkTXH.js`, api health ok), AC-by-AC, with drift/cross-reference audit clean. This is a non-trivial change (multi-spec, cross-app perf refactor), so I did NOT accept the "APPROVE / 0 blocking" at face value — I spot-checked the load-bearing claims against the merged tree directly.

**CARRY-B (the P-4 binding carry) — GENUINELY CONFIRMED, not rubber-stamped.** I independently read `MessageList.tsx:962-966` and `:1006-1074`: `AuthorPresenceDot` is `memo()` over a scalar `status: boolean|null`; `SentRow` derives that scalar per-author at render and passes it down. Because `status` is a scalar, React's default shallow prop compare bails when it is unchanged — so an author-B flip increments the shared `presenceTick` (re-rendering every `SentRow`) but author-A's dot skips re-render on an unchanged scalar. This is REAL per-author render-scoping; the wave did NOT silently regress to a naive whole-list re-render. The CARRY-B test (`presence-dots.test.tsx:463-479`) asserts the observable behavior (2 Online → flip carry-b → exactly 1 Online + 1 Offline). Karen's confirmation is corroborated at source.

**Behavior-preserving genuinely met on deployed prod, not just "tests green."** Spec A's index is transparent to results by construction (btree on the WHERE column cannot change the returned co-member set) and its EXPLAIN proof is real: the spec runs the exact `getServerIdsForUser` query and asserts Index Scan + index-name + NOT Seq Scan (mutation-sane — drop 0012 → assertion fails), CI-executed vs real PG in PR#40. Spec B's "dots render identically" is confirmed on LIVE prod by T-5 ×3 (emerald `#10b981`=rgb(16,185,129) byte-for-byte against observed DOM, unknown→no-dot, single socket, self-seed). Migration 0012 is index-only and matches schema exactly; `presence.service.ts` has an EMPTY merge diff (pure planner win, no logic change).

**Triage SOUND — nothing load-bearing downgraded.** Two findings, both correctly noise: (1) the `presence-dots.test.tsx` doc-comment overstates the memo mechanism ("custom areEqual that derives the tri-state") — I confirmed this is doubly inaccurate (implementation is plain `memo` on a scalar; the parent, not the dot, derives the tri-state) but it is doc-only prose in a test comment; the test's assertions and the underlying wiring are correct, branch already merged → cosmetic. (2) Playwright MCP chrome-absent (67881a58) is a known recurring infra carry, covered by the bundled-chromium T-5 substitute that PASSED ×3. Neither is load-bearing for the spec contract; `fast_fix_queue: []` is correct. No green-by-suppression (no test weakened, no assertion loosened). No spec-gap requiring escalation.

Every applicable stage-exit checkbox ticks: both reviewers ran and emitted evidence-backed verdicts; author was not sole reviewer; load-bearing claims checked against codebase reality (I re-verified CARRY-B, single-subscription, index+migration, and the EXPLAIN proof at source); jenny cross-referenced plan/journey-map/product-decisions; the clean verdict was probed on a non-trivial change; every finding carries severity+disposition; spec-gaps: none; acceptance criteria demonstrably met on prod. Phase-2 fast-fix skips (empty queue). APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
