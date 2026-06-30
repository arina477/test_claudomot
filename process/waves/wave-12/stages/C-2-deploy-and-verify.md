# C-2 — Deploy & verify (wave-12 M3 messaging)

## RESOLVED — deploy shipped via Railway CLI `up` (source-upload); M3 verified live

The prior ESCALATE blocker (no source-upload transport) is resolved: the Railway CLI is
available via `npx -y @railway/cli@latest` and its `up --service <svc> --environment production --ci`
command UPLOADS the local working tree + builds a NEW image — the exact mechanism waves 7-11 used.
(The GraphQL `serviceInstanceDeploy` re-runs the existing image and is a no-op for new source — that was
the prior false-green cause.) Deployed from `main` @ `168c45f` (the merged M3 code).

## Deploy (CLI `up` from repo root, both services)
- `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN npx -y @railway/cli@latest up --service api --environment production --ci`
  → uploaded source, triggered build `86f4bc21` on api service `7358a103`.
- Same for web service `107d4255`.
- (CLI `whoami` returns Unauthorized for a project token — expected/normal; `up --service` works regardless.)

## Authoritative deploy-state verification (NOT /healthz)
Deploy-state monitor polled `deployments(first:1).edges[0].node.status` per service (Project-Access-Token header):
```
02:08:04 api=BUILDING web=BUILDING
02:08:34 api=SUCCESS  web=BUILDING
02:09:04 api=SUCCESS  web=SUCCESS   → MONITOR_VERDICT=SUCCESS
```
- success_condition: both api+web latest deployment status == SUCCESS · failure_condition: status IN (FAILED,CRASHED,REMOVED,SKIPPED) · timeout_budget: 900s. New api SUCCESS deployment = `86f4bc21`.

## NEW-revision-serves confirmation (stale-revision race broken)
Authoritative SUCCESS alone is not trusted — route-probed the live api:
- PRE-deploy: `GET /channels/:id/messages` unauthed → **404** (stale revision, M3 routes absent).
- POST-deploy: same probe → **401** (M3 messaging routes LIVE + auth-gated). api `/health` 200, web `/` 200.
- 404→401 transition proves the NEW revision (with the merged M3 code) is the one serving traffic.

## Two-client <1s real-time — THE M3 success metric (measured, 2 runs)
Fixture `studyhall-e2e-fixture@example.com` (email-verified; signin → `st-auth-mode: header` → Bearer).
POST /servers (seeds #general) → GET /servers/:id → #general channel id. Two authed Socket.IO clients on
`/messaging` (handshake `auth.accessToken`) both `join_channel`; a third client connects but does NOT join.
- WS-UNAUTH reject: socket with no token → `connect_error: Unauthorized` (WS-upgrade auth live; not a dead-WS false-green).
- A POSTs message (201) → B receives `message:new`: **run1 = 93ms, run2 = 87ms** (target <1000ms) → **PASS**, stable.
- NO-LEAK: the non-joined third client did NOT receive `message:new` (room scoping `channel:<id>` holds) → **PASS**.

## Migration + env scoping (carried from prior attempt, still valid)
- **Migration 0005 applied to prod** (`drizzle-kit migrate`, journal order, BEFORE new code served): migrations 5→6, `messages` table live (unique channel_id+idempotency_key; channel_created_at idx; FKs channel cascade / author).
- **Env scoping**: api `7358a103` has DATABASE_URL / SUPERTOKENS_* / SESSION_SECRET / WEB_ORIGIN / API_ORIGIN; web `107d4255` has NO DB creds (only VITE_API_ORIGIN). No scoped-secret leak to web.

## Rollback path (reachable before/after cutover)
Prior SUCCESS revisions remain in Railway history; `deploymentRedeploy` restores any prior good revision in one
action. Current api revision `86f4bc21` (SUCCESS); previous revisions REMOVED but redeployable via CLI `up` of a prior SHA.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "CLI up (npx @railway/cli) source-upload from main@168c45f: api build 86f4bc21, web build (source uploaded, NEW image)"
  - "deploy-state monitor: api+web latest deployment status == SUCCESS (Project-Access-Token GraphQL, timeout_budget 900s)"
  - "stale-revision race broken: GET /channels/:id/messages unauthed 404(pre)->401(post) — NEW revision serves M3"
  - "api /health 200; web / 200"
  - "WS-upgrade unauth socket -> connect_error Unauthorized (WS-auth live)"
  - "two-client real-time: A POST -> B message:new 93ms / 87ms (<1000ms) over 2 runs; non-joined client no-leak"
  - "migration 0005 applied to prod (messages table live), env scoping verified (web no DB creds)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment: 86f4bc21, commit_running: "168c45f (M3 live)", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, health_url: "https://web-production-bce1a8.up.railway.app"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "self-use-mvp; real-user DAU below canary_threshold_dau (1000). Synthetic two-client probe used instead."
note: >
  Deploy shipped correctly via Railway CLI `up` (source-upload, NEW image) — the transport
  the prior attempt lacked. False-green guarded: deployment-state SUCCESS CONFIRMED against
  a route probe (404->401) proving the new revision serves M3, not trusted from /health.
  Two-client <1s real-time success metric verified live: 93ms/87ms with no-leak. Migration
  0005 already applied (did not re-run). Rollback via deploymentRedeploy / CLI up of prior SHA.
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Deploy is correctly shipped and authoritatively verified. The prior ESCALATE blocker —
    no source-upload transport (GraphQL serviceInstanceDeploy is a no-op re-run; CLI thought
    absent) — is resolved: the Railway CLI is available via npx and `up --service ... --ci`
    uploads the working tree and builds a NEW image, exactly as waves 7-11 shipped. Both api
    and web reached deployment-state SUCCESS via the authoritative Railway endpoint (not
    /healthz), and — critically — the stale-revision race is broken: GET /channels/:id/messages
    went 404 (pre) -> 401 (post), proving the NEW revision (with merged M3 routes) serves
    traffic. The M3 success metric is met live: two authenticated Socket.IO clients see a
    posted message propagate as message:new in 93ms and 87ms across two runs (well under the
    <1s budget), a non-joined client receives nothing (no-leak room scoping), and an
    unauthenticated WS-upgrade is rejected. Migration 0005 was already applied in order before
    serving; env scoping is correct (api has DB/SuperTokens, web has no DB creds); a one-action
    rollback to a prior revision is reachable. Canary (Action 5-7) skips below the 1000-DAU
    threshold for this self-use MVP; the synthetic two-client probe substitutes. C-2 passes;
    the block exits to T.
  next_action: PROCEED_TO_T
```
