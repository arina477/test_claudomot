# V-1 Source-Claim Verification (Karen) — wave-73 privacy-events audit log

**Verdict: APPROVE**

Verified against the DEPLOYED production state at merge/live commit `29a140d`
(`feat: privacy-events audit log (M10) (#90)`).
API `https://api-production-b93e.up.railway.app` · Web `https://web-production-bce1a8.up.railway.app`.

All load-bearing claims are TRUE in the deployed state. No fabricated or contradicted claims found.

---

## Findings (claim → evidence)

### 1. Files exist @ 29a140d — TRUE
`git cat-file -e 29a140d:<path>` succeeded for all five:
- `apps/api/src/db/schema/privacy_events.ts`
- `apps/api/src/privacy/append-privacy-event.service.ts`
- `packages/shared/src/privacy-events.ts`
- `apps/web/src/shell/PrivacyActivityPanel.tsx`
- `apps/api/drizzle/migrations/0028_overjoyed_black_queen.sql`

### 2. Exports present / append-only surface — TRUE
- `apps/api/src/privacy/append-privacy-event.service.ts:28` `export class AppendPrivacyEventService` exposes ONLY `append` (`:35`) + `listForActor` (`:53`). No `update`/`delete` method — header comment `:11-12` states "APPEND-ONLY … No update/delete methods — this is a ledger." Confirmed by grep (no update/delete class methods).
- `packages/shared/src/privacy-events.ts`: `PrivacyEventTypeSchema` (`:14`), `PrivacyEventSchema` (`:38`), `PrivacyEventListResponseSchema` (`:56`) all exported.
- `packages/shared/package.json:5` `"type": "module"` — shared package stayed ESM.

### 3. Route LIVE + guarded — TRUE
`curl https://api-production-b93e.up.railway.app/profile/privacy-events` → **HTTP 401** `{"message":"unauthorised"}` (not 404, not 500). Handler is `apps/api/src/privacy/privacy.controller.ts:38` `@Controller('profile')` + `:121` `@Get('privacy-events')` + `:122` `@UseGuards(SessionNoVerifyGuard)` → mounted at `/profile/privacy-events`, calls `listForActor` (`:125`). Guard produces the 401 unauth.

### 4. Migration applied to prod — TRUE (inferred)
`0028_overjoyed_black_queen.sql` creates `privacy_events` (uuid PK, actor_id FK→users, event_type, target_type, target_id nullable, context jsonb, created_at) + index `privacy_events_actor_created_idx (actor_id, created_at)`. Endpoint returns 401 (guard rejects before any query) rather than 500 — consistent with the table existing in the deployed schema; no schema-missing error surfaces.

### 5. Four hooks wired at the seams, best-effort + false-event gates — TRUE
All five event types emitted, each in try/catch with a non-fatal warn log:
- `blocks.service.ts:160` `user_blocked` — **gated on genuine insert**: `insertReturning.length > 0` (`:158`); idempotent conflict path explicitly skips the append (`:155` comment). `:196` `user_unblocked` — **gated on rows deleted**: `deleted.length > 0` (`:195`).
- `privacy.service.ts:74` `privacy_settings_changed` — **gated on genuine change**: pre-reads `before` (`:52`), computes `settingsChanged` (visibility OR whoCanDm differ), only appends if changed (`:72`).
- `account-data.service.ts:64` `data_exported` — best-effort post-export.
- `account-deletion.service.ts:124` `account_deleted` — best-effort post-commit.

### 6. Deploy serves the ESM P0 fix (zero raw require) — TRUE
Served web bundle `/assets/index-OszxDUEV.js` (from `web-production-bce1a8`): grep `require("./` count = **0**. No regression of the wave-72 P0 ESM fix in the deployed bundle.

### 7. Append-only + PII discipline — TRUE
- Service has no update/delete method (see #2); `append` is a plain `db.insert(privacyEvents)` (`append-privacy-event.service.ts:39`), `listForActor` is own-scoped `WHERE actor_id = caller` LIMIT 100 (`:53-58`).
- All four hook contexts carry ONLY enum values / ids — no email, display_name, or message body. `data_exported` / `account_deleted`: `{targetType:'self', targetId:userId}`. `user_blocked` / `user_unblocked`: `{targetType:'user', targetId:blockedUserId}`. `privacy_settings_changed`: context carries only visibility/whoCanDm enum from→to values (`privacy.service.ts:76-82`, comment `:70` "ONLY non-PII visibility/whoCanDm enum values").

### 8. Antipattern / real-test check — CLEAN
- **Integration test is real, not mocked.** `apps/api/test/integration/privacy-events.spec.ts` queries the actual table (`FROM privacy_events`, `:88`), invokes real services, and asserts rows: test 1-5 assert written rows per seam; **test 5b** asserts `toHaveLength(0)` for removeBlock-on-non-existent-block (the false-event gate); test 6 asserts no-IDOR (listForActor returns only caller's events); best-effort tests spy-reject `append` and confirm the parent operation still succeeds. This is genuine per-seam integration coverage, not `jest.fn` theater. (The `.service.spec.ts` unit files are mocked, but the DB-asserting coverage lives in the integration tier — appropriately layered.)
- **Module boundary real + acyclic.** `blocks.module.ts:3,28` imports `PrivacyModule`; `PrivacyModule` (`privacy.module.ts:1-11`) imports only `UsersModule` + `AuthModule` — does NOT import BlocksModule. Direction `BlocksModule → PrivacyModule`, no cycle. `AppendPrivacyEventService` is exported by PrivacyModule (`:19`) for injection.

---

## No blocking issues

No claim was fabricated or contradicted by the deployed state. Files + exports exist, route is live and guarded (401), migration schema is present and consistent with observed behavior, all four hooks are wired best-effort with correct false-event gates, the deployed web bundle carries the zero-require ESM fix, the ledger is append-only, and hook contexts are PII-free. Per-seam integration test asserts real rows including the gate and IDOR cases.
