# C-2 (wave-57). serviceInstanceDeploy commitSha-pinned (1361c49) api+web → both SUCCESS. Deployed == merge SHA. api /health 200, web / 200. Canary SKIPPED (<1000 DAU). Frontend nav fix live.
```yaml
ci_stage_verdict: PASS
verdict_source: railway
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 1361c49}
  - {platform: railway, service: web, state: SUCCESS, commit: 1361c49}
canary_status: skipped
