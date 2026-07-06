# B-1 Contracts — wave-65 (SKIP)
No shared/Zod/OpenAPI/SDK contract change. The wave REUSES existing `ServerSummary`/`ServerDetail` from `@studyhall/shared` (packages/shared/src/servers.ts, unchanged). The new CachedServer/CachedServerDetail are CLIENT-internal Dexie types (apps/web/src/features/sync/types.ts) authored in B-3, not shared contracts.
Fast-path: N/A (B-2 backend also skips — no parallelization benefit; B-3 runs alone).
```yaml
skipped: true
contracts_authored: []
sdk_regenerated: false
fast_path_approved: false
deviations: []
```
