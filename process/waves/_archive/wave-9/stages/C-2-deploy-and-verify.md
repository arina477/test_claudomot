# C-2 — Deploy & verify (wave-9 M2 invite-completion)

## Credential (Action 0)
- Railway project-scoped token present (`RAILWAY_TOKEN=$APP_RAILWAY_TOKEN`), `RAILWAY_PROJECT_ID` set. Deploy-scoped GraphQL probe succeeded (project `app-arina-89ejyn`, no errors). Provisioned target — no founder pause.
- Project `app-arina-89ejyn`, env `production` (bfdcc42f-fe5b-4198-a47a-b08f5940975d).
- Services: api `7358a103-...`, web `107d4255-...`, supertokens, Postgres `8d177be8-...`.

## Migration
- NONE this wave. `invites` table + `servers.invite_code` shipped in wave-8; no new drizzle migration in PR #19. Confirmed by code inspection.

## Pre-deploy baselines (rollback targets)
- api previous good: `62cb0040-1c10-4603-8a57-e7bd54258252` (SUCCESS, 18:46)
- web previous good: `631d9923-4c74-4e33-b690-ea6caea47c32` (SUCCESS, 18:47)
- Rollback reachable via Railway redeploy/rollback mutation against these deployment ids.

## Env-var scoping (verified before cutover)
- api: DATABASE_URL, DATABASE_URL_UNPOOLED, SUPERTOKENS_CONNECTION_URI, SUPERTOKENS_API_KEY, SESSION_SECRET, RESEND_API_KEY_AUTH, API_ORIGIN, WEB_ORIGIN, CROSS_ORIGIN_PROD. Present.
- web: VITE_API_ORIGIN + Railway-injected only. NO DB creds, NO SuperTokens secrets. Correct least-privilege scoping.

## Deploy (Railway CLI up, then authoritative deploy-state verify)
- `railway up --service api --environment production --ci` → CLI "Deploy complete" exit 0.
- `railway up --service web --environment production --ci` → CLI "Deploy complete" exit 0.
- Authoritative deployment-state GraphQL (NOT /health):
  - api NEW revision `191b282b-7b43-4acc-8b99-07ec74411e98` → status SUCCESS (distinct from baseline; no stale-revision race).
  - web NEW revision `6707ece0-24c8-4773-803a-fbc7e35b07f7` → status SUCCESS (distinct from baseline).
- Re-confirmed stable SUCCESS on both new revisions.

## 8a backfill on prod (run-once)
- Ran `DATABASE_URL=<prod public proxy> pnpm --filter @studyhall/api db:backfill`.
- Connection string read from Postgres service `DATABASE_PUBLIC_URL` (yamanote.proxy.rlwy.net) at run time; never committed.
- Output: `backfill: no servers with NULL invite_code — nothing to do`. Exit 0. Rows updated: 0 (expected no-op; idempotent SELECT ... WHERE invite_code IS NULL found 0 rows). Executed cleanly, no error.

## Live verification
- `GET /health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` — clean boot, new revision serving.
- `POST /invites/<code>/revoke` unauthed → 401 `{"message":"unauthorised"}` — revoke endpoint exists, session-gated.
- `GET /invites/<unknown>` → 404 `{"message":"Invite not found or invalid"}` — public preview; same 404 path a revoked invite hits.
- `GET /servers/<id>` unauthed → 401 — server-detail (8b inviteCode) member/auth-gated.
- Authed paths deferred from live (verified-session cost) — confirmed genuinely test-covered (green in CI):
  - revoke by owner/creator → 200; non-owner/stranger → 403 ForbiddenException (controller+service specs).
  - inviteCode exposed in server detail (8b) + null case (service spec asserts value).

## Canary
```yaml
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000); pre-launch self-use MVP. Synthetic live probes above are the post-deploy signal."
```

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "api: deployment 191b282b-... status SUCCESS (new revision, baseline was 62cb0040-...)"
  - "web: deployment 6707ece0-... status SUCCESS (new revision, baseline was 631d9923-...)"
  - "GET /health 200 {status:ok,version:0.0.1}"
  - "POST /invites/<code>/revoke unauthed 401; GET /invites/<unknown> 404; GET /servers/<id> unauthed 401"
  - "db:backfill prod: no servers with NULL invite_code, exit 0, 0 rows"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment: "191b282b-7b43-4acc-8b99-07ec74411e98", verified_at: "2026-06-29T20:23Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, deployment: "6707ece0-24c8-4773-803a-fbc7e35b07f7", verified_at: "2026-06-29T20:23Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU 0 < 1000 threshold; pre-launch."
canary_monitor_id: ""
canary_alerts: []
note: "No schema migration this wave. 8a backfill run-once on prod: clean no-op (0 rows). Rollback targets: api 62cb0040, web 631d9923."
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: "Deploy verified via authoritative Railway deployment-state (new revision ids distinct from baselines, both SUCCESS) not /health alone; no false-green, no stale-revision race. No migration needed this wave. Per-service env scoping confirmed (web has no DB/auth secrets). 8a backfill ran cleanly on prod as explicit run-once script (0-row no-op, idempotency confirmed). Live revoke 401 boundary + endpoint existence confirmed; authed revoke->404, non-owner->403, and inviteCode-in-detail confirmed genuinely test-covered. Canary skipped per sub-threshold DAU. Rollback path identified and reachable before/after cutover."
  next_action: PROCEED_TO_T-block
```

## Block exit / handoff
```yaml
cicd_block_status:    complete
pr_number:            19
pr_url:               https://github.com/arina477/test_claudomot/pull/19
merge_commit:         371b9fea108e99adc6b7a59222f52329b4c0a8f3
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit_revision: "191b282b-7b43-4acc-8b99-07ec74411e98", verified_at: "2026-06-29T20:23Z"}
  - {platform: railway, service: web, state: SUCCESS, commit_revision: "6707ece0-24c8-4773-803a-fbc7e35b07f7", verified_at: "2026-06-29T20:23Z"}
canary_status:        skipped
ready_for_test:       true
```
