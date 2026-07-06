# V-3 Gate Verdict — wave-56 (defensive LIMIT on getDmCandidates)

**head-verifier — independent V-block gate. Verdict: APPROVED.**

Task c5051444 — bound the previously-unbounded `getDmCandidates` Drizzle query with a defensive `.limit()`, injectable via an optional param defaulting to `DM_CANDIDATES_LIMIT = 500`. Shipped at `efc1a47` (on `main`, ancestor of HEAD), PR #71. Reviewers Karen + jenny both APPROVE, 0 findings; V-2 triage empty. This verdict does not rubber-stamp that — every load-bearing claim was re-checked against the deployed tree and the executed CI run.

## Independent verification (not delegated re-read — spot-checked from source)

- **`.limit()` bites at the DB, after orderBy.** `git show efc1a47 -- dm.service.ts`: the diff appends `.limit(limit)` immediately after `.orderBy(users.id, asc(users.display_name))` on the DISTINCT-ON co-member query, before the in-memory `.sort()`. It is a real Drizzle query LIMIT, not a post-fetch `.slice()` no-op. **Confirmed.**
- **Injectable param + exported const.** `getDmCandidates(callerId, limit: number = DM_CANDIDATES_LIMIT)`; `export const DM_CANDIDATES_LIMIT = 500`. **Confirmed in the diff.**
- **Controller genuinely unchanged.** `git show efc1a47 -- dm.controller.ts` returns empty (not in the commit). As-shipped call site is `this.dmService.getDmCandidates(callerId)` — no 2nd arg → production path uses the 500 default. **Confirmed.**
- **Case (d) is non-vacuous.** As-shipped test: 3 eligible co-members (`who_can_dm='everyone'`), injected cap=2 → `expect(length).toBeLessThanOrEqual(2)` AND `> 0`; default-cap leg asserts `toHaveLength(3)`. Absent `.limit()` the DB returns 3 and the ≤2 assertion fails. Genuine bite. **Confirmed.**
- **Cap enforced in the DEPLOYED/CI-real-Postgres state (not acceptance-by-assertion).** CI run `28763433748` `conclusion=success`; integration layer ran with `DATABASE_URL_TEST` set (real Postgres, `vitest.integration.config.ts`); case (d) line `✓ (d) injected cap of 2 truncates 3 eligible co-members; default cap leaves all 3 intact 69ms` present in the log — executed, not skipped, alongside privacy-fence controls (a)/(b)/(c) all green. 729 integration tests passed. **Confirmed.**
- **No schema/migration.** `efc1a47 --stat`: only production files touched are `dm.service.ts` (+14) and `dm-candidates.spec.ts` (+54); remainder is wave-55 archive moves + wave-56 process docs + product-decisions. **Confirmed.**
- **Deploy live serves the merge.** `GET /health` → `200 {"status":"ok","service":"studyhall-api"}`; `git merge-base --is-ancestor efc1a47 HEAD` true. **Confirmed.**

## Judge questions answered

1. **Karen + jenny APPROVE (0 each) — sound, not rubber-stamp.** A "no findings" verdict on a genuinely trivial change (1 exported const + 1 optional param + 1 `.limit()` call, controller untouched, DTO/predicate untouched) is proportionate — the false-negative-probe requirement applies to *non-trivial* clean verdicts, and this change's entire production footprint is 3 lines. I still spot-checked all four load-bearing claims from source rather than accept at face value; all hold. Sound.
2. **V-2 empty triage correct.** The only Low (biting-cap truncation *order* — which rows survive under `> CAP` truncation, i.e. ranking-under-truncation) is genuine deferred product scope, not a suppressed defect: it is folded into the deferred AC-B seed 999a14d1 (cursor/pagination + ranking wave), consistent with the P-0 reframe and the spec edge-case note ("> CAP eligible: at most CAP returned; ranking deferred"). At StudyHall's zero-user / << 500 co-member scale this order never manifests. Correct disposition — accepted-debt-with-owner, not green-by-suppression.
3. **Acceptance-by-assertion — cleared.** The cap is a real DB LIMIT proven to fire in the CI real-Postgres run (case d, 69ms, executed not skipped), and the deployed artifact serves that exact commit. "Done" here means the ACs are demonstrably met against real Postgres, not merely that code exists / the suite is green.
4. **Green-by-suppression — none.** No test weakened, no assertion loosened, no check disabled. The change *adds* a non-vacuous test that fails without the fix; the privacy-fence controls (a)/(b)/(c) remain and stay green; the WHERE predicate (`ne(who_can_dm,'nobody')`) is byte-identical on the untouched side of the diff.

Fast-fix queue empty → V-3 Phase 2 (fix loop) correctly skipped; no iteration bound consumed.

```yaml
head_signoff:
  verdict: APPROVED
  stage: V-3
  reviewers: { karen: APPROVE, jenny: APPROVE }
  failed_checks: []
  independent_checks:
    limit_after_orderby_db_level: PASS
    injectable_param_default_500: PASS
    controller_unchanged_default_path: PASS
    case_d_non_vacuous: PASS
    case_d_executed_ci_real_postgres: PASS   # run 28763433748, 69ms, not skipped
    no_schema_migration: PASS
    deploy_serves_efc1a47: PASS
    triage_honest_no_suppression: PASS
    deferred_low_owned_by_999a14d1: PASS
  rationale: >
    Every load-bearing claim from Karen and jenny re-verified independently against the
    deployed tree (efc1a47, on main, ancestor of HEAD) and the executed CI run 28763433748.
    The cap is a genuine DB-level Drizzle .limit() applied after orderBy / before the in-memory
    sort, controller unchanged so production uses the 500 default, and case (d) is a non-vacuous
    bite that passed against real Postgres (69ms, not skipped). Empty V-2 triage is honest —
    the single pre-existing Low (ranking-under-truncation order) is genuine deferred product
    scope owned by seed 999a14d1, not a suppressed blocking defect at zero-user scale. No
    green-by-suppression, no acceptance-by-assertion, no spec drift (pure row-count bound over
    an untouched privacy fence). Cap genuinely shipped + triage honest.
  next_action: PROCEED_TO_L_BLOCK
```
