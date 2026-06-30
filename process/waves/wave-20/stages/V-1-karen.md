# V-1 — Karen source-claim verification (wave-20 M4 offline-first spine)

```yaml
stage: V-1
reviewer: karen
verdict: APPROVE
scope: merged main @ a7bcc1f (PR#32 squash bff9f12), LIVE (api-production-b93e, web-production-bce1a8)
claims_verified: 7
claims_wrong: 0
claims_unverified: 0
load_bearing_all_pass: true   # exactly-once+in-order proven, idempotency-not-rebuilt, rule-4 — all VERIFIED
```

## Verdict: APPROVE

The wave delivers a genuine offline-send spine. The load-bearing claims
(exactly-once + in-order genuinely proven; idempotency NOT rebuilt; rule-4 on
`?after=`) are all VERIFIED with mutation-sensitive tests, not theater. No
claimed-but-not-built, no gold-plating, deps present, live deploy serves the new
branch behind auth.

## Per-claim

### Claim 1 — EXACTLY-ONCE + IN-ORDER spine REAL (the wedge): VERIFIED
- Stable key once-at-enqueue: `outbox.ts:64` — `crypto.randomUUID()` inside `enqueue()`, NOT inside `drain`/retry. `retryOutboxItem` (`outbox.ts:209-214`) resets `state/attempts` only, never the key. Key is carried verbatim on every replay POST (`outbox.ts:176-182`).
- Sequential oldest-first: `_drainImpl` snapshots `[state+createdAt]` keyset (`outbox.ts:159-162`) then sorts createdAt then `id` tiebreak (`outbox.ts:164-169`) and `await`s each send in a `for` loop (`outbox.ts:171-200`) — no `Promise.all`.
- STOP-on-failure: `outbox.ts:195-198` `return` inside catch halts the loop; later items stay pending — a later message can never send ahead of an earlier un-sent one.
- Re-entrancy guard: `_drainInFlight` module-level promise (`outbox.ts:107,139-147`) — concurrent callers get the in-flight promise, no second overlapping snapshot.
- Tests are mutation-sensitive, not theater:
  - Test 1 (`outbox.test.ts:78-128`): asserts `calls.map(idempotencyKey)` equals the exact enqueue order AND `delivered` length 4 — order + exactly-once.
  - Test 3 stop-on-failure (`outbox.test.ts:170-303`): across 3 drains asserts `key2PostCount === 0` and `key0PostCount === 1` — a later item is provably never POSTed ahead of a stuck earlier one. This is the wedge assertion and it is real.
  - Test 6 (`outbox.test.ts:~430`): `orderLog` proves `start/end` interleave is strictly sequential, would fail under `Promise.all`.
  - Test 9 (`outbox.test.ts:~495`): two concurrent `drain()` → `calls` length 3, all distinct, `delivered` equals keys — re-entrancy proven.
  - Test 10 (`outbox.test.ts:~540`): identical `createdAt` → drained in ascending auto-increment id order.

### Claim 2 — Idempotency NOT rebuilt (reframe): VERIFIED
- The `ON CONFLICT(channel_id, idempotency_key) DO NOTHING` + canonical re-fetch already existed (M3); `createMessage` (`messages.service.ts:486-563`) is unchanged structurally. The wave added a LOCK TEST, not new idempotency: `messages.service.spec.ts:260-291` "returns the existing message on idempotency key replay (no dup)" asserts `first.id === second.id`. Commit `0691638` is "B-1/B-2 forward catch-up cursor + idempotency-contract lock" — bind, not rebuild. No schema migration shipped (confirmed: deploy `NO migration`).

### Claim 3 — Forward cursor: VERIFIED
- `listMessagesAfter` (`messages.service.ts:1482-1561`): ASC keyset (`ORDER BY created_at ASC, id ASC`, `messages.service.ts:1515`), `created_at > cursor OR (= AND id >)` gt-keyset (`messages.service.ts:1506-1512`) — mirrors `listThreadReplies` (`messages.service.ts:1198`), NOT `listMessages` DESC/lt (`messages.service.ts:1404`). Tombstones excluded: `eq(messages.is_deleted, false)` on both branches (`messages.service.ts:1505,1522`). Opaque base64url `created_at|id` via shared `encodeCursor/decodeCursor` (`messages.service.ts:51-68`). Malformed cursor → `BadRequestException` 400 (`messages.service.ts:1494-1496`). Service tests at `messages.service.spec.ts:2347+` cover ASC/HEAD-empty/absent/malformed/tombstone.

### Claim 4 — rule-4 on `?after=`: VERIFIED
- Shared `@Get()` carries `@UseGuards(AuthGuard, ChannelMessageGuard)` (`messages.controller.ts:108-109`); the `?after=` branch dispatches inside that same guarded handler (`messages.controller.ts:121-123`) — so the forward path is membership-gated identically to the list path. Guard reads channelId from route params only, default-deny (`channel-message.guard.ts:54-66`).
- Tautological service-spec test DELETED + real guard.spec covers it: commit `69ac8c1` "replace tautological ?after= 403 test with real guard coverage". `channel-message.guard.spec.ts` has genuine coverage — non-member 403 (`makeRbacMock(false)`), IDOR-safe (asserts guard called with ROUTE param `real-channel`, NOT body `attacker-channel`), missing-param 403, missing-session 403. T-8 evidence corroborates ("tautological test deleted").

### Claim 5 — Dexie store real: VERIFIED
- `StudyHallDB` (`db.ts:26-69`): 3 tables `messages/channels/outbox` with compound indexes `[channelId+createdAt]`, `[state+createdAt]` (`db.ts:63-67`). Lazy/guarded singleton: `typeof indexedDB !== 'undefined' ? new StudyHallDB() : null` (`db.ts:75`). Injected IDBFactory+IDBKeyRange for tests (`db.ts:31-41`). Read-through cache with offline fallback: `cache.ts` write-through (`putCachedMessages`) + `useMessages.ts:226-242` `.catch()` reads `getCachedMessages` on fetch-fail. Outbox BACKS the existing optimistic path — `sendMessage` enqueues then renders optimistic then drains, no separate send (`useMessages.ts:460-509`).

### Claim 6 — Single send path: VERIFIED
- `sendMessage` happy path: `enqueue` → optimistic render → `drain` (`useMessages.ts:465-508`). No direct POST overlaps drain. The two direct-`api.sendMessage` calls are mutually-exclusive fallbacks, not overlap: (a) the `enqueue().catch()` branch (`useMessages.ts:510-548`) fires only when IDB enqueue failed (nothing in outbox to drain); (b) the `db === null` branch (`useMessages.ts:549-587`) when no outbox exists. `retryMessage` (`useMessages.ts:593-640`) resets/deletes the outbox row before its POST. Post-H3-fix comment at `useMessages.ts:462-463` documents the double-send race is closed.

### Claim 7 — Antipatterns / gold-plating / live / deps: VERIFIED
- No claimed-but-not-built: every claimed artifact exists at the cited path.
- No gold-plating: grep for `crdt|service-worker|multi-device|background-sync|yjs|automerge` across `features/sync/` and `messages.service.ts` → zero hits. Out-of-scope items correctly absent.
- Live deploy serves `?after=`: `GET …/messages?after=abc` returns **401** (not 404) — route exists, auth-gated; list branch also 401. Forward branch is live and guarded.
- Deps present: `dexie@^4.4.4` + `fake-indexeddb@^6.2.5` in `apps/web/package.json`.

## Notes (non-blocking, not REWORK)
- N1 (Low): the drain `onDelivered` reconciliation in `useMessages.ts:105-111,488-495` deliberately does NOT add the confirmed message — it relies on the socket `message:new` to add it (cache write-through happens there). Correct for online drain; on a drain that succeeds while the socket is momentarily down, the optimistic row is removed and the real row appears only on next socket delivery / catch-up. Acceptable given catch-up exists; flag as a UX-polish item for the 2nd M4 wave (pending/failed UI is already deferred out).
- N2 (Low): `MAX_ATTEMPTS=3` is hard-coded (`outbox.ts:45`). Fine for spine; no config needed this wave.
```
