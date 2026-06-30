# P-4 Phase 2 — Karen source-claim verification (wave-12, M3 real-time messaging)

**Gate:** P-4 Phase 2 (source-claim / reality verification), PRE-build, security-tightened (auth + channel-access + WS-upgrade auth).
**Wave:** 12 — M3 messaging first bundle (multi-spec: a0c322b4 REST data plane / 723b5b6a Socket.IO gateway / d999d29c message UI).
**Verdict:** **REJECT (REWORK)** — one Critical claimed-but-fake reuse defect (guard/route/signature mismatch) must be encoded into the spec + plan before B-block. WS-auth crux is VERIFIED; all other claims hold. Single targeted fix, no re-architecture.
**Note:** Gemini cross-check UNAVAILABLE (transient) — this is a single-reviewer (Karen) verdict; findings are grounded in live-code reads cited below, not model consensus.

---

## Per-claim findings

### Claim 1 — ChannelPermissionGuard reusable as-is on `/channels/:channelId/messages` → **WRONG (Critical)**

The guard EXISTS (wave-10, `apps/api/src/rbac/channel-permission.guard.ts`), IS IDOR-safe (reads from route params, never body), and delegates to `RbacService.canViewChannel`. All TRUE. **But the "reusable as-is" half of the claim is false**, and the falsity is load-bearing (it is the channel-access security control for both REST endpoints):

- `channel-permission.guard.ts:48-52` reads **both** `req.params.id` (serverId) **and** `req.params.channelId`, and throws `ForbiddenException('Missing route params: id and channelId required')` if **either** is absent.
- The spec route (`tasks.description` AC + `P-3-plan.md:9`) is **`/channels/:channelId/messages`** — a bare path with **NO `:id` (serverId) param**. Mounted as-written, the guard throws 403 on **every** request (the security control fails closed but the feature is 100% non-functional — no message can ever be sent or listed).
- `RbacService.canViewChannel(userId, serverId, channelId)` (`rbac.service.ts:274`) **requires serverId** — its owner check (`servers.id = serverId`), membership check (`server_members.server_id = serverId`), and channel load (`channels.id = channelId AND channels.server_id = serverId`) all key on serverId. There is no serverId-less variant.
- `P-3-plan.md:13` compounds this by writing the gateway call as `RbacService.canViewChannel(userId, channelId)` — a **2-arg call against a 3-arg signature**. This will not compile under TS strict mode (the locked stack, `_library.md:41`), and even if coerced is semantically wrong.

**Severity Critical** because: (a) it is the channel-access authorization door — the #1 security AC of the wave; (b) as-specified the guard either crashes the build (gateway 2-arg call) or fails-closed-and-bricks the feature (REST bare-path); (c) it is invisible until B-block runtime, exactly the "claimed-but-fake reuse" antipattern the P-4 source-claim gate exists to catch.

**Fixable, not fatal — the fix is mechanical** (`channels.server_id` is `notNull`, `servers.ts:70`, so serverId IS derivable from channelId with one lookup). REWORK, not ESCALATE. The spec + plan MUST encode ONE of:
- **(preferred) bare-path-aware variant**: add `RbacService.canViewChannelById(userId, channelId)` that resolves `server_id` from the `channels` row first, then runs the existing logic; and a guard variant (or a param-shape branch) that reads serverId-from-channel when `params.id` is absent. The gateway `join_channel` handler uses the same `…ById` path (it only ever has channelId).
- **(alternative) nested route**: change the route to `/servers/:id/channels/:channelId/messages` so the existing guard + 3-arg signature apply verbatim (matches the existing `channel-override.controller.ts:34` pattern `servers/:id/channels/:channelId/overrides`). This is a spec route-shape change and breaks the "bare-path API" instruction in the spec note — so (preferred) is the lower-blast-radius fix.

Either way: this is a NEW unit (the `…ById` derivation + its own IDOR + private-channel-default-deny test), not free reuse. The spec's edge-cases and T-8 plan must add a case proving the bare channelId path still default-denies a private channel to a non-member.

### Claim 2 — WS-upgrade auth feasible via `getSessionWithoutRequestResponse` (THE CRUX) → **VERIFIED**

This is the load-bearing feasibility claim and it is **real, not hand-wave**:
- `supertokens-node@24.0.2` is installed (`apps/api/package.json` + `apps/api/node_modules/supertokens-node/package.json:version 24.0.2`).
- `Session.getSessionWithoutRequestResponse(accessToken, antiCsrfToken?, options?, userContext?)` is present in the installed build's type decls (`apps/api/node_modules/supertokens-node/lib/build/recipe/session/index.d.ts:46-53`) and runtime (`…/index.js`), exported at `index.d.ts:101`. It takes a raw access-token string — exactly the req/res-free shape a Socket.IO handshake needs (no Express req/res available at WS upgrade).
- The handshake-cookie source is sound: the existing REST path uses the SuperTokens express middleware + `verifySession()` (`auth.guard.ts`, `auth.middleware.ts`) which sets the httpOnly access-token cookie; the gateway extracts that same access token from `socket.handshake.headers.cookie` (cookie-first per resolved decision `_library.md:575` #8) OR the documented `auth:{token}` fallback for cross-origin/PWA, and verifies via `getSessionWithoutRequestResponse`. supertokens-integration (owner of WS-auth) is the correct specialist. **VERIFIED.**
- One implementation caveat for B-block (not a gate blocker): `getSessionWithoutRequestResponse` returns `SessionContainer | undefined` (or throws `TRY_REFRESH_TOKEN` / `UNAUTHORISED`) — the gateway middleware MUST treat `undefined`/throw as **reject-the-socket-at-connect** (the AC requires rejection at upgrade, not first message). Encode this in the spec's WS AC so it isn't silently swallowed.

### Claim 3 — author_id session-derived (`req.session.getUserId()`, never body) → **VERIFIED (sound)**

Matches the existing, proven pattern: the guard already reads `req.session.getUserId()` (`channel-permission.guard.ts:46`) and the REST AuthGuard runs `verifySession()` upstream, populating `req.session`. The controller deriving `author_id` from session (spec AC + `P-3-plan.md:9`, "never body") is consistent with shipped wave-10 code. No spoofing surface. Sound.

### Claim 4 — messages schema implementable (cascade, UNIQUE, index, cursor pagination) → **VERIFIED**

`messages` is correctly absent (`apps/api/src/db/schema/` holds only index/invites/servers/users — no messages file, as expected for a net-new table). `channels` exists in `servers.ts:68` (per arch decision #2 — channels live in ServersModule's schema file, NOT a separate `channels.ts`; the plan/spec correctly FK `channel_id → channels onDelete cascade`). `channels.id` is a uuid PK (`servers.ts:69`), so the FK + `onDelete cascade` + `UNIQUE(channel_id, idempotency_key)` + `INDEX(channel_id, created_at desc)` are all implementable on Drizzle. Cursor (keyset) pagination on `(created_at, id)` matches the locked arch contract (`_library.md:109,122`). VERIFIED. (B-0 note: schema file goes IN `servers.ts` per the canonical one-file-per-table-owned-by-module convention, OR a new `messages.ts` re-exported via `schema/index.ts` — either is consistent; flag only so the migration is generated, not hand-edited, per `_library.md:164`.)

### Claim 5 — single-pod in-memory Socket.IO adapter (NO Redis) → **VERIFIED**

Correct and implementable. `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io` are NOT yet present (the plan adds them at B-0, `P-3-plan.md:3`) — confirmed absent from `apps/api/package.json` (only `@nestjs/common|core|platform-express|throttler` present). The in-memory default adapter is the documented single-pod MVP pattern (`_library.md:423` "No Redis at MVP… Socket.IO in-memory suffices"); the namespace `/messaging` is one of the two locked namespaces (`_library.md:30,587` #20). VERIFIED. (Carry the C-2 infra note — Railway proxy must pass the WS Upgrade handshake; deploy-verify must probe the socket connect, not just `/health` — already captured in the spec note + `P-3-plan.md:24`.)

### Carry-forward A — websocket-engineer ABSENT, supertokens-integration PRESENT → **CONFIRMED (action required)**

- `websocket-engineer` is **ABSENT** from `command-center/AGENTS.md` (grep: not found). Per always-on rule 11, it MUST be install-or-substituted before any B-block spawn that names it. `P-3-plan.md:11,22` names `websocket-engineer` as a B-2 specialist AND lists it under "Specialists (AGENTS.md ✓)" — **that ✓ is false**. This must be corrected: either install `websocket-engineer` via the agent-creator pipeline, or substitute the closest catalog match (the loaded agent roster DOES include a `websocket-engineer` type — confirm it is registered in AGENTS.md before the build spawn, or note the swap).
- `supertokens-integration` is **PRESENT** in `AGENTS.md` and its capability line explicitly owns "Socket.IO WS-upgrade auth" — correct owner for the crux. CONFIRMED.

### Carry-forward B — @nestjs/event-emitter NOT yet a dep → **CONFIRMED (action required)**

`@nestjs/event-emitter` is **NOT** in `apps/api/package.json`, and there is **no** `EventEmitterModule` / `EventEmitter2` / `@OnEvent` usage anywhere in `apps/api/src/` (grep: zero hits). The plan's B-0 step (`P-3-plan.md:9` "add @nestjs/event-emitter if needed"; gateway `@OnEvent('message.created')` at `:14`) is therefore REQUIRED, not optional: B-0 MUST add the dep AND `EventEmitterModule.forRoot()` to the app module, or the `message.created` → `@OnEvent` fan-out silently never fires (REST send would 201 but no real-time delivery — a two-client test would catch it at T-8, but it should be pre-empted at B-0). CONFIRMED.

### Claim 8 — Antipatterns (gold-plating / claimed-but-fake) → **ONE fake-reuse defect; NO gold-plating**

- **Gold-plating: NONE.** Reactions/threads/mentions/attachments/presence/typing are explicitly deferred (spec note + `_library.md:618`). Single-pod no-Redis is the right MVP cut. Scope is a tight 3-task vertical slice. Clean.
- **Claimed-but-fake: ONE (Claim 1 above).** The "reuse the wave-10 guard as-is" claim overstates reuse — the guard + `canViewChannel` need a real channelId-only derivation variant for the bare-path route. This is the single REWORK driver.

---

## Severity ledger

| # | Claim | Verdict | Severity |
|---|-------|---------|----------|
| 1 | Guard reusable as-is on `/channels/:channelId/messages` | **WRONG** | **Critical** |
| 2 | WS-upgrade auth via `getSessionWithoutRequestResponse` (CRUX) | VERIFIED | — |
| 3 | author_id session-derived (never body) | VERIFIED | — |
| 4 | messages schema + cursor pagination implementable | VERIFIED | — |
| 5 | single-pod in-memory Socket.IO (no Redis) | VERIFIED | — |
| A | websocket-engineer absent / supertokens-integration present | CONFIRMED | High (rule-11 action) |
| B | @nestjs/event-emitter not yet a dep | CONFIRMED | Medium (B-0 action) |
| 8 | gold-plating / fake-reuse | 1 fake-reuse, no gold-plating | (rolls into #1) |

---

## REWORK actions (must land in spec + plan before B-block APPROVE)

1. **[Critical, blocking] Resolve the guard/route/signature mismatch.** Adopt the bare-path-aware variant: add `RbacService.canViewChannelById(userId, channelId)` (resolves `server_id` from the `channels` row, then runs existing visibility logic) + a guard that reads serverId-from-channel when `params.id` is absent; gateway `join_channel` uses the same `…ById` path. Update `P-3-plan.md:13` to the correct 3-arg-or-`…ById` call. Add a T-8 case proving the bare channelId path default-denies a private channel to a non-member (the IDOR/leak proof must cover the new path, not just the old `/servers/:id/...` one). *(Alternative: nest the route under `/servers/:id/channels/:channelId/messages` to reuse verbatim — but that contradicts the spec's bare-path instruction; prefer the variant.)*
2. **[High, rule-11] Correct the "AGENTS.md ✓" line.** Install `websocket-engineer` (agent-creator pipeline) or register/confirm it in `AGENTS.md` before the B-2 spawn; if substituting, note the swap. supertokens-integration is already correct for the WS-auth.
3. **[Medium, B-0] Make the event-emitter step non-optional.** B-0 adds `@nestjs/event-emitter` + `EventEmitterModule.forRoot()`; otherwise `@OnEvent('message.created')` never fires.
4. **[Low, spec clarity] Encode reject-at-upgrade semantics.** WS AC must state: `getSessionWithoutRequestResponse` returning `undefined` / throwing `UNAUTHORISED`/`TRY_REFRESH_TOKEN` → disconnect the socket at connect (not at first message).

Re-submit to P-4 Phase 2 once the spec `tasks.description` + `P-3-plan.md` carry items 1-3 (item 4 is a clarity nice-to-have). The crux (WS-auth) is proven, so this is a single-pass REWORK, not an architecture reopen.

---

## Files referenced (absolute)

- `process/waves/wave-12/stages/P-3-plan.md` (lines 3, 9, 11, 13, 22, 24)
- spec: `tasks.description` of `a0c322b4-72de-4c8d-ac27-bb51dda5f464` (DB row — source of truth)
- `command-center/dev/architecture/_library.md` (lines 30, 41, 109, 122, 164, 423, 575, 587, 618)
- `apps/api/src/rbac/channel-permission.guard.ts:46,48-52` (params.id + params.channelId required; fail-closed)
- `apps/api/src/rbac/rbac.service.ts:274` (`canViewChannel(userId, serverId, channelId)` — 3-arg, serverId-keyed)
- `apps/api/src/db/schema/servers.ts:68-79` (`channels` table; `server_id` notNull — derivation source)
- `apps/api/src/db/schema/` (messages correctly absent)
- `apps/api/node_modules/supertokens-node/lib/build/recipe/session/index.d.ts:46-53,101` (`getSessionWithoutRequestResponse` present)
- `apps/api/package.json` (supertokens-node@24.0.2; @nestjs/event-emitter + socket.io ABSENT)
- `apps/api/src/auth/auth.guard.ts`, `auth.middleware.ts` (existing verifySession/cookie pattern — WS-auth source)
- `command-center/AGENTS.md` (websocket-engineer ABSENT; supertokens-integration PRESENT, owns WS-auth)
