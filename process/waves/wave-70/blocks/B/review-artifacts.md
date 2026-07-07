# Wave 70 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M14 user-to-user Block — substrate + DM HIDE predicate + shared contracts + Block UI + member-row fix
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-70/stages/B-0-branch-and-schema.md | in-progress | user_blocks table + migration |
| B-1 | process/waves/wave-70/stages/B-1-contracts.md | pending | shared blocks.ts |
| B-2 | process/waves/wave-70/stages/B-2-backend.md | pending | BlockModule + DM HIDE predicate + integration |
| B-3 | process/waves/wave-70/stages/B-3-frontend.md | pending | block affordance + settings list + member-row fix (after D-3 ✓) |
| B-4 | process/waves/wave-70/stages/B-4-wiring.md | pending | |
| B-5 | process/waves/wave-70/stages/B-5-verify.md | pending | |
| B-6 | process/waves/wave-70/stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** tasks row bc5986a9 (DB); spec at process/waves/wave-70/stages/P-2-spec.md
- **Branch name:** wave-70-user-block
- **claimed_task_ids:** [bc5986a9 (Block backend+DM HIDE, PRIMARY), c8c9742a (shared contracts), 6e4d56b2 (Block UI), cc783559 (member-row fix)]
- **wave_type:** multi-spec (per-spec commits; body cites task_id)
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** NEW user_blocks table (apps/api/src/db/schema/user-blocks.ts + export) + db:generate migration; UNIQUE(blocker_id,blocked_id) + index(blocker_id). No change to messages/dm/users.
- **B-1 fast-path approved:** false
- **D-3 non-blocking notes (→ B-3):** focus-visible:ring on confirm/dropdown Block trigger; aria-hidden on self-row kebab.
- **P-4 non-blocking carries (→ B-2):** group-DM block semantics (spec-gap 5a); outbox-drain race (5b). Settings-host pin /settings/privacy (→ B-3).

## Open escalations carried into gate
none

## Gate verdict log
<appended by fresh head-builder spawn at B-6 Action 1>
