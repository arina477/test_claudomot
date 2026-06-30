# V-1 Semantic-Spec Verification — jenny — wave-21 (M4 wave-2: offline UX)

**Verdict: APPROVE**

Specs vs MERGED `main` (offline UX completion shipped; merge 9c48007, prod files read at current main HEAD). Every acceptance criterion across the three task specs MATCHES the live implementation. No drift found; M4 scope + "no data loss" metric are advanced (not falsely completed).

Files verified:
- `apps/web/src/shell/useConnectionState.ts`
- `apps/web/src/shell/useMessages.ts` (`runDrainAndCatchup`, lines 104-201)
- `apps/web/src/pages/AppHome.tsx`
- `apps/web/src/shell/{AppShell,MainColumn,ConnectionStateIndicator}.tsx` (plumbing chain)
- `apps/web/src/shell/useConnectionState.test.tsx`, `apps/web/src/shell/multiPageCatchup.test.ts`

---

## c1dbee64 — Live connection-state derivation + plumb into shell

- **AC1 (hook derives live online|reconnecting|offline from socket + window, reactive)** — MATCHES. `useConnectionState` reuses `getSocketState()` (messagingSocket.ts:228, returns the 3-state) + `navigator.onLine`; subscribes to `connect/disconnect/reconnecting/reconnect_attempt/reconnect_failed/reconnect` + window `online/offline`, re-derives on each (useConnectionState.ts:53-97).
- **AC2 (AppHome no longer hardcodes 'online'; passes live state through AppShell → MainColumn → ConnectionStateIndicator)** — MATCHES. AppHome.tsx:25 `const connectionState = useConnectionState();` → :42 `<AppShell connectionState={connectionState} />`. Chain intact: AppShell.tsx:102 → MainColumn.tsx:123 `<ConnectionStateIndicator state={connectionState} />`. The former dead `connectionState='online'` hardcode is gone.
- **AC3 (no new indicator component; no visual/design change)** — MATCHES. Reuses shipped `ConnectionStateIndicator`; no new component, design_gap FALSE honored.
- **SOURCE-PRIORITY annotation (P-4 Phase-2)** — MATCHES exactly. `deriveState()` (lines 23-43): (1) `!navigator.onLine` → offline (window short-circuit); (2) socket `'offline'` → offline; (3) socket `'reconnecting'` → reconnecting; (4) else online. window-online is re-trigger-only (an event listener, never an override) — regained-network + still-reconnecting socket yields `'reconnecting'`. Matches the mandated priority verbatim.
- **Edge cases** — MATCHES. Reconnecting precedence (no flicker), window-offline-wins, rapid-flap handled by 150 ms trailing-edge debounce (lines 45-65), sensible mount default via `useState(() => deriveState())`.

## 94e41695 — Multi-page reconnect catch-up loop

- **AC1 (loop getMessagesAfter until no nextCursor, append every page, advance cursor; recover ALL missed, not just first 50)** — MATCHES. `while (cursor && iters < MAX_ITERS)` (useMessages.ts:144-188): fetches each page, appends, advances `cursor = result.nextCursor`. Closes the past-page-1 data-loss gap.
- **AC2 (bounded/safe: terminate on null nextCursor, dedup by id, preserve order, cap pathological loops, no silent loss)** — MATCHES. Terminates on null nextCursor (line 178-187); dedup via `existingIds` Set (lines 156-158); order preserved (append oldest-first); `MAX_ITERS = 100` guard with `console.warn` (lines 139, 190-196); partial pages already written to state + cache (no silent loss).
- **AC3 (opaque forward cursor, not raw timestamp)** — MATCHES. Loops on server `result.nextCursor` (opaque); the wave-20 `encodeForwardCursor` is used only to re-derive `lastSeenCursorRef` after the final page. Carries the karen B-block notes: cursor advanced OUTSIDE the `setRealMessages` updater (lines 148-150, 172-187) and per-page `putCachedMessages` write-through (lines 163-169).

## 2fe6b517 — Tests

- **AC1 (connection-state transitions + AppHome live-not-hardcoded)** — MATCHES. `useConnectionState.test.tsx`: connect→online, disconnect→reconnecting, active=false→offline, window-offline→offline, flap→no-thrash; plus AppHome render asserts "Reconnecting…" / "Offline…" indicator text (proves live, not hardcoded online).
- **AC2 (multi-page catch-up: 3 pages in order, dedup vs replay, terminate on null, MAX_ITERS guard without loss)** — MATCHES. `multiPageCatchup.test.ts` Tests 1-5 cover ordered 3-page recovery, by-id dedup, null-cursor termination, MAX_ITERS=100 guard (exactly 100 calls, pages 1-100 preserved), and per-page Dexie write-through.
- **AC3 (deterministic; reuse wave-20 fake-indexeddb harness)** — MATCHES. Fake timers for the debounce, per-test `IDBFactory`, mocked paged `getMessagesAfter`; no real timers/sleeps; reuses fake-indexeddb harness.
- **D1/D2 disagreement cases (mandated by annotation)** — MATCHES. Both present: `[DISAGREEMENT D1]` window=online+socket=reconnecting→reconnecting; `[DISAGREEMENT D2]` window=offline+socket=connected→offline.

---

## M4 milestone alignment

- **Scope match** — MATCHES. M4 lists "connection-state indicator (online/reconnecting/offline)" + "catch-up via ?after= keyset cursor" + "heavily tested". This wave makes the indicator LIVE (was built+wired but dead) and makes catch-up COMPLETE across pages, with focused tests. Within M4 scope, not beyond it.
- **Success metric ("no data loss")** — MATCHES. The multi-page loop closes the >50-message (past-page-1) gap that the wave-20 single-fetch left open; reconnect now recovers all pages in order, dedup-safe.
- **Floor-exemption (BELOW 2500 LOC)** — CONSISTENT. Wave diff ~912 insertions incl. tests; legitimately small UX-completion increment on a multi-wave milestone, extending the wave-16 legit-small-increment precedent. Recommend recording the precedent extension at L-1.
- **No scope creep** — CONFIRMED. No rebuild of shipped components (ConnectionStateIndicator, pending/failed UI, Dexie/outbox/?after= all reused); no connection-state-everywhere, no reconnect animations, no offline for other entities. OUT-list honored.
- **M4 correctly NOT claimed complete** — CONFIRMED. Spec body states "M4 stays multi-wave (this is wave 2); re-homed tech-debt remains backlog." No premature milestone close.

## Non-blocking observations (not drift)
1. Loop terminates strictly on `nextCursor === null`; the AC's parenthetical "(or an empty page)" alternate-termination is not separately coded — an empty page WITH a non-null nextCursor would continue (bounded by MAX_ITERS). Server contract returns null when exhausted, so this never fires in practice; acceptable.
2. `lastSeenCursorRef` re-derivation after the final page uses `encodeForwardCursor` on the last item rather than the server cursor — correct, but worth a one-line L-1 note that the resume position depends on the last item being present.

No REWORK items. Semantic intent of all three specs and the M4 metric is faithfully realized in the merged, live code.
