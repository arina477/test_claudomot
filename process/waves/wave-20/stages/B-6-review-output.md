# B-6 Phase-2 Review — wave-20 (M4 offline-first SPINE)

**Branch:** `wave-20-m4-offline-spine` vs `main`
**Mode:** READ-ONLY adversarial review. Wedge = exactly-once + in-order message delivery.
**Diff:** 22 files, +2042/-67. Reviewed: outbox.ts, db.ts, cache.ts, types.ts, useMessages.ts, messages.controller.ts, messages.service.ts (listMessagesAfter + createMessage ON CONFLICT), channel-message.guard.ts, the three spec files.

**Verdict: REWORK.** No Critical. Exactly-once is preserved by the stable key + server ON CONFLICT (the wedge survives), but there are two High findings: (1) a concurrent-drain re-entrancy gap that double-POSTs and, more seriously, can REORDER on the server; (2) the rule-4 403 negative path for the new `?after=` route is only proven by a tautological test in the service spec — though the REAL enforcement is genuinely covered elsewhere (see H2 for the nuance). B-6 re-enters for the High items.

---

## Critical
None. Exactly-once is not broken: `idempotencyKey` is generated once at `enqueue()` (`outbox.ts:64`), persisted in the row (`types.ts:52`), and reused verbatim on every replay (`drain` reads `item.idempotencyKey` at `outbox.ts:130`; retry reuses it at `useMessages.ts:614`). The server dedups via `onConflictDoNothing({ target: [channel_id, idempotency_key] })` with canonical re-fetch on replay (`messages.service.ts:498-516`, `1047-1052`). No path regenerates the key. No IDOR on `?after=` (guard verified — see H2). No data-corruption path found.

---

## High

### H1 — `drain()` has no re-entrancy guard → concurrent drains double-POST AND can reorder on the server
`outbox.ts:109-148`. `drain()` snapshots pending items then POSTs sequentially, but holds no lock/flag. Two triggers fire it independently and can overlap:
- socket `connect` handler → `runDrainAndCatchup` → `drain` (`useMessages.ts:160-163`)
- window `online` handler → `runDrainAndCatchup` → `drain` (`useMessages.ts:172-175`)

On reconnect both events commonly fire together. Drain A snapshots `[item1, item2]`; before A deletes item1, Drain B snapshots the same `[item1, item2]`. Both POST item1 and item2. Two consequences:
1. **Double-POST** (each item sent twice). The stable key + server ON CONFLICT means no duplicate row is created — exactly-once on the DATA holds. So this is High, not Critical.
2. **Reordering risk (the more serious half).** With two interleaved sequential loops the server can receive `item1(A), item1(B), item2(A)...` — but worse, combined with the in-flight POST in `sendMessage` (see H3) and partial-failure semantics (H4), the server's *first-seen* order for distinct messages is no longer guaranteed to match enqueue order. In-order is the second half of the wedge; a re-entrancy guard is the standard fix.

**Fix:** module-level `let draining = false` (or a promise-chain mutex) guarding `drain()`; coalesce overlapping triggers. **No test covers concurrent drains** — `outbox.test.ts` has a sequential-execution test (L348) but nothing fires two `drain()` calls simultaneously. Add a `Promise.all([drain(), drain()])` test asserting each key POSTed exactly once and outbox ends empty.

### H2 — rule-4 403 for the `?after=` route: tautological test in the service spec (the REAL enforcement IS covered, but not where claimed)
`messages.service.spec.ts:2434-2470` ("non-member → ForbiddenException 403"). head-builder's flag is **confirmed**: the test never invokes the controller, the guard, or `listMessagesAfter`. It calls a mock `canViewChannelById` (returns false), then asserts `Promise.reject(new Forbidden(...))` rejects with `Forbidden` (L2462-2464) — a hand-built promise rejecting with the same class it asserts. Tautological; proves nothing about the route. `void nonMemberService` (L2469) confirms the service instance is never exercised.

**Assessment of REAL enforcement (read controller + guard):** the negative path IS genuinely protected.
- The `?after=` path shares the single `@Get()` handler decorated `@UseGuards(AuthGuard, ChannelMessageGuard)` (`messages.controller.ts:108-109`); `?after=` is just a query-param branch inside it (L121). No separate undecorated route exists.
- `ChannelMessageGuard` is route-agnostic — it reads only `req.params.channelId` and delegates to `rbacService.canViewChannelById`, default-deny on false/missing (`channel-message.guard.ts:48-61`).
- `channel-message.guard.spec.ts:72-78` genuinely calls `guard.canActivate(ctx)` with a false-rbac mock and asserts `ForbiddenException` — a REAL (non-tautological) proof, and because the guard is route-agnostic it covers the `?after=` route too.

So enforcement is real; the gap is that the *service-spec test claiming to prove it* is theater. **Required:** delete/replace the tautological test with either (a) a controller-level test that drives `listMessages` through the guard with a non-member session and asserts 403 on the `?after=` branch specifically, or (b) at minimum a comment pointer to `channel-message.guard.spec.ts` as the real proof and removal of the fake `Promise.reject` assertion so it can't be miscounted as coverage. High because the misleading test inflates the security-coverage signal for the new route.

### H3 — `sendMessage` immediate-POST overlaps the outbox row → same item double-POSTed by a concurrent drain
`useMessages.ts:463-507`. `sendMessage` enqueues to the outbox, then immediately POSTs (L481-486), and only deletes the outbox row in the POST's `.then` (L490). Between enqueue and that delete the row is `pending`. If a reconnect/online drain (H1) fires in that window, the drain POSTs the same item again. Same stable key → server dedups (no dup row), but it is a redundant in-flight duplicate and contributes to the reordering surface in H1. The optimistic-state dedup (`prev.some(m => m.id === confirmed.id)`, L493) prevents UI doubling. **Fix:** route the immediate send through the same single-flight `drain()` path (or mark the row in-flight) so the durable queue is the only sender. Couple with H1's guard.

### H4 — partial-failure ordering: a failed earlier item does NOT block later items → out-of-order server arrival
`outbox.ts:137-146` + asserted by `outbox.test.ts:213-217`. When item N's POST fails, drain increments attempts and **continues to item N+1**, which succeeds. So with `[m0, m1, m2]` and m1 failing, the server receives m0 then m2; m1 only lands on a later drain — server insertion order is m0, m2, m1. The test *enshrines* this as correct (`expect(calls1).toHaveLength(3)`, key-2 delivered while key-1 still pending). This is a deliberate design choice (favor liveness over strict order), but it directly contradicts the "in-order" half of the wedge and the file's own docstring claim "Sequential by design — prevents out-of-order delivery" (`outbox.ts:107`). **Decide explicitly:** either (a) stop-on-first-failure within a channel to preserve order (re-drain later resumes from the stuck item), or (b) accept best-effort ordering and correct the docstring + the spec's "in-order (gating proof)" describe label (`outbox.test.ts:61`) so the contract is honest. As written, the code and its docstring disagree — a gate-blocking ambiguity for the wedge.

---

## Medium

### M1 — POST-succeeds-but-delete-fails / tab-close-between-POST-and-delete is not tested
`outbox.ts:135` deletes the row after a successful POST. If the tab closes (or `delete` throws) between POST success and delete, the row survives as `pending`; the next drain re-POSTs with the same key and the server dedups (`outbox.test.ts:123-176` covers the re-add/replay variant). The mechanism is correct, but the specific "POST resolved, delete never ran" crash window has no test. Add one (e.g. `store.outbox.delete` stubbed to throw after a successful send; assert next drain re-POSTs same key, server returns same id, no dup).

### M2 — `createdAt` collisions make oldest-first order non-deterministic across the `[state+createdAt]` index
`outbox.ts:91-93, 116-118`; index defined `db.ts:66`. Ordering anchor is `createdAt` (ISO ms). Two sends in the same millisecond (paste/burst, or programmatic) tie; Dexie's tiebreak then falls to the auto-increment `id`, which happens to match enqueue order — but this is incidental, not specified. The compound index is `[state+createdAt]` only; `++id` is not part of the ordered range query. For a wedge whose contract is strict order, tie-break on the monotonic `++id` should be explicit (e.g. index `[state+createdAt+id]` or document the Dexie primary-key tiebreak guarantee). Low-probability but directly on the in-order contract.

### M3 — catch-up cursor advances only when `newItems.length > 0`; an all-duplicate page leaves the cursor stale
`useMessages.ts:131-148`. `lastSeenCursorRef` is updated inside the `newItems.length === 0 ? return prev` branch's sibling (L145-146), so a catch-up page that is entirely already-seen (all filtered out) does not advance the cursor and the response's own `nextCursor` is ignored entirely — catch-up reads only one page (no pagination loop) (L129-149). If more than `limit` (50) messages arrived while offline, only the first 50 are fetched; the rest rely on socket delivery, which may not replay missed events. Medium: under a long offline window the catch-up is incomplete. Consider looping on `result.nextCursor`.

---

## Low

### L1 — Dexie transaction discipline: no explicit `db.transaction()` blocks, so the auto-commit footnote is moot (good) but unenforced
`outbox.ts`/`cache.ts` perform single-statement Dexie ops (`add`, `delete`, `update`, `bulkPut`, `put`) with no multi-op `db.transaction()` wrapping network I/O — so the "no non-Dexie await inside a transaction" auto-commit bug cannot occur here. The docstring warning (`outbox.ts:21-23`) is accurate and the code complies. No action; noted as verified-clean.

### L2 — IndexedDB-unavailable (private mode) path is graceful but lightly tested
`db.ts:75` guards the singleton to `null` when `indexedDB` is undefined; every caller checks `if (db)` and `sendMessage` has a full in-memory fallback branch (`useMessages.ts:548-586`) plus a QuotaExceeded catch (L509-547). Solid. But `db.test.ts` has no `db === null` case (it always constructs with fake-indexeddb). A unit test exercising the `db = null` branch of `sendMessage`/`runDrainAndCatchup` would lock the private-mode contract.

### L3 — `enqueue` docstring says callers must not double-enqueue, but there is no guard
`outbox.ts:52-54`. `enqueue` does not dedup; correctness depends on the caller. Today `sendMessage` calls it once per compose action, so fine — but a future double-fire would create two outbox rows with two distinct keys (two server messages, no dedup). Low; consider a content+channel debounce or document the invariant at the call site.

### L4 — tombstone test is conditional (`if (tombItem)`) → can silently pass with zero assertions
`messages.service.spec.ts:2496-2500`. The tombstone-exclusion assertion is wrapped in `if (tombItem)`; if the DTO layer ever dropped the row, the test still passes having asserted nothing. The real WHERE-clause exclusion (`messages.service.ts:1505,1522`) is correct, but the test is weak. Make the assertion unconditional or assert the count.

---

## Wedge summary (exactly-once + in-order)
- **Exactly-once on the data: HOLDS.** Stable key generated once + persisted + replayed verbatim; server ON CONFLICT(channel_id, idempotency_key) dedups with canonical re-fetch. Confirmed in code and in a genuine (non-tautological) replay test (`outbox.test.ts:123`).
- **In-order: AT RISK.** Three converging issues — no drain re-entrancy guard (H1), overlapping immediate-POST (H3), and continue-on-failure (H4) — mean distinct messages can reach the server out of enqueue order under reconnect + partial failure. The code's own docstring claims order is preserved; it is not, in those cases. This is the gate-blocking item: resolve H1/H4 (and align H3 + the docstring) before the wedge can be called proven.

## Files of record
- `/home/claudomat/project/apps/web/src/features/sync/outbox.ts` (H1, H4, M1, M2)
- `/home/claudomat/project/apps/web/src/shell/useMessages.ts` (H3, M3, L2)
- `/home/claudomat/project/apps/api/src/messaging/messages.service.spec.ts` (H2, L4)
- `/home/claudomat/project/apps/api/src/messaging/messages.controller.ts` + `/home/claudomat/project/apps/api/src/rbac/channel-message.guard.ts` + `/home/claudomat/project/apps/api/src/rbac/channel-message.guard.spec.ts` (H2 — real enforcement verified here)
- `/home/claudomat/project/apps/web/src/features/sync/outbox.test.ts` (H1/H4 test gaps, M1)
- `/home/claudomat/project/apps/web/src/features/sync/db.ts` (M2, L1, L2)

---
---

# B-6 Phase-2 RE-REVIEW (iteration 2) — wave-20 M4 offline spine

**Commit:** `cefa1de` (`fix(web): B-6 strict in-order outbox drain — re-entrancy guard + single send path + stop-on-failure`) + `69ac8c1` (`test(messaging): B-6 replace tautological ?after= 403 test with real guard coverage`)
**Mode:** READ-ONLY. Scope: confirm the 4 prior High cleared + no new Critical/High from the fixes.
**Repo green (as reported):** api 346, web 176, typecheck/build/lint clean. Working tree clean apart from review artifacts.

## Verdict: APPROVED.

All four High findings from iteration 1 are genuinely fixed (verified in code AND in non-theater tests). No new Critical. No new High — the stop-on-failure + head-of-line interaction was assessed in depth (item 5 below) and resolves to an acceptable, self-healing, documented non-blocking policy. Carried Medium/Low (M1, M3, L1–L4) remain accepted non-blocking. The wedge (exactly-once + in-order) is now PROVEN.

## Critical
None. (Exactly-once unchanged from iteration 1: stable key generated once at `enqueue()` `outbox.ts:64`, persisted, replayed verbatim `outbox.ts:178`; server ON CONFLICT dedups. The H3/H4 fixes only narrow the send surface — they cannot regress exactly-once.)

## High
None — all four cleared.

### H1 — drain re-entrancy → CLEARED ✓
Module-level `_drainInFlight: Promise<void> | null` guard (`outbox.ts:107`). `drain()` returns the in-flight promise if one is running (`outbox.ts:139-141`); otherwise it assigns `_drainImpl(...).finally(() => { _drainInFlight = null })` (`outbox.ts:143-145`).
- **No set/clear race:** the null-check (139) and the assignment (143) are in the SAME synchronous tick — there is no `await` between them, so a second concurrent caller arriving before the first returns sees the already-assigned promise. `_drainInFlight` is cleared only in `.finally()`, after `_drainImpl` fully settles. Correct.
- **No concurrent double-drain:** confirmed. Two triggers (socket `connect` `useMessages.ts:163`, window `online` `useMessages.ts:175`) both route through `runDrainAndCatchup` → `drain()`; the second collapses onto the first's promise.
- **Test (genuine):** Test 9 `outbox.test.ts:497-540` fires `[drain(), drain()]` then `Promise.all` — asserts `calls.length === 3`, all three keys distinct (each POSTed exactly once), `delivered` equals keys in order, outbox empty. Not theater.

### H3 — single send path → CLEARED ✓
`sendMessage` IDB path (`useMessages.ts:460-509`) now `enqueue()`s then calls `drain()` (`useMessages.ts:485`) — NO separate direct POST. The outbox is the sole POST source on the durable path. Optimistic render is still immediate (`setOptimisticMessages` at 470, before drain). Reconcile-by-id via `onDelivered` removes the optimistic row (496-498). The two remaining direct `api.sendMessage` calls (`useMessages.ts:524`, `563`) are the IDB-enqueue-failed (QuotaExceeded) and IDB-unavailable fallback branches — mutually exclusive with the outbox path (no outbox row exists in those branches, so no drain can double-send). The retry path (`useMessages.ts:612`) deletes the outbox row on success (624). No double-send: reconnect-drain + compose-drain collapse via the H1 guard.

### H4 — strict in-order (the WEDGE) → CLEARED ✓ (rigorous pass)
`_drainImpl` STOPS on first send failure: the `catch` block increments attempts / marks failed, then `return`s immediately (`outbox.ts:187-198`). Later items in the snapshot are never reached → never POSTed ahead of an earlier un-sent one. Docstring rewritten and accurate ("a later message can NEVER be sent ahead of an earlier un-sent one" `outbox.ts:120-121`).
- **Test genuinely asserts in-order-preserved (not theater):** Test 3 `outbox.test.ts:189-306`. 3 items, stop-key-1 always fails. Across THREE drains: drain-1 → 2 POSTs (key-0 success, key-1 fail, STOP); key-2 untouched (attempts=0, pending). drain-2 → 1 POST (key-1 only, fail, STOP); key-2 still untouched. drain-3 → 1 POST (key-1 → MAX_ATTEMPTS → `state='failed'`, onFailed fires). The decisive assertions: `key2PostCount === 0` across ALL drains (`outbox.test.ts:300-301`) and `key0PostCount === 1` (no dup, `outbox.test.ts:304-305`). This is a real out-of-order-prevention proof, not a tautology.
- **M2 tiebreak confirmed:** `_drainImpl` sorts the snapshot by `createdAt`, tiebreak by auto-increment `id` (`outbox.ts:164-169`). Test 10 `outbox.test.ts:547-595` proves same-millisecond items drain in ascending-id order. The compound index `[state+createdAt]` is the range filter; the JS sort applies the deterministic id tiebreak on top.

### H2 — tautological 403 → CLEARED ✓
- **Theater test DELETED:** `grep` for `Promise.reject(new Forbidden…)` / `nonMemberService` in `apps/api/src/messaging/` returns nothing. Replaced by a comment-only coverage note (`messages.service.spec.ts:2434-2448`) that points to the real proof and explicitly states a service-layer hand-built reject would be theater. No fake assertion remains to inflate coverage.
- **Route genuinely guarded:** `?after=` shares the single `@Get()` handler decorated `@UseGuards(AuthGuard, ChannelMessageGuard)` (`messages.controller.ts:108-109`); `?after=` is a query-param branch inside it (`messages.controller.ts:121`). No separate undecorated route. Guards run before the handler regardless of query param.
- **Guard is route-agnostic + default-deny:** reads only `req.params.channelId`, delegates to `rbacService.canViewChannelById`, throws `ForbiddenException` on false/missing (`channel-message.guard.ts:48-61`).
- **Real (non-tautological) guard test:** `channel-message.guard.spec.ts:72-77` constructs the guard with a false-rbac mock and asserts `guard.canActivate(ctx)` rejects with `ForbiddenException`. Because the guard is route-agnostic, this covers the `?after=` branch.

## New-finding assessment (item 5) — head-of-line semantics of stop-on-failure

Question: does a permanently-failed item block ALL later sends forever (new High [queue-stuck]), or is it skipped so later items proceed?

**Answer: SKIPPED on subsequent drains — NOT a permanent wedge. Acceptable, documented, self-healing policy. NOT a new High.**

Trace:
1. While the blocker is still `pending` (attempts < MAX), it is head-of-queue and stop-on-failure halts the drain — later items correctly wait (this is the in-order guarantee, intended).
2. Once the blocker exhausts MAX_ATTEMPTS it transitions to `state='failed'` (`outbox.ts:190`). The drain query selects ONLY pending rows: `where('[state+createdAt]').between(['pending', minKey], ['pending', maxKey])` (`outbox.ts:159-161`). A `failed` row is OUTSIDE that range → EXCLUDED from every subsequent snapshot.
3. Therefore on the NEXT drain the formerly-blocked later item (e.g. stop-key-2) becomes head-of-the-pending-snapshot and DOES drain. The queue is NOT permanently wedged. (Test 8 `outbox.test.ts:450-488` independently confirms `failed` items are skipped and only `pending` is drained.)

**Exact head-of-line semantics (documented for the record):**
- A failing item blocks later items ONLY while it is still `pending` (during its retry budget, attempts 1..MAX_ATTEMPTS-1). This preserves strict in-order during transient failures.
- Once it reaches `failed`, it stops being drained (excluded by the pending-only query); later pending items resume on the next drain.
- The failed item itself is recovered explicitly by the user via `retryOutboxItem()` (`outbox.ts:209-214`, resets `state='pending'`, `attempts=0`) — at which point it re-enters the pending set and, being the oldest, is drained first again.
- **In-order caveat (acceptable, intended):** if a later item drains while an EARLIER item sits in `failed` (awaiting user retry), then a subsequent user-retry of the earlier item will land it at the server AFTER the later one. This is a deliberate liveness-over-strict-order tradeoff for the terminal-failure case ONLY — strict order is preserved for all transient (pending/retrying) failures. The terminal case requires explicit user action (retry/discard), so the user is in the loop and the reorder is observable/intentional, not silent. This matches the rewritten docstring (`outbox.ts:118-124`) and is the standard outbox semantics. No code/docstring disagreement remains (the iteration-1 H4 contradiction is gone).

Net: self-healing queue, no permanent wedge, transient-failure in-order guaranteed, terminal-failure reorder gated behind explicit user retry. No new High.

## Carried Medium/Low — accepted non-blocking (unchanged)
- **M1** — POST-succeeds-but-delete-fails / tab-close-between-POST-and-delete window untested. Mechanism is correct (next drain re-POSTs same key, server ON CONFLICT dedups); only the specific crash-window test is missing. Accepted as debt.
- **M3** — catch-up reads only one page (no `result.nextCursor` loop, `useMessages.ts:128-149`); a >50-message offline window relies on socket replay for the remainder. Accepted as debt.
- **L1** — Dexie transaction discipline: single-statement ops only, no network I/O inside a `db.transaction()` — verified clean, no action.
- **L2** — IndexedDB-unavailable (private-mode) `db === null` branch is graceful but lightly tested. Accepted.
- **L3** — `enqueue()` has no double-enqueue dedup; correctness relies on the caller (single call per compose action today). Accepted.
- **L4** — tombstone test is conditional (`if (tombItem)`) so could pass with zero assertions; real WHERE-clause exclusion is correct. Accepted.

## Wedge summary (final)
- **Exactly-once on data: HOLDS** (unchanged; genuine replay test `outbox.test.ts:127-180`).
- **In-order: NOW PROVEN.** Re-entrancy guard (H1) eliminates concurrent-drain reorder; single send path (H3) removes the overlapping immediate-POST; stop-on-failure (H4) guarantees no later message sends ahead of an earlier un-sent one during transient failures. Terminal-failure reorder is gated behind explicit user retry and documented. The iteration-1 code/docstring contradiction is resolved.

## Files of record (re-review)
- `/home/claudomat/project/apps/web/src/features/sync/outbox.ts` (H1 guard 107/139-145, H4 stop-on-failure 187-198, M2 tiebreak 164-169, head-of-line query 159-161)
- `/home/claudomat/project/apps/web/src/features/sync/outbox.test.ts` (Test 9 H1 proof, Test 3 H4 in-order proof, Test 8 failed-skip, Test 10 M2)
- `/home/claudomat/project/apps/web/src/shell/useMessages.ts` (H3 single send path 460-509)
- `/home/claudomat/project/apps/api/src/messaging/messages.controller.ts` (H2 guard decorator 108-109)
- `/home/claudomat/project/apps/api/src/rbac/channel-message.guard.ts` + `channel-message.guard.spec.ts` (H2 real enforcement + genuine test)
- `/home/claudomat/project/apps/api/src/messaging/messages.service.spec.ts` (H2 theater test deleted, comment pointer 2434-2448)
