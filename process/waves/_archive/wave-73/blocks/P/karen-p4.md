# Karen P-4 Phase-2 — wave-73 claim verification (M10 privacy-events audit log)

**Scope:** Verify the load-bearing CLAIMS in the P-3 plan + P-2 spec are TRUE against the live codebase. This is a spec+plan reality-check (no code exists yet for this wave) — the question is whether every REUSE target, seam, idiom, and specialist the plan leans on actually exists. It does.

## VERDICT: APPROVE

Every load-bearing claim is VERIFIED against live code. The 4 hook seams are real methods at the right layer, the reuse targets (schema idiom, shared DTO idiom, controller/guard idiom, UI panel host + chrome) all exist, `users.id` is `text`, the best-effort-after-commit idiom is a genuine shipped pattern to mirror, and append-only is enforceable by construction. No fabricated foundations. The plan is buildable as written.

---

## Per-claim findings

### 1. reports.ts schema idiom — VERIFIED
`apps/api/src/db/schema/reports.ts:38-63` is exactly the text+uuid+timestamptz, NO-pgEnum idiom the plan mirrors:
- `id: uuid('id').primaryKey().defaultRandom()` (`:41`)
- `reporter_id: text(...).references(() => users.id)` — text FK to users.id, no cascade (`:42-44`)
- `target_type: text(...).notNull()` with explicit "no pg enum per codebase convention (app-layer Zod validation)" comment (`:46`, and `:31-32` header)
- `target_id`-style nullable text cols + `created_at: timestamp(..., {withTimezone:true}).defaultNow().notNull()` (`:59`)
- trailing `index(...)` in the table-config callback (mirrors the planned `(actor_id, created_at desc)` index)
The privacy_events schema in AC B-0 maps 1:1 onto this idiom.

### 2. The 4 hook seams — VERIFIED (all real, all the right after-commit place)
- **`AccountDeletionService.deleteAccount(callerUserId)`** — `apps/api/src/privacy/account-deletion.service.ts:13`. After-commit seam is unambiguous: the SERIALIZABLE txn commits at `:99`, then post-commit best-effort work runs (`:110-121`). An `append('account_deleted', ...)` call slots in right beside the existing `revokeAllSessionsForUser` best-effort block.
- **`AccountDataService.exportAccountData(userId)`** — `apps/api/src/privacy/account-data.service.ts:52`. Real method, correct place for a post-return append.
- **`PrivacyService` privacy-settings update method = `updatePrivacy(userId, dto)`** — `apps/api/src/privacy/privacy.service.ts:38`. Named per request. It reads → UPDATEs `profile_visibility`/`who_can_dm` → returns. The `{visibilityFrom,visibilityTo}` context the spec wants is available (getPrivacy before / dto after) — a from/to capture is feasible here.
- **`blocks.service` createBlock/removeBlock** — `apps/api/src/blocks/blocks.service.ts:97` (`createBlock(blockerUserId, blockedUserId)`) and `:155` (`removeBlock(blockerUserId, blockedUserId)`). Both real; `blockedUserId` is the `targetId` the spec calls for.

### 3. privacy.module.ts + privacy.controller.ts + SessionNoVerifyGuard idiom — VERIFIED
- `apps/api/src/privacy/privacy.module.ts` exists; `@Module` with `providers`/`exports` arrays (`:8-15`) — the new `AppendPrivacyEvent` service drops in as a provider trivially.
- `apps/api/src/privacy/privacy.controller.ts` exists, `@Controller('profile')` (`:35`) — so `GET /profile/privacy-events` is a one-method addition on the correct controller.
- **SessionNoVerifyGuard is real** — `apps/api/src/auth/session-no-verify.guard.ts`, imported at `privacy.controller.ts:20` and applied on every existing route (`@UseGuards(SessionNoVerifyGuard)` at `:45,53,69,86,102`). callerId is taken from `req.session.getUserId()` (`:47,63,96,107`) — the exact no-IDOR own-scoped read idiom the plan mirrors for the new route. Guard is also used across me/notifications/profile/files controllers (established convention).

### 4. shared account-deletion.ts + index.ts (.js re-export idiom) — VERIFIED
- `packages/shared/src/account-deletion.ts` exists; `packages/shared/src/index.ts` exists.
- The `.js` re-export idiom is real: `index.ts:1-2` etc. re-export schema + inferred type from `./health.js`, and specifically account-deletion at `:265-273` (`export { DeleteAccount*Schema } from './account-deletion.js'` + `export type {...} from './account-deletion.js'`). The new `privacy-events.ts` mirrors this exactly. (Note: `./privacy.js` already re-exported at `:168` — confirms the module-per-domain pattern.)

### 5. SettingsPrivacyPage.tsx + BlockedUsersPanel.tsx — VERIFIED
- Both exist: `apps/web/src/pages/SettingsPrivacyPage.tsx`, `apps/web/src/shell/BlockedUsersPanel.tsx`.
- BlockedUsersPanel is a genuine read-list panel with the exact chrome the plan reuses: `loading`/`error`/`loaded` states (`:254`), `.map(...)` list render (`:294`), toast/role=alert error handling — a real loading/empty/error/list template.
- SettingsPrivacyPage already imports and renders `<BlockedUsersPanel />` (`:31`, `:449`) — proof the page is the correct host and the panel-drop-in pattern is live. `PrivacyActivityPanel` follows the same insertion.

### 6. users.id is TEXT — VERIFIED
`apps/api/src/db/schema/users.ts:8`: `id: text('id').primaryKey()`. So `privacy_events.actor_id text` FK to `users.id` is type-correct (a uuid FK would have been WRONG). No-cascade is also consistent with reports.ts's text-FK-no-cascade treatment of soft-deletable users.

### 7. Specialists in AGENTS.md — VERIFIED
All 4 present in `command-center/AGENTS.md`: `backend-developer` (`:70`), `postgres-pro` (`:81`), `react-specialist` (`:82`), `typescript-pro` (`:83`). Routing in the plan (B-0 postgres-pro, B-1 typescript-pro, B-2 backend-developer, B-3 react-specialist) is valid.

### 8. Antipattern check — "best-effort after-commit non-blocking hook" grounded? + append-only enforceable? — VERIFIED
- **Best-effort-after-commit idiom is a REAL shipped pattern, not aspirational.** `account-deletion.service.ts:99` (txn commits) → `:110-121`: `try { await Session.revokeAllSessionsForUser(...) } catch (err) { this.logger.warn(...) }`. That is precisely "after-commit, wrapped, failure caught+logged, host action already committed and unaffected." The header comment (`:101-109`) even articulates the exact rationale the spec cites ("A failure here must NOT strand the already-committed erasure or produce a misleading 500"). The 4 new hooks mirror an idiom that already ships — the strongest possible grounding.
- **Append-only is genuinely enforceable by construction.** AC B-2 specifies a service exposing ONLY `append(...)` — no update/delete methods. Since all writes route through that single provider and the read endpoint is a SELECT, append-only-by-convention holds at the app layer (the spec correctly FENCES cryptographic tamper-evidence as out of scope, so no over-claim). This is a real, checkable constraint (a reviewer greps the service for update/delete and finds none), and the B-2 LIVE-DB per-seam integration test (assert an actual row after each of the 4 real actions, not a code-read) directly guards the "plumbing built but not wired" failure mode.

---

## Notes / non-blocking observations (not gate-affecting)
- **Context capture at seam 3 (`updatePrivacy`)**: the `{visibilityFrom,visibilityTo}` delta requires reading the pre-update value. `updatePrivacy` currently does a blind UPDATE (`:38-49`) without first reading old values. B-2 will need a pre-read (or reuse `getPrivacy`) to populate the from/to context — feasible, but flag it so B-2 doesn't ship an append with `visibilityFrom` missing. Spec already hedges with "and/or whoCanDm from/to", so this is an implementation detail, not a spec gap.
- **PII discipline** is spec-fenced correctly (context = minimal non-PII deltas only; never emails/message bodies/tokens). The T-8/security lens should confirm at B-6 that no seam leaks PII into `context` (esp. seam 4 where a display_name could tempt its way in — spec says targetId only, which is right).

**Bottom line:** every foundation the plan stands on is real and at the right layer. APPROVE.
