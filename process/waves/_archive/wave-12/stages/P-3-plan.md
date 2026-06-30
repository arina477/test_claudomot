# Wave 12 — P-3 Plan (M3 messaging, multi-spec)

## Deps (B-0): api — @nestjs/websockets + @nestjs/platform-socket.io + socket.io. web — socket.io-client.

## Data model (B-0, database-administrator/postgres-pro) — one migration
- `messages` (id uuid pk, channel_id uuid→channels onDelete cascade, author_id text→users.id, content text notNull, created_at timestamptz default now(), idempotency_key text; UNIQUE(channel_id, idempotency_key); INDEX(channel_id, created_at desc)). Drizzle schema + migration. App-side: no backfill.

## Backend REST (B-2, backend-developer) — MessagingModule (apps/api/src/messaging/)
- a0c322b4: messages.service createMessage (idempotent on-conflict-return); listMessages cursor pagination. messages.controller POST/GET /channels/:channelId/messages.
- **P-4 karen CRITICAL FIX — channelId-only guard:** the wave-10 ChannelPermissionGuard requires BOTH req.params.id(serverId)+channelId (403 if either missing) — the message routes have NO :id → it CANNOT be reused as-is (would fail-closed 100%). ADD: (1) `RbacService.canViewChannelById(userId, channelId)` — SELECT server_id FROM channels WHERE id=channelId (notNull), then apply the existing canViewChannel(userId, serverId, channelId) logic; (2) a new `ChannelMessageGuard` that reads channelId from @Param (IDOR-safe), calls canViewChannelById → 403 else. T-8 MUST test: bare-channelId path default-denies a PRIVATE channel to a non-member (+ allows a permitted member).
- author_id = session userId (never body). content validated (non-empty ≤4000). createMessage emits `message.created` via EventEmitter2. MessagingModule imports RbacModule.
- **B-0 CARRY-FORWARD B (non-optional):** add `@nestjs/event-emitter` dep + `EventEmitterModule.forRoot()` in AppModule (NOT yet present; the message.created→@OnEvent fan-out silently never fires without it).

## Socket.IO gateway (B-2, supertokens-integration [WS-auth] + backend-developer/node-specialist [gateway wiring]) — the WS-auth is load-bearing
## **CARRY-FORWARD A:** websocket-engineer is ABSENT from AGENTS.md (the plan's 'AGENTS.md ✓' was wrong) → SUBSTITUTE backend-developer/node-specialist for the gateway wiring (per rule 11, note the swap); supertokens-integration (PRESENT) owns the load-bearing WS-upgrade auth.
- 723b5b6a: @WebSocketGateway({namespace:'/messaging', cors:...}). **WS-UPGRADE AUTH** (supertokens-integration): in handleConnection / an io.use() middleware, validate the SuperTokens session from the handshake — extract the access token from the handshake cookies (the wave-3 SameSite=None+Secure cookie) and verify via Session.getSessionWithoutRequestResponse / the SDK's session verification; reject (disconnect) an unauth socket. Attach userId to the socket. Single-pod IN-MEMORY adapter (default; NO Redis).
- join_channel {channelId}: re-derive RbacService.canViewChannelById(userId, channelId) [channelId-only, resolves serverId] server-side → on success socket.join('channel:'+channelId); else error (no join). leave_channel.
- @OnEvent('message.created') → server.to('channel:'+msg.channelId).emit('message:new', msg). Fan-out ONLY to the room.

## Design (D-block, head-designer) — design_gap_flag TRUE-delta
- server-channel-view.html exists → D scoped to the message-row (author/content/time, pending/sent/failed) + composer primitives. Validate/compose.

## Frontend (B-3, react-specialist) — message UI
- socket.io-client to /messaging (with credentials/cookie); on channel select → join_channel; render message:new for the active channel real-time. Message list (virtualized, load-older via cursor) + composer (optimistic pending → POST → confirmed/failed; client-gen idempotencyKey). api client: sendMessage, listMessages. Per the D design. In MainColumn/the channel view.

## Specialists (AGENTS.md ✓): database-administrator/postgres-pro, backend-developer, node-specialist (gateway wiring — substitutes ABSENT websocket-engineer per CARRY-FORWARD A), supertokens-integration (WS-auth), head-designer, react-specialist.
## Security (T-8 heavy): channel-gate send/list (ChannelMessageGuard — channelId-only, IDOR-safe; NOT the wave-10 two-param ChannelPermissionGuard which fail-closes on the :id-less message routes); author session-derived (no spoof); WS-upgrade session-auth (reject unauth); room-per-channel + canViewChannel-on-join (no cross-channel leak); fan-out room-only; idempotency. live-probe via wave-11 fixture + two-client <1s.
## Infra: single-pod in-memory adapter (NO Redis). C-2: verify Railway proxy passes WS-Upgrade (Socket.IO handshake against the live api); deploy-verify must NOT false-green on a dead WS namespace (probe the socket connect, not just /health). The boot-probe boots the api (the gateway loads at boot — a wiring error would crash boot → caught).
## Sequencing: B-0 schema+deps → B-1 shared (Message/SendMessage types) → B-2 REST + gateway (commit-per-spec) → [D-block] → B-3 UI → B-4/5/6. PUSH after each.
