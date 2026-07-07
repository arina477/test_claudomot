# Wave 77 — B-0 Branch & schema
- **Branch:** wave-77-portable-identity (off main @ cd88658).
- **Tasks claimed:** 4/4 in_progress (10a68f9e, a51e281d, bf0ad2a8, a98286cb) — UPDATE 4.
- **Env/Deps:** none.
- **Schema (postgres-pro, 262ecdb):** migration `apps/api/drizzle/migrations/0030_funny_tarantula.sql` — additive ALTER TABLE users ADD COLUMN (pronouns, bio, institution, program, academic_role, academic_year), all nullable text, no backfill, no pgEnum. ORM model users.ts updated. api typecheck clean. **Generate-only (no local DB) — C-2 MUST apply this migration to prod (db:migrate against the prod public proxy) BEFORE the api deploy.**
```yaml
branch: wave-77-portable-identity
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0030_funny_tarantula.sql]
orm_models_changed: [apps/api/src/db/schema/users.ts]
backfill_ran: false
deviations: []
carry_to_C2: "apply migration 0030 to prod DB before api deploy (db:migrate)"
```
