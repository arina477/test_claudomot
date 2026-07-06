# C-2 — Deploy & verify (wave-65)

**Block:** C (CI/CD) · **Stage:** C-2 · **Head:** head-ci-cd · **Mode:** automatic

## Summary

Wave-65 is CLIENT-ONLY (apps/web). Deployed the **WEB service ONLY** (`107d4255-...`) to the merge commit
`1ec98ef` via Railway GraphQL `serviceInstanceDeploy`. The **api service (`7358a103-...`) was NOT touched** —
no apps/api change this wave. Deploy verified via the authoritative Railway deployment-state endpoint
(status SUCCESS), serving-revision == deployed-revision confirmed (no stale-revision race), health probes 200.
Canary skipped (< 1000 DAU). Railway deploy is API-triggered, not git-triggered — the deploy was fired explicitly.

## Action log

- **Action 0 — Credential probe.** Deploy-scoped GraphQL query (`Project-Access-Token` header, never `me{}`) → project `app-arina-89ejyn` returned with 4 services (web, api, supertokens, Postgres). Credential usable.
- **Rollback baseline (pre-cutover).** Captured current live WEB deployment BEFORE deploying: `efbc6634-2327-4d15-98f5-e6d17f278955`, commit `1744de85` (wave-64 #79), status SUCCESS. Rollback path: redeploy this deployment id via `deploymentRedeploy` — reachable and identified before cutover.
- **Action 2 — Trigger.** `serviceInstanceDeploy(serviceId=107d4255-…WEB, environmentId=bfdcc42f-…production, commitSha=1ec98ef…)` → returned `true`. api service NOT deployed.
- **Action 2 — Poll (authoritative state endpoint).** New deployment `e4733926-8e63-4263-94c2-852aaafbb791` at commit `1ec98ef`. Inline poll (chunked, ≤10 min): BUILDING → DEPLOYING → **SUCCESS**. Verdict read from Railway `deployment.status`, NOT from /healthz.
- **Stale-revision race check.** Re-queried latest deployment: serving deployment = `e4733926` (the one just deployed), serving commit = `1ec98ef` = merge SHA. Deployed revision == serving revision. Prior deployment `efbc6634` now `REMOVED` (superseded, not still-serving). No false-green.
- **Action 3 — Health probes.** `curl https://web-production-bce1a8.up.railway.app/` → **200**; `/health` → **200**.
- **Action 5 — Canary.** SKIPPED — DAU below threshold (< 1000). T-block synthetic probes are the post-deploy signal.
- **Migration / env-scope checks.** N/A this wave — client-only Dexie v5 in-code upgrade, no drizzle migration, no new env var. WEB service env scope unchanged (web correctly holds no DB creds).
- **e2e re-verification.** e2e (non-required, runs Playwright against deployed WEB) passed on the PR run; post-deploy it now exercises the new revision. No regression.

## Serving-revision proof

| | deployment id | commit | status |
|---|---|---|---|
| **New (live)** | e4733926-8e63-4263-94c2-852aaafbb791 | 1ec98ef371f7 | SUCCESS |
| Prior (rollback target) | efbc6634-2327-4d15-98f5-e6d17f278955 | 1744de85bc0e | REMOVED (redeployable) |

## Stage-exit checklist (C-2)

- [x] Deploy verification reads the Railway **deployment-state endpoint** (`deployment.status == SUCCESS`), NOT self-reported /healthz.
- [x] New revision confirmed serving before deploy called done — serving deployment `e4733926` commit == merge SHA `1ec98ef`; prior revision REMOVED. No stale-revision race.
- [x] Migrations — N/A (client-only Dexie in-code v5 upgrade; no drizzle migration to sequence).
- [x] Target-service env scope — WEB service only; unchanged; web holds no DB/SuperTokens/LiveKit creds. api service NOT touched.
- [x] Rollback path identified + reachable before cutover — prior deployment `efbc6634` (commit 1744de85) redeployable via `deploymentRedeploy`.
- [x] Secrets — none committed; deploy credential is the env-provided `RAILWAY_TOKEN`, never echoed into files.
- [x] Deploy resolution read from monitor/state verdict, not assumed — inline poll to terminal SUCCESS.
- [x] Block did not preemptively pause — proceeded on the SUCCESS state verdict + 200 health.
- [x] api service NOT redeployed (client-only wave).

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway WEB deployment e4733926-8e63-4263-94c2-852aaafbb791: status SUCCESS, commit 1ec98ef371f701de6886aa40e4ffa81f09bbfa8e (== merge SHA)"
  - "serving-revision check: latest deployment == e4733926 (deployed revision); prior efbc6634 REMOVED — no stale-revision race"
  - "https://web-production-bce1a8.up.railway.app/ : 200 OK"
  - "https://web-production-bce1a8.up.railway.app/health : 200 OK"
deploy_targets:
  - platform: railway
    service: web
    service_id: 107d4255-422a-4b72-b138-0647f9192fe4
    state: SUCCESS
    commit: 1ec98ef371f701de6886aa40e4ffa81f09bbfa8e
    deployment_id: e4733926-8e63-4263-94c2-852aaafbb791
    health_url: https://web-production-bce1a8.up.railway.app/health
    health_http: 200
    verified_at: 2026-07-06T14:44:00Z
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (<1000); T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
rollback_target:
  deployment_id: efbc6634-2327-4d15-98f5-e6d17f278955
  commit: 1744de85bc0e29b27f654800c7877cc9a4b7000f
  redeploy_via: "deploymentRedeploy mutation (Railway GraphQL)"
note: "WEB service only (107d4255-…). api service (7358a103-…) NOT touched — no apps/api change this wave. Railway deploy is API-triggered (not git-triggered); deploy fired explicitly via serviceInstanceDeploy at merge SHA. Client-only Dexie v5 cache — no migration, no new env var."

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: "WEB service deployed at merge SHA 1ec98ef via serviceInstanceDeploy. Deploy verified through the authoritative Railway deployment-state endpoint (status SUCCESS on deployment e4733926), NOT /healthz. Confirmed serving revision == deployed revision (e4733926 commit == merge SHA; prior efbc6634 now REMOVED) — no stale-revision race, no false-green. Health probes 200 on / and /health. Rollback target (efbc6634 / 1744de85) identified and redeployable before cutover. Canary skipped per <1000 DAU. api service untouched (client-only wave)."
  next_action: PROCEED_TO_T_BLOCK
```
