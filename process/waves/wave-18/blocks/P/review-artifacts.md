# Wave 18 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** M3 threads — thread-reply data plane + thread-view panel + outbox parity
**Block exit gate:** P-4
**Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-18/stages/P-0-frame.md | done | PROCEED (all 3; mvp-thinner THIN on outbox-parity REJECTED — coherent slice + M4 handoff + floor) |
| P-1 | process/waves/wave-18/stages/P-1-decompose.md | pending | multi-spec; design_gap likely TRUE |
| P-2 | process/waves/wave-18/stages/P-2-spec.md | pending | |
| P-3 | process/waves/wave-18/stages/P-3-plan.md | pending | schema 0008 (reply_count/last_reply_at + index) |
| P-4 | process/waves/wave-18/stages/P-4-gemini-review.md | pending | |

## Block-specific context
- **Wave topic:** thread replies (thread_parent_id, one-level) + reply-count/last-reply affordance + thread-view panel + outbox parity. The FIRST of the last 2 M3 features (per BOARD 7/7 N-1-ordering-wave-17).
- **Spec-contract short-circuit verdict:** no-prior-spec (decomposer prose)
- **Roadmap milestone:** M3 (6198650e) in_progress; wave-18 backfilled. BOARD-endorsed (threads-first).
- **design_gap_flag:** unset — P-1 (thread-view panel + thread affordance = new UI → likely TRUE)
- **claimed_task_ids:** [497c2ae6, 6c008dd6, 0b728319]
- **Schema:** additive migration 0008 (thread_parent_id self-FK already declared; add index (thread_parent_id, created_at) + parent reply_count/last_reply_at columns).
- **Autonomous mode:** automatic
- **BOARD context:** wave-18 is the feature-pivot wave (7/7 B verdict). Advisory carries: re-seed invite-rotation d058283d at first pre-launch wave; fold mention-parity c18b8089 within ≤1 wave; attachments after threads.

## Open escalations carried into gate
none (BOARD already resolved the ordering)

## Gate verdict log
<appended by head-product at P-4>
