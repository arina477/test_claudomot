# Wave 33 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** malformed-UUID route param → 400 (global 22P02→BadRequest via .cause.code walk)
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-33/stages/B-0-branch-and-schema.md | done | branch wave-33-uuid-param-validation; schema SKIP; task claimed |
| B-1 | process/waves/wave-33/stages/B-1-contracts.md | skipped | no new type/Zod/OpenAPI |
| B-2 | process/waves/wave-33/stages/B-2-backend.md | done | node-specialist; 22P02→400 in filter + helper mirroring 23505 walk; 18 unit + 10 real-DB integration; no 2nd catch-all |
| B-3 | process/waves/wave-33/stages/B-3-frontend.md | skipped | backend-only (design_gap FALSE) |
| B-4 | process/waves/wave-33/stages/B-4-wiring.md | done | repo typecheck clean; no route drift |
| B-5 | process/waves/wave-33/stages/B-5-verify.md | done | lint+build clean; api 467 green; smoke 401; integration runs in CI |
| B-6 | process/waves/wave-33/stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** tasks row a2dd9f3d (DB); spec at process/waves/wave-33/stages/P-2-spec.md
- **Branch name:** wave-33-uuid-param-validation
- **claimed_task_ids:** [a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** none (schema_skipped: true)
- **B-1 fast-path approved:** n/a (B-3 skipped; single backend change, serial)
- **Mechanism (P-4 APPROVED attempt-2):** extend `apps/api/src/auth/auth.exception.filter.ts` (SupertokensExceptionFilter) — check `isInvalidTextRepresentation(err)` (walk err.code / err.cause.code / err.cause.cause.code for '22P02', mirror users.service.ts:23-38) FIRST → 400 clean body, else defer to existing handling. NO 2nd catch-all. Target real path `messaging/messages.controller.ts` for the non-voice regression test.
- **P-4/karen/jenny carries:** T-8 must exercise 22P02 against a REAL test DB (not unit-sim). Verify auth 401/403 unaffected. valid-UUID behavior byte-unchanged (AC6).

## Open escalations carried into gate
- N-block park-or-key MANDATORY (ceo-reviewer): no credential-independent M6 work remains after this wave.

## Gate verdict log
<appended by fresh head-builder spawn at B-6 Action 1>
