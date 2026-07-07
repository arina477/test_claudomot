# Wave 72 — C-2 Deploy & verify

## Credential (Action 0)
- Railway project-scoped token present + usable (deploy-scoped GraphQL probe OK). Project `app-arina-89ejyn` (ae55c191…), env `production` (bfdcc42f…). Services: api (7358a103…), web (107d4255…), supertokens, Postgres. GraphQL only, `Project-Access-Token` header.

## Migration (head-ci-cd step a — before api deploy)
- Applied `0027_cold_mikhail_rasputin.sql` (`users.deleted_at` nullable timestamptz) to prod DB via `pnpm db:migrate` against the public proxy (yamanote.proxy.rlwy.net:40008). Verified: `deleted_at | timestamp with time zone | YES` present post-migrate (absent pre-migrate). Additive, no backfill.

## Deploy (steps b, c)
- Rollback baselines captured: api deployment `b74ab74b` / web `a9992ce6`, both commit 670c46e (wave-71). Prod is NOT git-auto-deploy — explicit trigger required.
- `serviceInstanceDeploy(environmentId, serviceId, commitSha=e5bfba1b73…)` for api AND web → both returned true. Polled: `BUILDING → DEPLOYING → SUCCESS`, both on **e5bfba1** (commit match — no stale-revision trap).

## Verify (steps d, e)
- api `GET /health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` — api booted healthy WITH the new signIn/getSession/refreshSession overrides (the auth-config-boot risk retired).
- web root → **200**.
- `POST /profile/delete` (unauth) → **401** (NOT 404) — the erasure route is MOUNTED + auth-guarded live.
- Deployed commit == merge commit e5bfba1 for both services (step e satisfied).

## Canary
- **Skipped** — StudyHall real-user traffic ~0 DAU < 1000 threshold. T-block synthetic probes are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: status SUCCESS, commit e5bfba1 (deployment on api-production-b93e.up.railway.app)"
  - "railway web: status SUCCESS, commit e5bfba1 (web-production-bce1a8.up.railway.app)"
  - "https://api-production-b93e.up.railway.app/health: 200 {status:ok}"
  - "https://web-production-bce1a8.up.railway.app/: 200"
  - "POST /profile/delete: 401 unauth (route mounted + guarded)"
  - "migration 0027 applied to prod: users.deleted_at present"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: e5bfba1, health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: e5bfba1, health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU ~0 < 1000 threshold; T-block synthetic probes are the post-deploy signal."
note: "migration-first ordering honored; both services deployed with explicit commitSha; rollback baselines api=b74ab74b web=a9992ce6 (670c46e)."
```
