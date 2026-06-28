# Wave 2 — B-0 Branch & schema
- Task b9118041 claimed → in_progress (wave 2).
- Branch: wave-2-auth-backend.
- Env: canonical wave-2 vars already present in .env.example from onboarding v6b (DATABASE_URL, DATABASE_URL_UNPOOLED, SUPERTOKENS_CONNECTION_URI, SUPERTOKENS_API_KEY, SESSION_SECRET, RESEND_API_KEY_AUTH, API_ORIGIN, WEB_ORIGIN) — no new placeholders. Secret VALUES set in Railway env (not committed): SUPERTOKENS_API_KEY + SESSION_SECRET self-generated; DATABASE_URL/DATABASE_URL_UNPOOLED/SUPERTOKENS_CONNECTION_URI set by infra provisioning. RESEND_API_KEY_AUTH = founder-supplied (account credential, rule 6) — needed at RUNTIME (deploy/test) for verify/reset emails to send, NOT at build time.
- Deps (committed eae6dc7): drizzle-orm ^0.45.2, pg ^8.22.0, supertokens-node ^24.0.2, resend ^6.16.0; dev drizzle-kit ^0.31.10, @types/pg, tsx ^4.22.4.
- **Railway infra provisioned + live** (head-ci-cd): Postgres (reused postgres-volume, dedicated `supertokens` db) + SuperTokens core service `73ca977a` (registry.supertokens.io/supertokens/supertokens-postgresql:latest, http://supertokens.railway.internal:3567, SUCCESS+serving, 48 st_ tables created). Env set on api: DATABASE_URL, DATABASE_URL_UNPOOLED, SUPERTOKENS_CONNECTION_URI, SUPERTOKENS_API_KEY (matches core API_KEYS), SESSION_SECRET. Note: no PgBouncer → UNPOOLED=URL (both direct private).
- **Schema (committed 82d61a3, backend-developer):** apps/api/src/db/{schema/users.ts, schema/index.ts, index.ts (lazy pool), seed.ts} + drizzle.config.ts + migration apps/api/drizzle/migrations/0000_breezy_bedlam.sql (users: id text PK = ST userId, email unique, display_name null, created_at/updated_at tz default now()). db:generate/db:migrate/db:seed scripts. typecheck clean. Migration APPLIES at deploy (Postgres private to Railway sandbox).
```yaml
branch: wave-2-auth-backend
deps_added: [drizzle-orm, pg, supertokens-node, resend, drizzle-kit, "@types/pg", tsx]
env_vars_added: []   # canonical vars pre-existed from v6b; values set in Railway env
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0000_breezy_bedlam.sql]
orm_models_changed: [apps/api/src/db/schema/users.ts]
backfill_ran: false
infra_provisioned: [railway-postgres (reused), supertokens-core 73ca977a]
deviations: ["drizzle(getPool,...) lazy accessor vs eager Pool (avoids import-time connect/test crash)", "DATABASE_URL_UNPOOLED=DATABASE_URL (no PgBouncer)"]
```
