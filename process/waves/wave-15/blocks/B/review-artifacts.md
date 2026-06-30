# Wave 15 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M3 @mentions — parse/resolve/persist + my-mentions + autocomplete/pills/unread
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | in-progress | branch + 0007 message_mentions migration |
| B-1 | stages/B-1-contracts.md | pending | MessageResponse += mentions[]; MyMentionsResponse |
| B-2 | stages/B-2-backend.md | pending | parser, resolve/persist (edit diff), my-mentions endpoint, realtime |
| B-3 | stages/B-3-frontend.md | pending | MentionAutocomplete, mention-pill, unread store/badge |
| B-4 | stages/B-4-wiring.md | pending | |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** tasks row 3d238446 (DB); spec process/waves/wave-15/stages/P-2-spec.md
- **Branch name:** wave-15-m3-mentions
- **claimed_task_ids:** [3d238446, cd585f04, c3f3f62a]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** message_mentions table (migration 0007, drizzle-generate per P-4 karen carry)
- **P-4 carries (apply in B):** (1) generate 0007 via drizzle toolchain (prior numbering non-contiguous), (2) filter users.username IS NOT NULL in resolution + autocomplete, (3) aria-activedescendant on autocomplete listbox (D-3 B note).
- **Files implemented (cumulative):** (B-2/B-3/B-4)
- **Deviations from plan logged this block:** none

## Open escalations carried into gate
- SECURITY (P-4): GET /me/mentions authz session-derived (no cross-user); resolution membership-scoped; @everyone/@role OUT. → T-8.

## Gate verdict log
<appended by head-builder at B-6>
