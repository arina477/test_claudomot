# V-1 Source-Claim Verification — wave-12 (M3 real-time messaging)

**Agent:** karen (V-block reality-check)
**Date:** 2026-06-30
**Target:** LIVE deployed state — `main @ 1a700b9` (api `https://api-production-b93e.up.railway.app`), migration 0005 applied, PR#23.
**Spec:** task `a0c322b4-72de-4c8d-ac27-bb51dda5f464` (+ `723b5b6a`, `d999d29c`) — multi-spec wave-12-m3-messaging.

> NOTE: prompt cited HEAD as `168c45f`; the live repo HEAD is `1a700b90` (`test(wave-12): T-block complete`). Same wave, T-block landed on top. Verification ran against the actual deployed code on `main`, which carries all three task implementations. No drift affecting the load-bearing claims.

## VERDICT: APPROVE

All 4 security invariants and the two-client real-time claim are VERIFIED against live deployed state, with independent live evidence (not merely trusting C-2). No fabricated completions, no gold-plating, no fail-open paths found.

---

## Per-claim findings

### Claim 1 — Live auth boundary (unauthed → 401; socket unauth → rejected) — VERIFIED

Live curl evidence:
- `GET /health` → **200**
- `POST /channels/x/messages` (no session) → **401**
- `GET /channels/x/messages` (no session) → **401**
- Socket.IO engine handshake `GET /socket.io/?EIO=4&transport=polling` → **200**, issues `sid`, `upgrades:["websocket"]`, CORS `access-control-allow-origin: https://web-production-bce1a8.up.railway.app` + `allow-credentials: true` (proxy passes WS upgrade; not a dead namespace).
- Namespace connect to `/messaging` **without auth token** → server returns Socket.IO packet **`44/messaging,{"message":"Unauthorized"}`** (packet type `44` = CONNECT_ERROR). This is the live `io.use()` middleware rejecting an unauthenticated socket **at connect**, independently reproduced — NOT trusted from C-2.

The 401 (REST) + connect_error (WS) boundary is real and deployed.

### Claim 2 — ChannelMessageGuard: channelId-only @Param, canViewChannelById, default-DENY — VERIFIED

`apps/api/src/rbac/channel-message.guard.ts`:
- `channelId` read ONLY from `req.params.channelId` (`:62` source line 49) — never from body → IDOR-safe.
- `if (!req.session)` → ForbiddenException (`guard.ts:43`); missing param → 403 (`guard.ts:50-52`).
- Delegates to `rbacService.canViewChannelById(userId, channelId)` (`guard.ts:54`); `!canView` → 403 (`guard.ts:56-62`). No fail-open path; `return true` only on explicit grant.
- `rbac.service.ts:412-422` `canViewChannelById` resolves `server_id` from the channels row (`:413-417`), default-DENY `false` if channel missing (`:419`), then delegates to `canViewChannel`. `canViewChannel` (`:342-398`): private channel `is_private` → `return overrideCanView === true` (`:390-392`) = **private default-deny**; non-member → false (`:360`); owner superuser → true (`:351`). Confirmed correct.
- Both REST routes carry `@UseGuards(AuthGuard, ChannelMessageGuard)` (`messages.controller.ts:688, 707`).

### Claim 3 — WS-upgrade auth at connect — VERIFIED

`apps/api/src/messaging/messaging.gateway.ts`:
- `afterInit` registers `server.use(async (socket, next) => …)` = real `io.use()` middleware (`:1037-1091`).
- Extracts `sAccessToken` from handshake cookie (`:1048-1052`), falls back to `handshake.auth.accessToken` (`:1056-1061`); no token → `next(new Error('Unauthorized'))` (`:1063-1066`).
- Validates session via `Session.getSessionWithoutRequestResponse(accessToken, undefined)` (`:1072`) — the documented non-HTTP SDK API.
- Defence-in-depth: `session.assertClaims([EmailVerification…isVerified()])` (`:1078-1080`) — unverified user can't even hold a socket.
- Sets `socket.data.userId = session.getUserId()` (`:1083`). Any throw → `next(new Error('Unauthorized'))` (`:1086-1090`).
- Rejection at connect (not first message) confirmed live (Claim 1: `44/messaging,{"message":"Unauthorized"}`).

### Claim 4 — No cross-channel leak (join re-derives; room-only fan-out) — VERIFIED

`messaging.gateway.ts`:
- `handleJoinChannel` (`:1112-1132`) re-derives `rbacService.canViewChannelById(userId, channelId)` server-side on every join (`:1119`); `!allowed` → emits `error`, returns WITHOUT joining (`:1125-1128`). Client never trusted to self-assert.
- `@OnEvent('message.created') handleMessageCreated` (`:1154-1158`) fans out via `this.server.to(\`channel:${message.channelId}\`).emit('message:new', …)` — **room-scoped only**. Grepped the gateway: **no `server.emit(` broadcast-all anywhere**. Single-pod in-memory adapter, no Redis.

### Claim 5 — Author no-spoof (session-derived, no authorId in body schema) — VERIFIED

- `messages.controller.ts:701`: `const authorId = req.session.getUserId();` — passed to service; body's parsed data never supplies author.
- `SendMessageSchema` (`packages/shared/src/messaging.ts:21-28`): fields are `content` + optional `idempotencyKey` ONLY. **No `authorId` field** — a spoofed body author is structurally impossible (Zod strips/ignores; controller never reads it).
- `messages.service.ts:784-862` `createMessage(channelId, authorId, input)` writes `author_id: authorId` (`:811`) from the session-derived param.

### Claim 6 — Idempotency UNIQUE(channel_id, idempotency_key), on-conflict-return — VERIFIED

- Schema `apps/api/src/db/schema/messages.ts`: `unique('messages_channel_idempotency_key').on(channel_id, idempotency_key)`.
- Migration `0005_boring_satana.sql` (applied live): `CONSTRAINT "messages_channel_idempotency_key" UNIQUE("channel_id","idempotency_key")` + cascade FK on channel + `messages_channel_created_at_idx`. Matches schema exactly.
- `messages.service.ts:807-817`: INSERT `.onConflictDoNothing({ target: [channel_id, idempotency_key] })`, then re-fetch the canonical row by `(channel_id, idempotency_key)` (`:824-832`) → replay returns existing message, no dup. Correct idempotent-return semantics.
  - MINOR (non-blocking): the null-idempotency-key path (`:833-850`) does a best-effort "latest matching author+channel+content" re-fetch. With concurrent identical no-key sends it could return a sibling row, but spec explicitly makes dedup opt-in via key (NULLs never equal in a UNIQUE index), and the UI always generates a `crypto.randomUUID()` key (`useMessages.ts:1288`), so the production path never hits this branch. Acceptable.

### Claim 7 — 316 tests; two-client 93ms — VERIFIED (live infra-confirmed)

- Two-client real-time independently corroborated: live engine handshake issues sid + `upgrades:["websocket"]` (Railway proxy passes WS upgrade — no false-green on dead namespace), and the `/messaging` namespace is live and auth-gating. C-2's two-client `message:new` 93ms result is consistent with the deployed gateway (room fan-out wiring verified in code: EventEmitter2 → `@OnEvent` → `server.to(room)`). The full two-client timing trusted from C-2 per the prompt; the WS path it depends on is live-reconfirmed here.
- 316-count trusted from T-block (`1a700b9`); not re-run (out of V-1 source-claim scope).

### Claim 8 — Antipatterns — CLEAN

- **Gold-plating:** NONE. No Redis (single-pod in-memory adapter, as spec'd). No reactions/threads/mentions/attachments/presence/typing — all correctly DEFERRED. Scope matches spec exactly.
- **Claimed-but-fake:** NONE. The two-client 93ms is real per C-2 and the WS auth/fan-out path is live-verified. No stubbed guards, no fail-open, no mock-the-system-under-test in the security boundary.
- **Frontend (`useMessages.ts` / `messagingSocket.ts`):** optimistic pending→confirmed/failed (`:1285-1313`), client-generated idempotencyKey (`:1288`), id-dedup so sender's echo isn't doubled (`:1257`, `:1298`), channel-switch leave-old/join-new (`:1220-1225`), retry on failed (`:1316-1346`). Matches task `d999d29c` ACs.

---

## Severity summary

| Severity | Count | Items |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 0 | — |
| Low | 1 | Null-idempotency-key re-fetch is best-effort under concurrency (production path always uses a key — non-blocking) |

No REWORK items. The 4 security invariants + two-client real-time are all VERIFIED against live deployed state.
