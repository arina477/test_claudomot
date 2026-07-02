# C-2 — Deploy & verify (wave-36, M7 test-hardening)

**Block:** C (CI/CD) · **Stage:** C-2 · **Mode:** automatic · **Merge commit:** `be1bbab` (main)
**head-ci-cd owner.** Deploy path: Railway CLI `railway up` per changed service (services are NOT git-connected — a merge does NOT deploy). Verification: authoritative Railway deployment-state GraphQL endpoint (NOT self-reported `/healthz`) + live served-content assertion.

## Scope of this deploy
- **web** (user-facing): `/privacy` + `/terms` "Last updated: 2024" → **2026**; `toUiVisibility` gained an `export` (no behavior change). → redeployed; the date is the visible marker.
- **api** (behavior-identical): `instrument.ts` extracted inline Sentry `beforeSend` → exported `scrubPii` const (same runtime behavior); new test files not in the runtime bundle. → redeployed for image-currency.
- **NO migration** this wave (schema unchanged since wave-35's `0014`). No `drizzle-kit migrate` step required — confirmed against scope.

## Environment / credential (Action 0)
- Railway token: `APP_RAILWAY_TOKEN` (exported as `RAILWAY_TOKEN`); project id `ae55c191-4631-4224-b7b2-42f329ed48d7` (`app-arina-89ejyn`), environment `production` (`bfdcc42f…`). Token verified usable via deploy-scoped GraphQL probe (`{ projectToken { projectId environmentId } }` returned data, no errors). Credential present → provisioned-by-brain path; no founder pause.
- Railway CLI was not on PATH → installed user-local (`npm i -g @railway/cli` with prefix `/home/claudomat/.npm-global`; v5.23.3). Global install rejected (no root); user-local prefix succeeded. Auth confirmed via `railway status` (project-token scoped; `whoami` fails on project tokens as expected).

## Service IDs (discovered via GraphQL)
- **web** = `107d4255-422a-4b72-b138-0647f9192fe4`
- **api** = `7358a103-0a4f-44e6-9468-3d02d045531e`
- (supertokens `73ca977a…`, Postgres `8d177be8…` — unchanged, not deployed)

## Per-service env scoping verified (no missing-env-var / no scoped-secret leak)
- **web**: `VITE_API_ORIGIN`, `VITE_LIVEKIT_URL`, Railway-managed vars. **NO `DATABASE_URL`, NO SuperTokens creds, NO `SESSION_SECRET`.** Correct — the web SPA must not receive DB creds. ✓
- **api**: `DATABASE_URL`, `SUPERTOKEN*` (2), `SESSION_SECRET`, `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `RESEND_API_KEY`, `API_ORIGIN`, `WEB_ORIGIN`, `CROSS_ORIGIN_PROD`. Full required backend secret set present in the target service. ✓

## Deploy (Action 2) — fresh-revision race defeated
`railway up --service web --ci` and `railway up --service api --ci` (both exit 0). Each produced a NEW Railway deployment id, distinct from the pre-deploy baseline (defeats stale-image redeploy — the wave-34 false-green trap).

| Service | Pre-deploy baseline id | New deploy id | Terminal status | createdAt |
|---|---|---|---|---|
| web | `b1804249…` (SUCCESS) | **`c2dcb488-061b-49d3-8536-79c7b530e9b1`** | **SUCCESS** | 2026-07-02T18:15:23Z |
| api | `1fb4580e…` (SUCCESS) | **`187aabd2-6007-4ffd-b2c0-df8f316bd48a`** | **SUCCESS** | 2026-07-02T18:15:30Z |

Deployment-state read from the authoritative `deployments(first:1, input:{projectId,serviceId})` GraphQL query (NOT `/healthz`). Polled BUILDING → DEPLOYING → SUCCESS via a monitor with explicit success/failure(FAILED|CRASHED|REMOVED|SKIPPED)/timeout(600s) conditions; both reached SUCCESS on the fresh id well inside budget (~2 min). Note: `railway up` uploads the full Turborepo; the api build pipeline also rebuilds the web workspace (turbo dependency graph) — per-service Railway deployment-state is the authoritative signal, and both are SUCCESS.

## Verify LIVE (Action 3) — false-green defeated with served-content evidence
- **api health** — `curl -fsS https://api-production-b93e.up.railway.app/health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. ✓
- **web served-content marker (wave-specific)** — served bundle hash changed `/assets/index-B_iPgjvp.js` (pre-deploy) → **`/assets/index-BDKrrUxG.js`** (post-deploy), proving fresh content is actually served, not a cached old revision. In the served bundle: **`Last updated: 2026` × 2** (privacy + terms); **`Last updated: 2024` × 0**. The visible change is live. ✓
  - Pre-deploy baseline (recorded before cutover): the then-live bundle `/assets/index-B_iPgjvp.js` showed `Last updated: 2024` × 2 — confirming this deploy is what flipped the marker.
- **regression sanity**:
  - `/terms` → 200, `/settings/privacy` → 200 (the `toUiVisibility` export did not break the page). ✓
  - GET `/profile/privacy` (unauthenticated) → **401** (privacy endpoints still auth-gated; IDOR session-scoping intact). ✓

## Canary (Action 5) — skipped
- `canary_status: skipped` — pre-launch, real-user DAU below the `canary_threshold_dau: 1000` declared in `project.yaml`. Deploy verification (above) is the post-deploy signal; T-block synthetic probes follow.

## Iron Law
No code fixes performed in C-2. Deploy + all verifications passed on the first attempt; no re-fire needed (a stale-bundle re-`railway up` would have been a legitimate re-fire but was not required — the served bundle already shows 2026).

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway web: deployment c2dcb488-061b-49d3-8536-79c7b530e9b1 status SUCCESS (fresh id != baseline b1804249), createdAt 2026-07-02T18:15:23Z"
  - "railway api: deployment 187aabd2-6007-4ffd-b2c0-df8f316bd48a status SUCCESS (fresh id != baseline 1fb4580e), createdAt 2026-07-02T18:15:30Z"
  - "api /health: 200 {\"status\":\"ok\",\"service\":\"studyhall-api\",\"version\":\"0.0.1\"}"
  - "web served bundle hash changed B_iPgjvp -> BDKrrUxG; served content 'Last updated: 2026' x2, 'Last updated: 2024' x0"
  - "regression: /terms 200, /settings/privacy 200, GET /profile/privacy (unauth) 401"
  - "env scoping: web has NO DATABASE_URL/SuperTokens/SESSION_SECRET; api has full backend secret set"
  - "no migration this wave (schema unchanged since 0014); no drizzle-kit migrate step required"
deploy_targets:
  - platform: railway
    service: web
    state: SUCCESS
    deployment_id: c2dcb488-061b-49d3-8536-79c7b530e9b1
    verified_at: "2026-07-02T18:19:00Z"
    health_url: "https://web-production-bce1a8.up.railway.app/privacy"
    served_marker: "Last updated: 2026"
  - platform: railway
    service: api
    state: SUCCESS
    deployment_id: 187aabd2-6007-4ffd-b2c0-df8f316bd48a
    verified_at: "2026-07-02T18:19:00Z"
    health_url: "https://api-production-b93e.up.railway.app/health"
    health_status: 200
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (pre-launch < 1000); T-block synthetic probes are the post-deploy signal."
note: "Railway is CLI-push (railway up) not git-trigger; installed @railway/cli user-local (no root). Both services deployed on fresh deployment ids -> stale-revision race defeated. Served-content marker (2026 present, 2024 absent, new bundle hash) is the authoritative false-green defeat. Live URLs: web https://web-production-bce1a8.up.railway.app , api https://api-production-b93e.up.railway.app"
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Both changed services (web, api) deployed to Railway via railway up on FRESH deployment
    ids distinct from the pre-deploy baselines, and both reached the authoritative
    deployment-state SUCCESS — not a stale-image redeploy. False-green is defeated by
    served-content evidence, not a naive /healthz: the live web bundle hash changed and now
    serves "Last updated: 2026" (x2) with zero "2024" occurrences, exactly the wave-specific
    marker; api /health returns 200. Per-service env scoping is correct (web carries no DB or
    SuperTokens creds; api carries the full backend secret set), no migration was required this
    wave (schema unchanged since 0014), regression sanity holds (/settings/privacy 200,
    unauth /profile/privacy 401), and the previous good revisions (web b1804249, api 1fb4580e)
    remain a reachable one-action rollback target. Canary correctly skipped below the DAU
    threshold. Every applicable C-2 stage-exit check ticked.
  next_action: PROCEED_TO_T-block
```
