# Wave 16 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** Browser E2E for the authed create-server flow (test-infra)
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim + CI secrets set; no schema |
| B-1 | stages/B-1-contracts.md | SKIP | no contract surface (test-infra) |
| B-2 | stages/B-2-backend.md | SKIP | no backend |
| B-3 | stages/B-3-frontend.md | pending | E2E + authed harness (ui-comprehensive-tester per karen swap) |
| B-4 | stages/B-4-wiring.md | pending | playwright config + ci.yml env |
| B-5 | stages/B-5-verify.md | pending | run authed E2E green; smoke untouched |
| B-6 | stages/B-6-review.md | pending | head-builder gate |

## Block-specific context
- **Spec contract:** tasks row 46f16288 (DB); single-spec
- **Branch name:** wave-16-create-server-e2e
- **claimed_task_ids:** [46f16288]
- **New deps:** none. **New env vars:** E2E_FIXTURE_EMAIL/PASSWORD (GitHub Actions secrets, set at B-0; never committed). **Schema:** none.
- **P-4/karen carry:** spawn `ui-comprehensive-tester` (test-automator NOT in AGENTS.md), note swap. Follow-up backlog: E2E teardown once DELETE /servers/:id ships.
- **Files implemented:** (B-3/B-4)

## Open escalations carried into gate
none

## Gate verdict log
<appended by head-builder at B-6>
