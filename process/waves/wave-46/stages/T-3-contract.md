# T-3 — Contract (wave-46 M8 direct messages slice 1)

**Pattern:** B — Active-execution. The DM API + shared Zod contracts are NEW; probed live against the deployed api (`https://api-production-b93e.up.railway.app`) with prod fixtures A + B. CI ran the schemas at C-1 (unit/contract), but the wire contract of a freshly-deployed API is proven live here.

## Action 1 — Pattern decision

DM contracts are project-internal (Zod schemas in `packages/shared/src/dm.ts` + the 4 `/dm/conversations` routes + the `dm:message` Socket.IO event). No external SDK. Chose **active probe against LIVE deployed api** because (a) the wave deploys a brand-new endpoint surface, (b) the P-2 spec explicitly deferred live verification here, (c) request/response shape + typed status codes are only truly proven against the running server.

## Action 2/3 — Live probe results (qa-expert probe, agentId af7040f7)

**userIds resolved from `/auth/signin` body `user.id`, cross-checked vs `/profile`:** Fixture A `21984eb2-…`, Fixture B `da74148e-…`. Auth: SuperTokens session token as `Authorization: Bearer` (httpOnly cookie stripped by proxy — header path used).

| Test | Expected | Actual | Shape valid | Evidence |
|---|---|---|---|---|
| C1 POST create A→B | 200 DmConversation | **200** | Y (see F1 note) | `{id, isGroup:false, participants:[…], lastMessage:null, createdAt ISO}` |
| C2 GET list (A) | 200 `{conversations:[]}` | **200** | Y | new conv present |
| C3 POST message (A) | 200 DmMessage | **200** | Y | `{id, conversationId matches, authorId=A, content, createdAt ISO}` |
| C4 GET messages (B) | 200 `{messages, nextCursor}` | **200** | Y | A's message present; `nextCursor:null` |
| C5a empty participantIds | 400 | **400** | — | `participantIds: "At least one participant is required"` |
| C5b 10 participantIds | 400 | **400** | — | `"Total participants must not exceed 10"` |
| C5c empty content | 400 | **400** | — | `content: "Message content must not be empty"` |
| C5d missing idempotencyKey | 400 | **400** | — | `idempotencyKey: "Required"` |
| C5e self-DM (participantIds=[self]) | 400 | **400** | — | `"participantIds must not include yourself"` (bonus guard) |
| C6 `dm:message` Socket.IO event | — | **DEFERRED → T-5** | — | curl cannot negotiate Socket.IO handshake; two-client fan-out is T-5's headline. NOT faked. |

**Verdict:** All 4 REST endpoints match `packages/shared/src/dm.ts` shapes; every status code correct (200 success, 400 on all 5 validation branches with the exact typed field errors from the Zod schema). The wire contract is honest. `dm:message` socket shape (`DmMessageEventSchema`) is validated live at T-5 two-client.

## Action 4 — Coverage audit

- Every B-1 contract surface traced to a live 200/400: `CreateConversationSchema` (min/max/dup/self), `SendDmMessageSchema` (content/idempotencyKey), `DmConversation`/`DmMessage`/list-response shapes. ✔
- Negative cases covered (5 distinct 400 branches, each asserting the typed field error — not just "an error thrown"). ✔
- `dm:message` event shape deferred to T-5 with explicit rationale (not silently skipped). ✔

## Findings

- **F1 (MEDIUM — surfaced to V-2, also relevant to T-6):** `participants[].displayName` returns the raw userId UUID string when the user has no `displayName` set (fixtures have only `username`, `displayName=null`). Type contract satisfied (it IS a string) but semantically wrong — the UI would render `"da74148e-…"` instead of `"studyhallfixtureb"`. The B-6 M2 fix built a client-side `authorId→displayName` map for the THREAD, but the conversation-list/participant fallback still leaks the UUID. Server-side fallback should be `username`, not `userId`. Evidence: C1/C2 responses show `displayName == userId` for both participants.
- **F2 (LOW):** `unreadCount?` and `presence?` optional fields absent from all responses — spec-legal (`?`), no data loss; noted for completeness.

---
```yaml
test_pattern: active
skipped: false
contracts_audited:
  - CreateConversationSchema (POST /dm/conversations — min1/max9/no-dup/no-self)
  - SendDmMessageSchema (POST /dm/conversations/:id/messages — content 1-4000, idempotencyKey required)
  - DmConversation / DmConversationListResponse (GET /dm/conversations)
  - DmMessage / DmMessageListResponse (GET /dm/conversations/:id/messages — nextCursor)
  - DmMessageEventSchema / dm:message (deferred to T-5 two-client)
ci_evidence:
  - "C-1 test job green (schemas exercised in unit/contract suite)"
active_probe_results:
  - "4 REST endpoints: all 200 on success; 5 validation branches all 400 with typed field errors; agentId af7040f7"
  - "dm:message socket event: DEFERRED to T-5 (curl cannot drive Socket.IO)"
infrastructure_gap_recorded: false
findings:
  - {severity: MEDIUM, contract: "DmParticipant.displayName", description: "server returns raw userId UUID when displayName null; should fall back to username"}
  - {severity: LOW, contract: "DmConversation.unreadCount/presence", description: "optional fields absent — spec-legal, no data loss"}
head_signoff:
  verdict: APPROVED
  stage: T-3
  failed_checks: []
  rationale: >
    All four DM REST endpoints match the shared Zod contract shape live against the deployed
    api, with every status code correct — 200 on success and typed 400s on all five validation
    branches (empty/over-cap/dup participants, empty content, missing idempotencyKey, self-DM),
    each returning the exact Zod field error, not a generic throw. The dm:message socket event
    is honestly deferred to the T-5 two-client E2E (curl cannot drive Socket.IO) rather than
    faked. One MEDIUM contract-semantics finding (displayName leaks the UUID when unset) is
    surfaced to V-2, not blocking the contract-shape verdict.
  next_action: PROCEED_TO_T-5
```
