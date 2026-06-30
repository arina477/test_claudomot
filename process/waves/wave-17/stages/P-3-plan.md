# Wave 17 — P-3 Plan

## Approach

### Harness choice — reuse the existing CI Postgres service (NO new dep)
The CI `test` job already runs a **Postgres 16 service** with `DATABASE_URL_TEST=postgres://test:test@localhost:5432/studyhall_test`, and `apps/api/src/db/index.ts` connects via `node-postgres` Pool + drizzle. There's already a real-DB test precedent (`apps/api/src/db/index.spec.ts`). So the rollback integration test connects a drizzle instance to `DATABASE_URL_TEST`, applies the real migrations, and runs the ACTUAL `createServer` transaction.
- *Alternatives considered:* **PGlite** (in-process PG-in-WASM — works locally without a PG, but a new dep + a second PG engine to reason about) and **testcontainers** (docker-in-CI, heavier). Rejected: the CI PG service already exists, costs zero new deps, and exercises the SAME node-postgres/drizzle path prod uses (PGlite is a different driver). This is also exactly the "real-PG integration tier" shape `02fa8011` wants → harness reuse.
- *Trade-off accepted:* the integration test needs a real Postgres reachable at `DATABASE_URL_TEST` — present in CI; locally a dev sets `DATABASE_URL_TEST` to a local PG (documented). Consistent with `db/index.spec.ts`.

### Test design (real transaction + forced mid-txn failure)
A new integration spec (`apps/api/src/servers/servers.rollback.spec.ts` or `apps/api/test/integration/create-server-rollback.spec.ts`):
1. **Setup:** connect drizzle to `DATABASE_URL_TEST`; run `migrate()` (drizzle-orm/node-postgres/migrator) to apply `apps/api/drizzle/migrations/` 0000..latest; provide a real verified-ish user row (or a fixture user the FK needs) so the create can run.
2. **Isolation:** clean state per test — truncate the touched tables (servers, roles, server_members, categories, channels + any user fixture) before/after each case, OR run each case and assert on a fresh count. No cross-case leakage.
3. **Rollback case (the load-bearing AC):** invoke the REAL `createServer` (NOT the stubbed db.transaction) but force a failure PART-WAY THROUGH the transaction — after ≥1 insert has executed, before commit. **Injection mechanism (B specialist picks the most real + deterministic):** preferred = a genuine DB constraint violation on a LATER insert (e.g. seed a row that collides with a UNIQUE the channel/category insert hits, so server+role+member already inserted then the late insert throws → drizzle rolls the whole txn back); acceptable alternative = wrap the pool client / a single `tx.insert` to throw after N statements (still through the real txn so ROLLBACK actually fires). Then assert: **zero rows** for that attempt in servers, roles, server_members, categories, channels.
4. **Positive case:** a SUCCESSFUL createServer commits ALL rows (server + owner role + owner member + General category + #general channel) — proves the harness runs real transactions, not no-ops.
5. **Failure-position coverage (edge ACs):** at least the late-insert failure (proves earlier inserts roll back); optionally first-insert failure.

### Data / API / deps
**No schema change. No API change. NO new dep** (reuse node-postgres + drizzle migrator, both present). The test APPLIES existing migrations to the test DB.

### Wiring
- Vitest: the integration spec may need to run in the `test:ci` job (which has `DATABASE_URL_TEST`). Confirm `pnpm test:ci` picks it up; if integration specs need a separate vitest project/config (so they only run when `DATABASE_URL_TEST` is set + skip cleanly when absent locally), add a minimal config. The spec should SKIP-with-clear-reason (not fail) when `DATABASE_URL_TEST` is unset locally, but RUN in CI.
- The spec reads `DATABASE_URL_TEST` (CI provides it); maps it so the drizzle instance under test points at the test DB.

## Plan

### File-level steps
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/api/test/integration/create-server-rollback.spec.ts (or src/servers/servers.rollback.spec.ts) | create | real-PG harness (connect DATABASE_URL_TEST + migrate) + rollback case (forced mid-txn failure → no orphan rows) + positive commit case + isolation | backend-developer | first |
| apps/api/test/integration/pg-harness.ts (optional helper) | create | reusable: connect to DATABASE_URL_TEST, migrate, truncate-between, teardown — the reusable real-PG tier 02fa8011 will consume | backend-developer | with spec |
| apps/api/vitest.config.ts (or a vitest project) | modify | ensure the integration spec runs under test:ci (has DATABASE_URL_TEST) + skips cleanly locally when unset | backend-developer | after spec |
| .github/workflows/ci.yml | verify/modify | confirm the `test` job applies migrations / the integration spec runs against the postgres service; the service + DATABASE_URL_TEST already exist — likely no change, just confirm the spec is picked up | backend-developer | last |

### Specialist routing (validated vs AGENTS.md)
- `backend-developer` (NestJS/node backend + db + tests) — present. (Not ui-comprehensive-tester — that's the Playwright/UI author; this is a backend DB integration test.)

### Parallelization
Serial (one specialist): harness/spec → vitest config → CI confirm.

### B-block note
- B-0: branch + NO schema. B-1/B-2 SKIP (no contract/route surface). B-3 = the integration spec authoring. B-4 = vitest/CI wiring. B-5 = run the integration test green (in CI it hits the PG service; locally with DATABASE_URL_TEST). B-6 head-builder gate. D-block SKIPS (design_gap false).
- Anti-flake (P-0 carry): deterministic isolation, no sleeps, fail-loud, no retry-masking.

### Self-consistency sweep
1. Every AC → step: real-txn-not-stub + migrate (spec setup); mid-txn-failure→no-orphans (rollback case); positive commit (success case); real schema applied (migrate); deterministic/CI-green (isolation + vitest/CI wiring). ✓
2. Specialist on each step. ✓ 3. No file in two batches. ✓ 4. design_gap false → D skips. ✓ 5. Harness alternative named (PGlite/testcontainers vs CI-PG-service). ✓ 6. No data/API contract change. ✓ 7. No new dep. ✓ 8. SDK n/a. ✓
