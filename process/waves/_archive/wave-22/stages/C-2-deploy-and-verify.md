# C-2 — Deploy & verify (wave-22 M5 assignments)

**Head:** head-ci-cd · **Platform:** Railway (project `app-arina-89ejyn` / `ae55c191`, env `production` / `bfdcc42f`) · **Mode:** automatic.

## Action 0 — Railway credential
- `RAILWAY_TOKEN` (from `APP_RAILWAY_TOKEN`) present and usable. Deploy-scoped probe (`projectToken`, `project(id:){services}`) returned without `errors` — token reached the project's deploy API. No founder pause.

## Service IDs
| Service | ID |
|---|---|
| web | `107d4255-422a-4b72-b138-0647f9192fe4` |
| api | `7358a103-0a4f-44e6-9468-3d02d045531e` |
| supertokens | `73ca977a-912b-4cba-af46-39cd4cf3d328` |
| Postgres | `8d177be8-d8d9-4db6-901f-e7ab5ddd3404` |

## Baselines captured BEFORE deploy (distinct-revision guard)
- **API baseline:** `d26fe078-270b-45ae-877a-6fb5cc8f822f` (SUCCESS, 2026-06-30T19:48:52Z)
- **WEB baseline:** `032dc384-3304-4dd0-bb5a-863018540503` (SUCCESS, 2026-06-30T21:09:45Z)

## Env-var scoping (names only; values never read/logged) — scoped-secret guard PASS
- **api** has: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SUPERTOKENS_API_KEY`, `SUPERTOKENS_CONNECTION_URI`, `SESSION_SECRET`, `API_ORIGIN`, `WEB_ORIGIN`, `CROSS_ORIGIN_PROD`, `RESEND_API_KEY_AUTH`. All required api env present.
- **web** has: `VITE_API_ORIGIN` + Railway-injected vars only. **No `DATABASE_URL`, no SuperTokens secrets, no `SESSION_SECRET`.** Web does NOT receive DB creds — scoped-secret-leak guard passes.

## Migration 0010 — applied EXPLICITLY before api cutover (drizzle ledger 10→11)
- Pre-migration: assignment tables ABSENT; `drizzle.__drizzle_migrations` count = 10.
- Applied via `drizzle-kit migrate` (`pnpm db:migrate`) against the prod Postgres public proxy (`DATABASE_PUBLIC_URL`) — "migrations applied successfully!"
- Post-migration verification by direct query:
  - 3 tables present: `assignments`, `assignment_status`, `assignment_attachments`.
  - 5 FKs: attachments→assignments, status→assignments, status→users, assignments→users(organizer), assignments→servers.
  - UNIQUE constraint `assignment_status_assignment_user` on `(assignment_id, user_id)`.
  - `drizzle.__drizzle_migrations` count = **11** (ledger advanced 10→11).
- Migration ran BEFORE the new api revision began serving (api deploy step below followed migration).

## Deploy — both services (Railway source-upload CLI)
- `npx @railway/cli@latest up --service api --environment production --ci` → image pushed, "Deploy complete", exit 0.
- `npx @railway/cli@latest up --service web --environment production --ci` → image pushed, "Deploy complete", exit 0.

## Verification — authoritative deployment-state + distinct-revision + serving proof
- **API:** baseline `d26fe078` → new **`7ffaeaea-1c37-4f3b-a941-c5f1e32a8522`** `status: SUCCESS` (2026-06-30T23:11:20Z). Distinct revision ✓.
- **WEB:** baseline `032dc384` → new **`66f4c715-29f3-4584-9f70-ae561e53e3d9`** `status: SUCCESS` (2026-06-30T23:12:38Z). Distinct revision ✓.
- **api /health** → HTTP 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- **web root** → HTTP 200.
- **New-only route serving proof (CI-PRINCIPLES rule 2 — stale-revision-race guard):** `GET /servers/00000000-0000-0000-0000-000000000000/assignments` → **HTTP 401 `{"message":"unauthorised"}`** (NOT 404). Proves the new api revision (`7ffaeaea`, carrying AssignmentsModule routes) is the one serving traffic.
- **Control:** `GET /servers/<uuid>/this-route-does-not-exist-xyz` → HTTP 404. Confirms the 401 is route-specific (assignments handler exists + ran its auth guard), not a blanket auth wall — decisively rules out the old revision serving.

## Rollback path — identified + reachable BEFORE cutover
- api previous-good revision: `d26fe078-270b-45ae-877a-6fb5cc8f822f`; web: `032dc384-3304-4dd0-bb5a-863018540503`.
- One-action rollback: GraphQL `deploymentRedeploy(id:<prev-id>)` via `Project-Access-Token` header. Not exercised — deploy verified clean.

## Canary — SKIPPED (below traffic threshold)
- `canary_threshold_dau: 1000` (project.yaml); CI-PRINCIPLES `canary.enabled: false` (self-use-mvp). Real-user DAU = 0 < 1000.
- T-block synthetic probes are the post-deploy signal. No `/canary` monitor armed.

## Async-deploy path note
- Deploys resolved to SUCCESS within the inline verification window (single turn, well under the 10-min cap). No MONITOR-task spawned; no inline-poll promotion needed. Deployment-state was already terminal SUCCESS at first poll.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 7ffaeaea status SUCCESS, distinct from baseline d26fe078"
  - "railway web: deployment 66f4c715 status SUCCESS, distinct from baseline 032dc384"
  - "api /health: 200 {status:ok}; web root: 200"
  - "new-only route GET /servers/<uuid>/assignments: 401 (not 404) — new revision serves; control nonexistent route: 404"
  - "migration 0010 applied via drizzle-kit migrate; ledger 10->11; 3 tables + 5 FKs + UNIQUE(assignment_id,user_id) verified"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: 7ffaeaea-1c37-4f3b-a941-c5f1e32a8522, baseline_id: d26fe078-270b-45ae-877a-6fb5cc8f822f, health_url: "https://api-production-b93e.up.railway.app/health", verified_at: "2026-06-30T23:13Z"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: 66f4c715-29f3-4584-9f70-ae561e53e3d9, baseline_id: 032dc384-3304-4dd0-bb5a-863018540503, health_url: "https://web-production-bce1a8.up.railway.app/", verified_at: "2026-06-30T23:13Z"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000) and canary.enabled=false (self-use-mvp); T-block synthetic probes are the post-deploy signal."
canary_window: {start: "", duration_minutes: 0}
canary_monitor_id: ""
canary_alerts: []
note: "Migration 0010 applied explicitly before api cutover; both services SUCCESS with distinct new revisions; assignments route proven serving (401 not 404); rollback targets captured + reachable."
```
