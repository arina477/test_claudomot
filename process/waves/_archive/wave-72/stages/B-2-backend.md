# Wave 72 — B-2 Backend

**Specialist:** backend-developer (per plan — one cohesive erasure unit, serial after B-1).

## Files implemented
- `apps/api/src/privacy/account-deletion.service.ts` (NEW) — `deleteAccount(callerUserId)`: idempotency guard → owned-server block (ConflictException + DeleteAccountBlockedResponse body) → PII scrub (display_name='Deleted user', username=null, email='deleted+<id>@deleted.invalid', avatar_url=null, **avatar_key=null**) + deleted_at=now → `Session.revokeAllSessionsForUser` → delete server_members rows.
- `apps/api/src/privacy/privacy.controller.ts` — `POST /profile/delete` (@HttpCode(200), guarded), callerId ALWAYS from `req.session.getUserId()` (no userId param → no-IDOR), body via `DeleteAccountRequestSchema.safeParse` (400 on fail).
- `apps/api/src/privacy/privacy.module.ts` — AccountDeletionService provider/export; removed stale "not registered" comment.
- `apps/api/src/auth/supertokens.config.ts` — **RE-AUTH BLOCK both doors:** (i) `EmailPassword override.functions.signIn` → returns `WRONG_CREDENTIALS_ERROR` when local users.deleted_at IS NOT NULL; (ii) `Session override.functions.getSession` AND `refreshSession` → throw `UNAUTHORISED (clearTokens)` when deleted_at IS NOT NULL. getSession covers every verifySession; refreshSession covers token rotation. Live DB read (reuses existing db handle, no 2nd connection).
- `apps/api/src/privacy/privacy.controller.spec.ts` — updated mock ctor (3rd param) after DI addition.
- `apps/api/test/integration/account-deletion.spec.ts` (NEW) — pg-harness: no-IDOR (only session caller deleted), block-if-owner 409 (+ deleted_at stays null), erasure (asserts avatar_key IS NULL explicitly, server_members→0, idempotent, distinct email placeholders), re-auth-blocked (exercises the override deleted_at branch directly + asserts UNAUTHORISED signature — SuperTokens core unavailable in harness, both doors proven independently).

## Carry-forward reconciliation
- **AppModule registration (P-4 karen watch-item): NON-ISSUE.** grep confirms `PrivacyModule` imported in app.module.ts:16 + registered :55 (since wave-35). The module's stale self-comment was wrong; route mounts once the service is provided (done). Removed the stale comment.
- avatar_key scrub: ✅ landed (null).
- Both doors: ✅ hard AND (signIn + getSession + refreshSession).
- No hard SuperTokens deleteUser: ✅ (reversible soft-delete).

## Deviations (adjudicated)
1. **Presence clear via socket-disconnect, not PresenceService injection** — ACCEPT. Presence is an in-memory Map (no DB row); session revoke drops the socket → gateway handleDisconnect clears presence. Injecting PresenceService would risk a circular module graph. Matches intent.
2. **username → null (not `deleted_<id>` placeholder)** — ACCEPT. username has a lower() unique index; Postgres excludes NULLs from unique indexes, so null is collision-free and cleaner than a per-user string. email uses the per-user placeholder (email is NOT NULL + unique).

## Verify
- `pnpm --filter @studyhall/api typecheck` → exit 0, zero errors. `biome check` on all touched files → clean.
- Integration spec compiles; runs in CI (postgres) — local DB unreachable in worker.
- Code verified lean: no gold-plating (no 30-day-grace job, email-verify, audit-log infra, or hard-delete introduced).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [backend-developer]
files_implemented:
  - apps/api/src/privacy/account-deletion.service.ts
  - apps/api/src/privacy/privacy.controller.ts
  - apps/api/src/privacy/privacy.module.ts
  - apps/api/src/auth/supertokens.config.ts
  - apps/api/src/privacy/privacy.controller.spec.ts
  - apps/api/test/integration/account-deletion.spec.ts
deviations:
  - {specialist: backend-developer, change: presence-clear-via-socket-disconnect, plan_said: use-presence-clear-mechanism, why: in-memory-map-no-db-row-avoids-circular-module, adjudication: accept}
  - {specialist: backend-developer, change: username-null, plan_said: deleted_<id>-placeholder, why: postgres-unique-index-excludes-nulls-collision-free, adjudication: accept}
simplify_applied: true
```
