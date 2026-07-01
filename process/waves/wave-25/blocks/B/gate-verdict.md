# Wave 25 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-25/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

All five acceptance criteria for the mention-parity wave (tasks row c18b8089) are delivered against the codebase reality, verified line-by-line against the diff rather than the manifest's claims.

**AC1 (behavior-preserving server extraction) — PASS.** `packages/shared/src/mentions.ts` exports `MENTION_TOKEN_SLUG_SRC = 'a-zA-Z0-9_-'`; the server parser (`apps/api/src/messaging/mentions.ts:42`) rebuilds `TOKEN_RE` as `new RegExp(\`(?:^|\\s)@([${MENTION_TOKEN_SLUG_SRC}]+)\`, 'g')`. I executed the rebuild against the former inline literal and confirmed byte-identical source AND flags (`(?:^|\s)@([a-zA-Z0-9_-]+)` / `g`). The 24-test `mentions.spec.ts` regression guard is green. Extraction is genuinely behavior-preserving, not merely claimed.

**AC2 (`@bob.dev` → `bob` pill + `.dev` trailing text) — PASS.** `MessageList.tsx:562` uses `extractMentionSlug(part)` to get the leading slug, computes `trailing = part.slice(1 + slug.length)`, and renders `<span><MentionPill/>{trailing}</span>`. The prior code stripped trailing punctuation but rendered no trailing text — this is a real parity improvement, not a cosmetic shuffle.

**AC3 (unresolved handle → plain text, mentionMap-gated) — PASS.** The pill path is guarded by `ref && slug != null` where `ref = mentionMap.get(slug.toLowerCase())`; unresolved slugs fall through to plain text. Still mentionMap-gated.

**AC4 (editMessage mention-diff atomicity) — PASS, verified real not cosmetic.** `messages.service.ts` editMessage now wraps the three writes in a single `db.transaction(async (tx) => {...})`. All three writes (`tx.update(messages)`, `tx.delete(message_mentions)`, `tx.insert(message_mentions)`) run on the SAME `tx` handle — NOT three separate `db.*` calls. The `if (!updatedRow) throw` sentinel is inside the txn, so a failed UPDATE rolls the whole set back. The mention-set reads (existing IDs, new resolved IDs) are correctly hoisted BEFORE the txn: they are read-only diff computation and do not affect atomicity or correctness. Structure faithfully mirrors the createReply/createServer precedent (`messages.service.ts:~1038`, `db.transaction` template pattern).

**AC5 (real-PG rollback integration spec, executes in CI) — PASS, honest fault-injection.** `edit-message-mentions-rollback.spec.ts` fault-injects at the node-postgres Pool layer (`wrapPoolConnect` patches the PoolClient's `query()` to throw on the real `INSERT INTO message_mentions` inside the open transaction) — it does NOT mock the system under test; the real `MessagesService.editMessage` runs against real Postgres. Rollback is asserted via a SEPARATE harness pool (cross-connection visibility = genuine Postgres COMMIT/ROLLBACK semantics), checking that `message_mentions` still has exactly alice's pre-edit row, bob's row is absent, and message content is unchanged. CF-2 `import './pg-harness'` IS the first import (line 13, before the SUT import at line 30), so the lazy db singleton resolves to the test DB. CI executes it for real: `.github/workflows/ci.yml` provisions a `postgres:16` service on `:5432` and sets `DATABASE_URL_TEST`, so `describe.skipIf(SKIP)` runs (not a silent no-op). The `it.skip`-with-reason path only fires in local dev without the env var — by design, and it fails loud with a clear message rather than silent-passing.

**Binding B-1 carry honored.** The shared export is named `MENTION_TOKEN_SLUG_RE` / `MENTION_TOKEN_SLUG_SRC` (the mention TOKEN slug), documented in-file as "intentionally BROADER than the username validation grammar `[a-z0-9_]{3,20}` at profile.ts:14" and NOT tightened to the username rule. A future dev is explicitly warned off tightening it.

**Approach deviation (client mirror vs direct shared import) — BLESSED.** The web-local mirror `apps/web/src/shell/mentionSlug.ts` + parity contract test `mention-slug-parity.test.ts` is an acceptable delivery of AC1/AC2's single-source-of-truth intent given the documented CJS-avoidance convention (messagingSocket.ts:32-40 — vite/rollup's cjs-module-lexer cannot resolve `@studyhall/shared` runtime value exports through the Object.defineProperty re-export getters). The parity test genuinely imports BOTH the shared implementation AND the local mirror and asserts identity of the slug source string plus behavioral identity across 12 cases — so any drift between them becomes a RED test. Server (apps/api, CJS→CJS) imports the shared value directly. Net: true single source on the server, enforced-parity mirror on the client; the wave thesis (no silent client/server mention-grammar drift) holds. This is proportionate application of an existing convention, not unguarded drift risk.

**No auth/RBAC/migration/idempotency surface touched.** No new routes, no schema change (B-0 schema SKIP confirmed), no Socket.IO upgrade path, no token minting, no Dexie store change. Nothing in the door-guard or migration-gap firing set applies.

## Accepted debt (Medium — documented, not rework-triggering)

code-quality-pragmatist flagged that the shared `MENTION_TOKEN_SLUG_RE` and the shared `extractMentionSlug` currently have only test consumers (the server imports `MENTION_TOKEN_SLUG_SRC` only; the web uses its local mirror). This is a tidiness observation, NOT a correctness/security/contract defect, and is accepted as debt for these reasons:

- It ships no bug, no drift risk, and no unguarded surface.
- The parity test's behavioral block that exercises the shared `extractMentionSlug` is exactly what makes the web mirror's drift a RED test — deleting it would WEAKEN the drift guard the entire deviation rationale rests on.
- The pragmatist's own caveat applies: the P-2/P-3 spec's exact export contract and any near-future wave that consumes `extractMentionSlug` server-side must be confirmed before deletion; that confirmation is a P-4/jenny concern, not a B-block blocker.
- On a self-use MVP, forcing rework to trim non-load-bearing shared surface is itself a firing-grade time sink (scale/gold-plating anti-pattern, inverted).

Disposition: leave as-is this wave. If a future wave needs the shared surface trimmed, it can do so cheaply; recommend an L-2 note rather than a B-block rework.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
