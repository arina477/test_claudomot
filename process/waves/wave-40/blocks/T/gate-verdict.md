# Wave 40 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, agentId head-tester-w40-T9)
**Reviewed against:** process/waves/wave-40/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
The two hardened behaviors are proven live, not asserted. T-8 exercised the deployed prod API with quoted HTTP responses — bare + embedded NUL and the full C0+DEL control range (`%00`, `abc%00def`, `%01`, `%1f`, `%7f`) all return clean 400s with zero 500s, and the never-uploaded confirm returns 404 (was an uncaught HeadObject NoSuchKey 500). The load-bearing regression guard — the ParseUUIDPipe trap the P-0 reframe existed to avoid — is directly and live-verified: a valid non-UUID SuperTokens id resolves 404 (NOT 400) while a fixture UUID-with-avatar redirects 302, proving the guard is a control-byte filter that imposes no UUID shape. Evidence is solid and mutation-sane: deleting the boundary guard re-surfaces the 500, substituting ParseUUIDPipe fails Probe 2, and dropping the NoSuchKey catch fails Probe 3 — each test fails on a plausible real bug, not only on its own deletion. The no-persist claim is a genuine state-change assertion (GET /profile avatarUrl unchanged across a failed confirm), not a mock-count. T-1/T-2/T-4 are CI-green (biome+tsc, 543 api tests incl. new users.controller/files.service/files.controller specs asserting status-code and re-throw outcomes) on the merge commit, backed by real-PG avatar-render integration coverage (DB not mocked). The T-3/T-5/T-6/T-7 skips are correct for a backend malformed-input-hardening wave with no shared-schema, user-flow, UI, or heavy-perf surface. The lone informational finding (x-powered-by Express banner) is pre-existing, out of wave scope, and correctly non-blocking. One non-blocking observation for V-block: the `>2MB → 413 AVATAR_TOO_LARGE` preserved-behavior AC was not explicitly re-probed and shares the modified `checkAvatarSize` method — low risk (413 is thrown post-HeadObject-success by app logic; the 543-test suite is green) and belongs to spec-verification, not suite-honesty. Suite is honest; no coverage theater, no single-client realtime, no mock-the-SUT, no flaky-retry masking.

## Escalation  (only if ESCALATE)
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
