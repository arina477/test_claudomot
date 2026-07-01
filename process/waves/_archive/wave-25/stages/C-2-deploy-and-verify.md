# Wave 25 — C-2 Deploy & verify

**Owner:** head-ci-cd (spawn) → deployment-engineer (deploy execution) → orchestrator (gate verification). **Platform:** Railway (GraphQL + CLI image push). **Merge commit:** dbe55a2.

## Deploy-mechanism defect caught + resolved (the false-green this gate exists for)
head-ci-cd's first verification found BOTH services green-but-STALE: latest deployments were ~10h-old, pre-`dbe55a2` revisions serving 200 on /health — a classic stale-health-check false-green. Root cause: **these Railway services deploy ONLY via CLI image push (`railway up`, `cliCaller=claude_code`), NOT git-auto-deploy** — the squash-merge to main triggered no deploy. head-ci-cd correctly REFUSED to `serviceInstanceRedeploy` (would re-ship the stale image green). CI-PRINCIPLES rule 1 (deployment-state + commit correlation, not /health alone) is what surfaced it — /health has no commit/uptime field, so a /health-only check would have false-passed.

**Resolution (Iron Law → deployment-engineer):** installed Railway CLI v5.23.3 (`npx @railway/cli`), authed via project-scoped `RAILWAY_TOKEN`, ran `railway up --service <api|web> --environment production --detach` from current main HEAD for BOTH services. ~8 min build+deploy. No git commits, no token persisted.

## Verification (orchestrator, external-system evidence)
| Service | New deployment ID | Status | createdAt | Health | Fresh-build marker |
|---|---|---|---|---|---|
| api | b0251962-3be4-4b18-8105-4282ccb6e7c7 | SUCCESS | 2026-07-01T11:03:33Z | /health → 200 `{"status":"ok","service":"studyhall-api"}` | new deploy supersedes stale 0ebf493d (00:53Z) |
| web | 25a010b0-7d0e-4706-935b-b423295a0d16 | SUCCESS | 2026-07-01T11:03:40Z | / → 200 | asset `index-qlKaiziB.js` (fresh vite build) supersedes stale 31fca925 |

Both are now the LATEST deployment for their service (confirmed via `deployments(first:1)` GraphQL) — dbe55a2's code (api editMessage db.transaction + shared slug; web MessageList tokenizer + mentionSlug mirror) is LIVE. No user-facing outage occurred (old revision served throughout the gap; rollback targets api 0ebf493d / web 31fca925 remain available).

## L-block observation candidate (HIGH value — cross-wave)
THIS project's Railway services have NO git trigger — a merge to main does NOT deploy. C-2 must actively `railway up` each service that has real code changes; verify via deployment-state SUCCESS + commit/build-freshness correlation, never /health alone (health 200 from a stale revision is the trap). Test-only waves correctly skip the deploy (wave-17/24 precedent). Candidate CI-PRINCIPLES rule at L-2.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment b0251962 status SUCCESS, createdAt 2026-07-01T11:03:33Z (fresh, superseded stale 0ebf493d)"
  - "railway web: deployment 25a010b0 status SUCCESS, createdAt 2026-07-01T11:03:40Z (fresh asset index-qlKaiziB.js)"
  - "api /health 200 {status:ok}; web / 200"
  - "both confirmed LATEST via deployments(first:1) GraphQL — dbe55a2 code live"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: dbe55a2, deployment_id: b0251962-3be4-4b18-8105-4282ccb6e7c7, verified_at: "2026-07-01T11:05Z", freshly_deployed: true, health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: dbe55a2, deployment_id: 25a010b0-7d0e-4706-935b-b423295a0d16, verified_at: "2026-07-01T11:05Z", freshly_deployed: true, health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000); T-block synthetic probes are the post-deploy signal."
canary_alerts: []
note: "First-verification caught a stale-revision false-green (services deploy via railway up CLI, not git trigger); deployment-engineer shipped dbe55a2 to both; re-verified fresh + SUCCESS. Fix-up: 1 deploy cycle."
```

## Exit
Both targets serve dbe55a2 (SUCCESS + fresh health), canary skipped (traffic threshold), credential present + usable. `ci_stage_verdict: PASS`. → T block (Test).
