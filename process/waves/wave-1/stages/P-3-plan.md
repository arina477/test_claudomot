# Wave 1 — P-3 Plan

## Approach section

### Architecture deltas
- **Monorepo (new):** Turborepo + pnpm workspaces — `apps/api` (NestJS modular monolith skeleton), `apps/web` (Vite + React 19 SPA, PWA-ready), `packages/shared` (Zod schemas/types). *Alt considered:* Nx (heavier, more opinionated) and a single-package repo (blocks the api/web/shared split the locked architecture assumes). Turborepo+pnpm wins on lightness + matches `_library.md` § Tools. No failure-domain crossing (greenfield).
- **Backend skeleton (new):** NestJS modular monolith with a single `HealthModule` this wave. *Alt:* bare Express (rejected — the whole architecture is NestJS-module-boundary based; start as we mean to continue). Module boundaries for auth/servers/messaging come in later waves.
- **Frontend shell (new):** Vite + React SPA rendering the dark app-shell chrome (server rail + channel sidebar skeleton + main column) from the approved design system. *Alt:* Next.js App Router (rejected at v5 — SSR adds nothing for an offline-first realtime SPA). `vite-plugin-pwa` installed now (installable shell) but service-worker offline logic is the M4 wedge, not this wave.
- **CI (exists):** `.github/workflows/ci.yml` already authored at onboarding; this wave makes its jobs actually pass (real `pnpm lint/typecheck/test/build`).

### Data model
None this wave. Postgres + Drizzle schema is the deferred auth-backend task (b9118041). The shell uses no database.

### API contracts (concrete)
- `GET /health` — method GET, no request body, **auth: anon**. Response 200 `application/json`: `HealthResponse { status: 'ok'|'degraded', service: 'studyhall-api', version: string }` (Zod schema in `packages/shared`). No error envelope (no failure path this wave). Idempotent, no retry semantics.

### Dependency list (all standard baseline; versions pinned at install by the executor to latest stable)
- **turbo**, **pnpm** (packageManager) — monorepo orchestration. Baseline.
- **vite**, **@vitejs/plugin-react**, **vite-plugin-pwa**, **react@19**, **react-dom@19** — web app.
- **tailwindcss** (+ the design tokens) — styling per DESIGN-SYSTEM.md.
- **@nestjs/core**, **@nestjs/common**, **@nestjs/platform-express** — api.
- **zod**, **@anatine/zod-nestjs** — shared contracts (Zod ↔ DTO bridge).
- **@biomejs/biome** — lint/format (single tool).
- **vitest**, **@testing-library/react**, **@testing-library/jest-dom**, **supertest** — tests.
- **typescript** (strict, project refs).
No NEW third-party SDK this wave (SuperTokens/LiveKit/Resend/Sentry are later) → SDK pre-build checklist N/A. Licenses all MIT/Apache-2.0 (permissive).

## Plan section

### File-level steps (grouped by B-block stage)

**B-0 Branch & scaffold** (specialist: devops-engineer)
- branch `wave-1-foundation` off main — create
- `pnpm-workspace.yaml`, `turbo.json`, root `package.json` (scripts: dev/build/lint/typecheck/test/test:ci/db:* placeholders), `biome.json`, root `tsconfig.base.json` + `tsconfig.json` (project refs), `.nvmrc` (node 22) — create

**B-1 Contracts** (specialist: typescript-pro) — *must precede apps (both import it)*
- `packages/shared/package.json`, `tsconfig.json` — create
- `packages/shared/src/health.ts` (Zod `HealthResponse`), `packages/shared/src/index.ts` — create

**B-2 Backend** (specialist: backend-developer) — *parallel with B-3 after B-1*
- `apps/api/package.json`, `tsconfig.json`, `nest-cli.json` — create
- `apps/api/src/main.ts` (bootstrap, CORS for web origin), `app.module.ts` — create
- `apps/api/src/health/health.controller.ts` (GET /health → HealthResponse), `health.module.ts` — create
- `apps/api/test/health.e2e-spec.ts` (supertest: /health → 200) — create

**B-3 Frontend** (specialist: react-specialist) — *parallel with B-2 after B-1*
- `apps/web/package.json`, `tsconfig.json`, `vite.config.ts` (react + pwa plugins), `index.html` — create
- `apps/web/src/main.tsx`, `App.tsx` — create
- `apps/web/src/styles/tokens.css` + `tailwind.config.ts` (design-system tokens: zinc surfaces, emerald/amber, Geist) — create
- `apps/web/src/shell/AppShell.tsx`, `ServerRail.tsx`, `ChannelSidebar.tsx`, `MainColumn.tsx`, `ConnectionStateIndicator.tsx` — create (chrome per design/app-home.html + server-channel-view.html; responsive collapse)
- `apps/web/src/shell/AppShell.test.tsx` (RTL: three columns render) — create

**B-4 Wiring** (specialist: orchestrator/devops-engineer)
- root `package.json` scripts finalized so `pnpm dev` runs turbo `dev` across api+web; ensure `pnpm test:ci`, `lint`, `typecheck`, `build` map to real per-workspace tasks the CI yml calls
- `README.md` Quick Start section verified against `pnpm install && pnpm dev`
- `.gitignore` already covers node_modules/dist/.turbo (done at v13)

### Specialist routing (validated against command-center/AGENTS.md)
- **devops-engineer** — monorepo tooling + CI wiring ✓ in AGENTS.md
- **typescript-pro** — shared Zod package + tsconfig project refs ✓
- **backend-developer** — NestJS api skeleton + health ✓
- **react-specialist** — Vite/React shell ✓
- (B-6 review gate uses **head-builder**; B-5 verify can use **karen**/smoke tests)

### Parallelization map
- Serial chain (foundation order): **B-0 root scaffold → B-1 packages/shared** (both apps depend on it).
- Parallel batch (after B-1): **{B-2 apps/api}** ∥ **{B-3 apps/web}** — independent specialists, no shared files.
- Serial: **B-4 wiring** after both apps exist (root scripts reference both).
- No file appears in two parallel batches. ✓

### Self-consistency sweep (Action 8)
1. Every AC maps to ≥1 step: install→B-0; dev/health→B-0+B-2; shell render→B-3; ConnectionStateIndicator→B-3; responsive→B-3; lint/typecheck/build→B-0+B-4; test→B-2+B-3; CI green→B-4+existing ci.yml. ✓
2. Every step has a specialist. ✓
3. No file in multiple parallel batches. ✓
4. design_gap_flag = false (referenced; D-block skips). ✓
5. Architecture deltas have explicit alternatives (Nx, single-package, Express, Next.js). ✓
6. Data + API contracts concrete (HealthResponse; no DB this wave). ✓
7. New deps justified (all baseline, no new SDK). ✓
8. SDK pre-build checklist: N/A (no new external SDK this wave). ✓

Sweep clean — ready for P-4.
