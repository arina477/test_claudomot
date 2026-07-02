# Wave 35 — B-0 Branch & schema

**Branch:** wave-35-privacy-controls (from main, pushed to origin).
**claimed_task_ids:** [56a50862, a4169fac, d40ece71, 13b7ebfd] — all flipped `in_progress` + wave_id attached (RETURNING all 4).

## Env (Action 3)
- `apps/api/.env.example` += `SENTRY_DSN=` (provider-issued DSN, set on Railway at C-2; unset → Sentry no-ops).
- `apps/web/.env.example` += `VITE_SENTRY_DSN=` (Vite prefix mandatory; unset → no-op).
- No secret generation (DSN is account-issued, requested/set at deploy).

## Deps (Action 4)
- `@sentry/nestjs@^10.63.0` → apps/api; `@sentry/react@^10.63.0` → apps/web. Resolved **v10** (P-3 pinned ^9 as a guess; karen flagged; actual installed = 10.63.0 — recorded). Committed `b018ae9`.
- New SDK → research-analyst wrote `command-center/dev/SDK-Docs/Sentry/sentry.md` + registry row (committed `30ef06f`). SDK ref attached to task d40ece71 description.
- **Key integration nuance for B-2:** app already has custom global filter `SupertokensExceptionFilter` (apps/api/src/auth/auth.exception.filter.ts) → Sentry hooks via `@SentryExceptionCaptured()` decorator on its `catch()`, NOT a competing `SentryGlobalFilter`. `instrument.ts` imported FIRST in main.ts. `beforeSend` PII scrub. Browser: `import.meta.env.VITE_SENTRY_DSN`, no replayIntegration.

## Schema (Actions 5-8) — postgres-pro
- `apps/api/src/db/schema/users.ts` MODIFY: `profile_visibility text NOT NULL DEFAULT 'everyone'`, `who_can_dm text NOT NULL DEFAULT 'everyone'` (matches file convention: text cols, no pgEnum, no CHECK; enum validated at Zod/app layer).
- Migration generated: `apps/api/drizzle/migrations/0014_sparkling_gorgon.sql` — additive ALTER, both cols defaulted (existing rows backfill via default → BUILD-PRINCIPLES rule 3 satisfied, no separate backfill).
- Typecheck clean; Biome clean. Committed `80a8ec4`.
- **NOT applied locally** (no local dev DB — app DB is remote on Railway); applies at C-2 deploy. Deviation: none.

```yaml
branch: wave-35-privacy-controls
deps_added: ["@sentry/nestjs@^10.63.0", "@sentry/react@^10.63.0"]
env_vars_added: [SENTRY_DSN, VITE_SENTRY_DSN]
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0014_sparkling_gorgon.sql]
orm_models_changed: [apps/api/src/db/schema/users.ts]
backfill_ran: false   # column DEFAULT handles it
deviations: []
last_commits: [b018ae9, 80a8ec4, 30ef06f]
```
