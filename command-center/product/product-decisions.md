# Product Decisions — <Your Project>

**Append-only decision log.** Captures the "why" behind product and technical choices so AI agents and future developers don't re-litigate settled decisions.

---

## Entry format

```markdown
### [YYYY-QN] <Short decision title>
**Category**: Architecture / Security / Payments / Marketplace / Design / DevOps / Process / Data Model / API
**Status**: Active / Superseded / Deferred / Cancelled
**Context**: What situation required the decision.
**Decision**: The actual decision.
**Rationale**: Why this choice over alternatives.
**Alternatives considered**: Options rejected and why.
```

---

## Architecture & Stack

### [2026-Q2] Tech stack selected
**Category**: Architecture
**Status**: Active
**Context**: v5 onboarding stack selection for StudyHall (dark-themed desktop comms app for remote students; offline-first + realtime + voice/video).
**Decision**: claudomat baseline (NestJS + Postgres/Drizzle + Socket.IO + SuperTokens + Railway + Biome + Vitest + Playwright) with two product-shape fits applied as technical defaults: (1) **Vite + React SPA** frontend instead of Next.js App Router; (2) **LiveKit** for voice/video + an IndexedDB-backed local store promoted to a first-class offline-first module. Stripe/payments deferred to H2. Desktop delivery is web-first/installable, Electron/Tauri wrapper deferred.
**Rationale**: No firm founder stack preference — the brief's "desktop app (web or Electron)" is an explicit indifference, not a constraint. Offline-first + realtime + single-surface app gains little from SSR and needs a strong client-side local store (the wedge), so a client-rendered SPA fits better. Applied silently per always-on rule 17; founder away in automatic mode.
**Alternatives considered**: Next.js App Router (baseline default — rejected for this product shape: SSR overhead, weaker offline-first fit); Electron-first (deferred — start web, wrap later only if a desktop-only capability demands it).
**Cascading updates**: v6 (offline sync engine as core module; LiveKit self-host-vs-cloud; promote Resend email; flag Redis), v6b (.env.example + project.yaml stack fields). See `command-center/dev/stack-decisions.md`.

### [2026-Q2] Architecture cross-branch conflicts resolved (v6b)
**Category**: Architecture
**Status**: Active
**Context**: v6b architect-reviewer scan found 20 cross-branch drifts (naming/ownership/contract) across the 8 parallel architecture branches. None were product trade-offs; all resolved by canonical-source rule (databases.md → table/column names + data ownership; services.md → NestJS module boundaries; security/sdks → policy). Founder away in automatic mode; engineering-default resolutions per rule 17.
**Decision**: Canonical resolutions now authoritative in `_library.md` § Cross-domain (Resolved cross-branch decisions). Key ones: (1) ServersModule owns servers/members/channels/categories/invites/bans; (2) single `users` table holds profile + privacy fields (no separate profiles/privacy_settings tables); (3) single-role-per-member RBAC (`server_members.role_id`, no join tables); (4) two-tier invites (permanent `servers.invite_code` + ad-hoc `invites`); (5) offline outbox replays as idempotent `POST /api/messages` (idempotency_key, UNIQUE per channel) — no `/sync` namespace; catch-up via paginated history `?after=` cursor; (6) WS/LiveKit auth = SuperTokens session cookie on upgrade, short-lived JWT fallback for cross-origin/PWA; (7) auth emails via SuperTokens Core, invite/reminder via NotificationsModule (Resend, two keys); (8) 2 Socket.IO namespaces (`/messaging`, `/presence`); (9) file caps 2 MB avatar / 10 MB attachment; storage env vars `AWS_*`; (10) session cookie `SameSite=Lax`; (11) offline-sync is a `apps/web/src/features/sync` slice; CI adds web/e2e/offline jobs + gitleaks secret-scan; Sentry-PII lint guard deferred to H2.
**Rationale**: `_library.md` is the authoritative integrated reference (wins on any branch conflict); branch files remain expanded detail.
**Alternatives considered**: per-branch rewrites of all losing files (deferred — proportionality; `_library.md` authority + this log are the record).

## Authentication & Security

_(empty)_

## Payments & Finance

_(empty)_

## Marketplace & Product

_(empty)_

## UI & Design

### [2026-Q2] Design direction approved
**Category**: Design
**Status**: Active
**Context**: v7 onboarding design direction, anchored on the server channel view (the 3-pane core users live on). Founder away in automatic mode; reviewed and adopted on the founder's behalf — revisable.
**Decision**: Calm, focused, academic dark theme. Near-black zinc base (#0a0a0b → #1c1c1f layered surfaces), hairline borders (white @6% opacity), **emerald (#10b981)** as the primary academic accent with **amber (#f59e0b)** secondary; Geist sans (Linear-crisp typographic hierarchy). Discord-familiar 3-pane layout (server rail → channel sidebar → message view → member list) but quieter and warmer — not gaming-neon. Channels #general / #questions / #assignments + voice "Study Room"; assignments surfaced as first-class; connection/sync state indicator present (the offline-first wedge made visible); member presence (online / in voice).
**Rationale**: Matches the emotional anchors (calm · focused · friendly · credible · low-noise). Familiar enough to be instantly usable by Discord-native students, but visibly calmer and school-aware — the positioning wedge expressed visually. Dark-only per the explicit brief must-have.
**Artifacts**: `design/direction.html`, `process/session/onboarding/v7-direction-brief.md`

### [2026-Q2] Design system built + approved
**Category**: Design
**Status**: Active
**Context**: v8 onboarding design system, gated on locked module-list (v6b) + approved direction (v7). Founder away; approved on their behalf.
**Decision**: `design/DESIGN-SYSTEM.md` populated — full token set (layered zinc surfaces, emerald primary + amber secondary accents, Geist type, 4px spacing, radius/elevation/motion scales) + ~24 primitives covering every MVP module: standard (Button/Input/Card/Modal/Toast/Tooltip/Badge/Avatar/empty-error-loading/Form) and StudyHall-specific (ServerRail icon, ChannelSidebar item, MessageRow with pending/failed states, MessageComposer with offline outbox, MemberListItem presence, **ConnectionStateIndicator** — the offline-first wedge made visible, AssignmentCard, ChannelHeader, VoiceRoomTile, Invite preview). Each has states + accessibility notes.
**Rationale**: Aligned to v7 direction (visual reference `design/direction.html`) + locked module list (v6b). Dark-only per brief. Restrained palette (one base hue + emerald + amber + danger) keeps the calm/academic, non-gaming feel.
**Artifacts**: `design/DESIGN-SYSTEM.md`

### [2026-Q2] Per-page designs complete
**Category**: Design
**Status**: Active
**Context**: v9 onboarding per-page mockups. Founder away; generated + reviewed on their behalf. server-channel-view canonicalized from the approved v7 direction; the other 13 generated via aidesigner against each page's PD + the design system.
**Decision**: 14 non-stub pages designed + approved (`design/<page>.html`): landing, signup, login, forgot-password, email-verify, app-home, server-channel-view, voice-study-room, create-server, invite-join, server-settings, assignments-panel, settings-profile, settings-privacy. (Privacy/Terms remain stubs per v4 compliance quota.) A fresh ui-designer cross-page audit found palette/layout consistent but flagged aidesigner font substitution (Outfit/Inter/Satoshi) on 5 pages; resolved deterministically by injecting a Geist load + `!important` font override (regeneration was unreliable since aidesigner ignored the Geist instruction). Minor token-namespace/shade drift accepted — values are correct and `design/DESIGN-SYSTEM.md` is the canonical source B-block implements against (mockups are reference, not pixel-copy).
**Rationale**: Consistent calm-dark academic system across all surfaces; the offline-first connection indicator and assignments surface appear as first-class across in-app pages.
**Artifacts**: `design/<page>.html` × 14 + `process/session/onboarding/v9-<page>-brief.md` + per-page-pd annotations.

## DevOps & Deploy

### [2026-Q2] Test accounts — auto-provision via signup
**Category**: Testing
**Status**: Active
**Context**: v13 onboarding test-account seeding. Founder away (automatic); silent technical default per rule 17.
**Decision**: Test accounts are created through the project's own signup flow at the first UI wave's B-5 — one local-dev + one prod-fixture per v3 persona (Student Member, Server Organizer). `project.yaml: test_users.local_dev[]` left as an empty array with a planning note.
**Rationale**: No credentials needed at handoff; avoids vendor lock-in to provider tooling. T-5 / T-8 do not block — accounts exist before first needed.
**Next action**: First UI wave's B-5 scripts the signup endpoint.

### [2026-Q2] CI + deploy baseline
**Category**: DevOps
**Status**: Active
**Context**: v13 CI seed + CI-PRINCIPLES population.
**Decision**: GitHub Actions CI (`.github/workflows/ci.yml`): parallel lint / typecheck / test (Postgres 16 service) / build + gitleaks secret-scan, each with `timeout-minutes` + `permissions: contents: read`. Deploy: Railway bring-your-own (production on `main` + ephemeral PR previews; credential collected at first deploy, C-2 Action 0). Canary disabled for self-use-mvp (lenient thresholds recorded for launch). PR conventions: AI footer on, auto-merge off, squash merge.
**Rationale**: Matches v6 DevOps/tools branches + the v6b resolution (gitleaks now, Sentry-PII lint deferred to H2). Canary gated by `canary_threshold_dau=1000` until real users arrive.
**Alternatives considered**: enabling canary now (rejected — no real users at self-use-mvp).

## Process & Workflow

### [2026-Q2] Roadmap planned — 13 milestones (v10)
**Category**: Process
**Status**: Active
**Context**: v10 onboarding planning. Founder away in automatic mode; milestone shape authored and logged on their behalf (revisable at first refresh ritual). Zero child tasks per the per-wave-decomposition contract.
**Decision**: 13 theme-based milestones (`status='todo'`) in the `milestones` table. **H1 (MVP, 7):** M1 Foundation (shell/auth/profiles), M2 Servers/channels/membership, M3 Real-time messaging, M4 **Offline-first reliability (the wedge)**, M5 Assignments, M6 Voice/video study rooms, M7 Privacy/notifications/launch polish. **H2 (4):** M8 Educator tools & deeper academics, M9 Monetization (freemium tiers), M10 Compliance & data rights (self-use-mvp → H2 default, promote on paying-school requirement), M11 Growth/discovery. **H3 (2):** M12 Offline-first moat, M13 Institution partnerships & portable identity. Sequencing: M1→M2→M3→M4 first (text MVP + the wedge), then M5/M6/M7; voice (M6) last in H1 given XL complexity + LiveKit cost decision. All 14 pages, 16 MVP features, all MVP modules, and all SDKs are covered in H1 milestone `## Scope` prose (v10 step-7 audit passed).
**Rationale**: Theme-based, one theme per milestone; offline-first isolated as its own milestone (M4) so the differentiator gets first-class attention. Child tasks come per-wave via the decomposition ritual.
**Alternatives considered**: One broad MVP milestone (the v1 seed — superseded/repurposed into M1); trim-to-MVP-only (kept H2/H3 themes as planned-but-inactive for roadmap visibility).

## Data Model Decisions

_(empty)_

### [2026-Q2] M1 promoted + wave-1 seed bundle (onboarding bootstrap)
**Category**: Process
**Status**: Active
**Context**: v13 handoff. v10 created milestones with zero child tasks (per-wave decomposition); the first wave needs a seed to claim. Mirrors the brownfield install.md Phase 9 bootstrap.
**Decision**: Promoted M1 (Foundation: app shell, auth & profiles — highest-tier H1, T1) `todo → in_progress`, and authored its first bundle: seed "Bootstrap monorepo + dark app shell + CI" + siblings "Postgres + Drizzle + SuperTokens auth backend" and "Auth + profile frontend pages". `next_wave_seed_task` points at the seed.
**Rationale**: Onboarding→wave boundary has no prior N-1 to promote/decompose; v13 is the sanctioned bootstrap exception (like v13 being sole writer of .last-wave-completed.yaml at first boot). Subsequent bundles come per-wave from N-1.

[2026-06-26] M1: todo → in_progress (v13 onboarding bootstrap)

### [2026-Q2] Node version standardized on 22
**Category**: Architecture
**Status**: Active
**Context**: Wave-1 P-4 gate (karen) found a load-bearing conflict — architecture docs pinned Node 20.15.0 while the CI workflow + P-3 plan used Node 22.
**Decision**: Standardize on **Node 22** (current LTS). Amended `_library.md` + `tools.md` (.nvmrc=22, engines `>=22`); CI now uses `node-version-file: .nvmrc` (single source) instead of a hardcoded version. `.nvmrc` (created at B-0) is canonical.
**Rationale**: 22 is current LTS; CI was already on 22; lower churn than reverting to 20.15.0. Technical default per rule 17 (no founder poll).
**Alternatives considered**: revert everything to 20.15.0 (rejected — older LTS, more churn).

### [2026-Q2] Voice/video: LiveKit Cloud (not self-host on Railway)
**Category**: Architecture
**Status**: Active
**Context**: Build-ahead SDK research for wave-6 (voice) resolved the self-host-vs-cloud question flagged open at v6/v6b.
**Decision**: Use **LiveKit Cloud** for the voice/video study rooms, not self-hosted LiveKit on Railway.
**Rationale**: WebRTC media needs a UDP port range (50000–60000) + TURN; Railway only exposes TCP services, so a self-hosted LiveKit on Railway leaves symmetric-NAT users without media connectivity. LiveKit Cloud handles the SFU + TURN. The api still mints short-lived room-scoped tokens server-side (server stays out of the media path). Verified against official LiveKit self-hosting docs (`command-center/dev/SDK-Docs/LiveKit/livekit.md`).
**Alternatives considered**: self-host on a UDP-capable VPS (viable later if cost/control demands; deferred — adds ops burden at self-use-mvp).

## 2026-06-29 — /me email-verification gating: low-friction (verify-banner), not hard-gate
**Decision (wave-3, resolves a3328023):** Authenticated-but-unverified users CAN reach the app shell, shown a persistent "verify your email" banner; backend exempts /me + app-shell routes from the global SuperTokens EmailVerification REQUIRED claim (verification emails still send; sensitive actions may gate later). Rationale: maximizes first-run activation for the student/offline-first context vs a hard pre-verification wall; reversible. Applied as a sensible default under automatic mode (low-friction is the standard SaaS pattern); founder can override to force-verify-first.
**Wave-3 scope split (founder-approved):** auth pages + display_name profile this wave; username/avatar-upload/accent-color split to task 2a655960 (next wave).

[2026-06-29] M2 (Servers, channels & membership): bundle authored — 4 tasks (invites + join-flow: two-tier invite backend, invite-preview/join membership API, invite-join page, invite-create/share UI — the success-metric core that lets an organizer share a link and members join and see channels)
- caller: N-1-next-bundle
- decomposed by: milestone-decomposer sub-agent

## 2026-06-29 — Post-foundation direction: hardening-then-core ("a bit of both")
**Decision (founder, N-1 wave-4 strategic poll):** M1 foundation is feature-complete + live (shell + auth + profile customization). Founder chose to do the highest-value HARDENING next — login rate-limiting (839af17f) + finish avatar storage (84e09891, needs founder Railway Bucket creds) so profiles are fully done — THEN move to the core product (M2 servers/channels → M3 real-time messaging). Lower-value follow-ups (branch-protection 478e9d43, CI node-20 a7667fb7, version e38c306e, browser-E2E c51589cd) stay tracked, folded in around the work. M1 stays in_progress through the hardening. Rationale: balance safety/completeness with momentum before the bigger messaging build.

## 2026-06-29 — N-1 state reconciliation: wave-5 hardening bundle (839af17f + 84e09891)
**Decision (N-1 wave-4, head-next APPROVED, automatic mode):** Two follow-up tasks named in the founder "a bit of both" ruling — 839af17f (auth rate-limiting) and 84e09891 (avatar storage creds + live verify) — carried a stale `wave_id` stamp from the wave that SURFACED them (wave-2 T-8 security; wave-4 C-2) but never built them. Both are genuinely unbuilt (rate-limit: live probe showed no 429; avatar: presign path deployed, storage unwired pending creds). Cleared `wave_id` to NULL on exactly those two task ids to restore them to claimable-seed status, reconciling DB state to the logged founder decision and preventing a stale-state read that would otherwise have picked branch-protection (478e9d43) as the next seed. Also reconciled the pair into one wave-5 bundle: set 84e09891.parent_task_id = 839af17f (seed + sibling), the only shape N-2's single-seed pick supports. Rationale: honor the founder's explicit "rate-limiting + finish avatar storage" direction as the next wave; lower-value follow-ups (478e9d43, e38c306e, c51589cd, a7667fb7, a1299e88) stay tracked under M1. 84e09891 needs founder Railway Bucket creds — propagated to the wave-5 checklist so B-block plans the ask.

## 2026-06-29 — N-1 wave-9 seed priority: invite-completion bundle (BOARD 5-1-1, head-next APPROVED)
**Decision (N-1 wave-8 close-out, automatic mode, BOARD slug `N-1-seed-priority-wave-9`):** M2's active queue held 6 top-level seed candidates at wave-8 close (3 test/E2E follow-ups + 3 wave-8 invite drift follow-ups), so the milestone-decomposition ritual was a contractual NO-OP (fires only when seed_candidates=0) — an RBAC bundle could NOT be authored this wave without an out-of-ritual force-INSERT. The remaining call was purely an N-2 seed-ordering decision over existing candidates. BOARD voted Option A **5 APPROVE / 1 ABSTAIN / 1 REJECT** (passes 4+/7): seed wave-9 with the invite-completion bundle — seed `863c10ef` (invite-revoke endpoint+UI) + siblings `08ff762f` (invite_code backfill) + `5331b7d5` (share-modal-permanent-default). Re-parented the two siblings under the seed (the only shape N-2's single-seed pick supports; same reconciliation pattern as the wave-5 hardening bundle). Wave-9 is directed to pick `863c10ef` (not the oldest-created test follow-up) per the BOARD ordering.
**Rationale:** Finishes the LIVE invites/join slice to production grade (invite-revoke is table-stakes leaked-link control per Discord/Slack prior art; backfill makes pre-wave-8 servers shareable; share-modal default reduces friction), drains the highest feature-adjacent debt, and matches the founder's documented "fold follow-ups in around the core work, keep momentum" disposition (wave-4 ruling). The 3 test/E2E follow-ups stay tracked as M2 seed candidates for a later polish wave.
**Binding conditions from BOARD dissents (propagated to wave-9 checklist):**
- **RBAC is wave-10's seed, unconditionally** (strategist + industry-expert + counter-thinker + realist). M2's success-metric "see the right channels per role" clause is unmet; RBAC (server_members.role_id + channel_permission_overrides + owner-lockout safeguard) must be the very next bundle — next-wave N-1 prioritizes RBAC decomposition over any remaining/new non-RBAC follow-ups.
- **P-3 must spec the invite_code backfill (08ff762f) as idempotent + collision-safe** against the existing `UNIQUE(servers.invite_code)` constraint, CSPRNG codes, applied via a committed migration (NOT auto-migrate-on-boot), re-runnable (risk-officer).
- **Invite-revoke (863c10ef) must surface an honest "this link no longer works" affordance** to a member clicking a revoked link + a path to request re-invite (user-advocate); revoke must re-derive identity/authorization server-side, never from client-supplied invite/server id.
- **decided by:** BOARD (automatic) — strategist/risk-officer/user-advocate/industry-expert/founder-proxy APPROVE, realist ABSTAIN, counter-thinker REJECT. head-next gate: APPROVED.

## 2026-06-29 — wave-9: permanent invite_code rotation deferred (tracked)
**Decision (P-4 Gemini flag; karen+jenny follow-up):** wave-9's 8b makes the permanent servers.invite_code the default shared link, but revoke is scoped to ad-hoc invites → the permanent link is irrevocable if leaked. Deferred to a tracked M2 task (rotate permanent invite_code, owner-gated regenerate) NOT folded into wave-9 (0 prod servers = zero current exposure; rotation is additive, no rework risk; no unmet wave-9 AC). Trigger: first real external users / pre-launch link distribution.

## 2026-06-29 — M2 (Servers, channels & membership): RBAC bundle authored — 4 tasks
Next-wave (wave-10) bundle for M2's unshipped RBAC scope clause — server roles + channel-level permissions + owner-lockout safeguard + role-management UI. Closes the unmet success-metric clause "members join and see the right channels per role." Honors the wave-8 N / wave-9 L binding condition (RBAC is wave-10's seed, unconditionally). The 4 existing M2 tech-debt follow-ups (browser-E2E, verified-prod fixture, PG-rollback test, invite-code rotation) were left untouched — N-2 picks them naturally.
- **Bundle:** seed `Build RbacModule: roles table, RbacService.can(), role CRUD + assignment` (35f191f4) + 3 siblings — channel-level permission overrides + ChannelPermissionGuard (2c927c44), owner-lockout last-owner invariant (7a10f13d), role-management UI in server settings (0b9bcf35).
- **Security note:** RBAC is authz-critical — all four tasks require server-side authorization re-derivation via `RbacService.can()` (never client-supplied role/permission trust; route-param-only context) and the owner-lockout invariant; flags T-8 Security downstream.
- caller: N-1-next-bundle
- decomposed by: milestone-decomposer sub-agent

## 2026-06-29 — wave-10 RBAC: channel-override table name = channel_permission_overrides (override of _library)
**Decision (P-4 karen+jenny):** the channel-level permission table is named `channel_permission_overrides` (UNIQUE(channel_id,role_id) + INDEX(channel_id)), NOT `permissions`. `_library.md` is internally contradictory (L144 `permissions` vs L58 `channel_permission_overrides`), so the "doc wins" rule can't pick; `channel_permission_overrides` is self-documenting + already used in the spec/plan/shared-types. Role permission FLAGS are boolean columns on `roles` (per resolved decision #6 single-role-per-member — NO `role_permissions` join table; the stale L58/L144 entries are pre-v6b drift, optional L-housekeeping to strike).

## 2026-06-29 — N-1 wave-10 close-out: M2 done → M3 promoted (M2→M3 core pivot, automatic mode)
**Decision (N-1 milestone disposition, automatic mode, head-next APPROVED all 3 stages):** M2 "Servers, channels & membership" is FEATURE-COMPLETE — success metric "Organizer creates a study server with channels, invites the cohort via link, and members join and see the right channels per role" MET across 4 LIVE bundles (servers/channels, invites/join, invite-complete, RBAC). All `## Scope` items shipped (15 done tasks). Closed M2 `in_progress → done` and promoted M3 "Real-time messaging" `todo → in_progress` (one-`in_progress` invariant restored).
- **M2 → M3 pivot:** autonomous-proceed under the founder's same-day standing direction ("build the core: M2 servers → M3 messaging" — 2026-06-29). NOT surfaced as a blocking founder ask (re-polling a same-day pre-authorized direction would violate rules 16/17); a non-blocking founder REPORT covers disclosure. M3 directly reuses M2's wave-10 ChannelPermissionGuard + SuperTokens/RBAC auth primitives.
- **4 open M2 tasks reassigned to M3** (NOT M2 features — all test-infra/tech-debt/M3-forward): `4a2ad286` (verified-prod fixture), `46f16288` (browser-E2E create-server), `25523fb0` (PG-rollback test), `d058283d` (invite_code rotation). Reassigned via `UPDATE tasks SET milestone_id` (brain-permitted, rule 15 — not an out-of-ritual INSERT) so M2 closes against zero open children. They become M3's top-level seed candidates (independent, not siblings).
- **Wave-11 seed = `4a2ad286` (verified-prod fixture)** — single-task bundle. LLM seed re-order (N-2 Action 1) over the equal-`created_at` test-infra tasks: L-block flagged it ESCALATION-CRITICAL (4 consecutive authed-feature waves without it); it gates live C-2/T-8 verification for all M3 authed/messaging waves, so it goes FIRST to de-risk the messaging build. M3's actual messaging bundle decomposes in a later N-1 once the infra/tech-debt seeds clear (decomposition correctly NOT fired this wave — M3 has 4 seed candidates).
- **State transitions:** M2: in_progress → done (M2-feature-complete). M3: todo → in_progress (N-1 promotion, founder-pre-authorized M2→M3 pivot).
- **decided by:** N-1 (head-next gate: N-1/N-2/N-3 all APPROVED, automatic mode).

## 2026-06-30 — M3 (Real-time messaging): bundle authored — 3 tasks
First messaging bundle for M3's unshipped core text data plane — the most technically significant slice (real-time WebSockets). Cut the foundational slice and left the rest of `## Scope` (reactions, threads, mentions, attachments, presence/typing, member-list) for subsequent M3 waves to keep this WIP-limited and avoid bundle bloat. Closes the success-metric core "two students exchange messages in real time (<1s delivery)".
- **Bundle:** seed `Build MessagingModule + send/list message REST data plane` (a0c322b4) — `messages` table + Drizzle migration, RBAC-gated send + cursor-paginated list REST endpoints with idempotency-key dedup. Siblings: `Wire /messaging Socket.IO gateway: WS-upgrade auth + room-per-channel fan-out` (723b5b6a) — real-time `message:new` delivery; `Build message UI: composer + virtualized message list with pending/failed states` (d999d29c) — server-channel-view user surface.
- **Sequencing:** seed is the schema/contract foundation (`messages` table + shared Zod type + `message.created` event); both siblings build on it; the two siblings do not depend on each other. No sibling depends on an unbuilt later sibling. Deferred (later M3 waves): reactions, thread replies, mentions, file/image attachments, presence + typing (`/presence` namespace), member-list.
- **Security note:** authed-feature wave — T-8 rule 1 requires live-probe authz verification through ChannelPermissionGuard (reused from wave-10) with the wave-11 verified prod fixture on the send + list + WS-upgrade + room-join paths (real authenticated session; assert non-member/insufficient-role denial). Idempotency on `UNIQUE (channel_id, idempotency_key)`; cursor-only pagination (composite created_at+id); WS auth on upgrade not first message; two-client realtime verification mandatory.
- **Note on seed-candidate count:** M3 held 3 top-level todo `wave_id`-NULL tasks at fire time (browser-E2E 46f16288, PG-rollback-test 25523fb0, invite-rotation d058283d), but all 3 are carried M2 tech-debt — NOT messaging-feature seeds. Per N-1's effective-seed judgment (wave-10 close-out: "M3's actual messaging bundle decomposes in a later N-1 once the infra/tech-debt seeds clear") the messaging slice had an effective seed count of 0; authoring the first messaging bundle is not a duplicate. The 3 tech-debt tasks were left untouched — N-2 picks them naturally.
- caller: N-1-next-bundle
- decomposed by: milestone-decomposer sub-agent

[2026-06-30] M3 (Real-time messaging): bundle authored — 3 tasks (message edit/delete + reactions: complete the core message lifecycle over the existing /messaging fan-out)
- **Slice rationale:** with send/receive realtime shipped (wave-12: MessagingModule + send/list REST + /messaging gateway + composer/list UI; <1s sub-clause MET), the next natural slice is the `## Scope` "edit/delete" clause — the literal next item after send/receive. Seed = message edit/delete (PATCH/DELETE, soft-delete tombstone, message.updated/message.deleted over the existing room-per-channel fan-out). Two siblings: (a) reactions toggle endpoint + realtime, reusing the MessagingModule-owned message_reactions table and the same /messaging namespace; (b) UI extension for edit/delete tombstones + reaction-pill + live convergence on message.updated/deleted/reaction events.
- **Reuse-maximizing choice:** entire bundle extends the already-built MessagingModule + /messaging gateway. No new namespace, no new auth surface. Presence + typing (introduces the locked /presence namespace) deliberately deferred to its own future M3 wave; threads, mentions, attachments, member-list also deferred.
- **Sequencing:** seed lands the edit/delete endpoints + edited_at/deleted_at migration + shared Zod contract + message.updated/deleted events; the reactions sibling adds message_reactions + reaction events; the UI sibling consumes both. Siblings do not depend on each other. Flat INSERT under seed; B-block sequences implementation.
- **Note on seed-candidate count:** M3 held 3 top-level todo wave_id-NULL tasks at fire time (browser-E2E 46f16288, PG-rollback-test 25523fb0, invite-rotation d058283d), all carried M2 tech-debt — NOT messaging-feature seeds. Effective messaging-feature seed count = 0, so authoring the first messaging-feature bundle is not a duplicate. The 3 tech-debt tasks were left untouched — N-2 picks them naturally.
- caller: N-1-next-bundle
- decomposed by: milestone-decomposer sub-agent (task-id self)

[2026-06-30] M3 (Real-time messaging): bundle authored — 4 tasks (presence + typing + member-list panel: the next conversational primitive after the message lifecycle, over a new /presence namespace)
- **Slice rationale:** with the full message lifecycle shipped (waves 11–13: MessagingModule + send/list REST + /messaging gateway + composer/list UI + reactions + edit/delete; success-metric realtime sub-clause MET), the next natural M3 `## Scope` slice is "presence + typing (/presence namespace), member list with presence" — the Discord-core conversational primitive that follows the message lifecycle. Seed = the /presence Socket.IO namespace (WS-upgrade auth reused from /messaging, online/offline tracking with per-user connection ref-counting + presence snapshot/fan-out). Three siblings ride the same namespace/state: (a) typing indicators ("X is typing…", throttled, channel-scoped, auto-expiring); (b) member-list panel on server-channel-view (Online/Offline groups, live presence dots, reusing existing server-members data source); (c) presence dots on message-row author avatars (shared presence store, presence-dot primitive reuse).
- **Reuse-maximizing choice:** seed reuses the /messaging WS-upgrade auth path (task 723b5b6a) as the auth template on RealtimeGateway; all three siblings consume one presence client/store — no duplicate socket connections, single presence-dot primitive across member panel + author rows. Threads, mentions, file/image attachments deliberately deferred to subsequent M3 waves to keep this WIP-limited and avoid bundle bloat.
- **Sequencing:** seed lands the /presence namespace + online/offline state + snapshot/fan-out contract; typing sibling adds typing:start/stop events on the same namespace; member-list panel + author-dot siblings consume the presence state. No sibling depends on an unbuilt later sibling; the two UI siblings share the presence store but are independent. Flat INSERT under seed; B-block sequences implementation.
- **Security note:** authed realtime wave — the /presence namespace MUST authenticate on WS upgrade via the SuperTokens cookie (reject unauthenticated upgrades), and presence/typing events MUST be scoped to shared server/channel membership so presence never leaks to non-co-members. T-8 + two-client realtime verification apply.
- **Note on seed-candidate count:** M3 held 3 top-level todo wave_id-NULL tasks at fire time (browser-E2E 46f16288, PG-rollback-test 25523fb0, invite-rotation d058283d), all carried M2 server-management tech-debt — NOT messaging-feature seeds. Effective messaging-feature seed count = 0, so authoring the presence bundle is not a duplicate. The 3 tech-debt tasks were left untouched — N-2 picks them naturally.
- **Bundle UUIDs:** seed `Wire /presence Socket.IO namespace: online/offline tracking` (d1c4693d-b793-4960-8adf-f561aad20677). Siblings: `Add typing indicators over /presence namespace` (58633934-e6c4-45a7-9432-62ab2d8adbac); `Build member-list panel with live presence on server-channel-view` (058984c5-b57a-4b8c-b2a5-cefce88357a9); `Add presence dots to message author rows and DM/member affordances` (10b9d18e-5071-41dc-85de-ef257b9dfde0).
- caller: N-1-next-bundle
- decomposed by: milestone-decomposer sub-agent (task-id self)

[2026-06-30] M3 (Real-time messaging): bundle authored — 3 tasks (@mentions: parse/persist/fan-out + composer autocomplete + mention pills & unread affordance)
- **Slice rationale:** with the message lifecycle (waves 11–13) and presence + typing + member-list (wave-14) shipped and LIVE, the remaining M3 `## Scope` feature items are thread replies, @mentions, and file/image attachments. Per `## Scope` value + dependency/risk, @mentions is the lightest, lowest-risk, self-contained next slice: no new infrastructure, reuses the wave-13 messaging persistence path and the wave-14 /presence member data as the resolution + autocomplete source. Threads require a thread_parent_id schema change + nested UI; attachments pull in an external SDK (Railway Buckets/S3) → external-sdk-integration + upload UI + ≤10MB validation. Both have larger blast radius and are deferred to subsequent M3 waves. Seed = @mention parse/resolve/persist/fan-out + a "my mentions" read endpoint. Two siblings: (a) composer @-autocomplete member-picker reusing the member-list data source; (b) mention pills in message rows + unread-mention affordance driven by the seed fan-out.
- **Reuse-maximizing choice:** seed extends the already-built MessagingModule and reuses the existing /messaging room-per-channel gateway (task 723b5b6a) for fan-out — no new namespace, no new auth surface. Autocomplete sibling reuses the wave-14 member-list/presence data source (task 058984c5); pill sibling reuses reaction-pill styling precedent (task d78df376) and existing message-row primitive.
- **Sequencing:** seed lands mention parsing on create+edit, member-resolution scoped to server membership, per-message mention persistence, realtime mention event on the existing fan-out, and the authz'd "my mentions" endpoint; autocomplete sibling produces canonical @username tokens; pill sibling renders resolved mentions + unread indicator. Siblings do not depend on each other. Flat INSERT under seed; B-block sequences implementation.
- **Note on seed-candidate count:** M3 held 7 open tasks at fire time — 3 parked tech-debt (create-server E2E 46f16288, mid-txn rollback 25523fb0, invite-code rotation d058283d), 3 wave-14 V-2 non-blocking follow-ups (real-Postgres test tier 02fa8011, presence perf scan 6a546c7b, presence/members code-debt d23a0740), and 1 deferred polish sibling (author-row presence dots 10b9d18e, parented to d1c4693d). None is an unshipped-feature seed. Effective feature-seed count = 0, so authoring the @mentions bundle is not a duplicate. All 7 left untouched — N-2 picks them naturally.
- **Bundle UUIDs:** seed `Implement @mention parsing, persistence, and realtime fan-out` (3d238446-25b9-4c3d-91ca-0fc3dbae17f2). Siblings: `Add @mention autocomplete member-picker to the composer` (cd585f04-c1d5-48b2-9d45-d01ecd3ae15f); `Render mention pills and unread-mention affordance in message list` (c3f3f62a-86c3-41cd-ba14-ce5e731e2d37).
- caller: N-1-next-bundle
- decomposed by: milestone-decomposer sub-agent (task-id self)
