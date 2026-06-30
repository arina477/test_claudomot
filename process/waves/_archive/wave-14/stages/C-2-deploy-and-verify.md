# C-2 — Deploy & verify (wave-14)

**Block:** C (CI/CD) · **Stage:** C-2 · **Mode:** automatic · **Head:** head-ci-cd

## Summary

Merged commit `ef6afbf` deployed to BOTH Railway services (api = backend `/presence` change; web = member-list/typing frontend change) via Railway CLI source-upload (`up --ci`), NOT GraphQL `serviceInstanceDeploy` — honoring the wave-12 false-green lesson. Both produced NEW deployment revisions confirmed `SUCCESS` via the authoritative Railway deployment-state endpoint. Live verification (health + presence-route boundary + web build) passed. Canary skipped (<1000 DAU).

## Action 0 — Credential

`APP_RAILWAY_TOKEN` present. Self-discovered via `{ projectToken { projectId environmentId } }`:
- project id: `ae55c191-4631-4224-b7b2-42f329ed48d7` (`app-arina-89ejyn`)
- environment id (production): `bfdcc42f-fe5b-4198-a47a-b08f5940975d`
- services: `api`=`7358a103-0a4f-44e6-9468-3d02d045531e`, `web`=`107d4255-422a-4b72-b138-0647f9192fe4` (+ supertokens, Postgres)

## Pre-deploy baselines (for new-revision confirmation)

| Service | Baseline deployment id | Status | createdAt |
|---|---|---|---|
| api | `bbf1afe7-f351-4677-bfed-b4cf2431fdbe` | SUCCESS | 2026-06-30T04:07:17Z |
| web | `dbd9837e-e79b-4704-8edc-246341fc11b1` | SUCCESS | 2026-06-30T03:30:23Z |

## Deploys (source-upload, `npx @railway/cli@latest up --service <svc> --environment production --ci`)

| Service | NEW deployment id | Distinct from baseline? | Authoritative status | createdAt |
|---|---|---|---|---|
| **api** | `a0b80542-bd42-4a7b-b80a-a8ccfd84e82b` | YES (≠ bbf1afe7) | **SUCCESS** | 2026-06-30T05:46:46Z |
| **web** | `dfa130ed-50c3-4930-8ede-08981cc11a43` | YES (≠ dbd9837e) | **SUCCESS** | 2026-06-30T05:47:58Z |

Status read from `deployments(first:1, input:{projectId, serviceId})` → `.data.deployments.edges[0].node.status`, NOT from `/health`. Both CLI runs returned "Deploy complete" EXIT=0.

## Live verification (Action 3)

| Probe | Expected | Observed |
|---|---|---|
| api `GET /health` | 200 | **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| api `GET /servers/<id>/members` unauthed | 401 | **401** `{"message":"unauthorised"}` — presence/member route auth boundary holds |
| api bogus route (control) | 404 | **404** — routing live, not catch-all |
| web `GET /` | 200, new build | **200**, `<title>StudyHall</title>` |
| web new build asset | 200 | CSS `index-BlObVf1S.css` matches deploy build; served JS `index-BbyZscP2.js` → 200 |

Authed two-client presence/typing realtime is deferred to T-block per the C-2 contract (C-2 confirms deploy landed + boundary holds).

## Canary

```yaml
canary_status: skipped
canary_skip_reason: "DAU below threshold (self-use-mvp, 0 real users < 1000 canary_threshold_dau); T-block synthetic probes are the post-deploy signal."
```

## Stage-exit checklist (head-ci-cd)

- [x] Deploy verification reads the Railway deployment-state endpoint, NOT self-reported /health
- [x] New revision confirmed serving before deploy called done (distinct deployment ids, both SUCCESS)
- [x] Migrations: presence is in-memory (Socket.IO room state); no pending DB migration in this diff — none to apply
- [x] Env vars: api retains DB/SuperTokens creds; web has no DB creds (existing per-service scope unchanged; both booted to SUCCESS)
- [x] Rollback path reachable before cutover: previous good revisions recorded (api `bbf1afe7`, web `dbd9837e`); redeploy-to-prior via Railway is one action
- [x] Secrets via platform env vars; none committed (gitleaks PASS at C-1)
- [x] Canary skip recorded with traffic-threshold reasoning

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment a0b80542 status SUCCESS (new revision, baseline bbf1afe7), commit ef6afbf"
  - "railway web: deployment dfa130ed status SUCCESS (new revision, baseline dbd9837e), commit ef6afbf"
  - "https://api-production-b93e.up.railway.app/health: 200 {status:ok}"
  - "GET /servers/<id>/members unauthed: 401 (boundary holds); bogus route: 404 (control)"
  - "https://web-production-bce1a8.up.railway.app/: 200, serves new build (<title>StudyHall</title>, asset 200)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: a0b80542-bd42-4a7b-b80a-a8ccfd84e82b, commit: ef6afbf, verified_at: "2026-06-30T05:47Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: dfa130ed-50c3-4930-8ede-08981cc11a43, commit: ef6afbf, verified_at: "2026-06-30T05:48Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000); T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
rollback_ready: true
note: "Deployed via Railway CLI source-upload (up --ci) NOT GraphQL serviceInstanceDeploy — wave-12 false-green lesson. Both services new SUCCESS revisions verified via authoritative deployment-state. Presence is in-memory; no migration. Canary skipped <1000 DAU."

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Both services deployed via source-upload and verified live the right way: each produced a
    NEW deployment id distinct from its pre-deploy baseline, both confirmed SUCCESS via the
    authoritative Railway deployment-state endpoint (not /health). Live probes confirm api /health
    200, the presence/member route returns 401 unauthed (boundary holds) with a 404 control, and
    web serves the new build. No DB migration is present (presence is in-memory room state). The
    previous good revisions are recorded and one-action redeployable, so a rollback path exists.
    Canary correctly skipped below the 1000-DAU threshold. No false-green: deploy state, serving
    revision, and route boundary all independently confirmed.
  next_action: PROCEED_TO_T-block
```
