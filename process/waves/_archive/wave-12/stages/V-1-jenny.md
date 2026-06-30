# V-1 — Jenny semantic-spec verification (wave-12 M3 real-time messaging)

**Verdict: APPROVE**

Independent verification of the LIVE deployed state (`main @ 1a700b9`, which contains
merge `168c45f` / PR#23 as an ancestor) against the 3-block spec contract
(`tasks.description` of `a0c322b4-72de-4c8d-ac27-bb51dda5f464`). Every load-bearing AC
traces to live code and a live probe. No deferred-scope creep, no Redis, no gold-plating.

## Deployed-state confirmation (not just repo state)
- Git: `168c45f` (PR#23 merge) **is an ancestor** of HEAD `1a700b9`. Working tree code == verified code.
- Live API `https://api-production-b93e.up.railway.app`:
  - `GET /health` → **200** (bare-path API; `/healthz` 404 is expected — wrong path, not a regression).
  - `GET /channels/<uuid>/messages` unauthed → **401** (M3 route LIVE + auth-gated).
  - `POST /channels/<uuid>/messages` unauthed → **401** (LIVE + gated).
  - `GET /socket.io/?EIO=4&transport=polling` → **200** engine.io handshake (Socket.IO server LIVE).
    The `/messaging` namespace is the application namespace on that same engine mount; C-2
    proved it auth-rejects unauthed sockets with `connect_error: Unauthorized` via a real
    socket.io client (a raw HTTP GET to `/messaging/?EIO=4` 404s by design — not the engine path).
- C-2 (`C-2-deploy-and-verify.md`): authoritative Railway deployment-state SUCCESS for api+web,
  stale-revision race broken (404→401 transition), migration 0005 applied in order, env scoping
  correct (web has no DB creds). Two-client real-time **93ms run1 / 87ms run2** (<1000ms), no-leak
  on non-joined client, WS-unauth reject — all MEASURED live.

## Per-block findings

### Block a0c322b4 — MessagingModule + send/list REST data plane — **MATCHES**
- Migration `messages` (`apps/api/src/db/schema/messages.ts`): id uuid pk; `channel_id` uuid
  → channels onDelete **cascade** (L14-16); `author_id` text → users.id (L17-19); `content`
  notNull (L20); `created_at` timestamptz default now() notNull (L21); `idempotency_key` text
  (L22); **UNIQUE(channel_id, idempotency_key)** (L26); **INDEX(channel_id, created_at)** (L28). Exact match.
- Content bounds (`packages/shared/src/messaging.ts:21-28`): `.trim().min(1).max(4000)` →
  empty/oversized → 400 via `BadRequestException` (`messages.controller.ts:54-57`). Matches AC "max e.g. 4000".
- POST/GET gated by `@UseGuards(AuthGuard, ChannelMessageGuard)` (`messages.controller.ts:47,66`).
  `ChannelMessageGuard` (`apps/api/src/rbac/channel-message.guard.ts`) is the **channelId-ONLY**
  guard reading `channelId` from `req.params` only (IDOR-safe, default-DENY) and delegating to
  `RbacService.canViewChannelById` — exactly as the spec mandates (the wave-10 ChannelPermissionGuard
  required both :id+:channelId and could NOT be reused; this is the correct new guard).
- `canViewChannelById` (`rbac.service.ts:344-354`) resolves `server_id` from the channels row
  (notNull) then applies the existing `canViewChannel` owner/private/override logic (L274-330). Matches.
- `author_id = req.session.getUserId()` (`messages.controller.ts:60`) — **never from body**. No spoofing. Matches.
- Idempotency: `INSERT ... onConflictDoNothing(target: [channel_id, idempotency_key])` then re-fetch
  the canonical row (`messages.service.ts:89-114`) → repeat key returns existing message, no dup. Matches.
- Emits `message.created` via EventEmitter2 (`messages.service.ts:141`). Matches.
- Cursor pagination: opaque base64url `createdAt|id` cursor, stable `(created_at DESC, id DESC)`
  tie-break, `nextCursor` sentinel-row detection (`messages.service.ts:14-31,156-226`). Matches.
- 401 unauthed / 403 non-permitted / 404 bad channel / 400 bad content — all present. Matches.

### Block 723b5b6a — /messaging Socket.IO gateway — **MATCHES**
- `@WebSocketGateway({ namespace: '/messaging' })` (`messaging.gateway.ts:67-73`). In-memory
  adapter (no Redis — confirmed repo-wide: only doc-comment mentions, no `ioredis`/`@socket.io/redis`).
- **WS-upgrade auth at connect**: `afterInit` registers `server.use()` (io.use) middleware
  (L90-145) that extracts `sAccessToken` from the handshake cookie (primary) or `auth.accessToken`
  (fallback), calls `Session.getSessionWithoutRequestResponse`, asserts the email-verified claim,
  and `next(new Error('Unauthorized'))` on any failure — **socket rejected at handshake, not at first
  message**. Matches AC. Live-proven by C-2 (`connect_error: Unauthorized`).
- **Room-per-channel, server-side re-derivation**: `join_channel` re-runs
  `rbacService.canViewChannelById(userId, channelId)` and only joins `channel:<id>` on success;
  forbidden → `error` emit, no join (`messaging.gateway.ts:165-185`). `leave_channel` supported (L192-197).
  Client never trusted to self-assert access. Matches.
- **Fan-out room-only**: `@OnEvent('message.created')` → `server.to('channel:'+channelId).emit('message:new', …)`
  (L207-211) — never broadcast-all. Matches. No-leak verified live (non-joined client received nothing).
- Delivery <1s: verified live 93/87ms. Matches.

### Block d999d29c — Message UI (composer + real-time list) — **MATCHES**
- Composer (`MessageComposer.tsx`): textarea + send; Enter=send / Shift+Enter=newline; disabled
  when empty/sending; clears on send. Dark theme, design-system colors. Matches.
- List (`MessageList.tsx`): `role="log" aria-live="polite"`; newest-at-bottom auto-scroll;
  load-older on scroll-up via cursor (L297-298); three row states (sent / pending aria-busy /
  failed role=alert + Retry); empty-channel state; loading/error states. Matches design + AC.
- Optimistic send (`useMessages.ts:124-152`): client-generated `crypto.randomUUID()` idempotencyKey
  → pending → POST → on 201 replace-with-confirmed / on error `failed` + retry (L155-185). Matches.
- Real-time (`messagingSocket.ts` + `useMessages.ts:90-101`): singleton socket.io client to
  `/messaging` with `withCredentials:true` (session cookie); `join_channel` on channel select,
  `leave_channel` on switch (L59-64); renders incoming `message:new` for the active channel only,
  deduped by id (L92-98). Channel switch re-subscribes (L60-63). Matches.

## Scope / right-sizing (DRIFT check — confirm NO creep)
- **NO** reactions / threads / mentions / attachments / presence / typing / member-list code in the
  messaging surface (grep clean across gateway, service, controller, all 4 web shell files). Deferred scope held.
- **NO** Redis — single-pod in-memory throttler + Socket.IO adapter confirmed (`main.ts`, `app.module.ts`).
- Reuses M2 RBAC (`canViewChannel`) — no parallel auth path invented.
- No gold-plating: first messaging slice is right-sized to the metric. Cursor pagination, idempotency,
  and optimistic UI are spec-required, not embellishment.

## Minor note (not blocking)
- `messages.service.ts:116-131` — the **null-idempotencyKey** insert path re-fetches "latest row by
  author+channel+content," a best-effort heuristic that is theoretically ambiguous under rapid
  identical duplicate content. **Not exercised in the live flow**: the UI always generates an
  idempotencyKey client-side (`useMessages.ts:127`), so every real POST takes the deterministic
  UNIQUE-keyed path. Severity **Low** — record for L-2; no rework needed this wave.

## M3 success-metric assessment
**MET, verified live.** "Two students exchange messages in real time <1s" is satisfied: two
authenticated Socket.IO clients see a posted message propagate as `message:new` in **93ms / 87ms**
(C-2, 2 runs), with room-scoped no-leak and WS-upgrade auth rejection. The success metric is the
load-bearing AC and it is green on the live deployment.

## M3-progress assessment
**M3 is progressing correctly toward closeable — but is NOT yet closeable, by design.** This wave
delivers the **first messaging bundle** (the conversational core: persist + list + real-time fan-out
+ chat UI). The spec explicitly defers reactions / threads / mentions / attachments / presence /
typing to later M3 waves. So: the milestone's headline metric is now demonstrably met, the
highest-risk surfaces (auth, channel-access, WS-upgrade auth, no-cross-channel-leak, idempotency)
are live and proven, and more M3 scope legitimately remains. No premature-close pressure; no scope
pulled forward to fake completion. Healthy single-bundle increment.

---
**APPROVE** — all 3 blocks MATCH; deployed state == verified state; M3 metric met live at 93ms;
deferred scope held; no gold-plating; one Low-severity note logged for L-2.
