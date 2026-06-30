# V-1 Semantic-Spec Verification — jenny — Wave 20 (M4 offline-first SPINE)

**Verdict: APPROVE** (with one Medium drift logged for V-2 triage — does not block the gating AC or the wave's milestone-leg claim)

**State verified:** main @ `bff9f12` + `a7bcc1f` (T-block) — MERGED + LIVE. Specs read from DB tasks `92d85e0e` (multi-spec head), `7332a4b8`, `9a4ab31d`, `e29f6566`; M4 milestone prose. Suites re-run live: api `messages.service.spec` 66/66 green, web `features/sync` 25/25 green.

---

## Per-AC verdicts

### Task 92d85e0e — bind idempotency + forward catch-up cursor

| AC | Verdict | Evidence |
|---|---|---|
| AC1 — ON CONFLICT(channel_id, idempotency_key) send path documented + GUARANTEED via test; repeat key → canonical existing msg, no dup; **not rebuilt** | **MATCHES** | Existing path unchanged: `messages.service.ts:481-537` (`onConflictDoNothing` target `[channel_id, idempotency_key]` → re-fetch existing on replay). Lock test `messages.service.spec.ts:260` "returns the existing message on idempotency key replay (no dup)" asserts `first.id === second.id`. Reframe honored — no schema change, no rebuild. |
| AC2 — NEW `GET /channels/:id/messages?after=<cursor>` ASC keyset, oldest-first, channel-membership-gated (403 non-member), reuses listThreadReplies ASC pattern (NOT listMessages DESC) | **MATCHES** | `listMessagesAfter` `messages.service.ts:1482-1532` — `ORDER BY created_at ASC, id ASC`, `> ` keyset. Controller `messages.controller.ts:108-122` `@Get()` + `@UseGuards(AuthGuard, ChannelMessageGuard)` (403 non-member); `?after=` takes precedence over `?cursor=`. Limit clamp 1..100. |
| AC3 — opaque base64(created_at\|id) cursor, ASC tiebreak on id, excludes tombstoned | **MATCHES (server)** | Reuses shared `encodeCursor/decodeCursor` `messages.service.ts:51-68` (base64url `created_at\|id`); `is_deleted=false` filter `:1505,:1522`; id tiebreak `:1510,:1515`. Tests: after-page, HEAD→empty, no-cursor first page, malformed→400, tombstone-excluded, limit (`messages.service.spec.ts:2347-2500`). *(Client-side cursor mis-seed → see DRIFT below; the server contract itself MATCHES.)* |

### Task 7332a4b8 — Dexie IndexedDB store

| AC | Verdict | Evidence |
|---|---|---|
| AC1 — Dexie StudyHallDB, 3 tables (messages `[channelId+createdAt]`, channels, outbox `++id` + `[state+createdAt]`), versioned schema | **MATCHES** | `db.ts:63-67` `version(1).stores` exactly as specced. Types `types.ts` (CachedMessage = MessageResponse & {cachedAt}; CachedChannel; OutboxItem {id,channelId,idempotencyKey,content,attachments?,state,createdAt,attempts}). |
| AC2 — cache-on-fetch; offline/fetch-fail reads from Dexie (no blank view) | **MATCHES** | `cache.ts` write-through (`putCachedMessages`/`putCachedChannel`); `useMessages.ts:208-241` network-first then `.catch → getCachedMessages` offline fallback. |
| AC3 — lazy/guarded singleton (`typeof indexedDB`), injected IDBFactory for tests | **MATCHES** | `db.ts:75` guarded singleton (null when IDB absent); constructor co-injects `idbFactory + idbKeyRange` per SDK-doc `db.ts:31-41`. |

### Task 9a4ab31d — outbox enqueue + offline composer

| AC | Verdict | Evidence |
|---|---|---|
| AC1 — composer generates stable idempotency_key + writes outbox (pending) backing the optimistic render, no separate path | **MATCHES** | `outbox.enqueue` `outbox.ts:58-79` generates key once; `useMessages.ts:19-25,33-35` wires outbox into the existing optimistic path. |
| AC2 — composer stays ENABLED offline; enqueue pending, no error/block | **MATCHES** | sendMessage enqueues → optimistic pending; offline send does not throw (durable queue backs it). |
| AC3 — reconnect drains OLDEST-FIRST, SEQUENTIAL, dedup on success, failed after retries; replay dedups server-side → EXACTLY ONCE | **MATCHES** | `outbox.drain` `outbox.ts:132-201` — `[state+createdAt]` snapshot + id-tiebreak sort, sequential `await` (not Promise.all), stop-on-failure preserves order, re-entrancy guard `:107-148`, MAX_ATTEMPTS→failed, `onDelivered/onFailed` reconcile. |
| AC4 — reconnect also catch-up via `GET ?after=<last-seen cursor>` | **PARTIAL / DRIFTS** | Wiring present (`useMessages.ts:96-152` drain-then-catch-up on socket-reconnect + window-online). **But the cursor passed is mis-formatted** — see DRIFT-1. The drain (exactly-once+in-order) half is correct; the `?after=` catch-up half 400s and is silently swallowed. |

### Task e29f6566 — fake-indexeddb test harness (GATING AC)

| AC | Verdict | Evidence |
|---|---|---|
| AC1 — fake-indexeddb UNIT tests (per-test IDBFactory) for cache + outbox + `[state+createdAt]` ordering | **MATCHES** | `db.test.ts` 15 tests (oldest-first index, enqueue, loadPending pending-only, attachments, delete, idempotencyKey index). |
| AC2 — INTEGRATION exactly-once + in-order spine (**the gating AC**): N enqueue→drain in order each once; replay no-dup; partial-drain resume no-dup; failed→failed+retry | **MATCHES** | `outbox.test.ts` 10 tests, `describe('outbox drain — exactly-once + in-order (gating proof)')`: in-order N-POST each once; replay same-id no-dup; stop-on-failure ordering (`:189`, later msg never sent ahead of earlier un-sent); concurrent-drain each-once (`:497`); MAX_ATTEMPTS→failed; retry; sequential POST[i+1]-after-POST[i]; identical-createdAt id-tiebreak. |
| AC3 — deterministic (fresh IDBFactory, no real timers); covers M4 metric (no-loss, exactly-once, in-order) | **MATCHES** | Per-test fresh IDBFactory; no sleeps; metric's exactly-once+in-order half proven. |

---

## DRIFT-1 (Medium) — catch-up cursor format mismatch (client)

**Source conflict:** 92d85e0e AC3 ("opaque base64(created_at\|id)") + 9a4ab31d AC4 ("catch-up via `?after=<last-seen cursor>`").

`lastSeenCursorRef.current` is seeded with a **raw `createdAt` ISO string** at every assignment — `useMessages.ts:146, 216, 235, 295` — never with the server's opaque cursor. It is then passed to `api.getMessagesAfter(channelId, cursor)` (`:129`) → server `?after=` → `decodeCursor` (`messages.service.ts:55-68`) base64url-decodes and requires a `|` separator. A raw ISO string decodes to non-`|` garbage → `decodeCursor` returns null → server throws `BadRequestException` 400. The client wraps catch-up in `try/catch` treating failure as "non-fatal" (`useMessages.ts:150-151`), so it **fails silently every time**.

The correct opaque cursor (`result.nextCursor` from `listMessages`) IS available but is only used for backward pagination (`:213, :418`); it is not routed into `lastSeenCursorRef`.

**Impact:** the `?after=` catch-up leg never executes successfully in production. Missed-while-offline messages are instead recovered by the socket `message:new` stream after reconnect (`:288-303`), so there is a fallback — but the spec'd keyset catch-up path is non-functional. No test catches it: web integration tests mock `getMessagesAfter` and never round-trip a real cursor through `decodeCursor`; the server cursor test uses a server-encoded cursor, not the client-synthesized one.

**Why Medium not Critical:** the GATING AC (exactly-once + in-order on reconnect, e29f6566 AC2) is fully proven and unaffected; the outbox spine and idempotency contract are correct. Catch-up has a working socket fallback. Recommend V-2 route to a frontend specialist for a one-line-ish fix (seed `lastSeenCursorRef` from `result.nextCursor` / a client encoder, + a real-cursor round-trip test). @task-completion-validator to confirm catch-up after fix.

---

## Scope / split discipline

- **Spine-first split clean + in-milestone:** YES. Wave delivers idempotency-bind + forward-cursor + Dexie store + offline composer + fake-indexeddb tests; explicitly DEFERS (2nd M4 wave) connection-state indicator UI, pending/failed UI polish, catch-up history UI — all of which are M4 `## Scope` items, so the split is *within* the milestone, not under-shipping the wave. Not drift.
- **Behavioral half of the M4 metric proven this wave:** YES — "keep reading cached channels" (cache fallback) + "on reconnect every queued message sends exactly once in order" (gating proof). Metric is reachable across the 2 waves; the remainder is UI surfacing.
- **REFRAME consistent with M4 scope:** YES. M4 says "outbox queue w/ idempotency keys" + "replay as idempotent POST". Server idempotency pre-existed (wave-13 ON CONFLICT); binding it + adding the genuinely-absent forward cursor is the correct seed, not a rebuild.
- **No scope creep:** CRDT / conflict-resolution / service-worker background-sync / multi-device / offline-for-all-entities all OUT (milestone-deferred). Confirmed absent.
- **Deps match milestone verbatim:** YES — `dexie@4` + `fake-indexeddb@6`; M4 names "IndexedDB local store" and "fake-indexeddb" verbatim. Client-side, no founder cred-ask (correct).
- **Correctly NOT claiming M4 complete:** YES — spec body marks this "First M4 wave" / multi-wave; second M4 wave carries the UI.
