# T-1 — Static (wave-69) [Pattern A — CI-verified]
CI run 28832468543 (merge 5fdd2bb): lint (biome ci) + typecheck (tsc, all 3 packages) both GREEN.
Bypass grep on wave diff (20208a3..5fdd2bb): 1 hit — `const mockApi = api as unknown as MockApi;` in apps/web/src/shell/moderation-reports.test.tsx (standard test-mock cast, NOT production; non-finding). Zero production @ts-ignore/@ts-expect-error/: any/as any.
Discipline: report Zod contracts inferred (no manual duplication); snake_case DTO convention held.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 lint job run 28832468543 green", "C-1 typecheck job run 28832468543 green"]
findings: []
ts_bypasses_in_wave_diff: 1   # test-only mock cast, non-finding
```
