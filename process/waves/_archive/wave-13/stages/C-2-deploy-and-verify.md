# C-2 — Deploy & verify (wave-13 M3 message lifecycle)

PR #24 merged to main (squash). Merge SHA `427d5d6fdbeca54b0558b86669ae1279fbd8eef0`.

## C-1 recap (PR + CI + merge)
- PR: https://github.com/arina477/test_claudomot/pull/24 (`feat(messaging): M3 message edit/delete + reactions (#wave-13)`).
- All 6 required checks PASS: lint, typecheck, test (~350 tests), build, secret-scan, boot-probe. Informational e2e also PASS.
- boot-probe SUCCESS — extended gateway `@OnEvent`/emit handlers + providers wire cleanly (no DI/import crash on boot of compiled api).
- secret-scan SUCCESS — no secret in diff.
- Squash-merged + branch deleted.

## Migration 0006 (applied to prod BEFORE cutover)
- `drizzle-kit migrate` against prod DATABASE_PUBLIC_URL (yamanote.proxy.rlwy.net:40008). Applied successfully; 7 total migrations now applied.
- Authoritative schema verification (direct pg query, post-migrate):
  - messages soft-delete cols present: `is_edited`, `edited_at`, `is_deleted`, `deleted_at`.
  - `message_reactions` table exists.
  - idempotency UNIQUE constraint `message_reactions_message_user_emoji` present.

## Deploy (CLI `up` source-upload — NOT GraphQL no-op)
- Mechanism: `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN npx @railway/cli up --service <api|web> --environment production --ci` (per wave-12 lesson — CLI up builds a fresh image; GraphQL serviceInstanceDeploy re-runs existing image = no-op).
- Rollback baseline captured pre-deploy: api `86f4bc21-0527-4aea-8922-ca535e322ffd`, web `97f34dda-28c5-41cc-8843-b0b5037ab20b` (both SUCCESS) — reachable rollback targets.
- Authoritative deployment-state (Railway GraphQL deployments endpoint, NOT /health):
  - api NEW deployment `853b5db2-bb98-4f02-a464-475a27cf2de4` → SUCCESS.
  - web NEW deployment `dbd9837e-e79b-4704-8edc-246341fc11b1` → SUCCESS (baseline now REMOVING).
- New revision serves (stale-revision guard): api new-only routes route-probe → 401 auth-gated (NOT 404). web root → 200.

## Env-var scoping (security)
- api: DATABASE_URL, DATABASE_URL_UNPOOLED, SESSION_SECRET, SUPERTOKENS_API_KEY, SUPERTOKENS_CONNECTION_URI.
- web: VITE_API_ORIGIN, RAILWAY_SERVICE_API_URL only — NO DB/SuperTokens creds leaked into frontend service.

## Live verification (rigorous, against prod, wave-11 fixture)
- api /health → 200 (clean boot, gateway loaded).
- Boundary (unauthed): PATCH edit → 401; DELETE → 401; POST reactions → 401.
- Lifecycle round-trip (fixture is author):
  - send → PATCH edit → 200, `isEdited: true`, content updated.
  - reaction toggle ON → `{reacted: true}`; toggle OFF → `{reacted: false}` (idempotent).
  - DELETE → 204; GET list shows tombstone (`isDeleted: true`, `content: null`).
- Two-client realtime (two authed sockets join `/messaging` channel room; measured):
  - B receives `message:updated` 90ms; `reaction:added` 87ms; `message:deleted` 112ms (all <1s).
  - No-leak: third socket NOT joined to channel received none of the three events.
- Cross-user authz (non-author edit/delete → 403): trusted to committed unit tests (`messages.service.spec.ts:286` non-author edit → ForbiddenException; service throws at lines 246/339). Only one persistent prod fixture exists; live author-edit path exercised.

## Canary
- Skipped per traffic threshold (self-use-mvp; DAU < 1000; canary.enabled=false in CI-PRINCIPLES). Synthetic probes above are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: gh railway
verdict_evidence:
  - "gh: PR #24 all 6 required checks pass (incl. boot-probe); squash-merged SHA 427d5d6"
  - "railway api: deployment 853b5db2 status SUCCESS (new revision; route-probe 401 not 404)"
  - "railway web: deployment dbd9837e status SUCCESS; root 200"
  - "prod schema: soft-delete cols + message_reactions + idempotency UNIQUE verified post-migrate"
  - "live: edit isEdited:true / reaction toggle true->false / delete tombstone content:null"
  - "two-client realtime: message:updated 90ms, reaction:added 87ms, message:deleted 112ms; no-leak confirmed"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment: 853b5db2-bb98-4f02-a464-475a27cf2de4, verified_at: 2026-06-30T03:32Z, health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, deployment: dbd9837e-e79b-4704-8edc-246341fc11b1, verified_at: 2026-06-30T03:32Z, health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (self-use-mvp, <1000); synthetic prod verification is the post-deploy signal."
note: "Deploy via Railway CLI up source-upload (wave-12 lesson). Rollback targets: api 86f4bc21, web 97f34dda."
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    C-1 cleared with all six required CI jobs green including boot-probe (DI/import wiring of the
    extended gateway handlers proven), secret-scan blocking, feature->main branch, migration 0006
    SQL committed. C-2 applied migration 0006 explicitly before cutover and verified the soft-delete
    columns + message_reactions table + idempotency UNIQUE directly in prod. Deploy used the Railway
    CLI up source-upload (not the GraphQL no-op) and both api and web reached SUCCESS via the
    authoritative deployment-state endpoint; the new revision is confirmed serving via a new-only
    route-probe returning 401 not 404 (stale-revision guard). Per-service env scoping correct (no DB
    creds on web). Live lifecycle verified against prod with the fixture: edit (isEdited), idempotent
    reaction toggle, soft-delete tombstone, plus two-client realtime under 1s for all three events and
    a confirmed no-leak to a non-joined socket. Rollback targets identified and reachable. Canary
    skipped per traffic threshold. No false-green.
  next_action: PROCEED_TO_T_BLOCK
```
