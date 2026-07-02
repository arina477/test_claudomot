# Wave 36 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-36/blocks/T/review-artifacts.md + findings-aggregate.md + T-1..T-8 stage deliverables + independent re-check of the load-bearing spec files, the controller SUT, and CI run 28611576359 / test job 84845085352
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

This is a test-hardening wave whose deliverable IS the durable regression suite, so the single load-bearing question is: did the new real-Postgres integration specs ACTUALLY RUN in CI (not silently skip), and are their assertions honest (user-observable outcomes, not mock trivia)? Both answers are yes, and I verified them myself rather than trusting the stage prose.

**Execution proof (the wave's success criterion — independently confirmed).** I pulled the CI test-job log (84845085352, headSha 211888998 = current HEAD). `DATABASE_URL_TEST` is set in the job env (`***localhost:5432/studyhall_test`), so the `describe.skipIf(SKIP)` guard evaluates false. `pnpm test:ci` runs `vitest run` (507 unit passed) THEN `vitest run --config vitest.integration.config.ts`, and the verbose log shows all 12 new tests with green `✓` marks — `account-data-export-idor.spec.ts` (7, including "IDOR structural proof: A cannot obtain B memberships, B cannot obtain A") and `privacy-visibility-authz.spec.ts` (5, including the provable before/after roster delta 2→1). No `SKIPPED: DATABASE_URL_TEST` decoy line appears in the log. The wave-17/24 false-green class did NOT recur — this coverage is real, not decorative.

**Assertion honesty (no coverage theater).** I read both spec files. They exercise the REAL SUT (`ServersService.listServerMembers`, `AccountDataService.getAccountData/exportAccountData`) against real Postgres via `pg-harness` — no mock-the-system-under-test. The visibility spec is a transition table across all three `profile_visibility` enum values with a provable before/after delta and a self-inclusion invariant (A still sees self after setting `nobody`), not a single happy case. The IDOR spec is bidirectional (A cannot see B AND B cannot see A) with asymmetric fixtures (B joins nothing) that make any leakage immediately detectable, plus a `countRows >= 2` sanity guard against vacuous empty-roster passes. The controller (privacy.controller.ts) confirms the enforcement point: every endpoint derives `userId = req.session.getUserId()` with no route/query/body override — matching the T-3 session-scoping contract test added at B-6 M2.

**Other layers.** T-1/T-2/T-3 are CI-verified green (lint, typecheck, 507 units incl. new controller/service specs, invalid-enum→400 before DB write). The diff confirms production-code changes are minimal and non-behavioral: `instrument.ts` scrubPii extraction (behavior-identical) + three 1-line date strings. T-8 correctly reports no new auth/session/authz surface, so its "no findings" is honest — the boundary is unchanged since wave-35 (T-8-reproduced live there) and is now regression-covered, and C-2 confirmed the boundary still returns live 401. T-5/T-6: the only user-visible change (/privacy + /terms "Last updated" → 2026) is C-2 served-content-verified in the LIVE web bundle (2026 ×2, 2024 ×0). 0 findings is honest for this confirmatory wave — I probed for under-testing and found none; the one carried server-roles flake is wave-36-untouched and passes 24/24 in isolation.

## Cascade
- **Stages that must re-run:** none (APPROVED).
- **Stages that stay untouched:** all.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
