# Wave 46 — P-3 Plan

## Approach section

### Architecture deltas
- **New DM entity + module (a48f1910).** Add `dm_conversations`/`dm_participants`/`dm_messages` (serverless, participant-set, roleless) + a NestJS `dm` module. **Chosen over reusing channels/messages** (P-0 problem-framer: channel messages FK `channels` NOT NULL + dedup on channel_id + server-role authz — none fit DMs; forcing DMs through channels needs nullable-FK hacks / synthetic channels that break the NOT NULL FK + authz). Reuse is PATTERN-level (send/dedup/fan-out/authz-shape), new tables only where the entity differs. Failure domain: new tables, new module; no change to existing channel messaging.
- **who_can_dm enforcement (NEW, a48f1910).** Verified stored-but-unenforced (privacy.service only get/update; grep on send path = schema only). Add an enforcement method — approach: `DmService.assertCanBeDmed(creatorId, targetId)` reading target `who_can_dm`: everyone→ok; server-members→require a shared-server membership query (creator ∩ target server memberships non-empty); nobody→reject. **Alternative considered:** put it in privacy.service — REJECTED (DM-create is the only consumer for now; keep the shared-server query near the DM authz; can hoist later if a 2nd consumer appears). Failure domain: a new authz check on the create path; blast radius = create only.
- **Socket.IO fan-out (32f5d29e).** Extend the existing messaging gateway to emit `dm:message` to participant sockets (reuse WS session validation; no new transport). **Alternative:** a separate DM gateway — REJECTED (duplicates the socket-auth + connection registry; the existing gateway already tracks authed sockets). Participant-scoped emit (never broadcast).
- **Outbox generalization (d8264800).** `outbox.ts` is channelId-hardcoded (OutboxItem.channelId + SendFn + server UNIQUE(channel_id,idempotency_key)). Introduce a target discriminator `{kind:'channel',channelId}|{kind:'dm',conversationId}`; SendFn dispatches by kind. **Alternative:** a parallel DM outbox — REJECTED (two outboxes = two flush/retry/ordering engines to keep correct; generalize the one). Regression risk on channel send → guarded by a regression test (AC).

### Data model
3 NEW tables (see P-2 spec-1 AC for full DDL): dm_conversations, dm_participants (UNIQUE(conversation_id,user_id), INDEX(user_id)), dm_messages (UNIQUE(conversation_id,idempotency_key), INDEX(conversation_id,created_at)). ONE Drizzle migration. No changes/backfill to existing tables. FKs to users(id) (text) + ON DELETE cascade from conversation.

### API contracts (concrete — see P-2 spec-1)
POST /dm/conversations (who_can_dm-enforced, cap ≤10) · GET /dm/conversations (last-message preview) · POST /dm/conversations/:id/messages (participant-gated, idempotent) · GET /dm/conversations/:id/messages?cursor= (participant-gated, cursor). All session-auth, server-derived caller, IDOR-safe (403/404 for non-participants).

### Dependency list
None new. Drizzle, NestJS, Socket.IO (@nestjs/websockets), Dexie all present. No SDK.

### SDK pre-build checklist
N/A.

## Plan section

### File-level steps (by B-stage)
**B-1 Schema:**
| Path | Op | Change | Specialist |
|---|---|---|---|
| apps/api/src/db/schema/dm.ts | create | 3 DM tables per DDL, mirror messages.ts conventions | node-specialist |
| apps/api/src/db/schema/index.ts | modify | export dm schema | node-specialist |
| (generated) drizzle migration | create | migration for the 3 tables; commit | node-specialist |

**B-1 Contracts:**
| packages/shared/src/dm.ts | create | Zod: DmConversation/Participant/Message, CreateConversation {participantIds 1..9, isGroup?}, SendDmMessage {content 1..4000, idempotencyKey}, list responses (cursor) | typescript-pro |
| packages/shared/src/index.ts | modify | export dm types | typescript-pro |

**B-2 Backend:**
| apps/api/src/dm/dm.module.ts + dm.service.ts + dm.controller.ts | create | 4 endpoints; participant-gated authz (mirror channel-message.guard); who_can_dm enforcement (assertCanBeDmed w/ shared-server query); idempotency; small-group cap | node-specialist |
| apps/api/src/messaging/messaging.gateway.ts | modify | emit `dm:message` to participant sockets (32f5d29e) | node-specialist |
| apps/api/src/app.module.ts | modify | register DmModule | node-specialist |

**B-3 Frontend:**
| apps/web/src/features/sync/outbox.ts | modify | routing-key discriminator (channel|dm); SendFn dispatch by kind; no channel regression (d8264800) | react-specialist |
| apps/web/src/shell/ (DM components) DmConversationList / DmThread / DmComposer / StartDmPicker + a useDmSocket hook + shell nav entry | create/modify | DM UI reusing MessageList/Composer; picker respects who_can_dm; real-time `dm:message`; optimistic+reconcile; empty states; dark-theme tokens (D-3) | react-specialist |
| apps/web/src/shell/messagingSocket.ts (or a dm socket client) | modify/create | subscribe to `dm:message` | react-specialist |

**B-4 Wiring / B-5 verify:** repo typecheck; migration applied locally; unit + integration (DM service, who_can_dm enforcement, idempotency, IDOR); dev smoke.

### Specialist routing (validated against AGENTS.md)
- `node-specialist` ✓ (NestJS backend, Drizzle schema/migration, gateway) — B-1 schema, B-2 backend.
- `typescript-pro` ✓ (shared Zod types) — B-1 contracts.
- `react-specialist` ✓ (React 19 UI + client outbox) — B-3 frontend.
Optional at B-block: `supertokens-integration` consult if session-on-WS needs care (gateway already validates; likely not needed). `postgres-pro` not needed (schema is straightforward; node-specialist handles Drizzle).

### Parallelization map
- B-1 schema (node) → then B-1 contracts (typescript-pro) [schema informs types]. 
- B-2 backend (node) after contracts. Gateway fan-out is part of B-2.
- B-3 frontend (react) after B-2 (consumes endpoints + events). Within B-3, outbox generalization ∥ DM components (react-specialist, sequence if the components import the outbox API).
- D-block runs BEFORE B-3 (design_gap_flag=true → DM UI surfaces canonicalized at D-3 before B-3 implements them).

### Self-consistency sweep
1. Every P-2 AC → ≥1 step: spec-1 → B-1 schema + B-2 backend; spec-2 → B-2 gateway; spec-3 → B-3 UI (post D-block); spec-4 → B-3 outbox. ✓
2. Every step has a specialist. ✓
3. No file in multiple parallel batches. ✓
4. design_gap_flag=true referenced → D-block before B-3. ✓
5. Architecture deltas have explicit alternative trade-offs. ✓
6. Data + API contracts concrete (P-2). ✓
7. New deps: none. ✓
8. SDK: N/A. ✓

```yaml
p_stage_verdict: COMPLETE
design_gap_flag: true
specialists: [node-specialist, typescript-pro, react-specialist]
files_touched_est: ~20
new_deps: 0
schema_change: true
migration_count: 1
next: P-4
