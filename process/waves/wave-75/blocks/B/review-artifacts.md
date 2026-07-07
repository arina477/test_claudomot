# Wave 75 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M9 mock-payment freemium upgrade path — BillingProvider seam + mock tier endpoint + real TIER_CAPS + educator-tools enforcement + "Your plan" panel
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-75/stages/B-0-branch-and-schema.md | done | branch wave-75-mock-billing; schema SKIPPED (reuse subscriptions) |
| B-1 | process/waves/wave-75/stages/B-1-contracts.md | done | TierChangeRequest/ServerPlan DTOs (2a8c224) |
| B-2 | process/waves/wave-75/stages/B-2-backend.md | done | 2 commits a63264c+9b9ec24; 795 api tests green |
| B-3 | process/waves/wave-75/stages/B-3-frontend.md | pending | "Your plan" panel + api client |
| B-4 | process/waves/wave-75/stages/B-4-wiring.md | pending | |
| B-5 | process/waves/wave-75/stages/B-5-verify.md | pending | |
| B-6 | process/waves/wave-75/stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** tasks row 4bc40741-146a-4f05-8970-1614eb6b2b43 (DB); spec at process/waves/wave-75/stages/P-2-spec.md
- **Branch name:** wave-75-mock-billing
- **claimed_task_ids:** [4bc40741 (seed), 69765cee, 77665ee5]
- **New deps added this wave:** none (mock; real Stripe fenced)
- **New env vars added this wave:** none
- **Schema changes this wave:** none (reuse subscriptions table, wave-74 migration 0029; tier change = upsert onConflict(server_id))
- **B-1 fast-path approved:** false (B-1 has real contract changes — TierChange/ServerPlan DTOs)
- **Files implemented (cumulative):** (updated B-2/B-3/B-4)
- **Deviations from plan logged this block:** none
- **wave_type:** multi-spec → per-spec commits (one block → one commit citing task_id) per build.md § Commit hygiene
- **BUILD-PRINCIPLES carried:** rule 2 (push branch after every stage); rule 13 (opaque userId not username for owner/isOwn); rule 15 (multi-step mutation in a transaction); rule 4 (B-6 reproduce a negative authz path — payments surface); AuthGuard (verification-required) on all 3 billing endpoints (P-4 security fix).

## Open escalations carried into gate
- CI build ordering: packages/shared must build before apps/api (B-2 hit a stale dist). Verify at B-5 (exact CI commands) + C-1.
- T-4 gap: mock-billing upsert against a REAL Postgres not yet integration-tested (B-2 stubbed db). T-4 must add a pg-harness upsert test (BUILD-9).

## Gate verdict log
<appended by head-builder at B-6>
