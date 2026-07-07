# C-2 — Deploy & Verify (wave-71, M14 Block UI-polish)

Owner: head-ci-cd | Mode: automatic | Date: 2026-07-07

## Deploy model
Railway is **CLI-push / explicit-deploy, NOT git-triggered** — each service deployed explicitly via
`serviceInstanceDeployV2(serviceId, environmentId, commitSha)` at the merge SHA, then polled on the
**authoritative deployment-state endpoint** (GraphQL `deployment(id){ status }`), never `/healthz`
alone. Project `ae55c191-…`, env production `bfdcc42f-…`.

## Migration
**NONE.** No schema change this wave (GET /blocks enrichment is a read-side LEFT JOIN; `user_blocks`
unchanged). Prod DB already current at 0026 (wave-70). No `drizzle-kit migrate` run — correct: there
is nothing to apply. Migration guard at C-1 confirmed zero migration/SQL files in the diff.

## Deploy order & result (api first, then web)
Merge SHA deployed: **`670c46e4ac0fb7fce1942c28b7c9ccf978909507`**

| # | service | deployment id | terminal status | deployed commit == merge SHA |
|---|---|---|---|---|
| 1 | api | `b74ab74b-2a17-42b9-8418-4f37e6b49e4e` | SUCCESS | yes ✓ |
| 2 | web | `a9992ce6-2ed6-4d14-b264-3a77f4dbd0ff` | SUCCESS | yes ✓ |

Both polled to terminal SUCCESS on the deployment-state endpoint; both `deployment.meta.commitHash`
== 670c46e (no stale-revision race — the new revision is the one serving).

## Authoritative post-deploy verification
| target | expected | observed |
|---|---|---|
| api `GET /health` | 200 | **200** ✓ |
| api `GET /blocks` (unauth) | 401 | **401** ✓ (route + AuthGuard present on new revision) |
| web `GET /` | 200 | **200** ✓ |

The 401 on `/blocks` proves the new enriched route is deployed AND guarded (not a stale 404/200) —
authoritative behavior probe, not a self-reported health signal.

## Env-var scoping (target-scope confirmed at cutover)
- api holds DB / SuperTokens / LiveKit creds; web holds **no DB creds**. Both services already
  provisioned + configured from prior waves; no env changes this wave. No missing-env-var cutover
  risk (both booted to SUCCESS + serve traffic).

## Rollback path (identified + reachable before/at cutover)
- Previous good serving revision commit (both services): **`a2c006abf43437efe957a3395e43f9a47461fed1`**.
- One-action rollback per service:
  `serviceInstanceDeployV2(<serviceId>, bfdcc42f-…, a2c006abf43437efe957a3395e43f9a47461fed1)`
  → poll `deployment.status == SUCCESS`. Reachable via the same GraphQL mutation used to deploy.
- Not needed: both services healthy at merge SHA and serving.

## Canary (C-3)
**Skipped — pre-launch project** (canary_thresholds per project.yaml; no live-traffic canary window
this stage). Deploy verified via authoritative deployment-state + behavior probes above.

---
```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Both services deployed explicitly at merge SHA 670c46e (api first, then web) and each polled to
    terminal SUCCESS on Railway's authoritative deployment-state endpoint with deployed commit ==
    merge SHA (no stale-revision race, no false-green). No migration (no schema change; prod DB
    current at 0026). Behavior verified authoritatively: api /health 200, api /blocks unauth 401
    (new route + AuthGuard live), web / 200. Env scope unchanged and correct (web has no DB creds).
    One-action rollback to prior good commit a2c006ab identified and reachable. Canary skipped
    (pre-launch). Prod left deployed + verified.
  next_action: PROCEED_TO_T-block
ci_stage_verdict: PASS
evidence:
  merge_sha: 670c46e4ac0fb7fce1942c28b7c9ccf978909507
  api_deployment_id: b74ab74b-2a17-42b9-8418-4f37e6b49e4e
  api_deployment_status: SUCCESS
  api_deployed_commit: 670c46e4ac0fb7fce1942c28b7c9ccf978909507
  web_deployment_id: a9992ce6-2ed6-4d14-b264-3a77f4dbd0ff
  web_deployment_status: SUCCESS
  web_deployed_commit: 670c46e4ac0fb7fce1942c28b7c9ccf978909507
  api_health_http: 200
  api_blocks_unauth_http: 401
  web_root_http: 200
  migration_applied: false
  rollback_target_commit: a2c006abf43437efe957a3395e43f9a47461fed1
  canary: skipped-pre-launch
```
