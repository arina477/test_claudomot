# P-2 — Spec (wave-70) [POINTER]
The spec contract IS the primary task's `tasks.description` (row `bc5986a9-a633-426e-9b50-3cd4230a4b8a`) — fenced YAML head + `---` + prose. This file is a convenience pointer.

wave_type: **multi-spec** (4 blocks). design_gap_flag: **true** (Block UI surfaces → D-block).
claimed_task_ids: [bc5986a9 (Block backend + DM HIDE — PRIMARY), c8c9742a (shared contracts), 6e4d56b2 (Block UI), cc783559 (member-row fix)]

## Acceptance-criteria copy (for P-3/P-4 reference)
- **Spec A (bc5986a9):** user_blocks table (blocker_id/blocked_id text FKs, UNIQUE pair, cross-server); POST /blocks (session blocker_id, self-block→400, exists→404, idempotent), DELETE /blocks/:blockedUserId (204 idempotent), GET /blocks (own list, no IDOR); DM HIDE predicate on DmService (createConversation gate, sendMessage reject, getDmCandidates exclude, listConversations/listMessages hide — bidirectional). BlockModule registered.
- **Spec B (c8c9742a):** packages/shared/src/blocks.ts — CreateBlockSchema/BlockSchema/BlockListResponseSchema + index export; typechecks isolated.
- **Spec C (6e4d56b2):** Block/Unblock affordance (member/profile/DM, non-self) + "Blocked users" settings list (GET /blocks + inline unblock; loading/list/empty); api client blockUser/unblockUser/getBlocks; per D-3 design.
- **Spec D (cc783559):** MemberListPanel/MemberItem — suppress Report on own row (thread profile.userId + isSelf guard), render on others.

Key carries: no-IDOR (session blocker_id) on all block endpoints; DM HIDE bidirectional; block is cross-server (no server_id); REUSE DmService + reports.ts schema mirror + no second permission system; out-of-scope (triage UI/appeals/auto-detection/rate-limits/platform-admin unlist) fenced.
