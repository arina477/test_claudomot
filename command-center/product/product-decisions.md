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

## Authentication & Security

_(empty)_

## Payments & Finance

_(empty)_

## Marketplace & Product

_(empty)_

## UI & Design

_(empty)_

## DevOps & Deploy

_(empty)_

## Process & Workflow

_(empty)_

## Data Model Decisions

_(empty)_
