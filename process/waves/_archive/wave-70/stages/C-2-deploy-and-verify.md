# C-2 — Deploy & verify (wave-70, M14 user-to-user Block)

Merge SHA deployed: **`a2c006abf43437efe957a3395e43f9a47461fed1`** (PR #86 squash-merge).
Railway project `ae55c191-4631-4224-b7b2-42f329ed48d7`, env production `bfdcc42f-fe5b-4198-a47a-b08f5940975d`. GraphQL only (`Project-Access-Token` header). Deploy is NOT git-triggered — each service explicitly deployed via `serviceInstanceDeploy(serviceId, environmentId, commitSha=mergeSHA)`.

## Action 0 — credential
Project-scoped Railway token present + usable (deploy-scoped `project{ services }` probe returned data, no errors). Provisioning not needed — services already exist: api, web, supertokens, Postgres.

## Migration applied BEFORE api code served (ordering enforced)
The api start command is bare `node dist/src/main.js` (no auto-migrate on boot), so migration MUST land before the new revision serves.
- Prod app-DB public proxy: `yamanote.proxy.rlwy.net:40008` (Postgres service `DATABASE_PUBLIC_URL`; NOT `postgres.railway.internal`).
- Pre-migrate state: `to_regclass('public.user_blocks')` → NULL (did not exist). Drizzle head applied `created_at`=1783380521830 == 0025 journal `when`. Only 0026 pending.
- `cd apps/api && DATABASE_URL='<public-proxy>' pnpm db:migrate` (drizzle-kit migrate) → `migrations applied successfully!`.
- **Post-migrate physical verification (CI-PRINCIPLES rule 9 — never trust the ledger row alone):**
  - `to_regclass('public.user_blocks')` → `user_blocks` (table physically exists).
  - Index present: `user_blocks_blocker_idx` (+ `user_blocks_blocker_blocked_uniq`, `user_blocks_pkey`).
  - Constraints present: 2 FKs (`user_blocks_blocker_id_users_id_fk`, `user_blocks_blocked_id_users_id_fk`, contype `f`), UNIQUE (`user_blocks_blocker_blocked_uniq`, contype `u`), PK (contype `p`).
  - Drizzle head `created_at` now = 1783391709430 == 0026 journal `when`. Exactly one migration applied; nothing beyond 0026.

## Deploy — api first, then web (both at merge SHA)
Verified via the authoritative Railway deployment-state endpoint (`deployments(first:1)` `.node.status == SUCCESS`), NOT /health alone (CI-PRINCIPLES rule 1).

| Service | serviceId | deployment id | status | deployed commit | prior commit |
|---|---|---|---|---|---|
| api | 7358a103-0a4f-44e6-9468-3d02d045531e | 203594a5-1715-4ff3-890b-a358bb1cf681 | SUCCESS | a2c006abf434… | 5fdd2bbd (replaced) |
| web | 107d4255-422a-4b72-b138-0647f9192fe4 | 2354bada-b34f-45b0-ae27-4cfa1975a1a8 | SUCCESS | a2c006abf434… | — |

Both `.meta.commit` == merge SHA `a2c006abf43437efe957a3395e43f9a47461fed1` — new revision is the one serving (no stale-revision race). api deployed first (web depends on it); each polled to terminal SUCCESS before proceeding.

## Verification (new-revision + migration-applied traps both closed)
- api `GET /health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- api `POST /blocks` (unauthenticated) → **401** `{"message":"unauthorised"}` — CI-PRINCIPLES rule 2 (new-route flip). 401 proves: (a) route EXISTS on the new revision (404 would mean stale revision serving); (b) AuthGuard fired before DB access (500 would mean missing `user_blocks` table / migration skipped). Both traps closed.
- web `GET /` → **200**.

## Canary
Pre-launch: real-user traffic below the 1000-DAU `canary_threshold_dau`. `canary_status: skipped` — synthetic verification above is the post-deploy signal; M14 remains the public-launch gate (founder-reserved). No rollback triggered — no canary window opened.

## Rollback path (identified, reachable — not exercised)
Previous good api revision = commit `5fdd2bbd` (deployment `2522c446-205b-4220-9278-faa11b06a31d`). Reachable in one action via `serviceInstanceDeploy(apiServiceId, env, "5fdd2bbd…")` or `deploymentRollback`/`serviceInstanceRedeploy` on that deployment id. Not needed — deploy verified healthy.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "migration 0026 applied before api served; to_regclass('public.user_blocks') non-null + user_blocks_blocker_idx present + 2 FKs + UNIQUE + PK (physical verify, not ledger)"
  - "railway api: deployment 203594a5-1715-4ff3-890b-a358bb1cf681 status=SUCCESS commit=a2c006abf43437efe957a3395e43f9a47461fed1"
  - "railway web: deployment 2354bada-b34f-45b0-ae27-4cfa1975a1a8 status=SUCCESS commit=a2c006abf43437efe957a3395e43f9a47461fed1"
  - "api /health: 200 {status:ok}"
  - "api POST /blocks unauth: 401 (new route + AuthGuard on new revision; not 404 stale, not 500 missing-table)"
  - "web /: 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: a2c006abf43437efe957a3395e43f9a47461fed1, deployment_id: 203594a5-1715-4ff3-890b-a358bb1cf681, verified_at: "2026-07-07T03:xx:xxZ", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: a2c006abf43437efe957a3395e43f9a47461fed1, deployment_id: 2354bada-b34f-45b0-ae27-4cfa1975a1a8, verified_at: "2026-07-07T03:xx:xxZ", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (pre-launch < 1000); T-block synthetic probes are the post-deploy signal. M14 is the founder-reserved public-launch gate."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
migration_applied: "0026_quick_thunderbird (user_blocks + 2 FKs + UNIQUE + blocker_idx) — applied to prod before api deploy; table+index physically verified"
rollback_target: "api commit 5fdd2bbd (deployment 2522c446-205b-4220-9278-faa11b06a31d) — one-action reachable, not exercised"
note: "Inline-poll deploys (api ~81s, web ~81s) both landed SUCCESS well within the 10-min window; no MONITOR-task promotion needed. Migration applied first, ordering enforced."
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: "Migration 0026 applied to prod BEFORE the no-auto-migrate api revision served, and the new table+index+FKs+UNIQUE were physically verified (not ledger-trusted). Both api and web deployed explicitly at the merge SHA and reached authoritative deployment-state SUCCESS on that exact commit (no stale-revision race). Verification read the Railway deployment-state endpoint, not /health alone; the POST /blocks 401 flip closes both the stale-revision (404) and migration-skipped (500) traps. Env scoping intact (api holds DB creds via existing service scope; web unchanged). Canary correctly skipped below the DAU threshold with reasoning recorded, and a one-action rollback target to the previous good api revision was identified and confirmed reachable before cutover."
  next_action: PROCEED_TO_T-block
```
