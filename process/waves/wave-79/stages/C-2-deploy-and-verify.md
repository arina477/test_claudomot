# C-2 — Deploy & verify (wave-79)

**Wave:** M13 leg-3a — server-blind E2E DM encryption.
**Merge commit deployed:** `0fa0f5f0aa6dfcf86e2df0d7dcc12083167ab3fa`
**Platform:** Railway (GraphQL only — `Project-Access-Token` header, no CLI, no `me{}`).
**Project:** `ae55c191-4631-4224-b7b2-42f329ed48d7` (app-arina-89ejyn), env production `bfdcc42f-fe5b-4198-a47a-b08f5940975d`.

## Action 0 — credential
Deploy-scoped GraphQL probe (`project(id){services}`) returned the project + 4 services (web, api, supertokens, Postgres) with no `errors` — credential present + usable. No founder pause.

## STEP 1 — migrations (0031 → 0032) applied to prod BEFORE api deploy
- Fetched `DATABASE_PUBLIC_URL` from Postgres service `8d177be8` via GraphQL `variables()` → host `yamanote.proxy.rlwy.net:40008`, `db=railway user=postgres`.
- **Same-instance check (head-ci-cd risk #2):** api runtime `DATABASE_URL` (`postgres.railway.internal:5432`) and the public URL both resolve to `db=railway user=postgres` — same Postgres service. Migrate target == api runtime DB.
- Ran `DATABASE_URL=<public> pnpm --filter @studyhall/api db:migrate` (drizzle-kit migrate; journal-ordered, applies 0031 then 0032). Exit 0, "migrations applied successfully!".
- **Post-migrate column verification (gate before api deploy — head-ci-cd risk #1):**
  - `user_encryption_keys` table PRESENT — cols: id, user_id, public_key, algorithm, created_at, updated_at (no private-key column).
  - `dm_messages.content` now **nullable=YES** (was NOT NULL).
  - New cols present + nullable: `ciphertext`, `sender_key_ref`, `envelope_version`, `deleted_at`.
- Schema verified BEFORE any api deploy triggered.

## STEP 2 — deploy merge commit to BOTH services
- `serviceInstanceDeployV2(environmentId, serviceId, commitSha=0fa0f5f…)` for api (`7358a103`) → deployment `c0010329-85c3-4fd0-af13-a66a5649d004`; web (`107d4255`) → deployment `d8edfbe9-3032-4527-9805-83ac8f29ca8e`. commitSha passed on both.
- Polled `deployments(first:1, input:{projectId, serviceId})` via inline Monitor (10-min cap) through BUILDING → DEPLOYING → SUCCESS. Both terminal = SUCCESS well under cap (no MONITOR-task promotion needed).

## STEP 3 — verification
| Check | Result |
|---|---|
| api deployment status | SUCCESS, `meta.commitHash` = `0fa0f5f…` (== merge SHA) |
| web deployment status | SUCCESS, `meta.commitHash` = `0fa0f5f…` (== merge SHA) |
| api `/health` | HTTP 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| web `/` | HTTP 200 |
| GET `/profile/:userId/encryption-key` (unauth) | **HTTP 401** `{"message":"unauthorised"}` — new route live |
| PUT `/profile/encryption-key` (unauth) | **HTTP 401** `{"message":"unauthorised"}` — new route live |

- api URL: `https://api-production-b93e.up.railway.app` · web URL: `https://web-production-bce1a8.up.railway.app`
- No health `commit`/`uptime` field in body → fresh-deploy confirmed via Railway deployment-state SUCCESS + `meta.commitHash` match (per C-2 Action 3 no-commit-in-health path).
- Both-service-one-SHA guard (head-ci-cd risk #4): both deployed commits verified == merge SHA before declaring PASS.

## Canary — SKIPPED
```yaml
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 real users < 1000); T-block synthetic probes are the post-deploy signal."
```

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment SUCCESS, meta.commitHash 0fa0f5f0aa6dfcf86e2df0d7dcc12083167ab3fa (== merge SHA)"
  - "railway web: deployment SUCCESS, meta.commitHash 0fa0f5f0aa6dfcf86e2df0d7dcc12083167ab3fa (== merge SHA)"
  - "https://api-production-b93e.up.railway.app/health: 200 {status:ok, service:studyhall-api, version:0.0.1}"
  - "https://web-production-bce1a8.up.railway.app/: 200"
  - "GET /profile/:userId/encryption-key unauth: 401 (new route live)"
  - "PUT /profile/encryption-key unauth: 401 (new route live)"
  - "migrations 0031_wave79_user_encryption_keys then 0032_wave79_dm_envelope applied IN ORDER to prod before api deploy; columns verified (user_encryption_keys table present; dm_messages.content nullable + ciphertext/sender_key_ref/envelope_version/deleted_at present)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 0fa0f5f0aa6dfcf86e2df0d7dcc12083167ab3fa, verified_at: "2026-07-08T02:30:00Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: 0fa0f5f0aa6dfcf86e2df0d7dcc12083167ab3fa, verified_at: "2026-07-08T02:30:00Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
migrations_applied: ["0031_wave79_user_encryption_keys", "0032_wave79_dm_envelope"]   # in order, before api deploy; columns verified
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 real users < 1000); T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "Two Drizzle migrations applied in order 0031→0032 to prod (bare-node api, no auto-migrate) and columns verified BEFORE the api deploy. Both services deployed the merge commit and serve it healthily; new encryption-key routes return 401 unauth. Canary skipped (pre-launch, DAU<1000)."
```

## C-block exit / handoff

```yaml
cicd_block_status: complete
pr_number: 98
pr_url: https://github.com/arina477/test_claudomot/pull/98
merge_commit: 0fa0f5f0aa6dfcf86e2df0d7dcc12083167ab3fa
migrations_applied: ["0031_wave79_user_encryption_keys", "0032_wave79_dm_envelope"]   # in order
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 0fa0f5f0aa6dfcf86e2df0d7dcc12083167ab3fa}
  - {platform: railway, service: web, state: SUCCESS, commit: 0fa0f5f0aa6dfcf86e2df0d7dcc12083167ab3fa}
canary_status: skipped
ready_for_test: true
```

**Note for V-block:** B-6 tagged 3 non-blocking crypto follow-ups (F3 server-side senderKeyRef validation, F5 who_can_dm key-fetch timing oracle, F8 GET encryption-key rate-limit) as V-2 follow-ups. T-8 security stage owns the server-blind invariant + honest-indicator proofs.
