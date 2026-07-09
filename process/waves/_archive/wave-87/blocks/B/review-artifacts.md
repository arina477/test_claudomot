# Wave 87 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** converge new server-member joins onto server's existing is_default 'Member' role (shared resolver); behavior-preserving data-hygiene
**Block exit gate:** B-6
**Status:** gate-passed

## Stage deliverables

| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch wave-87-join-default-role; schema/deps/env all skip |
| B-1 | stages/B-1-contracts.md | done | SKIP (no contract surface) |
| B-2 | stages/B-2-backend.md | done | servers.service.ts resolver+role_id (node-specialist); +38/-2; typecheck clean |
| B-3 | stages/B-3-frontend.md | done | SKIP (backend-only) |
| B-4 | stages/B-4-wiring.md | done | repo typecheck 4/4 clean; no routes/env |
| B-5 | stages/B-5-verify.md | done | 828/828 unit; load-bearing tripwire verified; build+lint clean |
| B-6 | stages/B-6-review.md | done | Phase1 head-builder APPROVED; Phase2 /review PASS (1 informational, accepted) |

## Block-specific context

- **Spec contract:** tasks row dc4abee3-1e41-41aa-a76b-c65a6b38e457 (DB); spec at stages/P-2-spec.md (pointer)
- **Branch name:** wave-87-join-default-role
- **claimed_task_ids:** [dc4abee3-1e41-41aa-a76b-c65a6b38e457]
- **New deps added this wave:** none
- **New env vars added this wave:** none
- **Schema changes this wave:** none (role_id already exists nullable FK; no migration)
- **B-1 fast-path approved:** <set at B-1>
- **Files implemented (cumulative):** <B-2, B-5>
- **Deviations from plan logged this block:** <list, or "none">

## Carry-forward from P-4 gate
- role_id column is `uuid` (not `text` as spec prose says) — resolver returns string, no impact.
- No unique idx on (server_id, is_default) → resolver LIMIT 1 + stable ORDER BY + zero-default NULL fallback (no throw). Keep backfill-roles.ts running until new-NULL drains.
- T-9 Journey should retire journey-map finding F67-T5-2 once shipped.

## Open escalations carried into gate
none

## Gate verdict log
<appended by fresh head-builder spawn at B-6>

## Block-exit handoff
```yaml
build_block_status:    complete
branch:                wave-87-join-default-role
stages_run:            [B-0, B-1, B-2, B-3, B-4, B-5, B-6]
stages_skipped:        [B-1 (no contract surface), B-3 (backend-only)]
review_verdict:        APPROVE
deviations_logged:     []
ready_for_ci:          true
```

## T-block carry-forward
- T-9 Journey: retire journey-map finding F67-T5-2 (NULL-role-on-join now resolved) AND note the educator-analytics "No role" bucket empties as new joins carry the default role (non-breaking, correct — see B-6-review-output.md).
- T-3 integration / T-4 E2E: exercise the real join endpoints (public + invite) asserting the new member's role_id = server default role (deferred from B-5 dev-smoke).
