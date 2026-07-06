# C-2 Deploy & verify — wave-59
Changed surface: apps/web only (1-line export + a test file; test not bundled, export inert). api unchanged → NOT redeployed.
Deployed web @ 42c95bc via Railway GraphQL serviceInstanceDeploy → SUCCESS (~90s).
Health: web HTTP 200; api /health 200 {"status":"ok","service":"studyhall-api","version":"0.0.1"} (api still healthy, unchanged).
Canary: SKIPPED (real users < 1000).
```yaml
ci_stage_verdict: PASS
verdict_source: railway
deploy_targets:
  - {platform: railway, service: web, state: SUCCESS, commit: 42c95bc, verified_at: "2026-07-06T06:09Z"}
  - {platform: railway, service: api, state: unchanged (not redeployed — no api diff)}
canary_status: skipped
```
