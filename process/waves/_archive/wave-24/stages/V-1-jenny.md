# V-1 Semantic-Spec Verification — jenny

**Wave:** 24 — M5 debt-clearing: extend the real-Postgres integration test tier
**Spec (authoritative):** `tasks.description` YAML head, task `02fa8011-1d44-4a02-a808-eba7191fba1b` (5 ACs, single-spec)
**Merged state verified:** `main` @ 6a4eb48 (spec files merged @ 149a081, PR #36)
**Verdict:** **APPROVE**

Convention: spec-drift = code is wrong vs a correct spec; spec-gap = spec is wrong/silent vs correct code.

---

## Per-AC findings

### AC1 — presence co-member real-DB — **MATCHES**
`apps/api/test/integration/presence-comembers.spec.ts` inserts real `users` + `servers` + `server_members` rows via the harness and calls `PresenceService.getCoMemberUserIds` against real Postgres (SUT signature confirmed at `presence.service.ts:119`).
- Shared-server case (SERVER_A: A+B; SERVER_B: C): `getCoMemberUserIds(USER_A)` asserts `toHaveLength(1)`, `toContain(USER_B)`, `not.toContain(USER_A)` (self-excluded), `not.toContain(USER_C)` (non-shared server). Exactly the spec's "shares servers → co-member userIds resolved; empty set otherwise."
- No-membership case (USER_D): asserts `toHaveLength(0)` → empty set. Matches.
- Load-bearing assertions are real-DB round-trips (fixtures → real query → assert). No mock/stub.

### AC2 — member-gate real-DB (definite 403) — **MATCHES**
`apps/api/test/integration/servers-member-gate.spec.ts` seeds owner+member+non-member and calls `ServersService.listServerMembers` (SUT at `servers.service.ts:223`; gate throw at `:232`).
- Member path: asserts roster contains OWNER_ID + MEMBER_ID, each entry has `userId`/`displayName` strings → real `server_members` roster via innerJoin.
- **Non-member path asserts the definite 403**: `rejects.toBeInstanceOf(ForbiddenException)` (line 103–105) — the exception CLASS, not an empty-array or string match. This is the spec's "non-member receives ForbiddenException (403)" and the P-4 jenny carry ("definite per spec"). Confirmed correct — no drift toward "empty."

### AC3 — rbac/assignments authz real-DB (closes F23-T-4) — **MATCHES**
`apps/api/test/integration/rbac-assignments-authz.spec.ts` covers all 4 `getEffectivePermissions` branches (SUT at `rbac.service.ts`) against real rows:
- owner → `owner:true` + all 5 flags true (superuser short-circuit).
- member-with-role → `manage_assignments:true`, all other 4 flags false (role inserted with only that flag).
- member-no-role (null role_id) → owner:false + all 5 false (default-deny).
- non-member → `rejects.toBeInstanceOf(ForbiddenException)` (403).
Plus `can(manage_assignments)` allow (member-with-role → true) and deny (member-no-role → false). Roles/memberships are real fixture rows via `insertFixtureRole`/`insertFixtureMembership`. The describe title + docstring explicitly name F23-T-4 (wave-23 authz surface that shipped with zero real-DB coverage) — closes it. Matches.

### AC4 — real-DB round-trip / no mock, no new tier — **MATCHES**
- Load-bearing assertions in all three specs are real-DB round-trips: harness INSERTs fixture rows → real service method → assert on returned rows/thrown exception. No mock DB, no stubbed query (the only stub is `{} as never` for `ServersService`'s unused `rbacService` ctor dep — the gate method itself hits real PG).
- Reuses the wave-17 `pg-harness.ts` (`setupHarness`/`truncateTables`/`countRows`/`teardownHarness`) extended with `insertFixtureServer/Role/Membership` helpers — a THIN consumer, exactly as the harness docstring anticipated ("Consumer: task 02fa8011").
- No testcontainers, no new CI job, no tier rebuild: specs land under the existing `test/integration/**` glob run by the existing `vitest.integration.config.ts` + existing CI `test` job. Matches.

### AC5 — actually-executes-in-CI (false-green guard) — **MATCHES**
The deployed/merged state genuinely satisfies the guard. Evidence from the merge-commit CI run (GH Actions run `28498910789`, `test` job, merged `main`):
- Integration project ran with `Test Files 4 passed (4)` / `Tests 13 passed (13)` — NONZERO executed, ZERO skipped.
- All three new files executed by name in the log: `rbac-assignments-authz.spec.ts` (6 tests), `presence-comembers.spec.ts` (2), `servers-member-gate.spec.ts` (2) = 10 new + 3 pre-existing rollback tests = 13.
- Wiring confirmed: CI `test` job sets `DATABASE_URL_TEST: postgres://…/studyhall_test` with a `postgres:16` service (`ci.yml:38–46`); `turbo.json` `test:ci` declares `env: ["DATABASE_URL_TEST"]` passthrough; `test:ci` script runs `vitest run … && vitest run --config vitest.integration.config.ts`.
This is a real green-with-executed, not green-with-0/skipped. The wave-17 lesson (verify per-CI-job the tier ran) is satisfied by the actual log, not merely by assertion.

---

## Cross-cutting

- **BOARD P-1-floor-merge-wave-24 (6/7 override-ship):** honored. The slice EXTENDS the existing harness with 3 integration spec files — no rebuild, no testcontainers, no new CI job. Test-only wave; no production code changed. Consistent with the override-ship decision.
- **Reminders arc correctly OUT:** cred-blocked (founder Resend key), explicitly deferred in spec "Out of scope." No reminders work appears in the merged slice — correct.
- **M5 not over-claimed complete:** this is debt-clearing (the 3 uncovered DB-backed surfaces), not milestone closure — reminders debt remains open. No artifact over-claims M5 done. Correct.

## Spec-gap detection (spec silent / could-have-anticipated)

1. **`describe.skipIf(SKIP)` local-skip vs the "FAIL loudly if DATABASE_URL_TEST stripped" edge-case — NOT a drift, minor gap.** The specs skip-with-reason when `DATABASE_URL_TEST` is unset (line 30 / trailing `it.skip` block). The spec's edge-case wants a loud FAIL (connection error), never silent-skip-and-green, when the var is "unset/stripped (Turbo env)." In CI the var is always set (verified above), so the guarded path never fires there and the real risk — a false-green in CI — cannot occur. The skip is scoped to LOCAL dev without PG. So AC5's CI-execution requirement is met; the "fail loudly" wording is a slightly stronger stance than the code takes for the local case. Low severity, does not block APPROVE: the load-bearing venue (CI) is genuinely guarded because `test:ci` unconditionally runs the integration config and CI always provides the var. Worth a note for a future hardening (e.g. a CI-only assertion that executed-count > 0) but not a spec-vs-code mismatch on any AC.

2. **`countRows` helper unused by the new specs — expected, no gap.** The three specs assert on returned service values/exceptions (a stronger round-trip signal than raw row counts); `countRows` remains available for future specs. Spec AC4 lists it as reusable, not mandatory-per-spec. Fine.

---

## Bottom line
All 5 ACs MATCH with no spec-drift. The BOARD floor-merge decision (extend, not rebuild) is honored; reminders correctly deferred; M5 not over-claimed. The false-green guard is genuinely satisfied by the merged CI log (13 executed / 0 skipped, all 3 files by name). **APPROVE.**
