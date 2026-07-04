# Wave 48 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase 1 gate)
**Reviewed against:** process/waves/wave-48/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

This is a test-only, scope-fenced wave (task 03ccf636) that adds two real-Postgres negative-case controls to the `GET /dm/candidates` privacy fence — closing the counter-example gap the wave-46/47 unit tests left as mock no-ops. Every load-bearing gate question resolves clean against the codebase (not just the deliverables):

**The test is REAL, not coverage-theater.** `apps/api/test/integration/dm-candidates.spec.ts` imports `pg-harness` as the load-bearing first import (CF-2 side-effect: rebinds `DATABASE_URL` to `DATABASE_URL_TEST` at module-eval before any SUT import), then instantiates the actual `DmService` and calls the real `sut.getDmCandidates(CALLER)` — no mock, no stubbed query, no pre-filter. It is a structural twin of the accepted reference `presence-comembers.spec.ts`. I verified the SUT query in `apps/api/src/dm/dm.service.ts:677-721` carries exactly the two predicates the assertions claim to exercise: `ne(users.who_can_dm, 'nobody')` (line 706) and `inArray(alias.server_id, callerServerIds)` (line 704). Test (a) has a genuine everyone-control (`USER_Y_EVERYONE` co-member in the shared server) asserted `toContain` alongside the nobody-user asserted `not.toContain` — this proves the query returns co-members in general and drops the nobody-user specifically, not that it returns an empty set for unrelated reasons; self-exclusion is also re-asserted. Test (b) uses a truly disjoint owner-of-a-different-server (`USER_Z_DISJOINT` in `SERVER_T`, caller only in `SERVER_S`) and asserts both `not.toContain(Z)` and `toHaveLength(0)`, exercising the real `inArray` scope.

**It will RUN in CI, not skip.** `.github/workflows/ci.yml` provisions a `postgres:16` service and sets `DATABASE_URL_TEST` on the `test` job, which runs `pnpm test:ci` → `turbo run test:ci` → `vitest run --config vitest.integration.config.ts`. That config's `include: ['test/integration/**/*.spec.ts']` glob-matches the new spec, and the harness's `setupHarness()` applies the real Drizzle migrations (`migrate(..., MIGRATIONS_DIR)`), so the `who_can_dm` column exists in the test DB. The identical-structure `presence-comembers.spec.ts` already runs green there. The "skips locally, runs in CI" posture is fully consistent with the existing 17-spec integration harness convention (`describe.skipIf(!DATABASE_URL_TEST)` with an explicit skip-reason `it.skip`, never a silent pass). Judged acceptable; the actual-ran-green proof correctly defers to C-1/T-3.

**Harness change is backward-compatible.** `insertFixtureUser` gains a 4th param `whoCanDm` defaulting to `'everyone'` (matching the DB column default). All existing callers use the 2-arg `(id, email)` form (verified across rbac-, assignment-, moderation-, servers-, invite-code- specs) — none are affected.

**Scope-fenced and disciplined.** The branch touches only `apps/api/test/integration/dm-candidates.spec.ts` and `apps/api/test/integration/pg-harness.ts` (plus process docs) — zero production `dm.service.ts` / schema / UI change, matching the spec's `data: read-only; test-only`. The code commit (9271378) cites `Refs: 03ccf636` in its body and carries the required Co-Authored-By trailer. Migration/auto-migrate, Dexie, idempotency, offset-pagination, unguarded-door, single-client-realtime, and scale-gold-plating anti-patterns are all N/A for a test-only wave.

## Carry-forward to C-1 / T-3

The gate APPROVES on CI-structural correctness. The one deferred verification is **actual green execution**: C-1 (PR & CI) and T-3 (integration layer) MUST confirm the two `dm-candidates.spec.ts` assertions RAN (not skipped) and PASSED against the CI Postgres — locally they skip because this environment has no test PG (all 17 integration specs skip identically). Do not declare the privacy-fence regression coverage live until the CI integration pass shows these two `it()` cases executed green.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
