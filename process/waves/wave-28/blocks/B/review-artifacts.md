# Wave 28 — B-block review artifacts

**Block:** B (Build) | **Wave topic:** Invite-code rotate — owner-ONLY `POST /servers/:id/invite-code/rotate` regenerating CSPRNG `servers.invite_code` | **Block exit gate:** B-6 | **Status:** gate-passed | **wave_type:** single-spec | **branch:** wave-28-invite-rotate

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch wave-28-invite-rotate; d058283d claimed in_progress; schema SKIP |
| B-1 | stages/B-1-contracts.md | skipped | no contract surface (inline DTO; no shared type/Zod/API-contract) |
| B-2 | stages/B-2-backend.md | done | rotateInviteCode svc:372 (owner-ONLY :379, no creator path) + route ctrl:95 + 7 unit + 6 integration; 402 unit pass; commit 49654fe |
| B-3 | stages/B-3-frontend.md | skipped | backend-only wave (design_gap_flag=false; client UI keep-OUT) |
| B-4 | stages/B-4-wiring.md | done | typecheck 4/4 + build 3/3; lint: 3 format errors in wave-28 specs (B-2 rule-7 miss) → deterministic biome --write f78552c → 0 err |
| B-5 | stages/B-5-verify.md | done | lint 0-err + 402 unit pass + build 3/3; endpoint proven by real-PG integration test (ACs 1-5) |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED; /review no P0/P1; 2 docs + 2 test fixes (42636bc) + 1 accepted-debt; APPROVE |

## Block-specific context
- **Spec contract:** tasks row d058283d (primary, single-spec); spec at stages/P-2-spec.md + d058283d.description YAML head. wave_type single-spec.
- **Branch name:** wave-28-invite-rotate (from main 2182380).
- **claimed_task_ids:** [d058283d].
- **New deps added this wave:** none.
- **New env vars added this wave:** none.
- **Schema changes this wave:** none (writes existing servers.invite_code UNIQUE column in place; no migration).
- **B-1 fast-path approved:** n/a (B-3 also skipped — backend-only; no B-2∥B-3 race).
- **Files implemented (cumulative):** servers.service.ts, servers.controller.ts, servers.service.spec.ts, servers.controller.spec.ts, test/integration/invite-code-rotate.spec.ts.
- **Deviations from plan logged this block:** B-2 committed 2 unformatted spec files (BUILD rule 7 miss); remediated at B-4 via deterministic biome --write (f78552c). Flagged for B-6.

## Binding B-block carries (P-4 Phase 2)
- **SECURITY (P-4 security-scope gate + T-8):** owner-ONLY authz (not any member, not owner-OR-creator — drop revoke's creator path); CSPRNG unpredictability (reuse generateCode); prove old-link invalidation (GET/join on old code → 404); no rate-limit is a documented decision (product-decisions wave-28), not an omission.
- **RBAC drift (jenny, resolved-in-record):** owner-ONLY consciously bypasses the reserved-but-unwired `manage_server` flag; flip-trigger recorded in product-decisions.md (first non-owner manage_server role → `can(manage_server)`). Implementation stays owner-ONLY this wave — do NOT add an RBAC gate.
- **CARRY (BUILD rule 7):** local verify uses `biome check`, not `biome format` alone.

## Open escalations carried into gate
- M5 park-or-key fork (founder decision) — founder-pending since digest 2026-07-01; record-only carry, not a wave blocker.

## Gate verdict log: <appended by head-builder at B-6>

## Block-exit handoff
```yaml
build_block_status:    complete
branch:                wave-28-invite-rotate
stages_run:            [B-0, B-2, B-4, B-5, B-6]
stages_skipped:        [D-block (design_gap_flag=false), B-1 (no contract surface), B-3 (backend-only)]
review_verdict:        APPROVE
deviations_logged:
  - "B-2 formatter miss (BUILD rule 7) → deterministic biome --write f78552c"
  - "B-6 /review: 2 P1 INVESTIGATE documented + 2 P2 test-honesty fixed (42636bc); 1 P2 existence-oracle accepted-debt"
fix_up_commits:        [f78552c, 42636bc]
last_commit_sha:       42636bc
ready_for_ci:          true
```
