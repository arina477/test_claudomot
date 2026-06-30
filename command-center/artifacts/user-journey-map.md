---
name: User Journey Map
description: Canonical inventory of every user flow, screen, route, API endpoint. Regenerated at T-9 from production state.
last_updated: 2026-06-30 (T-9 wave-13 — M3 message LIFECYCLE LIVE; page 9 message-row now supports edit (author-only, inline + "(edited)"), soft-delete (author||moderator, tombstone) and reactions (idempotent toggle, reaction-pills + add-reaction popover) — all real-time. New REST: PATCH/DELETE /channels/:id/messages/:msgId, POST /channels/:id/messages/:msgId/reactions. New realtime events: message:updated / message:deleted / reaction:added / reaction:removed, all room-only fan-out. Two-client verified LIVE (updated 90ms / reaction 87ms / deleted 112ms, all <1s; non-joined no-leak). Edit/delete authz server-side (author-only edit; delete author OR moderator with serverId resolved from channels.server_id, NOT request-trusted); 401 boundary live-re-confirmed at gate (PATCH/POST → 401). No new route — extends the existing page-9 messaging surface. Authed full-browser click-through + cross-user authz live-probe still deferred — verified-prod fixture 4a2ad286, recurring carry-forward)
version: 0.9
status_legend:
  - "✅ Live: page renders correctly with real content in production"
  - "🟡 Live but degraded: renders but missing data, broken interaction, or minor known issue"
  - "🟠 Coded but blocked: route exists in code but redirects/crashes/blank in production"
  - "❌ Not built: documented in flow but no matching route in code"
  - "🚫 Deferred: explicitly out of scope"
  - "🆕 Design-only: designed but no code route yet"
---

# User Journey Map — StudyHall

Canonical inventory of every screen / route / surface + flow cross-reference. Regenerated at T-9 Journey each wave from production state. v4 onboarding baseline (founder away, automatic mode — enumerated from v3 flows/features; revisable at v10). StudyHall is a dark-themed desktop communication app, so the inventory is product-screen-heavy; marketing is minimal for a `self-use-mvp` stage. All entries `❌ Not built` until the first wave ships.

## Page inventory

| # | Page | Route | Persona(s) | Related flows | Tools/modules | PD |
|---|------|-------|-----------|---------------|---------------|----|
| 1 | Landing | `/` | visitor | signup-entry | design tokens, hero | full |
| 2 | Privacy policy | `/privacy` | visitor | — | — | **[stub — compliance, H2 expansion deferred]** |
| 3 | Terms | `/terms` | visitor | — | — | **[stub — compliance, H2 expansion deferred]** |
| 4 | Signup | `/signup` | P1 | F1 | auth, profile | full |
| 5 | Login | `/login` | P1 | F1 | auth | full |
| 6 | Forgot / reset password | `/forgot-password`, `/reset-password` | P1 | F1 | auth, email | full |
| 7 | Email verify | `/verify` | P1 | F1 | auth, email | full |
| 8 | App home (no server) | `/app` | P1 | F2, F7 | server rail | full |
| 9 | Server channel view (main 3-pane) | `/servers/:id/:channelId` | P1,P2 | F3, F5 | messaging, presence, channel mgmt, offline sync, RBAC | full |
| 10 | Voice/video study room | `/servers/:id/voice/:channelId` | P1 | F4 | WebRTC SFU, voice-room UI, presence | full |
| 11 | Create server | `/app` (modal/flow) | P2 | F7 | server mgmt, channel mgmt | full |
| 12 | Invite preview / join | `/invite/:code` | P1 | F2 | invite system, server mgmt | full |
| 13 | Roles Management (full-screen overlay) | `/servers/:id` shell → "Server settings — Roles" button (no dedicated route) | P2 | F8 | RBAC, role mgmt, member-role assign, per-channel visibility | full |
| 14 | Assignments panel | `/servers/:id/assignments` | P1,P2 | F6, F9 | assignment module, notifications | full |
| 15 | User settings — profile | `/settings/profile` | P1 | F1 | profile mgmt, file upload | full |
| 16 | User settings — privacy | `/settings/privacy` | P1 | F1 | privacy controls | full |

**Compliance-surface quota (self-use-mvp, ≤~10%):** 2 stub pages (Privacy policy, Terms) of 16 ≈ 12% — within tolerance; stubbed, no full fan-out. `/settings/privacy` is a product surface (feature 16), not a compliance-doc page → full PD.


## Deployment status — wave-1 (M1 foundation, shipped)

Live on Railway: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200).
Verified via HTTP + CI RTL component tests (live-browser crawl deferred — Playwright MCP chrome-channel absent in env; a CI chromium job is queued for the next UI wave).

| Surface | Status | Note |
|---|---|---|
| App shell chrome (server rail + channel sidebar + main column) | 🟡 Live but degraded | renders live (dark theme, ConnectionStateIndicator) with placeholder content; no real servers/channels/messages yet |
| `GET /health` (api) | ✅ Live | 200 `{status:ok,service,version}` |
| All other pages (auth, real server view, assignments, voice, settings) | ❌ Not built | per per-page-pd; auth = next wave (b9118041) |


## Deployment status — wave-3 (auth frontend, shipped)
Live: web https://web-production-bce1a8.up.railway.app (SPA + client routes) · api auth backend.
| Surface | Status | Note |
|---|---|---|
| /login, /signup, /forgot-password (+reset), /verify-email | ✅ Live | supertokens-auth-react custom forms wired to live backend |
| /settings/profile | ✅ Live | display_name edit (GET/PATCH /profile); username/avatar/accent 'coming soon' (→ 2a655960) |
| Verify-email banner (app shell, unverified) | ✅ Live | unverified users reach shell + banner; /me 200 emailVerified:false |
| First-run: signup→verify→profile→app-home | ✅ Wired | core flow live (curl-verified); full browser click-through deferred to CI chromium job (c51589cd) |

## Deployment status — wave-4 (M1 profile customization, shipped)
Live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200). HTTP/code-level verification (browser crawl deferred — Playwright chrome-channel absent, tracked c51589cd). Migration `0001` applied to prod Postgres: users +username (unique, lower() idx) / avatar_url / accent_color.
| Surface | Status | Note |
|---|---|---|
| /settings/profile | ✅ Live | username field (taken/available + 409 on dup), accent-color picker — both persist + render across shell; replaces wave-3 'coming soon' stubs |
| GET/PATCH /profile (4 fields) | ✅ Live | display_name + username + accentColor live-verified (set→200, dup→409, bad→400); avatarUrl field present |
| App shell avatar + accent render | ✅ Live | avatar initials-fallback + accent CSS var render from /profile |
| POST /profile/avatar/presign | 🟡 Live but degraded | endpoint live; returns 503 STORAGE_NOT_CONFIGURED until Railway Bucket creds provisioned (founder-pending, tracked 84e09891). Path built + key/MIME/scope secured + graceful-503-verified; real S3 PUT→confirm→render unverified pending bucket |
| Avatar real-upload round-trip | 🚫 Deferred | infra-blocked (no bucket); not user-reachable until 84e09891 resolved |

## Deployment status — wave-7 (M2 servers/channels, first slice — LIVE)
Live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200, live-verified at T-9). Migration `0002_certain_miek.sql` (servers / server_members / categories / channels) applied to prod Postgres. PR#17 merge 585112f. Verification: HTTP/code-level + live probe (C-2: POST /servers 201, GET /servers lists, GET /servers/:id shows #general; unauthed→401 live-verified at T-9; unverified/non-member→403). Authed full-browser click-through deferred (chrome channel + verified prod fixture absent — c51589cd; L-flag for a persistent verified fixture).
| Surface | Status | Note |
|---|---|---|
| App home `/app` — server rail with REAL servers | ✅ Live | rail lists the caller's servers from `GET /servers` (membership-scoped, server-side innerJoin); selected server highlighted (`aria-current`); empty + loading states render. Replaces wave-1 placeholder rail. |
| Create server (page 11) — `/app` modal | ✅ Live | "+" opens single-step name modal → `POST /servers {name}` → 201 → server appended + selected → `#general` shown. Client-side name validation (empty/whitespace disabled; trimmed); API-failure banner (`role=alert`). Atomic server-side seeding: owner membership + default "General" category + `#general` channel in one txn. |
| Channel sidebar (within server view) | 🟡 Live but degraded | renders categories + channels from `GET /servers/:id` when a server is selected (no-server prompt / loading / error states all present). Active channel hardcoded to `#general` — no channel routing yet (out of M2 first-slice scope). Full 3-pane messaging (page 9) NOT built (no messaging/presence this wave). |
| `POST /servers` (api) | ✅ Live | AuthGuard + verify-required + Zod (name 1–100, trimmed); 201 ServerResponse. Atomic txn (server + owner-member + General category + #general). |
| `GET /servers` (api) | ✅ Live | membership-scoped (innerJoin server_members on session userId); returns only the caller's servers; [] when none. |
| `GET /servers/:id` (api) | ✅ Live | 404-before-403 (exists-check then member-check — no existence fingerprinting); returns nested categories+channels for members. userId always from session, never body/params. |
| Server settings / invites / roles (page 13, F8) | ❌ Not built | RBAC/invites/roles are later M2+ milestones; create-server first slice is STRUCTURE only. |

**Access-control note (T-8 verified):** server creation + both reads are auth-gated (401 unauthed, 403 email-unverified) and membership-scoped server-side — the boundary is enforced in NestJS (AuthGuard + session-derived userId + DB innerJoin / 404-before-403), not in the UI. IDOR via param substitution is closed (userId never read from request body/params).

## Deployment status — wave-8 (M2 invites/join, LIVE)
Live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200, live-verified at T-9). Migration `0004` (invites table 9 cols + servers.invite_code unique) applied to prod Postgres. PR#18 merge 8716b4e. Verification: HTTP/code-level + live probe (C-2 throwaway-fixture: invalid preview 404, valid preview 200-minimal, post-delete 404; unauthed join 401; unauthed createInvite 401 — all re-confirmed at T-9). Authed full-browser click-through + authed join deferred (no persistent verified prod fixture — 4a2ad286; e2e for the new public route is a recorded coverage gap → V-2).
| Surface | Status | Note |
|---|---|---|
| Invite preview / join (page 12) — `/invite/:code` | ✅ Live | NEW public route. Anonymous-reachable preview renders server name + member count ONLY (8 states: loading / valid+Join / unauthed / unverified / already-member / joining / joined / invalid). 68 web RTL tests cover all states. Authed browser join not live-probed (fixture 4a2ad286); no Playwright e2e on this route yet (V-2 finding). |
| `GET /invites/:code` (api, public preview) | ✅ Live | Public, no auth. Returns minimal `{server:{id,name,memberCount}}` ONLY — NO channels / members / presence / owner / invite internals. Invalid code → 404 generic (no existence fingerprinting / leak). Live-verified minimal + 404. |
| `POST /invites/:code/join` (api, verified join) | ✅ Live | AuthGuard + EmailVerification REQUIRED (401 unauthed / 403 unverified — live). Atomic max_uses consume: conditional `UPDATE...WHERE uses<max_uses RETURNING` + throw-on-zero-rows rolls back member insert (per-row lock serializes concurrent joiners → exactly one wins at max_uses=1; TOCTOU fixed 92cc0f3, concurrency-tested). Idempotent re-join: `ON CONFLICT(server_id,user_id) DO NOTHING`, uses NOT incremented on re-join. Authed success path covered by 179 tests + CI integration (not live-probed). |
| `POST /servers/:id/invites` (api, create invite) | ✅ Live | AuthGuard + member-gated: 401 unauthed (live), 403 non-member. Mints CSPRNG `base64url(randomBytes(16))` (~128-bit, non-enumerable over UUID PKs) → `{code,url}`. Two-tier: per-server permanent `servers.invite_code` (auto-set at server creation) + ad-hoc `invites` rows with optional max_uses. |
| Invite-share modal (within server) | ✅ Live | Copy-link share UI per design/invite-share.html (D-3 APPROVED). **wave-9: defaults to the permanent per-server `invite_code` link on plain open** (8b) — mints NO ad-hoc `invites` row on open (regression-guarded). Now also surfaces the limited-invites revoke list (see below). Entry point for F8 invite step. |
| Invite revoke (revoke endpoint / UI) | ✅ Live | **wave-9: NEW.** `POST /invites/:code/revoke` — owner-or-creator gated (server-side, userId from session, no IDOR): 401 unauthed (live-verified), 403 non-owner/non-creator (test-covered), permanent code → 404 (not revocable via this path). After revoke, both `GET /invites/:code` preview + `POST /:code/join` → 404 (shared validateInviteActive honors `invites.revoked`). Idempotent re-revoke. UI: limited-invites list + trash + two-step confirm + revoked state, per D-3. Session-scoped list (no list-ad-hoc GET endpoint — honest gap). |

**Access-control note (T-8 verified, invites = access-control surface):** invite codes are CSPRNG non-enumerable (no sequential id surface — UUID PKs); the public preview is minimum-summary ONLY (the D-block caught + stripped the mockup's channels/members leak; the live API was verified minimal); join is verify-required (401/403) with atomic max_uses (one winner under concurrency, loser rolled back) and idempotent re-join (no use double-count). No residual leak / enumeration / overshoot. The boundary is enforced in NestJS, not the UI.

## Deployment status — wave-9 (M2 invite-completion: revoke + permanent-default + backfill, LIVE)
Live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200, live-verified at T-9). NO new migration (invites table + servers.invite_code shipped wave-8); 8a backfill ran as run-once prod script (clean no-op, 0 rows). PR#19 merge 371b9fe. Changes are to the EXISTING `/invite/:code` + share-modal surface — no new route. Verification: HTTP/code-level + live probe (T-9 re-confirmed: revoke unauthed 401, preview unknown 404, server-detail unauthed 401, health 200). 196 tests (123 api + 73 web). Authed revoke/join browser e2e still deferred (no persistent verified prod fixture — 4a2ad286; recorded V-2 gap, carry-forward not regression).
| Surface | Status | Note |
|---|---|---|
| Invite revoke (page 12 / F8) — `POST /invites/:code/revoke` + revoke UI | ✅ Live | NEW. Owner-or-creator gated, no IDOR (userId from session). 401 unauthed (live), 403 non-owner/creator (test), permanent code 404. Revoked invite → 404 on preview + join (shared validateInviteActive). Idempotent re-revoke. Completes invite lifecycle: create → join → revoke. |
| Invite-share modal permanent-default (8b) | ✅ Live | Modal defaults to the per-server permanent `invite_code` link on plain open; mints NO ad-hoc `invites` row on open (regression-guarded). |
| `servers.invite_code` backfill (8a) | ✅ Ran clean | App-side idempotent run-once script (WHERE invite_code IS NULL, randomBytes base64url, 23505 retry). 0 rows on prod (no pre-existing servers needing backfill). Not auto-migrate/pgcrypto. |

**Deferrals (non-blocking, info-severity):** permanent `invite_code` rotation is irrevocable — no rotate endpoint (deferred d058283d, Gemini flag; 0 prod servers so no live exposure). Limited-invites revoke list is session-scoped — no list-ad-hoc GET endpoint (honest gap, not a defect).

## Deployment status — wave-10 (M2 RBAC capstone — the access-control core, LIVE)
Live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200, live-verified at T-9). Migration `0004_green_madripoor.sql` (roles table + channel_permission_overrides + server_members.role_id FK) applied to prod Postgres; `db:backfill-roles` ran idempotent-clean (0 servers → no-op). PR#20 merge `3cf63bf`. Verification: 270 tests (173 api incl. all 6 security conditions + 97 web) green in CI against real Postgres 16; live 401 unauthed boundary verified across every role/override/member endpoint (C-2) and independently re-confirmed at the gate (`POST/GET /servers/:id/roles → 401`). **M2 success metric "channels per role" now MET → M2 feature-complete.** Authed full-browser click-through + 403-non-permitted live-probe still deferred — no persistent verified-prod fixture (4a2ad286, now 4 waves running; ESCALATION-CRITICAL → L). Concurrent owner-demote race is unit-modelled, not multi-connection-executed (prod code has the correct `SELECT FOR UPDATE` lock).

| Surface | Status | Note |
|---|---|---|
| Roles Management overlay (page 13, F8) | ✅ Live | NEW. Full-screen overlay opened from the channel-sidebar "Server settings — Roles" button (`data-testid=server-settings-btn`, `aria-label="Server settings — Roles"`); rendered within the existing `/servers/:id` shell, NOT a dedicated route. Roles list / create / delete, 4 fixed permission toggles (no free-form matrix — the spec-violating matrix tab was caught + replaced at D-3), per-channel visibility editor, member-role assignment, owner-lockout 409 surfaced honestly. 97 web tests; 5 a11y fixes per design/server-roles.html. (UI tests lean on `getByTestId` for state hooks — recorded a11y-as-contract note, not a gate blocker.) |
| Channel sidebar — per-role visibility | ✅ Live | `GET /servers/:id` channel list is now ROLE-GATED server-side: `findServerDetail` filters via `getVisibleChannelIds` so non-visible channels are ABSENT from the response (no enumeration). Replaces wave-7's show-all-channels behaviour. |
| `GET /servers/:id/roles` + `POST /servers/:id/roles` + role CRUD (api) | ✅ Live | AuthGuard + `can(manage_roles)`; 401 unauthed live-verified (gate-confirmed). userId from session (no IDOR). |
| `PATCH /servers/:id/members/:userId/role` (assign role) | ✅ Live | `can(manage_members)`; self-promote blocked at controller + service (defence-in-depth); 401 unauthed live. |
| `GET/POST/DELETE /servers/:id/channels/:channelId/overrides` (api) | ✅ Live | ChannelPermissionGuard reads ROUTE PARAMS only (body-spoof rejected — test proves route-param wins); `can(manage_channels)`; 401 unauthed live. Private channel default-DENY unless override `can_view=true`. |
| Owner-lockout (demote / remove / leave) | ✅ Live | Transactional: `db.transaction` + `SELECT FOR UPDATE` row-lock; last-owner action → 409 (`ConflictException`, asserted). transferOwnership atomic. Concurrent-race serialization unit-modelled (not multi-connection-run). |

**Access-control note (T-8 verified, RBAC = the access-control CORE):** `can()` is server-side and default-DENY (owner_id superuser; else explicit role flag; no membership / no role / null role_id / false flag → false). userId is always session-derived — IDOR via param/body substitution is closed. Channel enumeration is closed server-side (non-visible channels absent from the list, not merely hidden in the UI). Private channels are default-deny. Owner-lockout is transactional with a row-lock + last-owner-409 invariant. The boundary is enforced in NestJS, not the UI. The 401 door is live-verified on every new endpoint; the 403-non-permitted path is CI-tested (270 tests incl. 6 conditions) but NOT live-probed — gated on the verified-prod fixture (4a2ad286), the recurring M2 live-verification gap.

## Deployment status — wave-12 (M3 real-time messaging — the conversational core, LIVE)
Live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200, live-verified at T-9). Migration `0005` (messages table: UNIQUE(channel_id,idempotency_key); channel_id+created_at index; FKs channel cascade / author) applied to prod Postgres BEFORE new code served. PR#23 merge `168c45f`. Deployed via Railway CLI `up` source-upload (NEW image; the 404→401 route-probe proved the new revision serves M3). **M3 success metric "two-client message delivery <1s" now MET LIVE — message:new in 93ms/87ms across two runs.** 316 tests (200 api: WS-auth / channel-guard / idempotency / fan-out + 116 web: msg UI / optimistic / dedup) green in CI against real Postgres. Verification: HTTP/code-level + live two-client Socket.IO probe (C-2: A POST → B `message:new` 93ms/87ms; non-joined third client no-leak; WS-upgrade unauth → `connect_error Unauthorized`; 401 unauthed REST re-confirmed at gate). Authed full-browser click-through still deferred — no persistent verified-prod fixture (4a2ad286, recurring carry-forward, not a regression). Single-pod in-memory Socket.IO adapter (multi-pod fan-out → later milestone).

| Surface | Status | Note |
|---|---|---|
| Server channel view — real-time chat (page 9, the 3-pane main) | ✅ Live | NEW. The main column now renders a real message list + composer with live delivery. Message-row 3 states (pending `[aria-busy]` optimistic / sent / failed `[role=alert]` + retry); composer (auto-grow, Enter-send); list (`role=log` `aria-live`, empty-state, load-older keyset pagination). Messages arrive in real time via the `/messaging` Socket.IO room for the active channel. 116 web RTL tests (optimistic send, dedup, 3-state rows). Replaces wave-7's hardcoded-`#general` placeholder main column. |
| `POST /channels/:id/messages` (api, send) | ✅ Live | AuthGuard + ChannelMessageGuard (channelId-only `@Param` — IDOR-safe; private channel default-DENY via canViewChannelById). author_id = session getUserId (no authorId in SendMessageSchema — no spoof). Idempotent: UNIQUE(channel_id,idempotency_key) ON CONFLICT return. Live: 401 unauthed (gate-re-confirmed), 403 non-permitted. On success, emits `message:new` to the channel room. |
| `GET /channels/:id/messages` (api, list) | ✅ Live | AuthGuard + ChannelMessageGuard (same private default-DENY). Keyset pagination (load-older). Live: 401 unauthed (gate-re-confirmed). |
| `/messaging` Socket.IO gateway (api, real-time) | ✅ Live | WS-upgrade auth at CONNECT: `io.use()` reads sAccessToken from handshake cookie (+ `auth.accessToken` fallback) → getSessionWithoutRequestResponse → assertClaims(isVerified) → reject unauth (socket.data.userId set fail-closed). `join_channel` re-derives canViewChannelById server-side; `@OnEvent` → `server.to('channel:id').emit` room-only (NEVER broadcast-all). LIVE: unauth socket → `connect_error Unauthorized`; non-joined socket receives NOTHING (no cross-channel leak); two-client delivery 93ms/87ms. Single-pod in-memory adapter. |

**Access-control note (T-8 verified, messaging = the auth + channel-access + WS-auth core):** all four invariants are server-side and live-verified — (1) channel-gating via ChannelMessageGuard (channelId-only route param, IDOR-safe, private default-DENY), (2) WS-upgrade auth rejected at connect (real Socket.IO client, not a dead namespace), (3) no cross-channel leak (room-scoped emit, live non-joined client got nothing), (4) author no-spoof (author_id session-derived, no client authorId). Idempotency dedups duplicate sends. The boundary is enforced in NestJS + the gateway's `io.use()`, not the UI. 401 REST door live-re-confirmed at the gate; the two-client <1s + no-leak + WS-unauth-reject paths are live-probed (synthetic two-client Socket.IO fixture — the authoritative substitute below canary DAU). Live-socket eviction on RBAC revoke is out of M3 scope (join-time gate is correct → H2); the null-idempotency-key send race is unreachable on the prod path (client always sends a key → V cleanup).

## Deployment status — wave-13 (M3 message lifecycle: edit / delete / reactions — LIVE)
Live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200, live-verified at T-9). Migration `0006` (messages soft-delete cols `is_edited` / `edited_at` / `is_deleted` / `deleted_at`; `message_reactions` table; idempotency UNIQUE `message_reactions_message_user_emoji`) applied to prod Postgres BEFORE new code served. PR#24 merge `427d5d6`. Deployed via Railway CLI `up` source-upload (NEW image; 404→401 route-probe on the new-only PATCH/DELETE/reactions paths proved the new revision serves the lifecycle). **No new route** — extends the existing page-9 messaging surface (message-row now carries edit/delete/reaction affordances + tombstones). ~350 tests (api: edit author-only + delete author||moderator + reactions idempotent + 5 gateway events; web: inline-edit / tombstone / reaction-pills) green in CI against real Postgres. Verification: HTTP/code-level + live round-trip (C-2: edit 200 `isEdited:true`; reaction toggle `{reacted:true}`→`{reacted:false}` idempotent; delete 204 → list shows tombstone `isDeleted:true content:null`) + two-client Socket.IO realtime + gate 401 re-confirm. Authed full-browser click-through + cross-user authz live-probe deferred — no persistent verified-prod fixture (4a2ad286, recurring carry-forward, not a regression). Single-pod in-memory Socket.IO adapter.

| Surface | Status | Note |
|---|---|---|
| Server channel view — message lifecycle (page 9, the 3-pane main) | ✅ Live | NEW affordances on the existing message-row: **inline edit** (author-only; hover/keyboard row-action → inline editor → `PATCH` → "(edited)" label), **delete** (author or moderator; confirm → tombstone row, content gone), **reactions** (reaction-pills with `reactedByMe` highlight + add-reaction popover; idempotent click-to-toggle). All update in real time for every joined client. 131 web RTL tests; UI per design/server-channel-view.html (D-3 APPROVED), keyboard-accessible row-actions. |
| `PATCH /channels/:id/messages/:msgId` (api, edit) | ✅ Live | AuthGuard + ChannelMessageGuard. **Author-only**: `author_id === session userId` else 403; deleted message → 409; not found → 404. Sets `is_edited`/`edited_at`, updates content. Live: 401 unauthed (gate-re-confirmed); edit 200 `isEdited:true`. Emits `message:updated` to the channel room. |
| `DELETE /channels/:id/messages/:msgId` (api, soft-delete) | ✅ Live | AuthGuard + ChannelMessageGuard. **Author OR moderator**: `author_id === userId` OR `can(serverId, manage_channels)` — **serverId resolved from `channels.server_id` server-side, NEVER request-trusted**. Soft-delete tombstone (`is_deleted`, `content` cleared → DTO content `null`). Idempotent double-delete → 204. Live: 401 unauthed (gate-re-confirmed); delete → tombstone. Emits `message:deleted`. |
| `POST /channels/:id/messages/:msgId/reactions` (api, react) | ✅ Live | AuthGuard + ChannelMessageGuard. **Idempotent toggle** via UNIQUE(message_id,user_id,emoji): absent → INSERT → `{reacted:true}` + `reaction:added`; present → DELETE → `{reacted:false}` + `reaction:removed`. userId always session-derived (no body spoof); `reactedByMe` aggregated per-caller. Live: 401 unauthed (gate-re-confirmed); toggle true→false. |
| `/messaging` gateway — lifecycle events (api, real-time) | ✅ Live | Four new `@OnEvent` handlers (`message.updated`/`message.deleted`/`reaction.added`/`reaction.removed`) each fan out via `server.to('channel:id')` — **room-only, NEVER broadcast-all**. LIVE two-client: receiver B got `message:updated` 90ms / `reaction:added` 87ms / `message:deleted` 112ms (all <1s); non-joined third socket received NOTHING (no cross-channel leak). Single-pod in-memory adapter. |

**Access-control note (T-8 verified, message lifecycle = an authz surface):** all lifecycle invariants are server-side and verified at source + unit + live — (1) **edit author-only** (`author_id !== userId → 403`), (2) **delete author||moderator** with serverId resolved from the channel row (not request-trusted) and the moderator-allowed path proven to call `can()` with the resolved serverId, (3) **reactions idempotent** (UNIQUE-backed toggle, session-derived userId, no spoof), (4) **room-only fan-out** (all five emit handlers room-scoped; live non-joined client got nothing). The 401 REST door is live-re-confirmed at the gate (PATCH edit / POST reaction → 401); the two-client <1s + no-leak paths are live-probed. The cross-user 403 path (non-author edit/delete) is proven by committed unit tests (non-author 403 + moderator-allowed both asserted) — NOT live-probed, gated on the verified-prod fixture (4a2ad286, the recurring carry-forward). **Info-severity (→ V):** reaction emoji has no documented allowlist/shape-validation — confirm not arbitrary at B-block. The boundary is enforced in NestJS + the guard, not the UI.

## Flows cross-reference

### F1 — Sign up & create profile (P1)
- Entry: `/` → `/signup` (or `/invite/:code` → `/signup`)
- Steps: `/signup` → `/verify` → `/settings/profile` (first-run) → `/app`
- Features: 1, 2, 16

### F2 — Join a study server (P1) — invite preview + verified join LIVE (wave-8)
- Entry: `/invite/:code` (public preview: name + member count only) → (signup/login + email-verify if needed) → `POST /invites/:code/join` (atomic max_uses, idempotent re-join) → `/servers/:id/:channelId`
- Live: public preview (`GET /invites/:code` 200-minimal / 404), verified join gate (401 unauthed / 403 unverified). Authed join success path covered by 179 tests + CI (authed browser flow deferred — fixture 4a2ad286; route e2e gap → V-2).
- Features: 6

### F3 — Real-time messaging (P1) — LIVE (wave-12 conversational core; wave-13 message lifecycle)
- Entry: `/servers/:id/:channelId` → select channel → read (`GET /channels/:id/messages`, keyset load-older) → compose (auto-grow composer, Enter-send, optimistic pending row) → send (`POST /channels/:id/messages`, idempotent) → message arrives in real time for every joined client via the `/messaging` Socket.IO room (`message:new`).
- **Message lifecycle (wave-13, LIVE):** on your own row → **edit** (inline editor → `PATCH /channels/:id/messages/:msgId`, author-only → "(edited)" + `message:updated`); **delete** (author or moderator → `DELETE …/:msgId`, soft-delete tombstone + `message:deleted`); **react** (reaction-pill / add-reaction popover → `POST …/:msgId/reactions`, idempotent toggle + `reaction:added`/`reaction:removed`). All lifecycle changes fan out room-only in real time. Threads NOT built (later milestone).
- Live: send + list + lifecycle REST gated (ChannelMessageGuard, 401 unauthed / 403 non-permitted, private default-DENY; edit author-only, delete author||moderator with server-side serverId resolve); WS-upgrade auth rejects unauth at connect; room-scoped fan-out (no cross-channel leak). **M3 metric MET LIVE: two-client delivery — message:new 93ms/87ms (wave-12); message:updated 90ms / reaction:added 87ms / message:deleted 112ms (wave-13); all <1s; non-joined client no-leak.** Authed full-browser click-through + cross-user authz live-probe deferred (fixture 4a2ad286, carry-forward).
- Features: 7, 8, 9

### F4 — Voice/video study room (P1)
- Entry: server view → click voice channel → `/servers/:id/voice/:channelId` → mic/cam → screen share → leave
- Features: 13

### F5 — Offline-first (P1) — the wedge
- Entry: any authed surface on connection drop → read cache → compose → outbox → reconnect → sync
- Features: 12

### F6 — View & track assignments (P1)
- Entry: `/servers/:id/assignments` → list → mark to-do/done → reminders
- Features: 15

### F7 — Create server + channels (P2)
- Entry: `/app` → Create server (+ in rail) → single-step name modal → `POST /servers {name}` (seeds owner membership + default "General" category + `#general` server-side) → new server selected in rail, `#general` shown. (M2 STRUCTURE only; icon/template/invite are later milestones.)
- Features: 5

### F8 — Invite + roles/permissions (P2) — invite lifecycle LIVE (wave-8/9); roles/permissions LIVE (wave-10 RBAC capstone)
- Entry (invite, LIVE): server view → invite-share modal (copy link, defaults to permanent per-server `invite_code` on open — wave-9 8b) OR `POST /servers/:id/invites` (member-gated, CSPRNG `{code,url}`) → shareable `/invite/:code`. Two-tier: permanent per-server `invite_code` + ad-hoc max_uses invites. **Revoke (wave-9): owner-or-creator → `POST /invites/:code/revoke` → revoked invite 404s on preview + join.** Lifecycle complete: create → join → revoke.
- Entry (roles/permissions, LIVE wave-10): server view → channel-sidebar "Server settings — Roles" button → Roles Management overlay → create/delete role (4 fixed permission toggles) → assign role to member (`PATCH /servers/:id/members/:userId/role`) → set per-channel visibility (`channel_permission_overrides` via ChannelPermissionGuard). Channel list is now role-gated server-side (non-visible channels absent). Owner-lockout enforced: last-owner demote/remove/leave → 409. `can()` server-side default-deny gates every management op. Invite-code rotation still deferred (d058283d).
- Features: 10, 11

### F9 — Post assignment / pin schedule (P2)
- Entry: `/servers/:id/assignments` → create assignment (title/desc/due) → appears for members → F6
- Features: 15

## Orphan / reachability audit (v4 step 4)
- Every MVP feature (1–16) consumed by ≥1 page. ✓
- Every page connects to ≥1 flow (stubs 2,3 reachable from Landing footer). ✓
- DMs (H2) intentionally absent from MVP map. ✓

## Per-page PDs
`command-center/product/per-page-pd/<page>.md` — full PDs for pages 1, 4–16; stubs for `privacy.md`, `terms.md`. Links resolve after v4 step 3 fan-out.

---

## Regeneration cadence

Rebuild at **T-9 Journey** from current production state cross-referenced with `design/` mockups. See `claudomat-brain/blocks/test/stages/T-9-journey.md` and `command-center/testing/test-writing-principles.md`.
