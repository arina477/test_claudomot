# Wave 20 — B-6 Review Gate Verdict (Phase 1: head-builder)

**Block:** B (Build) | **Wave:** 20 — M4 offline-first SPINE (multi-spec) | **Branch:** `wave-20-m4-offline-spine` @ `a3c324b`
**Gate:** B-6 Phase 1 (head-builder fresh-spawn) | **Specs:** 92d85e0e (idempotency-bind + forward-cursor), 7332a4b8 (Dexie store), 9a4ab31d (outbox/composer), e29f6566 (test harness)

## Verdict: **APPROVED** → proceed to Phase 2 (`/review`, adversarial on exactly-once spine + rule-4 403)

The exactly-once + in-order spine — the M4 gating AC — is genuinely proven, not coverage-theater. Stable-key-once is fixed. Forward cursor is correct. The new door is genuinely guarded. Dexie SDK-doc gotchas are respected. Out-of-scope held.

---

## Load-bearing checks (verified against code, not claims)

### 1. Exactly-once + in-order (THE gating AC) — PASS
- `outbox.ts drain()` snapshots pending via `[state+createdAt]` `between([pending,minKey],[pending,maxKey])` → **oldest-first**, then `for...of await send(...)` — **sequential, NOT Promise.all** (outbox.ts:116-147).
- Test 6 (outbox.test.ts:348-397) is a **real** sequential proof — `start:`/`end:` interleave asserts `[start-0,end-0,start-1,end-1,start-2,end-2]`, explicitly distinguishing from the concurrent pattern. Not theater.
- Test 1: N items POST in order, each exactly once, outbox empties (outbox.test.ts:74-119).
- Test 3: partial-drain (fail mid-drain) — key-0/key-2 POSTed **exactly once across all three drains** (`countKey0===1`, `countKey2===1`), key-1 resumes pending then → failed at MAX_ATTEMPTS, no dup (outbox.test.ts:180-272).
- Test 2: replayed key → mock honors server ON CONFLICT (same id), no dup (outbox.test.ts:123-176).
- Suite re-run by gate: **web sync 23/23 pass** (outbox 8 + db 15).

### 2. Stable key once-at-enqueue (karen carry) — PASS
- `enqueue()` generates `idempotencyKey = crypto.randomUUID()` **once** at compose time (outbox.ts:64); never regenerated on retry. `retryOutboxItem()` resets `state/attempts` but **preserves the key** (outbox.ts:156-161). `retryMessage(idempotencyKey)` reuses the same key (useMessages.ts:592-639). The old per-attempt randomUUID is fixed.
- Minor: the IDB-unavailable / enqueue-fail fallback branches mint a per-call UUID, but those are non-durable single attempts and retry still reuses the key. Acceptable graceful-degrade.

### 3. Rule-4 (BUILD rule 4) — door guarded — PASS (with a flagged test caveat)
- GET `?after=` route carries `@UseGuards(AuthGuard, ChannelMessageGuard)` — the **same proven decorator** as the existing `listMessages` backward path (messages.controller.ts:108-127). The forward path dispatches inside that guarded handler. This is the P-4-sanctioned authz path (decorator, since the route has `:channelId`).
- `ChannelMessageGuard` has a **real** non-member 403 negative-path test (channel-message.guard.spec.ts:72-77) and keys off the **route param**, not body (IDOR-safe, line 90). The forward route inherits this enforcement.
- **CAVEAT (carry to Phase 2):** the dedicated *service-level* 403 test (messages.service.spec.ts:2434-2470) is **tautological theater** — it never calls the service or guard; it asserts a hand-built `Promise.reject(new Forbidden())` rejects. It does **not** weaken the door (the door is guarded by the decorator + guard spec, both verified), but it is misleading. Phase 2 `/review` should confirm the real 403 proof is the guard wiring + guard spec, and recommend this test be deleted or replaced with a controller-guard integration test in a later wave.

### 4. Idempotency lock — PASS
- Locks ON CONFLICT DO NOTHING + replay-refetch → second call with same `(channelId, idempotencyKey)` returns the **canonical existing id**, no dup row (messages.service.spec.ts:2189-2323). Mock-based as the spec intended ("this already works; make it a binding contract"). No idempotency rebuild — reframe honored. The UNIQUE constraint itself predates this wave (M3/wave-13).

### 5. Forward cursor — PASS
- `listMessagesAfter` is forward ASC keyset: `created_at > cursor OR (created_at = cursor AND id > cursor.id)`, `ORDER BY created_at ASC, id ASC`, `is_deleted = false` excluded, `limit+1` sentinel, `nextCursor` encodes the last **kept** row (messages.service.ts:1482-1561). Mirrors `listThreadReplies` (ASC/gt), **not** `listMessages` (DESC/lt). Opaque base64url cursor consistent with existing encode/decodeCursor; malformed → 400 before any DB I/O. Suite: **api messaging 67/67 pass**.

### 6. Dexie correctness (SDK-doc gotchas) — PASS
- **No non-Dexie await inside a transaction:** `drain()` does all network I/O outside any `db.transaction` scope; individual `.add/.delete/.update` are atomic (outbox.ts:24, 121-147).
- **Schema versioned, no downgrade:** `version(1).stores(...)` with documented bump path (db.ts:63-67).
- **Lazy/guarded singleton:** `typeof indexedDB !== 'undefined' ? new StudyHallDB() : null` — no IDB at build (vite build green) (db.ts:75).
- **Per-test IDBFactory isolation + co-injected IDBKeyRange:** `new StudyHallDB(new IDBFactory(), IDBKeyRange)` per `beforeEach` (db.test.ts, outbox.test.ts) — the SDK-doc co-injection gotcha is respected (db.ts:31-41).
- **Outbox BACKS the existing optimistic path:** `useMessages.sendMessage` enqueues to outbox **then** reflects optimistic state — one send path, no separate channel (useMessages.ts:444-547).
- **Composer enabled offline:** send enqueues pending; POST `.catch` leaves the row in the outbox and keeps the optimistic row; reconnect drain retries (useMessages.ts:504-507).

### 7. Contract single-source + CJS trap — PASS
- `MessagesAfterResponseSchema` is Zod-sourced in `packages/shared` (messaging.ts:257) and consumed by both API DTO and web client (`api.getMessagesAfter`, api.ts:280). `types.ts` uses **type-only** imports from `@studyhall/shared`. Build green (3/3), typecheck green (4/4).

### 8. Offline-first contract integrity (head-owned) — PASS
- Optimistic-render-then-outbox: actually **durable-enqueue-then-optimistic** (stronger). Idempotency-keyed outbox. Reconnect reconciliation on socket `connect` + window `online` → drain then `?after=` catch-up (useMessages.ts:95-179). Dedup-by-id; socket `message:new` authoritative (last-write-wins by server). No new scale infra (no Redis/queue/multi-replica) — scale gold-plating avoided.

### 9. Out-of-scope respected — PASS
- No connection-state indicator UI, no pending/failed UI polish, no catch-up history UI (deferred to 2nd M4 wave); no CRDT, no service-worker, no multi-device sync.

---

## Minor observations (non-blocking; route to Phase 2 / future waves)
1. **Service-level 403 test is theater** (messages.service.spec.ts:2434) — see check 3 caveat. Real door is guarded; clean up the test.
2. **`useMessages.sendMessage` has 3 near-duplicate send branches** (outbox / enqueue-fail fallback / no-IDB). Functionally correct graceful-degrade, but a candidate for `code-quality-pragmatist` consolidation. Not over-engineering — it is defensive duplication; flag, do not block.
3. **Same-millisecond enqueue ordering** ties break on `++id` (monotonic) within `[state+createdAt]`, preserving enqueue order. Acceptable.
4. **In-flight-send + concurrent reconnect-drain** can POST the same stable key twice → server ON CONFLICT dedups → still exactly once. Harmless by design.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  phase: 1-head-builder
  reviewers:
    head-builder: APPROVED
    phase-2-review: PENDING   # /review adversarial — exactly-once spine + rule-4 403
  block_state:
    contract_locked: true
    migration_files: []        # no server schema change (idempotency UNIQUE pre-exists from M3); Dexie client schema v1 only
    realtime_verified: n/a     # spine wave; two-client realtime is T/V-block scope
    guard_coverage: ChannelMessageGuard on GET ?after= (decorator) + guard-spec non-member 403 proven
    reviewer_verdicts: { web-sync-suite: "23/23", api-messaging-suite: "67/67", typecheck: "4/4", build: "3/3" }
  failed_checks: []
  rationale: >
    The exactly-once + in-order outbox spine is genuinely proven — sequential oldest-first
    drain (real start/end interleave test), partial-drain resume with exactly-once across
    drains, and server-side idempotency-lock. Stable idempotency key is generated once at
    enqueue and reused on retry (karen carry fixed). Forward ?after= cursor is correct ASC
    keyset mirroring listThreadReplies, tombstone-excluded. The new route is guarded by the
    proven ChannelMessageGuard decorator whose own spec asserts non-member 403. Dexie SDK-doc
    gotchas (no-await-in-txn, versioned schema, guarded singleton, per-test IDBFactory +
    IDBKeyRange co-injection) are respected. Shared Zod contract is single-source; build/
    typecheck green. Out-of-scope (connection UI, CRDT, service-worker) held. One non-blocking
    caveat: the service-level 403 test is tautological theater — the real door is guarded
    elsewhere; routed to Phase 2 for cleanup confirmation.
  next_action: PROCEED_TO_B-6_PHASE_2
```
