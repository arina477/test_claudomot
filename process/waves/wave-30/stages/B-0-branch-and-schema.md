# Wave 30 — B-0 Branch & schema
- **Claim:** 3 tasks (4a4c2715, c5c30363, 0ba853e2) → in_progress, wave_id=wave-30 (869ac982). RETURNING 3.
- **Branch:** wave-30-assignment-reminders from main ac78386.
- **Dep:** `@nestjs/schedule ^6.1.3` installed + committed (Refs 4a4c2715).
- **Schema (postgres-pro, 9527fb8, Refs c5c30363):** `assignment_reminder` (id uuid pk defaultRandom, assignment_id uuid FK→assignments ON DELETE CASCADE, user_id **text** [matches users.id], sent_at timestamptz default now) + **UNIQUE(assignment_id,user_id)** (send-once arbiter; mirrors assignment_status precedent). Migration `0013_smooth_tattoo.sql`. Barrel-registered. typecheck + biome clean. Local apply skipped (no DATABASE_URL locally — C-2 applies to prod; SQL manually verified correct).
```yaml
branch: wave-30-assignment-reminders
deps_added: ["@nestjs/schedule@^6.1.3"]
env_vars_added: []
schema_skipped: false
migrations: ["apps/api/drizzle/migrations/0013_smooth_tattoo.sql"]
orm_models_changed: ["apps/api/src/db/schema/assignment-reminder.ts", "apps/api/src/db/schema/index.ts"]
backfill_ran: false
deviations: []
```
