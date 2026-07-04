# Wave 46 — B-1 Contracts
- typescript-pro authored packages/shared/src/dm.ts (+ index.ts export). Schemas: DmParticipant/DmConversation (lastMessage nullable, unreadCount optional) / DmMessage (ISO string timestamps) / CreateConversation (participantIds 1..9 + no-dup refine) / SendDmMessage (content 1..4000, idempotencyKey REQUIRED) / DmConversationListResponse / DmMessageListResponse (nextCursor nullable) + DmMessageEventSchema + DM_MESSAGE_EVENT ('dm:message').
- Typecheck: shared + api + web all 0 errors.
- Deviation: added DmMessageEventSchema/DM_MESSAGE_EVENT (locks socket contract for B-2/B-3) — ACCEPTED (defensive, zero risk, spec-32f5d29e names dm:message + reuses DmMessageSchema). No privacy fields in DTOs (enforcement server-side per spec).
```yaml
skipped: false
fast_path_approved: false
files: [packages/shared/src/dm.ts, packages/shared/src/index.ts]
typecheck: clean
```
