# C-2 — Deploy & verify (wave-17) — NO-DEPLOY

> Block C (CI/CD), spawn-pattern. head-ci-cd owns the block. Mode: automatic.

## No-deploy rationale

This is a **TEST-ONLY wave**. The merged diff (PR #29 → `dfb65ca`) contains:
- `apps/api/test/integration/{pg-harness.ts, create-server-rollback.spec.ts}` (new test code)
- `apps/api/vitest.integration.config.ts` (new integration vitest config)
- `apps/api/vitest.config.ts` (exclude integration from base)
- `apps/api/package.json` (`test:ci` = unit + integration)
- `apps/api/tsconfig.json` (test wiring)
- `turbo.json` (`test:ci` env passthrough — CI tooling)
- wave-17 process docs

**No product artifact changed** — `apps/api/src/**` and `apps/web/src/**` runtime code, schema,
and dependencies are all unchanged. Nothing ships to users. Therefore **no Railway deploy is
triggered for this wave** (`railway up` NOT run). Deploying would re-build and re-cut the
running api/web services for a change that does not affect what they serve — unnecessary churn
and risk for zero user-facing delta.

## Optional health sanity (production unaffected — confirmed)

To confirm the unchanged production deploy is still live (no regression introduced by the merge
to main, which does not redeploy on its own for a test-only diff):

```
GET https://api-production-b93e.up.railway.app/health
  → HTTP 200  {"status":"ok","service":"studyhall-api","version":"0.0.1"}

GET https://web-production-bce1a8.up.railway.app/
  → HTTP 200
```

Both authoritative liveness checks pass. Production is healthy and serving.

## Canary

SKIP — test-only wave, no user-perceivable surface changed, and DAU is below the
`canary_threshold_dau: 1000` threshold. No canary window armed.

## Deliverable footer

```yaml
ci_stage_verdict: PASS
verdict_source: none (test-only; no product artifact changed)
deploy: none (test-only; no product artifact changed)
verdict_evidence:
  - "merged diff dfb65ca touches only test code + CI/test config + wave docs; apps/*/src runtime unchanged"
  - "no railway up triggered — no product artifact changed"
  - "health sanity: api /health 200 {status:ok}; web / 200 — production unaffected"
deploy_targets: []                    # no deploy this wave
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "test-only wave — no user-facing artifact changed; DAU below canary_threshold_dau (1000)"
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "NO-DEPLOY by design (test-only). Optional health sanity confirms the unchanged Railway production deploy (api + web) is still live and healthy. No rollback path needed — nothing was cut."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {head-ci-cd: head-ci-cd}
  failed_checks: []
  rationale: >
    Test-only wave — the merged diff changes only test code, integration/CI test config, and
    turbo.json env passthrough; no api/web runtime code, schema, or dependency changed. Nothing
    ships to users, so no Railway deploy is triggered (correct — a deploy here would be churn
    with zero user-facing delta). Optional liveness sanity confirms the existing, unchanged
    production deploy is still healthy (api /health 200 {status:ok}; web / 200). Canary skipped
    (no user surface changed; below DAU threshold). No false-green risk: there is no deploy to
    falsely verify, and the one thing that mattered — the integration suite genuinely executing
    against real Postgres — was proven in C-1.
  next_action: PROCEED_TO_T (block exit)
```
