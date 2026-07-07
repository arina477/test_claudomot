# T-3 — Contract (wave-71) [Pattern A — CI-verified]
Contract delta: enriched GET /blocks — BlockListItemSchema (BlockSchema + nested blockedUser {userId, displayName, username?, avatarUrl?}, mirrors ServerMemberSchema); BlockListResponseSchema.blocks → BlockListItem[]. BlockSchema (POST return) unchanged. Shared Zod consumed by api (listBlocks enriched projection) + web (useBlocks/BlockedUsersPanel read blockedUser.*, MemberListPanel builds blockedSet from blocked_id) — repo typecheck (CI) proves alignment; /review confirmed casing (snake block fields + nested camel blockedUser).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["repo typecheck run 28842513359 proves BlockListItem ↔ api/web alignment"]
findings: []
```
