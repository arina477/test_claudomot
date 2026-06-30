# V-1 Jenny — Semantic Spec Verification (wave-17)

**Wave:** 17 — Real-Postgres create-server rollback test (single-spec, test-infra)
**Task:** 25523fb0-edef-46e4-928b-55e78495d181
**Merged state:** main @ dfb65ca (PR#29); verified against working tree @ 34610b6
**Verdict:** **APPROVE**

Independent verification of the merged implementation against the authoritative DB spec.
Files examined: `apps/api/test/integration/pg-harness.ts`, `apps/api/test/integration/create-server-rollback.spec.ts`, `apps/api/vitest.integration.config.ts`, plus the SUT `apps/api/src/servers/servers.service.ts:68` and `apps/api/src/db/index.ts` (to confirm the injection mechanism is sound, not just plausible).

---

## Per-AC verdicts

### AC1 — Real-Postgres test runs the ACTUAL db.transaction (not the always-invoke stub) — **MATCHES**
- The spec under test imports the real SUT (`ServersService` from `../../src/servers/servers.service`, spec:26) and calls the unmodified `createServer`, which runs `db.transaction(...)` (servers.service.ts:68). No `db.transaction` mock anywhere in the integration spec.
- The harness redirects the SUT's lazy db Proxy to a real Postgres via `process.env.DATABASE_URL = DATABASE_URL_TEST` set at module-eval time (pg-harness.ts:18-21), and the spec imports `./pg-harness` as the FIRST import (spec:13) so the side effect lands before `src/db/index.ts` first resolves its Pool. Confirmed against `src/db/index.ts`: the db export is a get-only Proxy that lazily builds `new Pool({ connectionString: process.env.DATABASE_URL })` — so the redirect is load-bearing and correct.
- This is the real transactional engine (node-postgres against a real PG 16 service), not the unit test's `servers.service.spec.ts` always-invoke stub. The gap the wave exists to close is closed.

### AC2 — Forces mid-txn failure (after ≥1 insert, before commit) → asserts full ROLLBACK, zero orphans across all 5 tables — **MATCHES**
- `'rolls back ALL rows when channels insert fails mid-txn'` (spec:175) counts INSERT statements via the pool-query interceptor and throws on INSERT #5 (channels), i.e. AFTER servers + roles + server_members + categories have inserted inside the open txn, BEFORE commit (spec:178-187). Insert ordering verified against SUT: servers → roles → server_members → categories → channels — channels is genuinely the 5th and last insert (servers.service.ts:72-118).
- Asserts `createServer` rejects, then `countRows === 0` for **servers, roles, server_members, categories, channels** (spec:198-202) — all five spec-named tables. Counts run on a SEPARATE harness pool, so they prove cross-connection commit-visibility (real ROLLBACK), not same-session dirty reads.
- Bonus edge case `'rolls back cleanly on first-insert failure'` (spec:221) covers the spec's explicit "failure at the FIRST insert → no rows" edge — also asserts zero across all 5 tables.

### AC3 — Positive: successful createServer commits ALL rows — **MATCHES**
- `'commits all 5 row-kinds on success'` (spec:136) runs createServer with no fault injection and asserts `countRows === 1` for all five tables plus the returned shape (spec:140-152). This proves the harness runs real transactions that actually commit (not no-ops), satisfying the spec's "proving the harness runs real transactions" clause.

### AC4 — Applies real migrations to the test DB before running — **MATCHES**
- `setupHarness()` runs `migrate(harnessDb, { migrationsFolder: MIGRATIONS_DIR })` (pg-harness.ts:57) where `MIGRATIONS_DIR` is the absolute path to `apps/api/drizzle/migrations` (pg-harness.ts:31), called in `beforeAll` (spec:99-101). Fail-loud: any migration error propagates (no try/catch swallow). Real `0000..latest` drizzle migrations confirmed present on disk. Operates against the real table/constraint shape.

### AC5 — Green in CI + local; deterministic/isolated; anti-flake — **MATCHES**
- **Isolation:** `truncateTables()` in `beforeEach` (spec:109-112) TRUNCATE … RESTART IDENTITY CASCADE across all touched tables + users fixture (pg-harness.ts:69-80); fresh fixture user per test. No shared state across cases.
- **Determinism / no cross-file races:** `vitest.integration.config.ts` sets `fileParallelism: false` + `pool: forks, singleFork: true` so shared-DB + truncate-between is safe as more integration specs land.
- **Anti-flake:** no sleeps/timers anywhere; fault is a synchronous deterministic throw on a counted INSERT; assertions are exact equality (`toBe(0)` / `toBe(1)`), no retry/poll/`waitFor` masking. `afterEach` always restores the patched `pool.connect` even on failure (spec:114-118), preventing leakage into later cases.
- **Local-skip discipline:** `describe.skipIf(SKIP)` with an explicit `it.skip` reason when `DATABASE_URL_TEST` is unset (spec:248-252) — a visible skip, not a silent pass. `setupHarness` throws loudly if called without the env var (pg-harness.ts:46-50).

---

## Scope / drift checks

- **Single create-server rollback test, no balloon — MATCHES.** Three `it` cases, all exercising `createServer` only (success + channels-insert-fault + servers-insert-fault). Does NOT enumerate every `db.transaction` call-site (no owner-lockout / other-service rollback tests) and does NOT build the full 02fa8011 integration tier. The reusable harness (`pg-harness.ts`) is the in-spec enabler the spec itself names ("This harness is REUSABLE… enabler for the parked… task 02fa8011"); it ships with only the wave-17 consumer wired — correct, not creep.
- **Test-infra wave, no M3 feature advance — MATCHES.** Pure backend test-infra. No production code touched (SUT, db module, migrations all unchanged — confirmed unmodified). No threads/attachments work; M3 feature scope untouched. This is the wave-7 carried tech-debt, exactly as framed.
- **Fault via pool-query injection (spec's "acceptable alternative") — MATCHES intent, not drift.** The spec's edge-case list calls for "a constraint violation or an injected throw" mid-txn. The implementation injects the throw at the real node-postgres `PoolClient.query()` boundary by wrapping the singleton's `pool.connect()` (spec:60-92; the `pool()` getter export confirmed in src/db/index.ts). This fault rides the SAME real connection drizzle uses to run BEGIN/INSERT/COMMIT, so the throw propagates out of the real `transaction()` callback and a REAL Postgres ROLLBACK fires. The docstring's rationale (the get-only Proxy has no set-trap, and `generateCode` is a bare intra-module ref, so higher-level spies are no-ops) is accurate — pool-query injection is the correct settable, real injection point. It forces a genuine rollback, fully consistent with the spec's intent. No drift.

---

## Note (non-blocking)
SUT docstring at servers.service.ts:64-66 lists the txn as "server → owner server_member → 'General' category → #general channel," omitting the `roles` insert that the code actually performs. The test correctly models 5 inserts (channels = #5) matching the real code, not the stale comment. Cosmetic comment drift in the SUT, outside this wave's scope — flagged for awareness only; does not affect the test's correctness or any AC.

---

## Summary

| AC | Verdict |
|----|---------|
| AC1 real db.transaction vs stub | MATCHES |
| AC2 mid-txn fail → full rollback, 0 orphans ×5 | MATCHES |
| AC3 positive commit ALL rows | MATCHES |
| AC4 real migrations applied | MATCHES |
| AC5 CI+local green, deterministic, anti-flake | MATCHES |
| Scope: single create-server test, no balloon | MATCHES |
| Test-infra only, no M3 advance | MATCHES |
| Pool-query fault = spec's acceptable alternative | MATCHES (intent preserved) |

The merged test proves the rollback guarantee empirically against real Postgres — exactly the gap the wave was opened to close — with no drift from spec intent. **APPROVE.**
