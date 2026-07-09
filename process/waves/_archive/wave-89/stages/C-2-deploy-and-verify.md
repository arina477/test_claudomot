# C-2 — Deploy & Verify (wave-89)

**Stage:** C-2 Deploy & verify
**Owner:** head-ci-cd
**Target:** StudyHall — **web** service (frontend-only change)
**Merge commit:** `b27277db04547c8c49b5f7c501fe6de68ddf4a12` (PR #110, on main)

---

## What happened

Frontend/web-only change. Triggered a **commit-targeting** deploy (CI-13-safe) on the
`web` service via Railway GraphQL `serviceInstanceDeployV2(commitSha: b27277db…)` — NOT a
bare redeploy. The web service does not auto-deploy on merge, so the deploy was fired
explicitly. Only the `web` service was deployed; `api` / `supertokens` / `Postgres` were
left untouched.

Polled the newest web deployment via `deployments(first:1, input:{projectId, serviceId})`
until it reached a terminal state: `BUILDING → BUILDING → BUILDING → SUCCESS` (~2 min for
the Vite build + `serve -s dist`). Confirmed the deployed `meta.commitHash` equals the
target commit (no stale-commit race). Discovered the public URL via the `domains` query and
health-probed `GET /` (SPA index) — 200.

- CI-13 commit-match confirmed: deployed `meta.commitHash == b27277db04547c8c49b5f7c501fe6de68ddf4a12` ✓
- Deploy status read from Railway's authoritative deployment-state endpoint (not /healthz) ✓
- Deployment is fresh: new id `cf2cf979-…`, `createdAt` 2026-07-09T22:35:32Z ✓
- Prior live web deployment was `62bae5fd` @ commit `ffcc5562` — now superseded ✓
- Web health signal: SPA served by `serve -s dist`, no `/health`; 200 on `GET /` is the signal ✓
- Canary: SKIPPED — 0 external users.

---

## Evidence

| Field | Value |
|---|---|
| service | web (`107d4255-422a-4b72-b138-0647f9192fe4`) |
| deployment id | `cf2cf979-2748-4bce-b942-2d25813ad8f8` |
| deployment status | `SUCCESS` |
| deployed commitHash | `b27277db04547c8c49b5f7c501fe6de68ddf4a12` (matches target) |
| createdAt | `2026-07-09T22:35:32.416Z` |
| web public URL | `https://web-production-bce1a8.up.railway.app` |
| web `GET /` HTTP status | `200` |
| canary_status | skipped (0 external users) |

---

```yaml
ci_stage_verdict:
  stage: C-2
  verdict: PASS
  verdict_source: railway
  service: web
  service_id: 107d4255-422a-4b72-b138-0647f9192fe4
  environment_id: bfdcc42f-fe5b-4198-a47a-b08f5940975d
  deploy_method: serviceInstanceDeployV2   # commit-targeting (CI-13-safe)
  target_commit: b27277db04547c8c49b5f7c501fe6de68ddf4a12
  deployment:
    id: cf2cf979-2748-4bce-b942-2d25813ad8f8
    status: SUCCESS
    commit_hash: b27277db04547c8c49b5f7c501fe6de68ddf4a12
    commit_match: true
    created_at: "2026-07-09T22:35:32.416Z"
    superseded: 62bae5fd-da5a-4a95-8109-96bd791b43ae   # prior live @ ffcc5562
  web_verify:
    url: https://web-production-bce1a8.up.railway.app
    probe: "GET /"
    http_status: 200
    signal: spa-index-200   # serve -s dist, no /health endpoint
  canary_status: skipped   # 0 external users
  head_signoff:
    verdict: APPROVED
    stage: C-2
    failed_checks: []
    rationale: >
      Web deploy triggered via commit-targeting serviceInstanceDeployV2 at the exact merge
      commit; newest web deployment reached SUCCESS on the authoritative Railway
      deployment-state endpoint (not /healthz), and its meta.commitHash matches the target
      (no stale-commit race). Public SPA index returns 200 on GET /. Deployment is fresh
      (new id, recent createdAt). Canary skipped — 0 external users. All applicable C-2
      checks ticked.
    next_action: PROCEED_TO_T-BLOCK
```
