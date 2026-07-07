# P-3 Plan — wave-71 (M14 Block UI-polish, multi-spec)
## Approach
### Architecture deltas
**1. GET /blocks enrichment (apps/api) — spec B.** listBlocks (blocks.service.ts) gains a JOIN to the user/profile display source (the same projection member rows / DM candidates use for displayName+avatar). Alternative: enrich server-side (JOIN) vs client-side per-id profile lookup — SERVER JOIN WINS (no N+1 client calls; one query; the shared DTO carries display fields). Failure-domain: read-only additive; no-IDOR scoping (blocker_id=session) unchanged.
**2. Shared contract (packages/shared) — spec B.** Extend BlockSchema (add a blockedUser object OR blockedDisplayName+blockedAvatarUrl) + BlockListResponseSchema. Backward-additive.
**3. web Block state-reflection (apps/web) — spec A.** MemberListPanel builds a blocked-id Set from GET /blocks (ONE fetch, shared with BlockedUsersPanel) → passes isBlocked to MemberItem → the affordance renders Block↔Unblock (Unblock wired to unblockUser). Reuse the existing presence/mute live-state pattern. BlockedUsersPanel renders the enriched name+avatar. Alternative: fetch blocks in MemberListPanel vs a shared blocks context/hook — a small shared hook (useBlocks) or a lifted fetch WINS (one GET /blocks feeds both surfaces per the problem-framer one-fetch note).
### Data model: none (no user_blocks change). ### API: GET /blocks response enriched (additive). ### Deps: none. ### SDK: N/A.
## Plan (file-level, by B-stage)
**B-1 Contracts:** packages/shared/src/blocks.ts (+index) — extend BlockSchema/BlockListResponseSchema with blocked-user display fields | typescript-pro | 1st.
**B-2 Backend:** apps/api/src/blocks/blocks.service.ts listBlocks — add JOIN to the member-display source, return enriched DTO | backend-developer | after B-1. + integration/unit test update (GET /blocks returns display fields; no-IDOR unchanged).
**B-3 Frontend:** apps/web/src/auth/api.ts (getBlocks return type) + a shared blocks fetch (useBlocks hook OR lifted) feeding BOTH BlockedUsersPanel (render name+avatar) AND MemberListPanel (blocked-id Set → isBlocked → Block↔Unblock toggle wired to unblockUser; own-row isSelf unchanged) | react-specialist | after B-2. + tests (list renders name; member-row toggles Block↔Unblock; own-row suppressed; unblock-failure row-stays).
(No B-0 schema — no DB change. No D-block — design_gap_flag=false, block-ui.html covers both surfaces.)
## Specialist routing (AGENTS.md, all present): typescript-pro (shared), backend-developer (listBlocks JOIN + tests), react-specialist (both web surfaces + tests).
## Parallelization: B-1→B-2→B-3 serial (B-2 enriches the DTO B-3 renders; B-3 both surfaces share one fetch → one react-specialist owns them, serial). 
## Self-consistency: spec-B → B-1 (DTO) + B-2 (JOIN); spec-A → B-3 (toggle + enriched render). Every AC → ≥1 step. One-fetch (problem-framer) → shared fetch in B-3. design_gap_flag=false → B directly. No deps/TBD. Clean.
