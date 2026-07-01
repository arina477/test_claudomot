# Wave 25 — B-6 /review output (Phase 2)

**Branch:** wave-25-mention-parity | **Base:** origin/main (merge-base 7045550) | **Reviewer:** independent adversarial code-reviewer (fresh context) + orchestrator synthesis.
**Scope note:** `claudomat-brain/VERSION` + `claudomat-brain/onboarding/stages/stage-v13-handoff.md` appear in the raw merge-base diff as UNCOMMITTED working-tree edits — brain-vendored, NOT wave work, excluded from review + NOT committed.

## Scope check
CLEAN. Intent = mention token-parser parity (client↔server shared slug) + editMessage atomicity. Delivered matches: shared slug grammar, server+client consume it, editMessage txn, real-PG rollback spec. No scope creep (the CJS-avoidance mirror + parity test are forced-by-convention, in-scope). No missing ACs.

## Findings (adversarial pass)

**Core atomicity — CLEAN (no P0/P1).** editMessage's UPDATE messages + DELETE + INSERT message_mentions all run on the same `tx` inside one `db.transaction`; the not-found sentinel throw is inside the callback (rolls back); reads hoisted before the txn match the createReply precedent; returned DTO reflects the committed row. Slug parity server RegExp byte-identical; renderBodyWithMentions AC2/AC3 correct (no off-by-one in `slice(1+slug.length)`, React auto-escapes trailing text, stable keys); null/edge/case-folding all handled.

| # | Sev | Conf | File | Finding | Disposition |
|---|---|---|---|---|---|
| 1 | P2 | 8/10 | edit-message-mentions-rollback.spec.ts | Load-bearing `countRows` used the separate `harnessPool` (real proof) but row-content assertions read `dbModule.pool()` (SUT pool) while comments claimed cross-connection isolation → overstated proof | **FIXED** `f9b7887` — all post-rollback assertions rerouted through new `harnessQuery` helper on `harnessPool`; comments now true per-assertion |
| 2 | P2 | 8/10 | packages/shared/src/mentions.ts + apps/web/src/shell/mentionSlug.ts | Only the server RegExp derived from `MENTION_TOKEN_SLUG_SRC`; `MENTION_TOKEN_SLUG_RE` + both `extractMentionSlug` regexes hardcoded `[a-zA-Z0-9_-]` → SRC constant decorative, const-parity test could stay green while behavior drifts | **FIXED** `aeeb8d6` — both regexes now `new RegExp(\`...[${MENTION_TOKEN_SLUG_SRC}]...\`)`; parity test gains `['@pre.fix','pre']` row that goes RED on class-boundary drift; behavior byte-identical (`match[0]` ≡ old capture-group `match[1]`) |
| 3 | P2 | 7/10 | MessageList.tsx:560 | Client splits on `/(@\S+)/` (matches mid-word `@`) vs server `(?:^|\s)@` — split-boundary still divergent though intra-token slug unified. Pre-existing; low blast radius (server `mentions[]` gate means a mid-word `@bob` only pills if server independently resolved `bob`, which it won't for `a@bob`) | **ACCEPTED DEBT** — reviewer recommends deferral; matches mvp-thinner "keep out: exhaustive grammar edge cases." → L-1 observation / future-seed candidate |
| — | P3 | 9/10 | mentions.ts | `MENTION_TOKEN_SLUG_RE` was a dead export | Subsumed by fix #2 — now wired to the SRC constant, retained |
| — | P3 | 7/10 | mentions.spec.ts | unit-test txn mock forwards tx.* to the same mocks (weak on the atomicity property specifically) | ACCEPTED — integration rollback spec is the real atomicity proof; unit mock is convenience |
| — | P3 | 6/10 | messages.service.ts:683 | resolveMentions read on non-tx db before txn (theoretical stale-membership) | ACCEPTED — pre-existing, matches createReply parity, negligible |

## Triage summary (B-6 Action 3)
- Critical/High: **0**.
- Medium: 3 → 2 fixed same-branch (charter-relevant + cheap), 1 accepted-debt (pre-existing, deferred).
- Low (P3): 4 → 1 subsumed by a fix, 3 accepted.

## Post-fix re-verification (Action 3)
typecheck 4/4 · build 3/3 · lint 0 errors (7 pre-existing warnings) · api 395/395 · web 234/234 (incl. new defensive parity row). Both fix diffs re-read: surgical, behavior-preserving, no new critical/high (Action 5 re-review clean).

Recommendation: **Ship** — core editMessage atomicity is genuinely correct with a real cross-connection rollback proof; the two chartered-guarantee gaps (proof honesty + single-source-of-truth) are now tightened; the one deferred item is pre-existing and low-blast-radius.
