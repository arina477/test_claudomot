# P-3 Plan — wave-70 (M14 Block feature, multi-spec)

## Approach
### Architecture deltas
**1. BlockModule (apps/api) — NEW (spec A).** New `user_blocks` table + BlockModule (POST/DELETE/GET /blocks). Block is a first-class cross-server relation (NO server_id — a block hides DMs everywhere). Alternative: reuse an existing privacy/mute mechanism vs a NEW user_blocks table — NEW table WINS (no user-to-user block primitive exists; the wave-41 ModerationService is server-scoped member-timeout, semantically distinct from a cross-server user block). Failure-domain: new write endpoints (any authed user blocks); the SECURITY-critical surface is the HIDE predicate on the DM read/write paths (a block that doesn't actually hide is a safety-gate failure).
**2. DM HIDE predicate (apps/api) — spec A, layered on DmService.** The block filter is applied at the 5 DmService seams (createConversation:201 gate, sendMessage:494 reject, getDmCandidates:685 exclude, listConversations:382 hide, listMessages:576 hide). Alternative: a global middleware/interceptor vs inline per-seam checks — INLINE per-seam WINS (the DM visibility idiom already lives in DmService; a block-aware helper `isBlockedBetween(a,b)` reused at each seam matches the existing pattern; a global interceptor can't see the per-query counterpart id). Reuse the DM-visibility idiom; do NOT build a second permission system. Bidirectional for DM reachability (if A blocks B, neither can DM the other).
**3. web Block surfaces (apps/web) — spec C.** Block/Unblock affordance (member/profile/DM) + "Blocked users" settings list. Per D-3 canonicalized design (design_gap_flag=true → D-block authors the mockups). Alternative: inline block button vs a shared BlockButton component — shared BlockButton WINS (one control, multiple hosts). The member-row fix (spec D) reuses MemberListPanel (same prop-threading the block affordance needs — profile.userId + isSelf).

### Data model (spec A)
- NEW `user_blocks` table: id(uuid pk defaultRandom), blocker_id(text FK users.id), blocked_id(text FK users.id), created_at(timestamptz defaultNow). UNIQUE(blocker_id, blocked_id). Index on blocker_id (the GET /blocks + HIDE-predicate read). NOT server-scoped. NEW schema file + export from db/schema/index.ts; Drizzle-generated migration (db:generate). Mirror db/schema/reports.ts conventions (text FKs, no pgEnum). No change to messages/dm/users schema.

### API contracts (spec A)
- POST /blocks (AuthGuard) body {blockedUserId} → Block DTO. blocker_id from session; blockedUserId must exist + != caller (self→400, missing→404); idempotent (UNIQUE-backed, double-block→200 no dup).
- DELETE /blocks/:blockedUserId (AuthGuard) → 204. blocker_id from session; not-blocked→204 no-op idempotent.
- GET /blocks (AuthGuard) → {blocks: Block[]} caller's own list only (WHERE blocker_id=session; no IDOR).
- DM HIDE predicate (no new endpoint — modifies existing DM behavior): createConversation/sendMessage → 403 on either-direction block; getDmCandidates excludes; listConversations/listMessages hide blocked-counterpart convos/content.
### New deps: none. ### SDK: N/A.

## Plan (file-level, by B-stage)
**B-0 Schema:**
| apps/api/src/db/schema/user-blocks.ts | create | user_blocks table + UNIQUE + index | postgres-pro | 1st |
| apps/api/src/db/schema/index.ts | modify | export user_blocks | postgres-pro | with |
| apps/api/drizzle/migrations/<gen>.sql | create (generated) | db:generate | postgres-pro | after schema |
**B-1 Contracts:**
| packages/shared/src/blocks.ts (+index) | create | CreateBlockSchema + BlockSchema + BlockListResponseSchema | typescript-pro | after B-0 |
**B-2 Backend:**
| apps/api/src/blocks/blocks.service.ts + blocks.controller.ts + blocks.module.ts | create | POST/DELETE/GET /blocks (session blocker_id, self-block 400, exists 404, idempotent); a shared isBlockedBetween(a,b) helper. Register BlockModule (imports Auth + the users/DM-owning module) | backend-developer | after B-1 |
| apps/api/src/dm/dm.service.ts | modify | apply isBlockedBetween at createConversation(:201 gate 403)/sendMessage(:494 reject 403)/getDmCandidates(:685 exclude)/listConversations(:382 hide)/listMessages(:576 hide) — bidirectional | backend-developer | after blocks.service |
| apps/api blocks specs + pg-harness integration | create | block/unblock/list; self-block 400; exists 404; idempotent double-block; no-IDOR GET (own list only); DM HIDE all 5 seams bidirectional (LIVE-DB) | backend-developer | after B-2 |
**B-3 Frontend (after D-3):**
| apps/web/src/auth/api.ts | modify | blockUser, unblockUser, getBlocks | react-specialist | after B-1 |
| apps/web Block affordance (member/profile/DM) + BlockButton + blocked-users settings list + wiring | create | per D-3 design; block state, confirm, unblock, empty/loading | react-specialist | after B-2 + D-3 |
| apps/web/src/shell/MainColumn.tsx + MemberListPanel.tsx + MemberItem (spec D) | modify | thread profile.userId (selfUserId) into MemberListPanel + isSelf guard → suppress Report on own row (also gates the block affordance non-self) | react-specialist | with block UI |
| apps/web block/settings tests | create | block→POST; unblock→DELETE; blocked-list→GET; own-row Report suppressed; moderator-gate N/A | react-specialist | after B-3 |

## Specialist routing (AGENTS.md — all present, validated wave-69): postgres-pro (schema), typescript-pro (shared), backend-developer (blocks service/controller + DM HIDE + integration), react-specialist (block UI + settings + member-row fix). 
## Parallelization: B-0→B-1 serial. B-2 blocks.service before dm.service edit (dm consumes isBlockedBetween). B-2 (backend) ∥ D-block (block UI design) can overlap. B-3 after B-2 + D-3. Within B-3, the member-row fix (spec D) + block affordance share MemberListPanel → SERIAL (one react-specialist owns MemberListPanel to avoid conflict).
## design_gap_flag: **true** — Block UI surfaces (block affordance, blocked-users settings list) lack mockups → D-block fires before B-3.

## Self-consistency sweep
- spec-A → B-0 (user_blocks) + B-2 (endpoints + DM HIDE); spec-B → B-1 (shared blocks.ts); spec-C → B-3 (affordance + settings, after D-3); spec-D → B-3 (member-row fix). Every AC maps to ≥1 step. ✓
- Every step has a specialist (all in AGENTS.md). ✓
- MemberListPanel touched by spec-C + spec-D → SERIAL under one react-specialist (no parallel conflict). ✓
- design_gap_flag=true referenced → D-block. ✓
- Data + API contracts concrete (user_blocks DDL, 3 endpoints + 5 DM seams). No TBD. ✓
- No new deps. No SDK. ✓
- Architecture deltas carry explicit alternative trade-offs (NEW table vs reuse; inline per-seam vs global interceptor; shared BlockButton vs inline). ✓
Clean.
