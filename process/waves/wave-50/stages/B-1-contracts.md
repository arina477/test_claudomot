# B-1 — Contracts (wave-50)

- **node-specialist a52750f8, commit efd5723.**
- **StudyTimerSchema** += `workDurationMs: z.number().int().positive()` + `breakDurationMs: z.number().int().positive()` (server-authoritative anchors, ms).
- **StudyTimerConfigSchema** (PATCH body): `{ workMinutes: int 1-120, breakMinutes: int 1-60 }` + `StudyTimerConfig` type.
- **Barrel** (packages/shared/src/index.ts): StudyTimerConfigSchema + StudyTimerConfig re-exported.
- No new event constants (config reuses the existing STUDY_TIMER_UPDATE_EVENT wire event via gateway).
- Verify: shared typecheck + build clean; biome 0 (2 files). Consumer breakage in api/web expected → B-4.

```yaml
skipped: false
contracts_authored: [packages/shared/src/study-timer.ts, packages/shared/src/index.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: []
```
