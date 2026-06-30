# Wave 21 — B-block (Build) gate verdict

**Block:** B | **Gate stage:** B-6 Review (Phase-1 head gate) | **Head:** head-builder
**Wave topic:** M4 wave-2 offline UX (live connection-state + multi-page catch-up loop + tests)
**Branch:** wave-21-m4-offline-ux @ 79cc8cc | **Claimed:** [c1dbee64, 94e41695, 2fe6b517]
**Scope:** frontend-only — no server / schema / migration / dependency change. B-1/B-2 SKIP (no new contract, no backend).

---

## Stage-exit checklist (B-block, frontend-only profile)

| Check | Result | Evidence |
|---|---|---|
| B-0 claimed task carries embedded spec contract w/ verifiable ACs | PASS | fenced YAML head of c1dbee64.description; 3 specs, each with ACs + edge-cases |
| B-0 task claimed in order (next claimable) | PASS | multi-spec bundle, manifest-recorded |
| B-1 Contracts | SKIP | no new shared Zod/DTO; reuses `ConnectionState` union + `MessagesAfterResponse` (V-3 wave-20 cursor) |
| B-2 Backend | SKIP | frontend-only; no NestJS route / guard / socket change |
| Migration discipline (Drizzle + Dexie) | N/A | no schema change; no Dexie store-shape change (reuses wave-20 stores) |
| B-3 implement against locked contract | PASS | useConnectionState + runDrainAndCatchup + AppHome wiring |
| B-4 wire | PASS | AppHome:25 `useConnectionState()` → AppShell:42; hardcode removed |
| B-5 verify-integration (no new scale infra) | PASS | no Redis/replica/queue; bounded loop (MAX_ITERS=100) |
| Pagination is cursor/keyset, never offset | PASS | opaque forward cursor (`result.nextCursor`), not offset/timestamp |
| Idempotency / outbox path unbroken | PASS | catch-up reuses outbox `drain()` first, then catch-up; dedup-by-id vs socket replay |
| typecheck + build clean | PASS | `tsc --noEmit` clean |
| tests green | PASS | web 193 passed (9 connection-state + 5 multi-page catch-up); api 347 unchanged |
| no rebuild (rule 1) | PASS | reuses getSocketState, ConnectionStateIndicator, putCachedMessages, StudyHallDB, fake-indexeddb harness |

---

## Load-bearing claim scrutiny (gate lens)

### A. SOURCE-PRIORITY — the wedge's honest signal (AC c1dbee64)
`deriveState()` (useConnectionState.ts:23-43) implements the mandated priority verbatim:
1. `!navigator.onLine` → `offline` (window-offline short-circuit, line 25)
2. `getSocketState()==='offline'` → `offline` (line 32)
3. `getSocketState()==='reconnecting'` → `reconnecting` (line 37)
4. else → `online` (line 42) — reached ONLY when window online AND socket connected (BOTH required).

- **window 'online' is a RE-EVAL TRIGGER, not an override** — wired as `scheduleUpdate` (line 76), which re-runs `deriveState()`; it can never push to `online` while the socket isn't connected. window-offline can only pull toward offline; window-online can never push to online. CORRECT.
- `getSocketState()` (messagingSocket.ts:228-234) genuinely returns the 3-state (`connected→online`, `active→reconnecting`, else `offline`) — the hook reuses it, no reimplementation.
- **D1 test** (test.tsx:206-227): window=online + socket=reconnecting, fires window 'online' event, asserts state stays `reconnecting` AND `not.toBe('online')`. Mutation-sensitive — a window-online override would fail this. GENUINE.
- **D2 test** (test.tsx:231-244): window=offline + socket=connected, asserts `offline` AND `not.toBe('online')`. GENUINE.
- Debounce 150ms trailing-edge (lines 45,57-65); flap test (178-202) proves no-thrash (last-wins → online). VERIFIED.

VERDICT: source-priority correct, disagreement tests not theater.

### B. Multi-page catch-up NO-DATA-LOSS — the M4 metric (AC 94e41695)
`runDrainAndCatchup` (useMessages.ts:104-201):
- Loops `while (cursor && iters < MAX_ITERS)` calling `api.getMessagesAfter(forChannelId, pageCursor)` until server `nextCursor` is null (lines 144-188). LOOP CONFIRMED.
- **Cursor advanced from SERVER `result.nextCursor` OUTSIDE the setRealMessages updater** — `cursor`/`pageCursor` are plain locals (lines 140,149) captured before each `await`; advance at line 177 is outside the updater. No stale-closure cursor read across await. KAREN CARRY (1) SATISFIED.
- **Per-page putCachedMessages write-through** (lines 163-169), every iteration, outside the updater. Test 5 (multiPageCatchup.test.ts:381-423) asserts BOTH pages present in Dexie after the loop — mid-loop-disconnect cache stays consistent. KAREN CARRY (2) SATISFIED.
- **Dedup-by-id** via `existingIds` Set (lines 156-159). Test 2 (251-286) proves socket-replayed id appears exactly once (length 2 not 3). VERIFIED.
- **MAX_ITERS=100 guard** (line 139) stops + `console.warn` (lines 190-196); partial pages already written to state+cache → no silent loss. Test 4 (323-374) asserts warn fires, call count EXACTLY 100, AND all 100 pages' ids preserved in state. VERIFIED — no silent data loss.
- **Order-preserving** append `[...prev, ...newItems]` (line 159). Test 1 (183-247) asserts page1 < page2 < page3 index ordering across 3 chained pages. VERIFIED.
- **Opaque cursor** — server `nextCursor` used directly; local `encodeForwardCursor` only seeds the terminal `lastSeenCursorRef` matching the server base64url(`createdAt|id`) contract (wave-20 V-3), never a raw timestamp passed as the query cursor. VERIFIED.

VERDICT: multi-page recovery in-order + dedup + terminate + MAX_ITERS-no-loss proven mutation-sensitively via fake-indexeddb.

### C. No rebuild / no gold-plating (rule 1 + scope discipline)
Reuses shipped `getSocketState`, `ConnectionStateIndicator`, `ConnectionState` union, `putCachedMessages`, `StudyHallDB`, wave-20 fake-indexeddb harness. No duplicate components, no connection-state-everywhere, bounded loop. AppHome:39 hardcode genuinely replaced with the live hook (grep: NO HARDCODE FOUND). Frontend-only confirmed.

---

## Note for C-block handoff (non-blocking)
Manifest `review-artifacts.md` records the multi-page test path as `apps/web/src/features/sync/multiPageCatchup.test.ts`; the file actually lives at `apps/web/src/shell/multiPageCatchup.test.ts`. The deliverable EXISTS, runs, and passes (5 tests green) — this is a stale manifest pointer, not a missing artifact. Does not affect the gate.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  phase: 1-head-gate
  reviewers: {}   # Phase-2 adversarial /review (source-priority + no-data-loss) runs next per orchestrator
  failed_checks: []
  rationale: >
    The two load-bearing checks both hold under independent scrutiny. SOURCE-PRIORITY is
    correct — deriveState() returns offline IF (window-offline OR socket-offline), else
    reconnecting IF socket-reconnecting, else online (both required); window 'online' is a
    re-eval trigger only, never an override, and the D1/D2 disagreement tests are
    mutation-sensitive (assert not.toBe('online')), not theater. Multi-page catch-up has
    NO DATA LOSS — the loop advances the cursor from the server nextCursor outside the
    setRealMessages updater (no stale closure), writes through to Dexie per page, dedups by
    id vs socket replay, terminates on null nextCursor, and the MAX_ITERS guard stops with
    partial pages preserved + a warn; the multiPageCatchup suite proves 3-page in-order
    recovery, dedup, termination, and MAX_ITERS-no-loss via fake-indexeddb. No rebuild
    (rule 1) — shipped components reused; AppHome hardcode replaced with the live hook.
    Frontend-only, no schema/server/dep change; typecheck clean; web 193 green / api 347
    unchanged; no scale gold-plating. B-1/B-2 legitimately SKIP.
  next_action: PROCEED_TO_PHASE_2_adversarial_review
```
