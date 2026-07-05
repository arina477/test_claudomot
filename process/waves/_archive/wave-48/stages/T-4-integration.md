# T-4 — Integration (wave-48)

**Pattern:** A — Verified-via-CI. THIS is the wave's core layer — the wave's deliverable IS the integration test.

## Action 1 — Pattern determination
`.github/workflows/ci.yml` provisions a `postgres:16` service and sets `DATABASE_URL_TEST` on the `test` job, which runs the integration pass (`vitest run --config vitest.integration.config.ts`, `include: test/integration/**/*.spec.ts`). CI covers integration → **Pattern A**. (Locally all 17 integration specs skip — no test PG in this env — so re-running here would prove nothing; CI is authoritative per Pattern A.)

## Action 2 — CI evidence (C-1 verdict_evidence)
Test-job log run 28710662037, job 85143531736:
```
✓ dm-candidates.spec.ts > ... > (a) excludes a co-member whose who_can_dm is "nobody"; includes the control everyone-user 60ms
✓ dm-candidates.spec.ts > ... > (b) does not expose a user who shares no server with the caller 49ms
```
- `✓` pass marker (NOT `↓` skip). Non-zero ms (60/49) = real Postgres round-trips, not mock/skip 0ms.
- Grep for any dm-candidates skip line in the log: NONE. The `SKIPPED: DATABASE_URL_TEST is not set` branch did not fire.
- Integration pass summary: Test Files 17 passed (17).

## Action 4 — Boundary coverage trace
The ONLY boundary this wave touches: `DmService.getDmCandidates(callerId)` → real Postgres query at `apps/api/src/dm/dm.service.ts:704,706`.

| Boundary | Predicate | Exercised by | Real-DB? |
|---|---|---|---|
| who_can_dm='nobody' exclusion | `ne(users.who_can_dm,'nobody')` (line 706) | test (a): X(nobody) excluded, Y(everyone) included | YES — 60ms real PG |
| shared-server scope | `inArray(alias.server_id, callerServerIds)` (line 704) | test (b): Z(disjoint server) excluded, len 0 | YES — 49ms real PG |
| self-exclusion | (caller not returned) | test (a): `not.toContain(CALLER)` | YES |

- **Real-Postgres + per-test rollback discipline (test-writing §26):** the harness applies real Drizzle migrations (`migrate(..., MIGRATIONS_DIR)`) and `truncateTables()` runs in `beforeEach` — real DB, per-test isolation, NOT mocked. Satisfies the "never mock the system under test" and per-test-isolation rules.
- **Positive control alongside negative:** test (a) proves the query returns co-members generally (everyone-user included) while dropping the nobody-user — the counter-example the wave-46/47 mock no-ops never proved live. This is the wave's entire value and it is now CI-proven.
- No new schema (no B-0 migration), no new service, no new route → the query is the sole boundary and it is covered.

## Finding
LOW (aggregated): who_can_dm='server-members' enum value not exercised at integration — future positive-control candidate. Non-blocking.

```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited:
  - "DmService.getDmCandidates — ne(who_can_dm,'nobody') predicate (dm.service.ts:706)"
  - "DmService.getDmCandidates — inArray(callerServerIds) shared-server scope (dm.service.ts:704)"
  - "DmService.getDmCandidates — self-exclusion"
ci_evidence:
  - "C-1 run 28710662037 job 85143531736: (a) 60ms green + (b) 49ms green, real-PG, NOT skipped"
  - "integration pass Test Files 17 passed (17)"
  - "harness applies real Drizzle migrations + truncateTables() per-test (real DB, isolated, unmocked)"
active_run_output: ""
infrastructure_gap_recorded: false
findings:
  - {severity: LOW, boundary: "getDmCandidates who_can_dm='server-members'", description: "3rd enum value not exercised at integration — future positive-control candidate"}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-4
  reviewers: {}
  failed_checks: []
  rationale: >
    The wave's single service boundary — getDmCandidates' nobody-filter and
    shared-server scope — is exercised against a REAL Postgres (harness applies
    real migrations, truncates per test; not mocked), and both negative controls
    ran green in CI with real-DB timings (60ms/49ms), NOT skipped. Test (a)
    carries a genuine everyone positive-control so the exclusion is proven
    specific, not incidental; test (b) uses a real disjoint user proving the
    inArray scope. This closes the mock-no-op counter-example gap from
    wave-46/47. Real-Postgres + per-test-isolation discipline satisfied. One LOW
    coverage-gap finding aggregated. Every applicable T-4 check ticks.
  next_action: PROCEED_TO_T-5
```
