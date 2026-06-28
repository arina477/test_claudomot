# Wave 1 — T-1 Static (Pattern A — CI-verified)
C-1 CI run 28240325274 (merge commit 486d45b): lint job green, typecheck job green. Static-bypass grep over the wave diff: 0 (`@ts-expect-error`/`@ts-ignore`/`as any`/`: any` — none; B-4 a11y fixes disabled no rules). Biome strict + tsc project-refs strict enforced.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 lint job 28240325274 green", "C-1 typecheck job 28240325274 green"]
findings: []
ts_bypasses_in_wave_diff: 0
```
