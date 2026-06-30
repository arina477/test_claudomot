---
name: User Journey Map
description: Canonical inventory of every user flow, screen, route, API endpoint. Regenerated at T-9 from production state.
last_updated: 2026-06-30 (T-9 wave-15 — M3 @MENTIONS LIVE; data plane (parse word-boundaried + resolve member-only + persist message_mentions table, migration 0007) + realtime fan-out + GET /me/mentions + composer @autocomplete member-picker + mention pills (self/other) + unread-mention badge. NEW REST: GET /me/mentions (session-derived authz, cursor-paginated). NEW realtime: per-user room `user:<userId>` + `mention` event (the B-6 H-1 fix — decoupled from channel rooms so a mentioned user not viewing the channel still gets notified). EXTENDED: MessageResponse.mentions[], ServerMember.username. LOAD-BEARING-PROVEN live with TWO DISTINCT VERIFIED users (A+B co-members): two-client mention realtime ALIVE (B not in channel room received `mention` event, correct channel+recipient, 0 message:new leak); my-mentions authz IDOR-closed (B sees only B, A sees only A, ?userId= ignored, 401 unauthed); membership-scoped resolution (non-member → plain text, no row); author NOT self-badged; edit-diff add/remove round-trips; pills WCAG AA (viewer pill 10.08:1). No new page route — extends page-9. KNOWN coverage gaps → V-2: message_mentions real-PG integration tier still absent (2-wave carry 02fa8011, MEDIUM); Playwright MCP swarm blocked by chrome-channel-absent (MEDIUM, worked around via bundled chromium). Wave-14 F-4 typing defect remains carried. Verified-prod fixtures: studyhall-e2e-fixture (username studyhallfixturea) + studyhall-e2e-fixture-b (username studyhallfixtureb))
version: 0.11
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

## Deployment status — wave-14 (M3 PRESENCE layer — online/offline + typing + member-list, LIVE with 1 known defect)
Live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200, live-verified at T-9). NO migration (presence is in-memory server state — Map<userId,Set<socketId>> ref-count + typing TTL; co-membership from existing `server_members`). PR#26 merge `ef6afbf`; api+web new revisions deployed. **No new page route** — adds the page-9 member-list panel + a sibling `/presence` Socket.IO namespace (reuses the /messaging SuperTokens WS-upgrade auth). Tests: 419 in CI green against real Postgres (api 251 incl. +31 NEW presence unit tests closing a zero-coverage gap; shared 37 NEW presence Zod contract tests; web 131). Verification: HTTP/code-level + **two-client wire-level LIVE** (socket.io-client, two DISTINCT verified users). Single-pod in-memory adapter (no Redis — H2 scale deferral KI-1).

| Surface | Status | Note |
|---|---|---|
| Member-list panel (page 9, right pane) | ✅ Live | NEW. Right-hand panel: "MEMBERS" header, grouped **Online / Offline** with count ("OFFLINE — 2"), rows = avatar (initials fallback) + name + presence dot. Reflects ACTUAL server membership via `GET /servers/:id/members` (no new membership model). Responsive: visible at 1440/1024, **collapses <1024** (hidden at 900/768) per design §9 lg-breakpoint, no layout break. Live-verified at all 4 breakpoints with 2 real co-members rendered. Live DOM group-move (Online↔Offline) not directly E2E-captured (F-5 LOW); underlying fan-out proven at wire level. |
| `/presence` Socket.IO namespace (api, real-time) | ✅ Live | NEW sibling namespace. WS-upgrade auth reuses `installWsAuthMiddleware` (SuperTokens session + email-verified claim). `handleConnection`: ref-count up, join `presence:server:<id>` rooms, emit `presence:snapshot` (co-members' states). First socket → `presence:online` to co-member rooms; last socket → `presence:offline`. **Multi-tab safe** (ref-count; 2nd tab no self-flap — live-verified). All emits room-scoped (no global broadcast). |
| `presence:online` / `presence:offline` fan-out | ✅ Live | LIVE two-client (distinct verified users A,B co-members): B receives `presence:online{A}` 311ms after A connects, `presence:offline{A}` 79ms on A disconnect — genuine cross-user, not self-echo. **NO-LEAK**: B only ever received co-member ids (0 foreign); membership-scoped via `server_members` co-member resolution. |
| `presence:snapshot` on join | ✅ Live | Joining socket receives co-members' current online/offline states. Live: B's snapshot included co-member A. |
| `GET /servers/:id/members` (api) | ✅ Live | NEW. AuthGuard + member-gate. Live: unauthed → **401**; member (fixture) → **200** roster `[{userId,displayName,avatarUrl}]`; unverified/non-member → **403** (email-verify claim returns 403 before service member-gate — correct guard order). Member-gate `ForbiddenException('Not a member')` query lacks a dedicated test (F-3b LOW); covered via controller 403-propagation + live. |
| Typing indicators (`typing:start`/`typing:stop` → `typing:active`) | 🟡 Live but DEGRADED | Channel-scoped: `join_channel` re-checks `canViewChannelById` (never client-trusted) → typing fans out ONLY to `presence:channel:<id>` room. NO-LEAK proven (B not joined → 0 typing events). Self-exclusion + 5s TTL auto-expire + disconnect-clears-ghost all live-verified. **DEFECT F-4 (HIGH → V-2): co-members NEVER see who is typing** — `emitTypingActive` broadcasts ONE actor-excluded list to the whole room, so every recipient gets the typer filtered out; typers list always `[]` at B. Task 58633934 core AC ("members see '<name> is typing…'") UNMET in prod. Fix: emit full list + client self-filter, or per-recipient exclusion. |

**Access-control note (T-8 verified, presence = a scoping surface):** membership-scoping is the load-bearing security requirement and it HOLDS — verified with TWO DISTINCT VERIFIED users (not multi-tab): cross-user presence fan-out works (online 311ms / offline 79ms), NO presence leak (B received only co-member ids, 0 foreign), typing is channel-scoped with NO leak (non-joined B got nothing), WS upgrade rejects both unauthenticated AND unverified sessions, members endpoint is 401/403-gated, secret grep clean. The single FAIL (F-4) is a realtime-CORRECTNESS defect (typing payload empty), NOT a scoping/security leak — surfaced HIGH to V-2 (recommend blocking for spec task 58633934). The boundary is enforced in NestJS + the gateway room-scoping, not the UI.

## Deployment status — wave-15 (M3 @mentions — parse/resolve/persist + realtime + my-mentions + autocomplete + pills/unread, LIVE)
Live: web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app/health (200, live-verified at T-9). Migration `0007_massive_chamber.sql` (`message_mentions` table: id, message_id FK→messages ON DELETE CASCADE, mentioned_user_id FK→users, created_at, UNIQUE(message_id,mentioned_user_id), index (mentioned_user_id,created_at)) applied to prod Postgres BEFORE new code served (drizzle-kit migrate via public proxy; count 7→8). PR#27 merge `fd86540`. Deployed via Railway CLI `up` source-upload (NEW image; `GET /me/mentions` 404→401 route-flip proved the new revision serves). **No new page route** — extends the existing page-9 messaging surface (composer gains @autocomplete; message-row gains mention pills; channel sidebar gains the unread-mention badge). 471 tests (37 shared + 292 api + 142 web) green in CI against real Postgres. Verification at T-9: HTTP/code-level + **live two-client wire-level** (socket.io-client + REST, two DISTINCT verified users A+B) + browser UI pass (bundled-chromium; the Playwright MCP swarm was blocked by an absent chrome channel — T5-F1, worked around). Single-pod in-memory Socket.IO adapter.

| Surface | Status | Note |
|---|---|---|
| Composer @mention autocomplete (page 9) | ✅ Live | NEW. Typing `@`+query surfaces a member-picker (`role=listbox` "Matching members") sourced from `GET /servers/:id/members` (now carrying `username`). Keyboard nav with `aria-activedescendant` on the textarea; Enter selects (does NOT send); Escape dismisses; click-to-select inserts the canonical `@username` token. Live-verified: listbox + option + aria-activedescendant wired; Escape clears. |
| Mention pills (page 9 message list) | ✅ Live | NEW. `@username` tokens render as styled pills via React JSX (XSS-safe, escaped). VIEWER-targeted pill has distinct emphasis (emerald tint `rgba(16,185,129,0.1)` + emerald text `#6ee7b7`, WCAG AA 10.08:1) vs other-user pill (`--surface-700` `#27272a` + white-92, 14.89:1). Non-member/unknown token → plain text, no pill. Tombstoned/edited-out message → no pill. Live-verified at 1440/1280/1024. |
| Unread-mention badge (channel sidebar) | ✅ Live | NEW. Channel row shows an unread-mention count badge; live-verified `general\n4` (count) → `general` (cleared) on opening the channel (markChannelRead). Driven by the realtime `mention` event + `GET /me/mentions` bootstrap. Author NOT self-badged (server-side exclusion). |
| `GET /me/mentions` (api) | ✅ Live | NEW. AuthGuard; `viewerUserId = session.getUserId()` ONLY (no param/path/body — structurally cannot read another user's). Membership-scoped (re-joins server_members on viewer), soft-deleted excluded, cursor-paginated (most-recent-first). Live: unauthed → **401**; B sees only B's mentions; A sees only A's (not A-authored-to-B); `?userId=B` ignored (no IDOR). |
| `message_mentions` data plane (parse/resolve/persist/edit-diff) | ✅ Live | NEW. On create AND edit, `@username` tokens parsed word-boundaried (`(?:^|\s)@([a-zA-Z0-9_-]+)`) and resolved ONLY to server members with a non-null username; unknown/non-member → plain text, no row. Persisted UNIQUE(message_id,mentioned_user_id) ON CONFLICT DO NOTHING (idempotent). Edit removes no-longer-mentioned rows + inserts added (diff). `MessageResponse.mentions[]` round-trips. Live-verified: A@B resolves; @nonmember → []; self-mention persists; edit add→[B] / remove→[]. |
| `/messaging` gateway — per-user room + `mention` event (api, real-time) | ✅ Live | NEW (the B-6 H-1 fix). Every socket joins `user:<userId>` on connect (session-derived; no spoof). `@OnEvent('mention.created')` emits `mention` to `user:<mentionedUserId>` — decoupled from channel rooms, so a mentioned user NOT viewing the channel still gets notified (the original dead-feature). One emit per recipient; author excluded server-side. LIVE two-client: B (NOT in the channel room) received the `mention` event (correct channel+recipient) + 0 `message:new` leak. |

**Access-control note (T-8 verified, @mentions = an authz + scoping surface):** all load-bearing invariants are server-side and live-verified with TWO DISTINCT VERIFIED users — (1) **my-mentions authz** session-derived, IDOR-closed (B sees only B, A sees only A and NOT the message A authored mentioning B, `?userId=` ignored, 401 unauthed), (2) **membership-scoped resolution** (non-member token → plain text, no row, no notify), (3) **two-client realtime ALIVE** (B not in channel room received the per-user `mention` event, 0 channel-room leak — the H-1 dead-feature is genuinely fixed), (4) **author not self-badged** (self-mention → 0 realtime events), (5) **no XSS** (pills render via escaped React JSX). Secret-grep clean; gitleaks passed at C-1. **Coverage gaps → V-2 (non-blocking):** message_mentions real-Postgres integration tier still absent (2-wave carry 02fa8011, MEDIUM — V-2 must issue an explicit disposition); Playwright MCP swarm blocked by chrome-channel-absent (MEDIUM, T5-F1, worked around via bundled chromium). Accepted B-6 carries: M-1 (index ASC), M-2 (client interior-dot tokenizer divergence), M-3 (non-idempotent create re-select), M-4 (edit-diff not transactional), L-1..L-6. The boundary is enforced in NestJS + the gateway room-scoping, not the UI.

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
- **@mentions (wave-15, LIVE):** in the composer, type `@`+query → member-picker autocomplete (keyboard nav, Enter selects without sending) inserts the canonical `@username`. On send/edit, `@username` tokens are parsed + resolved to server members + persisted (`message_mentions`) and round-trip on fetch (`MessageResponse.mentions[]`). Rendered as mention **pills** (viewer-targeted pill has distinct emerald emphasis). A mentioned user gets a realtime `mention` event on their per-user room even when not viewing that channel (the H-1 fix), driving an **unread-mention badge** on the channel row that clears on view. `GET /me/mentions` lists the viewer's mentions (session-derived authz, cursor-paginated, membership-scoped). Non-member tokens stay plain text; self-mentions persist but never self-badge.
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
