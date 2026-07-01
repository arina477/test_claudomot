# C-2 — Deploy & verify (wave-31, M6 voice first slice)

**Wave:** 31 · **Block:** C (CI/CD) · **Stage:** C-2 · **Mode:** automatic
**Merge commit:** `ca3d277` (HEAD on main — confirmed ancestor) — "feat: voice study rooms — LiveKit token-mint + join surface (M6) (#44)"
**Scope:** deploy BOTH `api` (VoiceModule token-mint) + `web` (voice-study-room client). No migration this wave (no DB schema change).
**Deploy mechanism:** Railway CLI-push (`railway up --service <svc> --detach`, npx @railway/cli 5.23.3, `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN`) — merge-to-main does NOT auto-deploy on this project (MEMORY: CLI-push not git-trigger).
**Verification authority:** Railway deployment-state GraphQL endpoint (`deployment(id).status == SUCCESS`), NOT /health alone (CI-PRINCIPLES rule 1) + new-route flip probe (rule 2).

---

## Railway project context

- Project: `app-arina-89ejyn` (id `ae55c191-4631-4224-b7b2-42f329ed48d7`), env `production` (`bfdcc42f-...`)
- Service ids: `api` = `7358a103-0a4f-44e6-9468-3d02d045531e` · `web` = `107d4255-422a-4b72-b138-0647f9192fe4`

## Pre-deploy baselines (prior revisions — must be superseded)

| Service | Prior deployment id | Prior image digest | createdAt |
|---|---|---|---|
| api | `a3427ec6-26e8-4562-8b72-6924db56684d` | `sha256:af005097…356dc0` | 2026-07-01T19:49:41Z |
| web | `43210321-8e52-4620-9ba4-2de8849c5ec4` | `sha256:69342bfd…33bfbc` | 2026-07-01T17:54:17Z |

## Deploy + deployment-state verification (Action 2)

`railway up --detach` triggered new builds; inline-polled the deployment-state endpoint (poll cap 10 min) until both reached SUCCESS.

| Service | New deployment id | Deploy-state | New image digest | createdAt | Distinct from prior? |
|---|---|---|---|---|---|
| **api** | `001b3da2-6eb7-44ae-9af6-7066a6366008` | **SUCCESS** (~81s) | `sha256:f738bf07…118652` | 2026-07-01T21:40:37Z | ✅ new id + new digest |
| **web** | `e103384e-2cc9-4676-ad05-52d149ffc70d` | **SUCCESS** (~102s) | `sha256:e9365e02…f85973` | 2026-07-01T21:40:45Z | ✅ new id + new digest |

Both new revisions confirmed serving traffic (no stale-revision race): fresh deployment id AND changed image digest, distinct from the pre-deploy baseline for each service.

## Health + route-flip probes (Action 3)

1. **api /health** → `HTTP 200` `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`
   → api boots the VoiceModule + LiveKit ESM dynamic-import cleanly; a boot crash would fail this.
2. **Route-flip proof (CI-PRINCIPLES rule 2)** — `POST /channels/00000000-0000-0000-0000-000000000000/voice/token` unauthenticated → **`HTTP 401`** `{"message":"unauthorised"}`
   → the new voice route IS registered on the new revision. AuthGuard rejects the unauthenticated request (401). A 404 would have meant the OLD revision without VoiceModule — false-green defeated.
3. **web root `/`** → `HTTP 200` (new revision serving).

## LIVEKIT creds — informational (NOT a deploy failure)

api service env-var set (production): `API_ORIGIN CROSS_ORIGIN_PROD DATABASE_URL DATABASE_URL_UNPOOLED RESEND_API_KEY_AUTH SESSION_SECRET SUPERTOKENS_API_KEY SUPERTOKENS_CONNECTION_URI WEB_ORIGIN` + Railway-managed vars.

`LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` are **absent** — confirmed via GraphQL `variables` query (no key matches `LIVEKIT`). This is **expected**: the token endpoint returns **503 by design** for an *authenticated* request until the founder provides creds. C-2 ships the CODE (verified live via the 401 route-flip above); the live voice-connect is a later verification (T-5/future) once creds are set. Founder heads-up on creds already sent. **NOT a C-2 blocker.**

## Canary (Actions 5–7)

Skipped — 0 DAU is below the `canary_threshold_dau: 1000` in `project.yaml: deploy_targets[]` (and `CI-PRINCIPLES canary.enabled: false`, self-use-mvp). Synthetic health + route-flip probes above are the post-deploy signal.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 001b3da2 status SUCCESS, digest sha256:f738bf07…118652 (distinct from prior a3427ec6 / af005097…)"
  - "railway web: deployment e103384e status SUCCESS, digest sha256:e9365e02…f85973 (distinct from prior 43210321 / 69342bfd…)"
  - "https://api-production-b93e.up.railway.app/health: 200 {status:ok,service:studyhall-api,version:0.0.1}"
  - "route-flip: POST /channels/{uuid}/voice/token unauth -> 401 {message:unauthorised} (voice route registered on NEW revision; not 404)"
  - "https://web-production-bce1a8.up.railway.app/: 200 (new revision)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: "001b3da2-6eb7-44ae-9af6-7066a6366008", image_digest: "sha256:f738bf07392c0fdb815080d91788a50410b8342082a86ad9a35b7a88c4118652", verified_at: "2026-07-01T21:42:40Z", health_url: "https://api-production-b93e.up.railway.app/health", health: "200 ok"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: "e103384e-2cc9-4676-ad05-52d149ffc70d", image_digest: "sha256:e9365e0297f9e94534a8589eb774ffdeca7f2f1a00b84a1678ea5a818f985973", verified_at: "2026-07-01T21:42:40Z", health_url: "https://web-production-bce1a8.up.railway.app/", health: "200"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000); synthetic health + route-flip probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "No migration this wave. LIVEKIT_API_KEY/SECRET/URL absent from api service (verified via GraphQL variables query) — EXPECTED; /voice/token returns 503 by design for authenticated requests until founder provides creds. Deploy ships the CODE (401 route-flip proves route live on new revision); live voice-connect verified later (T-5/future) once creds set. Informational, not blocking. rollback_ready: previous good revisions reachable — api a3427ec6, web 43210321 (railway redeploy to prior deployment id)."
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
    Both api and web deployed via railway up (CLI-push) and verified on the authoritative
    Railway deployment-state endpoint reading status SUCCESS — not /health alone. New revision
    confirmed serving for each service via fresh deployment id AND changed image digest, distinct
    from the pre-deploy baseline (no stale-revision race). api /health 200 proves the VoiceModule +
    LiveKit ESM dynamic-import booted without crashing; the POST /voice/token 401 route-flip proves
    the new voice route is registered on the new revision (a 404 would have exposed a false-green
    old-revision serve). No migration this wave. LIVEKIT_* creds confirmed absent in the api service
    (503-until-creds by design) — an expected founder-pending state, not a deploy failure; the code
    ships and live voice-connect is a later verification. Canary skipped (0 DAU < 1000 threshold).
    Rollback path reachable (prior deployment ids captured). No measured pause trigger fired.
  next_action: PROCEED_TO_T_BLOCK
```
