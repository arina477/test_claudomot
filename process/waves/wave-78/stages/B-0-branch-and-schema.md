# Wave 78 — B-0 Branch & schema

- **Branch:** wave-78-profile-card-polish (off main).
- **Tasks claimed:** 4be3b084 + 3b3530d8 → in_progress (UPDATE 2).
- **Env:** no new env vars.
- **Deps:** no new deps.
- **Schema:** SKIPPED — no migration. `users.academic_role` is already nullable text (schema/users.ts:24); the wave only makes the WRITE contract null-tolerant + the service undefined-vs-null aware. No DDL.

```yaml
branch: wave-78-profile-card-polish
deps_added: []
env_vars_added: []
schema_skipped: true
migrations: []
orm_models_changed: []
backfill_ran: false
deviations: []
```
