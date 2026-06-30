# Wave 18 — B-block review artifacts
**Block:** B (Build) | **Wave topic:** M3 threads (data plane + panel + outbox parity) | **Gate:** B-6 | **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim + migration 0008 (thread_parent_id+reply_count+last_reply_at+index) |
| B-1 | stages/B-1-contracts.md | done | shared thread types |
| B-2 | stages/B-2-backend.md | done | createReply/deleteReply/listThreadReplies + transactional count + thread realtime |
| B-3 | stages/B-3-frontend.md | done | ThreadPanel + affordance + outbox parity (vs canonical design) |
| B-4 | stages/B-4-wiring.md | done | routes + ThreadPanel mount + typecheck |
| B-5 | stages/B-5-verify.md | done | |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED; /review caught+fixed C-1 IDOR + H-1; clean |
## Context
- Branch: wave-18-m3-threads | claimed: [497c2ae6, 6c008dd6, 0b728319]
- **P-4 carries:** (1) migration 0008 THREE-PART (thread_parent_id self-FK ABSENT — add it + reply_count + last_reply_at + index); (2) use createServer's db.transaction pattern (NOT createMessage — it's non-transactional) for createReply/deleteReply atomicity; (3) conditional last_reply_at recompute (tail-only; reply_count always decrements); (4) idempotency reuse (ON CONFLICT channel_id,idempotency_key).
- **D-block carries (JS a11y):** focus-trap, Esc-close, reply_count==0-hide, list-semantics (<ol>), aria-live on replies. Visual contract: design/server-channel-view.html (thread panel + affordance).
## Gate verdict log
- **B-6 Phase 1 (head-builder, attempt 1): APPROVED.** All load-bearing claims verified against source: transactional reply insert+count++ in one db.transaction with idempotent-retry no-double-count (isNewInsert gate); one-level enforcement (reply-of-reply/cross-channel/deleted-parent 4xx); tail-only last_reply_at recompute with always-decrement count; distinct thread:reply:created realtime event; outbox parity (useThread.sendReply reuses useMessages machinery, retry same idempotencyKey); closed-panel affordance live-update via useMessages thread subscription; all 5 a11y carries; CJS trap avoided; additive migration 0008; no gold-plating. ONE Medium non-blocking finding routed to Phase 2: dead socket-echo idempotency_key reconcile branch in useThread.ts:114-121 (server DTO never echoes idempotencyKey; reconciliation achieved at server-ack layer instead — functionally correct, misleading comment). Full verdict: blocks/B/gate-verdict.md. Proceed to Phase 2 /review.

## Block exit handoff
```yaml
build_block_status: complete
branch: wave-18-m3-threads
stages_run: [B-0,B-1,B-2,B-3,B-4,B-5,B-6]
review_verdict: APPROVE
idor_closed: true
ready_for_ci: true
```
