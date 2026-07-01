# Wave 26 — C-2 Deploy & verify

**Platform:** Railway (CLI image push — `railway up`, per project convention; NOT git-trigger). **Merge commit:** 1543a4e.

## Deploy scope — WEB ONLY
Wave-26 changed `apps/web/` only (PresenceDot, MessageList, MemberListPanel, presenceSocket, presence tests + assignments test-fix + biome.json config). No `apps/api/` change → **api NOT redeployed** (stays on wave-25 revision b0251962). Deployed web via `railway up --service web --environment production --detach`.

## Verification (external-system evidence)
| Service | Deployment | Status | Health | Fresh-build marker |
|---|---|---|---|---|
| web | 036c9612 (latest) | SUCCESS | / → 200 | asset `index-DBlhKjLW.js` (was `index-qlKaiziB.js` in wave-25 → new presence-dot code serving) |
| api | b0251962 (unchanged) | SUCCESS | /health → 200 | not redeployed (no api change this wave — correct) |

web's latest deployment is 036c9612 SUCCESS (confirmed via `deployments(first:1)` GraphQL) — the presence-dot code (shared PresenceDot + author-avatar dots + member-panel refactor) is LIVE. CI-PRINCIPLES rule 1 satisfied (deployment-state SUCCESS on the new revision + fresh asset hash, not /health alone). No user-facing outage.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway web: deployment 036c9612 status SUCCESS (latest); fresh asset index-DBlhKjLW.js"
  - "web / 200; api /health 200 (api unchanged, b0251962)"
  - "api NOT redeployed — no apps/api change this wave"
deploy_targets:
  - {platform: railway, service: web, state: SUCCESS, deployment_id: 036c9612, verified_at: "2026-07-01T13:15Z", freshly_deployed: true, health_url: "https://web-production-bce1a8.up.railway.app/"}
  - {platform: railway, service: api, state: SUCCESS, deployment_id: b0251962, verified_at: "2026-07-01T13:15Z", freshly_deployed: false, health_url: "https://api-production-b93e.up.railway.app/health", note: "unchanged this wave"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000); T-block synthetic probes are the post-deploy signal."
note: "Frontend-only wave — web redeployed (railway up), api untouched. Presence dots live."
```

## Exit
web live with the presence-dot code (SUCCESS + fresh bundle), api unchanged, canary skipped. → T block.
