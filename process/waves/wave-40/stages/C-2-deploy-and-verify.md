# C-2 — Deploy & Verify (wave-40 avatar hardening)

Backend-only wave. Only `apps/api` changed (avatar endpoint hardening: NUL-byte guard + catch NoSuchKey). No migration, no env-var change. Railway deploy is CLI-push (`railway up`), NOT git-triggered — merge to main does not deploy.

## Revision reconciliation
- Local `main` HEAD `58f335f` = a process-docs-only commit (touches only `process/waves/wave-40/...`) sitting on top of the wave-40 fix `9c5054d` (PR #54, squash-merged at C-1).
- The avatar hardening code lives in `apps/api/src/users/users.controller.ts` and `apps/api/src/files/files.service.ts` (from `9c5054d`), which `main` contains. Deploying `main` HEAD serves the wave-40 code. Confirmed via `git merge-base --is-ancestor 9c5054d main`.

## Rollback target (identified before cutover)
- Previous good api deployment: `f625a163-a04b-4dd8-96e2-5b0f15240cec` (status SUCCESS, createdAt 2026-07-03T09:28:05Z, image digest `sha256:3d97dfd9…`). Reachable via Railway redeploy of that deployment. Rollback path confirmed reachable before deploy.

## Deploy
- Command: `railway up --service api --ci` from repo root on `main` (`58f335f`).
- Turbo build succeeded (3/3 tasks); Docker image built + pushed; CLI reported "Deploy complete".
- New authoritative deployment: `b4a6396b-ac44-4a31-b735-7bfb3e667371` (distinct id from pre-deploy `f625a163` — a genuine fresh deploy, not a no-op/SKIPPED).

## Verification (authoritative-first)

### 1. Authoritative deployment-state (NOT /healthz self-report)
GraphQL `deployments(first:1, input:{projectId, serviceId:api})` → `node.status == "SUCCESS"` for deployment `b4a6396b`. Not SKIPPED / FAILED / CRASHED.

### 2. /health
`GET https://api-production-b93e.up.railway.app/health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. (The payload carries no uptime field; the behavior-flip below is the authoritative served-code freshness proof, stronger than uptime.)

### 3. Behavior-proof — new wave-40 code confirmed serving (stale-revision guard)
This behavior exists ONLY in wave-40's code. Pre-deploy baseline captured against the OLD live revision, then re-run post-deploy:

| Smoke | Pre-deploy (OLD code) | Post-deploy (new code) | Expected | Verdict |
|---|---|---|---|---|
| `GET /users/%00/avatar` (NUL-byte guard) | **500** | **400** | 400 | PASS — flipped 500→400, proves new code serves |
| `GET /users/st-user-nonexistent-abc/avatar` (regression guard: valid non-UUID id) | 404 | **404** | 404 | PASS — non-UUID not wrongly rejected |

The %00 → 400 flip (from the pre-deploy 500) is the definitive stale-deploy guard: a 500 here would have meant the old revision was still serving. It returned 400 → new revision is live and serving traffic.

## Canary
`canary_status: skipped` — self-use-mvp, DAU < 1000 (per project canary policy). No canary window authored for this wave.

---

```yaml
ci_stage_verdict: PASS
stage: C-2
wave: 40
change_class: backend-only
deploy_mechanism: railway-cli-push
migrations: none
env_var_changes: none

deploy_targets:
  api:
    service_id: 7358a103-0a4f-44e6-9468-3d02d045531e
    url: https://api-production-b93e.up.railway.app
    deployed_commit: 58f335feefa1b357a668c01722f13f73fbd3a6ac
    wave_fix_commit: 9c5054d5b847728441ac19c9a7193acde57b7daf
    deployment_id: b4a6396b-ac44-4a31-b735-7bfb3e667371
    authoritative_status: SUCCESS
    verification_source: railway-graphql-deployment-state
    rollback_target_deployment_id: f625a163-a04b-4dd8-96e2-5b0f15240cec
    rollback_reachable: true

health:
  endpoint: /health
  http: 200
  body: '{"status":"ok","service":"studyhall-api","version":"0.0.1"}'

behavior_proof:
  nul_byte_avatar:
    request: GET /users/%00/avatar
    pre_deploy: 500
    post_deploy: 400
    expected: 400
    result: PASS
  non_uuid_avatar:
    request: GET /users/st-user-nonexistent-abc/avatar
    pre_deploy: 404
    post_deploy: 404
    expected: 404
    result: PASS
  served_code_assertion: PASS  # new wave-40 revision confirmed serving (not stale)

canary_status: skipped
canary_reason: self-use-mvp, DAU < 1000

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    api service deployed from main HEAD (58f335f, containing wave-40 fix 9c5054d) via railway up —
    a genuine fresh deployment (b4a6396b, distinct from pre-deploy f625a163). Verified against the
    AUTHORITATIVE Railway deployment-state endpoint (status=SUCCESS), not a self-reported /healthz.
    /health returned 200. The behavior-proof is the load-bearing check: the NUL-byte smoke flipped
    500 (pre-deploy OLD code) -> 400 (post-deploy), and the non-UUID smoke held at 404 — proving the
    new wave-40 revision is the one serving traffic (no stale-revision false-green). No migration and
    no env-var change in scope, so migration ordering and target-service env-scope checks are N/A. A
    reachable rollback target (f625a163, previous SUCCESS) was identified before cutover. Canary
    skipped per self-use-mvp policy (DAU < 1000).
  next_action: PROCEED_TO_C-3
```
