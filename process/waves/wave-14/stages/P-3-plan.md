# Wave 14 — P-3 Plan

## Approach

### Architecture deltas

**New: PresenceModule + /presence Socket.IO namespace (apps/api/src/presence/).**
- Mirrors the wave-12 MessagingModule/messaging.gateway structure: a `@WebSocketGateway({ namespace: '/presence' })` with WS-upgrade auth installed in `afterInit` via `server.use()`, reusing the SAME SuperTokens cookie-validation path as /messaging (`Session.getSessionWithoutRequestResponse`, token from `sAccessToken` handshake cookie + `socket.handshake.auth.accessToken` fallback). No new auth surface — the upgrade-auth helper is factored/shared from the messaging gateway (task 723b5b6a is the reuse template).
- **PresenceService** holds in-memory state: `Map<userId, number>` socket ref-count (multi-tab safe). First increment (0→1) → user online; last decrement (1→0) → offline. Connection lifecycle (`connection`/`disconnect` handlers) drives it — clients emit nothing for online/offline.
- **Membership-scoped fan-out:** on online/offline transition, resolve the subject's co-members (users sharing ≥1 server with subject) via existing `server_members`, and emit `presence:online`/`presence:offline` only to those users' sockets (per-user rooms `presence:user:<id>` joined at connect, OR per-server rooms `presence:server:<id>`). **Chosen: per-server rooms** — socket joins a `presence:server:<id>` room for each server it's a member of at connect; fan-out = `server.to('presence:server:<id>').emit(...)`. Cheaper than recomputing co-member sets per event, and naturally scopes (no-leak). Snapshot-on-join: compute co-members' current online set and emit `presence:snapshot` to the joining socket.
  - *Alternative considered:* recompute co-member union per event + emit to individual user-rooms. Rejected — O(members) set-math per transition vs. O(1) room emit; room model also gives typing-scoping for free.
- **Typing** rides the same namespace + room model: client emits `typing:start {channelId}`/`typing:stop {channelId}`; gateway re-derives channel visibility (reuse `canViewChannelById` like /messaging `join_channel`) then fans `typing:active {channelId, typers[]}` to that channel's co-viewers. Ephemeral `Map<channelId, Map<userId, expiryTimer>>` with TTL; throttle on client (~1 emit/3s), auto-expire ~5s.
- **Failure-domain:** new namespace is isolated from /messaging (separate gateway, separate rooms); shares only the auth helper + DB read of `server_members`. No transaction-scope change, no write path. In-memory state → resets on api restart (clients re-snapshot on reconnect — acceptable; presence is soft state).

**Frontend: presence client store + 2 consumer surfaces (apps/web/src/shell/).**
- `presenceSocket.ts` — singleton /presence socket connection (mirrors `messagingSocket.ts`); exposes a presence store (userId→status) + typing store (channelId→typers), updated from snapshot + incremental events.
- `usePresence` / `useTyping` hooks expose the stores to components.
- `MemberListPanel.tsx` — right sidebar; composes `server_members` (existing fetch) × presence store → grouped Online/Offline rows. Built against the **D-block-adopted** member-list design.
- Typing line rendered near the composer/message-list foot in `MainColumn`/`MessageList`, fed by `useTyping`. Built against the **D-block-adopted** typing design.

### Data model
**No schema delta.** Presence + typing are in-memory server state. Membership resolved from existing `server_members` (M1). No migration, no backfill, no index change.

### API contracts (concrete)
Socket.IO `/presence` namespace (auth: SuperTokens cookie on WS upgrade; reject else):
- Server→client: `presence:snapshot {members: [{userId,status}]}` (on join); `presence:online {userId}`; `presence:offline {userId}`; `typing:active {channelId, typers: [{userId, displayName}]}`.
- Client→server: `typing:start {channelId}`; `typing:stop {channelId}`. (No client emit for online/offline — derived from connection lifecycle.)
- Rooms: `presence:server:<serverId>` (joined per membership at connect) scopes both presence + (via channel re-derivation) typing fan-out.
- Zod payloads in `packages/shared/src/presence.ts`.

### New deps
**None.** Socket.IO (`@nestjs/websockets` + `@nestjs/platform-socket.io`, socket.io-client) all integrated wave-12. No SDK pre-build checklist needed.

## Plan

### File-level steps (grouped by B-stage)

**B-1 Schema** — none (no DB change).

**B-2 Contracts**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| packages/shared/src/presence.ts | create | Zod: PresenceState, PresenceSnapshot, presence:online/offline payloads, TypingEvent, typing:start/stop/active payloads | typescript-pro | first (B-3/B-4 import) |
| packages/shared/src/index.ts | modify | export presence types | typescript-pro | after presence.ts |

**B-3 Backend**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/api/src/presence/presence.service.ts | create | ref-count map, online/offline transitions, co-member resolution (server_members), typing TTL state | backend-developer | after B-2 |
| apps/api/src/presence/presence.gateway.ts | create | @WebSocketGateway(/presence); WS-upgrade auth (reuse messaging helper); connection/disconnect ref-count; join presence:server rooms; snapshot-on-join; typing:start/stop handlers w/ channel-visibility re-derivation; membership-scoped fan-out | websocket-engineer | after service |
| apps/api/src/presence/presence.module.ts | create | wire service + gateway; import RbacService (value import — wave-12 DI lesson), server-members source | backend-developer | after gateway |
| apps/api/src/messaging/ws-auth.ts (or shared) | modify/create | factor the SuperTokens WS-upgrade auth helper for reuse by both gateways (if not already shared) | supertokens-integration | before gateway |
| apps/api/src/app.module.ts | modify | register PresenceModule | backend-developer | after module |

**B-4 Frontend** (against D-block-adopted designs)
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/web/src/shell/presenceSocket.ts | create | /presence socket singleton + presence store + typing store; snapshot + incremental reconcile | react-specialist | after B-2 |
| apps/web/src/shell/usePresence.ts | create | hook exposing presence store | react-specialist | after presenceSocket |
| apps/web/src/shell/useTyping.ts | create | hook: emit throttled typing:start/stop; expose typing:active per channel | react-specialist | after presenceSocket |
| apps/web/src/shell/MemberListPanel.tsx | create | right panel; server_members × presence → grouped Online/Offline + dots; responsive ≤1024 | frontend-developer | after usePresence + D-block |
| apps/web/src/shell/MessageList.tsx (or MainColumn) | modify | render "<name> is typing…" line from useTyping | frontend-developer | after useTyping + D-block |
| apps/web/src/shell/MainColumn.tsx | modify | mount MemberListPanel in the right-sidebar slot | frontend-developer | after MemberListPanel |

**B-5 Wiring**
| Path | Op | What | Specialist | Order |
|---|---|---|---|---|
| apps/api/src/presence/* | verify | boot-probe: /presence namespace mounts; no DI crash (value imports) | orchestrator→head-builder | last (B-5) |
| type-check sweep | fix | tsc green across shared+api+web | typescript-pro | last |

### Specialist routing (validated against AGENTS.md)
typescript-pro, backend-developer, websocket-engineer, react-specialist, frontend-developer, supertokens-integration — all present in command-center/AGENTS.md / capability sheet.

### Parallelization map
- B-2: presence.ts → index.ts (serial, tiny).
- B-3: ws-auth helper → presence.service → presence.gateway → presence.module → app.module (serial chain — DI deps).
- B-4: presenceSocket → {usePresence, useTyping} (parallel) → {MemberListPanel, typing-line} (parallel after hooks + D-block) → MainColumn mount (serial last).
- B-3 and B-4 run in parallel batches once B-2 lands (backend + frontend independent until wiring).

### Self-consistency sweep
1. Every AC maps to ≥1 step: presence ACs→B-3 gateway/service; typing ACs→B-3 typing handlers + B-4 useTyping/typing-line; member-list ACs→B-4 MemberListPanel. ✓
2. Every step has a specialist. ✓
3. No file in two parallel batches. ✓
4. design_gap_flag=true referenced — B-4 surfaces depend on D-block-adopted member-list + typing designs. ✓
5. Architecture deltas declared with alternative trade-offs (room-model vs co-member recompute). ✓
6. Contracts concrete (no TBD). ✓
7. New deps: none. ✓
8. SDK pre-build: n/a (no new SDK). ✓
