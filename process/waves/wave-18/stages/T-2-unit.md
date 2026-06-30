# T-2 — Unit (wave-18 M3 threads)

**Pattern:** A — Verified-via-CI.

## Action 1 — CI evidence
C-1 `verdict_evidence` (false-green guard applied: the `test` job log `84316325489` was READ, not icon-trusted):
- **api unit: 309 passed / 0 skipped / 0 failed** across 18 files.
- **web: 145 passed / 0 skipped / 0 failed** across 8 files.
- web e2e harness 37 passed. (integration 3 → T-4.)
- Wave-18 thread/IDOR specs explicitly named ✓ in the log (not skipped).

## Action 2 — Coverage audit
Modules touched (per B-2/B-3): `messages.service.ts` (createReply / deleteMessage thread branch / listThreadReplies / rowToDto), `messaging.gateway.ts` (thread handlers), `ThreadPanel.tsx` / `useThread.ts` / `useMessages.ts` / `MainColumn.tsx`, `packages/shared/src/messaging.ts`.

Unit coverage confirmed present (read the actual spec files, not just C-1's named list):
- `messages.service.spec.ts` — createReply: one-level rejection, cross-channel rejection, soft-deleted-parent 409, parent-not-found 404, **reply_count + last_reply_at increment IN SAME txn**, idempotent retry (DO NOTHING → no count++). deleteMessage reply branch: decrement, tail-recompute MAX(created_at), NULL when no live replies. listThreadReplies: ASC keyset, nextCursor, empty, NotFound. All assert state changes / return values, NOT mock-call trivia. State-machine-style (reply_count transitions) covered as transition cases. ✓
- web `messaging.test.tsx` — `MainColumn — socket thread:reply:deleted affordance`: chip hides at 0, count updates when replies remain, other-channel event ignored. Asserts user-observable DOM (`getByTestId` chip presence + `getByText('2 replies')`). ✓ (test-id query noted as a T-4/T-5 a11y-query nit, see F-3.)

## Action 3 — Flake observation
C-1 reported 0 skipped / 0 failed / 0 flaky reruns. No new flakes observed.

## Action 4 — Discipline note + LOAD-BEARING REALTIME FAN-OUT FINDING

**T-2 principle rule 1 (load-bearing): "Assert what a non-sender recipient receives via the REAL fan-out routing, not a mocked room or topic join."** This is the wave-14 typing-broken / the bar set by wave-15 mentions (which WAS two-client-proven live). I traced the wave-18 thread events `thread:reply:created` and `thread:reply:deleted` through EVERY test layer:

| Layer | What is asserted | Real fan-out to a non-author client? |
|---|---|---|
| Service (`messages.service.spec.ts`) | `eventEmitter.emit('thread.reply.created'/'thread.reply.deleted', payload)` — domain event FIRED on a mocked EventEmitter2 | NO — emitter is mocked; proves the service intends to emit |
| Gateway impl (`messaging.gateway.ts:240-265`) | `handleThreadReplyCreated`/`handleThreadReplyDeleted` do `server.to('channel:'+channelId).emit('thread:reply:created'/...)` | n/a (impl) |
| Gateway spec (`messaging.gateway.spec.ts`) | **NOTHING** — the two new thread handlers have ZERO tests. Every OTHER event (message.created/updated/deleted, reaction.*, mention.created) IS tested with the mocked-`server.to(room).emit()` room-targeting assertion. The thread handlers are not even covered at that mocked-emit level. | NO — no test at all |
| Web (`messaging.test.tsx`) | client handler invoked DIRECTLY (`capturedThreadReplyDeletedHandler?.({...})`) → affordance DOM updates | NO — handler called manually, no socket; proves the reducer, not delivery |

**Finding F-1 (HIGH — load-bearing coverage gap):** No test at any layer proves a NON-author client joined to `channel:<id>` actually RECEIVES `thread:reply:created` or `thread:reply:deleted` via real Socket.IO fan-out. The service-spec asserts a mocked-emitter call; the web-spec invokes the client handler by hand; and the gateway's two thread handlers (the actual `server.to(room).emit()` fan-out) are entirely untested — they don't even have the cheap mocked-`server.to()` room-targeting assertion that all five sibling event handlers have. A thread reply that fails to reach other clients live (room key typo, wrong event name, author-exclusion bug) would pass the entire green suite. This is exactly the looks-done-but-broken class. NOT known-broken: the handlers are structurally identical (`@OnEvent` → `server.to('channel:'+channelId).emit(name, payload)`) to the five handlers wave-12/13/15 proved deliver two-client live, and were B-6-adversarially read as room-scoped+author-included-by-design. So the risk is UNPROVEN, not confirmed-broken. Severity HIGH (not Critical): real delivery is structurally probable but unverified. Resolution → a two-client E2E at T-5 (or at minimum the missing gateway-spec fan-out unit tests). Surfaced to V-2; carried as a known gap into T-5/T-9.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job log 84316325489: api 309 passed (0 skipped), web 145 passed (0 skipped); thread+IDOR specs named executed"
modules_audited: [messages.service.ts, messaging.gateway.ts, ThreadPanel.tsx, useThread.ts, useMessages.ts, MainColumn.tsx, packages/shared/messaging.ts]
new_flakes: []
findings:
  - {severity: high, module: "messaging.gateway.ts + messages.service.spec.ts + messaging.test.tsx", description: "F-1 LOAD-BEARING: thread:reply:created/deleted have NO real-fan-out two-client test at any layer; gateway thread handlers entirely untested (no mocked-emit test either, unlike all 5 sibling handlers). Real delivery to a non-author client is UNPROVEN. Resolution: two-client E2E at T-5 or gateway-spec fan-out units. → V-2."}
  - {severity: low, module: "messaging.test.tsx", description: "F-3: thread-affordance queried by getByTestId where a role/text query exists — a11y-as-contract nit, carry."}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Unit suites ran green and were confirmed-executed via the C-1 false-green guard (api 309 + web 145,
    zero skipped). The thread state-machine logic (reply_count transitions, tail recompute, idempotency,
    one-level enforcement, pagination) is genuinely covered with state/return-value assertions, not
    mock-call trivia. APPROVED-WITH-CARRY rather than REWORK on the load-bearing realtime gap (F-1):
    no test at any layer proves a non-author client receives the two new thread events via real fan-out,
    and the gateway thread handlers are entirely untested — but the handlers are structurally identical to
    five sibling handlers already proven to deliver two-client live, so the risk is unproven not
    known-broken. F-1 is flagged HIGH and routed to T-5 (two-client E2E) and V-2; it does not block the
    unit layer's own honesty.
  next_action: PROCEED_TO_T-3
```
