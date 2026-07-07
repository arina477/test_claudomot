# Wave 75 — T-1 Static

**Pattern A — Verified-via-CI.** T-1 does NOT re-execute typecheck/lint (CI's job at C-1). Discipline + coverage-adequacy audit only.

## Action 1 — CI evidence confirmed
C-1 verdict_evidence (single CI run 28885482458, HEAD 1786615 = pre-merge green commit, squashed to merge 3b94e276):
- **lint** job: required, pass (20s).
- **typecheck** job: required, pass (42s).
Both jobs ran green on the same commit CI gated. C-1 `ci_stage_verdict: PASS`. No missing-job defect.

## Action 2 — Coverage audit (static-analysis bypass grep)
Ran the mandated bypass grep on the wave diff (`git diff 3b94e276^..3b94e276 -- '*.ts' '*.tsx'`):

```
git diff 3b94e276^..3b94e276 -- '*.ts' '*.tsx' | grep -nE '@ts-expect-error|@ts-ignore|:\s*any|as\s+any|as\s+unknown\s+as'
```

11 matches, ALL confined to test files (`.spec.ts` / `.test.tsx`), zero in production source:
- billing.controller.spec.ts (3): `db.select as unknown as MockFn`, `billingProvider as any`, `entitlementsService as any` — mock-injection casts.
- educator-tools.controller.spec.ts (2): `db.select as unknown as MockFn`, `as unknown as ExecutionContext`.
- entitlement.guard.spec.ts (3): `as unknown as ExecutionContext`, `as unknown as Reflector`, `as unknown as EntitlementsService`.
- mock-billing.provider.spec.ts (2): `db.insert as unknown as MockFn`, `as unknown as EntitlementsService`.
- ServerPlanPanel.test.tsx (1): `api as unknown as MockApi`.

All are standard Vitest mock-boundary casts (test-double injection where the real type would require full DI). **Production source (12 files) has ZERO `any` / `@ts-ignore` / `@ts-expect-error` bypasses.** Verified by re-running the grep with `grep -vE '\.spec\.|\.test\.'` — empty result.

Two production files carry `biome-ignore lint/style/useImportType` comments (billing.controller.ts, entitlement.guard.ts, mock-billing.provider.ts): these are REQUIRED for NestJS DI (value-import needed for emitDecoratorMetadata), an established codebase convention — not a static-analysis escape hatch. Not a finding.

## Action 3 — Discipline note
- New `.ts` files (billing module) covered by Biome lint + tsc typecheck (both ran green in CI). New `.tsx` (ServerPlanPanel) covered by the same.
- The `BooleanEntitlementKey` mapped type in entitlement.guard.ts (`{[K in keyof Entitlements]: Entitlements[K] extends boolean ? K : never}[keyof Entitlements]`) is a genuinely type-safe design — the `@RequireEntitlement` decorator is compile-time-constrained to boolean entitlement flags. Good pattern; no tightening needed.
- `TierChangeRequestSchema`/`ServerPlanSchema` Zod schemas give runtime + compile-time contract parity. No `any` at the API boundary — body typed `unknown` then `safeParse`d (billing.controller.ts:64-69). Exemplary.

## Action 4 — Mask-mode self-check
- C-1 evidence cites both lint and typecheck jobs on the merge commit. ✓
- Coverage bypass grep ran and is recorded above with file:line classification. ✓
- Findings concrete with severity. ✓ (one info-level below)

## Findings
- **info** — 11 `as unknown as` / `as any` casts in test files (billing/educator/guard/provider specs + ServerPlanPanel.test). Standard mock-injection idiom; not blocking, not promotable. Production source is bypass-clean.

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28885482458 (HEAD 1786615) green"
  - "C-1 typecheck job: run 28885482458 (HEAD 1786615) green"
findings:
  - {severity: info, location: "apps/api/src/billing/*.spec.ts + apps/web/src/shell/ServerPlanPanel.test.tsx", description: "11 as-unknown-as/as-any casts, all in test files (mock injection); zero in production source"}
ts_bypasses_in_wave_diff: 11    # all in test files; 0 in production source
ts_bypasses_in_production_source: 0
```
