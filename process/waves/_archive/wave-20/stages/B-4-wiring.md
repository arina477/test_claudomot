# Wave 20 — B-4 Wiring
```yaml
typecheck_passed: true     # repo turbo
build_passed: true         # repo turbo (vite — Dexie lazy/guarded, no IndexedDB at build)
deps: [dexie@4 (web), fake-indexeddb@6 (web -D)]
vitest_fake_indexeddb: "per-test IDBFactory+IDBKeyRange injection (isolation); no global shim"
routes_registered: ["GET /channels/:channelId/messages?after= (B-2)"]
drift_defects: []
```
