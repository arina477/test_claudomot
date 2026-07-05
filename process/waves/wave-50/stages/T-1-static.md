# T-1 — Static (wave-50)

**Pattern:** A (CI-verified). Merge 699477655a; CI green on 1969336f.

- **CI evidence:** lint (biome, 21s) PASS + typecheck (tsc, 41s) PASS on the merge commit (C-1 verdict). Repo-wide `biome ci .` also ran clean at B-5 (the obs-A catch — 2 format-drift files fixed pre-C-1, so lint was first-run green in CI, 0 fix-up cycles).
- **Coverage audit:** wave added api service/controller + widget + shared contract + migration — all under biome + tsc; CI ran repo-wide.
- **Bypass grep (wave-50 prod surface — study-timer service/widget/shared):** 0 bypasses (no @ts-expect-error / @ts-ignore / `: any` / `as any` in prod code).

```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 lint PASS (biome) on 1969336f", "C-1 typecheck PASS (tsc)", "B-5 biome ci . repo-wide clean"]
findings: []
ts_bypasses_in_wave_diff: 0
```
