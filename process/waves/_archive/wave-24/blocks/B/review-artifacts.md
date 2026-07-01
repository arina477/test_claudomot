# Wave 24 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M5 debt — extend the real-PG integration test tier (presence co-member + member-gate + rbac/assignments-authz specs)
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-24/stages/B-0-branch-and-schema.md | in-progress | branch; schema SKIP (test-only) |
| B-1 | process/waves/wave-24/stages/B-1-contracts.md | pending | SKIP (no contracts) |
| B-2 | process/waves/wave-24/stages/B-2-backend.md | pending | test-automator: harness extension + 3 integration specs |
| B-3 | process/waves/wave-24/stages/B-3-frontend.md | pending | SKIP (no UI) |
| B-4 | process/waves/wave-24/stages/B-4-wiring.md | pending | typecheck + integration tier runs + biome (rule 4/6) |
| B-5 | process/waves/wave-24/stages/B-5-verify.md | pending | integration tier executes (false-green guard) |
| B-6 | process/waves/wave-24/stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** `tasks` row 02fa8011 (DB). **Branch:** wave-24-integration-tier.
- **claimed_task_ids:** [02fa8011] (solo).
- **New deps/env:** none. **Schema:** none (test-only).
- **B-1 fast-path:** N/A (B-1 skips; B-3 skips — B-2 is the only impl stage).

## Binding B-2 carries (from P-4 Phase-2 — fold in, NOT rework)
1. Member-gate method = `listServerMembers` (servers.service.ts:223, gate :232, roster innerJoin :244), NOT :128 (findMyServers).
2. Truncate-list completeness: `roles` already truncated (pg-harness.ts:75); NO `assignment*` table (manage_assignments is a column on roles) → drop the phantom assignment* truncate; ensure truncateTables covers all fixtured tables (server_members/servers/users/roles).
3. AC2 non-member → 403 is definite (spec governs); resolve the P-3 "ForbiddenException/empty" hedge against actual listServerMembers behavior.

## BOARD condition (binding on T-4)
Verify per-CI-job the integration tier ACTUALLY executed (nonzero + real-DB row assertions), not just green (wave-17 false-green guard). Each spec fails loud on missing DATABASE_URL_TEST.

## Open escalations carried into gate
none

## Gate verdict log
<appended by fresh head-builder spawn at B-6 Action 1>

## Gate verdict log
- B-6 attempt 1 (head-builder a23843bf1897dfa3d): APPROVED — genuine real-DB round-trips, non-member 403 authz negative path, false-green guard real.
- B-6 Phase 2 /review (code-reviewer a5c52fe1ea575a05f): APPROVED — 0 crit/high/med; CI false-green wiring verified (turbo.json passthrough).

## Status (block exit)
```yaml
build_block_status:    complete
branch:                wave-24-integration-tier
stages_run:            [B-0, B-2, B-4, B-5, B-6]
stages_skipped:        [B-1 (no contracts), B-3 (no UI)]
review_verdict:        APPROVE
deviations_logged:     []
ready_for_ci:          true
```
