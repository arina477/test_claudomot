# Wave 19 — C-2 Deploy & verify

## Action 0 — Railway credential (provided by default)
- Project-scoped token (`RAILWAY_TOKEN` ← `APP_RAILWAY_TOKEN`) present + usable. Deploy-scoped probe `project(id:){ services }` returned `errors: null` (NOT `me{}`). Self-discovered: project `app-arina-89ejyn` (`ae55c191-4631-4224-b7b2-42f329ed48d7`), single `production` env (`bfdcc42f-...`).
- Services: **web** `107d4255-...`, **api** `7358a103-...`, supertokens `73ca977a-...`, Postgres `8d177be8-...`. No pause needed.

## Env-var scoping check (C-2 checkbox — PASS)
Per-service variable keys queried via GraphQL `variables(...)`:
- **api** scope (correct): `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SUPERTOKENS_CONNECTION_URI`, `SUPERTOKENS_API_KEY`, `SESSION_SECRET`, `RESEND_API_KEY_AUTH`, `API_ORIGIN`, `WEB_ORIGIN`, `CROSS_ORIGIN_PROD` + Railway platform vars.
- **web** scope (correct): ONLY `VITE_API_ORIGIN` + Railway platform vars — **NO `DATABASE_URL`, NO SuperTokens creds, NO `SESSION_SECRET`**. DB/auth secrets are NOT leaked to the static frontend service.

## Migration 0009 — applied explicitly BEFORE api cutover (wave-18 lesson)
- Pre-migrate direct query: `to_regclass('public.attachments') = null` — table genuinely pending on prod; `drizzle.__drizzle_migrations` = 5 rows.
- Applied via `drizzle-kit migrate` against the prod **public proxy** (`yamanote.proxy.rlwy.net:40008`, `DATABASE_PUBLIC_URL`). First attempt failed (exit 1) on the pg SSL `verify-full` aliasing of `sslmode=require` against Railway's self-signed proxy cert — table NOT created (re-checked: still null, no partial/dirty state). Re-ran with `uselibpqcompat=true&sslmode=require` → **`migrations applied successfully!` exit 0.**
- **Verified by direct query (not trusting the migrate exit code):**
  - `attachments` table EXISTS; 9 columns (id, message_id, uploader_id, channel_id, object_key, filename, content_type, size_bytes, created_at).
  - 3 FKs: `attachments_channel_id_channels_id_fk`, `attachments_message_id_messages_id_fk`, `attachments_uploader_id_users_id_fk`.
  - Index `attachments_message_id_idx` + PK `attachments_pkey`.
  - Migrations ledger advanced (0009 recorded). Schema migrated and verified before any new api code served.

## Baselines captured BEFORE deploy (mandatory — prove new-revision distinctness)
- **api baseline**: deployment `ce25ddc2-afd4-4562-bbac-75e03973be9b`, SUCCESS, 2026-06-30T14:31:58Z
- **web baseline**: deployment `594b0bdc-55e8-4d55-9c6c-4490ceed1336`, SUCCESS, 2026-06-30T14:34:11Z

## Deploy — BOTH services (Railway source-upload, --ci)
- `npx @railway/cli@latest up --service api --environment production --ci` → "Deploy complete", exit 0 (api carries the routes + send-validation; schema already migrated).
- `npx @railway/cli@latest up --service web --environment production --ci` → "Deploy complete", exit 0 (web carries composer + render).
- Note: "Deploy complete" is the CLI build/upload report — NOT trusted as the verdict. Verification uses the authoritative deployment-state endpoint below.

## Verification — AUTHORITATIVE deployment-state + NEW revision distinct
Railway GraphQL `deployments(first:1)` latest-node `status`:
- **api**: NEW deployment `8ef2c228-bac8-499b-8b87-661e42e0d2a8`, **status SUCCESS**, 18:12:46Z — distinct from baseline `ce25ddc2`. ✓
- **web**: NEW deployment `8d3e0c36-59ae-44aa-bf28-9b7390568b4d`, **status SUCCESS**, 18:14:03Z — distinct from baseline `594b0bdc`. ✓

## Serving proof — stale-revision race ruled out
- **api `/health`**: HTTP 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- **web root**: HTTP 200.
- **New-only route probe** (proves the NEW api revision serves the attachment routes, not a stale cache): `POST /channels/:id/attachments/presign` (unauth) → **HTTP 401 `{"message":"unauthorised"}`** — route exists and is auth-guarded, NOT 404.
- **Control**: a bogus route `…/attachments/definitely-not-a-route-xyz` → HTTP 404, confirming the 401 is a real guarded route (not a catch-all).

## Rollback path (C-2 [STABLE] checkbox — identified + reachable BEFORE cutover)
Previous good revisions are one-action redeployable via Railway `deploymentRedeploy` mutation:
- api → `ce25ddc2-afd4-4562-bbac-75e03973be9b` (last SUCCESS)
- web → `594b0bdc-55e8-4d55-9c6c-4490ceed1336` (last SUCCESS)
Migration 0009 is additive (new table + FKs + index; no destructive column change), so a code rollback to the previous revision remains schema-compatible (old code simply ignores the new table) — no DB rollback required for a code revert.

## C-3 Canary — SKIPPED (below traffic threshold)
```yaml
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000 per project.yaml deploy_targets[].canary_threshold_dau); StudyHall is pre-validation with zero real-user traffic. Real-user telemetry noise/signal is unworkable below threshold — the T-block synthetic probes (incl. T-5 e2e against the live web URL) are the authoritative post-deploy signal, not a real-user canary."
```
Sentry/observability note: this wave did not add a Sentry integration; post-deploy regression surfacing relies on T-block synthetic probes + the boot-probe (already green in CI) + the live /health + presign serving proofs above. No silent error-blackout for the verified surfaces.

## Secrets discipline
- No secret committed or echoed to any file. `DATABASE_PUBLIC_URL` was used in-process only for the migration; logs were redacted (`postgresql://***@`). Token lives only in the environment.

---
```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "api: deployments[0] status SUCCESS, id 8ef2c228 (≠ baseline ce25ddc2), 18:12:46Z"
  - "web: deployments[0] status SUCCESS, id 8d3e0c36 (≠ baseline 594b0bdc), 18:14:03Z"
  - "api /health: 200 {status:ok}; web root: 200"
  - "new-only route POST /channels/:id/attachments/presign → 401 (unauth, NOT 404) — proves NEW api revision serves; bogus-route control → 404"
  - "migration 0009 applied explicitly (drizzle-kit migrate) BEFORE api cutover; attachments table + 3 FKs + message_id index verified by direct query"
  - "env scoping verified: web has NO DB/SuperTokens/session secrets (only VITE_API_ORIGIN); api has the full DB/auth set"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: "8ef2c228-bac8-499b-8b87-661e42e0d2a8", baseline_id: "ce25ddc2-afd4-4562-bbac-75e03973be9b", verified_at: "2026-06-30T18:12:46Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: "8d3e0c36-59ae-44aa-bf28-9b7390568b4d", baseline_id: "594b0bdc-55e8-4d55-9c6c-4490ceed1336", verified_at: "2026-06-30T18:14:03Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""                  # not needed — both deploys reached terminal SUCCESS synchronously
canary_status: skipped
canary_skip_reason: "DAU 0 < 1000 threshold (project.yaml); pre-validation, no real-user traffic. T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
rollback_ready: true                  # api→ce25ddc2, web→594b0bdc via deploymentRedeploy; 0009 additive (revert-safe)
note: "Both services deployed + AUTHORITATIVELY verified (deployment-state SUCCESS + new revision distinct from pre-captured baselines + new-only presign route serves 401). Migration 0009 applied explicitly before api cutover and verified by direct query. Env scoping clean (web has no DB creds). Canary skipped below DAU threshold."
```

---
```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Both services verified live via the AUTHORITATIVE Railway deployment-state endpoint —
    not /healthz alone. Baselines were captured BEFORE cutover (api ce25ddc2, web 594b0bdc),
    and both new deployments reached terminal SUCCESS with revision IDs distinct from those
    baselines, ruling out the stale-revision race. The feared false-green is foreclosed three
    ways: deployment-state SUCCESS, new-revision-distinct, and a new-only route probe
    (POST presign → 401 not 404, with a 404 control) proving the new api revision actually
    serves the attachment routes. Migration 0009 was applied explicitly via drizzle-kit
    migrate before the api began serving and verified by direct query (table + 3 FKs + index),
    not by trusting the migrate exit code. Env scoping is correct — web carries no DB/auth
    secrets. A reachable one-action rollback to the previous good revisions was identified
    before cutover, and 0009 is additive so a code revert stays schema-compatible. Canary is
    correctly skipped below the 1000-DAU threshold (StudyHall is pre-validation, DAU 0); the
    T-block synthetic probes are the post-deploy signal. Every applicable C-2 checkbox ticks.
  next_action: PROCEED_TO_T_BLOCK
```
