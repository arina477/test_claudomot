# C-2 — Deploy & verify (wave-15 M3 @mentions)

PR #27 merged to main (squash). Merge SHA `fd86540400d3ab9a44b076c49106aaa6ee38e6b6`. Mode: automatic.

## C-1 recap (PR + CI + merge)
- PR #27: https://github.com/arina477/test_claudomot/pull/27
- All 7 checks PASS: lint, typecheck, test (Postgres 16; 471 tests), build, secret-scan (gitleaks, blocking), boot-probe; e2e (informational) also PASS.
- boot-probe SUCCESS — compiled API boots with `message_mentions` (0007) schema present and `MentionsController` wired (no DI/import crash).
- Squash-merged + branch deleted; local main synced to fd86540.

## Rollback baselines captured pre-cutover (reachable rollback targets)
- api: `a520c586-4df5-47b4-aa3d-65aed82cb9a4` (was SUCCESS; redeployable via GraphQL `deploymentRedeploy`).
- web: `dfa130ed-50c3-4930-8ede-08981cc11a43` (was SUCCESS; redeployable).

## Migration 0007 (applied to prod BEFORE api cutover; additive/non-destructive)
- Mechanism (same as wave-13 0006): `drizzle-kit migrate` from `apps/api` against the prod DB **public proxy** `yamanote.proxy.rlwy.net:40008` (DATABASE_PUBLIC_URL from the Postgres Railway service). drizzle.config reads `DATABASE_URL_UNPOOLED ?? DATABASE_URL`; both pointed at the public proxy for the run. NO boot-time auto-migrate exists (verified: main.ts has none; explicit migrate is the contract).
- Pre-migrate: `to_regclass('public.message_mentions')` → NULL (absent); 7 migrations applied (0000–0006).
- Applied: `[✓] migrations applied successfully!`
- Post-migrate authoritative verification (direct pg query against prod):
  - `message_mentions` table EXISTS — cols `id uuid PK`, `message_id uuid NOT NULL`, `mentioned_user_id text NOT NULL`, `created_at timestamptz NOT NULL`.
  - UNIQUE constraint `message_mentions_message_user (message_id, mentioned_user_id)` present — idempotent re-resolution.
  - Index `message_mentions_user_created_at_idx (mentioned_user_id, created_at)` present — my-mentions query.
  - FKs: `message_id → messages(id) ON DELETE CASCADE`, `mentioned_user_id → users(id)`.
  - Migration count 7 → 8.

## Deploy (Railway CLI `up` source-upload — NOT GraphQL no-op)
- Mechanism (wave-12/13 lesson): `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN npx -y @railway/cli@latest up --service <api|web> --environment production --ci` (CLI up builds a fresh image; GraphQL serviceInstanceDeploy re-runs the existing image = no-op).
- **api** deployed first (after migration), then **web**.
- Authoritative deployment-state (Railway GraphQL `deployments` endpoint, NOT /health):
  - api NEW deployment `15f389bb-2692-4231-b529-2ad3aa6a97cb` → **SUCCESS**; prior baseline `a520c586` → REMOVING (new revision took over).
  - web NEW deployment `cf154378-8227-41d2-b5a0-da7e7ef59303` → **SUCCESS**.

## Env-var scoping (security — verified via GraphQL `variables` query)
- api: DATABASE_URL, DATABASE_URL_UNPOOLED, SESSION_SECRET, SUPERTOKENS_API_KEY, SUPERTOKENS_CONNECTION_URI, RESEND_API_KEY_AUTH, API_ORIGIN, WEB_ORIGIN — has everything it needs.
- web: only RAILWAY_* + VITE_API_ORIGIN — **NO DB / SuperTokens / SESSION_SECRET / Resend creds leaked into the frontend service** (explicit leak check returned NONE).

## Live verification (prod) — deploy-state SUCCESS + stale-revision guard
- api `/health` → 200 (`{"status":"ok","service":"studyhall-api"}`) — clean boot, MentionsController loaded.
- **NEW-ONLY route `GET /me/mentions` unauthed → 401** (`{"message":"unauthorised"}`) — proves the new revision serves AND the authz boundary holds (a 404 here would prove a stale prior revision).
- Control: bogus route `GET /this-route-does-not-exist-xyz` → 404 — confirms 404 routing works, so the 401 above is a real authz verdict, not a blanket fallback.
- web root `/` → 200, `<title>StudyHall` (new build served).
- Authed two-client mention realtime was verified at the T-block (not re-run here per scope).

## Canary
- Skipped per traffic threshold (self-use-mvp; DAU < 1000; `canary.enabled=false` in CI-PRINCIPLES). Synthetic prod probes above are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: gh railway
verdict_evidence:
  - "gh: PR #27 all 7 checks pass (incl. boot-probe); squash-merged SHA fd86540"
  - "prod migration: drizzle-kit migrate applied 0007; message_mentions table + UNIQUE(message_id,mentioned_user_id) + (mentioned_user_id,created_at) index + FKs verified by direct pg query; count 7->8"
  - "railway api: deployment 15f389bb status SUCCESS (new revision; prior a520c586 REMOVING)"
  - "railway web: deployment cf154378 status SUCCESS"
  - "live: api /health 200; GET /me/mentions unauthed 401 (new-route flip, not 404); bogus route 404 control; web root 200 (StudyHall)"
  - "env scoping: web has NO DB/SuperTokens/session creds; api fully scoped"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment: 15f389bb-2692-4231-b529-2ad3aa6a97cb, verified_at: 2026-06-30T08:53Z, health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, deployment: cf154378-8227-41d2-b5a0-da7e7ef59303, verified_at: 2026-06-30T08:53Z, health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (self-use-mvp, <1000); synthetic prod verification is the post-deploy signal."
note: "Deploy via Railway CLI up source-upload (wave-12/13 lesson). Migration 0007 applied explicitly before cutover via public proxy yamanote.proxy.rlwy.net:40008. Rollback targets: api a520c586, web dfa130ed."
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Migration 0007 (message_mentions) was applied to prod EXPLICITLY and in order via drizzle-kit
    migrate against the public proxy BEFORE api cutover — never auto-migrated on boot — and the table,
    its idempotency UNIQUE, its my-mentions index, and both FKs were verified directly in prod
    (migration count 7 to 8). The change is additive/non-destructive (new table only). Both services
    were deployed via the Railway CLI up source-upload (not the GraphQL no-op) and reached SUCCESS via
    the authoritative deployment-state endpoint — not /health alone. The new api revision is confirmed
    to be the one serving traffic: GET /me/mentions returns 401 (new-only route present + authz
    enforced) while a bogus route returns 404, so the 401 is a real verdict and not a stale prior
    revision. Per-service env scoping is correct: web carries no DB, SuperTokens, session, or Resend
    secrets; api is fully scoped. Reachable rollback targets (api a520c586, web dfa130ed) were captured
    before cutover. Canary skipped per the <1000 DAU threshold. No false-green: deploy-state SUCCESS,
    fresh revision serving, schema present, boundary intact.
  next_action: PROCEED_TO_T_BLOCK
```
