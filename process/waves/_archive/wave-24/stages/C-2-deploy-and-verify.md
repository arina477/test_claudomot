# C-2 — Deploy & verify (wave-24 — real-PG integration test tier · TEST-ONLY)

**Head:** head-ci-cd · **Platform:** Railway (project `app-arina-89ejyn` / `ae55c191`, env `production`) · **Mode:** automatic.

**This is a TEST-ONLY wave.** Merge `149a0817edab3cf9b8dac0b5fd7ebaa08d04cf0a` adds only `apps/api/test/integration/**` specs + `pg-harness.ts` + wave process docs. Diff verified test-only at C-1 (`git diff main...HEAD --stat` — zero production runtime files, zero migration files).

## Deployability analysis — why no redeploy, no migration, no new-route probe
- **No deployable artifact change.** The 3 new specs live under `apps/api/test/` and run only via Vitest in CI. The api Railway build compiles `apps/api/src` → `dist/` (test/ is excluded from the NestJS build output); the web build is a Vite bundle. Neither build includes `test/**`. The artifact a wave-24 rebuild would produce is byte-equivalent to the currently-running wave-23 revision. A redeploy would cut over to an identical image — pure risk, zero benefit — so none was triggered.
- **No migration.** No `drizzle/migrations/*.sql` in the diff; schema is untouched. Nothing to apply (contrast wave-23, which applied migration 0011 before cutover).
- **No new-route / behavior probe.** The wave adds no route or runtime behavior; the tests are not in the deployed artifact. The wave's authoritative behavioral verification was **CI executing the integration tier against postgres:16 — completed and evidenced at C-1** (10 new real-DB tests passed; false-green guard PASS). There is no new-only route to flip 404→auth-gated, so the wave-23 stale-revision-race probe is N/A this wave.

## Verification — authoritative deployment-state + /health (both services in-place)

### Rule 1 — authoritative Railway deployment-state = SUCCESS (via GraphQL, NOT /health alone)
Queried `backboard.railway.com/graphql/v2` `deployments(first:3)` per service with the project access token:
| Service | Latest deployment | Status | createdAt |
|---|---|---|---|
| api (`7358a103…`) | `0ebf493d-656d-4dda-a792-ced64fde4ce2` | **SUCCESS** | 2026-07-01T00:53:43Z |
| web (`107d4255…`) | `31fca925-0665-4c46-a1f7-cf1cf69cc9d4` | **SUCCESS** | 2026-07-01T00:54:55Z |

Both latest deployments are terminal SUCCESS and actively serving (prior revisions `REMOVED`). These are the wave-23 revisions — the correct live line for a test-only wave that ships no deployable artifact.

### /health (necessary, not sufficient — confirmatory only)
- **api /health** → HTTP 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- **web root** → HTTP 200.

## Env-var scoping — unchanged this wave (no service/config change)
No env vars added or moved. api retains its DB/SuperTokens/session scope; web retains `VITE_API_ORIGIN` + Railway-injected only (no DB creds) — as verified at wave-23 C-2. Nothing to re-scope.

## Rollback path
No cutover occurred, so no rollback is in play. Prior good revisions remain reachable via `deploymentRedeploy` (GraphQL, `Project-Access-Token`) if ever needed; the live revisions are the last-known-good from wave-23 and are healthy.

## Canary — SKIPPED (below traffic threshold)
`canary_threshold_dau: 1000` (project.yaml); real-user DAU = 0 < 1000. No `/canary` monitor armed. (Also moot: no behavior change to canary.)

## Secret hygiene
Railway token sourced from `$APP_RAILWAY_TOKEN` in env, used only in the GraphQL `Project-Access-Token` header; never echoed into a file or committed. GitHub token used inline at C-1 only.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: latest deployment 0ebf493d status SUCCESS (2026-07-01T00:53:43Z), serving; prior revisions REMOVED"
  - "railway web: latest deployment 31fca925 status SUCCESS (2026-07-01T00:54:55Z), serving; prior revisions REMOVED"
  - "api /health: 200 {status:ok}; web root: 200"
  - "test-only wave: merge 149a0817 adds only apps/api/test/** specs — excluded from api dist/ + web Vite bundle; deployable artifact byte-equivalent to live wave-23 revision; no redeploy triggered"
  - "no migration in diff (schema untouched); no new-only route (behavioral verification was CI integration tier at C-1)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: 0ebf493d-656d-4dda-a792-ced64fde4ce2, health_url: "https://api-production-b93e.up.railway.app/health", verified_at: "2026-07-01T06:45Z", redeployed: false, reason_no_redeploy: "test-only; no deployable artifact change"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: 31fca925-0665-4c46-a1f7-cf1cf69cc9d4, health_url: "https://web-production-bce1a8.up.railway.app/", verified_at: "2026-07-01T06:45Z", redeployed: false, reason_no_redeploy: "test-only; no deployable artifact change"}
async_monitor_id: ""
migration_applied: false
migration_note: "No migration in diff; schema untouched."
new_route_probe: "n/a — test-only wave; no new route/behavior. Behavioral verification was CI executing the integration tier at C-1."
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000, canary_threshold_dau=1000 per project.yaml); also moot — no behavior change to canary."
canary_window: {start: "", duration_minutes: 0}
canary_monitor_id: ""
canary_alerts: []

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Test-only wave: the merge introduces only Vitest integration specs under apps/api/test/**, which are excluded
    from the api dist/ build and the web Vite bundle, so the deployable artifact is byte-equivalent to the live
    wave-23 revision. Both services were verified LIVE via the authoritative Railway deployment-state GraphQL
    endpoint = SUCCESS (api 0ebf493d, web 31fca925), not by /health alone, with /health 200 as confirmatory.
    No redeploy was triggered (an identical-image cutover is pure risk, zero benefit); no migration exists in the
    diff; and there is no new-only route to probe — the wave's behavioral verification was CI executing the
    integration tier against postgres:16, completed and evidenced at C-1 (10 new real-DB tests, false-green guard
    PASS). Canary correctly skipped (DAU 0 < 1000).
    next_action: PROCEED_TO_T_BLOCK
```
