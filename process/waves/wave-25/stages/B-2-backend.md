# Wave 25 — B-2 Backend

**Specialist:** backend-developer. **Commits:** `33522d6` (primary), `2a1f2dd` (B-4 organizeImports defect fix). **Scope:** server slug import + editMessage atomicity + real-PG rollback spec.

## Delivered
1. **Server parser imports the shared slug (behavior-preserving).** `apps/api/src/messaging/mentions.ts:35` — inline `/(?:^|\s)@([a-zA-Z0-9_-]+)/g` rebuilt from the shared source: `new RegExp(\`(?:^|\\s)@([${MENTION_TOKEN_SLUG_SRC}]+)\`, 'g')`. Compiled pattern identical to the former literal. Server + client now derive the slug from ONE source. `mentions.spec.ts` stayed green (24/24 — regression guard).
2. **editMessage mention-diff wrapped in a transaction.** `apps/api/src/messaging/messages.service.ts` editMessage: the three writes (`tx.update(messages)` + `tx.delete(message_mentions)` + `tx.insert(message_mentions)`) now run inside a single `db.transaction(async (tx) => {...})`, mirroring createReply. Reads (existing mentions, resolveMentions SELECT) hoisted before the txn boundary (write-only body). Partial failure → full rollback (no inconsistent message_mentions). Confirmed the pre-existing `db.transaction` at ~:839 is `deleteMessage`, a different method.
3. **Real-PG rollback integration spec.** `apps/api/test/integration/edit-message-mentions-rollback.spec.ts` on the wave-24 pg-harness (create-server-rollback pattern): imports `./pg-harness` FIRST (CF-2 side-effect sets DATABASE_URL=DATABASE_URL_TEST), fault-injects the mention INSERT, asserts real ROLLBACK restores prior content + mention rows (0 partial rows). `describe.skipIf(!DATABASE_URL_TEST)` — CI-gated, fail-loud, not silent-skip.
4. **Harness helpers added** to `pg-harness.ts`: `insertFixtureChannel`, `insertFixtureMessage`, `insertFixtureMention`; `insertFixtureUser` extended with optional `username`; `truncateTables` extended with message_mentions / message_reactions / messages (dependency order).

## Defect resolved (found at B-4)
`organizeImports` lint-gate failure in the rollback spec (`insertFixtureMessage` before `insertFixtureMention`) — `biome format` doesn't run organizeImports; `biome ci` does. Fixed via `biome check --write` (`2a1f2dd`); CF-2 side-effect import confirmed still first.

## Exit
Server parity + atomicity + rollback coverage delivered. → B-4 wiring.
