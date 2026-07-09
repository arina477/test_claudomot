# C-2 — Deploy & Verify (wave-83, security-headers)

```yaml
stage: C-2
wave: 83
owner: head-ci-cd
ci_stage_verdict: PASS
verdict_source: railway
deploy_targets:
  - service: api
    service_id: 7358a103-0a4f-44e6-9468-3d02d045531e
    environment: production (bfdcc42f-fe5b-4198-a47a-b08f5940975d)
    deployment_id: 2ac4fd16-3798-41aa-aa25-d1fdf45058c1
    commit_sha: dd24a7d61f632a5206193cebf4695751953fae5e
    status: SUCCESS
    live_url: https://api-production-b93e.up.railway.app
    migration: none (config-only helmet middleware change)
  # web service NOT deployed — API-only change, frontend-less
canary_status: skipped   # self-use MVP, <1000 DAU (per project canary policy)
reverted: false
rollback_target: 4827e590-3c62-45b0-bb14-2f4555c38725   # prior SUCCESS deploy, captured pre-deploy

ci_on_main_context: >
  GitHub CI runners in transient outage; CI-on-main queued (not blocking).
  Deploy proceeded on B-6-APPROVED + CI-identical local validation + adversarial review.
  The IMMEDIATE post-deploy LIVE cross-origin probe (below, step 4d) is the operative
  gate for the load-bearing cross-origin-CORS-survival risk given CI is down.

verdict_evidence:
  deploy:
    trigger: serviceInstanceDeploy(environmentId, serviceId, commitSha=dd24a7d6)
    poll: BUILDING -> DEPLOYING -> SUCCESS (~4-5 min), terminal SUCCESS
    deployment_id: 2ac4fd16-3798-41aa-aa25-d1fdf45058c1

  # 4a — security headers PRESENT (probed GET /health -> 200)
  headers_present:
    strict-transport-security: "max-age=15552000; includeSubDomains"   # PASS
    x-content-type-options: "nosniff"                                   # PASS
    x-frame-options: "DENY"                                             # PASS
    referrer-policy: "strict-origin-when-cross-origin"                  # PASS (strict)

  # 4b — X-Powered-By GONE
  x_powered_by: ABSENT   # PASS (not in any probed response)

  # 4c — fence intact (helmet defaults that must NOT be emitted)
  fence_absent:
    content-security-policy: ABSENT          # PASS
    cross-origin-resource-policy: ABSENT     # PASS
    cross-origin-embedder-policy: ABSENT     # PASS
    cross-origin-opener-policy: ABSENT       # PASS
    origin-agent-cluster: ABSENT             # PASS

  # 4d — CROSS-ORIGIN CREDENTIALED FLOW (the whole risk) — LOAD-BEARING GATE
  cross_origin_cors_survival: PASS
    preflight_dm_conversations:   # OPTIONS, Origin=web, ACRM=GET -> 204
      access-control-allow-origin: "https://web-production-bce1a8.up.railway.app"   # survived
      access-control-allow-credentials: "true"                                      # survived
      access-control-allow-methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
      access-control-allow-headers: "content-type,rid,fdi-version,anti-csrf,authorization,st-auth-mode"
    preflight_servers:            # OPTIONS, Origin=web, ACRM=GET -> 204
      access-control-allow-origin: "https://web-production-bce1a8.up.railway.app"   # survived
      access-control-allow-credentials: "true"                                      # survived
    plain_get_dm_conversations:   # GET, Origin=web -> 401 (no session, expected)
      access-control-allow-origin: "https://web-production-bce1a8.up.railway.app"   # survived
      access-control-allow-credentials: "true"                                      # survived
    plain_get_servers:            # GET, Origin=web -> 401 (no session, expected)
      access-control-allow-origin: "https://web-production-bce1a8.up.railway.app"   # survived
      access-control-allow-credentials: "true"                                      # survived
    conclusion: helmet did NOT clobber CORS; web->api credentialed flow intact.

  # 4e — 429 body generic (best-effort, triggered)
  throttler_429_body: PASS
    triggered: "GET /servers x10 (limit=10/60s) -> 429 on request 10"
    body: '{"statusCode":429,"message":"Too Many Requests"}'   # no "ThrottlerException" leak

revert_decision: NOT NEEDED (4d PASS — cross-origin CORS survived; new revision left live)

notes:
  - Canary skipped per policy (self-use MVP, <1000 DAU).
  - CI-on-main still pending due to GitHub runner outage; live probe is operative gate.
  - Coexistence confirmed: security headers present ON preflight + credentialed responses simultaneously.
```

## Summary

Deployed the **api** service only (frontend-less, config-only helmet change, no migration) at main HEAD `dd24a7d6`. Deployment `2ac4fd16-3798-41aa-aa25-d1fdf45058c1` reached **SUCCESS**.

All live post-deploy probes **PASS**:
- Security headers present (HSTS, nosniff, X-Frame-Options DENY, strict referrer-policy)
- X-Powered-By removed
- Fence intact (no CSP / CORP / COEP / COOP / origin-agent-cluster)
- **Cross-origin credentialed flow survived** (the load-bearing risk) — ACAO=web-origin + ACAC=true present on preflight AND credentialed GET for `/dm/conversations` and `/servers`; helmet did not clobber CORS
- 429 body generic (no ThrottlerException leak)

**No revert.** Rollback target `4827e590-...` captured but not used. CI-on-main pending (GitHub runner outage); the live cross-origin probe is the operative gate.

**Verdict: PASS.**
