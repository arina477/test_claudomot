# C-2 — Deploy & verify (wave-80, M13 leg-3b: presence privacy toggle)

**Mode:** automatic. head-ci-cd (agentId acd915aeab0b80ce2) owns the deploy-verification / rollback judgment; migration-ordering gate enforced. Merge SHA `4795638125301c0685864a3a5f58001373720059`.

## Action 0 — Railway credential
- `APP_RAILWAY_TOKEN` present. Deploy-scoped GraphQL probe (`project(id).services`) succeeded — token usable, `Project-Access-Token` header (never Bearer/me{}).
- Project `ae55c191-4631-4224-b7b2-42f329ed48d7` (app-arina-89ejyn), env production `bfdcc42f-fe5b-4198-a47a-b08f5940975d`. Services: web `107d4255…`, api `7358a103…`, Postgres `8d177be8…`, supertokens `73ca977a…`.

## STEP 1 — Migration 0033 applied FIRST (before api deploy)
Critical ordering: api starts as bare node with NO auto-migrate → migration is manual and MUST precede the api deploy (else new code queries a missing column → 500s). head-ci-cd flag: migration-before-deploy enforced.

- Fetched `DATABASE_PUBLIC_URL` from Postgres service via GraphQL `variables()` — validated scheme `postgres`, host `yamanote.proxy.rlwy.net:40008`. URL kept out of transcript (never echoed/committed).
- **Pre-state:** `information_schema.columns` count for `users.show_presence` = **0** (not yet applied).
- Applied: `DATABASE_URL="$DBPUB" pnpm --filter @studyhall/api db:migrate` (drizzle-kit migrate) → `migrations applied successfully!`, exit 0.
- **Post-verify (explicit information_schema check, not just exit code):**
  `SELECT column_name,data_type,is_nullable,column_default … WHERE column_name='show_presence'`
  → `show_presence | boolean | NO | true` — matches migration spec (`ADD COLUMN show_presence boolean DEFAULT true NOT NULL`).
- Additive + DEFAULT true = no backfill, forward/back compatible during deploy window. Rollback-safe (migration need not be reversed to roll code back).

## STEP 2 — Deploy merge commit to BOTH services
- Railway GraphQL `serviceInstanceDeploy(environmentId, serviceId, commitSha=4795638125301c0685864a3a5f58001373720059)` for api + web → both returned `true`.
- Inline-poll (≤10 min): both reached **SUCCESS** in ~82s. Deployment `meta.commitHash` = `479563812530…` for both (== merge SHA). No SHA drift, no split-brain.

| Service | Deploy state | Deployed commit | Public URL |
|---|---|---|---|
| api (7358a103) | SUCCESS | 4795638125301c… | api-production-b93e.up.railway.app |
| web (107d4255) | SUCCESS | 4795638125301c… | web-production-bce1a8.up.railway.app |

## STEP 3 — Verification probes (authoritative deploy state + behavioral)
- api `GET /health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`
- web `GET /` → **200**
- api `GET /profile/privacy` (unauth) → **401** `{"message":"unauthorised"}` (route serves on new revision)
- api `PUT /profile/privacy` (unauth) → **401** `{"message":"unauthorised"}`
- Both deployed commits == merge SHA (verified via deployment meta, not /health alone — anti-stale-race). head-ci-cd false-green / serving-revision-match criteria satisfied.

## Canary — SKIP
StudyHall pre-validation, real-user DAU < `canary_threshold_dau: 1000`. Synthetic probes (T-block) are the post-deploy signal.

## Verdict

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment SUCCESS, commit 4795638125301c0685864a3a5f58001373720059 (meta.commitHash)"
  - "railway web: deployment SUCCESS, commit 4795638125301c0685864a3a5f58001373720059 (meta.commitHash)"
  - "https://api-production-b93e.up.railway.app/health: 200 {\"status\":\"ok\"}"
  - "https://web-production-bce1a8.up.railway.app/: 200"
  - "GET/PUT /profile/privacy unauth: 401 unauthorised"
  - "migration 0033 applied to prod; users.show_presence boolean NOT NULL DEFAULT true verified via information_schema"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 4795638125301c0685864a3a5f58001373720059, verified_at: "2026-07-08T04:24Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: 4795638125301c0685864a3a5f58001373720059, verified_at: "2026-07-08T04:24Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (pre-validation, ~0 real users < 1000); T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "MIGRATION 0033 applied to prod BEFORE api deploy (bare-node, no auto-migrate); users.show_presence verified present. Deploy inline-polled to SUCCESS in ~82s, no async monitor needed."
```

## C-block exit / handoff

```yaml
cicd_block_status:    complete
pr_number:            99
pr_url:               https://github.com/arina477/test_claudomot/pull/99
merge_commit:         4795638125301c0685864a3a5f58001373720059
migration_applied:    "0033_wave80_users_show_presence.sql — users.show_presence boolean NOT NULL DEFAULT true (verified via information_schema)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 4795638125301c0685864a3a5f58001373720059, verified_at: "2026-07-08T04:24Z"}
  - {platform: railway, service: web, state: SUCCESS, commit: 4795638125301c0685864a3a5f58001373720059, verified_at: "2026-07-08T04:24Z"}
canary_status:        skipped
ready_for_test:       true
```

→ next block: T (Test) — `claudomat-brain/blocks/test/test.md`.
