# Wave 47 — T-1 Static

**Block:** T · **Stage:** T-1 · **Pattern:** A (verified-via-CI) · **Mode:** automatic

## Action 1 — CI evidence (merge commit)
C-1 verdict_evidence (PR #61, run 28708469137, HEAD 972f069, merge 4db10675):
- lint: PASS (19s)
- typecheck: PASS (36s)
Both jobs ran green on the single merge-commit SHA. No missing job → no C-1 defect.

## Action 2 — Coverage audit (bypass grep)
Diff scanned: `717cbbc..4db10675` over `apps/**/*.{ts,tsx}` + `packages/**/*.ts`.
Bypass pattern grep (@ts-expect-error / @ts-ignore / `: any` / `as any` / `as unknown as`):
- **1 match, all in test code, zero in production code.**
  - `apps/api/src/dm/dm.service.spec.ts:135` — `service = new DmService(emitter as any)` — mock EventEmitter injection, already `biome-ignore`-annotated. Non-blocking (test-only).
- New production surface (`dm.service.ts` getDmCandidates, `dm.controller.ts` DmCandidatesController, `packages/shared/src/dm.ts` DmCandidateSchema, `StartDmPicker.tsx`, `DmHome.tsx`, `api.ts`) is fully typed — DmCandidate DTO derived from the Zod schema; drizzle query builder typed end-to-end.

## Action 3 — Discipline note
- The candidate query relies on drizzle `ne(users.who_can_dm, 'nobody')` + `inArray(server_id, callerServerIds)` for the privacy fence. The typechecker guarantees the column/enum references but NOT the runtime filter semantics — that is a T-4/T-8 concern (real Postgres), correctly deferred.
- No new `tsconfig` flag touched; no lint rule gap surfaced.

## Action 4 — Self-check
- [x] C-1 cites both lint + typecheck jobs on merge commit.
- [x] Bypass grep run + recorded.
- [x] Findings concrete with file:line + severity.

```yaml
mask_mode_signoff: PASS
signoff_note: "Static clean; sole bypass is a biome-annotated test-only mock cast; production surface fully typed."
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28708469137 green (19s) on 972f069"
  - "C-1 typecheck job: run 28708469137 green (36s) on 972f069"
findings:
  - {severity: info, location: "apps/api/src/dm/dm.service.spec.ts:135", description: "as-any cast on mock EventEmitter (biome-ignored, test-only). Non-blocking."}
ts_bypasses_in_wave_diff: 1
ts_bypasses_in_production_code: 0
```
