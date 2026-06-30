# P-4 Karen — Phase-2 load-bearing-claim verification (wave-17)

**Subject:** Real-PG create-server rollback test — spec (`25523fb0`) + P-3 plan.
**Verdict: APPROVE — with two MANDATORY plan annotations (CF-2 SUT-redirect + precedent correction) that B must honor. Claims are grounded; the gap is a phrasing ambiguity that, left unguarded, would silently test nothing.**

---

## Per-claim findings

### 1. createServer runs a real db.transaction with 5 inserts — VERIFIED
`apps/api/src/servers/servers.service.ts:67-117`. `createServer` = `await db.transaction(async (tx) => {...})` with exactly 5 inserts in order: servers (`:71`), roles (`:78`), server_members (`:89`), categories (`:94`), channels (`:101`). The rollback-under-test is real: every insert uses the txn handle `tx`, so a mid-txn throw rolls all of them back. **The atomicity guarantee the wave wants to prove is genuinely implemented and genuinely untested at the engine level.**

### 2. Unit test MOCKS db.transaction (proof gap is real) — VERIFIED
`apps/api/src/servers/servers.service.spec.ts:62-69` mocks the whole `../db/index` module; `:76` `const mockTransaction = db.transaction as ... MockFn`. The createServer tests (`:162-231`) do `mockTransaction.mockImplementation((fn) => fn(txMock))` — an **always-invoke stub that never rolls back**. The "inserts 5 rows" / "seeds default role" assertions are pure call-shape checks against `capturedValues`. **Zero rollback coverage exists. Gap confirmed exactly as the spec claims.**

### 3. CI `test` job has a Postgres 16 service + DATABASE_URL_TEST — VERIFIED
`.github/workflows/ci.yml:35-53`: `test` job → `services.postgres: image: postgres:16`, db `studyhall_test`, port `5432`, health-checked; `env.DATABASE_URL_TEST: postgres://test:test@localhost:5432/studyhall_test`; runs `pnpm test:ci`. The harness target exists. (Note: `boot-probe:` at `:76-117` independently proves migrations-against-this-same-PG works in CI by booting the compiled API against it.)

### 4. CF-2 (load-bearing correctness) — VERIFIED-WITH-CAVEAT → annotation REQUIRED
`apps/api/src/db/index.ts` is exactly as the prompt describes:
- `getPool()` (`:7-16`) reads `process.env.DATABASE_URL` (NOT `_TEST`) and throws if unset.
- `getDb()` (`:24-29`) builds drizzle lazily.
- `export const db` (`:31-35`) is a **lazy `Proxy`** — the Pool resolves on FIRST property access, reading `DATABASE_URL` at that moment.

createServer imports this module-level `db` singleton (`servers.service.ts:18`). **Therefore the ONLY way to exercise the real createServer against the test DB is to make the SUT's own `db` singleton resolve to the test DB** — i.e. set `process.env.DATABASE_URL = <test DB url>` BEFORE the Proxy's first property access (and before the service is imported/instantiated), so the singleton's lazy Pool binds to the test DB. Spinning up a *separate* drizzle instance pointed at `DATABASE_URL_TEST` and calling it directly would test a side object that `createServer` never touches → the rollback assertion would pass against rows createServer never wrote. **That is the green-but-meaningless trap.**

**The plan's phrasing is ambiguous and must be tightened.** P-3 line 6/12/23 say "connect a drizzle instance to `DATABASE_URL_TEST`" and "maps it so the drizzle instance under test points at the test DB." Line 23 ("the drizzle instance UNDER TEST") leans correct, but lines 6/12 read like a side instance. Because nothing in the repo currently maps `DATABASE_URL_TEST → DATABASE_URL` (verified: no occurrence of `DATABASE_URL_TEST` anywhere under `apps/api/src`, `apps/api/test`, vitest config, or package scripts; `test:ci` = bare `vitest run`), the redirect is NET-NEW and must be done explicitly. **Mandatory annotation for B:** the harness MUST set `process.env.DATABASE_URL` to the test-DB URL (sourced from `DATABASE_URL_TEST`) before the SUT's `db` Proxy first resolves, and the rollback/positive assertions MUST query through (or count against) the SAME singleton/connection createServer used — NOT a side drizzle instance. This is the wave's whole point; flag at B-3 and re-check at B-6.

### 5. drizzle migrate available — VERIFIED
`drizzle-orm@^0.45.2` + `pg@^8.22.0` in `apps/api/package.json`; `apps/api/node_modules/drizzle-orm/node-postgres/migrator.js` resolves on disk. `apps/api/drizzle/migrations/` holds 8 `.sql` files with a valid `meta/_journal.json` (8 entries, 0000..0007). Migrations exist and are applyable via `drizzle-orm/node-postgres/migrator`. **No `migrate()` call exists in the codebase yet — net-new in this wave, but the tool + migrations are present.**
- *Minor (non-blocking) flag for B:* the migrations folder has TWO `0004_*` tags (`0004_gigantic_saracen`, `0004_green_madripoor`) — both in the journal. drizzle's migrator runs by journal order so this is fine, but B should run `migrate()` once against a clean DB at harness setup and fail loud if the journal is inconsistent (don't paper over a migrate error).

### 6. backend-developer in AGENTS.md — VERIFIED
`command-center/AGENTS.md:70` — pre-built, "Server-side implementation across frameworks." Correct routing; not a Playwright/UI author. ✓

### 7. Antipatterns
- **ACs falsifiable — YES.** Each AC asserts concrete row-count outcomes (zero orphan rows across 5 named tables on rollback; all 5 rows present on commit). Not "transaction works" hand-waving.
- **Mid-txn failure realistic — YES, with a caveat.** The preferred injection (a genuine constraint violation on a LATE insert — e.g. seed a colliding UNIQUE the channel/category insert hits — so server+role+member already inserted then the late insert throws) forces a REAL Postgres ROLLBACK through the real txn. That is the correct, real mechanism. The "acceptable alternative" (wrap a client/tx.insert to throw after N statements) is also real PROVIDED the throw happens inside the live txn so Postgres actually issues ROLLBACK. **Annotation for B:** prefer the real-constraint-violation path; if using the throw-injection path, the throw must propagate out of `db.transaction`'s callback (which it will — createServer doesn't catch) so the engine rolls back — do NOT mock the rollback.
- **Gold-plating — NONE.** Scope is create-server only; the reusable `pg-harness.ts` helper (plan step 2) is explicitly the enabler for the already-parked tier task `02fa8011`, not speculative. Floor-exempt as test-infra per the cited wave-16 P-1 precedent. Justified.

---

## Correction to a plan claim (not load-bearing, but log it)
P-3 line 6 cites `apps/api/src/db/index.spec.ts` as a "real-DB test precedent." **WRONG — overstated.** That spec (`:8-22`) is a *laziness guard*: it sets `process.env.DATABASE_URL = undefined` and asserts the module imports without throwing and never calls `getPool()` at eval time. **It deliberately does NOT open a connection.** So there is NO existing real-DB-connection precedent in this repo — this wave establishes the first one. This does not change the verdict (the CI PG service + migrations + drizzle are all real and present), but B must not lean on `index.spec.ts` as a connection template; it's the opposite pattern.

---

## Bottom line
APPROVE. The harness target (CI PG16 + DATABASE_URL_TEST), the migrator + migrations, the real 5-insert txn, and the proof gap are all grounded in real code at the cited lines. The one load-bearing correctness risk (CF-2) is a plan-phrasing ambiguity, not a code falsehood — but it is the difference between proving rollback and proving nothing, so it is carried forward as a **mandatory B-3/B-6 annotation: redirect the SUT's own `db` singleton via `process.env.DATABASE_URL` before first Proxy resolution; never assert against a side drizzle instance.** Plus the precedent correction in §Correction.
