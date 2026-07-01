# Wave 29 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** Presence/members code-debt — displayName empty-fallback guard + ServerMembersResponseSchema wire-shape alignment
**Block exit gate:** P-4
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-29/stages/P-0-frame.md | done | PROCEED-reframed (part1 || guard, part2 DELETE dead schema); ceo RECONSIDER→M6 non-executable (founder park pending)→sharpened digest; mvp OK |
| P-1 | process/waves/wave-29/stages/P-1-decompose.md | done | single-spec; under-floor override-ship (8th, PRECEDENT-APPLICATION); design_gap=FALSE; B-1 fires (shared-schema delete) |
| P-2 | process/waves/wave-29/stages/P-2-spec.md | done | 5 ACs → d23a0740.description; part1 ||-guard ×2 + part2 DELETE dead schema |
| P-3 | process/waves/wave-29/stages/P-3-plan.md | done | typescript-pro (B-1 delete schema) + node-specialist (B-2 ||-fix); B-3 skip |
| P-4 | process/waves/wave-29/blocks/P/gate-verdict.md | done | head-product APPROVED (attempt 2 post-REWORK); karen+jenny APPROVE; Gemini UNAVAILABLE-429; gate-passed. jenny: reconcile w28 override-ship log at L-1 |

## Block-specific context
- **Wave topic:** wave-14 V-2 code-debt cleanup (KI-2/KI-3): (1) `email.split('@')[0]` displayName fallback can yield empty string that `??` doesn't catch (presence gateway + servers.service) → guard for empty; (2) `ServerMembersResponseSchema` wrapper is declared but the wire shape is a bare array → align the schema to the wire (latent contract trap, no live mismatch today). Non-blocking cleanup.
- **Spec-contract short-circuit verdict:** no-prior-spec (prose-only description; full P-1..P-3).
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3. Re-homed presence/members debt under M5. wave row milestone backfilled = M5.
- **wave_db_id:** 92df2295-9dd4-49df-8d6c-c98d51809ac4 (wave_number 29).
- **design_gap_flag:** FALSE → skip D. B-1 Contracts FIRES (part 2 deletes a shared-package Zod schema).
- **claimed_task_ids:** [d23a0740] (single-spec).
- **Tier-3 product decisions resolved this wave:** none (code-quality/correctness cleanup; no money/security/major-UX tradeoff).
- **Autonomous mode active during P-block:** automatic.
- **Contract-surface note:** part (2) aligns `ServerMembersResponseSchema` to the wire → B-1 Contracts may NOT skip this wave (unlike wave-28). Flag for P-3 routing.

## Open escalations carried into gate
- **M5 park-or-key fork** (founder decision, now 8th-wave recurrence) — founder-pending since digest 2026-07-01 (record-only carry; NOT re-escalated at P-0 — already with the founder). ceo-reviewer may re-note recurrence; head-product carries the standing escalation forward without duplicating the founder ask.

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
