# Wave 74 — B-block review artifacts

**Block:** B (Build)
**Wave topic:** M9 entitlements substrate — subscriptions tier model + EntitlementsService + createServer gate wiring (free-default; Stripe/pricing fenced)
**Block exit gate:** B-6
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| B-0 | process/waves/wave-74/stages/B-0-branch-and-schema.md | done | subscriptions (migration 0029, server_id FK=uuid) |
| B-1 | process/waves/wave-74/stages/B-1-contracts.md | done | Tier/Entitlements DTO (task e34642ef) |
| B-2 | process/waves/wave-74/stages/B-2-backend.md | done | service + gate + verify-reads THROWS test |
| B-3 | process/waves/wave-74/stages/B-3-frontend.md | skipped | optional display deferred (low-value until upgrade path) |
| B-4 | process/waves/wave-74/stages/B-4-wiring.md | pending | |
| B-5 | process/waves/wave-74/stages/B-5-verify.md | pending | |
| B-6 | process/waves/wave-74/stages/B-6-review.md | pending | |

## Block-specific context
- **Spec contract:** tasks row 53d18d7f (DB)
- **Branch name:** wave-74-entitlements-substrate
- **claimed_task_ids:** [53d18d7f, e34642ef, 2f61a317]
- **New deps:** none (Stripe fenced)
- **Schema changes:** subscriptions table (reports.ts idiom, no pgEnum, **server_id FK = uuid**) + migration 0029

## Carry-forward from P-4 gate (builder must honor)
1. **B-0 FK type (karen + head-product BINDING):** `servers.id` is UUID → the subscriptions `server_id` FK MUST be `uuid('server_id').references(() => servers.id)`, NOT the literal "text" in the spec AC.
2. **B-2 verify-gate-reads (problem-framer BINDING):** the test MUST assert a stubbed RESTRICTIVE cap (maxServers=0) makes createServer THROW (real exception) AND free default succeeds. Free-succeeds-only = coverage theater.
3. **B-2 gate-subject (jenny):** pick ONE concrete cap dimension (e.g. servers-per-owner) + document tier-resolution at create-time.
4. **Fence:** NO Stripe/price/quota columns, NO checkout — founder-reserved asks stay in the checkpoint.

## Open escalations carried into gate
none

## Gate verdict log
<appended by head-builder at B-6>
