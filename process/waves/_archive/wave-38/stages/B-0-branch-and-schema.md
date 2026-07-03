# Wave 38 — B-0 Branch & schema
- Branch: `wave-38-avatar-storage` (from main, pushed to origin)
- Task 84e09891 claimed → in_progress + wave_id.
- Env: added `PUBLIC_API_URL` placeholder to apps/api/.env.example (api self base URL for stable avatar redirect URLs). Real value set on Railway api at C-2.
- Deps: none new (@aws-sdk already installed).
- Schema: `users.avatar_key TEXT NULL` added (apps/api/src/db/schema/users.ts). Migration `apps/api/drizzle/migrations/0017_dapper_squadron_sinister.sql` (`ALTER TABLE users ADD COLUMN avatar_key text`). Additive nullable, no backfill (no user ever persisted avatar_url — storage was never wired). NOT applied locally (dev DB down); applies at C-2 via drizzle-kit migrate over the public proxy.
```yaml
branch: wave-38-avatar-storage
deps_added: []
env_vars_added: [PUBLIC_API_URL]
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0017_dapper_squadron_sinister.sql]
orm_models_changed: [apps/api/src/db/schema/users.ts]
backfill_ran: false
deviations: [forwardRef for Files<->Users circular dep, "@Redirect() decorator (no @types/express)", "@SkipThrottle() on public avatar route + T-8 anti-enumeration follow-up noted"]
```
