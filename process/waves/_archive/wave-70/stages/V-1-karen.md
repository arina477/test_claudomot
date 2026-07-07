# V-1 Karen — wave-70 (M14 user-to-user Block) load-bearing-claim reality check

**Scope:** Source-claim truth in the DEPLOYED state (files exist, exports, routes registered, migration applied, deploy serves merge commit). NOT spec conformance (jenny's lane).
**Merge commit verified:** `a2c006a` — `feat: user-to-user block (M14) for wave-70 (#86)` (on main).
**Deployed:** api https://api-production-b93e.up.railway.app · web https://web-production-bce1a8.up.railway.app.

## VERDICT: APPROVE

All load-bearing claims are TRUE in the deployed state. Every claimed file exists on the merge tree, every claimed export/registration is present, the 5 DM HIDE seams are all wired, the new routes serve live behind AuthGuard (401 not 404/500), the migration is physically applied to prod (proven by the T-8 live probe filing/reading/deleting real blocks against the prod table), both api+web deploy on the exact merge SHA, the integration spec is real (19 live-DB cases), migration 0026 is real (no CREATE TYPE), and the 2 T-block findings are honestly documented as deferred. No bullshit found.

---

## Findings (each: claim + evidence)

### F1 — Files exist on merge tree — TRUE
**Claim (B-0/B-2/B-3):** 9 named files created. **Evidence:** `git cat-file -e a2c006a:<f>` returns EXISTS for all 9:
- `apps/api/src/db/schema/user-blocks.ts`, `apps/api/drizzle/migrations/0026_quick_thunderbird.sql`, `packages/shared/src/blocks.ts`, `apps/api/src/blocks/{blocks.service.ts,blocks.controller.ts,blocks.module.ts}`, `apps/web/src/shell/{BlockConfirmDialog.tsx,BlockedUsersPanel.tsx}`, `apps/api/test/integration/blocks.integration.spec.ts`. Zero MISSING.

### F2 — Exports / registration — TRUE
**Claim (B-2):** service exports 4 methods; shared exports 3 schemas from index; BlocksModule registered; DmModule imports BlocksModule; dm.service injects + calls isBlockedBetween.
**Evidence (all `git show a2c006a:…`):**
- `blocks.service.ts`: `async createBlock` (:63), `async removeBlock` (:121), `async listBlocks` (:137), `async isBlockedBetween` (:154). All 4 present.
- `packages/shared/src/blocks.ts`: `export const CreateBlockSchema` (:7), `BlockSchema` (:24), `BlockListResponseSchema` (:36). `packages/shared/src/index.ts:264` re-exports all three (+ types :265). Barrel export confirmed.
- `app.module.ts`: `import { BlocksModule }` (:8) + `BlocksModule,` in imports array (:58). Registered.
- `dm.module.ts`: `import { BlocksModule }` (:24) + `imports: [BlocksModule]` (:30). DI direction BlocksModule→DmModule (no circular — BlocksService is DmService-independent).
- `dm.service.ts`: `import { BlocksService }` (:47), constructor inject `private readonly blocksService` (:118), `isBlockedBetween` calls at :261, :599, :700 (3 direct-call seams; other 2 seams are query-shaping — see F6a).

### F3 — Routes registered on DEPLOYED api — TRUE
**Claim (C-2):** POST /blocks unauth → 401 (route + AuthGuard, not 404). GET /blocks unauth → 401.
**Evidence (live curl against deployed api, this session):**
- `POST /blocks` unauth → **401**
- `GET /blocks` unauth → **401**
- Control `POST /blocks-nonexistent-xyz` → **404** (proves 401 above is a real registered route, not a catch-all; a stale revision would 404 the real route too).
- `GET /health` → `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. web `GET /` → 200.
The 401 (not 404) proves the route exists on the serving revision; the 401 (not 500) proves AuthGuard fired before any DB touch — both stale-revision and missing-table traps closed.

### F4 — Migration applied — user_blocks exists in prod — TRUE (indirect, strongly corroborated)
**Claim (C-2):** 0026 applied to prod before api served; table+index+FKs+UNIQUE physically verified.
**Evidence:**
- POST /blocks returned **401 not 500** (F3) — a missing `user_blocks` table would surface as 500 on any authed path; 401 alone is only weak evidence, so:
- **T-8 live prod probe (`process/waves/wave-70/stages/T-8-block-probe.md`)** is the decisive proof: it authenticated 2 real sessions and, against PROD, filed a real block (`4fe73cbc-5f7b-43a6-b86e-e8fcb657308b`, blocker_id server-derived), read it back via GET /blocks, exercised idempotent double-block (same row id, no dup → UNIQUE constraint live), exercised the DM HIDE bidirectionally across all 5 seams, then DELETE-unblocked (204) and re-verified restore. A block CANNOT be filed/read/deleted against a non-existent table. The table, its UNIQUE constraint, and the read index are all provably live in prod. 13/13 T-8 checks PASS.

### F5 — Deploy hash — both api + web on a2c006a — TRUE
**Claim (C-2):** api deployment `203594a5-…` SUCCESS commit a2c006a; web deployment `2354bada-…` SUCCESS commit a2c006a.
**Evidence:** C-2 records both `.node.status == SUCCESS` via the authoritative Railway `deployments(first:1)` endpoint (not /health alone), both `.meta.commit == a2c006abf43437efe957a3395e43f9a47461fed1` (the exact merge SHA). api replaced prior `5fdd2bbd`; rollback target identified + reachable. `ci_stage_verdict: PASS`, `head_signoff.verdict: APPROVED`. Live probes in F3 (route flip + /health) independently corroborate the new revision is the one serving (no stale-revision race). NOTE: C-2 SUCCESS ids are from the Railway API at deploy time; I verified the *behavioral* consequence (new route live, migration applied) directly this session, which is the load-bearing fact.

### F6 — Antipattern sweep — CLEAN

**F6a — 5 DM HIDE seams real, not 3+2-theater — TRUE.** The dm.service grep shows only 3 `isBlockedBetween` calls, but B-2 documents 2 seams as query-shaping (not helper calls) — this is honest, not a hidden gap:
- seam 1 createConversation (:249-261, isBlockedBetween→403), seam 2 sendMessage (:587-599, →403), seam 5 listMessages (:690-700, →403 direct-URL bypass guard) — the 3 direct calls.
- seam 3 getDmCandidates (:823-847): `NOT EXISTS` subquery against `user_blocks` inline (bidirectional OR) — query-shaped, correct.
- seam 4 listConversations (:488-545): batch query over `userBlocks` building `blockedConvIds` set, `.filter((c) => !blockedConvIds.has(c.id))` (:545) — batch, no N+1. Query-shaped, correct.
All 5 seams present and bidirectional; the split (3 predicate-call + 2 query-shape) matches the seam's read/write shape and is documented in B-2. T-8 proved all 5 live bidirectionally (5a-5g).

**F6b — integration spec real, not decorative — TRUE.** `blocks.integration.spec.ts`: **19** `it()` cases. Live-DB: `import './pg-harness'` as first side-effect import (CF-2), `describe.skipIf(SKIP)` gated on `DATABASE_URL_TEST`, real `blocksService`/`dmService` against real Postgres (shared server so A/B are co-members). Cases 1-9 cover block authz (create happy/self-400/notfound-404/idempotent, remove happy/no-op, listBlocks no-IDOR, isBlockedBetween bidi + no-block-false). Cases 10-19 cover ALL 5 DM HIDE seams bidirectionally (10/11 createConversation, 12/13 sendMessage, 14/15 getDmCandidates, 16/17 listConversations, 18/19 listMessages). Exercises real service methods, not mocks-of-SUT. Real.

**F6c — migration 0026 real, no CREATE TYPE — TRUE.** 0026_quick_thunderbird.sql creates `user_blocks` (id uuid PK gen_random_uuid, blocker_id/blocked_id text NOT NULL, created_at timestamptz default now), UNIQUE `user_blocks_blocker_blocked_uniq(blocker_id,blocked_id)`, 2 FKs to `users.id` (`user_blocks_blocker_id_users_id_fk`, `user_blocks_blocked_id_users_id_fk`), index `user_blocks_blocker_idx` on blocker_id. `grep -i "CREATE TYPE"` → NONE. Matches B-0 claim exactly.

**F6d — 2 T-block findings honestly documented, not hidden — TRUE.**
- FINDING-1 (member-row block state): documented as MAJOR in `T-5-e2e.md:11`, `T-5-tester-1.md:36`, `T-9-journey.md:19`, routed → V-2. Correctly scoped NOT-a-hard-FAIL (block persists server-side; /settings/privacy list reflects it; only the member-row affordance doesn't flip). Honest.
- FINDING-2 (UUID enrichment): documented as LOW/known-gap in `B-3-frontend.md:10` (KNOWN GAP), `B-6-review.md:9`, `T-5-e2e.md:12`, `T-5-tester-1.md:41`, `T-9-journey.md:20`, routed → V-2. Pre-flagged at B-3, carried through B-6, not buried. Honest.
Both are genuine deferrals of non-security polish; neither touches the block or HIDE-predicate safety core. No silent deferral detected.

**F6e — frontend components real.** `BlockConfirmDialog.tsx` exports `BlockConfirmDialogProps` (:43) + `BlockConfirmDialog` fn (:102). `BlockedUsersPanel.tsx` exports `BlockedUsersPanel` fn (:242). Both present on merge tree.

---

## Karen bottom line
No inflated completions. The claimed→actual gap is ZERO on every load-bearing dimension. The one honest scope-cut (2 V-2 follow-ons: member-row state reflect + UUID enrichment) is non-security, pre-documented, and correctly triaged. The launch-gate safety core (block authz + bidirectional DM HIDE across 5 seams) is proven live on prod by the T-8 probe against the real `user_blocks` table. **APPROVE.**

## Cross-agent notes
- @jenny owns spec-conformance (do the ACs match the P-2 contract) — not re-checked here; F1-F6 are source-truth only.
- V-2 triage inherits FINDING-1 (MAJOR, member-row block-state reflection) + FINDING-2 (LOW, UUID enrichment) — both real, both already routed.
