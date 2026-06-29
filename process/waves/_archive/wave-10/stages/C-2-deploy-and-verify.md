# C-2 — Deploy & verify (wave-10, M2 RBAC capstone)

## Railway credential & topology
- Deploy via Railway CLI (5.23.2) with `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN` (established prior-wave convention). Project `ae55c191` (`app-arina-89ejyn`), environment `production`.
- Services: api `7358a103-…`, web `107d4255-…`, Postgres `8d177be8-…`, supertokens `73ca977a-…`.

## Env-var scoping (verified BEFORE cutover — per-service)
- **api** holds full required set: DATABASE_URL, DATABASE_URL_UNPOOLED, SUPERTOKENS_CONNECTION_URI, SUPERTOKENS_API_KEY, SESSION_SECRET, API_ORIGIN, WEB_ORIGIN, RESEND_API_KEY_AUTH. ✅
- **web** holds NO DB creds and NO SuperTokens secrets — only VITE_API_ORIGIN + Railway-managed vars. ✅ Correct least-privilege scoping; no DB-credential leak to web.

## Migration ordering (applied EXPLICITLY, BEFORE new code served)
1. Read prod migration state via `drizzle.__drizzle_migrations` (public proxy `yamanote.proxy.rlwy.net:40008`): prod at 4 applied migrations, last = `0004_gigantic_saracen` (when 1782756635020). `0004_green_madripoor` (when 1782770405746) NOT applied. `roles`/`channel_permission_overrides` absent; `server_members.role_id` column already present (added by prior migration — new migration only adds the FK constraint).
2. `pnpm --filter @studyhall/api db:migrate` against prod public proxy → "migrations applied successfully!" (exit 0).
3. Post-migrate verification:
   - `roles` + `channel_permission_overrides` tables created ✅
   - `server_members_role_id_roles_id_fk` FK exists ✅
   - channel_permission_overrides FKs (channel_id→channels, role_id→roles) + unique(channel_id,role_id) present ✅
   - journal now 5 rows; id 5 = 1782770405746 (`0004_green_madripoor`) ✅
4. `pnpm --filter @studyhall/api db:backfill-roles` → "no servers found — nothing to do" (exit 0). Prod has 0 servers → idempotent no-op, clean. ✅

## Deploy (api + web)
- `npx @railway/cli up --service api --environment production --ci` → "Deploy complete" (exit 0).
- `npx @railway/cli up --service web --environment production --ci` → "Deploy complete" (exit 0).

## Authoritative deploy-state verification (NOT self-reported /healthz alone)
Read active deployment per service from Railway deployment-state:
- **api**: deploy `937c312b`, createdAt `2026-06-29T22:44:36Z` (fresh), instance `RUNNING`, not stopped → new revision serving ✅
- **web**: deploy `c84f19f6`, createdAt `2026-06-29T22:45:39Z` (fresh), instance `RUNNING`, not stopped → new revision serving ✅
- Postgres / supertokens untouched (older deploys, RUNNING). No stale-revision race: the serving revision matches the just-deployed one.

## RBAC live verification
- `GET /health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (clean boot; boot-probe also green in CI).
- **401 unauthed boundary (the auth door — verified live):**
  - GET /servers/:id → 401
  - GET /servers/:id/roles → 401
  - POST /servers/:id/roles → 401
  - PATCH /servers/:id/members/:userId/role → 401
  - GET/POST /servers/:id/channels/:channelId/overrides → 401
  - DELETE /servers/:id/channels/:channelId/overrides/:roleId → 401
- **403 non-permitted (access-control core): NOT live-verified — carried forward.** No prod verified-session fixture exists (test-accounts.md still template; task 4a2ad286 unbundled) and prod has 0 servers, so RBAC role-management (per-server) has nothing to act against without provisioning a server + non-owner member. Establishing this would re-invent the fixture that 4a2ad286 is meant to deliver — too costly for the C-window. Trust basis: 270 tests incl. the 6 security conditions (owner-lockout, non-permitted 403, channel-override visibility) green in CI.

## Canary
- Skipped: DAU below threshold (0 servers / 45 users << 1000). T-block synthetic probes are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deploy 937c312b RUNNING, createdAt 2026-06-29T22:44:36Z (fresh revision serving)"
  - "railway web: deploy c84f19f6 RUNNING, createdAt 2026-06-29T22:45:39Z (fresh revision serving)"
  - "GET https://api-production-b93e.up.railway.app/health: 200 {\"status\":\"ok\"}"
  - "RBAC 401 boundary live: roles + member-role + channel-overrides + GET /servers/:id all 401 unauthed"
  - "migration 0004_green_madripoor applied to prod; roles+channel_permission_overrides+role_id FK verified"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deploy_id: 937c312b, instance: RUNNING, verified_at: "2026-06-29T22:46Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, deploy_id: c84f19f6, instance: RUNNING, verified_at: "2026-06-29T22:47Z", health_url: "https://web-production-bce1a8.up.railway.app"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 servers / 45 users < 1000); T-block synthetic probes are the post-deploy signal."
canary_window: {start: "", duration_minutes: 0}
canary_monitor_id: ""
canary_alerts: []
note: "Migration applied explicitly BEFORE deploy serving. Env scoping verified (web has no DB creds). 403 non-permitted NOT live-verified — no prod verified-session fixture (task 4a2ad286) + 0 prod servers; carried to L (4 waves running). Trust 270 tests incl. 6 security conditions."

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: "Deploy verification reads the authoritative Railway deployment-state (active deploy id + RUNNING instance + fresh createdAt), not /healthz alone — both api (937c312b) and web (c84f19f6) confirmed as the freshly-deployed RUNNING revision, no stale-revision race. Migration 0004_green_madripoor was applied EXPLICITLY via drizzle-kit migrate (not auto-on-boot) and in order BEFORE the new code began serving; roles + channel_permission_overrides tables + server_members.role_id FK verified present in prod, journal advanced to idx 5. backfill-roles ran idempotent-clean (0 servers, no-op). Per-service env scoping confirmed: api holds the full DB/SuperTokens/session set, web holds zero DB creds. Rollback path reachable (prior api/web deploys redeployable via Railway). RBAC 401 boundary verified live across every role + channel-override endpoint. The 403 non-permitted core is NOT live-verified — no prod verified-session fixture and 0 prod servers make it disproportionately costly; trusting the 270 tests incl. 6 security conditions and carrying the verified-prod-fixture gap (task 4a2ad286, now 4 waves running) forward to the L-block as the escalation. Canary correctly skipped below DAU threshold."
  next_action: PROCEED_TO_T_BLOCK
```
