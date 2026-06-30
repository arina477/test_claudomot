# Wave 21 — P-3 Plan

## Approach
**Frontend-only (apps/web). NO server change** (the ?after= route + getSocketState 3-state + ConnectionStateIndicator + Dexie/outbox all exist). D-block SKIPS (design_gap FALSE — reuse the shipped indicator + pending/failed UI).

### c1dbee64 — live connection-state
- **`apps/web/src/shell/useConnectionState.ts` (new hook):** subscribe to the socket lifecycle (reuse `getSocketState()` in messagingSocket.ts which already returns `'online'|'reconnecting'|'offline'`, + the socket connect/disconnect/reconnecting events) + `window` `online`/`offline` events. Return the live derived state, reactive. Debounce rapid flap (last-wins; don't flicker offline↔online). Sensible initial default before the socket connects.
- **`apps/web/src/pages/AppHome.tsx`:** replace the hardcoded `connectionState="online"` (L39) with the live `useConnectionState()` value passed into `<AppShell connectionState={...} />`. (AppShell→MainColumn→ConnectionStateIndicator prop flow already exists.)
- No change to ConnectionStateIndicator.tsx (visual already adopted) or AppShell/MainColumn prop plumbing (already wired).

### 94e41695 — multi-page catch-up loop
- **`apps/web/src/shell/useMessages.ts` runDrainAndCatchup:** change the single `api.getMessagesAfter(channelId, cursor)` call into a LOOP: `while (cursor) { const page = await api.getMessagesAfter(channelId, cursor); append+dedup-by-id page.items; write-through to Dexie cache; cursor = page.nextCursor; if (++iters > MAX_ITERS) break-with-warn; }`. Use the OPAQUE forward cursor (the wave-20 V-3 encodeForwardCursor / server nextCursor — NOT a raw timestamp). Preserve order; dedup vs the socket message:new stream by id. Bounded by MAX_ITERS (e.g. 100 pages = 5000 msgs) — log if hit (no silent data loss; the cap is a pathological-guard, not a normal-path limit). Resumes from the persisted cursor on a mid-loop disconnect.

### 2fe6b517 — tests (reuse the wave-20 fake-indexeddb harness)
- **Connection-state tests** (apps/web/src/shell/useConnectionState.test.ts or in the existing shell test): socket connect→online, disconnect/reconnecting→reconnecting, window offline→offline, flap→no-thrash (debounce); AppHome passes the live value (not hardcoded).
- **Multi-page catch-up tests** (extend the sync/outbox test area): mocked PAGED getMessagesAfter (3 pages, nextCursor chained then null) → all 3 pages' items recovered in order; dedup vs a socket replay of one of them (by id); loop terminates on null nextCursor; MAX_ITERS guard fires without data loss. Deterministic (no real timers; fake-indexeddb per-test IDBFactory).

## Plan
### File-level steps (by B-stage)
**B-1 Schema:** SKIP (no schema). **B-2 Contracts:** SKIP/minimal (reuse existing connectionState union + MessagesAfterResponse — no new shared types likely; if a small type helps, typescript-pro). Record.
**B-3 Frontend** (react-specialist + frontend-developer):
| apps/web/src/shell/useConnectionState.ts | create | derive online/reconnecting/offline from getSocketState + socket events + window online/offline; debounce flap |
| apps/web/src/pages/AppHome.tsx | modify | replace connectionState="online" hardcode (L39) with useConnectionState() |
| apps/web/src/shell/useMessages.ts | modify | runDrainAndCatchup → loop getMessagesAfter until nextCursor null (opaque cursor; dedup-by-id; MAX_ITERS guard; order-preserving) |
| apps/web/src/shell/useConnectionState.test.ts + sync/catch-up test | create | the 2.fe6b517 tests |
**B-4 Wiring:** repo typecheck + build (vite, no CJS trap) + boot-probe.
**B-5 Verify:** the gating ACs proven (live state transitions; multi-page recovery no-data-loss) via the tests.

### Specialist routing (vs AGENTS.md): react-specialist, frontend-developer, typescript-pro (if a type needed) — present.
### Parallelization: c1dbee64 (connection-state) ∥ 94e41695 (catch-up loop) — independent files (useConnectionState/AppHome vs useMessages.runDrainAndCatchup); tests (2fe6b517) land with each.

### Self-consistency sweep
1. Every AC → step: live-state hook+AppHome (c1dbee64); catch-up loop (94e41695); tests (2fe6b517). ✓ 2. Specialist each. ✓ 3. No file in two parallel batches (useMessages is one specialist's; AppHome/useConnectionState another's — or one react-specialist does all 3, serial). ✓ 4. design_gap FALSE → D skips. ✓ 5. Reuse (no rebuild) — rule-1 verified. ✓ 6. Contracts concrete. ✓ 7. No new dep. ✓ 8. SDK n/a. ✓

### B-block carries (P-4 will confirm)
- **Premise (rule 1):** getSocketState 3-state + ConnectionStateIndicator + ?after= cursor + Dexie all EXIST — WIRE/LOOP/TEST, no rebuild.
- **Catch-up loop:** opaque cursor (wave-20 V-3), dedup-by-id, order-preserving, MAX_ITERS guard (no silent data loss), resume-from-persisted-cursor.
- **Gating AC (T/V):** multi-page recovery = NO data loss past page 1; the dot reflects real socket state (online/reconnecting/offline). Proven via tests.
- **Floor-exempt** (wave-16 legit-small-increment) — record the product-decision at L.
- **OUT:** new design (D skips), non-message connection-state, reconnect animations, offline-for-other-entities.
