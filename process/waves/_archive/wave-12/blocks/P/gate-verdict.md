# Wave 12 — P-4 Gate verdict (head-product, Phase 1)

**Block:** P · **Wave:** 12 (M3 real-time messaging, first bundle — the conversational core) · **Gate:** P-4 · **Security-tightened gate: APPLIED** (auth + channel-access + WebSocket-upgrade auth).

## Phase 1 verdict: APPROVED → proceed to Phase 2 (karen + jenny mandatory)

The security crux that triggers the tightened gate — WS-upgrade auth, server-side channel-gating, no cross-channel leak, no author-spoof — is **verified sound and build-ready against the live codebase**. Two non-security plan defects (an absent agent and a missing dependency) are carried forward as binding pre-B-block corrections; neither is load-bearing on the security ACs and both are cheaply fixable within the existing plan, so they do not warrant REWORK.

---

## Security-tightened gate — load-bearing claims VERIFIED (the crux)

| Claim | Verdict | Evidence |
|---|---|---|
| **Channel-gating, server-side** | PASS | `apps/api/src/rbac/channel-permission.guard.ts` exists; reads `serverId`/`channelId` from ROUTE PARAMS only (explicit IDOR-prevention comment + code), delegates to `RbacService.canViewChannel(userId, serverId, channelId)`. Reuse on `/channels/:channelId/messages` (param-named) is correct. Both POST send + GET list spec'd `@UseGuards(AuthGuard, ChannelPermissionGuard)`. |
| **Author no-spoof** | PASS | Spec AC: `author_id = req.session.getUserId()`, "NEVER from body". Guard itself derives userId from session, never body. |
| **WS-upgrade auth (the hardest part)** | PASS — SOUND | `getSessionWithoutRequestResponse(accessToken, antiCsrfToken?, options?)` confirmed present in `supertokens-node@^24.0.2` (`recipe/session/index.d.ts:46-53`). This is the correct no-Express-req/res API for a WS handshake — the plan's approach (extract access token from handshake cookie/`auth` payload → verify off-request → reject unauth at connect) is feasible and standard. Note: the live `auth.guard.ts` uses the Express-middleware `verifySession()`; the gateway correctly needs the without-request-response variant, which the plan names. Arch §Security trust-boundary 2 + decision #8 (cookie-first, JWT-in-handshake fallback) match. |
| **No cross-channel leak** | PASS (design) | Spec + plan: room-per-channel (`channel:<id>`); `join_channel` re-derives `canViewChannel` server-side before `socket.join`; fan-out `server.to('channel:'+id)` ONLY, never broadcast-all. Matches arch §Cross-domain RBAC flow steps 9-11 + room abstraction (line 558). |
| **Idempotency** | PASS | `UNIQUE(channel_id, idempotency_key)`; on-conflict returns existing (no dup). Matches arch decision #1. |
| **Data model** | PASS | `messages.channel_id` → `channels.id` (`apps/api/src/db/schema/servers.ts:68`) onDelete cascade viable; `INDEX(channel_id, created_at)` matches arch hot-path index (line 140). Cursor (keyset on created_at+id) matches arch decision #11 + §Pagination (cursor-only). |
| **Infra: single-pod in-memory, NO Redis** | PASS | Plan uses default in-memory adapter; no Redis. Matches arch §DevOps "No Redis at MVP" + risk R-1/R-2 (single pod). Plan flags C-2 Railway WS-Upgrade verification + no-false-green-on-dead-WS + boot-probe catches gateway wiring crash. Correct. |

## Standard P-4 checks

- **Frame → one live bet/milestone:** PASS — M3 6198650e (conversational core; the <1s real-time metric). problem-framer PROCEED + ceo-reviewer PROCEED(HOLD-SCOPE) both present, reconciled. mvp-thinner correctly SKIP (platform-foundation floor).
- **Decompose:** PASS — one seed (a0c322b4 REST data plane) + two must-ship-together siblings (gateway, UI). Kept-whole justified: REST-first-Socket.IO-later ships an unobservable wave (fails V-1); the metric can't be met by REST-poll. No dep on an unbuilt out-of-bundle task (RBAC guard already shipped wave-10).
- **Spec — verifiable ACs + non-happy states:** PASS — each AC independently testable. UI spec names loading/empty(no-messages)/error + optimistic pending→confirmed/failed; offline is correctly out-of-scope (M4 wedge) but the idempotency_key client-gen lays the rail. Non-goals explicit: reactions/threads/mentions/attachments/presence/typing deferred. Full spec embedded as fenced YAML at head of seed `tasks.description` (verified via DB read).
- **Plan respects locked architecture:** PASS — reuses ChannelPermissionGuard, keyset cursor, idempotency-keyed creates, two-namespace `/messaging`, EventEmitter2 decoupling, room-fan-out — all match `_library.md`. No parallel mechanism invented. No unneeded infra (no Redis).
- **design_gap_flag:** TRUE-delta correctly set → D-block. `design/server-channel-view.html` EXISTS (33KB); D scoped to message-row (pending/sent/failed) + composer primitives. head-designer + react-specialist present in AGENTS.md.
- **T-8 plan:** PASS — live-probe authed message paths via wave-11 fixture (T-8 rule 1) + two-client <1s + WS-auth-rejection + no-leak join-rejection all named. Matches arch §Test "two-client verification mandatory".

---

## BINDING carry-forwards to B-block (pre-B-0 / B-0; not security-load-bearing, but must resolve)

1. **`websocket-engineer` is ABSENT from `command-center/AGENTS.md`** (roster confirmed: not present). The P-3 plan assigns the Socket.IO gateway to `websocket-engineer + supertokens-integration`. Per always-on rule 11, before spawning, head-builder MUST either install `websocket-engineer` via the agent-creator pipeline OR substitute the closest catalog match and note the swap. **Mitigant:** the load-bearing WS-auth work has a valid owner — `supertokens-integration` is present and its card explicitly covers "Socket.IO WS-upgrade session validation." The gap is the gateway *wiring* (namespace/rooms/fan-out) owner only. Resolve at B-0 agent-claim, not a re-architecture.

2. **`@nestjs/event-emitter` is NOT yet an api dependency** (confirmed absent from `apps/api/package.json`). The REST→gateway decoupling (`message.created` domain event → `@OnEvent` fan-out) requires it. The plan flagged this conditionally; make it non-conditional: add `@nestjs/event-emitter` + register `EventEmitterModule.forRoot()` at B-0 deps step alongside `@nestjs/websockets`/`@nestjs/platform-socket.io`/`socket.io`.

Both are tracked, not blocking — neither touches the verified security ACs.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  phase: 1-of-2
  reviewers:
    problem-framer: PROCEED        # P-0
    ceo-reviewer: PROCEED-HOLD-SCOPE # P-0
    karen: PENDING-PHASE-2
    jenny: PENDING-PHASE-2
  security_tightened_gate: APPLIED
  load_bearing_security_checks:
    channel_gating_server_side: PASS
    author_no_spoof: PASS
    ws_upgrade_auth_feasible: PASS   # getSessionWithoutRequestResponse confirmed in supertokens-node@24
    no_cross_channel_leak: PASS
    idempotency: PASS
  failed_checks: []
  carry_forwards:
    - "websocket-engineer absent from AGENTS.md — install or substitute-with-note at B-0 (rule 11); supertokens-integration owns the load-bearing WS-auth"
    - "@nestjs/event-emitter not yet an api dep — add + EventEmitterModule.forRoot() at B-0 (non-conditional)"
  design_gap_flag: true
  rationale: >
    The tightened gate's entire reason for existing — WS-upgrade auth, server-side channel-gating,
    no cross-channel leak, no author-spoof — is verified sound against the live codebase: the
    wave-10 ChannelPermissionGuard reads channelId from route params and delegates to a server-side
    canViewChannel; supertokens-node@24 exposes getSessionWithoutRequestResponse, making the WS-handshake
    auth feasible (not the hand-wave it could have been); room-per-channel + can()-on-join + room-only
    fan-out gives no-leak by construction; author_id is session-derived. The plan reuses the locked
    architecture wholesale (keyset cursor, idempotency UNIQUE, two-namespace, EventEmitter2 decoupling,
    in-memory single-pod, no Redis) with no parallel path. Two defects surfaced — an absent agent
    (websocket-engineer) and a missing dep (@nestjs/event-emitter) — are buildability/process items,
    not security gaps, and are cheaply correctable inside the existing plan; both are carried forward
    as binding B-0 corrections rather than blocking REWORK. Phase 2 (karen load-bearing + jenny
    spec-vs-bet) is mandatory before final block-exit.
  next_action: PROCEED_TO_PHASE_2_KAREN_JENNY
```

---

# Wave 12 — P-4 Gate verdict (head-product, Phase 1 — ATTEMPT 2)

**Trigger:** Phase-2 reviewer **karen REJECTed** attempt-1's Phase-1 APPROVED with ONE Critical defect I missed: the plan said "reuse the wave-10 ChannelPermissionGuard as-is" on `/channels/:channelId/messages`, but that guard (`channel-permission.guard.ts:47-52`) requires BOTH `req.params.id` (serverId) AND `:channelId`, throwing 403 if either is missing. The message routes have **no `:id`** → the guard fail-closes 100% (every message request → 403). Spec + P-3 were fixed; this is the fresh-spawn re-gate of the fix.

## Phase 1 (attempt 2) verdict: APPROVED → proceed to Phase 2 (karen re-verify)

The Critical guard defect is **genuinely fixed** — the fix design is sound, server-side, and reintroduces no IDOR or fail-open. Verified independently against the live codebase AND by a fresh karen spawn (PASS). A residual spec-text inconsistency karen surfaced (the GET-list AC still named the old two-param guard) is **resolved in this attempt** by a direct spec + plan edit, not deferred to the builder.

---

## The fix — load-bearing claims VERIFIED against the live codebase

| Claim | Verdict | Evidence |
|---|---|---|
| **The defect was real** | CONFIRMED | `apps/api/src/rbac/channel-permission.guard.ts:47-52` — reads `serverId = req.params.id` + `channelId = req.params.channelId`; `if (!serverId || !channelId) throw ForbiddenException`. The `/channels/:channelId/messages` routes have no `:id` → fail-closed 100%. karen's REJECT stands. |
| **`canViewChannelById` premise — serverId always resolvable** | PASS | `apps/api/src/db/schema/servers.ts:70-72` — `channels.server_id = uuid('server_id').notNull().references(...)`. notNull → `SELECT server_id FROM channels WHERE id=channelId` always resolves for any existing channel. Premise holds. |
| **Wrapping `canViewChannel` preserves private-channel default-deny** | PASS | `apps/api/src/rbac/rbac.service.ts:274-330` — existing `canViewChannel(userId, serverId, channelId)`: non-member → `return false` (line 292); private channel → `return overrideCanView === true` (default-deny, line ~322). `canViewChannelById` resolves serverId then delegates to this exact logic → the T-8 assertion (bare-channelId default-denies a private channel to a non-member, allows a permitted member) maps onto already-correct code. `canViewChannel` re-filters `channels.server_id = serverId` (line 298) so feeding back the resolved serverId is internally consistent — no spoofable-serverId path. |
| **New `ChannelMessageGuard` — no IDOR reintroduced** | PASS | Plan line 10 + spec AC: reads channelId from `@Param` (route-params, IDOR-safe — same trust model as the wave-10 guard's "ROUTE PARAMS only, never body"), never from body. author_id stays session-derived. Default-deny posture: returns 403 unless `canViewChannelById` returns true — no fail-open. |
| **Gateway parity** | PASS | Plan line 17 — `join_channel` re-derives `canViewChannelById(userId, channelId)` server-side before `socket.join`, closing the cross-channel-leak vector on the WS path with the SAME channelId-only resolver. REST + WS authorization consistent. |

## Residual inconsistency karen surfaced — RESOLVED IN THIS ATTEMPT (not deferred)

karen (PASS) flagged a non-blocking spec-text gap: the **GET** list AC and the plan security line still named the two-param `ChannelPermissionGuard` — which would fail-closed identically on the `:id`-less GET route if a builder followed the literal AC. This is the SAME defect class. I do NOT approve through it; both were edited now:

1. **Spec (DB, canonical) — task a0c322b4 GET AC:** `@UseGuards(AuthGuard, ChannelPermissionGuard)` → `@UseGuards(AuthGuard, ChannelMessageGuard) — SAME channelId-only guard as POST (the GET route also has NO :id param; ChannelPermissionGuard would fail-closed identically)`. Verified via DB read-back.
2. **P-3 plan security line:** `channel-gate send/list (ChannelPermissionGuard, IDOR)` → `ChannelMessageGuard — channelId-only, IDOR-safe; NOT the wave-10 two-param guard which fail-closes on the :id-less message routes`.
3. **P-3 plan specialists line:** removed the stale `websocket-engineer` (contradicted CARRY-FORWARD A), replaced with `node-specialist (gateway wiring, substitutes ABSENT websocket-engineer) + supertokens-integration (WS-auth)`.

Now POST and GET both name `ChannelMessageGuard` across spec + plan — the builder cannot reintroduce the fail-closed defect by following the literal AC.

## Carry-forwards — both now non-optional + codebase-justified

| # | Carry-forward | Verdict | Evidence |
|---|---|---|---|
| A | websocket-engineer absent → substitute node-specialist (wiring) + supertokens-integration (WS-auth) | PASS | `command-center/AGENTS.md` — `websocket-engineer` ABSENT; `backend-developer`/`node-specialist` present; `supertokens-integration` present, card lists "Socket.IO WS-upgrade auth". Encoded non-optionally at plan lines 14-15 + (now) line 26. rule-11 swap noted. |
| B | @nestjs/event-emitter dep + EventEmitterModule.forRoot() at B-0 | PASS | grep `apps/api/src` + `apps/api/package.json` — `@nestjs/event-emitter`/`EventEmitterModule`/`@OnEvent`/`EventEmitter2` ALL absent. Without it the `message.created → @OnEvent` fan-out silently never fires. Plan line 12 makes it non-conditional at B-0. |

## Unchanged-since-attempt-1 ACs (re-confirmed, not re-litigated)
WS-auth crux (`getSessionWithoutRequestResponse` in supertokens-node@24 — the correct off-request handshake API), author session-derived (no spoof), no-leak room-only fan-out, idempotency `UNIQUE(channel_id, idempotency_key)`, single-pod in-memory (no Redis). All PASS in attempt-1; the fix touched none of them.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  phase: 1-of-2
  attempt: 2
  re_gate_trigger: "karen Phase-2 REJECT of attempt-1 — ChannelPermissionGuard fail-closed on :id-less message routes"
  reviewers:
    problem-framer: PROCEED            # P-0 (unchanged)
    ceo-reviewer: PROCEED-HOLD-SCOPE   # P-0 (unchanged)
    karen: PASS                        # attempt-2 fresh spawn — guard fix sound + carry-forwards encoded; surfaced GET-AC gap (now resolved)
    jenny: PENDING-PHASE-2
  security_tightened_gate: APPLIED
  critical_defect_resolution:
    defect: "wave-10 ChannelPermissionGuard requires :id+:channelId → fail-closed 100% on /channels/:channelId/messages"
    fix_sound: true                    # canViewChannelById (serverId notNull→resolvable) + ChannelMessageGuard (channelId-only @Param, IDOR-safe) + gateway join_channel parity
    fix_server_side: true
    no_idor_regression: true           # channelId from route-params, author session-derived
    no_fail_open: true                 # default-deny; 403 unless canViewChannelById true
    get_route_also_fixed: true         # spec + plan edited this attempt — both POST+GET use ChannelMessageGuard
  load_bearing_security_checks:
    channel_gating_server_side: PASS   # now via ChannelMessageGuard on BOTH POST+GET
    author_no_spoof: PASS
    ws_upgrade_auth_feasible: PASS
    no_cross_channel_leak: PASS        # gateway join_channel uses canViewChannelById
    idempotency: PASS
  edits_applied_this_attempt:
    - "spec(DB a0c322b4): GET-list AC ChannelPermissionGuard → ChannelMessageGuard"
    - "P-3 plan: security line ChannelPermissionGuard → ChannelMessageGuard (channelId-only)"
    - "P-3 plan: specialists line dropped absent websocket-engineer → node-specialist + supertokens-integration"
  failed_checks: []
  carry_forwards:
    - "node-specialist substitutes absent websocket-engineer for gateway wiring (rule 11); supertokens-integration owns WS-auth — encoded non-optionally"
    - "@nestjs/event-emitter dep + EventEmitterModule.forRoot() at B-0 — non-conditional"
  design_gap_flag: true
  rationale: >
    The Critical defect karen caught — the wave-10 two-param ChannelPermissionGuard fail-closing on the
    :id-less message routes — is genuinely fixed, and the fix is verified sound against the live codebase
    rather than on faith. channels.server_id is notNull (servers.ts:70-72) so canViewChannelById can always
    resolve serverId from the channel row; it then delegates to the existing canViewChannel
    (rbac.service.ts:274-330) whose private-channel default-deny is already correct; the new
    ChannelMessageGuard reads channelId from route-params (IDOR-safe) and default-denies (no fail-open);
    the gateway's join_channel re-derivation uses the same channelId-only resolver, keeping REST and WS
    authorization consistent. A fresh karen spawn returned PASS and surfaced one residual spec-text
    inconsistency — the GET-list AC still named the old guard — which I resolved in this attempt by editing
    the canonical DB spec and the plan rather than letting it ride into the build as a builder guess; both
    POST and GET now name ChannelMessageGuard. Both carry-forwards remain non-optional and codebase-justified.
    The unchanged security ACs (WS-upgrade auth via getSessionWithoutRequestResponse, author no-spoof,
    no-leak room fan-out, idempotency, single-pod no-Redis) were untouched by the fix. APPROVED for Phase 2
    jenny spec-vs-bet; karen Phase-2 re-verify already returned PASS.
  next_action: PROCEED_TO_PHASE_2_JENNY   # karen re-verify already PASS this attempt
```

---
## Phase 2 — Karen + jenny — PASS (after 1 REWORK iteration)
- **jenny APPROVE** (attempt 1) — 3/3 blocks MATCH; delivers M3 success metric (2 students real-time <1s); deferrals named (reactions/threads/presence/Redis); RBAC reused. Recommend @task-completion-validator at V for the two-client <1s proof.
- **Karen REJECT→PASS** — attempt 1 REJECT: Critical — ChannelPermissionGuard (wave-10) requires BOTH :id(serverId)+:channelId; the message routes /channels/:channelId/messages have no :id → fail-closed 100% (feature non-functional). WS-auth crux VERIFIED (getSessionWithoutRequestResponse in supertokens-node 24). FIXED: canViewChannelById (resolve server_id from channels.server_id notNull) + ChannelMessageGuard (channelId-only, route-param IDOR-safe, default-deny) on POST+GET; gateway join_channel uses same. T-8: bare-channelId default-denies private channel to non-member. karen attempt-2 PASS.
- **Gemini UNAVAILABLE (transient, advisory).**
## BINDING CARRY-FORWARDS to B (both non-optional): (A) websocket-engineer ABSENT from AGENTS.md → node-specialist (gateway wiring) + supertokens-integration (WS-auth, present) — rule 11 swap noted. (B) add @nestjs/event-emitter + EventEmitterModule.forRoot() at B-0 (else message.created→@OnEvent fan-out silently never fires). Plus: ChannelMessageGuard (not the 2-param wave-10 guard); single-pod in-memory; T-8 live-probe via wave-11 fixture + two-client <1s + WS-auth-reject + no-leak; verify Railway WS at C-2.
GATE: PASS → D-block (component-level message UI; server-channel-view.html exists).
