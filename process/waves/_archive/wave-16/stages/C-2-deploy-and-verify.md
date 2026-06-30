# C-2 — Deploy & verify (wave-16)

**Wave:** 16 — authed create-server browser E2E + storageState harness (TEST-ONLY).
**Mode:** automatic. **Merge commit:** 6982ffe (C-1).

## Deploy disposition: NONE

`deploy: none (test-only change; no product artifact changed; api/web unchanged)`

### Rationale (no false-green, no debug-by-deploy)

This wave's merged diff touches ONLY test code + CI config + process docs:

- `apps/web/e2e/auth.setup.ts`, `apps/web/e2e/create-server.spec.ts` — Playwright test files (NOT bundled into the product build; `e2e/` is test-only)
- `apps/web/playwright.config.ts` — test runner config
- `apps/web/.gitignore`, `biome.json` — tooling/ignore config
- `.github/workflows/ci.yml` — CI pipeline (added the `e2e` job + fixture-secret wiring); not shipped to users
- `command-center/principles/VERIFY-PRINCIPLES.md` + `process/waves/wave-16/*` — docs/process

There is **no change to any deployable product artifact**: no `apps/api/src/**`, no `apps/web/src/**`, no schema/migrations (`drizzle/**`), no `package.json` dependency change. The merge to main does NOT alter what either Railway service (api, web) serves. Therefore there is nothing to deploy and no `railway up` is run.

`stack.deploy_platform` is `railway` (deploy-bearing), so this is NOT the `deploy_platform: none` library exemption — but the C-2 deploy-verification gate is satisfied by the established fact that no product build output changed. Re-deploying identical api/web artifacts would add risk (stale-revision races, env-drift exposure) with zero product benefit. The C-block does not deploy to debug or to "be safe"; it deploys only what shipped, and nothing shippable shipped.

## Optional health sanity (no deploy triggered)

Confirmation that the live app is unchanged + healthy (read-only curl; no `railway up`):

| Target | Probe | Result |
|---|---|---|
| api (`api-production-b93e.up.railway.app`) | `GET /health` | **200** — `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| web (`web-production-bce1a8.up.railway.app`) | `GET /` | **200** |

Both serving cleanly; nothing regressed (consistent with: this wave changed nothing they serve).

## Canary

`canary_status: skipped` — no deploy occurred AND real-user traffic is below `canary_threshold_dau` (1000). Synthetic probe (health sanity above) is the post-merge signal.

## Stage-exit checklist (C-2)

- [x] Deploy verification reasoning is authoritative, not /healthz-only — the verdict rests on "no product artifact changed," and the health probe is a sanity confirmation, not the basis for a false-green. No deploy was claimed.
- [x] No stale-revision race: no new revision deployed, so the serving revision is the prior verified-good one (wave-15 closeout: api+web verified live).
- [x] Migrations: N/A — zero schema/migration changes this wave.
- [x] Env-var scoping: N/A — no service env changed; no cutover. (CI-side fixture secrets E2E_FIXTURE_EMAIL/PASSWORD live in GitHub Actions secrets, set at B-0 — not in any Railway service.)
- [x] Rollback path: N/A (no deploy); prior good revision remains live and reachable.
- [x] Secrets: no secret committed (gitleaks green at C-1); fixture secrets via GH Actions secrets, never in the diff.
- [x] Canary window: skipped with explicit reasoning (no deploy + DAU<1000).
- [x] Sentry / observability: unaffected — no product code change; live api emitting healthy /health.
- [x] No preemptive pause — block exit is the verdict below, not a "natural break."

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "deploy: none — test-only change; no product artifact changed (no apps/api/src, apps/web/src, schema, or dep change); api/web unchanged"
  - "api-production-b93e.up.railway.app/health: 200 {\"status\":\"ok\",\"service\":\"studyhall-api\",\"version\":\"0.0.1\"}"
  - "web-production-bce1a8.up.railway.app/: 200"
deploy_targets:
  - {platform: railway, state: "unchanged (no deploy)", commit: "n/a — no new artifact", verified_at: "2026-06-30T12:55:00Z", uptime_seconds: "n/a", health_url: "https://api-production-b93e.up.railway.app/health"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "No deploy occurred (test-only change; no product artifact). Also DAU below threshold (<1000). Health sanity (api+web 200) is the post-merge signal."
canary_window:
  start: ""
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
note: "NO DEPLOY. Wave changed only test code + CI config + docs; nothing that ships to users. Health sanity confirms live api/web still 200. Canary skipped."
```

---
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >-
    No deploy is the correct C-2 outcome for this wave. The merged diff changes only test code
    (Playwright e2e specs/config, not bundled), CI config (the new e2e job + secret wiring), and
    process docs — no apps/api/src, apps/web/src, schema/migration, or dependency change. The
    merge to main alters nothing either Railway service serves, so there is no product artifact
    to deploy and no railway up is run; re-deploying identical artifacts would only add
    stale-revision and env-drift risk for zero benefit. The prior verified-good api/web revisions
    remain live, and a read-only health sanity confirms both still return 200 (api /health ok,
    web root 200). Canary skipped: no deploy plus DAU<1000. No migrations, no env cutover, no
    rollback exposure. C-block exits clean.
  next_action: PROCEED_TO_T-block
