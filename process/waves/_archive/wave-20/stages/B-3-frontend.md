# Wave 20 — B-3 Frontend (Dexie offline store + outbox + offline composer)
```yaml
files: [features/sync/db.ts (StudyHallDB: messages [channelId+createdAt], channels, outbox [state+createdAt]; lazy/guarded singleton + injectable IDBFactory+IDBKeyRange), features/sync/cache.ts (read-through cache + offline fallback), features/sync/outbox.ts (enqueue stable-key-once + drain sequential oldest-first + retry), useMessages.ts (outbox-backed send, offline composer, reconnect drain+catch-up, cold-start hydration, cache-fallback), auth/api.ts (getMessagesAfter), db.test.ts + outbox.test.ts]
deps_added: [dexie@4, fake-indexeddb@6 (-D)]
exactly_once: "outbox.test.ts 8 tests — N-in-order-exactly-once, replay-same-key-no-dup, partial-drain-resume-no-dup, sequential-ordering-proof (test 6: start:seq-0 end:seq-0 start:seq-1... — would interleave with Promise.all), MAX_ATTEMPTS→failed, retry, empty, failed-skipped. db.test.ts 15 unit (compound-index ordering, state transitions, attachments)."
carries_honored: ["stable key ONCE at enqueue (not per-attempt)", "sequential drain (for...of await, not Promise.all)", "Dexie outbox BACKS optimistic (no separate path)", "composer stays enabled offline", "reconnect drain THEN catch-up getMessagesAfter", "no-CJS-trap (type-only shared)", "lazy/guarded init (no IndexedDB at build)"]
verify: "web typecheck+vite-build clean; biome 0; 174 web tests (+23)"
```
