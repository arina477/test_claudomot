# V-1 — Karen source-claim verification (wave-21, M4 wave-2 offline UX)

**Scope:** MERGED `main @ c62f89d` (PR#33 squash = 9c48007 + T-block commit), web LIVE at `web-production-bce1a8.up.railway.app`. Frontend-only, no migration, api unchanged, deps unchanged. 3 tasks (live-state derivation + multi-page catch-up + tests).

**Verdict: APPROVE.** All three load-bearing claims (source-priority-honest-signal, no-data-loss-catch-up, no-rebuild) VERIFIED against merged code + tests + the LIVE served bundle. One pre-recorded non-blocking caveat carried (T-4 L2 → V-2).

---

## Per-claim

### Claim 1 — SOURCE-PRIORITY honest signal REAL — **VERIFIED**
`apps/web/src/shell/useConnectionState.ts:23-43` `deriveState()`:
- `offline` if `!navigator.onLine` (`:25`) OR `getSocketState()==='offline'` (`:32`);
- else `reconnecting` if socket `'reconnecting'` (`:37`);
- else `online` (`:42`) — reached ONLY when `navigator.onLine === true` AND `getSocketState()==='online'` (which requires `s.connected`, `messagingSocket.ts:231`). **Both required.**
- Can it show `'online'` while disconnected? **Structurally impossible.** Window-offline short-circuits to offline before the socket is even read; socket-not-connected can never produce `'online'`. `window 'online'` (`:76`) is wired only to `scheduleUpdate → deriveState` (`:57-64`) — a re-evaluation trigger, never an override.
- D1/D2 disagreement tests genuine: `useConnectionState.test.tsx:206-227` (window=online + socket=reconnecting → `reconnecting`, asserts `.not.toBe('online')`) and `:231-244` (window=offline + socket=connected → `offline`, asserts `.not.toBe('online')`). Real assertions on hook output, not mock counts.

### Claim 2 — AppHome live (no hardcoded "online") — **VERIFIED**
`apps/web/src/pages/AppHome.tsx:25` `const connectionState = useConnectionState();` → `:42` `<AppShell connectionState={connectionState} />`. The former hardcoded `="online"` is gone. Wiring test `useConnectionState.test.tsx:303-329` renders real `<AppHome/>` and asserts the indicator shows `Reconnecting…` / `Offline…` — would fail if still hardcoded.

### Claim 3 — No-data-loss multi-page catch-up REAL — **VERIFIED** (1 non-blocking caveat)
`apps/web/src/shell/useMessages.ts:104-201` `runDrainAndCatchup`:
- LOOPS `api.getMessagesAfter(forChannelId, pageCursor)` (`:150`) `while (cursor && iters < MAX_ITERS)` (`:144`).
- Cursor advanced from **server** `result.nextCursor` at `:175-177`, **outside** `setRealMessages` (the karen B-carry honored — no stale-closure read across `await`).
- Per-page write-through `putCachedMessages` (`:163-169`).
- Dedup-by-id via `existingIds` set (`:155-159`); order-preserving append `[...prev, ...newItems]` (`:159`).
- `MAX_ITERS = 100` guard (`:139,:144`); on hit, `console.warn` (`:190-196`) — partial pages already in state+cache, **no silent loss**.
- Opaque cursor: server `nextCursor` used directly (`:175`); `encodeForwardCursor` only at terminal/fallback (`:183`).
- `multiPageCatchup.test.ts` proves it, not theater: T1 3-page in-order (`Math.max(p1)<Math.min(p2)<Math.min(p3)`, 3 calls, `:243-244`); T2 dedup (`length===2`, dup-id `toHaveLength(1)`, `:277,:282`); T3 terminate (`toHaveBeenCalledTimes(1)`, `:312`); T4 MAX_ITERS (`exactly 100 calls` + all 100 pages' ids `has(m.id)`, `:363-370`) = the load-bearing no-loss-under-bound proof; T5 per-page write-through via real fake-indexeddb `getCachedMessages` (`:415-420`).
- **Caveat (non-blocking, already recorded T-4 L2 → V-2):** T5 name over-claims "mid-loop disconnect" but resolves both pages before checking cache — proves write-through, NOT the page-2-rejects→resume-from-cursor path. That invariant rests on code+contract reasoning, not an executing test. Does not weaken the bounded no-loss claim (T4 proves partial-page preservation; resume re-seeds from network on reload).

### Claim 4 — No rebuild (PRODUCT-PRINCIPLES rule 1) — **VERIFIED**
- Reused `getSocketState` (`messagingSocket.ts:228`) — imported by `useConnectionState.ts:20`.
- Reused `ConnectionStateIndicator` — grep shows ONE component; `MainColumn.tsx:123` still renders it; `useConnectionState.ts:19` imports its `ConnectionState` type. No new indicator.
- Reused `Dexie/putCachedMessages` from `features/sync/cache` (`useMessages.ts:33`). No duplicate cache/outbox/cursor machinery.

### Claim 5 — Antipatterns / LIVE serve / deps — **VERIFIED**
- Claimed-but-not-built? No — all 3 features present in source AND in the live bundle.
- Gold-plating? No. Connection-state confined to the message shell (AppHome→AppShell→MainColumn→indicator), loop bounded `MAX_ITERS=100`, flap-debounce 150 ms. No connection-state-everywhere, no unbounded loop.
- LIVE web serves it: web root `HTTP 200`; bundle `assets/index-DiOaUyus.js` (939 KB) contains literals `catch-up loop hit MAX_ITERS`, `Reconnecting`, and `messages will send when` — confirms the new revision is the served one, not a stale build.
- Deps unchanged: `git diff 9c48007~1..9c48007 -- package.json pnpm-lock.yaml` empty.

---

```yaml
stage: V-1
reviewer: karen
verdict: APPROVE
merged_sha: c62f89d
live_web: { url: web-production-bce1a8.up.railway.app, root_status: 200, bundle: index-DiOaUyus.js, new_revision_confirmed: true }
deps_changed: false
claims:
  - { id: 1-source-priority-honest-signal, status: VERIFIED, load_bearing: true, evidence: "useConnectionState.ts:25,32,37,42; messagingSocket.ts:231; tests D1/D2 useConnectionState.test.tsx:206-244" }
  - { id: 2-apphome-live, status: VERIFIED, evidence: "AppHome.tsx:25,42; test :303-329" }
  - { id: 3-no-data-loss-catchup, status: VERIFIED, load_bearing: true, evidence: "useMessages.ts:144,150,155-159,163-169,175-177,190-196; multiPageCatchup.test.ts T1-T5" }
  - { id: 4-no-rebuild, status: VERIFIED, load_bearing: true, evidence: "useConnectionState.ts:19-20; MainColumn.tsx:123; useMessages.ts:33; single ConnectionStateIndicator" }
  - { id: 5-antipatterns-live-deps, status: VERIFIED, evidence: "live bundle string-grep 3/3; bounded loop; deps diff empty" }
carried_findings:
  - { severity: LOW, source: T-4-L2, boundary: resume-after-mid-loop-failure, description: "Test5 over-claims mid-loop-disconnect; resume-from-cursor path proven by reasoning not executing test", action: "-> V-2 (add page-2-rejects variant); non-blocking" }
next_action: PROCEED
```
