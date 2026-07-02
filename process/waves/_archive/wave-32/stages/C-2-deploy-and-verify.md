# C-2 — Deploy & verify (wave-32, M6 voice occupancy — who's-in-room indicator)

**Wave:** 32 · **Block:** C (CI/CD) · **Stage:** C-2 · **Mode:** automatic
**Merge commit:** `45b08c3237dfdddc11b665cf060b85782232d4a9` (`45b08c3`, HEAD on main — confirmed synced with origin/main) — "feat: pre-join voice occupancy (who's-in-room) for wave-32 (#45)"
**Scope:** deploy BOTH `api` (@studyhall/api — new voice-participants endpoint) + `web` (@studyhall/web — occupancy indicator + hook).
**Migrations:** NONE this wave (B-0 schema-skip, inline DTO). No drizzle migrate run — correct.
**Deploy mechanism:** Railway **CLI-push** (`npx @railway/cli up --service <svc> --detach`, `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN`) — merge-to-main does NOT auto-deploy on this project (MEMORY: CLI-push not git-trigger). Project override supersedes the generic GraphQL-only monitor template.
**Verification authority:** Railway deployment-state endpoint (`railway deployment list --json --service <svc>` → `.[0].status == "SUCCESS"`), NOT /health alone (CI-PRINCIPLES rule 1) + new-route flip probe (CI-PRINCIPLES rule 2).

---

## Railway project context

- Workspace: `claudomat-instances` · Project: `app-arina-89ejyn` (id `ae55c191-4631-4224-b7b2-42f329ed48d7`), env `production` (`bfdcc42f-fe5b-4198-a47a-b08f5940975d`)
- Service ids: `api` = `7358a103-0a4f-44e6-9468-3d02d045531e` · `web` = `107d4255-422a-4b72-b138-0647f9192fe4`
- Public domains: api = `https://api-production-b93e.up.railway.app` · web = `https://web-production-bce1a8.up.railway.app`
- Databases: Postgres (`postgres-volume`) Online · supertokens (Postgres) Online
- Credential: project-scoped `RAILWAY_TOKEN` — `whoami` returns Unauthorized (expected for a project token), but `railway status` / `deployment list` / `up` authenticate at project scope. Not a "no access" condition (per ci-cd.md § bring-your-own credential).

## Pre-deploy baselines (prior good revisions — rollback targets, must be superseded)

| Service | Prior deployment id | Prior image digest | createdAt |
|---|---|---|---|
| api | `001b3da2-6eb7-44ae-9af6-7066a6366008` | `sha256:f738bf07…118652` | 2026-07-01T21:40:37Z |
| web | `e103384e-2cc9-4676-ad05-52d149ffc70d` | `sha256:e9365e02…f85973` | 2026-07-01T21:40:45Z |

These are the wave-31 deployments — confirmed last-known-good and reachable for rollback.

## Deploy + deployment-state verification (Action 2)

`railway up --service <svc> --detach` triggered new builds for both services; inline-polled the authoritative deployment-state endpoint (poll cap 10 min) until both reached SUCCESS. Both terminal in ~70s (BUILDING → DEPLOYING → SUCCESS).

| Service | New deployment id | Deploy-state | New image digest | createdAt | Distinct from prior? |
|---|---|---|---|---|---|
| **api** | `750f1b10-ab1a-49fe-890c-4c87f7d44506` | **SUCCESS** | `sha256:ed9471c5…ed4a9d` | 2026-07-01T23:29:06Z | ✅ new id + new digest |
| **web** | `79d95931-f287-482e-b4bc-a0f66b5fd3bf` | **SUCCESS** | `sha256:cf822a61…c43340` | 2026-07-01T23:29:12Z | ✅ new id + new digest |

Both new revisions confirmed serving traffic (no stale-revision race): fresh deployment id AND changed image digest, distinct from the pre-deploy baseline for each service.

## Health + route-flip probes (Action 3)

1. **api /health** → `HTTP 200` `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`
   → api boots cleanly on the new revision; a boot crash would fail this.
2. **Route-flip proof (CI-PRINCIPLES rule 2 — the real signal)** — `GET /channels/smoke-test/voice/participants` unauthenticated → **`HTTP 401`** `{"message":"unauthorised"}` (also confirmed 401 on a uuid-shaped channel id `00000000-…`)
   → the NEW voice-participants route IS registered on the NEW revision. The auth guard rejects the unauthenticated request (401). A **404** would have meant the OLD revision without the new endpoint — false-green defeated.
3. **web root `/`** → `HTTP 200` (new revision serving).

## LIVEKIT creds — informational (NOT a deploy failure)

api service env-var keys (production, values redacted): `API_ORIGIN CROSS_ORIGIN_PROD DATABASE_URL DATABASE_URL_UNPOOLED RESEND_API_KEY_AUTH SESSION_SECRET SUPERTOKENS_API_KEY SUPERTOKENS_CONNECTION_URI WEB_ORIGIN` + Railway-managed vars.

`LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` are **absent** — confirmed via `railway variables --service api --json` (LIVEKIT key count: 0). This is **expected**: the occupancy endpoint is a credential-independent build and returns **503 by design** for an *authenticated* request until the founder provides creds. C-2 ships the CODE (verified live via the 401 route-flip above); the live occupancy verification is deferred to T-block / when the founder supplies keys. Not attempting to set LiveKit keys (founder-supplied account credentials). Env-var scoping correct: api holds DB/SuperTokens/Session; web holds no DB creds. **NOT a C-2 blocker.**

## Canary (Actions 5–7)

Skipped — StudyHall is pre-launch, 0 DAU is below the `canary_threshold_dau: 1000` in `project.yaml: deploy_targets[]` (and `CI-PRINCIPLES canary.enabled: false`, self-use-mvp). T-block synthetic probes are the post-deploy signal.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 750f1b10 status SUCCESS, digest sha256:ed9471c5…ed4a9d (distinct from prior 001b3da2 / f738bf07…)"
  - "railway web: deployment 79d95931 status SUCCESS, digest sha256:cf822a61…c43340 (distinct from prior e103384e / e9365e02…)"
  - "https://api-production-b93e.up.railway.app/health: 200 {status:ok,service:studyhall-api,version:0.0.1}"
  - "route-flip: GET /channels/smoke-test/voice/participants unauth -> 401 {message:unauthorised} (voice-participants route registered on NEW revision; not 404)"
  - "https://web-production-bce1a8.up.railway.app/: 200 (new revision)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: "750f1b10-ab1a-49fe-890c-4c87f7d44506", image_digest: "sha256:ed9471c5ff9704ef720326fccecc2f479b9837a0353c92618fb030dbc2ed4a9d", verified_at: "2026-07-01T23:30:30Z", health_url: "https://api-production-b93e.up.railway.app/health", health: "200 ok"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: "79d95931-f287-482e-b4bc-a0f66b5fd3bf", image_digest: "sha256:cf822a618905b83b035bc24b5c6d5f3930273cd3788b784ad9325a8ec1c43340", verified_at: "2026-07-01T23:30:30Z", health_url: "https://web-production-bce1a8.up.railway.app/", health: "200"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000); StudyHall pre-launch; T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "No migration this wave (B-0 schema-skip, inline DTO). LIVEKIT_API_KEY/SECRET/URL absent from api service (verified via `railway variables --service api --json`, LIVEKIT key count 0) — EXPECTED; occupancy endpoint returns 503 by design for authenticated requests until founder provides creds. Deploy ships the CODE (401 route-flip proves the voice-participants route live on the new revision); live occupancy verified later (T-block/future) once creds set. Informational, not blocking. Env scoping correct: web has no DB creds. rollback_ready: previous good revisions reachable — api 001b3da2, web e103384e (railway deployment redeploy / up to prior revision)."
```

---

## head-ci-cd sign-off

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Both api and web deployed via `railway up` (CLI-push, project-specific override of the
    generic GraphQL-only path) and verified on the AUTHORITATIVE Railway deployment-state
    endpoint reading status SUCCESS — not /health alone (CI-PRINCIPLES rule 1). New revision
    confirmed serving for each service via fresh deployment id AND changed image digest,
    distinct from the pre-deploy baseline (no stale-revision race — the STABLE C-2 check).
    api /health 200 proves the service booted without crashing; the GET
    /channels/{id}/voice/participants unauthenticated -> 401 route-flip proves the new
    voice-participants route + auth guard are registered on the new revision (a 404 would have
    exposed a false-green old-revision serve — CI-PRINCIPLES rule 2). No migration this wave
    (B-0 schema-skip), so no drizzle migrate — correct ordering, nothing to sequence.
    Env-var scoping verified in the target service: api holds DB/SuperTokens/Session; web holds
    no DB creds. LIVEKIT_* creds confirmed absent in the api service (503-until-creds by design)
    — an expected founder-pending state, not a deploy failure; the code ships and live occupancy
    is a later verification. Canary skipped (0 DAU < 1000 threshold, pre-launch). Rollback path
    reachable and identified before this deliverable closes (prior deployment ids api 001b3da2 /
    web e103384e). No measured pause trigger (b/d/e/f) fired.
  next_action: PROCEED_TO_T_BLOCK
```
