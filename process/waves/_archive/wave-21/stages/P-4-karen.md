# P-4 Phase-2 — Karen load-bearing-claim verification (wave-21)

**Verdict: APPROVE**

M4 wave-2 offline-UX-completion. All 5 PRODUCT-PRINCIPLES rule-1 premises are grounded in real code; the
catch-up loop is buildable against the live `MessagesAfterResponse` contract. The wave WIRES live state +
LOOPS catch-up + TESTS — it does NOT rebuild shipped infra. Scope is correct.

## Per-premise verification (rule 1 — the load-bearing check)

1. **VERIFIED** — `getSocketState()` is 3-state.
   `apps/web/src/shell/messagingSocket.ts:228` — `export function getSocketState(): 'online' | 'reconnecting' | 'offline'`.
   Logic at L229-233: no socket → `offline`; `s.connected` → `online`; `s.active` → `reconnecting`; else `offline`.
   The hook can reuse this directly (premise holds exactly).

2. **VERIFIED** — AppHome hardcodes `connectionState="online"` (the dead wiring).
   `apps/web/src/pages/AppHome.tsx:39` — `<AppShell connectionState="online" />`, a string literal, no live source.
   The indicator can therefore never render reconnecting/offline today. This is the real dead-wire gap.

3. **VERIFIED** — `runDrainAndCatchup` calls `getMessagesAfter` ONCE and ignores `nextCursor` (multi-page data loss).
   `apps/web/src/shell/useMessages.ts:138` — single `await api.getMessagesAfter(forChannelId, cursor)`; no loop,
   no `result.nextCursor` read anywhere in the block (L138-162). The cursor it advances (L155) is derived from the
   last *item*, NOT the server `nextCursor`, so a >50-msg offline window recovers only page 1 and silently drops the rest.
   `nextCursor` confirmed present on the response type (premise 5) but unread here. Gap is real.

4. **VERIFIED** — reuse, no rebuild.
   `apps/web/src/shell/ConnectionStateIndicator.tsx:14-78` renders all 3 states (online sr-only, amber reconnecting,
   danger offline) — built + design-adopted; nothing to rebuild.
   `apps/web/src/shell/MessageList.tsx:1215 PendingRow` + `:1296 FailedRow`, wired at L1570/L1572 — already shipped,
   correctly NOT in this bundle.

5. **VERIFIED** — the loop is buildable against the real contract.
   `apps/web/src/auth/api.ts:280 getMessagesAfter(channelId, after) → request<MessagesAfterResponse>`.
   `packages/shared/src/messaging.ts:257 MessagesAfterResponseSchema = { items: MessageResponse[], nextCursor: string|null|optional }`.
   Server `apps/api/src/messaging/messages.service.ts:1482 listMessagesAfter` is ASC keyset, fetches `safeLimit+1`,
   and at L1527-1532 sets `nextCursor = hasMore ? encodeCursor(...) : null` — i.e. non-null exactly while more pages
   remain, null on the last page. The planned `while (cursor) { ...; cursor = page.nextCursor }` terminates correctly.
   Opaque cursor confirmed: `encodeForwardCursor` already imported/used in useMessages.ts (L55, L155, L225, L244, L304).

## Spot-checks

- **Catch-up loop realistic:** YES. Loop until `nextCursor` null = correct termination (server contract proven).
  Opaque forward cursor (wave-20 V-3 `encodeForwardCursor` / server `encodeCursor`), NOT raw timestamp. Dedup-by-id
  already present in the one-shot (useMessages.ts:142-144 `existingIds` Set) — extend per-page. MAX_ITERS guard is a
  pathological cap (plan L12: ~100 pages), logged-not-silent, no data loss on normal path. Resume-from-persisted-cursor
  via `lastSeenCursorRef` (survives mid-loop disconnect). All buildable.

- **ACs falsifiable:** YES. Live-state transitions (connect→online, disconnect→reconnecting, window offline→offline,
  flap→no-thrash) and multi-page recovery (3-page window → all 3 recovered in order, dedup vs socket replay, terminate
  on null, MAX_ITERS fires without loss) are all testable via the existing fake-indexeddb harness
  (`apps/web/src/features/sync/outbox.test.ts`, `db.test.ts` use fake-indexeddb/IDBFactory — premise confirmed).

- **No gold-plating:** YES. No rebuild; bounded loop; no connection-state-on-every-surface (OUT-scoped); reuses the
  shipped indicator + pending/failed UI; frontend-only, no server change, no new dep (`socket.io-client` + React +
  vitest + fake-indexeddb all present).

- **Floor-exemption legit:** YES. Genuine small UX-completion on a multi-wave milestone (M4 wave-2) reusing wave-20
  shipped infra — matches the wave-16 legit-small-increment precedent cited in the spec/plan.

## Notes (non-blocking, B-block carries)

- Plan's one-shot `setRealMessages` updater (useMessages.ts:140-157) bundles fetch+dedup+cursor-advance inside a single
  setState callback; the per-page loop should advance the cursor from the server `nextCursor`/last-item *outside* a
  setState callback (await between pages), not inside the updater, to avoid stale-closure cursor reads across iterations.
  Mechanical, not a scope issue.
- Confirm the per-page write-through to Dexie (`putCachedMessages`) runs per page, not once at the end, so a mid-loop
  disconnect leaves the cache consistent with `lastSeenCursorRef`. Edge-case is named in the spec; flag for B-5.

**APPROVE** — premises grounded in real code, catch-up loop buildable against the live contract.
