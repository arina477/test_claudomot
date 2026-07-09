# Wave 83 — B-0 Branch & schema
```yaml
branch: wave-83-api-security-headers
deps_added: [helmet@8.2.0]
env_vars_added: []
schema_skipped: true
migrations: []
orm_models_changed: []
backfill_ran: false
deviations: []
```
Task 875b97f4 in_progress, attached to running wave-83. helmet 8.2.0 added to apps/api (v8 → v8 option names: `hsts`, `contentSecurityPolicy:false`, `crossOriginResourcePolicy:false`, `crossOriginEmbedderPolicy:false`, `xFrameOptions`, `referrerPolicy`, `noSniff`, `hidePoweredBy`). No schema/env. Config-only wave.
