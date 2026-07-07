# Wave 73 — B-2 Backend

**Specialist:** backend-developer (task 156aa2ee).

## Files implemented
- `apps/api/src/privacy/append-privacy-event.service.ts` (NEW) — APPEND-ONLY: `append(actorId, eventType, {targetType, targetId?, context?})` (validates eventType via `PrivacyEventTypeSchema.parse`, INSERTs one row) + `listForActor(actorId)` (SELECT WHERE actor_id ORDER BY created_at DESC LIMIT 100, maps snake_case→camelCase PrivacyEvent DTO). No update/delete.
- `privacy.module.ts` — provider + export.
- `privacy.controller.ts` — `GET /profile/privacy-events` (SessionNoVerifyGuard, session-only callerId, NO userId param → no-IDOR) → PrivacyEventListResponse.
- **4 non-blocking after-commit hooks** (best-effort try/catch, logging failure NEVER fails the user action): account-deletion.service (account_deleted, after the post-commit revoke block — fires even if revoke threw), account-data.service (data_exported), privacy.service (privacy_settings_changed — **pre-reads old settings via getPrivacy** for {visibilityFrom/To, whoCanDmFrom/To} context per the karen P-4 carry-forward), blocks.service (user_blocked/user_unblocked with targetId).
- **Module boundary:** BlocksModule imports PrivacyModule (one-way, no cycle).
- `apps/api/test/integration/privacy-events.spec.ts` (NEW, pg-harness real DB) — **per-seam row assertions** (all 5 event types assert an actual privacy_events row after the real action); no-IDOR (user A's read excludes user B); best-effort×3 (append throws → action still resolves); no-PII (context has only visibility/whoCanDm enum values); DTO camelCase; DESC ordering.
- Existing tests + pg-harness updated for the new DI param + truncate list.

## Carry-forward honored (P-4 flags)
1. updatePrivacy pre-read → from/to context. ✅
2. PII discipline (context only non-PII enum values/ids) + no-PII test assertion. ✅
3. Per-seam LIVE-DB assertion (real row after each of the 4/5 actions). ✅
4. Best-effort non-blocking (logging failure swallowed, action succeeds). ✅

## Deviations (adjudicated)
1. deleteAccount hook fires after the revoke try/catch in its own independent try/catch (fires even if revoke threw — correct: the erasure txn committed, that's the auditable action) — ACCEPT.
2. privacy.service.spec updated for 2 SELECTs (pre-read + post-read) — ACCEPT (mock returns same chain; assertions unaffected).
3. removed an unused helper (biome) — ACCEPT.

## Verify
- `pnpm --filter @studyhall/api typecheck` → clean. `biome check` on 17 files → clean.
- Integration spec compiles; runs in CI (postgres). Local DB unreachable.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [backend-developer]
files_implemented: [append-privacy-event.service.ts, privacy.module.ts, privacy.controller.ts, account-deletion.service.ts, account-data.service.ts, privacy.service.ts, blocks.service.ts, blocks.module.ts, privacy-events.spec.ts, +test-stub-updates, pg-harness.ts]
deviations:
  - {specialist: backend-developer, change: delete-hook-after-revoke-independent-trycatch, adjudication: accept}
  - {specialist: backend-developer, change: privacy-spec-2-selects, adjudication: accept}
simplify_applied: true
```
