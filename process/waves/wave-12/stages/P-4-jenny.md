# P-4 Phase 2 — Spec-Drift Verification (jenny)

**Wave:** 12 — M3 real-time messaging (first bundle, multi-spec, 3 blocks)
**Verifier:** jenny (independent spec-vs-plan alignment auditor)
**Phase:** P-4 Phase 2 (pre-build — plan/spec-contract vs. milestone prose + `_library.md` + product-decisions)
**Date:** 2026-06-30
**Verdict:** **APPROVE**

---

## Method note

This is a **pre-build** P-4 check: no implementation exists yet, so this audit compares the **spec contract** (`tasks.description` YAML head, task `a0c322b4`), the **P-3 plan** (`process/waves/wave-12/stages/P-3-plan.md`), the **M3 milestone prose** (`6198650e`), the **architecture library** (`command-center/dev/architecture/_library.md`), and the **append-only decision log** (`command-center/product/product-decisions.md`). Findings are alignment/drift between these authored artifacts, not implementation gaps.

Three sources triangulate scope:
- **M3 milestone prose** = the FULL M3 surface (messaging + reactions + threads + mentions + attachments + presence + typing + member-list).
- **Bundle decision** (product-decisions, 2026-06-30) = the deliberate FIRST SLICE cut from that surface.
- **Spec contract + P-3 plan** = the wave-12 implementable contract.

The load-bearing question: does the slice **deliver M3's success metric** ("two students exchange messages in real time, <1s") **without over-reach**, and is every deferral a **sanctioned cut** (logged), not silent drift?

---

## Per-block findings

### Block 1 — `a0c322b4` (MessagingModule + send/list message REST data plane) — **MATCHES**

| Spec-contract AC | P-3 plan coverage | `_library.md` anchor | Verdict |
|---|---|---|---|
| `messages` migration: id/channel_id (cascade)/author_id/content/created_at/idempotency_key; `UNIQUE(channel_id, idempotency_key)`; `INDEX(channel_id, created_at)` | P-3 L5-6 — Drizzle schema + one migration, `INDEX(channel_id, created_at desc)`, no backfill | § Databases L140 (`INDEX (channel_id, created_at DESC)`), resolved-decision #1 (idempotency_key naming + composite UNIQUE) | MATCHES |
| POST send — `@UseGuards(AuthGuard, ChannelPermissionGuard)`, author_id session-derived (never body), idempotent, → 201, emits `message.created` | P-3 L8-9 — reuse wave-10 guard reading channelId from `@Param`; author_id = session userId; on-conflict-return-existing; EventEmitter2 `message.created` | § RBAC guard composition L107 ("reads serverId/channelId from route params, never body"); RBAC flow L546-554; resolved-decision #1 | MATCHES |
| GET list — guard-gated, cursor pagination (created_at/id), `{messages, nextCursor}`, 403 non-member / 404 bad channel | P-3 L9 — `listMessages(channelId, cursor, limit)` cursor pagination | § Pagination L109 (cursor-only, no offset); § Catch-up L122 (composite created_at+id cursor for ms ties) | MATCHES |
| 401 unauthed / 403 RBAC / 400 empty-or-oversized | P-3 L9 — content validated non-empty ≤4000; AuthGuard + ChannelPermissionGuard | § Validation L319 (Zod parse, typed error) | MATCHES |

**Drift notes (non-blocking, correctly scoped):**
- **Bare-path API** (`/channels/:channelId/messages`) — the spec + plan use the bare path, while `_library.md` § Services L99 prescribes the `/api/v1` prefix and the RBAC flow example (L546) uses `/api/v1/channels/:id/messages`. The spec contract's `note` and the P-3 plan both explicitly declare "Bare-path API" — this matches the **established wave-3→wave-11 project convention** (the codebase has been on bare paths since foundation; `_library.md`'s prefix is aspirational and never adopted). This is a **consistent, intentional deviation already baked into the live codebase**, not new drift. No action — flagged for L-block housekeeping only (strike the stale `/api/v1` from `_library.md` OR adopt it project-wide; out of wave-12 scope).
- **Soft-delete / `thread_parent_id` / `content_snapshot` columns** — `_library.md` § Databases L153 lists these on the canonical messages table. The wave-12 migration omits them. This is **correct for the slice**: soft-delete (edit/delete), threads, and tombstone-snapshot all belong to deferred M3 features (edit/delete/threads/account-delete-resilience). The first-slice table is a strict subset; later M3 migrations add columns additively. **No drift** — the omission tracks the sanctioned deferral list.

**Block 1 verdict: MATCHES.** Delivers the M3 success-metric "persist + list messages" half + the security posture (RBAC-gated, session-derived author, idempotent, cursor). No gold-plating — the table is exactly the columns the slice needs.

---

### Block 2 — `723b5b6a` (`/messaging` Socket.IO gateway — WS-upgrade auth + room-per-channel) — **MATCHES**

| Spec-contract AC | P-3 plan coverage | `_library.md` anchor | Verdict |
|---|---|---|---|
| `@WebSocketGateway(namespace:'/messaging')`; WS-UPGRADE auth via SuperTokens handshake (cookie/auth), unauth socket **rejected at connect**; single-pod in-memory adapter (NO Redis) | P-3 L11-12 — supertokens-integration; validate session from handshake cookie via `Session.getSessionWithoutRequestResponse`; reject unauth; in-memory adapter | § Security trust-boundary #2 L313 ("io.use() validates on upgrade, not first message"); § Socket.IO auth L115; resolved-decision #8 (cookie-first + JWT fallback); § DevOps L423 (no Redis MVP) | MATCHES |
| Room-per-channel: `join_channel {channelId}` → server-side re-derive `can(read/view)` (reuse ChannelPermissionGuard/`RbacService.canViewChannel`) → join `channel:<id>` only on success; `leave_channel` | P-3 L13 — re-derive `RbacService.canViewChannel(userId, channelId)`; on success `socket.join('channel:'+channelId)`; else error | § RBAC flow L558 (room `channel:${channelId}` is the fan-out abstraction); § Security L317 (RBAC server-side only, membership check every channel join) | MATCHES |
| On `message.created` → broadcast `message:new` to `server.to('channel:'+channelId)` ONLY (no broadcast-all); delivery <1s | P-3 L14 — `@OnEvent('message.created')` → `server.to('channel:'+msg.channelId).emit('message:new', msg)`, room-only | § RBAC flow L555-558; resolved-decision #20 (`/messaging` namespace) | MATCHES |
| Unauth socket → connect rejected; join non-accessible channel → rejected (no room, no messages) | P-3 L12-13 + § Security L317; edge-cases enumerated in spec | § Security trust-boundary #2; § Cross-domain | MATCHES |

**Drift notes (non-blocking, correctly scoped):**
- **Two-namespace architecture, one delivered.** `_library.md` resolved-decision #20 (and § Services L115) lock **two** namespaces: `/messaging` and `/presence`. Wave-12 builds **only** `/messaging`. The spec `note` claims "two-namespace" arch-match; strictly the slice delivers ONE of the two. This is **NOT drift** — `/presence` carries presence + typing + voice-room occupancy, all explicitly deferred (presence/typing are in the bundle-decision deferral list; voice is M6). Building `/messaging` alone is the correct first cut; `/presence` lands in a later M3/M6 wave. The prompt's framing "two-namespace" is the *target architecture*; the slice correctly implements the messaging namespace only. Flagged only so the C-2/T-8 reviewers don't expect a `/presence` probe this wave.
- **WS auth mechanism — cookie-first vs JWT-handshake.** Spec AC says "validates the SuperTokens session from the handshake (cookie/auth)". P-3 L12 leans cookie-extraction-from-handshake. `_library.md` resolved-decision #8 makes **cookie-first PRIMARY with a documented short-lived-JWT fallback** for cross-origin/PWA; the auth dataflow (L534-539) actually describes the **JWT-in-handshake** path as the concrete WS bridge. Both the spec and plan keep "cookie/auth" deliberately open ("cookie/auth", "from the handshake"), which **correctly preserves the documented fallback** rather than over-constraining. This is an **implementation decision the B-block resolves** (supertokens-integration agent), within the sanctioned decision-8 envelope — not a spec gap. No action; flag to B-block that decision-8's fallback must remain available if same-origin cookie-on-upgrade proves unreliable on Railway (already an `_library.md` open item).

**Block 2 verdict: MATCHES.** Delivers the REAL-TIME half (<1s fan-out) and matches the locked arch (single-pod in-memory, room-per-channel, server-side can() re-derivation, room-only fan-out, no cross-channel leak). The security ACs (WS-upgrade auth + join re-derivation + room-only fan-out) are the load-bearing ones and are all present and traceable.

---

### Block 3 — `d999d29c` (Message UI — composer + real-time list) — **MATCHES**

| Spec-contract AC | P-3 plan coverage | Design anchor | Verdict |
|---|---|---|---|
| Channel-view message LIST (author/content/time, virtualized, newest-at-bottom, load-older via cursor) + COMPOSER | P-3 L19-20 — message list virtualized + load-older via cursor; composer; in MainColumn/channel view | `design/server-channel-view.html` exists; D-block scoped to message-row + composer primitives (design_gap_flag TRUE-delta) | MATCHES |
| Send flow: optimistic pending (greyed) → POST → 201 confirmed (replace) / error FAILED (retry); client-gen idempotencyKey | P-3 L20 — optimistic pending → POST → confirmed/failed; client-gen idempotencyKey | § Modules L80 (MessageRow pending/failed states); design-system decision (MessageRow with pending/failed) | MATCHES |
| Real-time: socket.io-client → `/messaging` (session cookie), `join_channel` on select, render `message:new` for active channel <1s, switch channel → leave/join | P-3 L20 — socket.io-client with credentials; join_channel on select; render message:new real-time; (channel-switch re-subscribe in spec edge-cases) | § Modules L80 (Message List + Composer slice); resolved-decision #20 | MATCHES |
| Per `design/server-channel-view.html`; loading/empty/error states; dark theme | P-3 L16-17 (D-block) + L20 (per the D design) | § UI decisions (v9 server-channel-view canonicalized; dark-only) | MATCHES |

**Drift notes (non-blocking):**
- **Optimistic send via outbox vs. direct POST.** `_library.md` § Cross-domain (offline-first dataflow, L494-505) describes the FULL optimistic path going through the **IndexedDB outbox** (the M4 offline-first wedge). The wave-12 spec describes a **lighter optimistic-pending-then-POST** without the Dexie outbox. This is **correct and intentional** — offline-first / outbox / reconnect-reconciliation is **M4** (the next milestone, explicitly "M4 builds on the messaging path" per the M3 prose `## Required by`). Wave-12's optimistic UI is the online-happy-path precursor; M4 promotes it to the durable outbox. The spec's client-gen idempotencyKey is **forward-compatible** with the M4 outbox (same `UNIQUE(channel_id, idempotency_key)` dedup), so no rework debt is created. **No drift** — the lighter path is the right M3 cut and sets up M4 cleanly.

**Block 3 verdict: MATCHES.** The user-facing surface delivers the visible half of the success metric (a second user's message appears <1s). Design reuse is correct (server-channel-view exists; D scoped to primitives). No member-list, no reaction-pill, no thread UI — all deferred, all consistent with the bundle cut.

---

## Scope-boundary audit (the creep/under-reach gate)

**Success metric delivered?** YES. M3's metric — "two students in a channel exchange messages in real time (<1s delivery)" — decomposes to exactly the three delivered blocks: persist+list (B1) + real-time fan-out (B2) + composer+live-list UI (B3). The chain closes the metric end-to-end. T-8's mandated **two-client <1s verification** + live-probe via the wave-11 verified fixture is the proof obligation that confirms it at test time.

**Deferrals — all sanctioned, no silent drop:**

| Deferred feature | In M3 prose? | Logged as deferred? | Status |
|---|---|---|---|
| Reactions | Yes (`reactions` table, reaction-pill) | product-decisions 2026-06-30 bundle entry; spec `note`; P-3 L17 | SANCTIONED |
| Thread replies | Yes (`thread_parent_id`) | same | SANCTIONED |
| Mentions | Yes (feature #14) | same | SANCTIONED |
| File/image attachments | Yes (Railway Buckets ≤10MB) | same | SANCTIONED |
| Presence + typing (`/presence` ns) | Yes | same | SANCTIONED |
| Member list with presence | Yes | same | SANCTIONED |
| Edit/delete (soft-delete) | Yes (in prose Scope) | implied by slice; columns omitted from migration | SANCTIONED (consistent with the slice) |

Every deferred item is named in the M3 prose AND explicitly logged as out-of-slice in the 2026-06-30 bundle decision. **No silent drops.** The bundle decision's stated rationale ("keep this WIP-limited and avoid bundle bloat… the most technically significant slice — real-time WebSockets") matches the cut exactly.

**Over-reach / gold-plating check:** NONE found. The migration is the minimal column set for the slice (no premature thread/soft-delete/snapshot columns). No Redis (single-pod MVP per § DevOps L423 + resolved-decision, three documented H2 upgrade triggers). No `/presence` namespace. No DM scaffold. The plan reuses M2's wave-10 `ChannelPermissionGuard` + `RbacService.canViewChannel` rather than re-inventing authz (spec + P-3 L9/L13 both explicit) — **correct reuse, no re-invent**. First messaging slice is right-sized.

**Bet alignment:** The M3 bet ("Founder-bet — core collaboration surface; match Discord's messaging… real-time messaging = the conversational core") is directly served by this slice. The single most bet-defining capability — real-time text delivery — is exactly what ships. Matches the founder's documented "build the core: M2 servers → M3 messaging" same-day direction (product-decisions wave-10 close-out).

**Security posture (T-8 heavy) — fully encoded in the spec, traceable to `_library.md`:** all five load-bearing ACs present — (1) RBAC-gated send/list via ChannelPermissionGuard, channelId from route params (no IDOR); (2) author session-derived, never body (no spoof); (3) WS-upgrade session auth, reject unauth at connect; (4) room-per-channel with server-side `can(read)` re-derivation on join (no cross-channel leak); (5) room-only fan-out (no broadcast-all). Idempotency via `UNIQUE(channel_id, idempotency_key)`. The C-2 infra note (Railway proxy must pass WS Upgrade; deploy-verify must not false-green on a dead WS namespace) is correctly captured in both spec `note` and P-3 L24.

---

## Clarification needed

None blocking. Two items flagged for downstream stages (not P-4 rework):
1. **C-2/T-8 reviewers**: expect only the `/messaging` namespace this wave — there is no `/presence` probe to run (presence deferred to a later wave). Do not false-flag its absence.
2. **B-block (supertokens-integration)**: WS-upgrade auth mechanism is cookie-first per resolved-decision #8, with the short-lived-JWT-in-handshake fallback to remain available if same-origin cookie-on-upgrade proves unreliable on Railway (an existing `_library.md` open item, not new). The spec correctly leaves "cookie/auth" open; resolve at B-block, don't over-constrain.

---

## Recommendations

1. **Proceed to build** — spec, plan, milestone prose, architecture, and decision-log are aligned; the slice delivers the M3 success metric without over-reach.
2. **L-block housekeeping** (non-blocking, carry-forward): strike or reconcile the stale `/api/v1` prefix in `_library.md` § Services L99 / L546 against the project's established bare-path convention; and the stale `_library.md` § Databases L153 column list (already noted as pre-v6b drift in the wave-10 P-4 entry). Neither blocks wave-12.
3. **T-8 must execute** the two-client <1s realtime verification + live-probe through the wave-11 verified prod fixture (T-8 rule 1) on send/list/WS-upgrade/room-join — this is the success-metric proof and the security-posture proof. Recommend **@task-completion-validator** at V-block to confirm the two-client delivery actually works (not single-client echo) before the wave closes.

---

## Verdict

**APPROVE.** All three blocks MATCH the spec contract, the M3 milestone prose (slice subset, no contradiction), the architecture library (single-pod in-memory Socket.IO, room-per-channel, RBAC reuse, idempotency, cursor pagination), and the product-decisions log. The scope delivers M3's success metric — two students exchange messages in real time (<1s) — with the security posture fully encoded. Every deferral (reactions/threads/mentions/attachments/presence/typing/member-list, Redis) is sanctioned and logged; no creep, no silent drop, no gold-plating. The first messaging slice is right-sized.
