# Wave 18 — B-2 Backend
```yaml
files: [messages.service.ts, messages.controller.ts (ThreadsController), messaging.gateway.ts, messaging.module.ts, messages.service.spec.ts]
createReply: "db.transaction (createServer pattern); pre-flight validate parent (404 not-found / 400 cross-channel / 400 reply-of-reply / 409 deleted-parent); INSERT ON CONFLICT(channel_id,idempotency_key) DO NOTHING RETURNING → isNewInsert guard (idempotent retry re-fetches, NO double-count); same-txn reply_count++ + last_reply_at only when isNewInsert"
deleteReply: "reply → txn; reply_count = GREATEST(-1,0) ALWAYS; last_reply_at recompute MAX(live) ONLY when deleted was tail (createdAt===parent.lastReplyAt), else unchanged; NULL when none left"
listThreadReplies: "WHERE thread_parent_id=parent AND not-deleted ORDER BY created_at ASC, cursor-paginated → ThreadRepliesResponse"
realtime: "thread.reply.created (EventEmitter2) → gateway handleThreadReplyCreated → channel:<id> room as thread:reply:created (distinct from message:new); payload {parentId, channelId, reply}"
routes: ["POST /messages/:parentId/replies?channelId=", "GET /messages/:parentId/replies?cursor=&limit="]
rowToDto: "extended threadParentId/replyCount/lastReplyAt (sole DTO site)"
tests: "305 pass (+13 wave-18); typecheck+shared-build+biome clean"
```
