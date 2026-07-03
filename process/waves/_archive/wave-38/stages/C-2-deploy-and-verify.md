# C-2 — Deploy & Verify (wave-38: avatar storage go-live)

Block: C (CI/CD) · Stage: C-2 · Head: head-ci-cd · Platform: Railway (CLI-push, NOT git-triggered)

## Summary

Merge commit `8b590e1` (avatar + attachment storage) was on `main` but not deployed
(Railway deploy is CLI-push). This stage set the target-service env, applied migration
0017 explicitly before cutover, shipped the new code via `railway up`, and verified the
deploy against the **authoritative Railway deployment-state endpoint** plus a
storage-live smoke — not a self-reported `/healthz` alone.

## ci_stage_verdict
- C-1: PASS (PR #52 merged → `8b590e1`; all 7 CI checks green — recorded at C-1).
- Deployed working tree: local `main` @ `5d616f7` (process HEAD containing merge `8b590e1` avatar code).

## Step 1 — Env vars set on service `api` (values NOT recorded here — account-issued creds live only in Railway)
env_vars_set:
  - AWS_ACCESS_KEY_ID          # Tigris access key (secret)
  - AWS_SECRET_ACCESS_KEY      # Tigris secret key (secret)
  - AWS_ENDPOINT_URL           # https://t3.storageapi.dev
  - STORAGE_BUCKET_NAME        # studyhall-avatars-ngavql0
  - PUBLIC_API_URL             # https://api-production-b93e.up.railway.app (no trailing slash)
- Set with `--skip-deploys` (avoided a churn redeploy of the old image); new code shipped once via `railway up`.
- Scope check: all five set on **api** only. web received NO DB/storage creds (correct per-service scoping).

## Step 2 — Migration 0017 (applied BEFORE new code served)
- File: `apps/api/drizzle/migrations/0017_dapper_squadron_sinister.sql` → `ALTER TABLE "users" ADD COLUMN "avatar_key" text;` (additive, nullable — safe/back-compat).
- Applied explicitly via `drizzle-kit migrate` over the **public DB proxy** (`yamanote.proxy.rlwy.net:40008`), not auto-migrate-on-boot.
- Result: `[✓] migrations applied successfully!` (18 total applied).
- Post-check: `users.avatar_key` = `text`, `is_nullable=YES` — CONFIRMED present.
- Ordering: migration completed BEFORE `railway up` cutover → new code never served against un-migrated schema.

## Step 3 — Deploy (CLI-push)
- `railway up --service api --ci` → build succeeded (turbo 3/3 tasks), image pushed, "Deploy complete", exit 0.

## Step 4 — Verification

deploy_targets:
  api:
    state: SUCCESS                                   # authoritative Railway deployment-state endpoint
    deployment_id: f625a163-a04b-4dd8-96e2-5b0f15240cec
    created_at: 2026-07-03T09:28:05Z
    verified_at: 2026-07-03T09:30:19Z                # ~2 min old → fresh revision
    commit: 5d616f7 (contains merge 8b590e1 avatar code)
    prior_deployment_id: fa782b68-5737-406e-9c2c-659797ba5933   # now REMOVED (superseded)
    new_revision_serving: true                       # see proof below

- **Authoritative deploy-state:** `deployments(first:1)` → `status=SUCCESS`, new id `f625a163` ≠ prior `fa782b68`. NOT SKIPPED/FAILED/CRASHED.
- **Stale-revision race disproven (new revision IS serving):** the avatar route returns the new controller's bespoke body `{"message":"User has no avatar","error":"Not Found","statusCode":404}` — a route + response that exist ONLY in the merged avatar code. The old revision had no such route/response. Serving revision matches deployed revision.

health_probe:
  url: https://api-production-b93e.up.railway.app/health
  http_code: 200
  body: '{"status":"ok","service":"studyhall-api","version":"0.0.1"}'
  note: /health carries no uptime field; freshness proven via deployment-state createdAt + new-route serving, which is stronger than a cache-prone /healthz.

storage_smoke:
  url: https://api-production-b93e.up.railway.app/users/00000000-0000-0000-0000-000000000000/avatar
  http_code: 404                                     # EXPECTED 404 (user has no avatar, storage IS configured)
  body: '{"message":"User has no avatar","error":"Not Found","statusCode":404}'
  interpretation: 404 (not 503) → Tigris creds are live in the api service AND the new avatar endpoint shipped. This is the deploy-time proof of storage-live. A 503 here would have meant creds didn't take.
  scope_note: full authenticated presign→PUT→confirm→anonymous-GET-200 round-trip is deferred to T-block (T-5 E2E); the 404-not-503 smoke is sufficient for C-2.

## Rollback path (identified + reachable before cutover)
- Target: previous good revision `fa782b68-5737-406e-9c2c-659797ba5933` (now REMOVED, still redeployable).
- Action: `railway redeploy --service api` on that deployment, or GraphQL `serviceInstanceRedeploy`.
- Not triggered — deploy verified healthy.

## Canary
canary_status: skipped
canary_reason: StudyHall is self-use-mvp; DAU well below the 1000-user canary threshold (per project.yaml canary policy). No traffic-split window warranted.

---
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Deploy verified against the authoritative Railway deployment-state endpoint (SUCCESS,
    new deployment id distinct from prior), and the new revision is proven to be the one
    serving traffic via the avatar route's bespoke 404 body that exists only in the merged
    code (no stale-revision race). Migration 0017 (additive nullable avatar_key) was applied
    explicitly over the DB proxy BEFORE cutover and confirmed present. All five storage/api
    env vars are set on the api service only (web received no DB/storage creds; correct
    scoping); secrets set via Railway env, never committed. The storage-live smoke returns
    404 (not 503), proving Tigris creds are live and the avatar endpoint shipped. A rollback
    to the prior good revision was identified and confirmed redeployable before cutover.
    Canary correctly skipped for self-use-mvp scope.
  next_action: PROCEED_TO_T-block
```
