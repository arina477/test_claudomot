# Wave 18 — B-1 Contracts
```yaml
files: [packages/shared/src/messaging.ts, packages/shared/src/index.ts]
added: ["MessageResponse += threadParentId?/replyCount?/lastReplyAt?", "ThreadRepliesResponse {items, nextCursor?}", "ThreadReplyEvent {parentId, channelId, reply}", "event const thread:reply:created (distinct from message:new)"]
shared_build: clean
```
