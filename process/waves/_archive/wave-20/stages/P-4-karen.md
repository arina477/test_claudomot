# P-4 Phase-2 — Karen load-bearing-claim verification (wave-20, M4 offline-first spine)

**Verdict: APPROVE.** The three load-bearing claims (reframe-don't-rebuild, forward-cursor-reuse-pattern, optional-key insight) plus Dexie-SDK soundness and outbox-backing are all grounded in real code. No reframe rebuilds existing server idempotency; the forward cursor genuinely doesn't exist yet and a reuse pattern genuinely does.

## Per-claim

**1. REFRAME correct — server idempotency GENUINELY EXISTS, plan does NOT rebuild it → VERIFIED.**
`createMessage` uses `.onConflictDoNothing({ target: [messages.channel_id, messages.idempotency_key] })` then replay-refetch by `(channel_id, idempotency_key)`.
- ON CONFLICT target: `apps/api/src/messaging/messages.service.ts:497-499`
- replay-refetch branch (`isNewInsert=false` → re-select existing canonical row): `messages.service.ts:509-518`
- attachment double-attach guard on replay: `messages.service.ts:480-483, 542-544`
Plan B-3 explicitly adds only a lock-test + the forward cursor, no idempotency code (`P-3-plan.md:8`, carry `:47`). Grounded.

**2. Forward-cursor gap real + reuse-pattern exists → VERIFIED.**
- `listMessages` is backward-only DESC: `messages.service.ts:1384, 1403, 1411` (`DESC, id DESC`); cursor branch fetches OLDER rows via `lt(created_at, …)` / `id <`: `messages.service.ts:1395-1398`; returns chronological only via post-`.reverse()`: `messages.service.ts:1420`. There is no forward `?after=`/`gt` page → the gap is real.
- `listThreadReplies` IS forward-ASC keyset: `created_at ASC, id ASC` (`messages.service.ts:1177, 1197, 1205`), AFTER-cursor via `created_at > …` OR (`= …` AND `id > …`): `messages.service.ts:1188-1194`, with in-service `canViewChannelById` 403 guard: `messages.service.ts:1160-1163`. This is exactly the `listMessagesAfter` reuse target (`P-3-plan.md:7`). Grounded.
- Shared opaque cursor `encodeCursor`/`decodeCursor` = `base64url(createdAt_iso|id)`: `messages.service.ts:49-67` — plan's "consistent with existing encode/decodeCursor" claim holds.

**3. The optional-key (NULL) insight → VERIFIED.**
The code's own comment confirms the UNIQUE only fires when key is non-NULL: "The UNIQUE constraint only fires when idempotency_key IS NOT NULL (NULL values are never considered equal in a UNIQUE index)" — `messages.service.ts:487-488`. The NULL path is a separate best-effort branch (no dedup): `messages.service.ts:519-535`. So binding a STABLE per-message key to the outbox path (not new server idempotency) is genuinely the real fix. Grounded.

**4. Dexie SDK sound + new deps → VERIFIED.**
- SDK-doc (dexie 4.0.11 / fake-indexeddb 6.0.0, scoped to `@studyhall/web`) gives the exact store shape the plan names: `messages: 'id, channelId, [channelId+createdAt], createdAt'`, `channels`, `outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]'` (dexie.md:325-330, 452-457). `[state+createdAt]` oldest-first drain via `.between(['pending', minKey], ['pending', maxKey])` (dexie.md:372-377, gotcha #6 :632-633). Sequential (not Promise.all) drain + no-non-Dexie-await-in-txn + per-test IDBFactory isolation are all documented (dexie.md gotcha #2 :607-609, #6 :633; per-test IDBFactory :413-461). Constructor-injectable IDBFactory + guarded singleton: dexie.md:450-461, 556-562. Realistic.
- New deps NOT yet installed: `apps/web/package.json` deps/devDeps contain neither `dexie` nor `fake-indexeddb` (`package.json:15-39`) → confirmed they are NEW client deps, no founder cred-ask (client-side, rule-17 silent default). Grounded.

**5. useMessages optimistic outbox EXISTS; Dexie outbox BACKS it (not separate) → VERIFIED.**
`apps/web/src/shell/useMessages.ts` already does optimistic send: `idempotencyKey = crypto.randomUUID()` then optimistic `state:'pending'` render → POST → on success drop optimistic, on failure flip `state:'failed'`, plus `retryMessage` — `useMessages.ts:268-350` (key gen :275, pending render :279-282, reconcile :299, fail :305, retry :315-345). Plan routes the durable Dexie outbox UNDER this existing path (no new send path): `P-3-plan.md:14`, AC 9a4ab31d. Grounded. Note: the client today generates a FRESH UUID per send attempt — the wave-20 contract that the key is generated ONCE at enqueue and carried through replays (OutboxItem.idempotencyKey, dexie.md:251-253, 280) is the actual behavioral delta B-4 must implement; flagged for B-6, not a plan defect.

## Antipatterns
- **ACs falsifiable:** YES — repeat-key→no-dup (lockable test), `after=` ASC/empty-at-HEAD/non-member-403/malformed-400, oldest-first `[state+createdAt]` ordering, N-in-order-exactly-once, partial-drain-resume, failed→retryable. All observable.
- **Exactly-once+in-order proof realistic:** YES — sequential oldest-first drain (Low risk per SDK gotcha #6) + server ON CONFLICT replay-dedup (verified L497) + fake-indexeddb integration test (per-test IDBFactory, deterministic, no real timers) = a genuine mechanical proof, not assertion theater. This is the correct gating-AC shape.
- **Gold-plating:** correctly OUT — CRDT / service-worker background-sync / multi-device / offline-for-all-entities / connection-state UI all deferred (spec OUT + `P-3-plan.md:52`). No over-build.
- **Rule-4 non-member-403 on the new `?after=` route:** REQUIRED at B-6 and explicitly carried — `P-3-plan.md:49`, spec AC + edge-case. Confirmed it's a real authz boundary.

## Two non-blocking notes for B-block
1. **Authz path choice:** `listMessages` enforces channel authz via the `ChannelMessageGuard` decorator on the route (`messages.controller.ts:89`), NOT in-service — whereas `listThreadReplies` does in-service `canViewChannelById` (`:1160`). Both are valid; B-3 should pick one for `listMessagesAfter` and the B-6 403 test must target whichever guard is wired. Plan's "canViewChannelById" wording presumes the in-service path — fine, just let B-3 confirm.
2. **Stable-key delta (claim 5):** the existing `crypto.randomUUID()` is per-attempt; wave-20 requires once-at-enqueue + carried-through-replay. This is the substance of AC 9a4ab31d and must be verified at B-6, not assumed from the existing outbox.

Neither note blocks APPROVE — the spine claims are sound.
