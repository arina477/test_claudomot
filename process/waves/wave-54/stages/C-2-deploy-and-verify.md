# C-2 — Deploy & verify (wave-54)
- serviceInstanceDeploy commitSha-pinned (97c8e99) for api + web → both BUILDING→DEPLOYING→**SUCCESS**.
- Deployed commit == merge SHA 97c8e99 on both services (stale-revision guard PASS).
- api /health → 200 {status:ok, service:studyhall-api}; web / → 200.
- Canary: SKIPPED (pre-launch ~0 DAU < 1000 threshold).
```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: SUCCESS @97c8e99 (== merge SHA); web: SUCCESS @97c8e99"
  - "api /health 200; web / 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 97c8e99}
  - {platform: railway, service: web, state: SUCCESS, commit: 97c8e99}
canary_status: skipped
canary_skip_reason: "DAU ~0 pre-launch < 1000"
note: "Backend-only regression-lock + constant; no migration. Live at 97c8e99."
