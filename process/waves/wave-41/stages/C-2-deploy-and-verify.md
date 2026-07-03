# C-2 — Deploy & Verify (wave-41: educator role + moderation)

**Owner:** head-ci-cd
**Merge commit:** `5a5f79a` (on main; local HEAD `f2c334a` = C-1 merge containing it)
**Scope:** api + web + shared, migration 0018 (roles.moderate_members + server_members.muted_until)
**Deploy model:** Railway, CLI-push (NOT git-triggered) — services api/web have `source.repo=null` + `source.image=null`.

---

## Step 1 — Migration 0018: APPLIED ✅

- Public DB reachable via Postgres service `DATABASE_PUBLIC_URL` (`yamanote.proxy.rlwy.net:40008`). The api service exposes only the private `postgres.railway.internal` URL, unreachable from this shell — used the Postgres service's public proxy URL instead.
- Pre-migration state: neither column existed (0 rows each), journal = 18 migrations. Confirmed 0018 was genuinely pending, not already applied.
- Ran explicitly: `DATABASE_URL=<public> DATABASE_URL_UNPOOLED=<public> pnpm --filter @studyhall/api exec drizzle-kit migrate` → `migrations applied successfully!` (exit 0).
- Post-migration verification (authoritative — read from information_schema, not self-report):
  - `roles.moderate_members` :: boolean, default false, NOT NULL ✅
  - `server_members.muted_until` :: timestamp with time zone, nullable ✅
  - Journal now = 19 migrations (one applied this run).
- Migration is additive (two ADD COLUMN). Safe expand-phase ordering: schema is now compatible with BOTH old code (ignores new columns) and new code — so applying before deploy is correct and non-breaking.

## Step 2 — Deploy BOTH services: BLOCKED ❌ (cannot ship wave-41 source)

**Deploy could not be performed. Root cause: a tooling/infra contradiction, not a code failure.**

- Task instruction was `railway up --service api` / `--service web`. The `railway` CLI is **hard-blocked** by `~/.claude/hooks/railway-guard.sh` (PreToolUse deny — a permanent, no-uninstall claudomat guard that redirects to the Railway GraphQL API).
- Both services are **CLI-upload sourced**: `service.serviceInstances[].source` = `{repo:null, image:null}`. They have no connected git repo and no image source. The wave-41 code exists ONLY in this local checkout.
- The Railway GraphQL API has **no source-upload mutation** (introspected full Mutation type: no upload/source/tarball/archive/blob/sign mutation exists). `railway up`'s tarball-upload flow uses internal endpoints the CLI wraps; there is no GraphQL equivalent.
- Available GraphQL deploy mutations and why each is unusable here:
  - `serviceInstanceDeploy(commitSha / latestCommit)` — for **git-connected** services. These services have `source.repo=null`, so there is no commit source to deploy.
  - `serviceInstanceRedeploy(serviceId, environmentId)` / `deploymentRedeploy(id)` — rebuild the **last uploaded source snapshot**, which is the **prior-wave** upload. Using either would produce a false-green: deployment SUCCESS while serving **old code without the moderation feature**. This is the exact false-green anti-pattern C-2 exists to prevent. **NOT executed.**

**No cutover occurred. Prior-good state preserved and reachable** (see rollback below). Nothing shipped, so nothing to roll back.

## Step 3 — Verification (against CURRENT live services — proves live = stale prior-wave, deploy NOT yet done)

| Check | Result | Reading |
|---|---|---|
| api deployment state | latest = `b4a6396b` **SUCCESS** (2026-07-03 12:30, prior wave) | authoritative; unchanged — no wave-41 deploy exists |
| web deployment state | latest = `257dacb4` **SUCCESS** (2026-07-03 11:21, prior wave) | authoritative; unchanged |
| api `/health` | **200** `{"status":"ok","version":"0.0.1"}` | healthy — but serving OLD revision |
| api timeout route smoke (`POST /servers/.../members/.../timeout`) | **404** | route MISSING → moderation code NOT live (expected 401 once shipped). Confirms live api is stale prior-wave. |
| web bundle marker (`"Member moderation"` in `/assets/index-*.js`) | live bundle `index-QN5fEltz.js` → marker **ABSENT** | live web is stale prior-wave code |

Migration-live proof is deferred: the migration IS applied to the DB, but there is no wave-41 api revision serving to exercise it. The 404 above reflects missing *code*, not the missing column.

## Rollback path

Not needed — no cutover happened. Current live deployments (api `b4a6396b`, web `257dacb4`, both SUCCESS, both healthy) remain the serving revisions. If a future wave-41 deploy is performed and regresses, `deploymentRollback` / `deploymentRedeploy(<prior-id>)` targets these ids.

## Canary

Skipped per task (self-use-mvp, DAU < 1000). Moot — nothing was cut over.

---

## What is required to unblock (route, do not self-fix per Iron Law)

The wave-41 source can only reach these CLI-upload services via `railway up`, which is blocked in this environment. One of these upstream changes is needed (founder / platform-owner decision):
1. **Un-gate `railway up` for this deploy** (host-side allowlist / run the CLI outside the guarded brain shell), OR
2. **Connect api + web services to the git repo** (`githubRepoUpdate` + enable auto-deploy) so `serviceInstanceDeploy(latestCommit:true)` can ship main `5a5f79a` via GraphQL, OR
3. Provide an authorized GraphQL source-upload path if one exists on the account tier.

This is classified as a **deploy-tooling / platform-access** issue (domain: devops/deploy) → route to **devops-engineer** for the git-connect option and **founder** for the CLI-access consent gate. The orchestrator must not bypass the guard.

---

```yaml
head_signoff:
  verdict: ESCALATE
  stage: C-2
  reviewers: {}
  failed_checks:
    - deploy_api: BLOCKED — no source-upload path (CLI blocked by railway-guard; GraphQL has no upload mutation; services are CLI-upload sourced, repo=null/image=null)
    - deploy_web: BLOCKED — same root cause
    - api_new_revision_serving: FAIL — live api still stale prior-wave (timeout route 404, not 401)
    - web_new_bundle_serving: FAIL — live web bundle 'Member moderation' marker ABSENT
  passed_checks:
    - migration_0018_applied: PASS — both columns live + typed, verified via information_schema (not self-report)
    - migration_ordering: PASS — additive expand-phase migration applied before any cutover
    - env_var_scoping: PASS — api has DATABASE_URL/SUPERTOKENS_*/LIVEKIT_*/SESSION_SECRET; web has ONLY VITE_* build vars, no DB creds/secrets
    - rollback_path: PASS — prior-good SUCCESS deployments intact + reachable (api b4a6396b, web 257dacb4); no cutover to reverse
    - no_false_green: PASS — refused serviceInstanceRedeploy/deploymentRedeploy which would rebuild stale prior-wave source and report false SUCCESS
  block_state:
    deploy_targets:
      api:  { service_id: 7358a103-0a4f-44e6-9468-3d02d045531e, live_deployment: b4a6396b, live_status: SUCCESS, live_commit: prior-wave, wave41_deployed: false }
      web:  { service_id: 107d4255-422a-4b72-b138-0647f9192fe4, live_deployment: 257dacb4, live_status: SUCCESS, live_commit: prior-wave, wave41_deployed: false }
    api_health: "200 ok"
    migration_0018_applied: true
    timeout_route_smoke: 404   # route missing on live (stale); expected 401 once wave-41 api ships
    web_bundle_marker_present: false
    canary: skipped
  rationale: >
    Migration 0018 is correctly applied and verified against the live DB via the Postgres
    public proxy — both columns exist with correct types, in safe additive expand-phase order
    before any cutover. But the deploy itself is BLOCKED by an environment contradiction: the
    api and web services are CLI-upload sourced (source.repo=null, image=null), the only tool
    that can upload this local wave-41 checkout (`railway up`) is hard-blocked by the permanent
    railway-guard PreToolUse hook, and the Railway GraphQL API exposes no source-upload
    mutation. The only GraphQL deploy mutations (serviceInstanceRedeploy / deploymentRedeploy)
    would rebuild the STALE prior-wave source snapshot and report a false-green SUCCESS while
    serving old code — the precise false-green failure C-2 exists to prevent — so I refused
    them. Live verification confirms the current api/web are stale prior-wave revisions (timeout
    route 404, bundle marker absent), i.e. wave-41 is NOT live. No cutover occurred; prior-good
    state is preserved and rollback is a no-op. This is a deploy-tooling / platform-access issue,
    not a code defect; per the Iron Law I classify-and-route rather than bypass the guard.
  next_action: ESCALATE_TO_founder   # + route git-connect option to devops-engineer
```
