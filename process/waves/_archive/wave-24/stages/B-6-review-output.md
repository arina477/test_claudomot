# B-6 Phase-2 Adversarial Review — wave-24 (real-PG integration tier)

**Reviewer:** code-reviewer (adversarial)
**Diff:** `origin/main...wave-24-integration-tier` — TEST-ONLY (all files under `apps/api/test/integration/`, zero production code touched)
**Files reviewed:** `pg-harness.ts` (+3 fixture helpers +`RolePerms`), `presence-comembers.spec.ts`, `servers-member-gate.spec.ts`, `rbac-assignments-authz.spec.ts`
**Cross-referenced SUT:** `presence.service.ts`, `rbac.service.ts`, `servers.service.ts:222-253`, `db/index.ts`, `db/schema/servers.ts` + `users.ts`, `vitest.integration.config.ts`, `vitest.config.ts`, `turbo.json`, `.github/workflows/ci.yml`, migration `0011`.

## Verdict: APPROVED — genuine, well-asserted real-DB integration tests.

No Critical. No High. The core claim of the wave — that these are REAL, not mock-dressed — holds under adversarial inspection. Details per focus area below, then Low/cosmetic list.

---

## Focus-area findings

### 1. Coverage theater / weak assertions — PASS (one Low)
Every spec asserts on the actual returned rows and pins the *specific* claimed behavior, not just "did not throw":

- **presence — co-member set:** `getCoMemberUserIds(USER_A)` asserted `toHaveLength(1)` + `toContain(USER_B)` + `not.toContain(USER_A)` (self-exclusion) + `not.toContain(USER_C)` (non-co-member exclusion). This would FAIL if the SUT stopped excluding self, leaked cross-server members, or returned the wrong set. Genuine. (`presence-comembers.spec.ts:95-98`)
- **presence — empty path:** zero-membership user → `toHaveLength(0)`, exercising the real `serverIds.length === 0` early return. Genuine. (`:112`)
- **rbac — owner:** all 6 fields (`owner` + 5 flags) asserted `true` — pins the superuser short-circuit. (`:96-101`)
- **rbac — member with manage_assignments role:** asserts `manage_assignments===true` AND the other four flags `===false` (`:109-116`). Because the fixture role is inserted with ONLY `manage_assignments:true`, this would FAIL if the SUT mis-mapped columns or returned an all-true/all-false blob. This is the load-bearing wave-23 assertion and it is real.
- **rbac — member no role:** all 5 flags + `owner` asserted false (null-role branch). (`:123-128`)
- **rbac — non-member:** `rejects.toBeInstanceOf(ForbiddenException)` — asserts the exception *class*, not a string. (`:134`)
- **rbac — `can()`:** true for role-holder, false for no-role member — pins `role[permission]===true` vs default-deny. (`:150,158`)
- **servers member gate — positive:** roster `toContain(OWNER_ID)` + `toContain(MEMBER_ID)` + per-row type/shape checks. (`:82-90`)
- **servers member gate — negative:** non-member → `rejects.toBeInstanceOf(ForbiddenException)` (real 403 class). (`:103-105`)

**LOW-1** — `servers-member-gate.spec.ts:81-84` (positive path) asserts `toContain` for the two members but never asserts roster `length === 2`. A bug that leaked extra rows into the roster would not be caught here. Low only because the innerJoin is scoped `WHERE server_id = SERVER_ID` and the truncated DB contains no other members of that server, so there is nothing to leak in the current fixture. Adding `expect(roster).toHaveLength(2)` would harden it.

### 2. Mock-the-SUT — PASS (verified independently)
The DB is genuinely real. `db/index.ts` exports a lazy `Proxy` that resolves a real `pg.Pool` from `process.env.DATABASE_URL` on first property access. `pg-harness.ts:17-21` sets `process.env.DATABASE_URL = DATABASE_URL_TEST` at module-eval time, and every spec's FIRST import is `import './pg-harness'` (side-effect) BEFORE the SUT import — so the proxy resolves to the test DB. The SUT services (`PresenceService`, `RbacService`, `ServersService`) import the same `db` singleton and are instantiated with `new` (no injected/stubbed repo). The only stub is `ServersService`'s unused `rbacService` constructor arg (`servers-member-gate.spec.ts:49`) — and `listServerMembers` provably never calls it (confirmed at `servers.service.ts:222-253`). No query under test is stubbed. Head-builder Phase-1's "real" claim is confirmed.

### 3. SQL / fixture correctness — PASS
All 3 new helpers are fully parameterized (`$1..$n` placeholders, values array) — no string interpolation, no injection surface. Column correctness verified against `db/schema/servers.ts`:
- `insertFixtureServer` — inserts `(id, name, owner_id)`, omits `invite_code` (nullable `.unique()`, defaults NULL; multiple NULLs are legal under a UNIQUE column). Correct.
- `insertFixtureRole` — inserts all 5 RBAC booleans incl. `manage_assignments` + `position=0` + `is_default=false`. The `manage_assignments: true` fixture maps to the exact column the SUT reads. Correct, and migration `0011` confirms the column exists.
- `insertFixtureMembership` — inserts `(server_id, user_id, role_id)`, `role_id` nullable per schema (`.references(...onDelete:'set null')`). Correct.
- `ON CONFLICT DO NOTHING` (no target) — swallows only unique-constraint conflicts, NOT FK violations. Since `truncateTables()` runs in every `beforeEach`, no conflicts occur, so DO NOTHING is a harmless no-op safety net. It would NOT mask an FK error (those still throw and fail-loud). Sound.
- `countRows` interpolates `table` into SQL (`pg-harness.ts:188`) — the only non-parameterized query. Table names cannot be parameters in SQL, so this is unavoidable; callers pass only hardcoded literals. Noted as LOW-2 (defense-in-depth) — not exploitable here.

### 4. Test isolation — PASS (Gemini P-4 concern verified NOT material at code level)
- `truncateTables()` runs in every `beforeEach` (`TRUNCATE ... RESTART IDENTITY CASCADE`) — clean state per case within each file.
- Cross-file safety: `vitest.integration.config.ts` sets `fileParallelism: false` + `pool:'forks'` with `singleFork:true`, and `vitest.config.ts` EXCLUDES `test/integration/**` from the default (parallel) run. This closes the exact race Gemini flagged (one file's TRUNCATE wiping another file's in-flight rows): the three integration specs run serially in one worker. Confirmed material-safe.
- Fixture-ID collision across the 3 specs: server IDs are disjoint (`0000...`, `1000...`, `2000...`) and user IDs are prefixed per-domain (`presence-*`, `gate-*`, `rbac-*`). Even without the disjointness, serial execution + per-case truncate makes collision impossible. No shared-ID bleed.

### 5. False-green — PASS (the critical check)
- No `.only`, no stray `describe.skip`/`it.skip` inside the active suites, no 0-assertion tests. The only `it.skip` is the deliberate labeled skip-with-reason emitted ONLY when `DATABASE_URL_TEST` is unset (`presence:120`, `gate:112`, `rbac:166`) — a visible skip, not a silent pass.
- **CI actually runs them:** `.github/workflows/ci.yml` `test` job provisions a `postgres:16` service and sets `DATABASE_URL_TEST=postgres://test:test@localhost:5432/studyhall_test`, then runs `pnpm test:ci`. Root `test:ci` → `turbo run test:ci` → apps/api `test:ci` = `vitest run … && vitest run --config vitest.integration.config.ts`. `turbo.json` declares `env:["DATABASE_URL_TEST"]` on the `test:ci` task so the var is passed through (not stripped by strict env mode). Therefore in CI `SKIP` is false and the specs execute for real — no false-green. The skip path only fires on a local machine without a test DB, which is the intended, clearly-messaged behavior.
- `setupHarness()` throws loudly if called with `DATABASE_URL_TEST` unset (`pg-harness.ts:46-51`), and `migrate()` fails loud on schema drift — the harness cannot silently "pass" against a missing/empty DB.

### 6. Flake risk — PASS
- **Ordering:** the one order-sensitive result (`getCoMemberUserIds`, which builds a `Set` with nondeterministic iteration order) is asserted with `toContain`/`toHaveLength` set-semantics, never array-equality. No order flake. (`presence:95-98`)
- **Determinism:** all fixture IDs are hardcoded literals; no generated UUIDs or timestamps are asserted on. `RESTART IDENTITY` resets sequences per case. No wall-clock/uuid nondeterminism in any assertion.

---

## Low / cosmetic (non-blocking)
- **LOW-1** — `servers-member-gate.spec.ts:81` positive path lacks a `roster.length === 2` assertion (see §1). Suggest hardening.
- **LOW-2** — `pg-harness.ts:188` `countRows` interpolates the table name (unavoidable for identifiers; callers pass only literals). `countRows` is also currently unused by the three new specs — dead-ish helper. Consider a whitelist or removing if unused.
- **LOW-3** — `teardownHarness()` closes only `harnessPool`, never the SUT's lazily-created `_pool` (`db/index.ts`). Leaves one open PG handle at process exit; harmless under `forks` teardown but could surface as an "open handle" warning. Cosmetic.
- **LOW-4** — `harnessDb` is built (`pg-harness.ts:54`) solely to run `migrate()`; it is otherwise unused. Minor.
- **LOW-5** — Comments in specs reference exact SUT line numbers (e.g. "member-gate at servers.service.ts:232", "rbac.service.ts:278"); these drift as source changes. Prefer method-name references. Cosmetic.

## Per-spec genuineness statement
- `presence-comembers.spec.ts` — **GENUINE.** Real DB round-trip through `getServerIdsForUser` + `inArray`; asserts exact co-member set with self/non-co-member exclusion and empty-path edge.
- `servers-member-gate.spec.ts` — **GENUINE.** Real member-gate SELECT + innerJoin roster; positive roster + real `ForbiddenException` on non-member. (Harden with a length assertion — LOW-1.)
- `rbac-assignments-authz.spec.ts` — **GENUINE and strong.** All 4 `getEffectivePermissions` branches + 2 `can()` sub-cases against real rows; the manage_assignments flag is pinned exactly (true in isolation, others false), which is the wave's load-bearing assertion (closes F23-T-4).

**Gate recommendation: APPROVED.** No rework required to pass B-6. LOW-1 optional hardening is the only substantive suggestion.
