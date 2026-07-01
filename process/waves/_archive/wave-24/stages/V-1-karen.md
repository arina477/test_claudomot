# V-1 Karen — source-claim verification (wave-24, real-PG integration test tier)

**Verifier:** karen (V-1 Review, adversarial source-claim)
**Merged state:** `main @ 149a081` (PR#36, squash) · seed `02fa8011` · TEST-ONLY wave
**Method:** read the 3 merged specs + harness + SUT signatures + turbo.json + CI log evidence (C-1 deliverable). $CLAUDOMAT_DB_URL = brain control-plane; spec runtime verified via code + the C-1 `test`-job-log evidence (job 84471001038, run 28498812550), not re-run here.

## Verdict: **APPROVE**

Every load-bearing claim is VERIFIED. The 3 specs exist on main, construct the REAL services against the real DB singleton (not mocks), assert on returned rows / thrown `ForbiddenException`, the rbac spec closes F23-T-4 (non-member→403 branch present), and the C-1 CI log confirms they EXECUTED (2+2+6 passed, 0 skips) — no false-green. Diff is test-only. No blocking findings.

---

## Per-claim

### Claim 1 — 3 new integration specs EXIST + import harness + construct REAL SUT — **VERIFIED**
All three present on main and constructed with `new` against the real service (no mock db):
- `presence-comembers.spec.ts:14,26,54` — `import './pg-harness'` (side-effect FIRST) → `new PresenceService()`.
- `servers-member-gate.spec.ts:13,26,49` — harness-first → `new ServersService({} as never)` (unused rbac stub; `listServerMembers` provably never calls it — `servers.service.ts:223-246`).
- `rbac-assignments-authz.spec.ts:13,27,54` — harness-first → `new RbacService()`.

The realness mechanism is genuine: `pg-harness.ts:17-21` sets `process.env.DATABASE_URL = DATABASE_URL_TEST` at module-eval, and each spec imports `./pg-harness` as its FIRST import before the SUT — so the lazy db proxy resolves to the test DB. SUT method signatures match the spec calls: `PresenceService.getCoMemberUserIds` (`presence.service.ts:119`), `ServersService.listServerMembers` (`servers.service.ts:223`), `RbacService.getEffectivePermissions` (`rbac.service.ts:278`) + `can` (`:52`).

### Claim 2 — Harness extended with 3 fixture helpers + truncate coverage, no phantom table — **VERIFIED**
`pg-harness.ts`:
- `insertFixtureServer` (`:117`), `insertFixtureRole` (`:135`, all 5 RBAC booleans incl `manage_assignments`), `insertFixtureMembership` (`:167`, nullable `role_id`) — all fully parameterized (`$1..$n`), no interpolation.
- `truncateTables` (`:65-81`) covers `server_members`, `roles`, `servers`, `users` (plus channels/categories/invites/overrides) `RESTART IDENTITY CASCADE`.
- **No phantom `assignment*` table.** The P-3 plan mentioned extending truncate to `assignment*` (idempotent), but the harness correctly OMITS it — none of the 3 specs touch the real `assignments` schema (`apps/api/src/db/schema/assignments.ts` exists but is out of scope here). Dropping the unneeded truncate target is correct, not a gap. VERIFIED with a note: plan/impl divergence is benign (thinner than planned, not missing anything the specs need).

### Claim 3 — Real-DB round-trips (not mock-the-SUT) + rbac non-member→403 closes F23-T-4 — **VERIFIED**
Each spec inserts fixtures via the harness, runs the real service, asserts on returned rows / thrown exception:
- presence: `getCoMemberUserIds(USER_A)` → `toHaveLength(1)` + `toContain(USER_B)` + `not.toContain(USER_A)` (self-excl) + `not.toContain(USER_C)` (cross-server excl) (`:95-98`); empty-membership → `toHaveLength(0)` (`:112`).
- member-gate: member → roster `toContain(OWNER_ID/MEMBER_ID)` + per-row shape (`:82-90`); non-member → `rejects.toBeInstanceOf(ForbiddenException)` (`:103`).
- rbac: owner all-6-true (`:96-101`), member-with-role `manage_assignments===true` AND other 4 `===false` (`:109-116` — pins column mapping, the load-bearing wave-23 assertion), no-role all-false (`:123-128`), **non-member → `ForbiddenException` (`:134`)** + `can()` allow/deny (`:150,158`). The non-member 403 branch is present and asserts the exception CLASS → **F23-T-4 closed** (matches spec AC3 + the merged commit message).

### Claim 4 — EXECUTED in CI, not false-green (the load-bearing guard) — **VERIFIED**
C-1 deliverable (`C-1-pr-ci-merge.md:31-37,62-68`) records direct `test`-job LOG evidence (job id 84471001038, run 28498812550): integration config reported **"Test Files 4 passed (4)"** — presence 2 + member-gate 2 + rbac-authz 6 + wave-17 rollback 3 — **zero test skips** (only benign "resolution step is skipped" install line). `turbo.json:27` carries `"env": ["DATABASE_URL_TEST"]` on `test:ci` (the wave-17 passthrough fix) so strict-env does not strip the URL and silently skip the tier. The `SKIP` guard (`!process.env.DATABASE_URL_TEST`) is false in CI (postgres:16 service + var set), so `describe.skipIf` runs the real suites. Fail-loud on missing DB is real: `setupHarness` throws (`pg-harness.ts:46-51`) and `migrate()` fails on drift. T-4 (`T-4-integration.md:15-21`) records `integration_tier_executed: true`, `skipped: false`. This is NOT a false-green.

### Claim 5 — No production code touched — **VERIFIED**
`git diff 149a081~1..149a081 --name-only` filtered for `package.json|drizzle/migrations|apps/api/src/|apps/web/` → **NONE**. Diff is exclusively `apps/api/test/integration/*` (harness + 3 specs, +489/-7) plus `process/waves/wave-24/*` docs. No migration, no dependency, no runtime source.

### Claim 6 — Antipatterns — **NONE material**
- **Coverage theater:** none. Every assertion pins specific claimed behavior and would fail on a broken SUT (self-exclusion, cross-server isolation, exact flag mapping, real `ForbiddenException` class). Confirmed by adversarial B-6 review (`B-6-review-output.md:16-29`).
- **Claimed-but-not-built:** none — all 3 specs + helpers present and merged.
- **Deferred-but-undocumented:** none. Reminders arc correctly OUT of scope (cred-blocked, escalated) per spec `## Out of scope` + P-3 plan.

## Non-blocking (carried, do not gate — matches B-6 LOW list)
- **LOW-1** `servers-member-gate.spec.ts:81` positive path lacks `roster.toHaveLength(2)` — leak of extra roster rows would go uncaught (unlikely: innerJoin scoped `WHERE server_id=?` on a truncated DB). Optional hardening.
- **LOW-5** spec comments cite exact SUT line numbers (`servers.service.ts:232/:244`, `rbac.service.ts:278`) — verified accurate at merge (gate at `:232`, innerJoin at `:244`, getEffectivePermissions at `:278`) but will drift; prefer method-name refs. Cosmetic.

```yaml
karen_verdict: APPROVE
wave: 24
merged_sha: "149a081"
per_claim:
  spec_1_exist_real_sut: VERIFIED
  spec_2_harness_extended_no_phantom_table: VERIFIED
  spec_3_real_db_roundtrip_closes_F23-T-4: VERIFIED
  spec_4_executed_in_ci_not_false_green: VERIFIED
  spec_5_no_production_code: VERIFIED
  spec_6_no_antipatterns: VERIFIED
load_bearing_all_held: true
blocking_findings: []
non_blocking: ["LOW-1 roster length assertion", "LOW-5 line-number comment drift"]
```
