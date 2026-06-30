# V-1 Karen — source-claim verification (wave-17)

> Reality check on the wave-17 deliverable against the MERGED state (main @ `dfb65ca`, PR #29).
> The deliverable IS a test: a real-Postgres `createServer` rollback integration test.
> Light test-infra wave. Verdict below is binary, per-claim.

**Verdict: APPROVE**

Spec id: `wave-17-spec` · task `25523fb0-edef-46e4-928b-55e78495d181` · single-spec.
The load-bearing checks (test genuinely fires a real rollback, ran green in CI not skipped,
CF-2 redirect) all hold. The prior `/review`-caught antipatterns (db Proxy unspyable +
`generateCode` intra-module no-op) are demonstrably FIXED — the fault is now injected at the
real node-postgres Pool, which is the same singleton the SUT's transaction runs through.

---

## Per-claim findings

### Claim 1 — files exist on main (test + configs + base exclude) — VERIFIED

- `apps/api/test/integration/pg-harness.ts` — present (118 lines).
- `apps/api/test/integration/create-server-rollback.spec.ts` — present (252 lines).
- `apps/api/vitest.integration.config.ts:27` — `fileParallelism: false` + `vitest.integration.config.ts:30-32` `forks/singleFork: true` (parallel-safe shared-DB serial execution).
- `apps/api/vitest.config.ts:11` — `exclude: [...configDefaults.exclude, 'test/integration/**']` (base config does NOT collect integration specs; the H1 wave-17 B-6 fix is in place — without it the unit leg of `test:ci` would double-collect integration specs at default parallelism).

All four artifacts present on the merged tree. **VERIFIED.**

### Claim 2 — test is GENUINELY REAL (not coverage-theater), incl. CF-2 redirect — VERIFIED  *(load-bearing)*

This is THE check. It holds on every sub-point.

- **Runs the REAL `createServer` `db.transaction`, not the unit stub.** The spec imports the
  actual `ServersService` (`create-server-rollback.spec.ts:26`) and calls
  `sut.createServer(...)` (lines 138/195/234). `createServer` (`servers.service.ts:67-117`) runs
  the real `db.transaction` over the lazy `db` Proxy (`servers.service.ts:18` imports the real
  `db` from `../db/index`). No mock of `db.transaction` anywhere in the spec — unlike
  `servers.service.spec.ts` (the always-invoke stub this wave exists to compensate for).

- **Fault injected INSIDE the open transaction via the REAL SUT pool (`wrapPoolConnect`).**
  `db/index.ts:37` exports `getPool as pool`; `getDb()` (`db/index.ts:24-29`) builds the drizzle
  instance over `getPool()` — the single module-scoped `_pool` (`db/index.ts:5-16`). The test
  patches `dbModule.pool().connect` (`create-server-rollback.spec.ts:60-92`) — the SAME `_pool`
  singleton the SUT's `db.transaction` calls `pool.connect()` on. The patched client's `query()`
  counts INSERTs and throws on the 5th (channels) (lines 178-187) or the first-`servers` INSERT
  (lines 222-226), i.e. AFTER `BEGIN` and ≥1 insert, BEFORE `COMMIT`. This is a real mid-txn
  fault on the real connection — real Postgres issues `ROLLBACK`. **Not trivially-true.**

- **Asserts ZERO orphan rows across all 5 tables via a SEPARATE harness pool.** `countRows`
  (`pg-harness.ts:100-106`) queries through `harnessPool` (`pg-harness.ts:53`), a pool DISTINCT
  from the SUT `_pool`. The rollback case asserts `count===0` for servers/roles/server_members/
  categories/channels (`create-server-rollback.spec.ts:198-202`); first-insert case the same
  (lines 239-243). A separate connection seeing zero rows is a genuine cross-connection
  commit-visibility check — if the txn had committed (or the fault never fired), the separate
  pool would see rows. The positive case (lines 148-153) asserts exactly 1 row each, proving the
  harness commits real rows (not a no-op).

- **CF-2: SUT db singleton redirected to the test DB before the Proxy resolves.** `pg-harness.ts:18-21`
  sets `process.env.DATABASE_URL = process.env.DATABASE_URL_TEST` at module-eval time. The spec
  imports `./pg-harness` FIRST (`create-server-rollback.spec.ts:13`), before any SUT import
  (line 26). Since `getPool()` reads `process.env.DATABASE_URL` only on first `_pool` construction
  (`db/index.ts:9`, lazy), the singleton resolves to the test DB. CF-2 redirect is correct and
  ordering-enforced. **VERIFIED.**

### Claim 3 — test actually RAN + passed 3/3 in CI vs real Postgres (not skipped) — VERIFIED

- `turbo.json:23-28` — `test:ci` task carries `"env": ["DATABASE_URL_TEST"]` AND `"cache": false`.
  This is the devops-engineer fix (commit `b0d8d22`) that closed the Turbo-2.x strict-env-strip
  false-green. The env var now reaches the consuming process; `cache:false` prevents a cached
  green from re-masking.
- C-1 deliverable (`C-1-pr-ci-merge.md:118-130`) shows the re-run (CI run `28444194621`, commit
  `b0d8d22`): the 3 integration cases EXECUTED and PASSED (`3 passed (3)`, 48ms/39ms/31ms) against
  the Postgres 16 service — not skipped. `integration_cases_ran_in_ci: true` /
  `integration_cases_passed_in_ci: true` (`C-1:157-158`). Merge commit `dfb65ca` (`C-1:169`).
- Honest reporting: C-1 self-caught the first-run false-green-by-suppression (run `28443884419`,
  integration suite SKIPPED via `describe.skipIf(SKIP)`), classified `configuration`, routed to
  `devops-engineer` per the Iron Law (did NOT fix in-head), and re-verified the cases actually
  ran before merge (`C-1:34-101`). This is the correct discipline — green-by-suppression caught,
  not trusted. **VERIFIED.**

### Claim 4 — positive case proves real txns; mid-txn + first-insert cases prove rollback — VERIFIED

- Positive (`create-server-rollback.spec.ts:136-153`): no fault, asserts the returned shape +
  exactly 1 row in each of the 5 tables → proves a real commit (harness is not a no-op).
- Mid-txn (lines 175-203): throws on INSERT #5 (channels) after server+role+member+category
  inserted → asserts 0 rows everywhere → proves rollback of already-inserted rows.
- First-insert (lines 221-244): throws on the first `servers` INSERT → asserts 0 rows everywhere
  → proves rollback at the earliest insert. Both negative cases satisfy the spec's edge-cases
  (failure-at-first-insert and failure-at-last-insert). **VERIFIED.**

### Claim 5 — antipatterns absent (not claimed-but-fake; prior /review issues fixed; no gold-plating) — VERIFIED

- **Does it pass because rollback really works, or because it asserts nothing / fault never fires?**
  It passes because rollback works. The fault is a thrown error inside the patched real-pool
  `query()` (lines 184/224); it propagates out of drizzle's `transaction()` callback, asserted via
  `rejects.toThrow('channels')` / `rejects.toThrow('"servers"')` (lines 195/234) — so the test
  confirms the fault DID fire (a non-throwing path would fail the `rejects` assertion). The
  countRows=0 checks then prove the real ROLLBACK. Neither "asserts nothing" nor "fault never
  fires" applies.
- **Prior /review issues FIXED:** (a) db Proxy unspyable — the spec does NOT attempt
  `vi.spyOn(dbModule.db, 'transaction')`; it injects at `pool.connect` which IS writable
  (documented `create-server-rollback.spec.ts:36-50`, 166-170). (b) `generateCode` intra-module
  no-op — the spec does NOT spy `generateCode`; the first-insert fault keys on the `servers`
  INSERT SQL text (lines 222-226), module-boundary-agnostic (rationale at lines 213-219). Both
  fixed via `wrapPoolConnect` on the real pool.
- **Gold-plating:** none. Scope is `createServer` only, exactly the wave-7 carry the spec targets.
  The harness is deliberately reusable (`pg-harness.ts:13-14` names task `02fa8011` as the future
  thin consumer) — that is the spec's stated enabler intent, not speculative over-build. No extra
  flows, no unused abstractions. **VERIFIED.**

---

## Reality summary

| # | Claim | Status |
|---|-------|--------|
| 1 | Files exist on main (test + parallel-safe config + base exclude) | VERIFIED |
| 2 | Test is genuinely real (real txn, real-pool mid-txn fault, separate-pool 0-orphan assert, CF-2 redirect) | VERIFIED |
| 3 | Ran + passed 3/3 in CI vs real Postgres (turbo env passthrough; false-green caught + fixed) | VERIFIED |
| 4 | Positive proves real txn; mid-txn + first-insert prove rollback | VERIFIED |
| 5 | No claimed-but-fake; prior /review antipatterns fixed; no gold-plating | VERIFIED |

**No UNVERIFIED, no WRONG claims.** The wave's acceptance criterion — rollback empirically proven
against a real Postgres in CI — is genuinely met. The one defect in flight (Turbo env-strip
false-green) was caught by log inspection, correctly routed (not head-fixed), and re-verified
green before merge.

**Verdict: APPROVE.**
