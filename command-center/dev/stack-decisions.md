# Stack Decisions

## Selected: claudomat baseline + offline-first/desktop fit (applied 2026-06-26)

The claudomat TypeScript/React baseline, with two product-shape fits called out (offline-first realtime desktop app). v6 architecture branches assume these choices.

**Monorepo:** Turborepo + pnpm
**Backend:** NestJS (Node.js + TypeScript strict)
**Frontend:** **Vite + React 19 SPA** + Tailwind + shadcn/ui — *fitted adjustment* from the baseline's Next.js App Router. Rationale below.
**Shared contracts:** Zod schemas in `@studyhall/shared`, bridged to NestJS DTOs via `@anatine/zod-nestjs`
**Database:** PostgreSQL (Railway-managed) + Drizzle ORM
**Realtime:** Socket.IO namespaces (messaging, presence, typing) — required by feature-list (7,8,14) and the offline outbox flush
**Offline-first / local store:** client-side local store (IndexedDB-backed cache + outbox queue + reconnect reconciliation) — *first-class concern* (feature 12, the wedge). Exact library chosen at v6 (candidates: Dexie + a custom sync layer, or a local-first sync engine). Seeded here so v6 treats it as load-bearing, not an afterthought.
**Voice/video:** WebRTC SFU — **LiveKit** (self-hostable on Railway, or LiveKit Cloud) for drop-in study rooms (feature 13). v6 SDK branch confirms self-host vs cloud + cost.
**Auth:** SuperTokens (self-hosted on Railway — Core + Postgres; JWT + refresh tokens over Railway private network)
**Payments:** Stripe — **deferred to H2** (monetization is feature 22; not in MVP). Stripe CLI not installed until then.
**Storage:** Railway Buckets (S3-compatible, Tigris-backed) — avatars + message attachments
**Hosting:** Railway — bring-your-own (founder's account; Railway credential collected at deploy time, C-2 Action 0). API + Web + Postgres + (optional) LiveKit/SuperTokens services.
**CI/CD:** GitHub Actions (lint + typecheck + test + build; parallel jobs; `timeout-minutes` + `permissions: contents: read`)
**Lint/format:** Biome
**Testing:** Vitest (unit + integration) + Supertest (HTTP) + React Testing Library (components) + Playwright MCP (live E2E swarm)
**Secrets:** platform env vars only — never committed
**Desktop delivery:** **web-first installable (PWA)** for MVP; Electron/Tauri wrapper **deferred** — the brief said "desktop app (web or Electron)", i.e. the founder is indifferent on the wrapper. Start as an installable web app; wrap in a native shell later only if a desktop-only capability (deeper offline, OS notifications, tray) demands it.

**Not in the baseline yet — add only when needed:** Redis (cache/queues/rate-limit — likely needed once realtime fan-out scales; v6 DevOps branch flags), Sentry (error tracking — add at first deploy), Resend (transactional email — needed for feature 1 verification + invites; v6 SDK branch likely promotes to MVP).

## Rationale

Applied as the default technical stack — **no firm founder stack preference** surfaced (the brief's "web or Electron" is an explicit indifference, not a constraint; mobile is out of scope). Two fits to the product shape, made as technical defaults (rule 17), not founder polls:

1. **Vite + React SPA instead of Next.js App Router.** StudyHall is an offline-first, realtime, single-surface desktop-style app — not a content/SEO site. SSR buys little here and complicates the offline-first local store + service-worker story that IS the differentiator. A client-rendered SPA with a robust local store is the cleaner fit and wraps trivially in Electron/Tauri later.
2. **LiveKit for voice/video + IndexedDB local store promoted to first-class.** These are the two heaviest, most product-defining pieces (features 12, 13); naming them now keeps v6 from under-architecting the wedge.

The founder can switch any piece later by saying so.

## Cascading updates (for v6 / v6b)
- v6 Modules/Services branches: design the offline sync engine (cache + outbox + reconciliation) as a core module, not glue.
- v6 SDK branch: confirm LiveKit self-host-vs-cloud + cost; likely promote Resend (email) to MVP for feature 1/invites.
- v6 DevOps branch: flag Redis for realtime fan-out scaling; Sentry at first deploy.
- v6b: populate `.env.example` for NestJS + Postgres/Drizzle + Socket.IO + SuperTokens + Railway Buckets + LiveKit + (Resend).
- project.yaml: `stack.frontend = Vite+React`, `stack.backend = NestJS`, `stack.database = Postgres`, `stack.shared_contracts = Zod` — written at v6b.
