# Architecture Branch: DevOps

branch: devops
authored: 2026-06-26
stage: self-use-mvp
stack_lock: NestJS · Vite/React SPA · Postgres/Drizzle · Socket.IO · LiveKit · SuperTokens · Railway · GitHub Actions

---

## Summary

StudyHall's delivery pipeline is built around Railway as the single hosting platform and GitHub Actions as the CI runner. At self-use-mvp the surface is deliberately narrow: one monorepo, one production environment, parallel CI jobs on every push, and Railway service-per-process. There are no staging environments and no canary splits at this stage — the founder is the cohort and the acceptance criterion is "works for one class." The architecture is designed so that adding a staging environment, Redis, or horizontal scaling is an additive change (new Railway service, new env var set, new CI job) rather than a restructuring.

Railway credential is collected at deploy time (C-2 Action 0), not during onboarding. All secrets are Railway env vars and GitHub Actions secrets — never committed to source.

---

## Inventory

### Runtime environments

| Environment | Where | How started | Who uses it |
|-------------|-------|-------------|-------------|
| Local dev | Developer machine | `pnpm dev` (Turborepo) | Founder / any contributor |
| PR preview | Railway (per-PR ephemeral) | Railway GitHub app auto-deploy on PR branch | Code review, manual smoke test |
| Production | Railway (persistent) | GitHub Actions `deploy` job on merge to `main` | Live cohort |

There is no dedicated staging environment at self-use-mvp. PR previews serve that function: Railway deploys each PR branch as ephemeral services that share the prod Postgres (read-only replica or a seeded preview database — see Risk R-1). The `NODE_ENV` distinction is `development` / `production` only; no `staging` value is introduced.

### Railway service topology

Five Railway services in one Railway project:

| Service | Image / build | Public? | Notes |
|---------|---------------|---------|-------|
| `api` | Nixpacks from `apps/api` (NestJS) | Yes (HTTPS) | The NestJS monolith. All REST + Socket.IO on one process. |
| `web` | Nixpacks from `apps/web` (Vite build → static) | Yes (HTTPS) | Vite SPA. Railway serves the built `dist/` folder via a static file adapter or a thin Express static server. |
| `postgres` | Railway-managed Postgres plugin | No (private network only) | Shared by `api` and `supertokens`. |
| `supertokens` | `registry.supertokens.io/supertokens/supertokens-postgresql` (official Docker image) | No (private network only) | SuperTokens Core. Reachable from `api` via Railway private network at `supertokens:3567`. |
| `livekit` | `livekit/livekit-server` (official Docker image, self-hosted path) OR replaced by LiveKit Cloud URL env var | Conditional | See self-host vs cloud decision in Stack-specific decisions and R-4. At MVP, self-hosted on Railway is the default. LiveKit requires UDP port exposure — see R-5. |

**Private network:** Railway private networking (`railway.internal` DNS) connects `api` → `postgres`, `api` → `supertokens`, and `api` → `livekit` (self-hosted path) without leaving Railway's private network. No intra-service traffic crosses the public internet.

**No Redis service at MVP.** Redis is flagged for H2 (Socket.IO multi-instance adapter, BullMQ queues, distributed rate-limit store). The single `api` process does not need it at cohort scale. Adding it is one `railway add` and a set of env var updates.

### GitHub Actions CI workflow shape

One workflow file: `.github/workflows/ci.yml`. Triggered on `push` to any branch and `pull_request` to `main`.

```yaml
# Illustrative structure — exact YAML authored at B-block CI milestone
name: CI

on:
  push:
  pull_request:
    branches: [main]

permissions:
  contents: read        # least-privilege default for all jobs

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter './apps/*' --filter './packages/*' exec biome check .

  typecheck:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter './apps/*' --filter './packages/*' tsc --noEmit

  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: studyhall_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter '@studyhall/api' run test:ci
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/studyhall_test
          NODE_ENV: test

  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter './apps/*' build
```

All four jobs run in parallel (no `needs` dependency between them). The `deploy` job (separate, `needs: [lint, typecheck, test, build]`) triggers only on push to `main` and is defined in a separate workflow file (`.github/workflows/deploy.yml`) to keep CI and deploy concerns separated. The deploy job does not build — it triggers Railway's deploy via the Railway GitHub app (push-to-deploy) or via `railway up` CLI in the step. Deploy verification uses the Railway deploy-state endpoint (see Deploy verification section below), not `/healthz`.

**No `GITHUB_TOKEN` write permissions.** The workflow-level `permissions: contents: read` is the floor. Individual jobs that need nothing beyond read do not elevate. Any future job that needs to write (e.g., create a GitHub Deployment) declares its own narrowed `permissions` block explicitly.

**Turborepo remote cache.** At self-use-mvp, Turborepo remote cache is not configured (local cache only per runner). If CI time grows past ~5 min per job, enable Turborepo Cloud or Vercel Remote Cache — this is a one-line addition to `turbo.json` + one GitHub Actions secret, not an architectural change.

---

## Conventions

### Environment variable naming

All env vars follow `SCREAMING_SNAKE_CASE`. Grouped by service in `.env.example`:

```
# --- Database ---
DATABASE_URL=             # postgres://user:pass@host:5432/db
DATABASE_POOL_SIZE=10

# --- SuperTokens ---
SUPERTOKENS_CONNECTION_URI=   # http://supertokens:3567 (Railway private network)
SUPERTOKENS_API_KEY=          # generated: openssl rand -base64 32

# --- Auth / App ---
API_DOMAIN=               # https://api.studyhall.up.railway.app (or custom domain)
WEB_DOMAIN=               # https://studyhall.up.railway.app
ALLOWED_ORIGINS=          # comma-separated

# --- LiveKit ---
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=              # wss://livekit.studyhall.up.railway.app OR LiveKit Cloud URL

# --- Railway Buckets (Tigris S3-compatible) ---
BUCKET_ENDPOINT=
BUCKET_ACCESS_KEY_ID=
BUCKET_SECRET_ACCESS_KEY=
BUCKET_NAME=

# --- Resend ---
RESEND_API_KEY=

# --- Runtime ---
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

Secrets that are generated (not account-issued) are created autonomously via `openssl rand -base64 32` and set directly in Railway env vars — never written to a file, never committed. Account-issued credentials (`RESEND_API_KEY`, `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` for LiveKit Cloud path, Railway Buckets credentials) are requested from the founder once at the relevant milestone.

### Secret management

Two planes:

1. **Railway env vars** — production secrets. Set via Railway dashboard or Railway MCP (`mcp__Railway__set-variable`). Every Railway service has its own env var scope; shared vars (e.g. `DATABASE_URL`) are set at the Railway project level and referenced by all services.
2. **GitHub Actions secrets** — CI secrets. Only `RAILWAY_TOKEN` (to trigger deploys from the `deploy` job if not using push-to-deploy) and any CI-specific test credentials. Set via `gh secret set` or GitHub repo settings. Never echoed in workflow steps.

**`.env` files are gitignored.** The repo ships `.env.example` (committed, no secret values) and `.env.local` / `.env.production.local` (gitignored). `claudomat doctor` enforces the no-password guard on `project.yaml: test_users`.

### Branching and deploy triggers

| Branch | Deploy target | Trigger |
|--------|--------------|---------|
| `main` | Production (Railway persistent services) | Push to `main` (after CI passes) |
| `feature/*`, `fix/*` | PR preview (Railway ephemeral) | Railway GitHub app auto-deploy on PR open/push |
| Any other branch | None | CI runs; no Railway deploy |

Merge strategy from `project.yaml` governs how `feature/*` branches land on `main`. PR previews are destroyed when the PR is closed/merged (Railway GitHub app default behavior).

### Deploy verification

After a Railway deploy is triggered, verification uses the Railway deployment state endpoint — not the application's `/healthz`. The `/healthz` route can serve a cached `200` from the old container while the new one is still starting or has failed to bind. The canonical probe is:

```bash
railway deployment list --json --service "$RAILWAY_SERVICE" \
  | jq -e '.[0].status == "SUCCESS"'
```

This is the `success_condition` in every `MONITOR:` task created at C-2 (see `claudomat-brain/monitors/railway-deploy.md`). Deployment states `FAILED`, `CRASHED`, `REMOVED`, and `SKIPPED` all classify as failure (SKIPPED is a failure — the commit did not ship). The monitor `timeout_budget` is 900 seconds (15 minutes); `poll_delay` is 45 seconds.

For the `web` (Vite SPA static) service, the same Railway deployment state check applies — the static file service is also a Railway service deployment, not a CDN invalidation.

### Monorepo workspace layout

```
studyhall/                         # repo root
├── apps/
│   ├── api/                       # NestJS application
│   └── web/                       # Vite + React SPA
├── packages/
│   └── shared/                    # @studyhall/shared — Zod schemas, error codes, types
├── .github/
│   └── workflows/
│       ├── ci.yml                 # lint + typecheck + test + build (parallel)
│       └── deploy.yml             # deploy to Railway (main only, needs CI)
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

Turborepo task graph: `build` depends on `^build` (packages build before apps). `test` and `lint` are independent (no dependency). `typecheck` depends on `^build` for the shared package's generated types.

---

## Reusability principles

1. **CI job structure is copy-once per new app service.** Each job is self-contained: checkout, pnpm install, run one command. Adding a new app (e.g. a separate admin panel) is adding a filter flag to the existing job or appending a new job block — not redesigning the workflow.

2. **Railway env var naming matches `.env.example` exactly.** No translation layer, no aliasing. The same key name set in Railway's dashboard is the one read by the app. This prevents the "works locally, broken on Railway" class of env var bugs.

3. **Deploy verification is always Railway deployment state, never application health.** This is a fixed invariant: every `MONITOR:` task for a Railway deploy uses `.[0].status == "SUCCESS"` from `railway deployment list --json`, per the template in `claudomat-brain/monitors/railway-deploy.md`. Do not substitute `/healthz` or a custom readiness route.

4. **Secrets generated by the brain (`openssl rand -base64 32`) are set in the platform immediately.** They are never staged in a temp file, never echoed to stdout in a logged step. Account-issued credentials are the only secrets that block on the founder.

5. **Each Railway service has the minimum env vars it needs.** The `web` service does not receive database credentials. The `supertokens` service only receives its Postgres URL and API key. Blast radius of a compromised service's env var scope is bounded.

6. **Observability is added at first deploy, not retrofitted.** Sentry DSN is set in Railway env vars during C-2 Action 0 for both `api` and `web` services. A Sentry project without any events is free; adding it retroactively after a production incident is not acceptable.

---

## Cross-references

| Topic | File |
|-------|------|
| Stack lock (Railway, GitHub Actions, NestJS, Vite/React, all services) | `command-center/dev/stack-decisions.md` |
| Railway service topology detail (NestJS modules, Socket.IO namespaces) | `command-center/dev/architecture/services.md` |
| Database schema, Drizzle migration policy | `command-center/dev/architecture/databases.md` |
| Railway deploy monitor (success/failure/timeout conditions) | `claudomat-brain/monitors/railway-deploy.md` |
| GitHub Actions monitor | `claudomat-brain/monitors/gh-actions.md` |
| Monitor three-condition contract | `claudomat-brain/monitors/monitor-principles.md` |
| C-2 deploy-and-verify stage (MONITOR task creation, canary phase) | `claudomat-brain/blocks/ci-cd/stages/C-2-deploy-and-verify.md` |
| Feature list (H1/H2 horizon for Redis, Sentry, PWA) | `command-center/product/feature-list.md` |
| SDK integrations (LiveKit self-host vs cloud, Resend, SuperTokens) | `command-center/dev/SDK-Docs/` (to be populated — v6 SDK branch) |
| Offline-first client design (service worker, IndexedDB) | `command-center/dev/architecture/offline-sync.md` (to be authored — v6 Modules branch) |

---

## Stack-specific decisions

**Railway bring-your-own credential model.** The founder pastes a Railway token at C-2 Action 0 (deploy milestone), not at onboarding. The brain probes credential validity using `railway deployment list --json --service "$RAILWAY_SERVICE" | jq -e 'type == "array"'` (project-token-friendly — does not require `railway whoami` to succeed). If the token is absent from the environment, the brain routes to C-2 Action 0's founder-ask pause. Env-var presence is provisional: if the first deploy-scoped call fails with an auth error, treat it as credential-absent (not a deploy failure) and re-route to the founder-ask.

**PR preview environments.** Railway's GitHub app deploys each PR branch as ephemeral services. At self-use-mvp these previews share the production Postgres instance (founder-only testing, no production user data at risk). Before onboarding real cohort members, the preview environment should be pointed at a seeded test database — see R-1. PR preview URLs are constructed by Railway automatically; the GitHub app posts the URL as a PR comment.

**Vite SPA static serving on Railway.** The `web` service builds with `vite build` (output to `dist/`). Railway's Nixpacks detects the Vite project and can serve the static output. If Nixpacks does not auto-detect the static adapter, a minimal `server.js` (Express static) wraps the `dist/` folder. The `web` service does not run Node in production beyond that wrapper — no SSR, no API routes. `VITE_API_URL` is set as a Railway env var at build time (Vite embeds it into the bundle).

**`VITE_` prefix for client-side env vars.** Vite only exposes env vars prefixed `VITE_` to the browser bundle. Client-side vars (`VITE_API_URL`, `VITE_LIVEKIT_URL`, `VITE_SENTRY_DSN`) are set in Railway env vars and embedded at `vite build` time. They are not secrets (they appear in the built JS bundle). Backend secrets (`DATABASE_URL`, `SUPERTOKENS_API_KEY`, etc.) are never prefixed `VITE_` and never reach the browser.

**SuperTokens Core on Railway private network.** `supertokens` service is not publicly exposed. `SUPERTOKENS_CONNECTION_URI=http://supertokens:3567` uses Railway's private DNS. The `api` service communicates with it over the private network. The SuperTokens dashboard (if enabled) is not exposed externally at MVP.

**LiveKit self-host vs cloud default: self-hosted Railway service.** At MVP the default is to run `livekit/livekit-server` as a Railway service. The `api` `VoiceModule` only changes the `LIVEKIT_URL` env var to switch to LiveKit Cloud — no code changes. The v6 SDK branch confirms the cost comparison (Railway self-host CPU/memory cost vs LiveKit Cloud per-minute billing for a 5-person study room). See R-4 and R-5 for Railway-specific constraints on LiveKit.

**Sentry at first deploy.** Two Sentry projects: one for `api` (Node), one for `web` (browser). `@sentry/nestjs` and `@sentry/react` are installed at the B-block Sentry milestone. DSNs are set as Railway env vars (`SENTRY_DSN` for api, `VITE_SENTRY_DSN` for web). Source maps are uploaded as part of the `build` CI job using `sentry-cli`. At MVP, Sentry is on the free tier — no cost until error volume exceeds the free quota. Do not wait for a production incident to add Sentry.

**Railway logs and metrics.** Railway provides per-service log streaming and basic CPU/memory metrics natively (no additional agent). At MVP this is the primary observability surface beyond Sentry. Log access: `railway logs --service api` or via the Railway dashboard. Structured JSON logs from Pino (set in services.md Conventions) are human-readable in Railway's log viewer and parseable by any log aggregator added later (Axiom, Datadog, Logtail — all integrate via Railway's log drain).

**Redis flagged for H2, not MVP.** Three upgrade triggers: (a) more than one `api` Railway service replica is needed (Socket.IO multi-instance requires `@socket.io/redis-adapter`), (b) `NotificationsModule` notification queue volume exceeds synchronous in-process handling, (c) rate-limit store needs to be shared across replicas. At MVP, all three conditions are false (single instance, cohort-scale traffic). The upgrade path is: add a Railway Redis service, set `REDIS_URL` env var, swap `RealtimeGatewayModule`'s adapter and `NotificationsModule`'s dispatch strategy. No schema changes, no API changes.

**PWA / service worker.** The Vite SPA is a PWA (installable web app — feature 4). The service worker is registered by the `web` app. Railway's static serving does not interfere with service worker registration as long as `Service-Worker-Allowed` response header is set correctly for the scope. The `web` service must serve `sw.js` with `Cache-Control: no-cache` (service worker files must not be cached by the browser). This is configured in the Vite PWA plugin or the Express static wrapper — not a Railway-level concern.

**GitHub Actions: pnpm caching.** `actions/setup-node@v4` with `cache: pnpm` caches the pnpm store keyed on `pnpm-lock.yaml`. This is the most effective single cache for a pnpm monorepo — typical install time drops from ~60s to ~10s on cache hit. No additional caching layer is needed at self-use-mvp CI volume.

---

## Risk / open items

| ID | Item | Severity | Resolution path |
|----|------|----------|-----------------|
| R-1 | **PR preview environments share production Postgres.** At founder-only self-use-mvp this is acceptable (no other users' data at risk). Before onboarding real cohort members, PR previews must point at a seeded test database (a second Railway Postgres plugin scoped to the preview services, seeded from `pnpm db:seed:test`). If previews write to prod Postgres and a migration runs on a preview deploy, it may break production. | Medium (before cohort onboarding) | Add a `preview` Railway environment with its own Postgres plugin. Gate at the cohort-onboarding milestone. |
| R-2 | **WebSocket (Socket.IO) sticky sessions.** Railway's HTTP load balancer does not guarantee sticky sessions by default. With a single `api` replica (MVP), this is a non-issue — every connection lands on the same process. If a second replica is added (H2 scaling), WebSocket connections from the same client may hit different replicas, breaking presence and message delivery. The fix is `@socket.io/redis-adapter` (already flagged as the Redis upgrade path). | Low (MVP) / High (multi-replica) | Do not add a second `api` replica until the Redis adapter is in place. Railway does support sticky sessions via the `X-Railway-Request-ID` header configuration — document as an interim option if Redis is delayed. |
| R-3 | **WebRTC (LiveKit) UDP port exposure on Railway.** LiveKit's SFU requires UDP ports for WebRTC media (typically 7882 UDP or a range). Railway's TCP-based reverse proxy does not natively proxy UDP. Self-hosted LiveKit on Railway works for the signaling path (WebSocket over HTTPS) but WebRTC media streams may not traverse Railway's network correctly without explicit UDP port configuration or a TURN server. This is the primary operational risk of the self-host path. | High (if self-hosting LiveKit) | Validate UDP connectivity during the LiveKit SDK branch. If Railway cannot expose the required UDP ports, switch to LiveKit Cloud (env var change only) or deploy LiveKit on a separate VPS with correct UDP forwarding. LiveKit Cloud removes this risk entirely at the cost of per-minute billing. |
| R-4 | **LiveKit self-host vs cloud decision not yet confirmed.** The v6 SDK branch must confirm this before the voice rooms milestone. Self-host adds Railway service management + TURN server concern (R-3); LiveKit Cloud is operationally simpler but adds variable cost. | Medium | V6 SDK branch: benchmark Railway self-host UDP feasibility + cost vs LiveKit Cloud free tier for a 5-person room. Record decision in `command-center/product/product-decisions.md`. |
| R-5 | **Connection limit on Railway starter plan.** Railway's starter plan imposes connection and bandwidth limits. Socket.IO maintains a persistent connection per connected browser tab. At cohort scale (< 30 concurrent users) this is within limits. Monitoring: watch Railway metrics for `active connections` on the `api` service. | Low (MVP) | No action needed at MVP. If the cohort grows beyond starter plan limits, upgrade the Railway plan or add connection pooling (PgBouncer for Postgres, ws-level batching for Socket.IO). |
| R-6 | **No structured alerting at MVP.** Railway metrics and Sentry surface errors reactively. There is no proactive alert (e.g. PagerDuty, OpsGenie, or even a Slack webhook) for service crashes or Sentry error spikes. At self-use-mvp this is acceptable — the founder is the only user and will notice a crash. | Low (MVP) | Add a Railway deploy webhook → Slack or a Sentry alert rule before cohort onboarding. One webhook, no third-party cost. |
| R-7 | **`VITE_` env vars are baked into the build artifact.** If `VITE_API_URL` changes (e.g. Railway rotates the service URL), the `web` service must be rebuilt and redeployed — the value is embedded in the JS bundle, not resolved at runtime. | Low | Stable Railway service URLs (custom domains) avoid this. Set a custom domain on the `api` service before the first cohort deploy so `VITE_API_URL` does not change with Railway's auto-generated URL. |
| R-8 | **Sentry source maps expose server-side code paths if uploaded incorrectly.** NestJS source maps must only be uploaded to Sentry — not served as static files by the `api` service. `sentry-cli` uploads them to Sentry's artifact endpoint; the `api` service's Railway config must not serve the `dist/*.map` files publicly. | Medium | In `nest-cli.json`, set `"sourceMap": true` only for the Sentry upload step. Confirm Railway is not statically serving `.map` files from the `api` dist. |
