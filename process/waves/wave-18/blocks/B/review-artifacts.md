# Wave 18 — B-block review artifacts
**Block:** B (Build) | **Wave topic:** M3 threads (data plane + panel + outbox parity) | **Gate:** B-6 | **Status:** in-progress
## Stage deliverables
| Stage | Deliverable | Status | Notes |
|---|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim + migration 0008 (thread_parent_id+reply_count+last_reply_at+index) |
| B-1 | stages/B-1-contracts.md | done | shared thread types |
| B-2 | stages/B-2-backend.md | done | createReply/deleteReply/listThreadReplies + transactional count + thread realtime |
| B-3 | stages/B-3-frontend.md | pending | ThreadPanel + affordance + outbox parity (vs canonical design) |
| B-4 | stages/B-4-wiring.md | pending | routes + ThreadPanel mount + typecheck |
| B-5 | stages/B-5-verify.md | pending | |
| B-6 | stages/B-6-review.md | pending | head-builder gate |
## Context
- Branch: wave-18-m3-threads | claimed: [497c2ae6, 6c008dd6, 0b728319]
- **P-4 carries:** (1) migration 0008 THREE-PART (thread_parent_id self-FK ABSENT — add it + reply_count + last_reply_at + index); (2) use createServer's db.transaction pattern (NOT createMessage — it's non-transactional) for createReply/deleteReply atomicity; (3) conditional last_reply_at recompute (tail-only; reply_count always decrements); (4) idempotency reuse (ON CONFLICT channel_id,idempotency_key).
- **D-block carries (JS a11y):** focus-trap, Esc-close, reply_count==0-hide, list-semantics (<ol>), aria-live on replies. Visual contract: design/server-channel-view.html (thread panel + affordance).
## Gate verdict log
<appended by head-builder at B-6>
