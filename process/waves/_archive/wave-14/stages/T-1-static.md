# T-1 — Static (wave-14)

**Block:** T · **Stage:** T-1 · **Layer:** Typecheck + lint · **Pattern:** A (CI-verified) · **Mode:** automatic

## Purpose
Confirm typecheck + lint ran green on the merge commit; audit static-analysis coverage of the presence surface.

## Action 1 — CI evidence (merge commit ef6afbf)
C-1 `verdict_evidence` confirms both static jobs ran GREEN on the merge commit:
- **lint** (Biome) — PASS, 26s, run 28423127013.
- **typecheck** (tsc, 4/4 workspace tasks) — PASS, 29s, run 28423127013.
Both jobs report success (not skipped/cancelled). C-1 evidence complete — no C-1 defect.

## Action 2 — Coverage audit (static bypass grep)
Ran the bypass grep on the wave diff (`71633ac..ef6afbf`, `*.ts`/`*.tsx`):
```
git diff 71633ac..ef6afbf -- '*.ts' '*.tsx' | grep -nE '@ts-expect-error|@ts-ignore|: any|as any|as unknown as'
```
Result: **0 matches.** Zero `any` casts, zero `@ts-ignore`/`@ts-expect-error`, zero unsafe double-casts introduced by the wave.

New static surface: `packages/shared/src/presence.ts` (Zod schemas → inferred types, fully type-checked), `apps/api/src/presence/*` (typed NestJS gateway/service), member-list view code. All covered by the existing tsconfig + Biome config.

Note: two `// biome-ignore lint/style/useImportType` comments exist in presence.gateway.ts — these are CORRECT (NestJS DI requires runtime value imports for emitDecoratorMetadata, not type-only imports). Not bypasses; documented intent.

## Action 3 — Discipline note
- The `biome-ignore useImportType` pattern for NestJS DI value-imports is a recurring, legitimate pattern (also in messaging gateway). Candidate canonicalization at L-2 if it recurs.

## Action 4 — Self-check
- [x] C-1 cites both lint + typecheck jobs on merge commit.
- [x] Bypass grep ran (0 hits).
- [x] Findings concrete with location.

```yaml
mask_mode_signoff: PASS
signoff_note: "Both static jobs green on merge commit ef6afbf; zero ts-bypasses in wave diff."
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28423127013 PASS (Biome, 26s)"
  - "C-1 typecheck job: run 28423127013 PASS (tsc 4/4 tasks, 29s)"
findings: []
ts_bypasses_in_wave_diff: 0
head_signoff:
  verdict: APPROVED
  stage: T-1
  failed_checks: []
  rationale: "Lint + typecheck green on merge commit per C-1; bypass grep clean (0); new presence/shared surface fully type-checked. No findings."
  next_action: PROCEED_TO_T-3
```
