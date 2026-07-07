# B-1 — Contracts (wave-71)
Specialist: typescript-pro. packages/shared/src/blocks.ts: NEW BlockedUserDisplaySchema (userId/displayName/username?/avatarUrl? — mirrors ServerMemberSchema), NEW BlockListItemSchema (BlockSchema.extend({blockedUser})), BlockListResponseSchema.blocks → BlockListItem[]. BlockSchema/Block UNCHANGED (POST /blocks return = bare row). Nested blockedUser object (matches DmConversation.participants convention). Shared typecheck exit 0; biome clean. No deviation.
```yaml
skipped: false
contracts_authored: [packages/shared/src/blocks.ts, packages/shared/src/index.ts]
deviations: []
```
