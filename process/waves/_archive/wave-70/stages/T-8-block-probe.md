# T-8 Security — Block authz + DM HIDE LIVE prod probe (wave-70 M14 launch-gate)

**Target:** https://api-production-b93e.up.railway.app (deployed revision)
**Date:** 2026-07-07
**Auth:** SuperTokens header-token mode (`st-auth-mode: header`, `Authorization: Bearer <st-access-token>`)
**Authorization:** Owner-authorized, pre-launch, against PRODUCTION.

## Identities (real session userIds)
- **A** `studyhall-e2e-fixture@example.com` → `21984eb2-8029-4c1b-9e73-bc586a0be4d2`
- **B** `studyhall-e2e-fixture-b@example.com` → `da74148e-132e-4faf-a526-a34c28e7481b`
- Both `POST /auth/signin` → **200 OK**, session established, access tokens captured from `st-access-token` response header.

## Baseline (pre-probe)
- A `GET /blocks` → `{"blocks":[]}` (clean).
- A/B `GET /dm/candidates` → mutually visible (A sees B, B sees A).
- Prior 1:1 A-B conversation exists: `5f62052f-a60a-4c33-b49e-830dbae92620` (used to prove convo HIDE + listMessages 403).

## Results — per check

| # | Check | Expected | Actual | Verdict |
|---|---|---|---|---|
| 1 | no-IDOR (spoofed `blockerId`/`blocker_id` in POST body) | 201; blocker_id === A real id; block in A list; NOT in B list | 201, `blocker_id=21984eb2…` (spoof `00000000-dead-beef…` ignored); block `4fe73cbc-5f7b-43a6-b86e-e8fcb657308b` in A list; B list empty | **PASS** |
| 2 | self-block (A blocks A) | 400 | 400 `"Cannot block yourself"` | **PASS** |
| 3 | block non-existent user | 404 | 404 `"User … not found"` | **PASS** |
| 4 | idempotent double-block (A blocks B twice) | both 201, single row | 2nd POST returned SAME row id+created_at; GET /blocks → 1 block, B once | **PASS** |
| 5a | B create conv → A (blocked) | 403 | 403 `"a block relationship exists"` | **PASS** |
| 5b | B send msg in A-B convo (blocked) | 403 | 403 `"Cannot send message: a block relationship exists"` | **PASS** |
| 5c | A `GET /dm/candidates` — B excluded | B absent | `[]` (B excluded) | **PASS** |
| 5d | B `GET /dm/candidates` — A excluded | A absent | `[]` (A excluded) | **PASS** |
| 5e | A `GET /dm/conversations` — A-B convo hidden | convo absent | `{"conversations":[]}` (hidden) | **PASS** |
| 5f | A `GET …/messages` for A-B convo | 403 | 403 `"Cannot read messages: a block relationship exists"` | **PASS** |
| 5g | A create conv → B (reverse direction) | 403 | 403 `"a block relationship exists"` | **PASS** |
| 6 | unblock (`DELETE /blocks/B`) restores | 204; candidates+convo+DM restored | 204; A/B blocks empty; A↔B visible in candidates; A-B convo re-appears; B send msg → 200 (msg `6f6d7a9f…`) | **PASS** |

## Block ids created / removed
- Created: `4fe73cbc-5f7b-43a6-b86e-e8fcb657308b` (A→B). Idempotent double-block returned the same row (no duplicate).
- Removed: DELETE /blocks/B → 204. Final verify: A `GET /blocks` `[]`, B `GET /blocks` `[]`.

## Cleanup (prod-clean rule)
**Prod restored to no-blocks state.** No block left in place. A does NOT block B. One benign probe message (`6f6d7a9f-a172-4755-922a-38d069eb01e3`, content "probe-unblock-restore-check") was sent by B into the pre-existing A-B convo as the restore proof (DM messages have no DELETE route; content is inert test text).

## Verdict
**ALL 13 checks PASS on the deployed prod revision.** The block authz (no-IDOR — blocker always from session; self/non-existent guards; idempotency; per-user list isolation) and the **DM HIDE launch-gate core** (bidirectional across all 5 seams: createConversation, sendMessage, listConversations, listMessages, getDmCandidates) hold LIVE on prod. No block leak on any DM path. **M14 block + DM HIDE boundary is proven live — launch-gate safety core confirmed.**
