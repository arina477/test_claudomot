# Wave 28 — B-0 Branch & schema

## Actions
- **Action 0 — manifest:** seeded `process/waves/wave-28/blocks/B/review-artifacts.md`.
- **Action 1 — claim:** `d058283d` flipped `todo → in_progress`, `wave_id` = wave-28 (02c97a51). RETURNING = 1 row (matches the 1-id bundle). No shortfall.
- **Action 2 — branch:** `wave-28-invite-rotate` created from `main` @ 2182380 (up to date with origin/main). No branch collision.
- **Action 3 — env:** no new env vars (P-3 declares none). Skip.
- **Action 4 — deps:** no new deps / no SDK (P-3 declares none). Skip.
- **Actions 5–8 — schema:** **SKIP.** P-3 "Data model" = no schema change / no migration (writes the existing `servers.invite_code` UNIQUE column in place). `schema_skipped: true`.

```yaml
branch: wave-28-invite-rotate
deps_added: []
env_vars_added: []
schema_skipped: true
migrations: []
orm_models_changed: []
backfill_ran: false
deviations: []
```

## Exit
Branch current, task claimed in_progress, no env/dep/schema work → B-1.
