# T-1 — Static (wave-71) [Pattern A — CI-verified]
CI run 28842513359 (merge 670c46e): lint (biome) + typecheck (tsc all 3 packages) GREEN. Bypass grep on wave diff: test-mock casts only (as any on DmService constructor mocks / as unknown as MockApi in tests); zero production @ts-ignore/@ts-expect-error/:any.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 lint + typecheck jobs run 28842513359 green"]
findings: []
```
