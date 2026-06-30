# T-3 — Contract (wave-15 M3 @mentions)

**Pattern:** A — Verified-via-CI (project-internal Zod/shared-type contracts; no external SDK). **Merge SHA:** fd86540.

## Action 1 — Pattern

All contracts are project-internal Zod schemas in `packages/shared` consumed by api + web. No third-party SDK contract this wave (Drizzle is existing, no regen). → Pattern A.

## Contract surface introduced/modified (B-1 + B-4)

| Schema | File | Change |
|---|---|---|
| `MentionRefSchema {userId, username}` | packages/shared/src/messaging.ts | NEW |
| `MessageResponseSchema.mentions[]` | packages/shared/src/messaging.ts | EXTENDED (+= `mentions: MentionRef[]`) |
| `MyMentionsResponseSchema {items, nextCursor?}` | packages/shared/src/messaging.ts | NEW |
| `MentionEventSchema {messageId, channelId, channelName?, serverId?, mentionedUserId}` | packages/shared/src/messaging.ts | NEW (the per-user-room realtime event) |
| `ServerMemberSchema.username` | packages/shared/src/servers.ts | EXTENDED (+= `username: string|null`) — autocomplete data source |

## Action 2 — Coverage audit (CI evidence + trace)

CI test job: 471 tests green (37 shared). **The 37 shared tests are ALL `presence.spec.ts` (wave-14).** There is **no dedicated contract test for any wave-15 schema** — verified: `grep -rlE 'MentionRefSchema|MyMentionsResponseSchema|MentionEventSchema'` across all `*.spec.*`/`*.test.*` returns ZERO files; `.parse()`/`.safeParse()` is never called on these schemas anywhere (all imports are `import type`).

**How the contract IS exercised (indirectly):**
- **MessageResponse.mentions[]** — `messages.service.spec.ts` asserts `result.mentions` on the DTO (lines 193, 343) — the round-trip shape (empty-when-none, populated-when-resolved) is covered via the consumer.
- **MentionEvent** — `messages.service.spec.ts` asserts the emit payload shape `toMatchObject({mentionedUserId: ...})` (lines 761, 818-819), and `messaging.gateway.spec.ts` asserts `server.to('user:<id>').emit('mention', payload)` (test 12/13). The event's behavioral contract (per-recipient, author-excluded) is well-covered.
- **ServerMember.username** — `servers.service.spec.ts` (+109) covers the members roster now carrying username.
- **MyMentionsResponse** — covered via `messages.service.spec.ts` my-mentions query assertions (items shape + nextCursor).

**Negative cases:** the schemas are type-only (never runtime-parsed at a boundary), so there is no parse-invalid path to test in production code — TypeScript enforces shapes at compile time and the producers build the objects from typed literals. The controller does NOT response-validate via Zod (`MessageResponseSchema.parse` is never called on the REST boundary).

## Action 4 — Findings

**T3-F1 (LOW/coverage-gap, → V-2):** None of the 5 new/extended shared schemas has a dedicated parse-valid + parse-invalid contract test (violates the "100% schema coverage" discipline). The behavioral contract is exercised indirectly via consumer assertions (DTO `mentions[]`, emit `toMatchObject`, members roster), and the schemas are type-only (never runtime-parsed), so the runtime risk is low. But a future producer change that drifts from the schema (e.g., emitting `mentionedUserIds: []` array instead of per-recipient `mentionedUserId`) would not be caught by a schema test — only by the consumer test happening to assert the field. Recommend a `messaging-contract.spec.ts` mirroring `presence.spec.ts` (parse-valid + parse-invalid per schema). Carries the wave-14 precedent: wave-14 ADDED 37 shared presence contract tests closing a zero-coverage gap; wave-15 did NOT add the equivalent for mentions. **Cross-wave pattern candidate for T-3 principles at L-2.**

```yaml
test_pattern: ci-verified
skipped: false
contracts_audited:
  - "MentionRefSchema (NEW)"
  - "MessageResponseSchema.mentions[] (EXTENDED)"
  - "MyMentionsResponseSchema (NEW)"
  - "MentionEventSchema (NEW — per-user-room realtime event)"
  - "ServerMemberSchema.username (EXTENDED)"
ci_evidence:
  - "C-1 test job run 28431946584 green, 471 tests (37 shared = presence only)"
  - "MessageResponse.mentions[] asserted via messages.service.spec.ts:193,343"
  - "MentionEvent payload shape asserted via messages.service.spec.ts:761,818 + messaging.gateway.spec.ts test 12/13 (server.to('user:<id>').emit('mention'))"
  - "ServerMember.username covered via servers.service.spec.ts (+109)"
active_probe_results: []
infrastructure_gap_recorded: false
findings:
  - {severity: low, contract: "all 5 wave-15 shared schemas", description: "T3-F1 — no dedicated parse-valid/parse-invalid contract test for any new/extended schema; behavioral contract covered only indirectly via consumer assertions. Schemas are type-only (never runtime-parsed) so runtime risk is low. Wave-14 added equivalent presence contract tests; wave-15 did not for mentions. Recommend messaging-contract.spec.ts. T-3 principles candidate."}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-3
  reviewers: {}
  failed_checks: []
  rationale: >
    All five new/extended shared schemas are accounted for. The behavioral contract is exercised:
    MessageResponse.mentions[] round-trips through the service-spec DTO assertions, the MentionEvent
    payload shape (per-recipient, author-excluded) is asserted in both the service spec and the
    gateway spec (server.to('user:<id>').emit('mention')), and ServerMember.username is covered by
    the servers service spec. I am APPROVING rather than REWORKING because the schemas are type-only
    (never runtime-parsed at any boundary, so there is no production parse-invalid path) and every
    consumer of the shape has an assertion — the contract is honest, just not isolated. The genuine
    gap (T3-F1) is the absence of dedicated parse-valid/parse-invalid schema tests, which would catch
    producer drift the consumer tests might miss; it is LOW severity and forwarded to V-2 plus flagged
    as a T-3 principles candidate (wave-14 set the precedent by adding presence contract tests). This
    is a coverage-quality finding, not a false-green — no contract is claimed-tested-but-isn't.
  next_action: PROCEED_TO_T-5
```
