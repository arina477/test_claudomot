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

## DevOps & Deploy

_(empty)_

## Process & Workflow

_(empty)_

## Data Model Decisions

_(empty)_
