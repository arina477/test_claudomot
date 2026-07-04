# T-2 — Unit (wave-46 M8 direct messages slice 1)

**Pattern:** A — Verified-via-CI. C-1 ran the unit + integration suite on the merge commit; T-2 audits coverage adequacy, does NOT re-execute.

## Action 1 — CI evidence

C-1 (`process/waves/wave-46/stages/C-1-pr-ci-merge.md`, run 28703736920, merge 2a738f7):
- **test job: pass (1m25s)** — "Initialize containers" = Postgres service; ran integration + unit suites. **api 605 tests, web 373 tests** all green.
- B-6 post-/review independently re-confirmed: api 605 passed (35 files), web 373 passed (24 files) — count rose from attempt-3 baseline (598/371) exactly by the C1 mixed-drain + M1 fan-out + M3 find-or-create tests.

## Action 2 — Coverage audit (critical read — "what real bug makes this fail?")

### Backend — `apps/api/src/dm/dm.service.spec.ts` (16 `it()` cases across 6 describes)

| Concern | Cases | Assertion honesty |
|---|---|---|
| **who_can_dm 3-policy** | everyone→ok; nobody→403; server-members+shared-server→ok; server-members+NO-shared→403; mixed(one nobody)→403 whole-create | Asserts typed `ForbiddenException` (not message) AND `mockTransaction` NOT called → proves NO partial write on reject. Transition-table quality. |
| **participant cap** | >10→400; exactly-10→ok; 1:1 with 2→ok; 1:1 with 3→400 | Typed `BadRequestException`; asserts `participants.length`. The 1:1-succeeds accept-side (the B-6 attempt-1 gap) is now present (L331). |
| **IDOR gate** | sendMessage non-participant→404; listMessages non-participant→404; participant send→ok; participant list→ok | Typed `NotFoundException` + `mockInsert` NOT called → proves no write leaks past the gate. |
| **idempotency** | dup (convId, idemKey)→same row | `mockInsert` called once, returns same `MSG_ID`, AND `emitter.emit` NOT called on replay → proves no re-fan-out on idempotent replay. Load-bearing. |
| **fan-out (service emit)** | participant send emits `dm.message` with `{conversationId, senderId}` | Real payload-shape assertion at the service→gateway boundary. |
| **find-or-create (1:1)** | repeat→same id (no tx); fresh→new (tx once); group→always insert (find-or-create skipped, select-count asserted); distinct targets→2 separate tx | Asserts `mockTransaction` call count → proves dedup vs insert branch decision. |

### Backend gateway — `apps/api/src/messaging/messaging.gateway.spec.ts` (M8 dm.message describe)
- `handleDmMessage` emits the **wire event `dm:message`** (not the internal `dm.message` EventEmitter name — the gateway is where internal→socket translation happens) to ALL participant rooms **including the sender** (M1 fix), payload `{conversationId, message}` matching `DmMessageEventSchema`. Correct two-hop coverage: service asserts internal emit; gateway asserts wire fan-out.

### Frontend — `apps/web/src/shell/dm.test.tsx`
- **DmConversationList:** renders rows by participant name (text query), loading skeleton, empty state, error+retry, row-click callback, search filter — role/text queries, not testId.
- **StartDmPicker:** member-list options, recipient-chip add + confirm-enable, confirm→onConfirm(participantIds), **403-style error surfaced inline WITHOUT closing** (the who_can_dm reject affordance).
- **useDm single-send:** optimistic row present + `state='pending'` after enqueue, and **NO direct `api.sendDmMessage`** call (the double-send regression guard — drain is the sole send path).

### Frontend outbox — `apps/web/src/features/sync/outbox.test.ts`
- Exactly-once + in-order drain, replay-idempotency (ON CONFLICT → same id, no dup), stop-on-failure ordering, MAX_ATTEMPTS→failed+onFailed, retry-resets-to-pending, sequential POST ordering, concurrent-drain exactly-once, DM-target routing (`kind:dm`→conversationId), channel-not-regressed, **mixed channel+DM both orderings — "neither kind rejects the other"** (C1 CRITICAL head-of-line-block fix), legacy-row→channel fallback.

**Verdict:** Every DM service method has ≥1 happy + ≥1 error path. Tier-1-adjacent modules (authz/participant-gate, idempotency, offline-sync outbox) are well beyond 80% branch by inspection. No mock-call-count-only tests standing in for behavior — every assertion is on a return value, a typed exception, a no-write proof, or a no-re-emit proof.

## Action 3 — Flake observation

- C-1 `flake_rerun_succeeded: null` — no flake fired; the documented `server-roles.test.tsx` cross-file async flake (B-5) did NOT surface on the merge run. No new DM-specific flakes observed. Carry the server-roles flake forward as a known-quantity coverage-quality signal for L-2 (not DM-introduced, not blocking).

## Action 4 — Discipline note

- The Drizzle fluent-API thenable-chain mock (`makeSelectChain` / `makeInsertChain`) is a clean, reusable pattern mirroring `assignments.service.spec.ts`. Candidate for extraction to a shared test-helper if a third DM-adjacent service adopts it (L-2 note).
- **Boundary discipline held:** service test asserts the internal `dm.message` emit; gateway test asserts the wire `dm:message` fan-out. This two-hop split is correct — do NOT collapse them into one over-mocked test.

## Findings

- **F3 (LOW, non-blocking):** `dm.service.spec.ts` fan-out assertion stops at the service EventEmitter (`dm.message`); the wire contract (`dm:message`) is proven separately in the gateway spec and will be re-proven live at T-3/T-5 two-client. Not a gap — a correct boundary. Logged for traceability only.

---
```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job: run 28703736920 green — api 605, web 373 (Postgres container, integration+unit)"
  - "B-6 post-/review independent re-run: api 605 (35 files), web 373 (24 files)"
modules_audited:
  - apps/api/src/dm/dm.service.spec.ts
  - apps/api/src/messaging/messaging.gateway.spec.ts (dm.message fan-out)
  - apps/web/src/shell/dm.test.tsx
  - apps/web/src/features/sync/outbox.test.ts
new_flakes: []
findings:
  - {severity: LOW, module: "dm.service.spec.ts", description: "service fan-out asserts internal dm.message emit; wire dm:message proven in gateway spec + T-3/T-5. Correct boundary, not a gap."}
head_signoff:
  verdict: APPROVED
  stage: T-2
  failed_checks: []
  rationale: >
    DM unit coverage is honest and transition-table-shaped. who_can_dm across all three
    policies + mixed-reject asserts the typed ForbiddenException AND no-partial-write;
    IDOR gate asserts NotFoundException + no-insert; idempotency asserts same-row +
    no-re-fan-out on replay; find-or-create asserts the tx-vs-dedup branch by call count;
    the outbox mixed-drain proves the C1 head-of-line-block fix in both orderings; the
    gateway spec proves dm:message fan-out reaches the sender's rooms (M1). Every service
    method has happy + error paths. No coverage theater — no test passes on a mock-call
    count standing in for a user-observable outcome. api 605 / web 373 green on merge SHA.
  next_action: PROCEED_TO_T-3
```
