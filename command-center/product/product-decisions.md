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
