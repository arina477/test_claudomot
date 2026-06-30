# Wave 18 — V-1 Summary
- **Karen APPROVE** — 6/6 VERIFIED. Load-bearing: createReply transactional (messages.service.ts:769) + isNewInsert idempotency guard (L790/819, no double-count); delete ALWAYS-decrement GREATEST(-1,0) + tail-only recompute; listThreadReplies ASC tombstone-excluded; IDOR parent-derived canViewChannelById(authorId, parent.channel_id) L751+L877 (3 tests assert parent-channel arg); realtime thread:reply:created L242 distinct from message:new L166 + T-5 live two-client PASS; migration 0008 additive; frontend hide@0 + outbox idempotency reuse. INDEPENDENT LIVE PROBE: thread routes 401, bogus 404 → routes registered+auth-guarded live. Non-blocking: O-1 (useThread reimplements sendReply in parallel vs calling useMessages.sendMessage — shared OptimisticMessage type + identical idempotency contract, substance met; future convergence), O-2 (brain DSN can't query app DB → migration verified indirectly via live 201s + route probe).
- **jenny APPROVE** — 14/14 ACs MATCH, no drift. One-level server-enforced; nested/following/notifications/unread OUT (no creep); M3 correctly NOT closed (attachments remain); 2-namespace lock honored; BOARD threads-first honored. thread:reply:deleted = faithful AC4 extension, not creep.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
findings: []   # 0 blocking
```
