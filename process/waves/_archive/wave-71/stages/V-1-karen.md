# V-1 Karen — Reality Verification (wave-71, M14 Block UI-polish)

**Role:** Karen — source-claim truth verification (NOT spec conformance; that is jenny's V-1).
**Question:** Are the load-bearing CLAIMS of wave-71 TRUE in the DEPLOYED state?
**Merge:** `670c46e` (feat: block UI polish (M14), PR #87) — confirmed on `main`.
**Note:** current `main` HEAD is `9f8f2b6` (T-9 journey docs, non-code, post-merge). Deployed code == merge tree `670c46e`.
**Deployed:** api `https://api-production-b93e.up.railway.app` · web `https://web-production-bce1a8.up.railway.app`
**Date:** 2026-07-07

---

## VERDICT: APPROVE

Every load-bearing claim is TRUE in the deployed state. No fabrication, no coverage theater, no masked P0. The two behaviors this wave exists to deliver — live member-row Block↔Unblock flip and the enriched (named) blocked-users list — are proven live on prod (T-5) and backed by real (non-mock-masked) tests on the merge tree. The critical safety surfaces (block authz + DM HIDE) are provably untouched.

---

## Claim-by-claim evidence

### CLAIM 1 — Files present on merge tree `670c46e` — TRUE
All seven claimed files exist on the merge tree (`git cat-file -e 670c46e:<path>`):
- `packages/shared/src/blocks.ts` — exports `BlockedUserDisplaySchema` (line 48) + `BlockListItemSchema` (line 64, `= BlockSchema.extend({ blockedUser: BlockedUserDisplaySchema })`) + `BlockListResponseSchema`. ✓
- `apps/api/src/blocks/blocks.service.ts` — `listBlocks` (line 175) with `.leftJoin(users, eq(userBlocks.blocked_id, users.id))` (line 187) + `rowToListItemDto` (line 62); bare `rowToDto` kept for createBlock/conflict-path (lines 42/129/146). ✓
- `apps/web/src/shell/useBlocks.ts`, `BlockConfirmDialog.tsx`, `MemberListPanel.tsx`, `BlockedUsersPanel.tsx`, `block-dialog-store.test.tsx` — all PRESENT. ✓

### CLAIM 2 — P0 fix deployed: dialog routes through the store; exactly ONE api.blockUser call site — TRUE
- `BlockConfirmDialog.tsx:37` imports `useBlocks`; line 108 `const { blockUser } = useBlocks();`; line 181 `await blockUser(targetUserId);` — it calls the STORE, not `api.blockUser` directly. ✓
- `git grep "api\.blockUser(" 670c46e -- apps/web/src/**` returns **exactly ONE** production call site: `useBlocks.ts:122` inside `doBlockUser`. All other hits are test files / comments / the destructured store accessor. ✓
- `doBlockUser` (useBlocks.ts:115+) is optimistic (adds to `blockedSet` → row flips to Unblock immediately), calls `api.blockUser` once, re-fetches enriched list, and reverts the set on failure. The exact P0 (row never flipped because the dialog bypassed the store) is genuinely fixed. ✓

### CLAIM 3 — Safety UNTOUCHED (critical) — TRUE
`git diff 670c46e^..670c46e --name-only` does NOT contain `apps/api/src/blocks/blocks.controller.ts` NOR `apps/api/src/dm/dm.service.ts`. Block authz (controller AuthGuard) and DM HIDE seams have ZERO changes this wave. ✓
(The service diff touches only `listBlocks`/read-side enrichment; createBlock/removeBlock/isBlockedBetween and the 5 DM HIDE seams are untouched, corroborated by integration cases 10–19 all preserved.)

### CLAIM 4 — Routes live + guarded on DEPLOYED api; enrichment live — TRUE
Live probes against `https://api-production-b93e.up.railway.app`:
- `POST /blocks` unauth → **401** ✓ (body `{"message":"unauthorised"}` — AuthGuard fires, not a stale 404/200)
- `GET /blocks` unauth → **401** ✓
- `GET /health` → 200; web `/` → 200 (title `StudyHall`).
- Enrichment live: T-5 probe (`T-5-tester-1.md:47-51`) captured `GET /blocks` returning `blockedUser{userId,displayName:"studyhallfixtureb",username:"studyhallfixtureb",avatarUrl:null}` — a real name, NOT a UUID. Row rendered `studyhallfixtureb` / `@studyhallfixtureb` / "ST" initials with UUID-regex over visible text = false. ✓

### CLAIM 5 — Deploy hash: both services on `670c46e` — TRUE (consistent, not independently re-derivable from live endpoint)
C-2 records api deployment `b74ab74b-…` + web `a9992ce6-…`, both terminal SUCCESS, both `deployment.meta.commitHash == 670c46e`. The live `/health` does not expose a commit hash (returns `{"status":"ok","version":"0.0.1"}`), so the hash is not independently re-derivable from the endpoint — but the BEHAVIORAL proof is stronger and consistent: the enriched-401 route + T-5's live enriched `GET /blocks` DTO only exist on `670c46e`, so the serving revision IS the merge tree. No stale-revision indicator found. ✓

### CLAIM 6 — Antipattern sweep — CLEAN
- **P0-fix test real, not decorative:** `block-dialog-store.test.tsx` does NOT mock `useBlocks` (header line 5-7 explicit); it mocks only the `../auth/api` layer, renders the REAL `MemberListPanel` with the REAL store, clicks the member-row Block button → real `BlockConfirmDialog`, confirms, and asserts the row testid flips `block-member-btn-*` → `unblock-member-btn-*` (lines 183-185). Also asserts `api.blockUser` called exactly once (line 178, no double-POST) AND a rollback case (mockRejectedValue → row does NOT flip, error toast shown, lines 189-219). This drives the actual dialog+store wiring — genuinely regression-proof, not mock-masked. ✓
- **Enrichment integration test real (3 cases against real Postgres):** `blocks.integration.spec.ts` cases 20 (real `display_name` "Bob Blocked", asserts `!= USER_B` UUID), 21 (no display_name → falls back to `username` 'user-b'), 22 (both NULL → 'Unknown user'). Harness (`pg-harness.ts`) connects a real `pg.Pool` to `DATABASE_URL_TEST`, applies real Drizzle migrations, fails loud if unset (lines 47-58) — a genuine real-DB integration test exercising the actual `listBlocks` LEFT JOIN, NOT a mock. (The "postgres:16" descriptor names the target DB engine; the harness targets a real env-provisioned Postgres via connection string rather than a pinned image literal — the real-DB claim holds.) The 5 DM HIDE seams (cases 10-19) are all preserved, corroborating claim 3. ✓
- **No migration — correct:** C-2 confirms zero migration/SQL files in the diff (read-side LEFT JOIN, `user_blocks` schema unchanged, prod DB current at 0026). Diff name-only contains no migration files. ✓
- **The 1 T-block finding honestly documented:** T-5 finding (`T-5-tester-1.md:87`) — member-row Block/Report/kebab affordances are hover-only (`opacity-0 group-hover:opacity-100`) requiring wide viewport; flagged as intended hover-reveal UX, noted for future keyboard/touch a11y review, explicitly scoped OUT of this wave. Honest, non-blocking, correctly deferred. ✓

---

## Findings summary

| # | Claim | Verdict | Load-bearing evidence |
|---|-------|---------|-----------------------|
| 1 | 7 files on merge tree | TRUE | `git cat-file -e 670c46e:<path>` all PRESENT; schema + service line refs above |
| 2 | P0 fix deployed (dialog→store, 1 call site) | TRUE | `BlockConfirmDialog.tsx:108/181`; `git grep api.blockUser(` → 1 site `useBlocks.ts:122` |
| 3 | Safety untouched (controller + dm.service) | TRUE | `git diff 670c46e^..670c46e --name-only` → neither file present |
| 4 | Routes 401 + enrichment live | TRUE | live curl POST/GET /blocks → 401 (`{"message":"unauthorised"}`); T-5 live DTO real name |
| 5 | Both services deployed on 670c46e | TRUE (consistent) | C-2 deployment ids + commitHash==670c46e; behavior-corroborated (enriched route serving); hash not on live /health |
| 6 | Antipattern sweep clean | CLEAN | P0 test drives real dialog/store; 3 enrichment cases vs real Postgres; no migration; a11y finding honestly deferred |

**Non-blocking observation (not a claim defect):** live `/health` exposes no commit hash, so claim 5's hash is verified via C-2 records + behavioral proof rather than a direct endpoint read. This is a deploy-observability nit, not a false completion. Consider surfacing a `commit` field on `/health` in a future wave for direct deploy-hash auditability.

**Bottom line:** claims are TRUE in the deployed state. APPROVE.
