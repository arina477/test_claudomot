# C-2 — Deploy & verify (wave-56)
serviceInstanceDeploy commitSha-pinned (efc1a47) api+web → both SUCCESS. Deployed == merge SHA. api /health 200, web / 200. Canary SKIPPED (<1000 DAU). Real production change (defensive LIMIT) now live.
```yaml
ci_stage_verdict: PASS
verdict_source: railway
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: efc1a47}
  - {platform: railway, service: web, state: SUCCESS, commit: efc1a47}
canary_status: skipped
