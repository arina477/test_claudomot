# Wave 87 — T-4 Integration
Pattern B (active) → executed via CI. A real-Postgres integration test `apps/api/test/integration/join-default-role.integration.spec.ts` was authored (node-specialist, pg-harness discipline, no DB mocking) covering the boundary the unit tests mock. Local execution was blocked (no Postgres server in the brain environment: port 5433 ECONNREFUSED, no initdb/docker), so it was landed via follow-up PR #108 where CI provisions postgres:16 + DATABASE_URL_TEST.

**CI execution evidence:** PR #108 required `test` job = SUCCESS on 509aae84 — the 4 integration cases ran GREEN against real Postgres:
1. public join stamps the server's is_default 'Member' role id (not null)
2. invite join (permanent code) stamps the default role id
3. zero-default fallback: default role deleted (FK ON DELETE SET NULL) → join succeeds, role_id NULL, no throw
4. re-join preserves an existing (non-default) role (onConflictDoNothing — no restamp)

Boundary audited: ServersService.resolveDefaultRoleId SELECT + role_id insert on both join paths, against the real schema. All strict assertions (.toBe / .toBeNull / exactly-one-row); none weakened.
```yaml
test_pattern: active
skipped: false
boundaries_audited: ["joinPublicServer -> server_members.role_id", "joinViaInvite -> server_members.role_id", "resolveDefaultRoleId SELECT", "zero-default NULL fallback", "onConflictDoNothing re-join role preservation"]
ci_evidence: ["PR #108 (509aae84) required 'test' job SUCCESS — join-default-role.integration.spec.ts 4/4 green against postgres:16"]
infrastructure_gap_recorded: false
findings: []
```
