# Wave 23 — B-0 Branch & schema

## Branch
`wave-23-manage-assignments` (from main, rebased). Bundle claimed: 8aa67564 + edbdea8f → in_progress + wave_id.

## Env / deps
- New env vars: none.
- New deps: none (extend/swap on existing RbacService + AssignmentsModule).

## Schema (postgres-pro, agentId a5169289a3b835d45)
- **Drizzle delta:** `apps/api/src/db/schema/servers.ts:39` — `manage_assignments: boolean('manage_assignments').default(false).notNull(),` after manage_members (4 existing manage_* cols unchanged).
- **Migration:** `apps/api/drizzle/migrations/0011_rainy_wild_child.sql` — `ALTER TABLE roles ADD COLUMN manage_assignments boolean DEFAULT false NOT NULL;` + backfill `UPDATE roles SET manage_assignments=true WHERE manage_channels=true;` (BOARD condition 1: no silent privilege loss). Journal 10→11 + 0011_snapshot.json.
- **Local apply:** NOT applied — no local DATABASE_URL in env (app DB is Railway-hosted). Migration applies at C-block against prod (same as wave-22 0010). Verify post-apply via information_schema query.
- **Deviation:** none.

```yaml
branch: wave-23-manage-assignments
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0011_rainy_wild_child.sql]
orm_models_changed: [apps/api/src/db/schema/servers.ts]
backfill_ran: false   # backfill is in-migration (applied at C-block); clean DB matches 0 rows
deviations: []
```

## Exit
Branch + bundle claimed + migration 0011 committed. → B-1 Contracts.
