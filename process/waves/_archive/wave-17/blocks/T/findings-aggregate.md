# Wave 17 — T-block findings aggregate (V-2 input)
**New T-block findings:** NONE. The real-PG createServer rollback test ratified GENUINE (real db.transaction + in-transaction fault injection via the real SUT pool connect() → real Postgres ROLLBACK + cross-connection no-orphan assertion via a separate harness pool); 3/3 in CI vs Postgres 16. False-green discipline held (Turbo env-strip caught at C-1 + fixed).

## Carried from B-6 (accepted non-blocking → V-2 disposition)
- M1 (Med): pg-harness CF-2 DATABASE_URL override no NODE_ENV/VITEST guard (safe — nest build excludes test/). Harden with `if (process.env.VITEST && testDbUrl)`.
- M2 (Med): vitest.integration.config omits reflect-metadata (safe — spec bypasses Nest DI). Add before a DI-booting integration spec lands.
- L1 dup 0004 migration prefix (journal preserves order); L2 harnessDb only for migrate; L3 countRows table interpolation (literals only).

## Pre-existing known carries (NOT wave-17 regressions)
- 9 pre-existing wave-14 biome WARNINGS (lint 0-errors) — tracked by task 4e994e96 (wave-16 V-2).
- 02fa8011 (Med, real-PG integration tier, 2-wave + V-3-flagged 3rd-recurrence) — **PARTIALLY MITIGATED:** the reusable pg-harness.ts now exists; 02fa8011 becomes a thin consumer. V-2 note.
