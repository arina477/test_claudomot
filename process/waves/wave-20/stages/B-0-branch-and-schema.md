# Wave 20 — B-0 Branch & schema
```yaml
branch: wave-20-m4-offline-spine
deps_added: []   # dexie + fake-indexeddb added in B-4 wiring (client)
schema_changed: false   # NO server schema (idempotency UNIQUE + index exist from M3); Dexie client schema = B-3 code
migrations: []
backfill_ran: false
```
- No server migration (the reframe: idempotency exists; forward cursor is a query, not schema). Dexie client schema (StudyHallDB v1) is client code in B-3. Claimed: 92d85e0e + 7332a4b8 + 9a4ab31d + e29f6566.
