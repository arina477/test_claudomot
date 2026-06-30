# Wave 20 — B-block review artifacts
**Block:** B (Build) | **Wave topic:** M4 offline-first spine (idempotency-bind + forward-cursor + Dexie store + outbox + fake-indexeddb tests) | **Gate:** B-6 | **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable | Status |
|---|---|---|
| B-0 | stages/B-0-branch-and-schema.md | done | branch + claim; NO server schema (Dexie client schema in B-4) |
| B-1 | stages/B-1-contracts.md | done | forward-list/after-cursor + OutboxItem/cached types |
| B-2 | stages/B-2-backend.md | done | listMessagesAfter forward cursor + idempotency-lock test |
| B-3 | stages/B-3-frontend.md | done | Dexie store (cache+outbox) + outbox integration + composer offline + fake-indexeddb tests |
| B-4 | stages/B-4-wiring.md | done | deps dexie+fake-indexeddb + vitest fake-indexeddb setup |
| B-5 | stages/B-5-verify.md | done | |
| B-6 | stages/B-6-review.md | done | head-builder APPROVED; /review caught+fixed H1-H4 (strict in-order wedge proven); clean |
## Context
- Branch: wave-20-m4-offline-spine | claimed: [92d85e0e, 7332a4b8, 9a4ab31d, e29f6566]
- **P-4 carries (MANDATORY):** (1) REFRAME — do NOT rebuild server idempotency (createMessage ON CONFLICT exists); seed = lock-test + forward ?after= cursor; (2) forward cursor REUSES listThreadReplies ASC/gt keyset (NOT a new scheme); (3) rule-4 — new ?after= route channel-authz → B-6 Phase-2 non-member 403 test (pick authz path: ChannelMessageGuard decorator [as listMessages] OR in-service canViewChannelById [as listThreadReplies] — target the 403 test at it); (4) exactly-once + in-order GATING AC proven via fake-indexeddb (sequential oldest-first drain + ON CONFLICT replay dedup + partial-drain resume + no-data-loss); (5) stable idempotency key ONCE-AT-ENQUEUE (existing useMessages does randomUUID per-attempt — change to once); (6) Dexie gotchas (no-await-in-txn, no schema downgrade, sequential drain, per-test IDBFactory); (7) OUT: connection-state/pending-UI/catch-up-history-UI (2nd M4 wave), CRDT/service-worker/multi-device.
- **SDK:** dexie@4 + fake-indexeddb@6 (client, no founder ask). SDK-doc: command-center/dev/SDK-Docs/Dexie/dexie.md. The Dexie outbox BACKS the existing useMessages optimistic outbox (no separate path).
## Gate verdict log
<appended by head-builder at B-6>

## Block exit handoff
```yaml
build_block_status: complete
branch: wave-20-m4-offline-spine
stages_run: [B-0,B-1,B-2,B-3,B-4,B-5,B-6]
review_verdict: APPROVE
exactly_once_in_order: proven
ready_for_ci: true
```
