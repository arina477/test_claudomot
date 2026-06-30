# Wave 17 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Real-Postgres create-server rollback integration test (test-infra)
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim; no schema |
| B-1 | stages/B-1-contracts.md | SKIP | no contract surface |
| B-2 | stages/B-2-backend.md | SKIP | no routes/services (the SUT createServer already exists) |
| B-3 | stages/B-3-frontend.md | done | integration spec + reusable PG harness (CF-2 redirect, 3 cases) |
| B-4 | stages/B-4-wiring.md | done | parallel-safe integration project; test:ci runs unit+integration |
| B-5 | stages/B-5-verify.md | done | typecheck+lint+292 unit green; integration skip-clean local / runs CI |
| B-6 | stages/B-6-review.md | pending | head-builder gate (verify integration PROJECT parallel-safe) |

## Block-specific context
- **Spec contract:** tasks row 25523fb0 (DB); single-spec
- **Branch:** wave-17-create-server-rollback-test
- **claimed_task_ids:** [25523fb0]
- **No deps, no env vars, no schema.** Reuse CI Postgres 16 service (DATABASE_URL_TEST) + drizzle migrate.
- **B-block mandatory carries (P-4):**
  1. CF-2 (load-bearing): redirect the SUT's OWN db singleton (apps/api/src/db/index.ts) to the test DB — set process.env.DATABASE_URL = test DB BEFORE first lazy-Proxy resolution; map DATABASE_URL_TEST→DATABASE_URL. NOT a side instance (createServer imports the singleton).
  2. Parallel-safe integration vitest project (fileParallelism:false / txn-per-test / schema-per-worker) — so the reusable harness (02fa8011) inherits parallel-safety. B-6 verifies the PROJECT is parallel-safe.
  3. migrate FAIL LOUD; two 0004_* migrations both journaled.
  4. CI-runs / local-skips-with-clear-reason (DATABASE_URL_TEST present in CI, unset locally).
  5. db/index.spec.ts is NOT a real-connection precedent.

## Open escalations carried into gate
none

## Gate verdict log
<appended by head-builder at B-6>
