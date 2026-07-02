# Wave 33 — B-2 Backend

## Specialist: node-specialist

## Files
- `apps/api/src/auth/pg-error-utils.ts` (new) — `PG_INVALID_TEXT_REPRESENTATION='22P02'` + `isInvalidTextRepresentation(err)` (walks err.code / err.cause.code / err.cause.cause.code — structural mirror of users.service.ts:23-38 isUniqueViolation).
- `apps/api/src/auth/auth.exception.filter.ts` (mod) — inserted `if (isInvalidTextRepresentation(err)) → 400` clean body, AFTER the HttpException-forward branch (:43) and BEFORE the generic-500 fallback (:72). Ordering verified: headersSent → HttpException(401/403/404/app-400 forward) → 22P02→400 → unknown→500.
- `apps/api/src/auth/auth.exception.filter.spec.ts` (new) — 18 unit tests (helper 7, filter 22P02→400 4, HttpException passthrough 4, ordering contract, headersSent, unknown→500).
- `apps/api/test/integration/malformed-uuid-params.spec.ts` (new) — 10 real-DB integration tests: real Postgres throws 22P02 on malformed canViewChannelById id (4 values) + non-voice route + valid-UUID no-false-positive; feeds real error → filter → 400 clean body. `describe.skipIf(!DATABASE_URL_TEST)` — runs in CI Postgres v16.
- `apps/api/src/main.ts` — UNCHANGED (filter already registered :120; NO 2nd catch-all).

## AC → code
- AC1 (malformed→400, no data/leak): filter :64 + helper. AC2/3 (voice routes): integration + real 22P02. AC4 (non-voice route): integration. AC5 (clean body): filter 400 body (no stack/SQL). AC6 (valid-UUID unchanged): ordering (HttpException forwards first) + no-false-positive integration test. AC7 (unauth→401): AuthGuard runs before query; HttpException-forward branch.

## /simplify: LEAVE-ALONE — helper deliberately mirrors the shipped isUniqueViolation pattern; filter insertion is minimal + correctly ordered. tsc clean.

## Deviations: none (PREFERRED path (a) — extended SupertokensExceptionFilter, no 2nd catch-all).

## Carries to T-8/B-5: the 10 integration tests skip locally (no PG) but MUST run in CI Postgres — T-8 confirms they ACTUALLY ran (not silently skipped) so the 22P02 branch is real-DB-proven per jenny/head-product.

```yaml
skipped: false
specialists_spawned: [node-specialist]
files_implemented:
  - apps/api/src/auth/pg-error-utils.ts
  - apps/api/src/auth/auth.exception.filter.ts
  - apps/api/src/auth/auth.exception.filter.spec.ts
  - apps/api/test/integration/malformed-uuid-params.spec.ts
deviations: []
simplify_applied: true
```
