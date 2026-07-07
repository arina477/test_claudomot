# Wave 75 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId arina-89ejyn/head-tester-T9)
**Reviewed against:** process/waves/wave-75/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale

Every layer proves a user-observable outcome, and the evidence is solid rather than fabricated — I independently confirmed the load-bearing claims against the repo. Coverage is adequate and honestly scoped: T-1 static is bypass-clean in production source (11 casts all in test files, verified by grep), T-2 unit asserts real state (canonical cap values, the 646-owner non-regression guard, and a legitimate *negative* mock-call assertion proving the guard short-circuits before the mutating dependency — not coverage theater), T-3 contract has both parse-valid and parse-invalid cases plus exact live-shape probes for all five DTOs, and T-8 security's crown-jewel negatives all pass live with the strong side-effect-free proof (Fixture B's 403 leaves A's tier UNMODIFIED per principle #28, not merely a status assertion) and 401-before-403 guard-stacking order. The three items I was asked to scrutinize all resolve in favor of PASS. **(1) T-4 un-executed integration test:** I verified `billing-subscriptions-upsert.spec.ts` exists on disk (authored this block, timestamp 17:39, NOT in merge commit 3b94e276 — consistent with the honest "uncommitted, follow-up PR" claim), asserts genuine query-level ON-CONFLICT dedup (row-count=1 after two changes, tier reflects new value, updated_at advances, harness imported first so the lazy db resolves to DATABASE_URL_TEST), and uses `describe.skipIf(!DATABASE_URL_TEST)` to skip-with-message rather than false-pass. This is the model of an honest un-run test: recorded as "authored, clean, CI-pending," NOT credited as green. The upsert *effect* is independently proven live end-to-end at T-5 (free→server_pro→school persisted, exactly one effective tier per server, re-read from prod DB), so the automated real-DB run being deferred to the follow-up PR's CI is a tracked coverage-completeness gap, not a hole that hides a broken product — correctly surfaced to V-2 as medium-process, not a T-block REWORK. **(2) T-8 educator-tools status membership gap:** correctly classified as a non-blocking follow-up. It is a boolean-only, no-PII, no-mutation read that leaks only "this server is on a school-tier plan"; it is not an IDOR with a side effect, and the guard's own comment already flags the member-check requirement for the fenced real tools. Medium design-note to V-2 is the right disposition. **(3) T-5 single Playwright instance:** acceptable — the upgrade flow is a single linear per-server surface with no partitionable parallel scenarios, and all five P-2 acceptance criteria (including the M9 headline success metric: immediate in-place refresh + persistence across close+reopen) achieved full coverage single-instance. No two-client realtime path exists in this wave to require multi-client verification. T-7 perf skip is justified (small non-render-path diff, single-row upsert behind an owner-check). No coverage-theater, mock-the-SUT, single-client-realtime, flaky-retry-masking, or untestable-surface-creep pattern is present. Findings tally: 0 critical, 3 medium (2 process/follow-up + 1 design-note), 2 low, 1 info — all correctly surfaced to V-2, none blocking at the T-block layer.

## Rework instructions  (only if REWORK)

n/a — APPROVED.

## Escalation  (only if ESCALATE)

n/a — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
