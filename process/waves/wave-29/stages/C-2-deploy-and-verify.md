# C-2 — Deploy & verify (wave-29)

**Merge commit:** `fd03d27` (PR #42 — presence/members code-debt cleanup: displayName `??`→`||` guard + dead `ServerMembers` wrapper schema delete)
**Deploy mechanism:** Railway CLI image-push (`railway up`) — NOT git-trigger. Merge to `main` does NOT auto-deploy. Confirmed by prior-deploy `meta.cliCaller: "claude_code"` and MEMORY carry.
**CLI availability:** no `railway` binary on PATH; resolved via `npx @railway/cli@latest` (v5.23.3). Project token authenticated the CLI against project `ae55c191` / env `production`.
**Mode:** automatic. No pause trigger fired during the stage.

## Action 0 — Credential

Railway project-scoped token present (`$APP_RAILWAY_TOKEN` → exported `RAILWAY_TOKEN`), project `ae55c191-4631-4224-b7b2-42f329ed48d7`. Deploy-scoped GraphQL probe (`project(id:){ services }`) returned `data.project` with no `errors` → **credential usable**. CLI `status` resolved both target services Online. Not paused.

## Action 1 — Targets enumerated

| Service | Service ID | Public URL |
|---|---|---|
| api | `7358a103-0a4f-44e6-9468-3d02d045531e` | https://api-production-b93e.up.railway.app |
| web | `107d4255-422a-4b72-b138-0647f9192fe4` | https://web-production-bce1a8.up.railway.app |

Both deployed this wave (per task scope): api = required runtime change (displayName guard); web = commit-consistency redeploy (shared package changed — dead schema deleted from `packages/shared`; ZERO web consumers of the deleted export → web runtime behavior unchanged, redeployed so web serves `fd03d27` rather than the prior revision).

**No migration** — no DB schema change this wave. `drizzle-kit migrate` deliberately NOT run.

## Pre-deploy baseline (rollback targets)

| Service | Prior SUCCESS deployment (rollback target) | Baseline health |
|---|---|---|
| api | `48c515e9-cfb8-41db-9a76-5ab07dd7741b` (2026-07-01T16:42Z) | `/health` 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| web | `328b1ae9-4e7d-41cc-80cb-a4925160782f` (2026-07-01T15:03Z) | root 200, 888 bytes |

Rollback path (reachable, one action): `deploymentRedeploy(id:<prior-SUCCESS-id>)` GraphQL mutation, or CLI `railway redeploy`, per service. Confirmed reachable before cutover.

## Env-var scoping (verified before cutover)

- **api** — full required set present: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SUPERTOKENS_CONNECTION_URI`, `SUPERTOKENS_API_KEY`, `SESSION_SECRET`, `RESEND_API_KEY_AUTH`, `WEB_ORIGIN`, `API_ORIGIN`, `CROSS_ORIGIN_PROD`. (No LiveKit vars — LiveKit not in this wave's scope; not a code-debt-cleanup blocker.)
- **web** — NO DB creds. Only `VITE_API_ORIGIN` + Railway platform vars. Correct scope (web must not receive DB creds). ✓

## Action 2 — Per-service deploy verification (authoritative deployment-state endpoint)

Verified via Railway GraphQL `deployments(first:1){ node { status } }` — the authoritative deployment-state endpoint — NOT `/health` alone. False-green prevention: the CLI's "Deploy complete" was corroborated by a fresh SUCCESS deployment id + new image digest created post-trigger, not trusted on its own.

| Service | New deployment id | State | Image digest (deploy-state meta) | Result |
|---|---|---|---|---|
| api | `b3024f68-f7ee-414f-b1de-ade4e792f959` | **SUCCESS** | `sha256:8f4e20ca…dbe7ba0` | new revision, distinct from prior `48c515e9` |
| web | `43210321-8e52-4620-9ba4-2de8849c5ec4` | **SUCCESS** | `sha256:69342bfd…33bfbc` | new revision, distinct from prior `328b1ae9` |

Both new deployment ids were created *after* their respective `railway up` triggers → stale-revision race excluded; the new revision is the one serving traffic.

## Action 3 — Health probes (post-deploy)

- **api** `/health` → HTTP 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`; 3× repeat probes 200 (~0.10s). New revision serving (confirmed via deployment-state hash freshness; `/health` body carries no uptime field, so serving-revision freshness is proven by the authoritative new-deployment id + digest, per Action 2/3 spec).
- **web** root `/` → HTTP 200, 888 bytes; 3× repeat probes 200 (~0.11s).

**api behavior spot-check:** members endpoint (`GET /servers/:id/members`) wire is UNCHANGED (bare `ServerMember[]`) — no new route to probe. The displayName `??`→`||` fix is an internal read-path guard; empty-local-part behavior is covered deterministically by the integration/unit suites (T-block). No live construction of an empty-local-part member performed — correct per spec.

## Action 4 — Async handoff

Not needed. Both `railway up` builds completed inline (exit 0) and both reached SUCCESS on the first deployment-state poll (`t+0s`). No MONITOR task spawned; no HOLD.

## Action 5–7 — Canary

**SKIPPED.** Real-user traffic 0 (pre-launch) < `canary_threshold_dau: 1000`. T-block synthetic probes are the post-deploy signal.

## Both served fd03d27?

Yes. `railway up` builds from the working tree at HEAD = `fd03d27` (the only commit on `main`; verified `git rev-parse HEAD` = `fd03d27d0b12…` immediately before each deploy). Both services now serve merge commit `fd03d27` consistently.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment b3024f68 status SUCCESS (deployment-state endpoint), digest sha256:8f4e20ca, distinct from prior 48c515e9"
  - "railway web: deployment 43210321 status SUCCESS (deployment-state endpoint), digest sha256:69342bfd, distinct from prior 328b1ae9"
  - "api-production-b93e.up.railway.app/health: 200 {\"status\":\"ok\",\"service\":\"studyhall-api\",\"version\":\"0.0.1\"}"
  - "web-production-bce1a8.up.railway.app/: 200, 888 bytes"
deploy_targets:
  - platform: railway
    service: api
    state: SUCCESS
    deployment_id: b3024f68-f7ee-414f-b1de-ade4e792f959
    commit: fd03d27
    verified_at: 2026-07-01T17:54:00Z
    health_url: https://api-production-b93e.up.railway.app/health
    rollback_target: 48c515e9-cfb8-41db-9a76-5ab07dd7741b
  - platform: railway
    service: web
    state: SUCCESS
    deployment_id: 43210321-8e52-4620-9ba4-2de8849c5ec4
    commit: fd03d27
    verified_at: 2026-07-01T17:56:00Z
    health_url: https://web-production-bce1a8.up.railway.app/
    rollback_target: 328b1ae9-4e7d-41cc-80cb-a4925160782f
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 pre-launch < 1000); T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "Railway deploy is CLI image-push (railway up via npx @railway/cli), not git-trigger. Both services (api required, web commit-consistency) deployed + verified via authoritative deployment-state endpoint serving fd03d27. No migration (no schema change). Env scope confirmed: api has DB/SuperTokens creds, web has none. Rollback targets recorded + reachable via deploymentRedeploy."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Both configured Railway services deployed via the correct CLI image-push mechanism
    (railway up) and each verified through the authoritative deployment-state endpoint —
    a fresh SUCCESS deployment id with a new image digest created post-trigger, not a
    self-reported /healthz. Stale-revision race excluded; new revision is serving. Health
    probes 200 on both. Env-var scope correct (api holds DB/SuperTokens creds; web holds
    none). No migration was needed and none was run. Rollback targets (prior SUCCESS
    deployments per service) recorded and reachable before cutover. Canary correctly
    skipped (0 DAU pre-launch, below the 1000 threshold). No false-green: the CLI
    "Deploy complete" was corroborated by the platform's deployment-state, not trusted alone.
  next_action: PROCEED_TO_T-block
```
