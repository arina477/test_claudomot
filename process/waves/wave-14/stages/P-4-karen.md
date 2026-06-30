# P-4 Phase-2 — Karen load-bearing-claim verification (wave-14, M3 presence layer)

**Verdict: APPROVE** (with one process note + one design carry, neither blocking).

Reuse/architecture claims are grounded in real code. The plan does not invent infrastructure; it mirrors proven wave-12/13 patterns.

## Per-claim ledger

| # | Claim | Status | Evidence |
|---|---|---|---|
| 1 | Reuse /messaging WS-upgrade auth (SuperTokens session-validation factorable into /presence; no new auth surface) | **VERIFIED** | `apps/api/src/messaging/messaging.gateway.ts:98-153` — `afterInit(server)` installs `server.use()` io.use() middleware that extracts `sAccessToken` cookie (`:109-113`) + `socket.handshake.auth.accessToken` fallback (`:117-122`), calls `Session.getSessionWithoutRequestResponse(accessToken, undefined)` (`:133`), asserts email-verified claim (`:139-141`), attaches `socket.data.userId` (`:144`). This is exactly the path the plan factors out (P-3-plan.md:8,52). Cleanly extractable to a shared `ws-auth.ts`. |
| 2 | Membership from existing `server_members` (M1); no new membership model | **VERIFIED** | `apps/api/src/db/schema/servers.ts:43-57` — `server_members` table exists with `server_id`, `user_id`, `role_id`, `UNIQUE(server_id,user_id)`. Resolves co-membership with no schema delta. |
| 3 | `canViewChannelById` exists for typing channel-scoping | **VERIFIED** | `apps/api/src/rbac/rbac.service.ts:344-354` — `canViewChannelById(userId, channelId)` present; resolves `server_id` from `channels.server_id` then delegates to `canViewChannel`. Same method /messaging `join_channel` uses (`messaging.gateway.ts:180`). Directly reusable for `typing:start` visibility re-derivation. |
| 4 | `messagingSocket.ts` exists as presenceSocket mirror template | **VERIFIED** | `apps/web/src/shell/messagingSocket.ts:59-73` — lazy singleton `io(\`${BASE}/messaging\`, {withCredentials:true, autoConnect, reconnection...})`, on/off subscribe helpers (`:86-140`), `getSocketState()` (`:143-149`). A faithful structural template for `presenceSocket.ts`. |
| 5 | No migration — presence in-memory, no DB write path | **VERIFIED** | Spec `data:` declares in-memory ref-count map + ephemeral typing TTL; P-3-plan.md:22,38 declares B-1 Schema = none. Membership reads are SELECTs only (rbac.service.ts uses `db.select` throughout; no INSERT/UPDATE in the read paths the gateway will call). Correct — soft state, resets on restart, clients re-snapshot. |
| 6 | Specialists exist (websocket-engineer, backend-developer, react-specialist, frontend-developer, typescript-pro, supertokens-integration) | **VERIFIED (5/6) + 1 process gap** | 5 present in `command-center/AGENTS.md`. **`websocket-engineer` NOT in AGENTS.md** but IS in `process/session/.capability-sheet.md:191` — so it is installed/available and spawnable; rule-11 requires presence in BOTH. Non-blocking for the plan (agent is real), but AGENTS.md should get a `websocket-engineer` row to satisfy the discovery-layer contract. |
| 7 | Spec ACs falsifiable; no gold-plating | **VERIFIED** | ACs are concrete/testable: ref-count multi-tab non-flap, membership-scoped fan-out with explicit no-leak assertion, snapshot-on-join, throttle ~3s, TTL ~5s, aggregation cap >3, collapse ≤1024px. No "works correctly" hand-waving. Scope is appropriately thinned — author-row presence dots (10b9d18e) DEFERRED at P-0; threads/mentions/attachments parked. Two-client fan-out + no-leak carried to T-8. No gold-plating; room-model-vs-co-member-recompute trade-off is documented (plan:10-11). |

## Notes (non-blocking)

- **Process gap (#6):** `websocket-engineer` present in capability sheet but absent from `command-center/AGENTS.md`. Plan claim at P-3-plan.md:72 ("all present in AGENTS.md / capability sheet") is technically WRONG for AGENTS.md but the agent is real and spawnable. Recommend adding the AGENTS.md row during this wave; does not block P-4.
- **Design carry (AC for task 058984c5, member panel):** the member-list panel in `design/server-channel-view.html:463` is a "minimal shell; out of D-block scope" placeholder, BUT the §9 responsive behavior the plan depends on IS specified (`:78-82` — `.right-sidebar { display:none }` at ≤1024px). The spec correctly flags `design_gap_flag: true`, so the full grouped Online/Offline + dots design will be authored at the D-block. The responsive-collapse AC is already grounded in the existing design; the visual grouping is the legitimate D-block gap. Consistent — not a gap in the plan.

## Bottom line
APPROVE. Every load-bearing reuse claim points at real, current code at a real line. No invented infrastructure, no fictional reuse template, no schema/migration sneaking in. The one true defect (websocket-engineer missing from AGENTS.md) is a discovery-layer hygiene fix, not an architecture flaw.
