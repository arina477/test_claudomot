# C-2 — Deploy & verify (wave-21)

**Scope:** WEB service ONLY. api unchanged this wave (no apps/api diff, no migration) — api deliberately NOT redeployed.

## Action 0 — Credential
- `RAILWAY_TOKEN` set from `$APP_RAILWAY_TOKEN`. Deploy-scoped GraphQL probe (`project(id:)`) returned `data.project` with no errors → token usable. Project `app-arina-89ejyn` (ae55c191-4631-4224-b7b2-42f329ed48d7), environment production (bfdcc42f...).
- Services: web `107d4255-422a-4b72-b138-0647f9192fe4`, api `7358a103-...`, supertokens, Postgres.

## Migration check (frontend-only)
- Merge commit 9c48007 confirmed: NO apps/api, NO drizzle/migration/.sql files. Drizzle ledger UNCHANGED. **No migration applied — none required.**

## Env-var scoping (stage-exit check)
- web service untouched in env scope; no new env var required by this frontend-only change (catch-up loop consumes the existing wave-20 `?after=` route via the already-configured api base URL). web correctly holds NO DB creds. No cutover env gap.

## Deploy (WEB only)
- `export RAILWAY_TOKEN="$APP_RAILWAY_TOKEN"; npx -y @railway/cli@latest up --service web --environment production --ci` from local `main` @ 9c48007. CLI reported "Deploy complete" (build 3/3 tasks successful, image pushed).
- **CLI self-report NOT trusted as the verdict** — authoritative deployment-state used instead.

## Authoritative verification (Railway deployment-state endpoint, NOT /healthz)
- **WEB BASELINE (captured BEFORE deploy):** deployment `2aac8438-9336-42d8-b01d-03b29786c28c`, status SUCCESS, createdAt 2026-06-30T19:50:09Z. (= rollback target; reachable + identified before cutover.)
- **NEW WEB deployment:** `032dc384-3304-4dd0-bb5a-863018540503`, status **SUCCESS**, distinct from baseline → revision advanced, no stale-revision race.
- **web root:** `https://web-production-bce1a8.up.railway.app/` → HTTP **200** (new revision serving traffic).
- No new api route to probe this wave (the `?after=` catch-up route shipped wave-20; the multi-page loop is a client-side consumer — CI-PRINCIPLES rule 2 "new-only route flip" N/A, no new route).
- api /health → HTTP 200 (sanity; api NOT redeployed).
- **api NOT redeployed (confirmed):** api latest deploy `d26fe078` createdAt 2026-06-30T19:48:52Z — predates this web deploy; api service untouched.

## Rollback readiness
- rollback_ready = TRUE before cutover. Path: redeploy/rollback web to baseline `2aac8438` via Railway `deploymentRedeploy` / `serviceInstanceRedeploy` mutation. Not needed — deploy verified clean.

## C-3 Canary — disposition: SKIPPED
- project.yaml `canary_threshold_dau: 1000`; CI-PRINCIPLES canary `enabled: false` (self-use-mvp). Real-user DAU = 0 < 1000 → below threshold; per C-2 skip condition, synthetic probes (T-block) are the post-deploy signal. No canary monitor armed.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway web: NEW deployment 032dc384 status SUCCESS (baseline 2aac8438, advanced)"
  - "web root https://web-production-bce1a8.up.railway.app/ : HTTP 200"
  - "api NOT redeployed: api latest deploy d26fe078 createdAt 2026-06-30T19:48:52Z (pre-wave)"
  - "merge 9c48007: no migration / no apps/api"
deploy_targets:
  - {platform: railway, service: web, state: SUCCESS, deployment_id: "032dc384-3304-4dd0-bb5a-863018540503", baseline_deployment_id: "2aac8438-9336-42d8-b01d-03b29786c28c", commit: 9c4800705206d661257a94f2adc56cda13b2b10e, verified_at: "2026-06-30T21:11Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU 0 < 1000 threshold (self-use-mvp, canary disabled); T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "WEB ONLY. api NOT redeployed (no api diff). No migration (frontend-only). Verified via authoritative Railway deployment-state, not /healthz. Rollback target 2aac8438 reachable before cutover."

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Deploy verified via the authoritative Railway deployment-state endpoint, not a
    self-reported health check: a NEW web deployment (032dc384) distinct from the
    pre-captured baseline (2aac8438) reached status SUCCESS, proving the new revision
    advanced with no stale-revision race; web root returns 200 confirming the new
    revision serves traffic. Frontend-only change with zero migrations (drizzle ledger
    unchanged) so no migration sequencing was needed; web env scope unchanged and holds
    no DB creds. api was correctly NOT redeployed (its latest deploy predates this wave).
    A reachable rollback target was identified before cutover. Canary skipped per the
    sub-1000-DAU threshold with synthetic-probe reasoning recorded.
  next_action: PROCEED_TO_T_BLOCK
```
