# Wave 24 — P-3 Plan

## Approach
**Extend the existing wave-17 real-PG integration harness with 3 new spec files + the fixture helpers they need.** No production code, no migration, no new dep, no new tier. Thin-consumer-of-shared-harness (the converged pattern; rebuilding would be the anti-pattern — mvp-thinner/BOARD confirmed).

### Architecture delta
NONE (test-only). Reuses `apps/api/test/integration/pg-harness.ts` (setupHarness/migrate, truncateTables, insertFixtureUser, countRows, teardownHarness) + `vitest.integration.config.ts` (singleFork, `include: test/integration/**/*.spec.ts`, CI postgres:16 + DATABASE_URL_TEST). *Alternative considered:* testcontainers — rejected (harness + CI service already work; would be gold-plating per BOARD).

### Harness extension (fixture helpers the current harness lacks)
`pg-harness.ts` currently exposes only `insertFixtureUser` + a createServer-scoped `truncateTables`. The new specs need real-row fixtures for servers/roles/members → add: `insertFixtureServer(id, ownerId, name)`, `insertFixtureRole(id, serverId, name, permsObj)`, `insertFixtureMembership(serverId, userId, roleId?)`, and extend `truncateTables` to cover `roles`, `assignment*` (idempotent). These are shared helpers (multiple specs consume them), NOT per-spec duplication.

### Data model / API / deps
None — test-only. No new types, endpoints, or dependencies.

## Plan (file-level steps by B-stage)

### B-0 Branch & schema (orchestrator)
- Branch `wave-24-integration-tier`. NO schema (schema_skipped: true).

### B-1 Contracts — SKIP (no contract surface changes).

### B-2 Backend/test (test-automator)
- `apps/api/test/integration/pg-harness.ts` — [modify] add insertFixtureServer / insertFixtureRole / insertFixtureMembership + extend truncateTables (roles/assignments). Match the existing helper style.
- `apps/api/test/integration/presence-comembers.spec.ts` — [create] real-DB: `PresenceService.getCoMemberUserIds(userId)` (presence.service.ts:119) — user sharing servers → real co-member ids; no co-members → []. Real server_members rows via harness.
- `apps/api/test/integration/servers-member-gate.spec.ts` — [create] real-DB: the servers.service member roster query (server_members innerJoin, servers.service.ts:128) — member → roster; non-member → ForbiddenException/empty per the service contract. Real rows.
- `apps/api/test/integration/rbac-assignments-authz.spec.ts` — [create] real-DB: `RbacService.getEffectivePermissions` (4 branches: owner all-true / member role-flags incl manage_assignments / no-role all-false / non-member 403) + `can(userId, serverId, 'manage_assignments')` allow/deny — against real roles + server_members + servers rows.
- **Each spec's load-bearing assertion = a real-DB round-trip** (insert fixtures → run the real service/query → assert on returned rows). NO mock, NO stripped DATABASE_URL_TEST (false-green guard).

### B-3 Frontend — SKIP (no UI).

### B-4 Wiring (orchestrator/test-automator)
- Repo typecheck (the specs typecheck against the real service signatures). Confirm `vitest.integration.config.ts` glob picks up the 3 new specs. `biome format --check` before commit (CI rule 4 + BUILD rule 6). Confirm the integration tier RUNS the new specs (nonzero) — locally if DB reachable, else CI-authoritative.

### B-5 Verify
- Run the integration tier (`vitest run --config vitest.integration.config.ts`) against a real Postgres if reachable; confirm the 3 new specs EXECUTE + pass (not skip). If no local DB, defer to C-1 CI (postgres:16) but confirm the specs are wired to fail-loud on missing DATABASE_URL_TEST (false-green guard).

### B-6 Review
- head-builder + /review. Focus: are the specs REAL-DB round-trips (not mock-the-SUT)? Do they actually assert on inserted rows? Is the false-green guard real (fail-loud on no DB)?

### Specialist routing (vs AGENTS.md): test-automator (present). Single specialist owns all test code (coherent, one module).

### Parallelization: the 3 specs are independent files but share the harness-extension (B-2 authors the harness helpers FIRST, then the 3 specs) — single test-automator, sequential within the stage (harness helper before the specs that consume it).

### Self-consistency sweep
1. Every AC → step: AC1 presence spec, AC2 member-gate spec, AC3 rbac-authz spec, AC4 real-DB-round-trip (all 3 specs + harness), AC5 actually-executes (B-4/B-5 + T-4). ✓
2. Specialist (test-automator). ✓ 3. No file in two parallel batches. ✓ 4. design_gap_flag=false. ✓ 5. Reuse named (pg-harness, existing service methods). ✓ 6. No contracts (test-only). ✓ 7. No new dep. ✓ 8. No SDK. ✓

## BOARD conditions → enforcement
- T-4 false-green guard: T-block verifies per-CI-job the integration tier executed (nonzero + real-DB row assertions). Each spec fails loud on missing DATABASE_URL_TEST.

→ P-4 Gate.
