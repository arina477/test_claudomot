# Wave 75 — B-0 Branch & schema

- **Branch:** `wave-75-mock-billing` (off main @ 73732e8).
- **Tasks claimed:** 3/3 → in_progress (4bc40741, 69765cee, 77665ee5) attached to wave 75 (UPDATE 3).
- **Env:** no new env vars (mock billing; real Stripe keys fenced, rule 6).
- **Deps:** none added (no Stripe SDK — fenced).
- **Schema:** SKIPPED — no migration. Tier changes reuse the wave-74 `subscriptions` table (migration 0029, UNIQUE(server_id)) via upsert `ON CONFLICT (server_id) DO UPDATE`. No DDL, no backfill, no ORM model change.

```yaml
branch: wave-75-mock-billing
deps_added: []
env_vars_added: []
schema_skipped: true
migrations: []
orm_models_changed: []
backfill_ran: false
deviations: []
```
