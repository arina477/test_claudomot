# Wave 73 — C-2 Deploy & verify
- **Migration (before api deploy):** applied `0028_overjoyed_black_queen.sql` to prod via `pnpm db:migrate` against the public proxy. Verified: privacy_events table + `privacy_events_actor_created_idx` present (absent pre-migrate).
- **Deploy:** serviceInstanceDeploy(commitSha=29a140d) for api + web → INITIALIZING→BUILDING→DEPLOYING→**SUCCESS**, both on 29a140d.
- **Verify:** api /health 200 (booted with new PrivacyModule/BlocksModule wiring — no module-cycle boot failure); web bundle `index-OszxDUEV.js` **zero raw require** (P0 guard holds on prod); `GET /profile/privacy-events` → **401** (mounted + guarded, not 404).
- **Canary:** skipped (DAU ~0 < 1000).
```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api+web: SUCCESS on 29a140d"
  - "api /health 200; web bundle zero-require; GET /profile/privacy-events 401"
  - "migration 0028 applied: privacy_events + index present"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 29a140d}
  - {platform: railway, service: web, state: SUCCESS, commit: 29a140d}
canary_status: skipped
note: "migration-first; both services on merge commit; audit-log endpoint live+guarded"
```
