# B-6 Phase-2 Review — wave-17 (create-server real-PG rollback test + reusable PG harness)

**Scope:** `git diff main...wave-17-create-server-rollback-test` — TEST-INFRA only.
**Mode:** READ-ONLY. Empirically verified findings against the real SUT (`vitest list`, spy/proxy reproduction probes).
**Verdict input:** Critical + High present → **B-6 re-enters (REWORK)**.

Files reviewed:
- `apps/api/test/integration/pg-harness.ts`
- `apps/api/test/integration/create-server-rollback.spec.ts`
- `apps/api/vitest.integration.config.ts`
- `apps/api/package.json`, `apps/api/tsconfig.json`
- CI: `.github/workflows/ci.yml` (`test` job), SUT: `apps/api/src/servers/servers.service.ts`, `apps/api/src/db/index.ts`

---

## CRITICAL

### C1 — Load-bearing rollback test throws at spy-setup; proves nothing (and never passes)
**File:** `create-server-rollback.spec.ts:106` — `vi.spyOn(dbModule.db, 'transaction').mockImplementation(...)`

`db` (`apps/api/src/db/index.ts:30`) is a **get-only Proxy** (only a `get` trap; no `set`/`defineProperty` trap). `vi.spyOn(obj, 'transaction')` reads `Object.getOwnPropertyDescriptor(target, 'transaction')` on the Proxy target (`{}`), which has **no own `transaction` property** because the property is synthesized dynamically by the `get` trap. Vitest therefore throws **`Error: transaction does not exist`** at the `spyOn` line — *before* `createServer` is ever called.

Empirically reproduced with a structurally-identical get-only Proxy under this exact vitest (3.2.6) + CommonJS config:
```
FAIL  proxy spyOn > spyOn on get-only Proxy property
Error: transaction does not exist
 ❯ ...:6  const spy = vi.spyOn(db as any, 'transaction')...
```
The "rolls back ALL rows when channels insert fails mid-txn" test — the wave's central AC — does not exercise a transaction, does not inject a fault, and does not validate ROLLBACK. It errors during setup. The AC is **unverified**. (If the Proxy is ever given a `set` trap to make `spyOn` succeed, the mock would replace the SUT-visible `db.transaction`, so this must be fixed at the test, e.g. spy the resolved drizzle instance / inject a faulting pool client, not the Proxy.)
**Fix direction:** route to backend specialist — wrap a real pool client / tx to throw after N statements through the genuine txn (the P-3 "acceptable alternative"), targeting an object that actually owns the property; do not `spyOn` the get-only Proxy.

---

## HIGH

### H1 — Integration specs run TWICE in CI, the first time WITHOUT the serial-isolation config
**Files:** `package.json:12` (`test:ci`), `vitest.config.ts` (base — no `include`/`exclude` for `test/integration`), `vitest.integration.config.ts`

`test:ci` = `vitest run --reporter=verbose && vitest run --config vitest.integration.config.ts`. The **first** invocation uses the base config, whose default include glob (`**/*.{test,spec}...`) **matches `test/integration/create-server-rollback.spec.ts`**. Verified: with `DATABASE_URL_TEST` set (the CI condition — `ci.yml` sets it job-wide), `vitest list` under the base config returns all 3 integration tests:
```
DATABASE_URL_TEST=... npx vitest list --config vitest.config.ts | grep -c create-server-rollback  → 3
```
Consequences in CI:
1. Integration tests execute under the **base** config = default `fileParallelism: true`, no `singleFork` — i.e. **without** the `fileParallelism:false` / `singleFork:true` isolation the integration config exists to provide.
2. They then run **again** under the integration config (wasteful, and any non-idempotent cross-run state shows up).
3. The base config carries `setupFiles: ['reflect-metadata']`; the integration config does **not** — so the two runs aren't even equivalent.

**Latent escalation:** the moment a second integration spec lands (task 02fa8011, already cited in `pg-harness.ts` header), the base/unit run will execute them **in parallel against the shared CI DB**, letting one file's `TRUNCATE` wipe another's in-flight rows — exactly the non-determinism the integration config was written to prevent, but in the *unmonitored* first run.
**Fix direction:** exclude `test/integration/**` from the base `vitest.config.ts` (`exclude: [...defaults, 'test/integration/**']`), so the unit run skips them and only the integration config runs them.

### H2 — First-insert-collision test cannot trigger the collision; the spy is a no-op
**File:** `create-server-rollback.spec.ts:182` — `vi.spyOn(serversMod, 'generateCode').mockReturnValue(COLLISION_CODE)`

`createServer` calls `generateCode()` as a **bare intra-module reference** (`servers.service.ts:69`), not via a namespace object. Under this CommonJS + esbuild/vitest transform, spying the module export does **not** rebind the internal call. Empirically reproduced — intra-module bare-call spy does not take effect:
```
FAIL  intra-module spy > spy on internal bare call
AssertionError: expected 'REAL' to be 'MOCKED'
```
So `createServer` generates a real ~128-bit random `invite_code`, which will **not** collide with the pre-seeded `COLLISION_CODE`. The servers insert succeeds and the whole txn commits → `await expect(...).rejects.toThrow()` **fails** (promise resolves). The test is broken-by-design (fails, rather than passing-for-wrong-reason — so not Critical-theater, but a non-functional AC). Note also the row-count expectation (`servers == 1`) would then be wrong (two committed servers).
**Fix direction:** force the collision deterministically without the intra-module spy — e.g. pre-seed two servers and exhaust the code space is impractical; instead inject the code via a seam the SUT actually reads, or assert the unique-violation path by other means. Route to backend specialist for the seam.

---

## MEDIUM

### M1 — CF-2 `DATABASE_URL` override has no test-only guard
**File:** `pg-harness.ts:18-21`
The module sets `process.env.DATABASE_URL = process.env.DATABASE_URL_TEST` whenever `DATABASE_URL_TEST` is non-empty, with no `NODE_ENV === 'test'` / vitest-context gate. Currently safe — `nest build` (`sourceRoot: src`, verified) does **not** compile `test/` into `dist`, so the side-effect cannot reach the production runtime; the clobber is confined to any process that imports this module *and* has `DATABASE_URL_TEST` set. Risk is low but the override is broader than "test-only" by construction. Recommend gating on an explicit test signal (e.g. `if (process.env.VITEST && testDbUrl)`), so the redirect can never fire outside a test runner even if the import graph changes.

### M2 — Integration config omits `reflect-metadata` setup
**File:** `vitest.integration.config.ts:27-37` (no `setupFiles`)
Currently fine: the spec instantiates `new ServersService({} as never)` directly, bypassing Nest DI, so no decorator metadata is read at runtime. But the base config deliberately sets `setupFiles: ['reflect-metadata']`; any future integration spec that boots a Nest module / uses DI will fail cryptically here. Add `setupFiles: ['reflect-metadata']` to the integration config for parity.

---

## LOW

### L1 — Duplicate `0004_` migration prefix
**Dir:** `apps/api/drizzle/migrations/` — `0004_gigantic_saracen.sql` and `0004_green_madripoor.sql` (journal idx 3 & 4).
Ordering is preserved by `_journal.json` (drizzle applies by journal, not filename), so `migrate()` is correct and idempotent against the fresh CI DB. Pre-existing (not introduced by this branch), cosmetic, but the colliding prefix invites confusion. No action required for this wave.

### L2 — `harnessDb` is created but unused
**File:** `pg-harness.ts:35,52-53,114` — `harnessDb` (drizzle wrapper) is built in `setupHarness` only to satisfy `migrate()`, then never used elsewhere (truncate/count/fixture all go through raw `harnessPool.query`). Fine, but the dead drizzle handle and its `undefined` reset in teardown are noise; `migrate` could take a throwaway local.

### L3 — `countRows` interpolates the table name
**File:** `pg-harness.ts:101` — `FROM ${table}` (string-interpolated). All call sites pass hardcoded literals, so no injection surface, but a `pg.Identifier`/allowlist would harden the helper as it spreads to more specs.

---

## What is sound (no action)
- **Positive test (test 1) commit-visibility is honest:** `countRows` queries via the separate `harnessPool` connection, not the SUT session — a true cross-connection committed-row check (`pg-harness.ts:95-103`, used at spec `:73-78`).
- **Unit-failure surfacing:** the `&&` chain in `test:ci` plus turbo fan-out means a unit failure yields a non-zero exit and short-circuits the integration run — unit failures DO fail CI (`package.json:12`).
- **Truncate coverage:** explicit child→parent order + `RESTART IDENTITY CASCADE` cleans `messages`/`mentions`/etc. via cascade even though they're not listed (`pg-harness.ts:71-83`).
- **Fixture insert validity:** `users` needs only `id` + `email` (both supplied; rest defaulted/nullable) — `users.ts` schema confirms.
- **No prod-DB reachability / no real creds:** CI uses a `postgres:16` service at `test:test@localhost`; `DATABASE_URL` itself is unset in the `test` job so only the test DB is reachable. Migrate is fail-loud (`pg-harness.ts:53`, no catch) and runs against the ephemeral fresh CI DB.
- **Typecheck clean** with `test/**/*` added to `tsconfig.json` include (`pnpm --filter @studyhall/api typecheck` → exit 0); `test/` does not enter the `dist` build.

---

## Summary
| Severity | Count | IDs |
|---|---|---|
| Critical | 1 | C1 (rollback AC throws at spy-setup — unproven) |
| High | 2 | H1 (integration specs run twice; first run un-isolated + latent parallel-truncate race), H2 (collision spy is a no-op → test fails) |
| Medium | 2 | M1 (CF-2 override ungated), M2 (no reflect-metadata in integration config) |
| Low | 3 | L1 (dup `0004_` prefix), L2 (unused `harnessDb`), L3 (interpolated table name) |

The two headline ACs (mid-txn rollback, first-insert rollback) are **both non-functional** as written (C1, H2): one errors at setup, one fails because the fault is never injected. Combined with the CI double-execution / isolation gap (H1), the harness's isolation guarantees are also not actually in force during the unit run. **B-6 re-enters; route C1/H1/H2 to the backend specialist for the spy-seam + base-config exclude fixes.**

---
---

# B-6 Phase-2 RE-REVIEW (iteration 2) — wave-17 (commit `03542b2`)

**Scope:** `git show 03542b2` — TEST-INFRA only; diff touches exactly two files: `create-server-rollback.spec.ts` (full rewrite of the fault-injection mechanism) + `vitest.config.ts` (base-config `exclude`). 136 insertions / 76 deletions.
**Mode:** READ-ONLY. Findings re-verified against the real SUT + the real drizzle-orm 0.45.2 node-postgres session source.
**Re-review input:** prior C1 + H1 + H2 (1 Critical, 2 High). Real-PG run evidence supplied by backend-developer: Postgres 15.17 spun up, `test:integration` ran all 3 cases GREEN; full `test:ci` = 295 green (292 unit + 3 integration).

## Verdict: all three CLEARED. No new Critical/High introduced.

### C1 — CLEARED (mid-txn rollback now genuinely real)
The spy on the get-only `db` Proxy is gone. The mechanism is now `wrapPoolConnect` (`spec.ts:60-92`), which patches `pool.connect` on the **real** SUT pool — and that pool is provably the one drizzle transacts on:

- **Same pool object.** `db/index.ts:37` exports `getPool as pool`; `getDb()` (`:24-29`) builds the drizzle instance with `drizzle(getPool(), …)`. Both resolve the single module-level `_pool`. So `dbModule.pool()` returns the exact `Pool` drizzle holds. `pool.connect` is a writable own/proto method (no Proxy in the way) — assignment at `:65` takes effect.
- **Real transaction on the patched connection.** Verified against `node_modules/drizzle-orm/node-postgres/session.cjs:215-229`: `transaction()` detects `isPool`, calls `await this.client.connect()` (the patched `pool.connect`), wraps the returned client in a `NodePgSession`, then runs `begin` → callback INSERTs → `commit`/`rollback` **all through that single client's `query`**. The proxy at `spec.ts:73-83` intercepts every `query` call on that client, so the fault fires INSIDE the open, real transaction.
- **Real ROLLBACK.** session.cjs:223-226 `catch` block issues `await tx.execute(sql\`rollback\`)` over the same real connection when the callback throws, then `release()` in `finally`. The interceptor throws on the 5th INSERT (channels) after server+role+member+category are inserted in-txn → real ROLLBACK abandons all four.
- **Real cross-connection no-orphan check.** `countRows` (`pg-harness.ts:100-106`) runs on the SEPARATE `harnessPool`, never the SUT session — a true committed-row visibility check. All 5 tables asserted `== 0` (`spec.ts:198-202`). The reject-matcher keys on `'channels'` (the drizzle `DrizzleQueryError` SQL text), with the count=0 assertions as the load-bearing proof — correctly framed in the comment (`:191-195`).
- **Restore prevents leakage.** `afterEach` (`:114-118`) calls `restorePool?.()` then nulls it, and the restore closure (`:89-91`) reverts `pool.connect = originalConnect`. Because `restorePool` is assigned at the TOP of each test body before any await, an exception anywhere in the test still leaves `restorePool` set, so `afterEach` always restores. No patched `connect` survives into the next test.

### H1 — CLEARED (base config excludes integration)
`vitest.config.ts:11` now sets `exclude: [...configDefaults.exclude, 'test/integration/**']`. The first leg of `test:ci` (`vitest run`, base config) no longer collects `test/integration/**`; the specs run ONLY under `vitest.integration.config.ts` (`include: ['test/integration/**/*.spec.ts']`, `fileParallelism:false`, `pool:'forks'` + `singleFork:true`). Double-execution and the latent parallel-truncate race are both gone. Confirmed only one integration spec exists today (`create-server-rollback.spec.ts`); the exclude is glob-based so it covers task 02fa8011's future spec too.

### H2 — CLEARED (first-insert fault fires a real rollback)
The no-op `vi.spyOn(serversMod, 'generateCode')` is gone. The first-insert test (`:221-244`) uses the same `wrapPoolConnect` seam, throwing on `/^\s*insert\s+into\s+"?servers"?/i` — the very first INSERT in the txn. Per the session.cjs path above, the throw propagates → real ROLLBACK before any row commits. Reject-matcher keys on `'"servers"'`; all 5 tables asserted `== 0`. This is module-boundary-agnostic (fires at the pg connection layer), so the prior intra-module-bare-call problem does not apply.

## New-risk audit (rewrite-introduced) — NONE material

1. **Patched-pool leak across tests on early throw?** No. `restorePool` is set synchronously at the head of each fault test before the first `await`; `afterEach` unconditionally restores + nulls. A throw inside `createServer`, the matcher, or any `countRows` still leaves the restore registered. The positive test (`:136`) never patches, so nothing to leak there.
2. **SQL-substring false-throws on the wrong query?** No. Both interceptors anchor at start (`^\s*insert`). BEGIN/COMMIT/ROLLBACK/SELECT/RETURNING-bearing statements don't match. The rollback test counts only INSERTs and throws on the 5th — createServer issues exactly 5 INSERTs (servers, roles, server_members, categories, channels) in that fixed order, so #5 is deterministically the channels insert. The first-insert test scopes to `insert into "servers"`, immune to the later 4 inserts.
3. **PoolClient / handle leak?** No. The proxy replaces only `client.query`; `client.release()` is untouched, so drizzle's `finally { session.client.release() }` (session.cjs:227) returns the connection to the pool on both success and rollback. `harnessPool` is closed in `afterAll`→`teardownHarness`. No dangling clients.
4. **`callCount`/`insertCount` cross-contamination?** No. `callCount` is per-`connect()`-call closure state; `insertCount` is per-test local. Each test gets a fresh transaction = fresh `connect()` = fresh counter.

## Carried debt (accepted, non-blocking — unchanged by this commit)
| ID | Severity | Item | Disposition |
|---|---|---|---|
| M1 | Medium | CF-2 `DATABASE_URL = DATABASE_URL_TEST` override has no `NODE_ENV`/`VITEST` guard (`pg-harness.ts:18-21`). Currently safe — `nest build` excludes `test/` from `dist`. | Accept; harden later with `if (process.env.VITEST && testDbUrl)`. |
| M2 | Medium | Integration config omits `setupFiles: ['reflect-metadata']` (`vitest.integration.config.ts`). Safe today — spec uses `new ServersService({} as never)`, bypassing Nest DI. | Accept; add for parity before a DI-booting integration spec lands. |
| L1 | Low | Duplicate `0004_` migration prefix in `drizzle/migrations/`. Ordering preserved by `_journal.json`; pre-existing, cosmetic. | Accept. |
| L2 | Low | `harnessDb` built only to satisfy `migrate()`, otherwise unused (`pg-harness.ts:34,54,116`). | Accept; cosmetic. |
| L3 | Low | `countRows` interpolates the table name (`pg-harness.ts:103`). All call sites pass hardcoded literals — no injection surface. | Accept; allowlist if it spreads. |

## Re-review summary
| Severity | Count | IDs |
|---|---|---|
| Critical | 0 | — (C1 CLEARED) |
| High | 0 | — (H1, H2 CLEARED) |
| Medium | 2 | M1, M2 (carried, accepted) |
| Low | 3 | L1, L2, L3 (carried, accepted) |

**B-6 head-of-review verdict: APPROVED.** The prior 1 Critical + 2 High are all genuinely fixed — verified against the SUT wiring and the drizzle node-postgres session source, and corroborated by the backend-developer's real Postgres run (3/3 integration green, 295/295 `test:ci`). The rewrite introduces no new Critical/High. Only accepted Medium/Low debt remains. Wave-17 B-block clears B-6 → proceed to C.
