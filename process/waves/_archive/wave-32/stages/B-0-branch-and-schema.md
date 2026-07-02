# Wave 32 — B-0 Branch & schema

- **Branch:** wave-32-voice-occupancy (from main, pulled/rebased).
- **Task claim:** 78f51968 flipped todo→in_progress, wave_id=running wave 32. RETURNING confirmed 1 row.
- **Env:** no new env vars. LIVEKIT_API_KEY/SECRET/URL + VITE_LIVEKIT_URL already referenced (wave-31); still unset in Railway → credential-independent build (mock RoomServiceClient in tests; unset creds → {count:0,[]} or 503). No .env change.
- **Deps:** none added. livekit-server-sdk@2.15.5 already in apps/api (wave-31); no new frontend dep.
- **Schema:** SKIPPED (schema_skipped: true) — plan Data-model section declares no migration; inline {count,participants} DTO, no new table/column.

```yaml
branch: wave-32-voice-occupancy
deps_added: []
env_vars_added: []
schema_skipped: true
migrations: []
orm_models_changed: []
backfill_ran: false
deviations: []
```
