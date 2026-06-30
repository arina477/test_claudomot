# C-2 — Deploy & verify (wave-11)

## Deploy: NOT NEEDED (justified skip)
This is an ops/test-infra wave with **no app artifact change**. The merged diff is config + script + process docs only:
- `project.yaml` — test-user metadata (label+email) + a scoped `.gitleaks.toml`
- `apps/api/scripts/re-verify-fixture.sh` — operator script (not bundled/served by the app)
- `process/waves/wave-11/**` — process docs

No `apps/api/src/**`, `apps/web/**`, no migrations, no Dockerfile/runtime/CI-workflow changes. Nothing in the deployed artifact changed, so no Railway redeploy is required. `deploy_platform: railway`, but there is no new revision to cut over to.

## Verification: fixture proven live at provision-time
The persistent verified prod test fixture (`studyhall-e2e-fixture@example.com`, user-id `21984eb2-8029-4c1b-9e73-bc586a0be4d2`) was provisioned + proven against the LIVE prod api during B-2/B-5:
- Email VERIFIED via SuperTokens Core admin API (generate → consume token → GET confirmed `isVerified:true`).
- **PROOF of working fixture:** signin → `POST /servers` → **201** `{id, ownerId=21984eb2}` (verified-claim `st-ev.v:true` passes AuthGuard on a privileged route — not the EV-exempt `/me`).
- Unauthed boundary holds: `POST /servers` unauthed → 401.

## /health 200 sanity
No concrete public api URL is recorded in committed artifacts (B-2 reached the Core via a temporary Railway public domain that was created+deleted in <60s). An independent post-merge `/health` curl was therefore not run; per the C-block task the sanity probe is optional, and the live api was already exercised end-to-end via the POST /servers 201 proof above (which transits the running api + auth stack). No app code shipped this wave that could regress api health.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: none (no deploy artifact changed — config/docs/script-only diff)
verdict_evidence:
  - "diff is config (project.yaml, .gitleaks.toml) + script + process docs only — no app code, no migrations, no runtime change"
  - "fixture proven live at provision-time: signin -> POST /servers -> 201 (ownerId=21984eb2); unauthed -> 401"
deploy_targets: []
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "No deploy this wave (no app artifact change); below DAU canary threshold regardless. T-block synthetic probes are the post-deploy signal if any."
canary_window:
  start: ""
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
note: "Deploy not needed — config/docs/script-only diff, no new revision. Verification satisfied by the provision-time POST /servers 201 proof on the live api; optional /health curl not run (no public api URL in committed artifacts)."
```
