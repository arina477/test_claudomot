# Wave 87 — B-0 Branch & schema

- **Branch:** `wave-87-join-default-role` (from main @ 4f262e21, which carries wave-86 close + wave-87 seed)
- **Task claim:** dc4abee3 flipped todo→in_progress, wave_id=87. RETURNING confirmed 1 row.
- **Env (Action 3):** no new env vars — skip.
- **Deps (Action 4):** no new deps — skip.
- **Schema (Actions 5-9):** SKIP — plan declares no schema change. `server_members.role_id` already exists as a nullable uuid FK → roles.id (schema/servers.ts:68, onDelete set null). No migration, no backfill (the existing backfill-roles.ts stays live until new-NULL creation drains).

```yaml
branch: wave-87-join-default-role
deps_added: []
env_vars_added: []
schema_skipped: true
migrations: []
orm_models_changed: []
backfill_ran: false
deviations: []
```
