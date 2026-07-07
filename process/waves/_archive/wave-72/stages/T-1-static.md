# Wave 72 — T-1 Static (Pattern A: CI-verified)

- **CI evidence:** lint + typecheck jobs green on merge commit e5bfba1 (C-1 run 28853331227). Confirmed from C-1 verdict_evidence.
- **Bypass grep (diff 733c5d6..e5bfba1):** 3 additions, ALL `as unknown as <ServiceType>` in `privacy.controller.spec.ts` (the typed-mock cast replacing `as any` — intentional, test-only, stronger than `any`). Zero `as any`, `@ts-ignore`, or `@ts-expect-error` in production code.
- **Discipline:** the typed-mock pattern (`as unknown as ServiceType`) is the correct idiom for controller-spec mocks; keep over `as any`.

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job green on e5bfba1 (run 28853331227)"
  - "C-1 typecheck job green on e5bfba1"
findings: []
ts_bypasses_in_wave_diff: 3   # all test-only `as unknown as ServiceType`, none in prod code
```
