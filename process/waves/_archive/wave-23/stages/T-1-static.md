# Wave 23 — T-1 Static

**Pattern:** A (CI-verified). Did NOT re-execute — audited C-1 evidence.

## CI evidence (C-1)
Merge commit 489c86a (PR#35). Per-job conclusions verified at C-1 (rule 3): **lint = success, typecheck = success** on run 28485682987 (headSha 17185a8 == PR HEAD). Both static jobs green on the merge commit.

## Coverage audit
New surface (rbac.service.ts getEffectivePermissions, rbac.controller.ts ServerPermissionsController, packages/shared EffectivePermissionsSchema, AssignmentsPanel gate, ServerRolesPage PERM_FLAGS) is all `.ts`/`.tsx` covered by biome lint + tsc. No new tsconfig flags touched.

## Static-analysis bypasses (grep on wave diff)
2 hits, **both in test files (acceptable mock idiom, not production):**
1. `assignments.service.spec.ts`: `new AssignmentsService(rbac as any, files as any)` — mock DI cast (standard vitest pattern).
2. `assignments.test.tsx`: `const mockApi = api as unknown as {...}` — mock cast for the typed api client (standard).

No production `any` / `@ts-ignore` / `@ts-expect-error`. The wave's production code (rbac service/controller, shared schemas, web gate) introduces zero type-system bypasses.

## Discipline note
None new. Test-mock `as any` DI casts are the established project idiom; not a T-1.md promotion candidate.

```yaml
mask_mode_signoff: PASS
signoff_note: "lint+typecheck green on merge commit; 2 ts-bypasses both test-mock DI (acceptable)"
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28485682987 success"
  - "C-1 typecheck job: run 28485682987 success"
findings: []
ts_bypasses_in_wave_diff: 2   # both test-file mock casts, non-blocking
```

## Exit
CI static green confirmed; no production bypass. → T-2 (∥) / T-3.
