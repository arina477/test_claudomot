# Wave 20 — B-2 Backend
```yaml
forward_cursor: "listMessagesAfter — ASC keyset (created_at ASC, id ASC, (created_at,id) > decode(cursor)) mirroring listThreadReplies (NOT listMessages DESC); tombstone-excluded; reuses encode/decodeCursor; → MessagesAfterResponse {items, nextCursor}"
route: "GET /channels/:channelId/messages?after=<cursor>&limit= — dispatched in the existing @Get() handler (?after= present → listMessagesAfter; else backward listMessages); ChannelMessageGuard authz (non-member 403); existing ?cursor= backward path unchanged"
idempotency: "NO new prod code (ON CONFLICT exists from M3). LOCK TEST: repeat (channelId, idempotencyKey) → 2nd call returns SAME message id (no dup row) + identical DTO — binding exactly-once contract the outbox relies on"
tests: "347 pass (+9: forward after=ASC/HEAD-empty/malformed-400/non-member-403 + idempotency-lock x2); typecheck+shared-build+biome clean"
```
