# C-2 — Deploy & verify (wave-18 M3 threads)

Merge commit deployed: **16c72b611dc5ea4cfc821806320013bcb11ceecd**. Mode: automatic. Deploy via Railway CLI source-upload (`up --service <x> --environment production --ci`) — project's established convention (wave-12/14 false-green lesson chose CLI over GraphQL `serviceInstanceDeploy`). Verification is authoritative via the Railway deployment-state GraphQL endpoint, never CLI "Deploy complete" or /health alone.

## Action 0 — Railway credential
- `APP_RAILWAY_TOKEN` present; exported as `RAILWAY_TOKEN`. Project `app-arina-89ejyn` (`ae55c191-…`), single environment `production` (`bfdcc42f-…`).
- Deploy-scoped probe succeeded (`.data.project != null`, no errors). Credential usable — proceeded directly, no founder pause.
- Service IDs: api `7358a103-0a4f-44e6-9468-3d02d045531e`, web `107d4255-422a-4b72-b138-0647f9192fe4`, supertokens `73ca977a-…`, Postgres `8d177be8-…`.

## Pre-deploy baselines (rollback targets — captured BEFORE deploying)
- **api baseline**: `15f389bb-2692-4231-b529-2ad3aa6a97cb` (SUCCESS, was serving). Reachable rollback target.
- **web baseline**: `cf154378-8227-41d2-b5a0-da7e7ef59303` (SUCCESS, was serving). Reachable rollback target.
- Rollback path confirmed reachable before cutover: prior good SUCCESS revisions exist per service and are redeployable via Railway (`deploymentRedeploy` / dashboard re-deploy).

## Migration 0008 — applied EXPLICITLY before api cutover (additive/non-destructive)
- Mechanism (same as wave-13 0006 / wave-15 0007): `drizzle-kit migrate` from `apps/api` against the prod DB **public proxy** `yamanote.proxy.rlwy.net:40008` (`DATABASE_PUBLIC_URL` from the Postgres Railway service). drizzle.config reads `DATABASE_URL_UNPOOLED ?? DATABASE_URL`; both set to the public proxy for the run. **NO boot-time auto-migrate** (verified: api Dockerfile CMD is `node apps/api/dist/src/main.js`; main.ts has no `migrate()` call — explicit migrate is the contract).
- **Pre-migrate** (direct pg query): `thread_parent_id`/`reply_count`/`last_reply_at` columns ABSENT; index ABSENT; drizzle ledger count = 8 (0000–0007). Migration genuinely pending.
- **Applied**: `[✓] migrations applied successfully!` (exit 0).
- **Post-migrate authoritative verification** (direct pg query against prod):
  - `thread_parent_id` (uuid, nullable) ✓
  - `reply_count` (integer, NOT NULL, default 0) ✓
  - `last_reply_at` (timestamptz, nullable) ✓
  - index `messages_thread_parent_created_idx` ✓
  - self-FK `messages_thread_parent_id_messages_id_fk` ✓
  - drizzle ledger count **8 → 9**.
- Migration ran BEFORE api began serving the new code (correct ordering — old+new code both tolerate additive columns; no destructive ops).

## Deploy + authoritative verification (deployment-state SUCCESS + NEW revision distinct from baseline)
Deployed **api first** (carries thread routes + migrated schema), then **web** (carries ThreadPanel/affordance).

| Service | Baseline rev | NEW rev | deployment-state | Distinct? |
|---|---|---|---|---|
| api | `15f389bb` | **`ce25ddc2-afd4-4562-bbac-75e03973be9b`** | **SUCCESS** | YES |
| web | `cf154378` | **`594b0bdc-55e8-4d55-9c6c-4490ceed1336`** | **SUCCESS** | YES |

Both verdicts read from the Railway `deployments(first:1)` GraphQL endpoint (`.data.deployments.edges[0].node.status == "SUCCESS"`), NOT CLI output and NOT /health alone.

## FALSE-GREEN / STALE-REVISION GUARD (CI-PRINCIPLES rules 1 + 2)
- **Secondary health**: api `/health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`; web root `/` → 200.
- **NEW-ONLY ROUTE PROBE (the decisive check)**: the wave-18 thread routes did NOT exist on the prior revision. Probed unauthenticated:
  - `GET /messages/00000000-…/replies` → **HTTP 401 `{"message":"unauthorised"}`**
  - `POST /messages/00000000-…/replies` → **HTTP 401 `{"message":"unauthorised"}`**
  - A 401 (auth-gated) rather than 404 proves the **NEW api revision `ce25ddc2` is serving traffic** — the prior revision would 404 these routes. Rules out the stale-revision race AND confirms the session guard fronts the route before the channel-membership IDOR check.

## Canary — SKIPPED (below traffic threshold)
- `project.yaml: deploy_targets[].canary_threshold_dau = 1000`; CI-PRINCIPLES `canary.enabled: false` (self-use-mvp, no real cohort onboarded). Current DAU = 0 (< 1000).
- Below threshold, real-user telemetry noise/signal is too high; T-block synthetic probes are the post-deploy signal. Consistent with prior waves.

## Stage-exit checklist (C-2)
- [x] Deploy verification reads the Railway deployment-state endpoint, NOT self-reported /health.
- [x] New revision confirmed serving traffic before deploy called done (401-not-404 on new-only thread routes).
- [x] Pending migration 0008 applied explicitly, in order, before new code served (drizzle-kit migrate; not auto-on-boot).
- [x] Required env vars exist in target scope (api carries DATABASE_URL/SuperTokens/LiveKit per service; web has no DB creds — pre-existing service env, unchanged this wave; deploy did not introduce env cutover).
- [x] Rollback path identified + reachable before cutover (prior good revisions per service: api 15f389bb, web cf154378).
- [x] Secrets via platform env vars / token (DATABASE_PUBLIC_URL fetched at runtime, never committed; no secret echoed into deliverable).
- [x] No debug-by-deploy; no preemptive pause; block exit is the deploy-state verdict.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "api: deployment-state SUCCESS, new revision ce25ddc2-afd4-4562-bbac-75e03973be9b (baseline 15f389bb, distinct)"
  - "web: deployment-state SUCCESS, new revision 594b0bdc-55e8-4d55-9c6c-4490ceed1336 (baseline cf154378, distinct)"
  - "prod migration: drizzle-kit migrate applied 0008 via public proxy yamanote.proxy.rlwy.net:40008; thread_parent_id + reply_count + last_reply_at + index + self-FK verified by direct pg query; ledger 8->9"
  - "new-only route probe: GET+POST /messages/:id/replies → 401 (auth-gated, not 404) — proves new api revision serving"
  - "api /health 200 {status:ok}; web root 200 (secondary)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, revision: ce25ddc2-afd4-4562-bbac-75e03973be9b, baseline: 15f389bb-2692-4231-b529-2ad3aa6a97cb, verified_at: "2026-06-30T14:34Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, revision: 594b0bdc-55e8-4d55-9c6c-4490ceed1336, baseline: cf154378-8227-41d2-b5a0-da7e7ef59303, verified_at: "2026-06-30T14:36Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU 0 < 1000 threshold; canary.enabled=false (self-use-mvp). T-block synthetic probes are the post-deploy signal."
canary_window: {start: "", duration_minutes: 0}
canary_monitor_id: ""
canary_alerts: []
note: "Migration 0008 applied EXPLICITLY before api cutover (drizzle-kit migrate, not auto-on-boot) and verified by direct pg query (ledger 8->9). api then web deployed via Railway CLI source-upload. Both NEW revisions verified SUCCESS via authoritative deployment-state. Stale-revision race ruled out by 401-not-404 on the new-only thread routes. Rollback targets: api 15f389bb, web cf154378. Canary skipped <1000 DAU."

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Migration 0008 (additive thread columns + index + self-FK) was applied to prod EXPLICITLY and in
    order via drizzle-kit migrate against the public proxy BEFORE api cutover — never auto-migrated on
    boot (Dockerfile CMD + main.ts confirmed migration-free) — and verified by direct pg query (ledger
    8->9, all 3 columns + index + FK present). api then web were deployed via Railway CLI source-upload
    and BOTH verified via the authoritative Railway deployment-state endpoint as NEW revisions distinct
    from their captured baselines (api 15f389bb->ce25ddc2, web cf154378->594b0bdc, both SUCCESS). The
    false-green/stale-revision risk was decisively closed: the new-only thread routes return 401
    (auth-gated), not 404, proving the new api revision serves traffic. Health 200 + web root 200 are
    secondary confirmations. Rollback targets identified and reachable. Canary skipped below the 1000-DAU
    threshold with documented rationale.
  next_action: PROCEED_TO_C-3
```
