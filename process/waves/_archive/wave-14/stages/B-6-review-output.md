# B-6 Phase-2 Production-Bug Review — wave-14 (M3 presence layer)

**Scope:** `git diff main...wave-14-m3-presence` — presence service/gateway, shared WS-auth,
`GET /servers/:id/members`, web presence socket + hooks + MemberListPanel + MainColumn,
`packages/shared/src/presence.ts`.
**Mode:** READ-ONLY. No fixes applied.
**Note:** branch working tree had two uncommitted edits at review time (`presence.gateway.ts`,
`usePresence.ts`) — both are biome formatting-only (line-wrap, import order); reviewed against the
working-tree state. No behavioral delta.

**Verdict input for B-6 gate:** 1 High, 4 Medium, 4 Low. **No Critical.** The single High is a
correctness gap (offline events can be missed / stale presence on multi-tab + channel-room leak on
disconnect); see H-1. B-6 re-enters B-stages for the High.

---

## Critical
*(none found — no data-loss, no auth bypass, no crash path identified)*

Positive confirmations on the Critical axes:
- **Auth/authz boundary is sound.** `GET /servers/:id/members` member-gates via `listServerMembers`
  (403 when `callerMembership` absent — servers.service.ts:225-233). `join_channel`, `typing:start`
  both re-derive `canViewChannelById()` server-side and never trust the client
  (presence.gateway.ts:221, 281). All presence/typing emits are room-scoped
  (`presence:server:<id>`, `presence:channel:<id>`) — no global broadcast (gateway.ts:156, 192, 333).
- **WS-upgrade auth extraction into `common/ws-auth.ts` is behavior-preserving** vs the inline
  MessagingGateway version (cookie-first, `auth.accessToken` fallback, `assertClaims` email-verify,
  `next(new Error('Unauthorized'))` on any failure). messaging.gateway.ts now delegates identically.
- **Presence ref-count map is cleaned up on disconnect.** `disconnect()` deletes the userId key on
  the →0 transition (presence.service.ts:85-87) — no unbounded growth of the presence map.

---

## High

### H-1 — Typing TTL timers + channel-room state are NOT cleaned up on socket disconnect
**`apps/api/src/presence/presence.gateway.ts:168-198` (handleDisconnect) + `presence.service.ts:51,164`**

`handleDisconnect` only ref-counts the presence map down. It never clears the user's typing state.
There is no per-socket tracking of which channels a socket joined, and no call to
`presenceService.stopTyping(channelId, userId)` on disconnect. Consequences:

1. **Orphaned `setTimeout` + ghost typer until TTL.** If a user is mid-typing (`typing:start` fired,
   no `typing:stop`) and closes the tab / drops the socket, the `TypingEntry` with its live 5 s timer
   stays in `typingMap` (service.ts:164-169). Other channel viewers keep seeing "<name> is typing"
   for up to 5 s with no underlying socket. The timer self-heals at TTL (calls `stopTyping` +
   `onExpiry`), so this is **bounded, not an unbounded leak** — which is why this is High, not
   Critical. But the ghost-typer UX bug is real and visible.
2. **Multi-tab false-clear.** `stopTyping` is keyed by `(channelId, userId)`, not by socket. If a
   user has two tabs both typing in the same channel and one disconnects, there is no per-tab typing
   state to reconcile anyway — but more importantly the TTL renewal only happens from whichever tab
   keeps emitting. Acceptable, but coupled with (1) it means typing cleanup is entirely TTL-driven on
   disconnect rather than deterministic.
3. **`presence:channel:` room membership** is dropped automatically by Socket.IO on disconnect (rooms
   are per-socket), so no room leak there — but the *typing entry* outliving the socket is the gap.

**Suggested fix direction:** track joined channels per socket (e.g. `socket.data.typingChannels:
Set<string>` populated in `handleTypingStart`/`handleJoinChannel`) and, in `handleDisconnect`, call
`stopTyping(ch, userId)` + `emitTypingActive(ch, userId)` for each, so the indicator clears
immediately rather than waiting out the 5 s TTL.

### H-1b (same severity bucket) — Missed `presence:offline` on multi-tab abrupt close (race)
**`presence.gateway.ts:177-197`**

`disconnect()` returns `wentOffline` only on the →0 transition, which is correct. But the offline
fan-out queries `getServerIdsForUser(userId)` from the **DB at disconnect time** (gateway.ts:185).
If the user's server membership changed (e.g. they were removed from a server) between connect and
disconnect, the offline event is emitted only to current-membership rooms — co-members in a
just-left server never get the offline transition and the member stays "online" forever in their UI.
Low-probability but a stale-presence correctness bug with no self-heal (no TTL on presence). Snapshot
on the stale viewer's next reconnect would correct it. Folding into H-1 as the same "presence cleanup
on disconnect is incomplete" theme.

---

## Medium

### M-1 — `getCoMemberUserIds` is an unbounded full-membership scan run on every connect
**`apps/api/src/presence/presence.service.ts:119-133` + gateway.ts:139**

On every socket connect the gateway pulls **all user_ids across all of the user's servers** into
memory and dedups in JS. For a user in several large servers this is an O(total memberships) query +
allocation on every tab open / reconnect (and reconnect storms are common on flaky networks). No
pagination, no cap. Single-pod in-memory design makes this acceptable for now, but it is the most
likely scaling hot-spot. Consider a `SELECT DISTINCT` at the DB layer (current code selects all rows
then dedups in JS — service.ts:128-132) and an upper bound.

### M-2 — Snapshot uses live `isOnline()` reads outside any lock — snapshot/transition interleave
**`presence.gateway.ts:138-149`**

The snapshot is built by mapping co-member ids through `isOnline()` (gateway.ts:142), which reads the
presence map at map-time. Between `connect()` (step 2) and snapshot emit (step 4) a co-member can go
online/offline. Because the `presence:online`/`offline` fan-out and the snapshot are not atomic, a
just-connected socket can receive a snapshot that says "X offline" and **never** receive the
`presence:online` for X if X's online transition fired between this socket's `connect()` and its room
join (gateway.ts:133-135 joins rooms *after* `connect()` but *before* snapshot). The window is small
and JS is single-threaded between awaits, but the `await socket.join(...)` and `await
getCoMemberUserIds(...)` are suspension points where another connection's synchronous emit can land
before this socket is in the room. Net: a transient stale-presence entry, corrected only on the next
transition. Document the eventual-consistency contract or join rooms before computing snapshot.

### M-3 — `email.split('@')[0]` display-name fallback can yield empty string
**`presence.gateway.ts:114`, `servers.service.ts:248`, `presence.service` (none) — both gateway and members endpoint**

`userRow?.email?.split('@')[0]` returns `''` for a pathological email like `@x` (empty local part).
`'' ?? userId` does NOT fall through (`??` only catches null/undefined), so an empty display name can
propagate to the typing indicator and member list. Same pattern in `listServerMembers`
(servers.service.ts:248). Low real-world likelihood (emails are validated upstream) but the fallback
chain is not actually exhaustive. Use a truthiness fallback (`|| userId`) for the final hop.

### M-4 — `ServerMembersResponse` Zod object schema is declared but the wire shape is a bare array
**`packages/shared/src/servers.ts:62-65` vs `servers.controller.ts:81` / `api.ts:121`**

`ServerMembersResponseSchema = z.object({ members: z.array(...) })` is exported but unused — the
controller returns `ServerMember[]` (bare array) and the client types `getServerMembers` as
`ServerMember[]`. The contract is internally consistent (both sides agree on the array), but the
unused wrapper schema is a latent trap: a future consumer that validates with
`ServerMembersResponseSchema` will reject the real payload. Either adopt the wrapper on both sides or
delete the unused schema. Contract-adjacent, but no live mismatch — Medium.

---

## Low

### L-1 — Dead `connect` handler with empty body in presenceSocket
**`apps/web/src/shell/presenceSocket.ts:123-125`**

The `_socket.on('connect', () => { /* re-join handled at hook level */ })` is a no-op with only a
comment. On reconnect, `useTyping`'s `join_channel` is emitted only on mount/channel-change
(useTyping.ts:96), NOT on socket reconnect — so after a transient disconnect the client silently
stops receiving `typing:active` for the active channel until the user re-navigates. Minor (presence
snapshot still re-arrives), but the empty handler advertises an intent that isn't implemented. Either
re-emit `join_channel` for the active channel here or remove the misleading stub.

### L-2 — Duplicated `PRESENCE_EVENTS` constant on the client (drift risk)
**`apps/web/src/shell/presenceSocket.ts:36-43` vs `packages/shared/src/presence.ts:87-100`**

The client re-declares the event-name map locally (documented reason: rollup CJS named-export
resolution). Pragmatic, but the two copies can silently drift. Suggest a comment-linked test asserting
equality, or a build step. Cosmetic/maintainability.

### L-3 — Inline `onMouseEnter`/`onMouseLeave` style mutation instead of CSS hover
**`apps/web/src/shell/MemberListPanel.tsx:63-68`**

Hover background is set via imperative `style.backgroundColor` mutation on mouse events rather than a
CSS `:hover` / Tailwind `hover:` class. Works, but bypasses the styling system and won't apply on
keyboard focus. Style/organization only.

### L-4 — `socket.data.userId as string` casts assume middleware invariant without runtime guard
**`presence.gateway.ts:102, 210, 244, 269, 309`**

Handlers cast `socket.data.userId as string`. The invariant (middleware sets it before
`handleConnection`) holds, and `handleDisconnect` correctly guards the `undefined` case
(gateway.ts:169-173). The message handlers (`handleTypingStart` etc.) don't re-guard, but they can
only fire on an authenticated socket, so this is defensible. Noting for consistency — a single
`getUserId(socket)` helper that throws would remove the scattered casts. Cosmetic.

---

## Cross-axis confirmations (no issue)

- **React hook cleanup is correct.** `useTyping` returns a cleanup that `unsub()`s the typing
  subscriber, emits `typing:stop` if still typing, and clears the idle timer (useTyping.ts:109-120).
  `usePresence` returns the `unsub` directly (usePresence.ts:33-38). `MemberListPanel` guards async
  `setState` after unmount via `mountedRef` (MemberListPanel.tsx:168-193). No subscription leak on
  unmount.
- **Client throttle/idle vs server TTL is coherent** — 333 ms throttle, 4 s client idle stop, 5 s
  server TTL (client stops ahead of server — useTyping.ts:18-19). Sound.
- **No `browser_close`-equivalent.** The web socket is a session-lifetime singleton; nothing closes
  the shared MCP/Socket instance mid-batch.
- **DB-failure handling in the gateway is present** — `getServerIdsForUser` failure disconnects the
  socket cleanly (gateway.ts:127-131); snapshot failure is non-fatal (gateway.ts:146-149); displayName
  resolution failure falls back to userId (gateway.ts:116-118); `canViewChannelById` failure emits an
  `error` event rather than throwing an unhandled rejection (gateway.ts:222-224, 282-284).
- **Empty co-member / empty typers paths are handled** — `getCoMemberUserIds` short-circuits on no
  servers (service.ts:121); `getTypers` returns `[]` for unknown channel (service.ts:201);
  `buildTypingLabel('')` for empty (useTyping.ts:66).
- **Payload shapes match Zod** — `typing:active` emit `{ channelId, typers }` matches
  `TypingActiveSchema`; `presence:online/offline` `{ userId }` matches; client event literal strings
  (`'join_channel'`, `'typing:start'`, etc.) match gateway `@SubscribeMessage` names.

---

## Recommendation for B-6 gate
- **H-1 / H-1b** warrant a B-stage re-entry: add per-socket typing-channel tracking and clear typing
  state + re-emit `typing:active` on disconnect (deterministic ghost-typer clear), and consider the
  offline-fan-out membership-staleness note.
- M-1..M-4 and L-1..L-4 can be batched into the same fast-fix pass or deferred per gate discretion;
  none block. M-4 (unused wrapper schema) and L-1 (reconnect re-join) are the highest-value of the
  non-blocking set.

---
---

# B-6 Phase-2 RE-REVIEW (iteration 2) — wave-14 presence

**Scope:** Verify fix commit `055935d` cleared the prior High theme (H-1 + H-1b) and the L-1
reconnect stub, and confirm no new Critical/High was introduced. READ-ONLY, no fixes applied.
**Files re-read at commit 055935d:** `apps/api/src/presence/presence.gateway.ts` (rewritten 74-line
diff), `apps/api/src/presence/presence.service.ts` (unchanged since prior pass — confirmed not in the
fix diff), `apps/web/src/shell/presenceSocket.ts` (20-line diff).
**Fix diff confirmed:** `git diff --stat main...wave-14-m3-presence` shows commit 055935d touched
ONLY the two expected files (`presence.gateway.ts`, `presenceSocket.ts`); no collateral edits.

**Verdict input for B-6 gate (iteration 2): 0 Critical, 0 High.** Prior High theme cleared; no new
Critical/High introduced. Carried Medium/Low debt restated below as accepted non-blocking.

## Critical (iteration 2)
*(none — none introduced by the fix; prior Critical axes unchanged and still clean)*

## High (iteration 2)
*(none — H-1 and H-1b are both genuinely fixed; no new High introduced)*

### H-1 — CLEARED ✓
**`presence.gateway.ts:42-45, 148-149, 199-209, 284-287, 328-342, 362-366`**

Per-socket typing tracking is now correctly threaded end to end:
- **Initialised for every authed socket.** `handleConnection` sets
  `socket.data.typingChannels = new Set<string>()` (line 149) AFTER `connect()` and the
  `getServerIdsForUser` await — i.e. on the same path every socket that reaches a typing handler has
  already traversed. A socket that fails `getServerIdsForUser` is `socket.disconnect(true)`'d and
  returns before the Set is created (lines 141-145); on its `handleDisconnect`, `typingChannels` is
  read as `Set<string> | undefined` and guarded (`if (typingChannels && size > 0)` — line 200), so the
  uninitialised case is safe. **No null/undefined access path.**
- **Add on start, remove on stop / leave / TTL-expiry / disconnect** — all four eviction paths covered:
  `handleTypingStart` adds (line 332); `handleTypingStop` deletes (line 365); `handleLeaveChannel`
  deletes (line 286); the TTL-expiry callback passed into `startTyping` deletes (line 339);
  `handleDisconnect` iterates and clears (lines 201-205). **No orphaned-setTimeout path remains** —
  `stopTyping()` (service.ts:181) calls `clearTimeout(existing.timer)` before deleting the entry, so
  the disconnect sweep cancels every live timer rather than leaving it to fire post-disconnect.
- **Ghost typer clears immediately.** For each tracked channel `handleDisconnect` calls
  `stopTyping(channelId, userId)` then `emitTypingActive(channelId, userId)` (lines 202-204), which
  re-emits the recomputed (now-shrunk) typers list to `presence:channel:<channelId>`. Observers clear
  the indicator on the disconnect tick — no 5 s TTL wait.

### H-1b — CLEARED ✓
**`presence.gateway.ts:135-147, 213-226`**

`handleConnection` captures `socket.data.serverIds = serverIds` at connect time (line 147), the same
resolved set used for the online fan-out (lines 172-175). `handleDisconnect` reads
`socket.data.serverIds` for the offline fan-out (line 217) instead of re-querying
`getServerIdsForUser`. **Offline audience == online audience** by construction — a mid-session
membership change can no longer leave an ex-co-member stuck "online". The `?? []` fallback (line 217)
covers the auth-rejected socket (serverIds never set) — degrades to a no-op fan-out, which is correct
for a socket that never went online (it never emitted `presence:online` either).

### L-1 — CLEARED ✓
**`presenceSocket.ts:86-92, 129-137, 199-204`**

The previously-empty `connect` handler now re-emits `join_channel` for `_activeJoinedChannel` on
reconnect (lines 133-137). `joinPresenceChannel` records the channelId (line 202). Single-channel
view invariant holds (one active channel), so the single tracked var is sufficient. The stub no longer
advertises unimplemented intent.

## New-issue scan (the three risks called out for this pass) — all clear

1. **Disconnect ordering (typing sweep BEFORE ref-count decrement) — no double-emit, no coupling.**
   The typing sweep (lines 199-209) operates on `typingMap`; the ref-count decrement `disconnect()`
   (line 211) operates on `presenceMap`. Independent maps — order is irrelevant. The sweep emits
   `typing:active` (channel rooms); the offline branch emits `presence:offline` (server rooms) — two
   distinct event types to two distinct room sets, so **no double-emit on a single observer**.
   `emitTypingActive` recomputes via `getTypers()` after `stopTyping()` already removed the entry, so
   the payload is correct (the disconnecting user is gone from the list).
2. **`socket.data.typingChannels` initialisation — always set for any socket that can reach a typing
   handler.** Typing handlers only fire on a fully-connected socket (post-`handleConnection`), and
   `handleConnection` sets the Set before returning on the success path. Every read site guards the
   `| undefined` type. **No null access.**
3. **Reconnect rejoin race — none.** On reconnect Socket.IO fires `connect` after the new transport is
   established; `_socket.emit('join_channel', …)` is queued/sent on the live socket. Server re-runs
   `canViewChannelById()` on the rejoin (gateway.ts:250) — access is re-verified, not trusted from the
   prior session. If access was revoked between drop and reconnect, the rejoin is correctly refused.
   No state is mutated client-side before the server confirms, so a failed rejoin simply means no
   typing events resume (graceful). **No race, no stale-room leak.**

Additional confirmations:
- The TTL-expiry callback now also deletes from `typingChannels` (lines 338-340) — keeps the tracker
  consistent with `typingMap` even when a timer fires naturally (no stale entry left for a later
  disconnect sweep to re-`stopTyping` a non-existent entry; `stopTyping` is idempotent regardless —
  service.ts:178 early-returns on missing channel/user).
- `handleDisconnect` still correctly guards `userId === undefined` for auth-rejected sockets
  (line 191) before touching any per-socket state.

## Carried Medium/Low debt (accepted non-blocking for B-6 — NOT required to fix)

All restated from iteration 1; none addressed by 055935d (none were in scope of the High fix), none
block B-6:

- **M-1** — `getCoMemberUserIds` unbounded full-membership scan on every connect (service.ts:119-133).
  Note: the prior pass's "SELECT DISTINCT" suggestion remains a suggestion — current code still selects
  all rows and dedups in JS (`seen` Set, service.ts:128-132). Accepted: single-pod in-memory design;
  scaling hot-spot for later.
- **M-2** — Snapshot built from live `isOnline()` reads outside any lock; snapshot/transition
  interleave can yield a transient stale entry corrected on next transition (gateway.ts:156-167).
  Accepted: eventual-consistency contract; window is small, self-heals.
- **M-3** — `email.split('@')[0]` display-name fallback can yield `''` for a pathological local-part;
  `'' ?? userId` does not fall through (gateway.ts:125; servers.service.ts:248). Accepted: emails
  validated upstream; low real-world likelihood.
- **M-4** — `ServerMembersResponseSchema` (object wrapper) declared but wire shape is a bare array;
  no live mismatch, latent trap for a future validating consumer. Accepted.
- **L-2** — Duplicated `PRESENCE_EVENTS` constant client-side vs shared (presenceSocket.ts:36-43 vs
  presence.ts) — drift risk; documented rollup-CJS reason. Accepted.
- **L-3** — Inline `style.backgroundColor` hover mutation instead of CSS `:hover`/Tailwind
  (MemberListPanel.tsx) — won't apply on keyboard focus. Accepted, style-only.
- **L-4** — `socket.data.userId as string` casts assume middleware invariant without runtime guard in
  message handlers (gateway.ts:113, 239, 273, 302, 353) — defensible (handlers only fire on authed
  sockets). Accepted, cosmetic.

(L-1 is no longer carried — it was fixed by 055935d, see above.)

## Final B-6 recommendation (iteration 2)
The High theme is genuinely resolved with no regressions and no new Critical/High. Critical = 0,
High = 0. All remaining items are accepted Medium/Low debt. **This pass clears the B-6 production-bug
review.** Gate may proceed to APPROVED on the production-bug-review axis.
