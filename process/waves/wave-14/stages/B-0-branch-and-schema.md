# Wave 14 — B-0 Branch & schema
```yaml
branch: wave-14-m3-presence
deps_added: []
env_vars_added: []
schema_skipped: true
migrations: []
orm_models_changed: []
backfill_ran: false
deviations: []
```
- Branch wave-14-m3-presence off main. Tasks d1c4693d/58633934/058984c5 → in_progress.
- Schema SKIPPED: presence + typing are in-memory server state; membership from existing server_members (M1). No migration, no new dep (Socket.IO integrated wave-12).
