# T-1 — Static (wave-46 M8 direct messages slice 1)

**Pattern:** A — Verified-via-CI. T-1 does NOT re-execute lint/typecheck; C-1 ran them on the merge commit.

## Action 1 — CI evidence (merge SHA)

C-1 evidence (`process/waves/wave-46/stages/C-1-pr-ci-merge.md`, run 28703736920 on PR HEAD a815381, squash-merged to 2a738f7):

| Job | State | Evidence |
|---|---|---|
| lint | pass (19s) | biome 0 errors |
| typecheck | pass (40s) | tsc 4/4 |

Both required static jobs ran green on the single CI commit. B-6 attempt-3 + post-/review final independently re-confirmed `biome ci .` = 0 errors, `turbo run typecheck` = 4/4. No missing job → no C-1 defect.

## Action 2 — Coverage audit

DM wave added TypeScript surface the linter + typechecker cover:
- `packages/shared/src/dm.ts` (Zod schemas + inferred types)
- `apps/api/src/dm/{dm.service.ts, dm.controller.ts, dm-participant.guard.ts, dm.module.ts}`
- `apps/web/src/shell/useDm.ts` + DM UI components
- Drizzle schema `apps/api/src/db/schema/dm.ts`

**Bypass grep** (`@ts-expect-error | @ts-ignore | : any | as any | as unknown as`) across DM production source:
- `apps/api/src/dm/dm.service.ts` — **clean**
- `apps/api/src/dm/dm.controller.ts` — **clean** (one `biome-ignore lint/style/useImportType` on the DmService value import; required by NestJS DI emitDecoratorMetadata — legitimate, not a type bypass)
- `apps/api/src/dm/dm-participant.guard.ts` — **clean**
- `packages/shared/src/dm.ts` — **clean**
- `apps/web/src/shell/useDm.ts` — **clean**

Bypasses found ONLY in the test file `apps/api/src/dm/dm.service.spec.ts`:
- L54–57: `db.select as unknown as MockFn` (×4) — Drizzle fluent-API mock casts.
- L145/283/388/477/520/590: `new DmService(emitter as any)` — EventEmitter2 mock injection.

All are test-scaffold casts (mocking the data layer / DI boundary), not production type-safety escapes. Per test-writing-principles §7 (mock at the boundary), these are the standard cost of unit-mocking Drizzle's chained builder + Nest DI — LOW, non-blocking.

**ts_bypasses_in_wave_diff (production): 0. (test-scaffold: 10, acceptable.)**

## Action 3 — Discipline note

- DM production code carries zero `any`/`ts-ignore` — schema-first Zod + inferred types held end-to-end (contract → controller → service). Good discipline; nothing to tighten.
- The two warn-level `noNonNullAssertion` findings carried from B-6 (`dm.service.ts:436` guarded by `isNewInsert` length check; pre-existing `multiPageCatchup.test.ts:415`) are `biome` warn severity, non-CI-blocking. Logged as LOW; already tracked for L-2 cleanup.

## Action 4 — Mask-mode self-check

- [x] C-1 evidence cites both lint AND typecheck jobs on the merge commit.
- [x] Coverage audit ran the bypass grep (production clean).
- [x] Findings concrete (file:line) with severity.

## Findings

- **F1 (LOW):** `apps/api/src/dm/dm.service.spec.ts` — 10 test-scaffold type casts (`as unknown as MockFn`, `emitter as any`). Acceptable unit-mock pattern; non-blocking. No production bypass.
- **F2 (LOW):** `apps/api/src/dm/dm.service.ts:436` — warn-level `noNonNullAssertion` (`insertReturning[0]!`), guarded by an `isNewInsert` length check. Non-CI-blocking; L-2 cleanup follow-up (carried from B-6).

---
```yaml
mask_mode_signoff: PASS
signoff_note: "Production DM source is bypass-clean; both static CI jobs green on merge SHA 2a738f7."
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28703736920 — biome 0 errors (green)"
  - "C-1 typecheck job: run 28703736920 — tsc 4/4 (green)"
  - "B-6 post-/review independent re-run: biome ci . = 0 errors, turbo typecheck = 4/4"
findings:
  - {severity: LOW, location: "apps/api/src/dm/dm.service.spec.ts:54-590", description: "10 test-scaffold type casts (mock/DI), non-blocking"}
  - {severity: LOW, location: "apps/api/src/dm/dm.service.ts:436", description: "warn-level noNonNullAssertion, guarded; L-2 cleanup"}
ts_bypasses_in_wave_diff: 0
head_signoff:
  verdict: APPROVED
  stage: T-1
  failed_checks: []
  rationale: >
    Both static CI jobs (lint biome 0 errors, typecheck tsc 4/4) ran green on the single
    merge commit 2a738f7, independently re-confirmed at B-6 post-/review. DM production
    source (service, controller, guard, shared schema, useDm) is bypass-clean — zero any /
    ts-ignore / ts-expect-error. The only casts are test-scaffold mock/DI casts (LOW,
    acceptable). Static layer proves a user-observable outcome: the shipped DM types are the
    contract types, enforced by the compiler end-to-end.
  next_action: PROCEED_TO_T-2
```
