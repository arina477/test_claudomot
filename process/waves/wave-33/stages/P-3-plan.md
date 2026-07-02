# Wave 33 — P-3 Plan (single-spec: malformed-UUID param → 400)

## Approach section

### Architecture delta  (REVISED after P-4 attempt-1 REWORK)
- **New:** global handling mapping the Postgres invalid-text-representation error (SQLSTATE `22P02` — thrown when a malformed non-UUID string is cast to `uuid` in a parameterized WHERE) to `BadRequestException` (HTTP 400) with a clean generic body.
- **CRITICAL error-shape correction (P-4 REWORK, karen-verified):** stack is **Drizzle + node-postgres**, NOT TypeORM. Do NOT use `@Catch(QueryFailedError)` (TypeORM class — never fires here). Drizzle wraps the pg error in `DrizzleQueryError`, so `code: '22P02'` lives at `err.cause.code` (defensively also `err.cause.cause.code`), EXACTLY as the shipped `isUniqueViolation` (23505) helper walks it at `apps/api/src/users/users.service.ts:23-38`. B-2 MUST mirror that layered walk: an `isInvalidTextRepresentation(err)` helper checking `err.code==='22P02' || err.cause?.code==='22P02' || err.cause?.cause?.code==='22P02'`.
- **Filter-collision correction (P-4 REWORK):** `main.ts:120` already registers the catch-all `SupertokensExceptionFilter`. Do NOT register a SECOND catch-all (last-registered catch-all wins → breaks Supertokens). node-specialist picks: (a) integrate the 22P02→400 check INTO `SupertokensExceptionFilter` (check invalid-uuid-cast FIRST → 400; else defer to existing handling) [PREFERRED — one coordinated filter], OR (b) a SPECIFIC `@Catch(DrizzleQueryError)` filter (only if that class is stably importable) composing by specificity. Either way PROVE auth 401/403 paths unaffected (read the supertokens filter + a regression assertion).
- **Covers:** ALL ~30 UUID route params across 7 controllers (servers, rbac, channel-override, messages, assignments, voice-participants, voice-token, attachments) at once — the root-cause fix problem-framer's code-evidence requires, WITHOUT a per-param sweep (ceo-reviewer + mvp-thinner anti-sprawl respected).
- **Why this over alternatives:**
  - *Alt A — per-param `ParseUUIDPipe` on all ~30 params:* rejected — the 30-param manual sweep ceo/mvp explicitly excluded; large diff for the same outcome.
  - *Alt B — global `ValidationPipe`:* rejected — NestJS ValidationPipe validates DTO classes, not raw path-param strings, without wrapping every param in a DTO (a bigger refactor).
  - *Chosen — 22P02→400 via the `.cause.code` walk, coordinated with the existing filter:* smallest, reuses the shipped 23505-walk pattern, error contract changes ONLY for the current malformed-UUID→500 case.
- **AC-1 (amended per P-4 + VERIFY rule 2):** AC-1 now reads "400 not 500; no row is read or returned and no data is accessed or leaked (the malformed uuid cast fails at query execution before any row access)." The 22P02→400 handling satisfies this: the cast fails at execution before any row is read. No ParseUUIDPipe fallback needed (P-4 head-product confirmed the handling satisfies the intent).
- **Failure-domain impact:** additive + narrow (only 22P02). MUST NOT swallow/reorder `SupertokensExceptionFilter`'s auth errors — the 22P02 check runs first and defers everything else unchanged; auth 401/403 verified by regression assertion. Valid-UUID 22P02 cannot occur (a well-formed uuid always casts) → no false-400 on the happy path.

### Data model
None (B-0 schema-skip). No migration, no column/table change.

### API contracts
No new endpoint. Behavior delta only: every authenticated UUID route param → 400 (was 500) on malformed format; valid-UUID behavior byte-unchanged. Error envelope = NestJS `BadRequestException` JSON (generic message, no stack/DB detail), consistent with the app's existing error shape.

### Deps
None. No new package (uses NestJS built-ins + the existing pg/Drizzle error).

## Plan section

### File-level steps
- **B-0:** branch `wave-33-uuid-param-validation`. No schema, no dep.
- **B-1 Contracts:** SKIP (no new type/Zod/OpenAPI).
- **B-2 Backend (node-specialist):**
  - Add an `isInvalidTextRepresentation(err)` helper (mirror `users.service.ts:23-38` `isUniqueViolation`: walk `err.code` → `err.cause.code` → `err.cause.cause.code` for `'22P02'`); place in a shared common/ util or beside the filter.
  - Implement 22P02→`BadRequestException` (clean generic body, no stack/DB detail) via the PREFERRED path (a): extend `apps/api/src/auth/auth.exception.filter.ts` (`SupertokensExceptionFilter`) to check `isInvalidTextRepresentation` FIRST → 400, else defer to existing handling. (Fallback (b): specific `@Catch(DrizzleQueryError)` filter if stably importable + registered without shadowing the catch-all.) Verify auth 401/403 unaffected (read the supertokens filter). ~20-40 LOC. NO second catch-all global filter.
  - MODIFY `apps/api/src/main.ts` — add the new filter to `app.useGlobalFilters(...)` alongside `SupertokensExceptionFilter`; confirm ordering/specificity so auth errors + this filter don't collide.
  - TESTS (spec + a contract/integration test): assert 400 on non-UUID for (a) GET /channels/:channelId/voice/participants, (b) POST /channels/:channelId/voice/token, (c) ≥1 NON-voice route (e.g. a /channels/:channelId/messages GET or a /servers/:serverId/* route) — proves the convention; assert valid-UUID paths UNCHANGED (200/401/403/404 preserved); assert unauth+malformed → 401 (guard first); assert 400 body carries no stack/DB detail. Mock or hit the DB per the existing test harness (the 22P02 is a real pg behavior — an integration test against the test DB is the honest proof; unit-level can simulate the QueryFailedError).
  - Run formatter + lint/import-sort on touched files (BUILD rules 6+7).
- **B-3 Frontend:** SKIP (backend-only; design_gap_flag=false).
- **B-4 Wiring:** repo typecheck + confirm the filter is registered + no route drift.
- **B-5 Verify:** lint + full unit/integration suite + build + dev-smoke (curl a non-UUID param → 400).
- **B-6 Review:** head-builder gate + /review (security: confirm the filter doesn't leak, doesn't mask auth errors, valid-UUID unaffected).

### Specialist routing (validated against AGENTS.md)
- **node-specialist** — "Node.js backend (NestJS) APIs, services, runtime" (AGENTS.md, pre-built). The right fit for a NestJS global exception filter. (backend-developer is the generic fallback; node-specialist is more specific.)

### Parallelization map
Single specialist, single coherent change (filter + main.ts + tests) — serial, one B-2 spawn. No parallel batch.

### Action 8 — self-consistency sweep
- AC1 (malformed→400 before data access) → B-2 filter (+ nuance noted). AC2/AC3 (voice routes) → B-2 tests. AC4 (non-voice route) → B-2 test. AC5 (clean body) → filter body + test. AC6 (valid-UUID unchanged) → B-2 regression tests. AC7 (unauth→401) → filter specificity + test. Every AC mapped. ✓
- Every step has a specialist (node-specialist / orchestrator wiring). ✓
- No file in multiple batches (single change). ✓
- design_gap_flag=false referenced. ✓
- Architecture delta has explicit alternatives (A/B rejected). ✓
- Data/API contracts concrete (no schema; behavior delta specified). ✓
- No new dep. ✓ No SDK. ✓
Clean.

## Exit
Single-spec, bounded root-cause global 22P02→400 filter (node-specialist), covers all 7 controllers incl. both voice routes + a non-voice regression assertion. B-1/B-3 skip (no contracts, no UI). design_gap_flag=false → D-block SKIPS → straight to B. Security-adjacent → T-8 re-probe. N-block park-or-key flagged. → P-4 Gate.
