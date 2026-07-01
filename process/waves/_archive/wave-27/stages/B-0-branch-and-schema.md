# Wave 27 — B-0 Branch & schema

- **Claim:** 6a546c7b + 07361daf → in_progress, wave_id=wave-27.
- **Branch:** wave-27-presence-perf (from f45ab8c).
- **Env/deps:** none.
- **Schema (Spec A, postgres-pro, commit ff4126b):** added `index('server_members_user_id_idx').on(table.user_id)` to server_members (apps/api/src/db/schema/servers.ts) — matches house pattern (cpo_channel_id_idx). Generated migration `drizzle/migrations/0012_flashy_spacker_dave.sql` (`CREATE INDEX ... USING btree (user_id)`) + _journal, committed per convention. No local PG reachable → migration CI-verified (pg-harness migrate() in beforeAll applies it on the CI postgres:16). Additive, forward-only, no data change.
```yaml
branch: wave-27-presence-perf
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0012_flashy_spacker_dave.sql]
orm_models_changed: [apps/api/src/db/schema/servers.ts]
backfill_ran: false
deviations: []
```
