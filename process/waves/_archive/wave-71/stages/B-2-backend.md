# B-2 — Backend (wave-71)
Specialist: backend-developer. listBlocks LEFT JOIN users (blocked_id=users.id) → enriched BlockListItem; rowToListItemDto (separate builder, bare Block/rowToDto unchanged for POST/conflict-fetch); blockedUser.displayName = display_name ?? username ?? 'Unknown user' (never UUID); no-IDOR (WHERE blocker_id=session) unchanged; createBlock/removeBlock/isBlockedBetween/5 DM HIDE seams UNTOUCHED. GET /blocks return type → BlockListResponse (BlockListItem[]). 3 integration tests (real name / username fallback / Unknown user). typecheck+biome clean. No deviation. No schema/migration.
```yaml
skipped: false
specialists_spawned: [backend-developer]
files_implemented: [apps/api/src/blocks/blocks.service.ts, apps/api/test/integration/blocks.integration.spec.ts]
deviations: []
simplify_applied: true
```
