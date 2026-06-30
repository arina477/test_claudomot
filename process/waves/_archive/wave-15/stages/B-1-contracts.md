# Wave 15 — B-1 Contracts
```yaml
skipped: false
contracts_authored: [packages/shared/src/messaging.ts (MentionRefSchema, MessageResponse.mentions[], MyMentionsResponseSchema), packages/shared/src/index.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: []
```
MentionRef {userId, username}; MessageResponse += mentions[]; MyMentionsResponse {items, nextCursor?}. Mirrors wave-13 reactions[] additive pattern. Shared typecheck clean.
