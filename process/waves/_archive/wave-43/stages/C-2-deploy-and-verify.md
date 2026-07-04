# C-2 — Deploy & verify (wave-43: class scheduling)

Deploy the merged class-scheduling feature (PR #57, squash merge `7b0bc478`) LIVE across the
Railway api + web services, with migration 0020 applied to the production app DB first, then
authoritative deployment-state + live-artifact verification. Mode: automatic.

## Deploy model (corrected)

Railway is **git-connected** and driven over the **GraphQL API** at
`https://backboard.railway.com/graphql/v2` with the `Project-Access-Token` header (no Railway CLI,
no `railway up`, no `me{}`). Deploys were triggered with `serviceInstanceDeploy(serviceId,
environmentId, commitSha:"7b0bc478", latestCommit:true)` — **commitSha pinned explicitly** to
avoid the wave-41 stale-snapshot false-green.

- project `ae55c191-4631-4224-b7b2-42f329ed48d7` · environment production `bfdcc42f-fe5b-4198-a47a-b08f5940975d`
- api `7358a103-0a4f-44e6-9468-3d02d045531e` → https://api-production-b93e.up.railway.app
- web `107d4255-422a-4b72-b138-0647f9192fe4` → https://web-production-bce1a8.up.railway.app
- Postgres `8d177be8-d8d9-4db6-901f-e7ab5ddd3404`

## Step 1 — Migration 0020 applied to PROD app DB FIRST (before code cutover)

- Fetched `DATABASE_PUBLIC_URL` (host `yamanote.proxy.rlwy.net`, `*.proxy.rlwy.net` public TCP
  proxy) via the Railway GraphQL `variables` query on the Postgres service. Secret never printed
  or committed; used only in-process and the transient file removed after.
- Pre-migrate probe: `to_regclass('public.scheduled_sessions')` = **false** (pending); drizzle
  applied-migration count = **20**.
- Applied explicitly and in order via `DATABASE_URL="<public-url>" pnpm --filter @studyhall/api
  db:migrate` (drizzle-kit migrate — NOT auto-migrate-on-boot). Exit 0, "migrations applied
  successfully".
- Post-migrate confirmation: `scheduled_sessions` exists (**true**); applied count **21**; all 12
  columns present (id, server_id, organizer_id, title, description, starts_at, ends_at,
  recurrence, recurrence_until, is_deleted, created_at, updated_at) with FKs to servers + users
  and the `(server_id, starts_at)` index.

**Schema was live before the new revision began serving traffic — migration ordering correct.**

## Step 2 — api deploy (pinned commitSha 7b0bc478)

- Baseline (pre-deploy): api serving commit `07ebda95…` (deploy `035be230`) — NOT the merge commit.
- `serviceInstanceDeploy` → `{data.serviceInstanceDeploy: true}`.
- Inline-polled deployment-state (authoritative, not /healthz): BUILDING → DEPLOYING → **SUCCESS**
  in ~1 min. New deployment id **`8b7a22c4-7b03-40e6-9f30-8f3aa6602a4d`**, meta.commitHash
  `7b0bc478d8cd678e52be2f9b8358841c5cc0b877`. Served revision == deployed revision (no stale-race).

## Step 3 — web deploy (pinned commitSha 7b0bc478)

- Baseline (pre-deploy): web serving commit `07ebda95…`, bundle `index-BCqGLUBX.js`.
- `serviceInstanceDeploy` → `{data.serviceInstanceDeploy: true}`.
- Inline-polled deployment-state: BUILDING → **SUCCESS** in ~1 min. New deployment id
  **`97ff28cc-3d18-4b3e-8786-3d642c66f413`**, commit `7b0bc478…`.
- **Artifact-changed check:** served bundle hash `index-BCqGLUBX.js` → **`index-C8KFLd6n.js`**
  (changed — not a stale-serve).
- **Feature-present check:** served bundle (`/assets/index-C8KFLd6n.js`, 1.77 MB) contains
  scheduling UI strings — `scheduled-sessions` (5), `New session` (2), `Schedule` (11),
  `recurrence` (12), `organizer` (15). New bundle genuinely carries the feature.

## Step 4 — Live verification (authoritative)

| Probe | Expected | Observed |
|---|---|---|
| `GET api /health` | 200 | **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| `POST /servers/<uuid>/scheduled-sessions` unauth | 401 (was 404) | **401** |
| `GET /scheduled-sessions/<uuid>` unauth | 401 | **401** |
| `GET /servers/<uuid>/scheduled-sessions` unauth | 401 | **401** |
| `GET web /` | 200 + new bundle | **200**, `index-C8KFLd6n.js` |

The 3 scheduling routes returned **401 (guarded)**, not 404 — routes are registered AND the auth
guard is in the request path. This is the authoritative proof the new api revision is serving the
feature, not a cached old revision.

## Step 5 — Canary

Skipped. StudyHall is pre-validation (self-use MVP; real-user DAU effectively 0) — below the
`canary_threshold_dau: 1000` declared in `project.yaml`. Below threshold the synthetic probes above
are the post-deploy signal; T-block synthetic probes follow. No under-baked canary window declared.

## Rollback path (identified + reachable before/after cutover)

Previous good revisions are redeployable in one GraphQL action each via `serviceInstanceDeploy`
pinned to the prior commit `07ebda95…` (api deploy `035be230`, web deploy `ef4fc034`), or via
`deploymentRedeploy` on those deployment ids. Migration 0020 is additive (new table only, no
destructive change to existing tables), so a code rollback does not require a down-migration.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 8b7a22c4-7b03-40e6-9f30-8f3aa6602a4d status SUCCESS, commit 7b0bc478 (was 07ebda95)"
  - "railway web: deployment 97ff28cc-3d18-4b3e-8786-3d642c66f413 status SUCCESS, commit 7b0bc478 (was 07ebda95)"
  - "migration 0020_graceful_cerebro applied to prod DB (public proxy) — scheduled_sessions exists, applied count 20 -> 21"
  - "api /health: 200 {\"status\":\"ok\"}"
  - "api scheduling routes unauth: POST 401, GET(single) 401, GET(list) 401 (was 404 pre-deploy — registered + guarded)"
  - "web /: 200; served bundle index-BCqGLUBX.js -> index-C8KFLd6n.js (changed); bundle contains scheduled-sessions/New session/Schedule/recurrence/organizer"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: "8b7a22c4-7b03-40e6-9f30-8f3aa6602a4d", commit: "7b0bc478d8cd678e52be2f9b8358841c5cc0b877", health_url: "https://api-production-b93e.up.railway.app/health", verified_at: "2026-07-04T02:59:00Z"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: "97ff28cc-3d18-4b3e-8786-3d642c66f413", commit: "7b0bc478d8cd678e52be2f9b8358841c5cc0b877", served_bundle: "index-C8KFLd6n.js", root_url: "https://web-production-bce1a8.up.railway.app/", verified_at: "2026-07-04T02:59:30Z"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (~0 real users < 1000); pre-validation self-use MVP. Synthetic live probes above + T-block probes are the post-deploy signal."
canary_window:
  start: ""
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
migration_applied: "0020_graceful_cerebro (scheduled_sessions) — applied to prod app DB before code cutover; applied count 20 -> 21"
note: "Both api + web deployed pinned to commitSha 7b0bc478 (wave-41 stale-snapshot lesson applied). Verified via authoritative Railway deployment-state (SUCCESS) AND served-artifact change (api routes 404->401, web bundle hash changed + contains feature) — not /healthz alone. Migration applied explicitly via drizzle-kit migrate (not auto-on-boot), in order, before serving. Env-scoping confirmed: api holds DATABASE_URL/SUPERTOKENS_*/LIVEKIT_*; web holds no DB creds. Rollback to 07ebda95 reachable in one serviceInstanceDeploy action per service."
```
