# Wave 32 — T-1 Static (Pattern A — CI-verified)
- **C-1 evidence:** lint (Biome) green + typecheck (tsc) green on merge commit 45b08c3 (CI run 28554411114).
- **Coverage audit:** wave added .ts (api service/controller) + .tsx (indicator/hook) — all covered by Biome + tsc (strict, exactOptionalPropertyTypes). Repo typecheck re-run clean at B-4.
- **Bypass grep:** 1 match — `const mockSelect = db.select as unknown as MockFn;` in voice-participants.service.spec.ts (TEST file). Legit test-mock cast, not a production type bypass. Low/informational.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 lint job run 28554411114 green", "C-1 typecheck job green on 45b08c3"]
findings: [{severity: low, location: "voice-participants.service.spec.ts:232", description: "as unknown as MockFn — test-mock cast, not prod bypass"}]
ts_bypasses_in_wave_diff: 1
```
