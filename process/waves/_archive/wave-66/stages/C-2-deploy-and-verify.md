# C-2 Deploy & verify — wave-66
Client-only presentation change (apps/web). WEB service deployed via Railway GraphQL serviceInstanceDeploy (head-ci-cd triggered pre-rate-limit; orchestrator verified). api service NOT touched.
- WEB deployment: latest SUCCESS @ 2026-07-06T15:45:13Z, **commitHash d094f9c6...== merge SHA** (no stale-revision / false-green). Prior revisions REMOVED.
- Health: `/` → 200, `/health` → 200.
- Canary: skipped (<1000 DAU) — T-block probes are the post-deploy signal.
- No migration (client-only), no new env var.
```yaml
ci_stage_verdict: PASS
verdict_source: railway
verdict_evidence:
  - "web deployment status SUCCESS, commitHash d094f9c6e8445805b3207c0837be97473a1b66f0 == merge SHA"
  - "curl / → 200, /health → 200 (web-production-bce1a8.up.railway.app)"
deploy_targets: [{platform: railway, service: web, state: SUCCESS, commit: d094f9c}]
canary_status: skipped
armed_verification_failed: false
note: "head-ci-cd rate-limited mid-C-2; orchestrator verified deploy SUCCESS + commit match + HTTP 200 and wrote this deliverable. api untouched."
```
