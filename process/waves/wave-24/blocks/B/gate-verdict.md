# Wave 24 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-w24-b6-a1)
**Reviewed against:** process/waves/wave-24/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

This is a test-only wave whose entire point is closing the real-Postgres integration gap on three DB-backed surfaces (presence co-member resolution, the servers member-gate, and the wave-23 rbac/assignments authz surface that shipped LIVE with zero real-DB coverage, F23-T-4). The adversarial question for a TEST wave — "is this a genuine real-DB round-trip or a dressed-up mock / coverage-theater / false-green?" — resolves cleanly in favor of genuine. All five ACs are met against real Postgres, the non-member→403 authz negative path is exercised against a real absent `server_members` row (not a mocked guard) on the authz boundary, and every P-4 carry is honored. No production code was touched (all four changed files are under `apps/api/test/integration/`), and biome format is clean (BUILD rule 6 held its first no-drift wave). One residual false-green nuance (entirely-unset `DATABASE_URL_TEST` → skip-green at the spec level) is correctly and explicitly delegated to the T-4 per-CI-job executed-count guard by the spec's own AC5 and the BOARD binding — it is a T-block responsibility, not a B-block defect, and the CI-relevant failure mode (var set, DB unreachable) already fails LOUD. Carried forward to T-4 below.

### AC-by-AC (load-bearing verification)

- **AC1 presence co-member (real-DB): PASS.** `presence-comembers.spec.ts` imports `./pg-harness` FIRST (CF-2 redirect of `process.env.DATABASE_URL → DATABASE_URL_TEST` before the SUT import), then `new PresenceService()`. `PresenceService` imports the module `db` singleton (`presence.service.ts:26 import { db } from '../db/index'`) — NOT a constructor-injected/mockable db, so the call genuinely round-trips Postgres. Fixtures insert real `users`/`servers`/`server_members` rows; `getCoMemberUserIds(USER_A)` asserts exactly `[USER_B]` (self-excluded, non-shared-server USER_C excluded); the no-membership user resolves to `[]`. Not mocked.

- **AC2 member-gate (real-DB): PASS.** `servers-member-gate.spec.ts` runs the REAL `listServerMembers` (`servers.service.ts:223`, gate throw at `:232`, roster `innerJoin(users)` at `:244`) — NOT `findMyServers:128` (P-4 carry #1 honored). `db` is the module singleton (`servers.service.ts:18`), not injected; the `{} as never` stub is only the unused `rbacService` ctor arg (listServerMembers never calls it). Member → real roster with shape assertions; non-member (no `server_members` row) → `.rejects.toBeInstanceOf(ForbiddenException)` — exact class, per P-4 jenny carry #3, 403 is definite.

- **AC3 rbac-authz (real-DB, closes F23-T-4): PASS.** `rbac-assignments-authz.spec.ts` covers all 4 `getEffectivePermissions` branches against real rows — owner all-true superuser short-circuit (`rbac.service.ts:289`), member-with-manage_assignments-role exact flags (`:335-340`), member-no-role all-false null-role path (`:310`), and **non-member → ForbiddenException (403)** (`:307`, the BUILD-rule-4 authz negative path against a real absent membership) — plus `can(manage_assignments)` allow (role-holder→true) and deny (no-role→false). `RbacService` has no db in its constructor; `db` is the module singleton (`rbac.service.ts:17`). Real roles/server_members/servers rows throughout.

- **AC4 real-DB round-trip / no mock-the-SUT: PASS.** The load-bearing assertions are all harness-fixtures → real service → assert-on-returned-rows. There is NO mock db and NO stubbed query anywhere in the three specs. The SUT-instantiation pattern (`new PresenceService()` / `new ServersService({} as never)` / `new RbacService()`) resolves the lazy `db` proxy in `apps/api/src/db/index.ts` to `DATABASE_URL_TEST` via the harness CF-2 side-effect import — the DB path is REAL, not stubbed. The wave-17 harness (truncate/fixture/countRows/teardown) is reused; no new tier, no testcontainers, no new CI job.

- **AC5 false-green guard: PASS (with T-4 carry).** Var set but DB unreachable → `setupHarness()`/pool connect throws LOUD (ECONNREFUSED), failing the run — the CI-relevant failure mode is covered. The residual case (var entirely stripped by Turbo env → `describe.skipIf(SKIP)` skips and the skip-branch greens with 0 executed) is identical to the established wave-17 harness pattern and is, by design, closed at the CI-job layer: the spec's AC5 and the review-artifacts BOARD condition both bind T-4 to "verify per-CI-job the integration tier ACTUALLY executed (nonzero + real-DB row assertions)." The B-block correctly wired all three specs into `vitest.integration.config.ts` `include: test/integration/**/*.spec.ts` and the harness helpers are present. This is the right division of labor — not a B-block gap.

### P-4 carries — all honored
1. Member-gate method = `listServerMembers` (`:223`/`:232`/`:244`), NOT `findMyServers:128`. Confirmed.
2. Truncate-list completeness: `truncateTables` covers all fixtured tables (`server_members`, `roles`, `servers`, `users`) plus wave-17 children; NO phantom `assignment*` table (manage_assignments is a boolean column on `roles`, exercised via `insertFixtureRole`'s `RolePerms.manage_assignments`). Confirmed — no phantom truncate.
3. AC2 non-member → 403 definite, exact `ForbiddenException` class via `toBeInstanceOf`. Confirmed.

### Discipline checks
- **No production code touched:** all four changed files under `apps/api/test/integration/` (harness + 3 specs). Test-only wave respected.
- **biome format clean (BUILD rule 6):** B-2 ran `biome format --write` before reporting; B-4 `pnpm lint` exit 0 with zero drift — rule 6's first clean B-block.
- **Heuristics swept:** mock-the-system-under-test (NOT present — real db singleton), decorative/coverage-theater (NOT present — every assertion is load-bearing on returned rows), false-green skipped-but-green (mitigated at spec level for the unreachable case, bound to T-4 for the stripped-var case), missing-negative-path on an authz boundary (PRESENT and correct — non-member→403 in both rbac and servers specs).

## Carry-forward to T-block (fold in, NOT rework)
- **T-4 (BOARD risk-officer binding):** verify per-CI-job that the integration tier executed with a NONZERO executed count and real-DB row assertions — a green CI exit with 0 executed / all-skipped integration specs is a FALSE-GREEN and fails the T-4 gate (wave-17 lesson). This is the enforcement point for the AC5 stripped-`DATABASE_URL_TEST` residual; the B-block delivered genuine round-trips wired into the glob but cannot close the stripped-var hole at the spec layer by design.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
