# T-1 — Static (wave-51)
**Pattern:** A (CI-verified). Merge 01399a5.
- CI lint (biome, 27s) + typecheck (tsc, 42s) PASS on merge (C-1). B-5 ran repo-wide `biome ci .` clean (BUILD rule-10) → CI first-run green.
- Coverage: AppShell.tsx + test under biome+tsc; CI repo-wide.
- Bypass grep (wave-51 prod surface AppShell.tsx): 0 bypasses.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 lint PASS", "C-1 typecheck PASS", "B-5 biome ci . repo-wide clean"]
findings: []
ts_bypasses_in_wave_diff: 0
```
