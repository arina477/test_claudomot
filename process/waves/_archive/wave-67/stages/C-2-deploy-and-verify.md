# C-2 — Deploy & verify (wave-67, M11 server discovery)

## Scope

Wave-67 changed BOTH `apps/api` AND `apps/web`, and carries migration **0024_cold_baron_zemo.sql** (`ALTER TABLE servers ADD is_public/description/topic` + `servers_is_public_idx`). Both Railway services deployed at the merge SHA; migration sequenced explicitly ahead of the new api serving traffic.

Railway project `ae55c191` / env `production` (`bfdcc42f`). GraphQL-only (`Project-Access-Token` header). No Railway CLI.

## Migration sequencing (the critical part)

**Investigation — how prior migrations applied:**
- api Dockerfile CMD = `node apps/api/dist/src/main.js` — NO migrate step, no auto-migrate on boot.
- No `railway.toml` / `nixpacks` config in repo.
- api service instance `preDeployCommand: null` and `startCommand: null` (queried via GraphQL `serviceInstance`). **No release/pre-deploy migrate command exists** — prior 24 migrations were applied manually against the prod DB.

**Conclusion:** migration 0024 had to be applied by hand, and it had to be live BEFORE the new api code served `/servers/discover` (else 500 on missing columns).

**Apply method — manual `drizzle-kit migrate` via the public proxy:**
- api `DATABASE_URL` / `DATABASE_URL_UNPOOLED` both point to `postgres.railway.internal:5432` (private, unreachable from here).
- The Postgres service (`8d177be8`) exposes `DATABASE_PUBLIC_URL` via TCP proxy `yamanote.proxy.rlwy.net:40008` — reachable. Credential kept in-process, never logged/committed.
- Ran `cd apps/api && DATABASE_URL_UNPOOLED=<public> npm run db:migrate` (drizzle-kit migrate, idempotent). Exit 0 — "migrations applied successfully".
- Migration is an **expand** (adds columns/index only; `is_public` defaulted, `description`/`topic` nullable) — non-breaking against the old running code, so safe to apply before cutover.

**Verification (information_schema on prod DB):**
- `is_public boolean nullable=NO` ✓ · `description text nullable=YES` ✓ · `topic text nullable=YES` ✓
- Index `servers_is_public_idx` present ✓

**Sequence honored:** migration applied + verified → THEN api deploy triggered → api serves post-migration.

## Deploy — stale-revision race caught and corrected

**First attempt (WRONG):** `serviceInstanceDeploy(serviceId, environmentId)` with no `commitSha`/`latestCommit` re-deployed each service's PINNED last commit, NOT main HEAD:
- api built `e0e842e` (wave-61 #76) — would have REGRESSED api by 6 waves.
- web built `d094f9c` (#81).
- Neither matched the merge SHA `43d20b2` (confirmed remote main HEAD).

**Correction:** cancelled both stale builds (`deploymentCancel` on `42bdbce7` api, `a9be6ca2` web), then re-triggered with explicit `commitSha: 43d20b293c43eb920dbcbe04c1d3b6a074ad487b`. Both new deployments confirmed building the correct commit (verified via deployment `meta.commitHash` + `commitMessage` = "#82 server discovery").

**Authoritative deploy-state (Railway `deployments` endpoint, not /healthz):**
- api deployment `65398968-1a90-463e-a58a-d5570ea7a776` → **SUCCESS** @ `43d20b2`
- web deployment `a6c1cb71-ea07-409a-a7ef-61836a19aa6f` → **SUCCESS** @ `43d20b2`
- Inline poll to terminal: ~120s.

## Health + functional verification

| Probe | Result | Meaning |
|---|---|---|
| web `/` | HTTP 200 | serving |
| web `/health` | HTTP 200 | healthy |
| api `/health` | HTTP 200 | healthy |
| api `GET /servers/discover` | **HTTP 401** `{"message":"unauthorised"}` | route mounted, auth guard fires, query did NOT 500 on missing columns |

The 401 (not 500, not 404) is the load-bearing signal: **not 500** ⇒ migration 0024 columns are live; **not 404** ⇒ the new wave-67 revision is serving (old wave-61 api had no `/servers/discover` route). This is the stale-revision guard AND the migration guard in one probe.

## Env-var scope (confirmed correct)

- api service holds `DATABASE_URL`, `SUPERTOKENS_*`, `LIVEKIT_*` — correct.
- web service is separate; no DB creds required for its serve path. No scoped-secret leak.

## Rollback path (reachable, pre-identified)

Previous good api revision `e0e842e` (wave-61) and web `d094f9c` remain redeployable in one action via `deploymentRedeploy(id)` / `deploymentRollback(id)`. Note: an api rollback to e0e842e would run against the now-migrated schema — the expand migration is backward-compatible (old code ignores the new columns), so rollback is safe.

## Canary

Skipped — StudyHall real-user traffic is below the `canary_threshold_dau: 1000`. T-block synthetic probes are the post-deploy signal.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 65398968 status SUCCESS, commit 43d20b2 (deployments GraphQL endpoint)"
  - "railway web: deployment a6c1cb71 status SUCCESS, commit 43d20b2 (deployments GraphQL endpoint)"
  - "migration 0024 applied via drizzle-kit migrate (exit 0); information_schema confirms is_public/description/topic + servers_is_public_idx"
  - "web / 200, web /health 200, api /health 200"
  - "api GET /servers/discover -> 401 (route mounted, no 500 on missing columns = migration live + new revision serving)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 43d20b293c43eb920dbcbe04c1d3b6a074ad487b, deployment_id: 65398968-1a90-463e-a58a-d5570ea7a776, health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: 43d20b293c43eb920dbcbe04c1d3b6a074ad487b, deployment_id: a6c1cb71-ea07-409a-a7ef-61836a19aa6f, health_url: "https://web-production-bce1a8.up.railway.app/health"}
async_monitor_id: ""
migration:
  file: 0024_cold_baron_zemo.sql
  apply_method: "manual drizzle-kit migrate via DATABASE_PUBLIC_URL proxy (no pre-deploy/release command exists on the api service)"
  sequenced: "applied + verified BEFORE api deploy triggered"
  verified: true
canary_status: skipped
canary_skip_reason: "DAU below threshold (<1000); T-block synthetic probes are the post-deploy signal."
rollback:
  api_prev_good: e0e842e (wave-61)
  web_prev_good: d094f9c
  mechanism: "deploymentRedeploy(id) / deploymentRollback(id) — one action, reachable"
note: >
  First serviceInstanceDeploy without commitSha redeployed pinned stale commits (api e0e842e wave-61,
  web d094f9c) — cancelled both and re-triggered with explicit commitSha=43d20b2. Stale-revision race
  caught before any old code served traffic.

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Deploy verified via Railway's authoritative deployment-state endpoint (SUCCESS at the exact merge
    SHA for both services), NOT a self-reported /healthz. The stale-revision race was caught: the first
    serviceInstanceDeploy redeployed each service's pinned commit (api would have regressed to wave-61);
    both were cancelled and re-fired with an explicit commitSha, then re-confirmed against meta.commitHash.
    Migration 0024 was applied explicitly and in order (no pre-deploy/release command exists) and confirmed
    live via information_schema BEFORE the new api served traffic; the api /servers/discover 401 (not 500,
    not 404) proves both the migration is live and the new revision is the one serving. Env vars are scoped
    correctly (api has DB/SuperTokens/LiveKit; web has no DB creds). A one-action rollback to the previous
    good revision is identified and reachable. Canary correctly skipped below the 1000-DAU threshold.
  next_action: PROCEED_TO_T-block
```

## Block exit / handoff

```yaml
cicd_block_status:    complete
pr_number:            82
pr_url:               https://github.com/arina477/test_claudomot/pull/82
merge_commit:         43d20b293c43eb920dbcbe04c1d3b6a074ad487b
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 43d20b2, verified_at: "2026-07-06T18:30Z"}
  - {platform: railway, service: web, state: SUCCESS, commit: 43d20b2, verified_at: "2026-07-06T18:30Z"}
canary_status:        skipped
ready_for_test:       true
```
