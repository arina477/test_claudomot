# C-2 — Deploy & verify (wave-55)
serviceInstanceDeploy commitSha-pinned (2565f43) api+web → both SUCCESS. Deployed commit == merge SHA (stale-guard PASS). api /health 200, web / 200. Canary SKIPPED (pre-launch <1000 DAU). Note: test-only change — runtime identical; deployed for provenance/parity (SHA == merge SHA).
```yaml
ci_stage_verdict: PASS
verdict_source: railway
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 2565f43}
  - {platform: railway, service: web, state: SUCCESS, commit: 2565f43}
canary_status: skipped
