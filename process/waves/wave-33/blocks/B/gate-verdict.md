# Wave 33 — B-6 Gate Verdict

**Gate:** B-6 Review (block-exit)
**Head:** head-builder (fresh spawn)
**Wave:** malformed-UUID route param → 400 (global 22P02→BadRequest via `.cause` walk)
**Task:** a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354
**Branch:** wave-33-uuid-param-validation
**Date:** 2026-07-02

---

## Verdict: APPROVED

The fix is real, root-cause-shaped, bounded, and the real-DB negative-path proof genuinely runs in CI (not a decorative skip). No critical issues. Hand off to C-block.

---

## Heuristic gate (independent, code-verified)

### 1. Negative-path reproduction (BUILD-PRINCIPLES rule 4, LOAD-BEARING) — PASS
The integration spec `apps/api/test/integration/malformed-uuid-params.spec.ts` **genuinely reproduces** SQLSTATE 22P02, not code-read:
- Part A calls `rbacService.canViewChannelById(FIXTURE_USER_ID, 'junk' | 'not-a-uuid' | '123' | 'abc-def')` against a REAL Postgres — the `WHERE channels.id = $1` (uuid column) cast fires 22P02 from the driver. Asserts `isInvalidTextRepresentation(caught) === true` on the actual thrown Drizzle error (proves the `.cause` wrapping shape empirically).
- Part B feeds that same real error to `SupertokensExceptionFilter.catch` → asserts status 400, body `{statusCode:400, message:'Bad Request'}`, and that the body leaks no `22P02` / `invalid input syntax` / `stack` / `channels` / `DrizzleQueryError`.
- Regression guards present: valid-nonexistent UUID (`ffffffff-…`) does NOT throw 22P02 (returns default-deny false) — AC6; valid existing channel never throws a cast error — AC6.
- Auth boundary (AC7): dev-smoke live-confirmed unauth-malformed `GET /channels/not-a-uuid/voice/participants` → 401 (guard-first, not 500); filter-spec proves HttpException forwarding precedes the 22P02 branch.

**CRITICAL — does it RUN in CI?** YES, verified in `.github/workflows/ci.yml`:
- `test` job provisions `postgres:16` service (db `studyhall_test`) and sets **job-level** `env: DATABASE_URL_TEST: postgres://test:test@localhost:5432/studyhall_test`.
- runs `pnpm test:ci` → `apps/api` `test:ci` = `vitest run … && vitest run --config vitest.integration.config.ts` (integration config includes `test/integration/**/*.spec.ts`).
- `SKIP = !process.env.DATABASE_URL_TEST` is therefore FALSE in CI → the `describe.skipIf(SKIP)` block RUNS.
- `pg-harness.setupHarness()` is fail-loud: throws if `DATABASE_URL_TEST` unset, and applies real drizzle migrations before the suite. A silent all-skip in CI is not possible.
The jenny/head-product real-DB requirement is satisfied and wired. NOT a REWORK.

### 2. Attempt-1 defect (TypeORM error shape) truly fixed — PASS
`grep` across `apps/api/src` + `test` for `QueryFailedError` / `typeorm` / `@Catch(Query` → **NONE**. The `.cause` walk in `pg-error-utils.ts:33-48` byte-mirrors the shipped `isUniqueViolation` at `users.service.ts:23-38` (direct `.code`, `.cause.code`, `.cause.cause.code`; different SQLSTATE constant `22P02`). Correct for the Drizzle+node-postgres wrapping stack.

### 3. Filter ordering — PASS
`auth.exception.filter.ts`: (1) `headersSent` guard returns first (SuperTokens SDK already sent 401/403); (2) `instanceof HttpException` forwards app 400/401/403/404 unchanged; (3) THEN `isInvalidTextRepresentation` → 400; (4) else generic 500. A raw DrizzleQueryError-22P02 is never an HttpException, so it reaches the 400 branch — not swallowed, not fallen to 500. Single parameterless `@Catch()`; registered once at `main.ts:120` (`useGlobalFilters(new SupertokensExceptionFilter())`). No catch-all collision.

### 4. Clean body — PASS
400 body is `{statusCode:400, message:'Bad Request'}` — no stack/SQL/DB/driver detail. Explicitly asserted negative in the integration spec.

### 5. Scope / gold-plating — PASS
Bounded: `pg-error-utils.ts` (48 LOC) + `auth.exception.filter.ts` (+28 LOC) + 2 test files. No 30-param manual sweep, no ValidationPipe rollout, no broad error-normalization/envelope refactor. Matches P-4-APPROVED attempt-2 scope and the spec `keep-out` list. code-quality: no over-engineering.

### 6. Deviations — PASS
B-2 reports `Deviations: none` (PREFERRED path (a), no 2nd catch-all). Confirmed against the diff.

---

## Diff surface (verified)
- `apps/api/src/auth/pg-error-utils.ts` (new, 48)
- `apps/api/src/auth/auth.exception.filter.ts` (+28)
- `apps/api/src/auth/auth.exception.filter.spec.ts` (new, 226 — 18 unit)
- `apps/api/test/integration/malformed-uuid-params.spec.ts` (new, 251 — 10 real-DB)
- deliverables + checklist only. No schema, no deps, no env vars.

## Verify signals (B-5, spot-confirmed)
- api unit 467/467 green (449 + 18 new). typecheck/lint/build clean.
- integration 10 tests: run in CI Postgres 16 (evidence above), skip locally only.
- dev-smoke: unauth-malformed → 401 (AC7 live).

---

## Carries forward to C-block / N-block

1. **C-1/T-8 carry — DISCHARGED at this gate but must remain a CI-green gate:** the real-DB integration suite MUST show as RUN (not 0-skipped) in the `test` job of the PR's CI run. head-ci-cd: confirm the `test` job passes with the integration file executed (verbose reporter surfaces the case names). If CI ever reports the suite as skipped, that is a false-green — hold the merge.
2. **N-block park-or-key flag — MANDATORY (carried from ceo-reviewer):** after this wave ships, ZERO credential-independent M6 (LiveKit voice) work remains. The wave-33 N-block MUST treat the LiveKit park-or-key decision as the next move (park M6 + pivot to a fully-buildable milestone, OR hold for keys) — NOT another credential-blocked voice wave.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers:
    node-specialist: implemented (B-2)
    head-builder: gate (independent code+CI verification)
  failed_checks: []
  rationale: >-
    Single-spec under-floor fix, root-cause-shaped and bounded. Malformed non-UUID
    route param → 400 via one global mechanism: isInvalidTextRepresentation walks
    err.cause chain for SQLSTATE 22P02 (byte-mirroring the shipped 23505 isUniqueViolation),
    mapped in SupertokensExceptionFilter AFTER HttpException-forward and BEFORE generic-500,
    single parameterless @Catch registered once at main.ts:120. The attempt-1 TypeORM
    error-shape defect is fully removed (no QueryFailedError survivors). The LOAD-BEARING
    negative path is genuinely reproduced against real Postgres — the integration suite
    fires actual 22P02 through canViewChannelById and asserts the filter → 400 clean body,
    with valid-UUID + auth-boundary regression guards — and it demonstrably RUNS in CI
    (ci.yml test job provisions postgres:16 + sets job-level DATABASE_URL_TEST + runs
    pnpm test:ci which includes the integration config; skipIf therefore does not skip in CI;
    pg-harness is fail-loud). Scope holds to P-4-APPROVED; no gold-plating. All six exit
    heuristics PASS with no critical issue.
  next_action: PROCEED_TO_C-1
  verdict_complete: true
  rework_attempt_cap_remaining: 2
  carries:
    - "C-1/T-8: confirm real-DB integration suite RUNS (not 0-skipped) in CI test job — false-green if skipped"
    - "N-block park-or-key MANDATORY: zero credential-independent M6 work remains; decide park vs hold-for-keys, not another credential-blocked voice wave"
```
