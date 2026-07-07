# T-3 — Contract (wave-70) [Pattern A — CI-verified]
API surface: POST /blocks, DELETE /blocks/:blockedUserId, GET /blocks. Shared Zod (CreateBlockSchema/BlockSchema[snake_case]/BlockListResponseSchema) is the single source consumed by api (validation) + web (blockUser/unblockUser/getBlocks) — repo typecheck (CI) proves server↔client alignment (BlockedUsersPanel uses block.blocked_id matching the snake_case DTO — /review confirmed consistent). No OpenAPI codegen (typed shared package IS the contract).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["repo typecheck run 28838467304 proves shared blocks.ts ↔ api/web alignment"]
findings: []
```
