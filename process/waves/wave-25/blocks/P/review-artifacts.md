# Wave 25 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** M5 debt — mention token parser parity (client↔server) + editMessage mention-diff transaction wrapping
**Block exit gate:** P-4
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-25/stages/P-0-frame.md | done | PROCEED + accepted minimal SCOPE-EXPANSION (shared slug grammar); reframe reviewers P-0-{problem-framer,ceo-reviewer,mvp-thinner}.md |
| P-1 | process/waves/wave-25/stages/P-1-decompose.md | done | single-spec below floor → precedent override-ship (4th); M5-disposition escalated; design_gap_flag=false |
| P-2 | process/waves/wave-25/stages/P-2-spec.md | done | single-spec 5 ACs to c18b8089.desc |
| P-3 | process/waves/wave-25/stages/P-3-plan.md | done | shared grammar extraction + server/client imports + editMessage txn + rollback spec |
| P-4 | process/waves/wave-25/blocks/P/gate-verdict.md | done | head-product APPROVED + karen+jenny APPROVE (Gemini CONCERN→NOT-MATERIAL: usernames exclude dots); gate-passed |

## Block-specific context
- **Wave topic:** c18b8089 — (1) align client MessageList tokenizer to server parseMentions grammar (interior-punctuation handles @bob.dev render as plain text client-side despite server resolution — user-visible inconsistency); (2) wrap editMessage mention-diff (delete-then-insert) in a transaction (robustness — partial failure can't leave inconsistent message_mentions). wave_db_id b0a1e114-c51b-4410-8a5c-95b36d6a6635.
- **Spec-contract short-circuit verdict:** no-prior-spec (full P-1..P-3).
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3.
- **design_gap_flag:** unset — expect FALSE/token-level (existing MessageList pill component; tokenizer is logic). Set at P-1.
- **claimed_task_ids:** [c18b8089] (solo).
- **Autonomous mode:** automatic.
- **Carry:** the wave-24 real-PG integration tier is available (pg-harness.ts) — the editMessage transaction-rollback part can land a real-DB integration spec (create-server-rollback pattern). CI-PRINCIPLES rule 5 (assert-integration-executed) if so.
- **PRODUCT-PRINCIPLES rule 1:** verify the two parsers actually diverge as the wave-15 prose claims (client MessageList tokenizer vs server parseMentions) before assuming — read both.

## Open escalations carried into gate
none

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
