# C-2 — Deploy & verify (wave-33, M6 hardening — malformed-UUID route param → 400)

**Wave:** 33 · **Block:** C (CI/CD) · **Stage:** C-2 · **Mode:** automatic
**Merge commit:** `e1a64f6bbc26aeb47e2f3cf2e2bed624a5c9d965` (`e1a64f6`, HEAD on main — confirmed synced with origin/main via fetch) — PR #46 "fix: malformed UUID route param returns 400 not 500 (wave-33)"
**Scope:** deploy **`api` ONLY** (@studyhall/api — SupertokensExceptionFilter extension: 22P02 → 400 across 7 controllers, from F-32-T-8-1). Diff is api-only (pg-error-utils.ts + auth.exception.filter.ts + integration spec). **`web` NOT redeployed** (unchanged this wave — redeploying it is wasted work + needless risk).
**Migrations:** NONE this wave (schema-neutral error-mapping change; B-0 schema-skip confirmed by C-1). No drizzle migrate run — correct; nothing to sequence.
**Deploy mechanism:** Railway **CLI-push** (`RAILWAY_TOKEN=$APP_RAILWAY_TOKEN`, `npx @railway/cli up --service api --detach`) — merge-to-main does NOT auto-deploy on this project (MEMORY: CLI-push not git-trigger). Project override supersedes the generic GraphQL-only monitor template. CLI v5.23.3.
**Verification authority:** Railway deployment-state endpoint (`railway deployment list --service api --json` → `.[0].status == "SUCCESS"`), NOT /health alone (CI-PRINCIPLES rule 1) + new-behavior route-flip probe (CI-PRINCIPLES rule 2).

---

## Railway project context

- Workspace: `claudomat-instances` · Project: `app-arina-89ejyn` (id `ae55c191-4631-4224-b7b2-42f329ed48d7`), env `production` (`bfdcc42f-fe5b-4198-a47a-b08f5940975d`)
- Service ids: `api` = `7358a103-0a4f-44e6-9468-3d02d045531e` · `web` = `107d4255-422a-4b72-b138-0647f9192fe4` (web untouched this wave)
- Public domain: api = `https://api-production-b93e.up.railway.app`
- Credential: project-scoped `RAILWAY_TOKEN` (from `$APP_RAILWAY_TOKEN`, 36-char UUID). `railway status` / `deployment list` / `up` authenticate at project scope (not a "no access" condition per ci-cd.md § bring-your-own credential). Token never printed or committed.

## Pre-deploy baseline (prior good revision — rollback target, MUST be superseded)

| Service | Prior deployment id | Prior image digest | createdAt |
|---|---|---|---|
| api | `750f1b10-ab1a-49fe-890c-4c87f7d44506` | `sha256:ed9471c5…ed4a9d` | 2026-07-01T23:29:06Z |

This is the wave-32 api deployment — confirmed last-known-good and reachable for rollback BEFORE cutover (`railway up`/redeploy to prior revision, or Railway dashboard redeploy of `750f1b10`). **rollback_ready: true.** (web baseline `79d95931` remains the serving web revision — untouched.)

## Deploy + deployment-state verification (Action 2)

`railway up --service api --detach` triggered a new build for the api service ONLY at 2026-07-02T01:34:28Z (new deployment id `d69feba2-7076-4955-82d3-ccd467d9f619`). Inline-polled the AUTHORITATIVE deployment-state endpoint (poll cap 10 min, 20s interval). Terminal in ~86s: `BUILDING → BUILDING → BUILDING → DEPLOYING → SUCCESS`.

| Service | New deployment id | Deploy-state | New image digest | createdAt | Distinct from prior? |
|---|---|---|---|---|---|
| **api** | `d69feba2-7076-4955-82d3-ccd467d9f619` | **SUCCESS** | `sha256:4fec6143…c51fd4` | 2026-07-02T01:34:30Z | ✅ new id + new digest |

**No stale-revision race (STABLE C-2 check):** the new revision is confirmed the one serving — fresh deployment id AND changed image digest, both distinct from the pre-deploy baseline (`750f1b10` / `ed9471c5…`). `cliCaller: claude_code`, `reason: deploy` — this deploy, not a passive re-serve.

## Health + behavior route-flip probes (Action 3) — the real signal

1. **api /health** → `HTTP 200` `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`
   → api boots cleanly on the NEW revision with the extended SupertokensExceptionFilter; a boot crash on the new filter would fail this.
2. **Route-flip / behavior (CI-PRINCIPLES rule 2 — the load-bearing signal)** — `GET /channels/not-a-uuid/voice/participants` UNAUTHENTICATED → **`HTTP 401`** `{"message":"unauthorised"}`
   → the route IS registered on the NEW revision and the auth guard fires FIRST (guard-first): the malformed-UUID param does **NOT** produce a 500 pre-auth. NOT 500, NOT 404 — exactly the target behavior.
3. **Control — nonexistent route** `GET /this-route-does-not-exist-xyz` → **`HTTP 404`** `{"error":"Not Found"}` → proves the 401 above is route-specific, not a blanket catch-all masking a routing fault.
4. **Control — uuid-shaped-but-nonexistent channel, unauth** `GET /channels/00000000-…/voice/participants` → **`HTTP 401`** → guard-first behavior consistent for both malformed and valid-shaped ids (guard fires before any DB lookup, as designed).

**Authed-malformed → 400 path:** CI-verified — the 10 real-DB integration tests (`malformed-uuid-params.spec.ts`, Part A 6 + Part B 4) RAN and PASSED against the `postgres:16` service in PR #46 (C-1 false-green guard satisfied). Not reproduced live without a session cookie; the live 401 route-flip + CI 22P02→400 proof together cover the behavior.

## Env-var scoping (target-service check)

api service env-var KEYS (production, values NOT printed): `API_ORIGIN CROSS_ORIGIN_PROD DATABASE_URL DATABASE_URL_UNPOOLED RESEND_API_KEY_AUTH SESSION_SECRET SUPERTOKENS_API_KEY SUPERTOKENS_CONNECTION_URI WEB_ORIGIN` + Railway-managed vars. api holds DB (`DATABASE_URL`/`_UNPOOLED`) + SuperTokens (`SUPERTOKENS_CONNECTION_URI`/`_API_KEY`) + `SESSION_SECRET` — correct scope. **This schema-neutral filter-extension requires NO new env var** (no new config, no new secret). LIVEKIT_* remain absent — expected, not this wave's concern, not a blocker.

## Canary (Actions 5–7)

Skipped — StudyHall pre-launch, 0 DAU below `canary_threshold_dau: 1000` (`project.yaml` + CI-PRINCIPLES `canary.enabled: false`, self-use-mvp). T-block synthetic probes are the post-deploy signal.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment d69feba2 status SUCCESS, digest sha256:4fec6143…c51fd4 (distinct id + digest from prior 750f1b10 / ed9471c5…) — new revision serving, no stale-revision race"
  - "authoritative deployment-state polled to SUCCESS (~86s: BUILDING→DEPLOYING→SUCCESS), NOT /health alone (CI-PRINCIPLES rule 1)"
  - "https://api-production-b93e.up.railway.app/health: 200 {status:ok,service:studyhall-api,version:0.0.1} — clean boot on new filter"
  - "route-flip: GET /channels/not-a-uuid/voice/participants unauth -> 401 {message:unauthorised} — guard-first, NOT 500, NOT 404 (CI-PRINCIPLES rule 2)"
  - "controls: nonexistent route -> 404 (401 is route-specific); uuid-shaped unauth -> 401 (guard-first consistent)"
  - "authed-malformed->400 CI-proven: malformed-uuid-params.spec.ts 10 real-DB tests passed in PR #46"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: "d69feba2-7076-4955-82d3-ccd467d9f619", image_digest: "sha256:4fec6143ff568db628e0c2cace6d240674faace9e3c70539b4f4a187e2c51fd4", verified_at: "2026-07-02T01:36:10Z", health_url: "https://api-production-b93e.up.railway.app/health", health: "200 ok"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000); StudyHall pre-launch; T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "api-ONLY deploy (diff is api-only; web NOT redeployed — unchanged, avoids wasted work + risk). No migration this wave (schema-neutral filter extension) — no drizzle migrate, correct ordering, nothing to sequence. Env scoping correct in target service: api holds DB/SuperTokens/Session; no new env var required by this change. rollback_ready: prior good api revision 750f1b10 (digest ed9471c5…) identified + reachable before cutover. Deploy completed inline (~86s) — no MONITOR promotion needed (well under 10-min cap). N-block park-or-key MANDATORY for task a2dd9f3d (carried from C-1)."
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
    api-ONLY deploy via `railway up --service api` (CLI-push, project-specific override of the
    generic GraphQL-only path; web correctly NOT redeployed since the diff is api-only —
    avoids wasted work and needless risk). Verified on the AUTHORITATIVE Railway
    deployment-state endpoint reading status SUCCESS, not /health alone (CI-PRINCIPLES rule 1).
    The new revision is confirmed the one serving via a fresh deployment id (d69feba2) AND a
    changed image digest (sha256:4fec6143…), both distinct from the pre-deploy baseline
    (750f1b10 / ed9471c5…) — no stale-revision race (the STABLE C-2 check). api /health 200
    proves the service booted without crashing on the extended SupertokensExceptionFilter; the
    GET /channels/not-a-uuid/voice/participants unauthenticated -> 401 route-flip proves the
    route is served by the new revision AND the guard fires first — the malformed-UUID param is
    NOT a pre-auth 500 and NOT a 404 (CI-PRINCIPLES rule 2). Controls confirm the signal is
    genuine: a nonexistent route returns 404 (401 is route-specific, not a blanket) and a
    uuid-shaped unauth request is also 401 (guard-first consistent). The authed-malformed->400
    behavior is CI-proven by the 10 real-DB integration tests that RAN in PR #46 (C-1
    false-green guard satisfied) — the correct division of live vs CI verification for an
    auth-gated path. No migration this wave (schema-neutral), so no drizzle migrate — correct
    ordering, nothing to sequence. Env-var scoping verified in the target service: api holds
    DB/SuperTokens/Session and this change requires no new env var. Canary skipped (0 DAU < 1000,
    pre-launch). Rollback path identified and reachable before cutover (prior good api revision
    750f1b10). Deploy resolved inline in ~86s, well under the 10-min cap — no MONITOR promotion
    needed. No measured pause trigger (b/d/e/f) fired; the block did not preemptively pause.
  next_action: PROCEED_TO_T_BLOCK
```
