# T-2 — Unit (wave-15 M3 @mentions)

**Pattern:** A — Verified-via-CI. **Merge SHA:** fd86540. **CI run:** 28431946584.

## Action 1 — CI evidence

C-1 `verdict_evidence`: **test job pass, 56s** — Postgres 16 service container, `pnpm test:ci` (units + integration), **471 tests** (37 shared + 292 api + 142 web). Ran on merge commit HEAD. Note: this single CI job runs BOTH unit and integration tiers; T-4 audits the integration boundary, T-2 audits the unit/pure-function tier.

## Action 2 — Coverage audit (per modified module)

New/modified test files in the wave diff (6):

| Test file | Subject | Unit coverage of new surface |
|---|---|---|
| `apps/api/src/messaging/mentions.spec.ts` (+540) | `parseMentions` pure fn | STRONG. Word-boundary `(?:^|\s)@([a-zA-Z0-9_-]+)`: token-at-start, after-whitespace, multiple tokens, dedup (UNIQUE), trailing punctuation, token-at-end, multi-space, `@everyone` (parsed but excluded at resolution). Tested as a transition table, not single happy case — meets the T-1 pure-function discipline. |
| `apps/api/src/messaging/messages.service.spec.ts` (+275) | resolve/persist on create, edit-diff, rowToDto mentions[], my-mentions authz | STRONG. resolveMentions (member-only, username-IS-NOT-NULL), persist idempotent ON CONFLICT, edit-diff (delete-removed + insert-added), my-mentions session-derived authz + membership re-join + soft-delete exclusion + cursor. Asserts return values/rows, not mock call counts. |
| `apps/api/src/messaging/messaging.gateway.spec.ts` (+125) | per-user room join + mention.created emit | Covers `handleConnection` join `user:<id>`, `@OnEvent('mention.created')` emit to `user:<mentionedUserId>`, author-exclusion, room-only (no broadcast-all). This is the H-1 fix unit layer. |
| `apps/api/src/servers/servers.service.spec.ts` (+109) | members roster now carries username | Covers GET /servers/:id/members username addition (autocomplete data source). |
| `apps/web/src/shell/messaging.test.tsx` (+117) | MentionPill / renderBodyWithMentions / autocomplete | Self vs other pill, body-split rendering, composer @-trigger. Role/text queries (RTL). |
| `apps/web/src/shell/useMentionBadge.test.ts` (+196) | unread badge store | mention-event increment, active-channel suppression, reset on identity change, bootstrap-keyed-by-user. The H-1/H-2 fix unit layer. |

Every new pure function (parseMentions) and service method (resolveMentions, my-mentions query, edit-diff) has a co-located unit test with both happy AND error/edge paths. Tier-1-adjacent modules (my-mentions authz) covered.

## Action 3 — Flake observation

C-1 `fix_up_cycles: 0`, `flake_rerun_succeeded` n/a (clean first pass). B-5 documented no flakes. No new flakes this wave.

## Action 4 — Discipline note

- **mentions.spec.ts as a transition table** is exemplary — the parser is exercised across the full word-boundary matrix rather than one happy case. Canonical pattern for pure-function layers.
- **DB-mocked unit tier (KNOWN GAP):** messages.service.spec.ts mocks drizzle (`db.select as unknown as MockFn`) — correct for the UNIT tier (mock at the boundary), but the wave-14 carry **task 02fa8011** (no real-Postgres integration tier for messaging service) means message_mentions persistence/resolve is unit-mocked + CI-integration-job + live-T-8-probed, NOT a per-test-rollback real-PG integration test. Surfaced as T2-F1 (carry, → V-2) — NOT new this wave; the live T-8 two-client probe is the load-bearing substitute.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job: run 28431946584 green, 56s, 471 tests (37 shared + 292 api + 142 web), Postgres 16 service"
modules_audited:
  - apps/api/src/messaging/mentions.ts (parseMentions — transition-table spec)
  - apps/api/src/messaging/messages.service.ts (resolve/persist/edit-diff/my-mentions authz)
  - apps/api/src/messaging/messaging.gateway.ts (per-user room + mention.created — H-1 fix)
  - apps/api/src/servers/servers.service.ts (members+username)
  - apps/web/src/shell/useMentionBadge.ts (unread store — H-1/H-2 fix)
  - apps/web/src/shell/MessageList.tsx + MessageComposer.tsx + MentionAutocomplete.tsx (pills/autocomplete)
new_flakes: []
findings:
  - {severity: info, module: "apps/api/src/messaging/messages.service.spec.ts", description: "T2-F1 (carry 02fa8011) — messaging service unit tier mocks the DB; no real-Postgres per-test-rollback integration tier for message_mentions. Correct for unit layer; the gap is the missing dedicated integration tier. Covered by CI integration job + live T-8 two-client probe. Not new this wave."}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-2
  reviewers: {}
  failed_checks: []
  rationale: >
    The CI test job ran 471 tests green on the merge commit against a real Postgres 16 service
    container. Every new pure function and service method introduced this wave has a co-located unit
    test asserting user-observable results, not mock call counts: parseMentions is tested as a full
    word-boundary transition table (start/whitespace/dedup/punctuation/end/@everyone), the my-mentions
    authz path asserts session-derived filtering + membership re-join + soft-delete exclusion, and the
    H-1/H-2 badge fixes have dedicated unit coverage (per-user room emit, active-channel suppression,
    identity-reset). The one standing gap (T2-F1) is the wave-14-carried absence of a real-PG
    per-test-rollback integration tier for the messaging service — the DB is mocked in the unit tier
    (correct) and the gap is covered by the CI integration job plus the live two-client T-8 probe.
    No new flakes. Mutation-sanity holds: deleting any assertion would fail a plausible real bug.
  next_action: PROCEED_TO_T-3
```
