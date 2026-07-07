# Wave 72 — T-4 Integration (Pattern A: CI-verified)

- **Pattern A** — CI `test` job runs postgres:16 + DATABASE_URL_TEST; the pg-harness integration spec RAN in CI on e5bfba1 (not mocked — real DB, per test-writing-principles "don't mock the database").
- **Boundaries covered by `apps/api/test/integration/account-deletion.spec.ts` (4 security paths):** no-IDOR (only session caller deleted); owner-block 409 with rollback (deleted_at stays null); erasure atomicity (PII scrub incl. `avatar_key IS NULL`, `deleted_at` set, server_members → 0 in one call, idempotent, distinct email placeholders); re-auth-blocked (exercises the override deleted_at branch directly + UNAUTHORISED signature — supertokens-core unavailable in harness, both doors proven independently). The best-effort revoke path is exercised (WARN logged, non-fatal) confirming the atomicity fix.
- **Schema boundary:** migration 0027 (users.deleted_at) applied + queried in the harness.

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [users.deleted_at-migration, account-deletion.service, POST-/profile/delete, server_members-delete, supertokens-deleted_at-override]
ci_evidence: ["test job green on e5bfba1 with postgres:16; account-deletion.spec.ts (4 security paths) passed"]
active_run_output: ""
infrastructure_gap_recorded: false
findings: []
