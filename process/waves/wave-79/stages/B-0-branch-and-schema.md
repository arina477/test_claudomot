# Wave 79 — B-0 Branch & schema

- **Branch:** wave-79-e2e-dm-encryption (off main). Tasks 60bda5be+491cb85d+3fb88f44 → in_progress (UPDATE 3).
- **Env/deps:** none (Web Crypto native; dexie already present).
- **Schema (postgres-pro, 2 migrations):**
  - `0031_wave79_user_encryption_keys.sql` (commit 48cd772): user_encryption_keys — id uuid PK, **user_id text NOT NULL UNIQUE FK → users.id** (P-4 correction: text not uuid; no-cascade matching dominant users-FK pattern), public_key text, algorithm text, created_at/updated_at. NO private-key column. No pgEnum.
  - `0032_wave79_dm_envelope.sql` (commit fe52628): dm_messages — **content NOT NULL dropped (nullable)**; +ciphertext text, +sender_key_ref text, +envelope_version integer, **+deleted_at timestamptz** (tombstone, mirrors messages.deleted_at — none existed). UNIQUE(conversation_id, idempotency_key) preserved.
- **Local apply deferred** (no local postgres server — pg client only, known env limit). Verified by inspection + snapshot. **Prod: applied MANUALLY at C-2 (db:migrate before api deploy).**
- **Expected consumer breakage → B-2 follow-up:** content→nullable surfaces 3 tsc errors in dm.service.ts (~L482/648/763; content now string|null). B-2 must handle null-content DTO mapping (incl. the listConversations "Encrypted message" preview placeholder per P-4 correction 3). Not B-0 scope.

```yaml
branch: wave-79-e2e-dm-encryption
deps_added: []
env_vars_added: []
schema_skipped: false
migrations: [apps/api/drizzle/migrations/0031_wave79_user_encryption_keys.sql, apps/api/drizzle/migrations/0032_wave79_dm_envelope.sql]
orm_models_changed: [apps/api/src/db/schema/users.ts, apps/api/src/db/schema/dm.ts]
backfill_ran: false
deviations: ["local migrate deferred (no local pg server); prod at C-2", "content-nullable surfaces 3 dm.service.ts tsc errors — B-2 null-content DTO handling follow-up"]
```
