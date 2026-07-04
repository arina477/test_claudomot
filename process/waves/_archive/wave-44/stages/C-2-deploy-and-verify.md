# C-2 — Deploy & verify (wave-44, M8 polish/hardening)

**Merge commit:** `4522101` (full: `4522101fe43dddf77d4f04150c143d27b8be8d24`) — PR #58 squash, main HEAD.
**Deploy model:** Railway GraphQL API only (`Project-Access-Token` header; NEVER the railway CLI — `railway-guard.sh` hard-blocks it). Token: `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN`.
**Deploy method:** `serviceInstanceDeploy(serviceId, environmentId, commitSha:"4522101", latestCommit:true)` — commitSha PINNED (wave-41 stale-snapshot lesson). Verified via `deployments(first:1)` query for authoritative status + meta.commitHash.

## MEMORY correction
The persisted note "Railway deploy is CLI-push not git-trigger / run `railway up`" is **STALE** — services are git-connected and deployed via the GraphQL `serviceInstanceDeploy` mutation pinned to the merge commit SHA. The `railway` CLI is hard-blocked. This deliverable used the corrected GraphQL model exclusively.

## Action 0 — Credential
Railway project token present (`APP_RAILWAY_TOKEN` → `RAILWAY_TOKEN`). Deploy-scoped probe `project(id:"ae55c191-…")` returned `data.project` (name `app-arina-89ejyn`, 4 services: web, api, supertokens, Postgres) with no `errors`. Credential usable. No pause.

## Action 1 — Migration
**SKIPPED — no DB migration this wave.** M8 is polish/hardening only. Per P-3 plan: 0308cdf1's columns already existed; wave-44 change is DTO projection + web responsive/a11y polish. No `drizzle-kit migrate` run; no schema change to sequence.

## Action 2 — Deploy verification (authoritative Railway deploy-state, NOT /healthz)

Pre-deploy baseline (captured before cutover):
- api serving commit `e7f1f7a` (SUCCESS)
- web serving commit `7b0bc47` (SUCCESS), bundle `index-C8KFLd6n.js`

Deploy fired both services pinned to `commitSha:"4522101"`; both mutations returned `serviceInstanceDeploy: true`. Inline-poll to terminal state (BUILDING → SUCCESS at t=61s, under the 10-min cap):

| Service | Deploy status | meta.commitHash | Match 4522101 |
|---|---|---|---|
| api (`7358a103-…`) | **SUCCESS** | `4522101fe43dddf77d4f04150c143d27b8be8d24` | YES |
| web (`107d4255-…`) | **SUCCESS** | `4522101fe43dddf77d4f04150c143d27b8be8d24` | YES |

## Action 3 — Live verification (new revision serving traffic; no stale-revision race)

| Probe | Expected | Actual |
|---|---|---|
| `GET https://api-production-b93e.up.railway.app/health` | 200 | **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| `POST /servers/<uuid>/scheduled-sessions` (unauth) | 401 (no regression) | **401** |
| `GET /scheduled-sessions/<uuid>` (unauth) | 401 (no regression) | **401** |
| `GET https://web-production-bce1a8.up.railway.app/` | 200 + new bundle | **200**, bundle `index-CX7LuM3C.js` |
| Web bundle hash changed vs baseline | ≠ `index-C8KFLd6n.js` | **CHANGED** → `index-CX7LuM3C.js` |
| New web bundle carries feature | scheduling/assignment UI present | **PRESENT** — 106×`assignment`, 52×`schedule`, 37×`submission`, 5×`scheduled-sessions` in served JS (1.77MB) |

Bundle-hash change + feature strings present confirm the NEW revision is the one serving traffic — not a stale cache answering for the old deploy.

## Action 5–7 — Canary
**SKIPPED** — StudyHall real-user traffic (DAU) is below the 1000 threshold. Synthetic no-regression probes above are the post-deploy signal; T-block layered synthetic checks follow.

## Env-var scoping (spot check)
No env change this wave (polish only). api serves `/health` + auth-gated scheduling routes (SuperTokens 401 on unauth) confirming its DB/SuperTokens scope intact; web serves a static bundle with no DB creds required. No cross-service leak introduced.

## Rollback path (identified, reachable)
Previous good revisions are one `serviceInstanceRedeploy`/`serviceInstanceDeploy` away: api → `e7f1f7a` (deployment `9f3adbfb-…`), web → `7b0bc47` (deployment `97ff28cc-…`). Both were SUCCESS immediately prior; pinned-SHA redeploy restores either service in one GraphQL mutation.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api svc 7358a103: deployment SUCCESS, meta.commitHash 4522101fe43dddf77d4f04150c143d27b8be8d24"
  - "railway web svc 107d4255: deployment SUCCESS, meta.commitHash 4522101fe43dddf77d4f04150c143d27b8be8d24"
  - "api /health: 200 {\"status\":\"ok\"}"
  - "api POST /servers/<uuid>/scheduled-sessions unauth: 401 (no regression)"
  - "api GET /scheduled-sessions/<uuid> unauth: 401 (no regression)"
  - "web /: 200, bundle index-CX7LuM3C.js (changed from index-C8KFLd6n.js)"
  - "web bundle carries scheduling/assignment UI (106 assignment / 52 schedule / 5 scheduled-sessions hits)"
migration: skipped-no-schema-change
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 4522101fe43dddf77d4f04150c143d27b8be8d24, verified_at: 2026-07-04T16:00:00Z, health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: 4522101fe43dddf77d4f04150c143d27b8be8d24, verified_at: 2026-07-04T16:00:00Z, health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (< 1000); T-block synthetic probes are the post-deploy signal."
note: "No DB migration this wave (M8 polish only; columns already existed, DTO projection only). Both api+web deployed pinned to merge commit 4522101 via Railway GraphQL serviceInstanceDeploy; SUCCESS confirmed via deployments query (NOT /healthz). New web bundle hash changed + carries feature = new revision serving, no stale-revision race. Stale MEMORY 'railway up CLI-push' note corrected: GraphQL-only, CLI hard-blocked."
```

## head_signoff
```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Both api and web deployed pinned to merge commit 4522101 via the Railway
    GraphQL serviceInstanceDeploy mutation. Deploy verification read the
    authoritative deployments deploy-state endpoint (status SUCCESS +
    meta.commitHash == 4522101 for both services), NOT a naive /healthz. The
    new revision is confirmed to be the one serving traffic: the web bundle
    hash changed (C8KFLd6n → CX7LuM3C) and the served bundle carries the
    scheduling/assignment UI, ruling out a stale-revision race. No migration
    was required this wave (polish only; columns pre-existed) and that skip is
    recorded explicitly. No regression — api health 200 and both scheduling
    routes correctly 401 on unauth. Canary skipped per sub-1000 DAU threshold.
    Rollback to prior good revisions (api e7f1f7a, web 7b0bc47) is one GraphQL
    mutation away and was identified before sign-off.
  next_action: PROCEED_TO_T
```
