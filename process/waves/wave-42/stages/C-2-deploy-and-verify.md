# C-2 — Deploy & verify (wave-42: assignment submission collect/return)

Deploy the merged assignment collect/return feature (PR #56, squash merge `07ebda95`) LIVE across api + web on Railway, apply migration 0019 to the production app DB, and verify the served artifacts actually changed and carry the fix. Mode: automatic.

## Migration (applied FIRST, before code cutover)

- **Migration:** `0019_sturdy_psylocke.sql` — additive: creates `assignment_submissions` table (13 cols) with FKs to `assignments`/`users`, unique constraint `assignment_submissions_assignment_user (assignment_id, user_id)`, and index `assignment_submissions_assignment_id_idx`. Expand-only; old code ignores the new table, so applying before deploy is safe (no old/new incompatibility during cutover).
- **Method:** explicit `drizzle-kit migrate` (NOT auto-migrate-on-boot), run against the Postgres public TCP proxy (`yamanote.proxy.rlwy.net:40008`) via `DATABASE_PUBLIC_URL`. drizzle-kit reads `DATABASE_URL_UNPOOLED ?? DATABASE_URL`; ran with `env -u DATABASE_URL_UNPOOLED DATABASE_URL=<public-url>`.
- **Result:** `migrations applied successfully!` (exit 0).
- **Post-migrate verification (authoritative, on prod DB):**
  - `to_regclass('public.assignment_submissions')` → `assignment_submissions` (table exists).
  - 13 columns present: id, assignment_id, user_id, text, object_key, filename, content_type, size_bytes, submitted_at, returned_at, organizer_comment, created_at, updated_at.
  - Constraint `assignment_submissions_assignment_user` present; indexes: `_pkey`, `_assignment_user`, `_assignment_id_idx`.

## Deploy (both services pinned to merge commit)

Railway is GraphQL-only (`Project-Access-Token` header, never Bearer; no Railway CLI — `railway-guard.sh` PreToolUse hook enforces). Deploy via `serviceInstanceDeploy(serviceId, environmentId, commitSha:"07ebda95…", latestCommit:true)` — commitSha PINNED explicitly to avoid the wave-41 stale-snapshot false-green.

| Service | serviceId | new deployment id | prior (rollback anchor) | status |
|---|---|---|---|---|
| api | 7358a103-0a4f-44e6-9468-3d02d045531e | `035be230-66f9-4a7f-b951-751978adece8` | `c9e34766-9919-4ed0-8af8-a98728871817` (commit c032720) | SUCCESS |
| web | 107d4255-422a-4b72-b138-0647f9192fe4 | `ef4fc034-5617-4245-b4c0-4adb865aac04` | `cd6d866b-62d8-4b2d-b6ac-9440a9644228` (commit ac243af) | SUCCESS |

- Deploy-state read from the authoritative Railway `deployments` endpoint (NOT /healthz). Inline-poll BUILDING → DEPLOYING → SUCCESS, both terminal at ~61s.
- **Stale-serve guard:** the SUCCESS deployment ids (`035be230` / `ef4fc034`) are the ones just deployed — serving revision == deployed revision.
- **Rollback path (reachable before + after cutover):** redeploy prior good deployment ids above (api `c9e34766` / commit c032720; web `cd6d866b` / commit ac243af) via `serviceInstanceDeploy` pinned to the prior commit. One action per service; not needed — deploy verified healthy.

## Env-var scoping (verified in target service scope before cutover)

- **api** carries: DATABASE_URL, DATABASE_URL_UNPOOLED, SUPERTOKENS_CONNECTION_URI, SUPERTOKENS_API_KEY, LIVEKIT_API_KEY/SECRET/URL, SESSION_SECRET, AWS_* storage creds. ✓
- **web** carries: only VITE_API_ORIGIN, VITE_LIVEKIT_URL + Railway platform vars — **no DB creds, no server secrets**. ✓ (scoped-secret discipline intact)

## Live verification (post-deploy, authoritative)

| Probe | Pre-deploy | Post-deploy | Verdict |
|---|---|---|---|
| api `GET /health` | 200 | **200** | PASS |
| api `POST /assignments/<uuid>/submit` (unauth) | 404 | **401** | PASS — route registered + auth-guarded |
| api `GET /assignments/<uuid>/submissions` (unauth) | 404 | **401** | PASS — route registered + auth-guarded |
| web `GET /` | 200 | **200** | PASS |
| web served bundle hash | index-L7b3GM-K.js | **index-BCqGLUBX.js** | PASS — new artifact serving |
| web bundle contains submission UI | — | "Submissions" ×14, "Turn in" ×1, submit/submissions refs | PASS — feature present in served JS |

The 404→401 flip proves the new backend routes are live and auth-guarded (not a stale revision). The bundle-hash change + submission-symbol grep prove the served frontend artifact genuinely carries this wave's feature (closes the wave-41 false-green class).

## Canary

DAU below the 1000 threshold → canary skipped. T-block synthetic probes are the post-deploy signal.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 035be230 status SUCCESS, pinned commit 07ebda95; serving revision == deployed revision"
  - "railway web: deployment ef4fc034 status SUCCESS, pinned commit 07ebda95; bundle hash L7b3GM-K → BCqGLUBX (changed), contains Submissions/Turn in"
  - "migration 0019 applied via drizzle-kit migrate; assignment_submissions table+constraints+index confirmed on prod DB"
  - "api https://api-production-b93e.up.railway.app/health: 200"
  - "api POST /assignments/<uuid>/submit: 404→401 (auth-guarded); GET /submissions: 404→401"
  - "web https://web-production-bce1a8.up.railway.app/: 200"
  - "env scoping: api has DB/SuperTokens/LiveKit/SESSION_SECRET; web has no DB creds"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: "07ebda955f54544816e077c128ab0516b579c44c", deployment_id: "035be230-66f9-4a7f-b951-751978adece8", verified_at: "2026-07-04T00:29:00Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: "07ebda955f54544816e077c128ab0516b579c44c", deployment_id: "ef4fc034-5617-4245-b4c0-4adb865aac04", verified_at: "2026-07-04T00:29:00Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (< 1000); T-block synthetic probes are the post-deploy signal."
canary_window:
  start: ""
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
migration_applied: "0019_sturdy_psylocke.sql — assignment_submissions created + verified on prod DB"
rollback_anchors:
  api: {deployment_id: "c9e34766-9919-4ed0-8af8-a98728871817", commit: "c032720cadd8560de4770713be8b92c32b83ec89"}
  web: {deployment_id: "cd6d866b-62d8-4b2d-b6ac-9440a9644228", commit: "ac243afee8e75cdaf45dc0906a4fd4ddee64b0b6"}
note: "Deploy pinned to commitSha explicitly per wave-41 stale-snapshot lesson. Served artifacts verified changed + carrying the fix, not just deploy-status=SUCCESS. Migration applied before code cutover."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Deploy verified via the authoritative Railway deployment-state endpoint (not /healthz):
    both api and web reached SUCCESS on the pinned merge commit 07ebda95, and the serving
    revision equals the deployed revision (no stale-revision race). Migration 0019 was applied
    explicitly and in order via drizzle-kit migrate before code cutover, and assignment_submissions
    is confirmed present on the prod DB. Env-var scoping is correct (api holds DB/SuperTokens/LiveKit
    creds; web holds none). The false-green class is closed: the served web bundle hash changed
    (L7b3GM-K → BCqGLUBX) and contains the submission UI, and the api submit/submissions routes
    flipped 404→401 (registered + auth-guarded). A one-action rollback path to the prior good
    deployment ids is identified for each service. Canary skipped correctly (DAU < 1000 threshold).
  next_action: PROCEED_TO_T-BLOCK
```
