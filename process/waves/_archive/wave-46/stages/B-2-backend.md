# Wave 46 — B-2 Backend
- node-specialist: apps/api/src/dm/ (dm.service.ts, dm-participant.guard.ts, dm.controller.ts, dm.module.ts) + app.module.ts registration + messaging.gateway.ts (dm:message fan-out) + dm.service.spec.ts (16 tests).
- **who_can_dm enforcement (NEW):** DmService.enforceWhoCanDm(creator,target) per target before any write — everyone→ok; nobody→403; server-members→SQL subquery on server_members (creator ∩ target shared server) else 403. ANY reject → whole create fails before txn (no partial).
- **IDOR-safe:** DmParticipantGuard returns 404 for non-participants (stronger non-leak than 403), mirrors ChannelMessageGuard; caller always from session.
- **Idempotency:** UNIQUE(conversation_id, idempotency_key) conflict → same message, no dup, no re-fan-out.
- **Fan-out:** service emits EventEmitter2 'dm.message' → gateway handleDmMessage emits DM_MESSAGE_EVENT to each participant's user:<id> room excluding sender (participant-scoped; reuses WS session validation).
- Cap: >10 → 400; 1:1 exactly-2.
- Tests: 16 new pass; 597 total pass (0 regressions). tsc clean.
- Deviations: createConversation + sendMessage return 200 (idempotency contract); EventEmitter2 decouples service(DB)/gateway(DB-free); selectDistinctOn for last-message. None material.
```yaml
skipped: false
files: [apps/api/src/dm/*, apps/api/src/app.module.ts, apps/api/src/messaging/messaging.gateway.ts, apps/api/src/dm/dm.service.spec.ts]
tests: {new: 16, total_pass: 597, regressions: 0}
typecheck: clean
commits: {a48f1910: "dm spine", 32f5d29e: "gateway fan-out"}
```
