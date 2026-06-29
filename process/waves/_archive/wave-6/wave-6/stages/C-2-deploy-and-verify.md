# C-2 — Deploy & verify (wave-6 CI boot-probe)

## Deploy: no-op (CI-only change)
The merged diff is `.github/workflows/ci.yml` + wave-6 process docs only. Railway does not build or
serve `.github/workflows/`, so the merge to main triggers no service rebuild and changes no running
revision. No Railway redeploy needed; no rollback target to arm (the merge is a no-op for the running
service — there is no new revision to roll back from).

### Substantive C-2 verification for THIS wave
The real "does it boot in CI" proof is the **boot-probe job going green on PR #16's CI run** (recorded
in C-1): compiled `apps/api/dist/src/main.js` booted against throwaway postgres + dummy env and returned
`/health` `"status":"ok"` on attempt 2 after a genuine attempt-1 connection-refused. That is the
authoritative artifact-boot signal for this wave.

## Prod-not-perturbed check
Because no revision changed, the C-2 check here is confirming the merge did not perturb prod (it should
not — ci.yml only). The authoritative-deployment-state rule (use Railway deploy-state, not /health) guards
against a DEPLOY reporting green while serving a stale/dead revision; with no deploy and no revision change,
there is no stale-revision race, so /health is the correct and sufficient prod-health signal here.

- `curl https://api-production-b93e.up.railway.app/health` → **HTTP 200**, body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (confirmed twice).

## Canary
- `skipped` — self-use-mvp, real-user traffic below the 1000-DAU threshold (project.yaml canary_threshold_dau: 1000).

```yaml
ci_stage_verdict: PASS
verdict_source: railway
verdict_evidence:
  - "no deploy: merged diff is ci.yml + process docs; Railway does not build .github/workflows; no revision change"
  - "boot-probe green on PR-16 CI run = authoritative artifact-boot proof (see C-1)"
  - "curl https://api-production-b93e.up.railway.app/health -> 200 {\"status\":\"ok\",...} x2 (prod not perturbed)"
canary_status: skipped
note: "CI-only wave. C-2 deploy is a no-op; prod health confirmed unchanged. boot-probe is the wave's real verification, captured in C-1."
```

## Block exit / handoff
```yaml
cicd_block_status:    complete
pr_number:            16
pr_url:               https://github.com/arina477/test_claudomot/pull/16
merge_commit:         75e7d9d3c409cc8cd20ecdce6b839cb442e2c774
deploy_targets:       [{platform: railway, state: unchanged-no-op, commit: "n/a (CI-only)", verified_at: "2026-06-29T14:16Z prod /health 200"}]
canary_status:        skipped
ready_for_test:       true
```
