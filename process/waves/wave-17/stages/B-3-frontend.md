# Wave 17 — B-3 (integration test authoring — backend-developer)
```yaml
skipped: false
specialists_spawned: [backend-developer]
files_implemented:
  - apps/api/test/integration/pg-harness.ts (reusable real-PG harness — CF-2 redirect + migrate + truncate/fixture + teardown)
  - apps/api/test/integration/create-server-rollback.spec.ts (3 cases: positive commit, mid-txn rollback, first-insert rollback)
  - apps/api/vitest.integration.config.ts (parallel-safe: fileParallelism:false + singleFork)
  - apps/api/package.json (test:integration + test:ci runs unit+integration)
  - apps/api/tsconfig.json (include test/**)
deviations:
  - "mid-txn rollback uses fault-injection on the REAL transaction (spy makes the 5th/channels insert throw after server+role+member+category really executed → REAL Postgres ROLLBACK observed via row counts) — the plan's designated 'acceptable alternative' (channels has no UNIQUE; server UUID is gen_random_uuid mid-txn so unseedable). The FIRST-insert case uses a REAL constraint violation (invite_code UNIQUE, SQLSTATE 23505). Transaction itself is unmocked."
simplify_applied: true
```
- CF-2 done: pg-harness sets process.env.DATABASE_URL=DATABASE_URL_TEST at module-eval BEFORE the db lazy-Proxy resolves; spec imports './pg-harness' first → SUT's own db singleton hits the test DB (not a side instance).
- Parallel-safe: integration project config (not per-spec) → reusable harness (02fa8011) inherits serial execution.
