# Wave 74 — C-2 Deploy & verify
- **Migration (before api deploy):** applied `0029_clammy_the_fallen.sql` to prod. Verified: subscriptions table + `subscriptions_server_id_uidx` present (absent pre-migrate).
- **Deploy:** serviceInstanceDeploy(commitSha=113e5cd) api + web → BUILDING→DEPLOYING→SUCCESS, both on 113e5cd.
- **Verify:** api /health 200 (booted with new EntitlementsModule + ServersModule→EntitlementsModule — **no DI cycle boot failure**); web 200; subscriptions table live (0 rows — all servers free-by-default, as designed).
- **Canary:** skipped (DAU ~0 < 1000).
```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api+web: SUCCESS on 113e5cd"
  - "api /health 200; web 200; subscriptions table live (0 rows)"
  - "migration 0029 applied: subscriptions + index present"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 113e5cd}
  - {platform: railway, service: web, state: SUCCESS, commit: 113e5cd}
canary_status: skipped
note: "migration-first; both on merge commit; entitlements wiring booted (no cycle); free-default confirmed"
```
