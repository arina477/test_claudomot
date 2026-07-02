# C-2 — Deploy & verify (wave-34, M6 → screen-share + audio-only fallback)

**Wave:** 34 · **Block:** C (CI/CD) · **Stage:** C-2 · **Mode:** automatic
**Merge commit:** `87db7ec6c9e14b6ecb2a0081952d7ca83cf7ab1f` (`87db7ec`, HEAD on main — confirmed synced with origin/main via fetch) — PR #47 "feat: voice screen-share + audio-only fallback (wave-34)"
**Scope:** deploy **BOTH `api` AND `web`** this wave (unlike wave-33's api-only) — the diff spans both services:
- **api** — token grant widened (`canPublishSources += SCREEN_SHARE[+_AUDIO]`) in the VoiceModule token-mint path. MUST redeploy.
- **web** — screen-share tile + audio-only-fallback UI (VoiceStudyRoom rewrite). MUST redeploy.
**Migrations:** NONE this wave (schema-neutral — token-grant widening + client UI; B-block confirmed schema-skip). No drizzle migrate run — correct; nothing to sequence.
**Deploy mechanism:** Railway **CLI-push** (`RAILWAY_TOKEN=$APP_RAILWAY_TOKEN`, `npx @railway/cli up --service <svc> --detach`) — merge-to-main does NOT auto-deploy on this project (MEMORY: Railway deploy is CLI-push not git-trigger). Project-specific override of the generic GraphQL-only monitor template, consistent with wave-33 C-2. CLI v5.23.3.
**Verification authority:** Railway deployment-state endpoint (`railway deployment list --service <svc> --json` → `.[0].status == "SUCCESS"`), NOT /health alone (CI-PRINCIPLES rule 1) + new-revision route-flip probe (CI-PRINCIPLES rule 2).

---

## Railway project context

- Workspace: `claudomat-instances` · Project: `app-arina-89ejyn` (id `ae55c191-4631-4224-b7b2-42f329ed48d7`), env `production` (`bfdcc42f-fe5b-4198-a47a-b08f5940975d`)
- Service ids: `api` = `7358a103-0a4f-44e6-9468-3d02d045531e` · `web` = `107d4255-422a-4b72-b138-0647f9192fe4`
- Public domains: api = `https://api-production-b93e.up.railway.app` · web = `https://web-production-bce1a8.up.railway.app`
- Credential: project-scoped `RAILWAY_TOKEN` (from `$APP_RAILWAY_TOKEN`, 36-char UUID). Authenticates at project scope. Token never printed or committed.

## Pre-deploy baselines (prior good revisions — rollback targets, confirmed reachable BEFORE cutover)

| Service | Prior deployment id | Prior image digest | createdAt |
|---|---|---|---|
| api | `6111a6ab-0b37-429a-ae38-60eef0a3c23c` | `sha256:4fec6143…c51fd4` | 2026-07-02T09:12:38Z |
| web | `c34c3bd1-345d-4104-ab6d-1ad9187fdec5` | `sha256:64686633…2bec61` | 2026-07-02T09:12:40Z |

Both are last-known-good and reachable for rollback BEFORE cutover (Railway `redeploy`/dashboard-redeploy of the prior deployment id). **rollback_ready: true.** (The api baseline `6111a6ab` carries the wave-33 digest `sha256:4fec6143…c51fd4` — the prior good api revision.)

## Env-var scoping (target-service check — verified BEFORE cutover)

- **api** env KEYS (values NOT printed): `API_ORIGIN CROSS_ORIGIN_PROD DATABASE_URL DATABASE_URL_UNPOOLED LIVEKIT_API_KEY LIVEKIT_API_SECRET LIVEKIT_URL RESEND_API_KEY_AUTH SESSION_SECRET SUPERTOKENS_API_KEY SUPERTOKENS_CONNECTION_URI WEB_ORIGIN` + Railway-managed. api holds DB (`DATABASE_URL`/`_UNPOOLED`) + SuperTokens + Session + **LiveKit (`LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL`) — LIVE this session**. The widened token-grant path boots WITH the keys → occupancy/token endpoints fully functional. Correct scope.
- **web** env KEYS: `VITE_API_ORIGIN VITE_LIVEKIT_URL` + Railway-managed. web holds ONLY the client-side LiveKit **URL** (`VITE_LIVEKIT_URL`, not a secret) + api origin. **NO DB creds, NO `LIVEKIT_API_SECRET`** — correct least-scope; the client never receives the secret or DB access (missing-env-var-cutover / scoped-secret-leak check satisfied).
- This wave requires NO new env var (grant widening reads the existing LiveKit keys; UI reads the existing `VITE_*`). No new config, no new secret to set.

## Deploy + deployment-state verification (Actions 1–2)

`railway up --service api --detach` and `railway up --service web --detach` triggered fresh builds for BOTH services at 2026-07-02T12:2x. Inline-polled the AUTHORITATIVE deployment-state endpoint for both (poll cap 10 min, 30s interval). Terminal for both in ~100s: `BUILDING → DEPLOYING → SUCCESS`.

| Service | New deployment id | Deploy-state | New image digest | createdAt | Distinct from prior? |
|---|---|---|---|---|---|
| **api** | `73938bde-0631-4c12-92f1-d9460d6ac550` | **SUCCESS** | `sha256:c38ac4ed…dc8ea161` | 2026-07-02T12:27:10Z | ✅ new id + new digest |
| **web** | `e211f14d-49a0-4a36-bd90-d5c66dd31f1e` | **SUCCESS** | `sha256:d23f0a29…d2a001e4` | 2026-07-02T12:27:13Z | ✅ new id + new digest |

**No stale-revision race (STABLE C-2 check):** each new revision is confirmed the one serving — fresh deployment id AND changed image digest, both distinct from the pre-deploy baseline (api `6111a6ab`/`4fec6143…`; web `c34c3bd1`/`64686633…`). Both `meta.reason: deploy`, `meta.cliCaller: claude_code` — this deploy, not a passive re-serve. Deploy resolved inline (~100s, well under the 10-min cap) — no MONITOR promotion needed.

## Health + behavior route-flip probes (Action 3) — the load-bearing signal

1. **api /health** → `HTTP 200` `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`
   → api boots cleanly on the NEW revision with the widened `canPublishSources` grant AND the live LiveKit keys; a boot crash on the new grant logic or a missing-key crash would fail this.
2. **Route-flip / behavior (CI-PRINCIPLES rule 2 — the load-bearing signal)** — `GET /channels/not-a-uuid/voice/participants` UNAUTHENTICATED → **`HTTP 401`** `{"message":"unauthorised"}`
   → the voice route IS registered on the NEW revision and the auth guard fires FIRST. NOT 500, NOT 404 — exactly the expected new-revision-serving signal.
3. **Control — nonexistent route** `GET /this-route-does-not-exist-xyz` → **`HTTP 404`** → proves the 401 above is route-specific, not a blanket catch-all masking a routing fault.
4. **web root** `GET /` → **`HTTP 200`** → new web revision (screen-share tile + audio-only-fallback UI) is serving.

**Live voice NOT verified at C-2 by design.** The token endpoint now mints grants WITH `SCREEN_SHARE` and the keys are live, but FULL live voice (2-participant screen-share publish + audio-only fallback under poor bandwidth) is the T-block's MANDATORY LIVE-VERIFY job, not C-2's. C-2 proves the new revisions deployed + serve; T proves the feature works end-to-end with real LiveKit media.

## Canary (Actions 5–7)

Skipped — StudyHall pre-launch, 0 DAU below `canary_threshold_dau: 1000` (`project.yaml` + CI-PRINCIPLES `canary.enabled: false`, self-use-mvp). T-block LIVE-VERIFY is the post-deploy behavioral signal.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 73938bde status SUCCESS, digest sha256:c38ac4ed…dc8ea161 (distinct id + digest from prior 6111a6ab / 4fec6143…) — new revision serving, no stale-revision race"
  - "railway web: deployment e211f14d status SUCCESS, digest sha256:d23f0a29…d2a001e4 (distinct id + digest from prior c34c3bd1 / 64686633…) — new revision serving, no stale-revision race"
  - "authoritative deployment-state inline-polled to SUCCESS for BOTH (~100s: BUILDING→DEPLOYING→SUCCESS), NOT /health alone (CI-PRINCIPLES rule 1)"
  - "https://api-production-b93e.up.railway.app/health: 200 {status:ok,service:studyhall-api,version:0.0.1} — clean boot on widened token grant + live LiveKit keys"
  - "route-flip: GET /channels/not-a-uuid/voice/participants unauth -> 401 {message:unauthorised} — guard-first, NOT 500, NOT 404, new revision serves (CI-PRINCIPLES rule 2)"
  - "control: nonexistent route -> 404 (401 is route-specific, not a blanket)"
  - "https://web-production-bce1a8.up.railway.app/ -> 200 — new web revision (screen-share tile + audio-only fallback) serving"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: "73938bde-0631-4c12-92f1-d9460d6ac550", image_digest: "sha256:c38ac4ed205169b1afa95a2b2d0465fa0edfcc4befc62ffdbc816a00dc8ea161", verified_at: "2026-07-02T12:29:00Z", health_url: "https://api-production-b93e.up.railway.app/health", health: "200 ok"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: "e211f14d-49a0-4a36-bd90-d5c66dd31f1e", image_digest: "sha256:d23f0a29088a1377addf2e8ebbab3426848805f437b327ed9f1f5819d2a001e4", verified_at: "2026-07-02T12:29:00Z", health_url: "https://web-production-bce1a8.up.railway.app/", health: "200"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000); StudyHall pre-launch; T-block LIVE-VERIFY is the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: >
  BOTH-service deploy (api + web) via railway up CLI-push (project-specific override of the
  generic GraphQL-only path; both redeployed because the diff spans both — api token-grant
  widening + web VoiceStudyRoom rewrite). No migration this wave (schema-neutral grant + UI
  change) — no drizzle migrate, correct ordering, nothing to sequence. Env scoping verified in
  BOTH target services before cutover: api holds DB/SuperTokens/Session/LiveKit (keys LIVE this
  session — token endpoint fully functional); web holds only VITE_API_ORIGIN + VITE_LIVEKIT_URL,
  NO DB creds and NO LIVEKIT_API_SECRET (least-scope, no secret leak to client). rollback_ready:
  prior good revisions api 6111a6ab (digest 4fec6143…) + web c34c3bd1 (digest 64686633…)
  identified + reachable before cutover. Deploy completed inline (~100s) — no MONITOR promotion.
  Carry-forward: (1) T-block LIVE-VERIFY MANDATORY — 2-participant screen-share publish + audio-only
  fallback under poor-bandwidth (NOT C-2's job); (2) T-8 token-grant re-probe (confirm minted grant
  carries SCREEN_SHARE[+_AUDIO]); (3) N close M6 -> M7.
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
    BOTH services (api + web) deployed via `railway up` CLI-push (project-specific override of
    the generic GraphQL-only path; both redeployed correctly because the wave-34 diff spans both
    — api's canPublishSources token-grant widening AND web's VoiceStudyRoom screen-share/audio-fallback
    rewrite; skipping either would ship a half-revision). Verified on the AUTHORITATIVE Railway
    deployment-state endpoint reading status SUCCESS for both, NOT /health alone (CI-PRINCIPLES rule 1).
    Each new revision is confirmed the one serving via a fresh deployment id AND a changed image
    digest, both distinct from the pre-deploy baseline (api 73938bde/c38ac4ed vs 6111a6ab/4fec6143;
    web e211f14d/d23f0a29 vs c34c3bd1/64686633), with meta.reason=deploy — no stale-revision race
    (the STABLE C-2 check). api /health 200 proves the service booted without crashing on the
    widened grant logic AND with the now-live LiveKit keys; the GET /channels/not-a-uuid/voice/participants
    unauthenticated -> 401 route-flip proves the voice route is served by the new revision and the
    guard fires first — NOT a pre-auth 500 and NOT a 404 (CI-PRINCIPLES rule 2). The nonexistent-route
    404 control confirms the 401 is route-specific, not a blanket. web root 200 confirms the new web
    revision serves. No migration this wave (schema-neutral grant + UI change), so no drizzle migrate —
    correct ordering, nothing to sequence. Env-var scoping verified in BOTH target services before
    cutover: api holds DB/SuperTokens/Session/LiveKit (keys live, endpoint functional); web holds only
    VITE_API_ORIGIN + VITE_LIVEKIT_URL with NO DB creds and NO LIVEKIT_API_SECRET — least-scope, no
    secret leaked to the client. Canary skipped (0 DAU < 1000, pre-launch). Rollback path identified and
    reachable before cutover for both services (api 6111a6ab, web c34c3bd1). Deploy resolved inline in
    ~100s, well under the 10-min cap — no MONITOR promotion. FULL live voice (2-participant screen-share
    + audio-only fallback) is deliberately deferred to the T-block LIVE-VERIFY, which is the correct
    division: C-2 proves the revisions deployed and serve, T proves the feature works end-to-end.
    No measured pause trigger (b/d/e/f) fired; the block did not preemptively pause.
  next_action: PROCEED_TO_T_BLOCK
```
