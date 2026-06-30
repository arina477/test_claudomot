# Wave 20 — P-3 Plan

## Approach

### Architecture deltas
**Server (apps/api/src/messaging) — minimal (idempotency exists):**
- **Forward catch-up cursor (NEW):** add `GET /channels/:channelId/messages?after=<cursor>&limit=` → forward keyset page (created_at,id `gt` cursor, ASC, oldest-first), channel-membership-gated (canViewChannelById, non-member 403). REUSE the forward-ASC keyset pattern from `listThreadReplies` (messages.service.ts ~L1132) + the existing encode/decodeCursor (L49-56). Add `listMessagesAfter(channelId, cursor, limit)` to messages.service + the controller route. Tombstone-excluded.
- **Idempotency contract lock (NO new code, +test):** the existing createMessage ON CONFLICT(channel_id, idempotency_key) + replay-refetch IS the exactly-once contract. Add a test asserting a repeat (channel_id, idempotency_key) POST returns the canonical existing message (no dup row) — lock it as a binding contract. Document in the controller.

**Client (apps/web/src/features/sync — NEW offline store):**
- **Dexie StudyHallDB (db.ts):** per the SDK-doc — `messages` (id pk, [channelId+createdAt] idx), `channels` (id pk), `outbox` (++id, idempotencyKey, [state+createdAt] idx). version(1).stores. Lazy/guarded singleton (typeof indexedDB) + constructor-injectable IDBFactory for tests.
- **Cached reads:** a thin cache layer — on successful message/channel GET, write-through to Dexie; the message/channel read hooks fall back to the Dexie cache when offline/fetch-fails (no blank view). Wire into the existing useMessages/channel-list read path (read-through cache, network-first → cache-fallback).
- **Outbox (sync/outbox.ts):** enqueue(message) → write outbox row (pending) + stable idempotency_key; drain() → query [state+pending] oldest-first, SEQUENTIALLY POST each (idempotency_key), success→delete+reconcile, fail→attempts++/state=failed; runs on reconnect (online event + socket reconnect). Catch-up: on reconnect, GET ?after=<last-seen> to pull missed messages.
- **Composer integration:** the existing optimistic send (useMessages, wave-13/18/19) now BACKS its optimistic state with the Dexie outbox — send writes outbox(pending) + optimistic render; composer stays enabled offline (no error on offline send). Reconnect drain reconciles (dedup by id, like the M3 echo). No separate send path.

### Data model
- **Server:** NO schema change (idempotency UNIQUE + index exist from M3). 
- **Client:** IndexedDB via Dexie schema v1 (messages/channels/outbox). No migration file (client-side store).

### API / deps
- NEW: `GET /channels/:channelId/messages?after=` (forward cursor). NEW client deps: `dexie@4` + `dexie-react-hooks`? (optional — plain async wrapper acceptable) + `fake-indexeddb@6` (-D). NO founder cred-ask (client-side). SDK-doc: SDK-Docs/Dexie.

### Frontend
- apps/web/src/features/sync/{db.ts (Dexie schema), cache.ts (read-through cache), outbox.ts (enqueue/drain), index.ts}; apps/web/src/shell/{useMessages.ts (outbox-backed send + reconnect drain + catch-up), messagingSocket.ts or a connection hook (reconnect → drain trigger), channel-list read hook (cache-fallback)}; apps/web/src/auth/api.ts (getMessagesAfter).

## Plan
### File-level steps (by B-stage)
**B-1 Schema:** SKIP (no server schema; Dexie schema is client code in B-3). Record skip.
**B-2 Contracts** (typescript-pro): packages/shared/src/messaging.ts — forward-list response/after-cursor param (reuse list shape); OutboxItem + CachedMessage/CachedChannel client types (in features/sync or shared).
**B-3 Backend** (backend-developer): 
| messages.service.ts | modify | listMessagesAfter (forward ASC keyset, reuse listThreadReplies pattern) |
| messages.controller.ts | modify | GET /channels/:channelId/messages?after= (canViewChannelById 403) |
| messages.service.spec.ts | modify | idempotency-contract lock test (repeat key → canonical msg, no dup) + forward-cursor tests (after=, ASC, 403, malformed) |
**B-4 Frontend** (react-specialist + frontend-developer): Dexie db.ts + cache.ts + outbox.ts (features/sync); useMessages outbox-backed send + reconnect drain + catch-up; channel/message read cache-fallback; api.getMessagesAfter; connection/reconnect trigger.
**B-5 Wiring:** deps added (dexie + fake-indexeddb); vitest setup for fake-indexeddb (per-test IDBFactory); repo typecheck + build + boot-probe.
**B-6:** head-builder gate (+ Phase-2 /review — rule-4 on the new ?after= route + the exactly-once spine).

### Specialist routing (vs AGENTS.md): typescript-pro, backend-developer, react-specialist, frontend-developer — present.

### Parallelization: B-2 → B-3 (server) ∥ B-4 (client Dexie store) after contracts; outbox-integration (B-4) depends on the Dexie store + the forward cursor. The fake-indexeddb test harness (e29f6566) lands with B-4/B-5.

### Self-consistency sweep
1. Every AC → step: idempotency-lock + forward-cursor (B-3); Dexie store + cached reads (B-4 db/cache); outbox enqueue/drain + offline composer (B-4 outbox + useMessages); fake-indexeddb unit+integration exactly-once (B-4/B-5 tests). ✓
2. Specialist each step. ✓ 3. No file in two parallel batches. ✓ 4. design_gap FALSE → D skips. ✓ 5. Reframe honored (no idempotency rebuild; bind + forward-cursor). ✓ 6. Contracts concrete. ✓ 7. New deps dexie+fake-indexeddb (SDK-doc present). ✓ 8. SDK-research done (Dexie). ✓

### B-block carries (P-4 will confirm)
- **REFRAME:** server idempotency EXISTS — B-3 does NOT rebuild it (lock-test + forward-cursor only).
- **Forward cursor reuse:** listMessagesAfter mirrors listThreadReplies ASC/gt keyset (don't invent a new cursor scheme).
- **Rule-4 (BUILD-PRINCIPLES rule 4):** the new GET ?after= route is a channel-authz boundary → B-6 Phase-2 MUST reproduce a non-member 403 negative-path test.
- **Exactly-once + in-order (GATING AC, ceo-reviewer):** the outbox drain is SEQUENTIAL oldest-first; reconnect replay dedups via the existing ON CONFLICT; fake-indexeddb integration test PROVES exactly-once + in-order + no-data-loss + partial-drain-resume.
- **Dexie gotchas (SDK-doc):** no non-Dexie await in db.transaction; never lower schema version; sequential drain (not Promise.all); per-test IDBFactory isolation.
- **OUT:** connection-state-indicator/pending-UI/catch-up-history-UI (2nd M4 wave); CRDT/service-worker/multi-device.
