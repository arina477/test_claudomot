# Wave 24 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** M5 debt-clearing — extend the real-Postgres integration test tier to presence/services (+ rbac/assignments authz)
**Block exit gate:** P-4
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-24/stages/P-0-frame.md | done | PROCEED + accepted SELECTIVE-EXPANSION (rbac/assignments authz coverage); reframe reviewers P-0-{problem-framer,ceo-reviewer,mvp-thinner}.md |
| P-1 | process/waves/wave-24/stages/P-1-decompose.md | done | single-spec below floor → BOARD 6/7 override-ship; design_gap_flag=false |
| P-2 | process/waves/wave-24/stages/P-2-spec.md | pending | |
| P-3 | process/waves/wave-24/stages/P-3-plan.md | pending | approach + plan |
| P-4 | process/waves/wave-24/blocks/P/gate-verdict.md | pending | Phase-2 reviewer output |

## Block-specific context
- **Wave topic:** extend the real-PG integration test tier (seed 02fa8011). wave_db_id 60734a7e-2446-470b-8620-5f96b2a23c7f.
- **Spec-contract short-circuit verdict:** no-prior-spec (seed carries prose only — full P-1..P-3).
- **Roadmap milestone:** M5 (a5232e16) — in_progress. Class=product-feature, Tier=T3.
- **design_gap_flag:** false (P-1) — test-infra, no UI → skip D, go to B.
- **claimed_task_ids:** [02fa8011] (solo; scope broadened at P-0 to 3 integration-spec surfaces — no new sibling task).
- **Tier-3 product decisions resolved this wave:** none anticipated (test-infra debt).
- **Autonomous mode active during P-block:** automatic.
- **KEY REFRAME ANGLE:** a reusable real-PG harness ALREADY EXISTS from wave-17 (apps/api/test/integration/pg-harness.ts + create-server-rollback.spec.ts + vitest.integration.config.ts). The seed prose ("docker/ephemeral Postgres test tier / testcontainers") predates that harness (wave-14 finding). PRODUCT-PRINCIPLES rule 1: this is EXTEND (add specs consuming the existing harness) NOT greenfield (build a new tier). Reframe reviewers must catch this.

## Open escalations carried into gate
- RESOLVED: BOARD P-1-floor-merge-wave-24 6/7 override-ship. Binding carries to B/T: (1) T-4 verify integration tier ACTUALLY executed [nonzero + real-DB row counts, wave-17 false-green guard]; (2) Resend escalation sharpened; (3) floor-rubric revision → L-2 candidate.

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
