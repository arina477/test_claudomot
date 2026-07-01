# Wave 29 — B-0 Branch & schema

## Actions
- **Action 0 — manifest:** seeded `blocks/B/review-artifacts.md`.
- **Action 1 — claim:** `d23a0740` flipped `todo → in_progress`, `wave_id` = wave-29 (92df2295). RETURNING = 1 row (matches 1-id bundle).
- **Action 2 — branch:** `wave-29-presence-members-debt` created from `main` @ 104ac6d. No collision.
- **Action 3 — env:** none. **Action 4 — deps:** none. Skip.
- **Actions 5–8 — schema:** **SKIP.** No DB migration (part 1 is a backend operator fix; part 2 is a shared-package Zod schema deletion, not a DB change). `schema_skipped: true`.

```yaml
branch: wave-29-presence-members-debt
deps_added: []
env_vars_added: []
schema_skipped: true
migrations: []
orm_models_changed: []
backfill_ran: false
deviations: []
```

## Exit
Branch current, task claimed in_progress, no env/dep/schema → B-1 (Contracts FIRES — schema deletion).
