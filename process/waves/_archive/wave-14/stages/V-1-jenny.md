# V-1 Semantic-Spec Verification — jenny — wave-14 (M3 presence layer)

**Reviewer:** jenny (semantic spec-compliance, independent — has NOT seen Karen or any other reviewer)
**Date:** 2026-06-30
**Authoritative spec:** DB `tasks.description` for `d1c4693d-...` (wave-14-spec, multi-spec, 3 tasks)
**Deployed under review:** api `https://api-production-b93e.up.railway.app`, web `https://web-production-bce1a8.up.railway.app`, `main @ ef6afbf`
**Verdict: REJECT** — 2 of 3 specs MATCH; spec `58633934` (typing) **DRIFTS** on its load-bearing acceptance criterion.

---

## Deployment integrity check (read code == deployed code)

- Deployed commit `ef6afbf` is the squash-merge of PR #26 (`feat(presence): M3 presence layer`). Confirmed `git log ef6afbf -1`.
- `ef6afbf` is an ancestor of local HEAD `617baf6`. The only commits between them are T-block test additions.
- `git diff ef6afbf HEAD` over all presence production files (`apps/api/src/presence/*.ts`, `apps/web/src/shell/{useTyping,presenceSocket,MemberListPanel,MainColumn}.tsx`, `packages/shared/src/presence.ts`) shows **only two new `.spec.ts` test files** added — **zero production-code changes**. The code I read IS the code deployed at `ef6afbf`.
- Infra live: socket.io engine handshake at `/socket.io/?EIO=4&transport=polling` returns `200` with a valid `sid`; web root returns `200`. The `/presence` namespace mounts on this server and gates joins behind the shared WS-upgrade auth middleware (`installWsAuthMiddleware`).

---

## Spec 1 — `d1c4693d` /presence namespace (online/offline) — **MATCHES**

| AC | Deployed behavior | Result |
|---|---|---|
| `/presence` namespace exists; unauthed WS-upgrade rejected (reuse /messaging auth) | `@WebSocketGateway({namespace:'/presence'})` (gateway.ts:79-85); `afterInit` installs the shared `installWsAuthMiddleware(server)` (gateway.ts:101-103) — same path as /messaging. By the time `handleConnection` fires, `socket.data.userId` is guaranteed set (gateway.ts:108-113). | MATCH |
| First socket → online; LAST disconnect → offline; multi-tab ref-count no flap | `PresenceService.connect()` returns `wentOnline` only on 0→1 (service.ts:61-72); `disconnect()` returns `wentOffline` only on →0 (service.ts:78-90); `presenceMap: Map<userId, Set<socketId>>` is per-socket → multi-tab safe. Gateway emits online only `if (wentOnline)` (gateway.ts:170) and offline only `if (wentOffline)` (gateway.ts:213). | MATCH |
| online/offline fan out ONLY to co-members (membership-scoped, no leak) | online: `socket.to('presence:server:<id>')` for each of the user's servers — `socket.to()` excludes self, reaches only co-members in shared-server rooms (gateway.ts:172-175). offline: `this.server.to('presence:server:<id>')` over the **serverIds captured at connect** (gateway.ts:214-222), so offline reaches exactly the audience that got online — no stale-online leak (H-1b). Rooms are joined only for servers the user belongs to (`getServerIdsForUser`, service.ts:106-113). A non-co-member is never in those rooms → no presence leak. | MATCH |
| Snapshot on join (`presence:snapshot`) | `handleConnection` builds `PresenceSnapshot` from `getCoMemberUserIds()` + per-user `isOnline()` and emits `PRESENCE_EVENTS.SNAPSHOT` to the joining socket (gateway.ts:155-163). Client seeds `presenceStore` from it (presenceSocket.ts:104-109). | MATCH |
| Self-presence stable across own tabs | Ref-count means a 2nd tab is 0→1 false (`wentOnline=false`), so no self toggle; co-members get no spurious event. | MATCH |

Edge cases (multi-tab, abrupt disconnect, unauthed reject, no-shared-server scoping, server-restart re-snapshot) are all structurally satisfied by the ref-count map + room model + on-connect snapshot. **Spec 1 PASS.**

---

## Spec 2 — `58633934` typing indicators — **DRIFTS (impl bug, not a spec gap)**

**Load-bearing AC:** *"Other members CURRENTLY VIEWING the same channel see a '<name> is typing…' line."* The contract (spec `api`) is explicit: server fans out `typing:active {channelId, typers:[{userId,displayName}]}` to channel co-members — i.e. **each recipient must receive a list containing the OTHER typers, including the actor's name.**

### Traced deployed path (server-authoritative)

1. Actor A types → client `emitTypingStart` → `typing:start {channelId}` (presenceSocket.ts:207-209).
2. Gateway `handleTypingStart` (gateway.ts:300-345): re-checks `canViewChannelById`, resolves `displayName` from `socket.data`, calls `presenceService.startTyping(...)` (adds A to `typingMap[channelId]`), then **`this.emitTypingActive(channelId, /*selfUserId=*/userId)`** with `userId === A` (gateway.ts:344).
3. `emitTypingActive(channelId, selfUserId=A)` (gateway.ts:381-386):
   ```
   const typers = this.presenceService.getTypers(channelId, /*exclude=*/A);   // A excluded → [] if A is sole typer
   this.server.to(`presence:channel:${channelId}`).emit(TYPING_ACTIVE, { channelId, typers });
   ```
4. `getTypers(channelId, excludeUserId=A)` strips A from the list (service.ts:196-210).

**The single typers list is computed once with the ACTOR excluded, then broadcast to the WHOLE channel room** — actor A *and* recipient B alike. So recipient B receives `typing:active { typers: [] }` and **never sees "A is typing…"**. B's `useTyping` calls `getTypers(channelId)` from the store, which now holds `[]`, so `typingLabel === ''` (useTyping.ts:65-73, 103-107) → no line renders.

The self-exclusion is implemented as a property of the **emit**, not of the **recipient**. The correct semantics require a per-recipient list (each recipient excludes only *themselves*), e.g. broadcast the full typers list and let each client filter self, or compute/emit per-socket. As written, the one list excludes the only person who *should not* be excluded for everyone else.

> This **confirms** the T-block finding ("recipients get [] because emit broadcasts ONE actor-excluded list to the whole room"). It is reproduced verbatim in the deployed code at `ef6afbf` and was **not fixed** after T-block (only tests were added between `ef6afbf` and HEAD).

> Note: when **two** people type, B *would* see A (because the broadcast list still contains A from B's perspective) — but A also wrongly disappears from A's own correctly, while a recipient C viewing both still only ever gets the actor-of-the-last-event excluded. The single-typer case — the canonical "X is typing…" demo path and the literal AC wording — is **broken**. AC is about the recipient seeing the typer; in the dominant 1-typer case the recipient sees nothing.

### Other typing ACs (would pass if the fan-out bug were fixed)

| AC | Deployed | Result |
|---|---|---|
| throttle ~once/3s; stop on send/blur/idle | client throttles `typing:start` to 1/333ms, idle-stop at 4s, stop on send + blur (useTyping.ts:36-39,124-162; MainColumn.tsx:52-58,225-227). (333ms is tighter than the ~3s ceiling — within spec, not a violation.) | OK |
| auto-expire ~5s TTL with re-emit | server 5s TTL `setTimeout` per typer, re-emits on expiry (service.ts:30,164-170; gateway.ts:335-342) | OK |
| aggregate >3 → "Several people are typing" | `buildTypingLabel` 1/2/3/4+ tiers (useTyping.ts:65-73) | OK (but unreachable correctly while fan-out is broken) |
| channel-scoped, co-members only, no cross-channel leak | emit target is `presence:channel:<channelId>`, joined only after `canViewChannelById` (gateway.ts:237-263,381-386) | OK |
| self never shows own line | over-applied — self-exclusion is what breaks recipients | (root cause of the DRIFT) |

**Classification: DRIFT (implementation bug), not GAP.** The spec is coherent and correct — it asks each recipient to see the OTHER typers. The code implements self-exclusion at the wrong layer (room-broadcast instead of per-recipient), so the actor-excluded list is delivered to recipients. The spec does NOT need changing; the emit logic does. **Spec 2 FAIL.**

**Fix direction (for V-2/V-3, not authored here):** emit the full typers list to the room and exclude self client-side (the client already calls `getTypers(channelId)` and could drop its own userId), OR emit a per-socket list that excludes only that socket's user. Either restores the AC.

---

## Spec 3 — `058984c5` member-list panel — **MATCHES**

| AC | Deployed | Result |
|---|---|---|
| Right-hand panel, members grouped Online/Offline, row = avatar + name + presence dot | `MemberListPanel` aside (240px, `borderLeft`), `Online — N` / `Offline — N` group headers, `MemberItem` = avatar/initials + emerald(online)/zinc(offline) dot + name (MemberListPanel.tsx:57-113,254-302) | MATCH |
| Consume snapshot + incremental online/offline, live move, no reload | `usePresence()` `tick` increments on every presence event → re-render → re-partition via `getStatus()` (MemberListPanel.tsx:170,204-215); store fed by snapshot/online/offline (presenceSocket.ts:104-121) | MATCH |
| Real server membership via existing endpoint (no new model) | `api.getServerMembers(serverId)` → `GET /servers/:id/members` on server change (MemberListPanel.tsx:180-202); reuses M1/M2 source, no schema delta | MATCH |
| Responsive collapse ≤1024px per §9 | Panel doc'd hidden ≤1024px via parent responsive container (MemberListPanel.tsx:5-9,27); component intentionally does not self-manage visibility | MATCH (visibility delegated to caller — consistent with adopted design) |

Edge cases (no-avatar initials fallback, online count in header, live Online→Offline move, narrow collapse) all present. **Spec 3 PASS.**

---

## Summary

| Spec | Task | Verdict | Class |
|---|---|---|---|
| /presence online/offline | `d1c4693d` | **MATCHES** | — |
| typing indicators | `58633934` | **DRIFTS** | DRIFT (impl bug — self-exclusion applied to room-broadcast list, recipients get `[]`; confirms T-block) |
| member-list panel | `058984c5` | **MATCHES** | — |

**Overall: REJECT.** Two specs fully meet their acceptance criteria against the live deploy. The typing spec's load-bearing AC ("other members viewing the channel see '<name> is typing…'") is NOT met in production: the server broadcasts a single actor-excluded typers list to the whole channel room, so a recipient receives an empty list and no typing line appears in the canonical single-typer case. This is a code DRIFT, not a spec GAP — route to V-2 triage as High/Critical (the feature's primary user-visible behavior is non-functional).
