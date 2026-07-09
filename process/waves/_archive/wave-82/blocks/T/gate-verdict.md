# Wave 82 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-9 gate)
**Reviewed against:** process/waves/wave-82/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
Independent review of the deliverables AND the underlying source (`apps/web/src/auth/AuthGuard.tsx`, `refreshAndRetry.ts`) plus both test files confirms an honest, adequately-covered suite for a frontend-only auth-behavior change.

- **Skip set is honest (H-T-scope).** The wave diff is confined to `apps/web/src/auth/` (~90 net LOC). T-3 (contract) and T-4 (integration) are truly inapplicable — no API/SDK/contract endpoint and no schema/service change (the SuperTokens SDK boundary is consumed, not modified). T-6 (layout) is inapplicable — the change is an `onSessionExpired` event handler and a fetch-retry wrapper, zero visual/layout surface. T-7 (perf) is inapplicable — not a heavy wave, no perf budget touched. No skip masks a touched surface.

- **Dominant-path coverage is genuine, not theater (H-T-coverage-vs-claim).** The T-2 claim rests on `AuthGuard.test.tsx` DOMINANT PATH case, and it holds under inspection: it drives `attemptRefreshingSession → false` while `doesSessionExist` returns false → false → true across settle ticks, then asserts `redirectToAuth` was NOT called. That is exactly the production-dominant NOT_EXISTS-then-settle branch the *prior* fix no-op'd (the corrected code deliberately ignores the boolean and rechecks `doesSessionExist` directly — the test proves the boolean is not gated). This is coverage of the path the fix targets, not a happy accident.

- **Not mock-the-SUT (H-T-mock-the-system-under-test).** The mocked surfaces are the SuperTokens SDK boundary (`doesSessionExist`, `attemptRefreshingSession`, `redirectToAuth`) and the `SessionAuth` wrapper. The system under test — `AuthGuard.onSessionExpired` and `withRefreshRetry` / `sharedRefreshSession` — is the REAL code, captured via the SessionAuth mock and invoked directly. Correct boundary placement.

- **T-5 "race not reproduced" is the honest and correct call (H-T-flaky-retry-masking, inverted).** A non-deterministic token-write-ordering race cannot be reliably forced from a headless probe; a fabricated repro would be worse than an honest negative. The race is deterministically covered at the unit layer (settle-then-recheck) and T-5 supplies real live stable-flow evidence (login→DM no bounce, reload persists, cross-nav + cold deep-link stay authed, 0 console errors) on the deployed bundle. Evidence is not thinner than the surface; it is the correct evidence for the surface.

- **Genuine-logout regression — the highest-risk one the fix could introduce — is double-covered.** Unit: AuthGuard "genuine logout" (session absent through the whole bounded settle → redirect fires once with `{redirectBack:true}`) + refreshAndRetry propagate-401-on-false. Live: T-8 real logout redirects, `sFrontToken` cleared, post-logout `/app` bounces and STAYS OUT after a 3s settle. The settle-then-recheck fix demonstrably does not strand a logged-out user.

- **No coverage-theater residue.** Bounded-loop test proves termination (no unbounded spin); single-flight proven with a gated in-flight promise (N racers → 1 refresh); resolution asserted (caller receives the retried 200, not merely "refresh was called"); non-401 pass-through (429/500/403/generic) covered. CI green on merged PR #101 across lint/typecheck/test/build/secret-scan/boot-probe/e2e (762 web tests, 57 files). No `.skip`/`.only`/`.todo` in the auth suite.

Two LOW findings (PWA icon 404, pre-existing fixture cruft) are both unrelated to the auth change and correctly non-blocking.

## Rework instructions
n/a (APPROVED)

## Escalation
n/a (APPROVED)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
