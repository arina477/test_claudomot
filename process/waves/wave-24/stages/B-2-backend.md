# Wave 24 — B-2 Backend (test-automator)

## Specialist: test-automator (agentId a8358eba1e120a283). Commit b2e077f.

## Files implemented
- **apps/api/test/integration/pg-harness.ts:** +3 fixture helpers (insertFixtureServer, insertFixtureRole [+ RolePerms interface, all 5 flags incl manage_assignments], insertFixtureMembership) matching insertFixtureUser style. truncateTables confirmed already covers server_members/roles/servers/users (P-4 karen carry verified — no phantom assignment* truncate; manage_assignments is a column on roles).
- **apps/api/test/integration/presence-comembers.spec.ts:** real-DB getCoMemberUserIds(userId) — A shares server-alpha with B not C → returns [B]; no-membership user → [].
- **apps/api/test/integration/servers-member-gate.spec.ts:** real-DB listServerMembers (servers.service.ts:223, gate :231) — member → real roster; non-member → `.rejects.toBeInstanceOf(ForbiddenException)` (P-4 jenny carry: definite 403, exact class).
- **apps/api/test/integration/rbac-assignments-authz.spec.ts:** real-DB getEffectivePermissions 4 branches (owner all-true / member manage_assignments-role / no-role all-false / non-member 403) + can(manage_assignments) allow/deny. Closes F23-T-4.

## False-green guard (BOARD binding)
Each spec's load-bearing assertion is a REAL-DB round-trip (harness fixtures → real service → assert on returned rows). No mock, no stubbed query. Fail-loud on missing DATABASE_URL_TEST (harness throws ECONNREFUSED; SKIP=false so describe.skipIf does not engage → not a silent skip).

## Verify
typecheck clean; `biome format --write` applied before reporting (BUILD rule 6 honored — no format drift at B-4). Local run CI-gated (no reachable local Postgres:5433 — harness throws loudly, identical to create-server-rollback.spec.ts). Executes+passes in CI (postgres:16 + DATABASE_URL_TEST).

## Deviations: none material. P-4 carries all confirmed (method line numbers ±1, truncate already complete, ForbiddenException class assertion).

```yaml
skipped: false
specialists_spawned: [test-automator]
files_implemented: [apps/api/test/integration/pg-harness.ts, apps/api/test/integration/presence-comembers.spec.ts, apps/api/test/integration/servers-member-gate.spec.ts, apps/api/test/integration/rbac-assignments-authz.spec.ts]
deviations: []
simplify_applied: true
```
