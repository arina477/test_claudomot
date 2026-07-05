# B-4 — Wiring (wave-50)

- Repo-wide typecheck (`pnpm -w typecheck`): clean (all packages).
- Route registration: `PATCH /servers/:serverId/study-timer/config` registered via the existing StudyTimerController (already in StudyTimerModule → app.module from wave-49); no new module.
- B-2↔B-3 contract alignment: frontend consumes the extended StudyTimerSchema (workDurationMs/breakDurationMs) + StudyTimerConfigSchema; server emits them. tsc clean end-to-end confirms no drift.

```yaml
typecheck: clean
routes_registered: [PATCH /servers/:serverId/study-timer/config]
```
