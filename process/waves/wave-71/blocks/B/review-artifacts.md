# Wave 71 — B-block review artifacts
**Block:** B (Build)
**Wave topic:** M14 Block UI-polish — GET /blocks enrichment + member-row Block↔Unblock toggle
**Block exit gate:** B-6
**Status:** in-progress
## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch only (schema SKIP — no DB change) |
| B-1 | stages/B-1-contracts.md | in-progress | extend BlockSchema w/ blocked-user display fields |
| B-2 | stages/B-2-backend.md | pending | listBlocks JOIN (reuse getDmCandidates projection) + rowToDto widen |
| B-3 | stages/B-3-frontend.md | pending | shared getBlocks fetch → BlockedUsersPanel name/avatar + MemberListPanel Block↔Unblock toggle |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | |
## Block-specific context
- **Spec:** tasks row 1193aebf (DB). **Branch:** wave-71-block-ui-polish. **wave_type:** multi-spec.
- **claimed_task_ids:** [1193aebf (member-row toggle PRIMARY), 1c633d2f (GET /blocks enrichment)]
- **Schema changes:** NONE (enrichment = JOIN, no migration; B-0 schema SKIPPED). New deps/env: none.
- **P-4 carries → B-2:** LEFT JOIN + "removed user" fallback for a JOIN-missing user row; widen rowToDto not just the query. → B-3: member-row block-fetch is net-new (reuse presence/mute PATTERN); loading fail-safe (default Block) is a testable AC. Reuse getDmCandidates innerJoin projection (dm.service.ts:829).
## Gate verdict log
<appended by head-builder at B-6>
