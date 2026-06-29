# Wave 4 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-4/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The T-block is honest and the suite proves user-observable outcomes, not mock trivia. The bulk of the wave — username set/dup/bad, accent, the 4-field profile, and the `users +3 cols + lower(username) unique index` migration — is fully live-verified against prod Postgres (T-4 / C-2), so integration runs against the real DB, not a mock of it. Two real defects were caught and fix-forwarded rather than papered over: the duplicate-username 500→409 was a textbook mock-the-system-under-test escape (CI passed only because tests asserted a synthetic `{code:'23505'}` object instead of a real drizzle-wrapped rejection), and PR#11 both fixed the handler (`err.cause?.code` / constraint-name match) AND added the missing real-duplicate-through-drizzle test plus a T-2 unit guard mirroring the actual wrapped error shape — that test now fails on a plausible real bug, satisfying mutation-sanity. T-8 security is adequate for the file-upload surface: it asserts the unauthorized path (foreign-user confirm key → 400, no leak), the MIME allowlist (non-image → 400), graceful no-creds (presign → 503, /health stable, no crash), and a server-controlled user-scoped key (no path traversal). The avatar real-upload E2E (S3 PUT → confirm → render) is deferred, and that deferral is acceptable rather than REWORK: the path is built, the key/MIME/scope security is unit-tested + code-reviewed + live-503-probed, and the ONLY unverified link is the actual storage round-trip — blocked by un-provisioned infra (Railway Bucket), not by missing or broken code. It is an honestly-bounded, documented exclusion with a real tracking row (84e09891 `todo`), not a silent skip masking a broken product. T-7 perf-skip is justified (632KB ~ baseline, not a heavy wave, no budget at risk); T-6 browser pixel-diff and T-5 full browser click-through are deferred to a real tracked CI-chromium task (c51589cd `todo`) with RTL + live-curl covering the interactions in the interim. The one residual security gap — unthrottled auth/profile endpoints — is correctly surfaced as a low finding with a real launch-blocker tracking row (839af17f `todo`), not silenced. All three deferral tickets were confirmed to exist as live `todo` rows in the tasks table, so nothing rests on a hand-wave. No coverage theater, no single-client realtime risk (no realtime surface this wave), no flaky-retry masking, no untested error paths.

## Rework instructions
N/A — APPROVED.

## Escalation
N/A — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
