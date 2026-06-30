# Wave 20 — B-1 Contracts
```yaml
files: [packages/shared/src/messaging.ts, index.ts]
added: ["MessagesAfterResponse {items: MessageResponse[], nextCursor?} (forward catch-up; distinct shape from backward MessageList {messages[]})", "after query param"]
note: "client OutboxItem/CachedMessage/CachedChannel authored in B-3 with the Dexie store"
shared_build: clean
```
