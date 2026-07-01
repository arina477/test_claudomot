# Wave 27 — B-block review artifacts

**Block:** B (Build) | **Wave topic:** Presence performance pair (server_members(user_id) index + MessageList single-subscription lift) | **Block exit gate:** B-6 | **Status:** gate-passed | **wave_type:** multi-spec | **branch:** wave-27-presence-perf

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-*.md | done | branch + Spec A index migration 0012 (postgres-pro ff4126b) |
| B-1 | (skipped) | skipped | no contract surface (index + client refactor; no shared type) |
| B-2 | stages/B-2-*.md | done | Spec A EXPLAIN proof test presence-index-scan.spec.ts (ff4126b) |
| B-3 | stages/B-3-*.md | done | Spec B MessageList single-subscription lift + CARRY-B memo scoping (bd18a08) |
| B-4 | stages/B-4-*.md | done | typecheck 4/4, lint 0 err, no drift |
| B-5 | stages/B-5-*.md | done | api 395 + web 254, build 3/3; index proof CI-gated |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED; /review P1 EXPLAIN-flake fixed (c2e4b4d); commit-per-spec PASS |

## Block-specific context
- **Spec contract:** tasks row 6a546c7b (primary, 2 spec blocks); spec at stages/P-2-spec.md. wave_type multi-spec.
- **claimed_task_ids:** [6a546c7b (Spec A server index), 07361daf (Spec B client subscription lift)].
- **Branch:** wave-27-presence-perf (from f45ab8c).
- **Schema changes:** YES — Spec A adds index on server_members(user_id) (Drizzle + migration). Spec B no schema.
- **Commit-per-spec (multi-spec):** Spec-A commits cite `Refs: 6a546c7b`; Spec-B commits cite `Refs: 07361daf` (B-6 Action 6 verifies).

## Binding B-block carries (P-4 Phase 2)
- **CARRY-A:** Spec A schema/migration/proof → `postgres-pro` (NOT database-administrator; karen rule-11).
- **CARRY-B (jenny LOW):** Spec B MUST preserve the wave-26 CARRY-1 per-author render-scoping — a dot re-renders only when ITS author's status changes, NOT whole-list on any presence event. If whole-list re-render is chosen (0-user scale), justify explicitly. task-completion-validator confirms at V.
- **CARRY (BUILD rule 7):** local verify uses `biome check`, not `biome format` alone.

## Open escalations carried into gate
- M5 park-or-key fork (founder decision) — recorded to founder digest 2026-07-01; not a wave blocker.

## Gate verdict log: <appended by head-builder at B-6>

## Block-exit handoff
```yaml
build_block_status:    complete
branch:                wave-27-presence-perf
stages_run:            [B-0, B-2, B-3, B-4, B-5, B-6]
stages_skipped:        [D-block (design_gap_flag=false), B-1 (no contract surface)]
review_verdict:        APPROVE
deviations_logged:
  - "Spec B: memo'd scalar prop instead of custom-comparator (more robust; CARRY-B preserved)"
  - "B-6: P1 EXPLAIN flake on tiny table → enable_seqscan=off forcing (c2e4b4d)"
fix_up_commits:        [c2e4b4d]
last_commit_sha:       c2e4b4d
ready_for_ci:          true
```

