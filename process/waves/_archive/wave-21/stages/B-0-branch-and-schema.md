# Wave 21 — B-0 Branch & schema
```yaml
branch: wave-21-m4-offline-ux
deps_added: []
schema_changed: false   # frontend-only; no server/Dexie schema change (reuse wave-20 store)
migrations: []
```
- Frontend-only (live connection-state wiring + catch-up loop + tests). No schema, no server, no new dep. B-1/B-2 SKIP. Claimed: c1dbee64 + 94e41695 + 2fe6b517.
