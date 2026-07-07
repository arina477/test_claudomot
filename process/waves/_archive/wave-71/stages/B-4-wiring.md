# B-4 — Wiring (wave-71)
Repo typecheck (pnpm typecheck, all 3 packages) 4/4 EXIT 0. No B-2↔B-3 drift (BlockListItem shared shape consumed by both api enriched response + web render). No new route (BlockedUsersPanel + member affordance are existing surfaces enriched). No new env. GET /blocks enriched response wired (BlockListResponse → BlockListItem[] → useBlocks → both surfaces).
```yaml
typecheck_passed: true
routes_registered: []   # no new route; GET /blocks response shape enriched (existing route)
env_vars_wired: []
drift_defects: []
```
