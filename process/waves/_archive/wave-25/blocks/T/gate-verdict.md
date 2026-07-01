# Wave 25 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-25/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
The T-block suite is honest: every layer proves a user-observable outcome or documents a legitimate skip with its mandatory floor still executed, and the Pattern-A evidence is real, not fabricated. T-1..T-4 all cite the SAME merge-green CI run 28512345221 on commit a730caf, which C-1 independently corroborates as the all-7-checks-green run; the counts are internally consistent (api 395, web 234 unit; integration 5 spec files / 15 tests). The load-bearing T-4 claim — that the new `edit-message-mentions-rollback.spec.ts` genuinely EXECUTED against real postgres:16 and was not skipped — is corroborated by C-1's CI-rule-5 false-green guard AND by the spec's own failure history (it TIMED OUT at 5000ms on run 04a0906, was root-caused to a test-harness dual-convention bug with zero production change, and now passes at 53ms). That real-red-then-green history is affirmative mutation-sanity proof the test detects a real bug, and the rollback is a genuine cross-connection real-PG proof via a separate `harnessPool` — no system-under-test mock, matching "don't mock the database." T-3 traces the shared slug grammar (`MENTION_TOKEN_SLUG_SRC` → server RegExp + web-local mirror) to a parity contract test that RED-fails on drift, with the class-boundary negative case (`@pre.fix`→`pre`) covered. T-5 is the coverage strength: all four user-visible ACs (AC2 resolved→pill, AC2 dot-suffix `.done` not swallowed, AC3 unresolved→plain, AC3 mixed) got a LIVE-prod verdict against web-production-bce1a8.up.railway.app with the real MentionPill DOM observed (emerald `aria-label="mention:"` chip vs bare span), each run 2× with zero flakes; the bundled-Chromium-via-playwright-core substitution is acceptable evidence because it drives the identical React render path and hit live prod, not a mock — only the browser channel differs. Skips are legitimate: T-6 (MentionPill component unchanged; on-token render confirmed by T-5 live computed style), T-7 (algorithmically-equivalent tokenizer, no new dep, <1KB, wave not heavy), and T-8 (editMessage's authz guard/session/CSRF unchanged — only the mention-diff writes were wrapped in a txn — so no auth-boundary promotion; the always-run secret-grep executed clean and the XSS surface was actively reasoned as unchanged React-escaped text nodes). The single open finding is a correctly-labeled LOW infra/tooling defect (Playwright MCP chrome-channel absence) forwarded to V-2; no product finding was buried or mislabeled, and the T-1 INFO note is test-only fault-injection `any` casts with 0 production bypasses.

## Escalation
n/a (APPROVED)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
