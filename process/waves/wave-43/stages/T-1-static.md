# Wave 43 — T-1 Static (ci-verified)
- **C-1 evidence:** CI run 28692639154 (merge 7b0bc478) — lint (biome ci) green + typecheck green.
- **Bypass audit:** 0 ts-expect-error/@ts-ignore/as-any/`: any` in wave-43 production code.
- **Coverage:** new scheduling .ts/.tsx (scheduling.service/controller/module, schema/scheduling.ts, shared/scheduling.ts, SessionForm/ClassCalendar/SessionDetail, api.ts) all under biome+tsc; strict types.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 lint job run 28692639154 green", "C-1 typecheck job run 28692639154 green"]
findings: []
ts_bypasses_in_wave_diff: 0
```
