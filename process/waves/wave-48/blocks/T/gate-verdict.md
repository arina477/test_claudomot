# Wave 48 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-48/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1

## Verdict
APPROVED

## Rationale
The single wave deliverable — `apps/api/test/integration/dm-candidates.spec.ts` — is an honest, mutation-sane real-Postgres integration test, not coverage theater. It imports and constructs the real `DmService` (with a real `EventEmitter2`, not a mock) and exercises the genuine `getDmCandidates` query whose WHERE clause (dm.service.ts:702-707) runs `inArray(alias.server_id, callerServerIds)` and `ne(users.who_can_dm,'nobody')` against real rows; the pg-harness CF-2 side-effect import redirects the SUT's lazy db singleton to `DATABASE_URL_TEST` before SUT import, and per-test `truncateTables()` in `beforeEach` gives order-independent isolation. Coverage is adequate and non-thin precisely where the two prior-wave mock no-ops left gaps: case (a) pairs the negative control (`not.toContain(USER_X_NOBODY)`) with a genuine positive control (`toContain(USER_Y_EVERYONE)`), so an empty-result false-pass cannot hide a broken nobody-filter; case (b) uses a real disjoint member Z (owner+member of a server the caller is NOT in) rather than a trivially-empty set, then asserts `toHaveLength(0)` for the shared-server scope. Mutation sanity holds: dropping the nobody-filter fails (a), dropping the server-scope fails (b), and over-filtering fails the positive control. The evidence is solid, not fabricated: C-1 (run 28710662037, job 85143531736) shows both assertions with `✓` markers and 60ms/49ms real-PG round-trip timings (non-zero rules out mock/skip), integration pass `Test Files 17 passed (17)`, and no dm-candidates skip line — the `describe.skipIf` did NOT fire because CI provides `DATABASE_URL_TEST` against `postgres:16`. Skips are legitimately justified: T-5/T-6 (test-only diff, no UI/user-visible change), T-7 (no perf surface), and T-3/T-8 correctly recorded as no-new-contract / no-new-security-surface with the wave-47 T-8 live pen-test reference for the fence itself. The one LOW finding (`who_can_dm='server-members'` not exercised at integration) is correctly non-blocking — a future positive-control extension, not a regression, since that enum value's fence was already unit-covered and pen-tested. No head-tester anti-pattern fires (no coverage theater, no mock-the-SUT, no single-client realtime — none present, no flaky-retry masking with 0 reruns, no fixture coupling).

## Block-exit handoff

```yaml
test_block_status: complete
ready_for_verify: true
stages_run:
  - T-1  # static: lint+typecheck green (C-1 run 28710662037), 0 TS bypasses in diff
  - T-2  # unit: 611 unit + 2 new integration assertions green; new test audited HONEST
  - T-4  # integration: wave deliverable; 2 real-PG negative controls green (60ms/49ms), real DmService + real PG + per-test truncate
  - T-9  # journey: no journey-map delta (Phase 2 skip confirmed on all 3 conditions); block-exit gate
stages_skipped:
  - stage: T-3
    reason: "No new API/SDK contract — GET /dm/candidates unchanged; light-verify."
  - stage: T-5
    reason: "No user-visible behavior change — test-only wave; DM startable flow verified wave-47."
  - stage: T-6
    reason: "No UI change in the diff (test file + backward-compat harness param only)."
  - stage: T-7
    reason: "Test-only wave; no perf-sensitive surface added or changed."
  - stage: T-8
    reason: "No new security surface — privacy fence live pen-tested wave-47 T-8; this wave adds negative regression coverage of it."
findings_total: 1
findings_critical: 0
findings_breakdown:
  low: 1   # who_can_dm='server-members' not exercised at integration — future positive-control follow-up, non-blocking
mutation_sanity: pass   # drop nobody-filter → (a) fails; drop server-scope → (b) fails; over-filter → positive control fails
ci_evidence: "C-1 run 28710662037 job 85143531736: dm-candidates.spec.ts (a)+(b) both ✓ green, 60ms/49ms real-PG, integration pass Test Files 17 passed (17), no skip line"
journey_map_delta: none  # Phase 2 skip confirmed (single-spec, no D-block/design_gap_flag:false, no frontend files in diff); prior wave's canonical map stands
```

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
