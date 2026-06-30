# B-6 Phase-2 Review — wave-21 (M4 offline UX)

**Branch:** `wave-21-m4-offline-ux` vs `main`
**Scope:** frontend-only (confirmed — `git diff --name-only` shows NO `apps/api` / `packages/` changes).
**Reviewer:** code-reviewer (READ-ONLY).
**Repo state at review:** web typecheck+build green; `multiPageCatchup.test.ts` (5) + `useConnectionState.test.tsx` (9) re-run locally → 14 passed.

Files reviewed:
- `apps/web/src/shell/useConnectionState.ts` (+ `useConnectionState.test.tsx`)
- `apps/web/src/shell/useMessages.ts` (`runDrainAndCatchup` loop)
- `apps/web/src/shell/multiPageCatchup.test.ts`
- `apps/web/src/pages/AppHome.tsx`
- Cross-referenced: `messagingSocket.ts` (`getSocketState`), `ConnectionStateIndicator.tsx`, `cache.ts`, `outbox.ts`, `auth/api.ts` (`getMessagesAfter`), `apps/api/.../messages.service.ts` `listMessagesAfter` (server cursor contract).

---

## Verdict input

**No Critical findings. No High findings.** The two load-bearing properties hold:

1. **Honest connectivity signal** — `deriveState` (useConnectionState.ts:23-43) can NOT show `online` while the socket is not connected. window-offline is absolute (line 25-27); socket `offline`/`reconnecting` short-circuit before the `online` return (lines 32-39); `online` is returned ONLY when navigator.onLine AND `getSocketState() === 'online'` (which requires `socket.connected`, messagingSocket.ts:231). The forbidden case (window 'online' overriding to online while socket disconnected) is structurally impossible — the window 'online' event is wired only as a re-evaluation trigger (`scheduleUpdate`, line 76) and always re-runs full `deriveState`. Disagreement tests D1/D2 lock this.
2. **No data-loss / no-dup / no-infinite-loop in multi-page catch-up** — cursor is advanced from the server's `nextCursor` OUTSIDE the `setRealMessages` updater (useMessages.ts:175-187, the karen carry is satisfied); every append path dedups by id; `MAX_ITERS=100` bounds the loop; resume-after-mid-loop-failure starts from the persisted `lastSeenCursorRef` with no gap (server `after=` is strictly-greater keyset, messages.service.ts:1506-1512). Confirmed against the server contract: `nextCursor` encodes the LAST returned row (messages.service.ts:1530-1532), so `WHERE (created_at,id) > nextCursor` on the next page neither skips nor repeats a row.

Since no Critical/High, **B-6 does not need to re-enter** on this review's account. Medium/Low items below are advisory.

---

## Critical

_None._

---

## High

_None._

---

## Medium

### M1 — Concurrent `runDrainAndCatchup` from socket-`connect` + window-`online` runs two overlapping catch-up loops (redundant, not corrupting)
`useMessages.ts:204-214` (socket 'connect' listener) and `:217-226` (window 'online' listener) both call `runDrainAndCatchup(channelId)`. A real reconnect commonly fires BOTH within the same window (network returns → window 'online' AND socket auto-reconnects → 'connect'). `drain()` is protected by a module-level re-entrancy guard (outbox.ts:138), but **the catch-up while-loop (useMessages.ts:144-188) is NOT guarded**. Two loops then start from the same `lastSeenCursorRef.current`, issue overlapping `getMessagesAfter` calls, and both write `lastSeenCursorRef.current`.
- **Why it is not data-loss/dup:** every append uses `setRealMessages` functional dedup-by-id (lines 156-158), cache `bulkPut` is idempotent by primary key, and both loops converge to the same HEAD cursor. Final state is correct.
- **Cost:** doubled network round-trips on every reconnect (each page fetched ~twice), and a benign cursor-ref data race. On a deep gap this is 2×100 `getMessagesAfter` calls.
- **Suggested fix:** an in-flight ref guard around the catch-up loop (e.g. `if (catchupInFlightRef.current) return;` set/clear in a `finally`), mirroring the outbox guard. Keep it per-channel-aware so a channel switch still re-runs.

### M2 — Cache write-through inside the catch-up loop is fire-and-forget (`void putCachedMessages`), so "per-page persistence on mid-loop disconnect" is best-effort, not guaranteed
`useMessages.ts:165-168` issues `void putCachedMessages(...)` without awaiting, then advances the cursor and proceeds. If the tab is killed (reload/crash) between the cursor advance and the IDB write committing, the page's rows are NOT in cache. This is masked on the happy path because `lastSeenCursorRef` is in-memory and a reload re-seeds from `listMessages` (network), so no *persistent* gap results — but it means the test-claimed invariant "the cache is consistent with `lastSeenCursorRef` after each page" is only eventually-true, not synchronously true. Test 5 (`multiPageCatchup.test.ts:381-423`) does not actually exercise the kill-mid-write case — it lets both pages complete then asserts cache (see L2). Consider `await`ing the write before advancing the cursor if per-page durability is a real requirement, or downgrade the doc comment at useMessages.ts:136-137 to "best-effort".

### M3 — Window 'online' catch-up can fire while the socket is still `reconnecting`, hitting REST before the socket replays
The window-'online' listener (useMessages.ts:217-226) triggers `runDrainAndCatchup` purely on the browser network event, independent of socket state. If the network returns but the socket has not yet re-established (the exact state the indicator honestly shows as "reconnecting"), the catch-up REST loop runs against a freshly-online network — which is fine and even desirable — but the subsequent socket 'connect' will run catch-up AGAIN (see M1) and the socket's own backlog replay (`message:new`) overlaps. All three are dedup-safe by id, so no corruption; flagged only as the upstream cause of M1's redundancy. No separate fix needed beyond M1's guard.

---

## Low

### L1 — `deriveState()` reads `navigator.onLine` but does not treat its absence symmetrically with socket state
`useConnectionState.ts:25` guards `typeof navigator !== 'undefined'`. In SSR/build there is no navigator and no socket, so initial `deriveState()` returns `online` (both guards fall through to the final `return 'online'`). For this app AppHome only mounts client-side, so it is inert — but the default-online-when-unknown posture is the one direction the honest-signal contract warns against. Harmless here; worth a one-line comment that the hook assumes a browser runtime.

### L2 — Test 5's name over-claims ("simulated mid-loop disconnect") vs. what it asserts
`multiPageCatchup.test.ts:376-423` header says it verifies cache consistency "even when the loop is interrupted (simulated mid-loop disconnect)", but the test resolves BOTH pages successfully (lines 395-397) and asserts cache after full completion. It proves per-page write-through happens, not the interrupted-mid-loop case. Add a variant where page 2 `getMessagesAfter` rejects and assert (a) page-1 rows are in cache and (b) `lastSeenCursorRef`-driven resume on a second reconnect fetches from page-1's last cursor with no gap/dup. This is the actual no-data-loss-on-resume guarantee and is currently unproven by tests (only reasoned through the code + server contract).

### L3 — Six socket event subscriptions in useConnectionState are broad; some are redundant
`useConnectionState.ts:68-73` subscribes to `connect`/`disconnect`/`reconnecting`/`reconnect_attempt`/`reconnect_failed`/`reconnect`. socket.io-client emits `reconnecting`/`reconnect`/`reconnect_attempt`/`reconnect_failed` on the `socket.io` manager, not the socket instance, in v4 — so several of these may never fire on the `socket` object (only `connect`/`disconnect` reliably do). It is not a bug (extra `.on`/`.off` pairs are symmetric and cleaned up, no leak), but the dead listeners suggest the intent (catch reconnect attempts to flip to "reconnecting") may rely on `disconnect` alone, which it does correctly via `getSocketState().active`. Verify against the installed socket.io-client version and prune to the events that actually fire on the socket instance; or attach the manager ones to `socket.io`.

### L4 — `console.warn` on MAX_ITERS is the only signal of a deferred-tail (no telemetry/user surface)
`useMessages.ts:193-195` warns to console when the 100-page guard fires. 100 pages × 50 (server `safeLimit` default, messages.service.ts:1488) = up to 5000 messages per reconnect, a safe bound for normal use; a longer outage simply defers the tail to the next reconnect (correctly resumes from `lastSeenCursorRef`). Fine as-is, but the only operator signal is a console line — consider routing to the app's error/telemetry channel if one exists, so a chronic guard-hit (symptom of a too-small page or a stuck client) is detectable in production.

### L5 — Listener cleanup is correct; no leak found (positive confirmation)
useConnectionState.ts:83-96 and useMessages.ts:211-213 / :223-225 each remove exactly what they added, with stable handler references, inside the effect cleanup. The debounce timer is cleared on unmount (useConnectionState.ts:84-87). No double-subscribe, no leak. Stable-closure check passes: `deriveState` is re-invoked fresh inside the debounce callback (line 63), so it never reads a stale `getSocketState`/`navigator.onLine`.

---

## Hunt checklist — explicit results

| Hunt item | Result |
|---|---|
| (a) online while socket reconnecting/disconnected | **Safe** — impossible; socket short-circuit before `online` (useConnectionState.ts:32-42). |
| (b) window 'online' overrides to online w/ socket not connected | **Safe** — 'online' is a re-eval trigger only; full re-derive (line 76, 63). |
| (c) stale closure in derive (missing deps / not re-deriving) | **Safe** — `deriveState()` called fresh each debounce tick. |
| (d) debounce swallows final transition / stuck wrong terminal | **Safe** — trailing-edge, last-derive-wins; flap test passes. |
| (e) subscribe/unsubscribe correct (no leak/double) | **Safe** — symmetric add/remove (L5). Minor: L3 dead listeners. |
| catch-up (a) cursor advanced from server nextCursor outside setState | **Safe** — useMessages.ts:175-187, the karen carry. |
| catch-up (b) resume from persisted cursor, no gap/no dup after mid-loop fail | **Correct by code + server contract** (strictly-`>` keyset, nextCursor=last row). **Untested** — see L2. |
| catch-up (c) dedup-by-id vs socket message:new | **Safe** — every append dedups by id; idempotent cache bulkPut. |
| catch-up (d) MAX_ITERS preserves partial pages + 5000-msg bound | **Safe** — partial state/cache retained; warn emitted; bound reasonable (L4). |
| catch-up (e) order preserved across pages + vs socket | **Safe** — server ASC; client appends oldest-first; test 1 asserts inter-page order. |
| catch-up (f) terminate on null/absent/empty nextCursor | **Safe** — `cursor=null` terminates (line 186); empty items + null cursor → no ref clobber (last undefined). |
| no rebuild (reuse getSocketState/Indicator/Dexie) | **Safe** — all reused; no dup. |
| AppHome wiring | **Safe** — replaces hardcoded `"online"` with live hook (AppHome.tsx:42); AppShell prop optional, default preserved. |
| wave-20 send/outbox/optimistic path untouched | **Safe** — sendMessage/retry/edit/delete/reaction paths unchanged by the diff. |
| build / CJS trap / frontend-only | **Safe** — no server/shared changes; type-only shared imports; no new CJS runtime import. |

---

## Bottom line

The wedge's two load-bearing invariants (honest signal, no-data-loss catch-up) hold. **No Critical, no High** — B-6 need not re-enter on this review. The one item most worth acting on before close is **M1** (a small catch-up re-entrancy guard to stop the double-loop on every real reconnect) and **L2** (add the mid-loop-failure resume test that currently only exists as code-level reasoning). M2/M3/L1/L3/L4 are advisory hardening.
