# Wave 14 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M3 presence layer — /presence namespace + typing + member-list panel
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-14/stages/B-0-branch-and-schema.md | done | branch wave-14-m3-presence; no schema, no new deps |
| B-1 | process/waves/wave-14/stages/B-1-contracts.md | pending | packages/shared/src/presence.ts (Zod) |
| B-2 | process/waves/wave-14/stages/B-2-backend.md | pending | /presence gateway + service + typing |
| B-3 | process/waves/wave-14/stages/B-3-frontend.md | pending | presenceSocket + member-list panel + typing line |
| B-4 | process/waves/wave-14/stages/B-4-wiring.md | pending | module registration + e2e typecheck |
| B-5 | process/waves/wave-14/stages/B-5-verify.md | pending | typecheck+lint+unit+smoke |
| B-6 | process/waves/wave-14/stages/B-6-review.md | pending | head-builder + /review |

## Block-specific context
- **Spec contract:** tasks row d1c4693d (DB); spec process/waves/wave-14/stages/P-2-spec.md
- **Branch name:** wave-14-m3-presence
- **claimed_task_ids:** [d1c4693d, 58633934, 058984c5]
- **New deps added this wave:** none (Socket.IO from wave-12)
- **New env vars added this wave:** none
- **Schema changes this wave:** none (presence in-memory; membership from existing server_members)
- **B-1 fast-path approved:** false (B-1 runs — new presence.ts contracts)
- **Files implemented (cumulative):** (B-2/B-3/B-4)
- **Deviations from plan logged this block:** none

## Open escalations carried into gate
- SECURITY (P-4 carry): /presence WS-upgrade auth (SuperTokens cookie) + membership-scoped fan-out, NO presence/typing leak; two-authenticated-client verify at T-8.

## Gate verdict log
<appended by head-builder at B-6>
