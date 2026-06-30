# T-3 — Contract (wave-18 M3 threads)

**Pattern:** A — Verified-via-CI (project-internal Zod/shared contracts; no external SDK this wave).

## Action 1 — Pattern
B-1 authored project-internal shared contracts in `packages/shared/src/messaging.ts`. No external SDK contract surface. → Pattern A, CI `test` job authoritative.

## Action 2/4 — Contract surface coverage trace
New/modified contract surfaces this wave (read from `packages/shared/src/messaging.ts`):

| Contract | Shape | Covered by |
|---|---|---|
| `MessageResponseSchema` EXTENDED | `+threadParentId` (nullable optional), `+replyCount` (int nonneg optional), `+lastReplyAt` (nullable optional) | Round-tripped via `rowToDto` + asserted in createReply/listThreadReplies service specs (return-value shape) + web consumes typed |
| `ThreadRepliesResponseSchema` NEW | `{items: MessageResponse[], nextCursor}` | listThreadReplies service spec asserts `result.items` + pagination; client `useThread` consumes typed |
| `ThreadReplyEventSchema` NEW | `{parentId, channelId, reply: MessageResponse}` | service spec asserts emitted payload `objectContaining({parentId, channelId})`; gateway + client import same type |
| `ThreadReplyDeletedEventSchema` NEW | `{parentId, channelId, replyId, replyCount: int nonneg, lastReplyAt: string\|null}` | service spec asserts emitted payload `toMatchObject({parentId, channelId, replyId, replyCount, lastReplyAt})` incl. ISO string; gateway + client import same type |

Every contract surface is type-checked end-to-end (server emits → client consumes the SAME exported type — no drift possible at compile time) and exercised by at least one runtime test that builds/asserts a payload of the shape.

## Action 4 — Findings

**Finding F-2 (MEDIUM — contract coverage gap):** The project has an established Zod parse-test convention (`packages/shared/src/presence.spec.ts`: every schema gets a `safeParse` VALID case AND an INVALID case asserting the issue path/code). The three NEW wave-18 thread schemas — `ThreadRepliesResponseSchema`, `ThreadReplyEventSchema`, `ThreadReplyDeletedEventSchema` — have NO dedicated parse-valid/parse-invalid unit in `packages/shared`. They are validated only transitively (typed payload construction + shared-type import on both ends). The runtime risk is low because the producer is the type-author and the consumer imports the identical type (no independent re-derivation), so the load-bearing failure mode that schema parse-tests catch — a payload field that violates the schema at runtime — is largely closed by the compile-time type identity. But it deviates from the project's own 100%-schema-coverage convention. Carry to V-2 / L-2 as a T-3 principles candidate (add the three `safeParse` pairs). NOT blocking: no contract drift exists, the types are identical across the boundary.

```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [MessageResponseSchema(extended), ThreadRepliesResponseSchema, ThreadReplyEventSchema, ThreadReplyDeletedEventSchema]
ci_evidence:
  - "C-1 test job 84316325489 green; api 309 + web 145; thread service/web specs executed exercise the contract payloads"
active_probe_results: []
infrastructure_gap_recorded: false
findings:
  - {severity: medium, contract: "ThreadRepliesResponseSchema / ThreadReplyEventSchema / ThreadReplyDeletedEventSchema", description: "F-2: no dedicated Zod safeParse VALID+INVALID unit for the 3 new thread schemas, deviating from the project's presence.spec.ts convention. Validated transitively via shared-type identity (low runtime risk). → V-2 / L-2 (T-3 candidate)."}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Every wave-18 contract surface (MessageResponse extension + 3 new thread schemas) is type-identical
    across the server-emit / client-consume boundary and exercised by at least one runtime payload
    assertion in the CI-verified suite, so no contract drift is possible. APPROVED-WITH-CARRY on F-2:
    the three new schemas lack the dedicated safeParse VALID+INVALID units the project's own presence.spec
    convention calls for — a real but low-risk gap (closed at compile time by shared-type identity),
    routed to V-2 / L-2 rather than blocking.
  next_action: PROCEED_TO_T-5
```
