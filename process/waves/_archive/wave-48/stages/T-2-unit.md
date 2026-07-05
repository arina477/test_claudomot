# T-2 — Unit (wave-48)

**Pattern:** A — Verified-via-CI. Audits the new test's HONESTY (not just its green status).

## Action 1 — CI evidence confirmed
C-1 run 28710662037 `test` job (postgres:16): unit + integration pass GREEN, 1m21s.
611 existing unit specs green; the 2 new integration assertions (a)+(b) green with real-PG timings 60ms/49ms. Integration pass: Test Files 17 passed (17).

## Action 2 — HONESTY audit of the new test (anti-coverage-theater)
Independently re-read `apps/api/test/integration/dm-candidates.spec.ts` (not just the deliverables). The new spec is HONEST, not coverage-theater:

- **Real SUT, no mock:** `sut = new DmService(emitter)` (real class), calls `sut.getDmCandidates(CALLER)`. No stubbed query, no pre-filter, no mock-call-count assertion. Asserts an actual returned VALUE (candidate list membership) — the T-1 unit-honesty rule ("assert a return value/state change, not a mock call count") is satisfied.
- **Positive control present (test a):** `USER_Y_EVERYONE` co-member asserted `toContain` ALONGSIDE `USER_X_NOBODY` asserted `not.toContain`. This is the load-bearing anti-theater guard: the query is proven to return co-members in general while dropping the nobody-user specifically. Without the everyone-control, an empty result for any unrelated reason would false-pass. Self-exclusion (`not.toContain(CALLER)`) also re-asserted.
- **Real disjoint user (test b):** `USER_Z_DISJOINT` owns a genuinely separate `SERVER_T`; caller only in `SERVER_S`. Asserts `not.toContain(Z)` AND `toHaveLength(0)` — exercises the real `inArray(callerServerIds)` scope, not a trivially-empty set.
- **Mutation sanity:** a plausible real bug WOULD fail these. Drop `ne(users.who_can_dm,'nobody')` from the SUT WHERE → test (a) fails (X leaks). Drop `inArray(...)` scope → test (b) fails (Z leaks). Not a delete-only failure.
- **Per-test isolation:** `truncateTables()` in `beforeEach` — no order-dependence, parallel-safe.
- **Loud skip, not silent pass:** `describe.skipIf(SKIP)` + explicit `it.skip('SKIPPED: DATABASE_URL_TEST is not set...')` when no test PG. Never a silent green.

Cross-checked B-6 gate: it verified the SUT query at `apps/api/src/dm/dm.service.ts:704,706` carries exactly `ne(users.who_can_dm,'nobody')` and `inArray(alias.server_id, callerServerIds)` — the two predicates these assertions claim to exercise. Confirmed real.

## Finding
LOW: `who_can_dm='server-members'` (3rd enum value) not exercised at integration — future positive-control candidate. Aggregated. Non-blocking.

```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence:
  - "C-1 test job run 28710662037: 611 unit green + integration 17/17 passed"
  - "dm-candidates (a)+(b) both green, real-PG 60ms/49ms (NOT skipped/0ms)"
  - "honesty audit: real DmService, everyone positive-control, real disjoint user, per-test truncate, loud skip"
findings:
  - {severity: LOW, location: "apps/api/test/integration/dm-candidates.spec.ts", description: "who_can_dm='server-members' not exercised at integration — future positive-control candidate"}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-2
  reviewers: {}
  failed_checks: []
  rationale: >
    The new integration test asserts a real returned value (candidate-list
    membership) against a real DmService and real Postgres — not a mock call
    count. It carries a genuine everyone positive-control and a real disjoint
    user, so it passes the anti-coverage-theater and mutation-sanity bars: a
    plausible real bug (dropping the nobody-filter or the shared-server scope)
    makes it fail. Per-test truncate gives isolation; the skip is loud. CI ran
    it green (60ms/49ms real-PG). One LOW coverage-gap finding (server-members)
    aggregated, non-blocking.
  next_action: PROCEED_TO_T-3
```
