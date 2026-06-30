# Wave 15 — P-3 Plan

## Approach

### Architecture deltas
**MessagingModule += mention sub-system (apps/api/src/messaging/).**
- **Mention parser** (`mentions.ts` util): extract `@username` tokens from body (word-boundaried — only after start/whitespace; no email-like `a@b`). Pure function, unit-testable.
- **Resolution + persistence**: in `messages.service.ts` createMessage + editMessage, after the message row is written, parse body → resolve tokens against `server_members` ⋈ `users` for the channel's server (resolve username→userId; non-members dropped) → upsert `message_mentions` rows. On EDIT: diff — delete rows whose user no longer mentioned, insert new (idempotent via UNIQUE). One transaction with the message write where practical.
  - *Alternative considered:* parse-on-read. Rejected (P-0): can't serve an indexed authz-scoped my-mentions, re-resolves membership每 render, no unread driver.
- **Realtime**: reuse the wave-12 /messaging gateway. The existing `message.created` fan-out already emits to `channel:<id>`; ADD `mentions[]` to the message DTO so the room payload carries them (clients detect self-mention). No new event/namespace needed for the in-channel case; a mentioned user viewing the channel gets it via the existing room. (Cross-channel "you were mentioned elsewhere" notification = the unread affordance driven by GET /me/mentions on channel-switch + the in-room event; no global push this wave.)
- **GET /me/mentions**: new controller route on the messaging/me surface; service queries `message_mentions WHERE mentioned_user_id = session.userId` ⋈ messages, server-membership-scoped, cursor-paginated, most-recent-first. Authz: userId from session ONLY.

**Frontend (apps/web/src/shell/).**
- `MentionAutocomplete.tsx` — @-triggered dropdown over server members (reuse `api.getServerMembers` from wave-14); keyboard nav (up/down/enter/esc), click-select, inserts canonical `@username`. Wired into `MessageComposer`.
- Mention-pill render in `MessageList.tsx` — tokenize message body, render resolved `@username` (from `MessageResponse.mentions[]`) as pills; viewer-targeted pill gets emphasis treatment (WCAG AA per DESIGN-PRINCIPLES rule 1).
- Unread-mention affordance — client store driven by the realtime message payload (self in mentions[]) + GET /me/mentions; badge/highlight in channel sidebar or message-list; clears on channel view. (Built against D-block-adopted design.)

### Data model
**NEW migration 0007_wave15_message_mentions.sql** (up + down):
- `message_mentions` (id pk, message_id FK→messages ON DELETE CASCADE, mentioned_user_id FK→users, created_at default now, UNIQUE(message_id, mentioned_user_id)).
- Index `(mentioned_user_id, created_at DESC)` for my-mentions lookup.
- Drizzle schema in `apps/api/src/db/schema/messages.ts`.

### API contracts
- `MessageResponse.mentions: Array<{userId, username}>` (added; round-trips on fetch + realtime).
- `GET /me/mentions?cursor=` → 200 `{items: MessageResponse[], nextCursor?}` (authed; 401 unauthed). Membership-scoped, most-recent-first.
- Realtime: `message.created`/`message.updated` payload carries `mentions[]` (reuse existing /messaging room emit).

### New deps
**None.** Drizzle + Socket.IO + React all existing. No SDK pre-build.

## Plan

### File-level steps (by B-stage)
**B-0/B-1 Schema** (postgres-pro / database-administrator)
| Path | Op | What | Order |
|---|---|---|---|
| apps/api/drizzle/migrations/0007_wave15_message_mentions.sql | create | message_mentions table + index (up/down) | first |
| apps/api/src/db/schema/messages.ts | modify | message_mentions Drizzle schema + relations | with migration |

**B-1 Contracts** (typescript-pro)
| packages/shared/src/messaging.ts | modify | MessageResponse += mentions[]; MyMentionsResponse | after schema |

**B-2 Backend** (backend-developer + node-specialist)
| apps/api/src/messaging/mentions.ts | create | @username parser (word-boundaried) | after contracts |
| apps/api/src/messaging/messages.service.ts | modify | resolve+persist on create/edit (diff), my-mentions query, mentions[] in rowToDto | after parser |
| apps/api/src/messaging/messages.controller.ts | modify | GET /me/mentions (authz session-derived, paginated) | after service |
| apps/api/src/messaging/messaging.gateway.ts | modify | include mentions[] in room payload (reuse existing emit) | after service |

**B-3 Frontend** (react-specialist + frontend-developer; against D-block designs)
| apps/web/src/shell/MentionAutocomplete.tsx | create | @-dropdown member-picker, keyboard nav | after contracts + D |
| apps/web/src/shell/MessageComposer.tsx | modify | wire @-trigger + autocomplete + insert token | after autocomplete |
| apps/web/src/shell/MessageList.tsx | modify | mention-pill render (viewer-targeted emphasis) | after contracts + D |
| apps/web/src/shell/useMentions.ts (or store) | create | unread-mention store (realtime + my-mentions) | after contracts |
| apps/web/src/shell/ChannelSidebar.tsx (or MainColumn) | modify | unread-mention badge/affordance | after store + D |
| apps/web/src/auth/api.ts | modify | api.getMyMentions(cursor) | after contracts |

**B-4/B-5** repo typecheck + route registration + lint + tests + boot-probe.

### Specialist routing (validated vs AGENTS.md)
postgres-pro/database-administrator, typescript-pro, backend-developer, node-specialist, react-specialist, frontend-developer — all present.

### Parallelization
- B-0→B-1 serial (schema→contracts).
- B-2 backend chain: parser → service (persist+my-mentions) → controller + gateway (parallel after service).
- B-3 after B-2 + D-block: autocomplete ∥ pill-render ∥ unread-store (independent files) → composer/sidebar wiring serial last.

### Self-consistency sweep
1. Every AC → ≥1 step (parse/resolve/persist→service+migration; realtime→gateway; my-mentions→controller; autocomplete→MentionAutocomplete; pills→MessageList; unread→store+sidebar). ✓
2. Every step has a specialist. ✓
3. No file in two parallel batches. ✓
4. design_gap_flag=true → B-3 surfaces depend on D-block-adopted autocomplete/pill/unread designs. ✓
5. Architecture alternative named (persist vs parse-on-read). ✓
6. Contracts concrete (no TBD). ✓ 7. No new deps. ✓ 8. SDK n/a. ✓
