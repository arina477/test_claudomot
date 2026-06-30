# Wave 18 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave18-p4)
**Reviewed against:** process/waves/wave-18/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
REWORK

## Rationale
The wave is aimed at the right problem (one-level thread replies is a literal M3 success-metric requirement, BOARD-endorsed 7/7, threads-first), correctly scoped, and the spec's acceptance criteria are falsifiable and cover the hard edges — one-level enforcement (reject reply-of-reply + cross-channel parent), transactional reply_count/last_reply_at (same-txn increment, decrement + MAX(created_at) recompute on soft-delete, no double-count on idempotent retry), a thread-scoped realtime event distinct from the top-level message.created over the existing /messaging namespace, and idempotency reuse — all of which I verified against the live codebase as real, reused primitives. I also ratify the P-0 rejection of the mvp-thinner THIN-split: outbox parity is the deliberate M3→M4 send-path handoff the seed's own decomposition placed in this slice, M4 offline-first builds directly on it, and the coherent-slice judgment from problem-framer + ceo-reviewer correctly outweighs the narrow "not strictly needed THIS wave" thinness. However, the gate fails on one load-bearing factual error repeated identically across P-0, P-1, P-2, and P-3: every stage asserts the `thread_parent_id` self-FK is "already declared" in the messages schema and treats the migration as adding only reply_count/last_reply_at + an index. It is not declared anywhere — `apps/api/src/db/schema/messages.ts` has no thread_parent_id column, and no migration 0000–0007 introduces it. A builder following P-3's B-1 step verbatim would author a migration that adds the index `(thread_parent_id, created_at)` against a non-existent column and omit the thread_parent_id column + self-FK entirely — a build-breaking divergence between the plan and reality. The fix is surgical (P-3 B-1 step + one spec data-contract line); framing, decomposition, ACs, and architecture are otherwise sound.

## Rework instructions  (only if REWORK)

### Stages requiring rework
- P-3: correct the B-1 schema step and the data-model section to add the missing thread_parent_id column + self-FK; correct the one spec data-contract line that mirrors the false claim.

### Per stage

#### P-3
- **What's wrong:** P-3 (Approach § Data model and Plan § B-1) states `thread_parent_id self-FK already declared (no FK change)` and lists migration 0008 as `messages += reply_count, last_reply_at + index`. Verified false: `apps/api/src/db/schema/messages.ts` declares no thread_parent_id column, and grep across all migrations 0000–0007 and packages/ finds zero occurrences of thread_parent_id / threadParentId. The migration as planned would create `index('messages_thread_parent_created_at_idx').on(thread_parent_id, created_at)` against a column that does not exist, and would never add the column the entire feature depends on. The same false premise is mirrored in the spec's 497c2ae6 `contracts.data` line ("thread_parent_id self-FK already declared").
- **Heuristic fired:** Architecture-blind plan — the plan is built on a false premise about the current schema state (a load-bearing claim about pre-existing infrastructure that does not hold), which would cause the builder to either refactor mid-build or ship a broken migration.
- **What "good" looks like:** migration 0008 is described as additive but **three-part**: (1) ADD COLUMN `thread_parent_id uuid NULL REFERENCES messages(id)` (self-FK, nullable — top-level messages have it NULL; choose ON DELETE behavior and document it, e.g. ON DELETE SET NULL or no action consistent with the soft-delete model since messages are never hard-deleted); (2) ADD COLUMN `reply_count integer NOT NULL DEFAULT 0` + `last_reply_at timestamptz NULL`; (3) ADD INDEX `(thread_parent_id, created_at)`. The Drizzle schema edit in `apps/api/src/db/schema/messages.ts` adds all three (column + two counters + index), not just the two counters. Still additive (all nullable/defaulted, no data backfill), so the "additive / no backfill" framing remains correct — only the column inventory changes.
- **Re-do instructions:**
  1. In P-3 § Approach › Data model: replace "thread_parent_id self-FK already declared (no FK change)" with "migration 0008 adds the thread_parent_id uuid NULL self-FK column (REFERENCES messages(id)) — it is NOT yet in the schema — plus reply_count int NOT NULL DEFAULT 0, last_reply_at timestamptz NULL, and index (thread_parent_id, created_at). All additive (nullable/defaulted); no data backfill. Document the self-FK ON DELETE behavior."
  2. In P-3 § Plan › B-1 Schema table: change the 0008 migration row to "messages += thread_parent_id (self-FK, nullable) + reply_count + last_reply_at + index(thread_parent_id, created_at)" and the schema.ts row to add the thread_parent_id column alongside the two counters.
  3. In the canonical spec (tasks.description of 497c2ae6), edit the `contracts.data` line of the 497c2ae6 spec from "thread_parent_id self-FK already declared" to "migration 0008 (additive): messages += thread_parent_id uuid NULL self-FK (REFERENCES messages(id)) + reply_count int default 0 + last_reply_at timestamptz null + index(thread_parent_id, created_at)". Update the P-2-spec.md pointer's data line to match if it restates the claim.
  4. Re-run P-3's self-consistency sweep item 1 (every AC → step) to confirm the corrected migration still maps to AC-1/AC-3/AC-4 cleanly; no other P-3 content changes.

### Cascade

P-block cascade rules (apply where the rework stage is the trigger):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| P-3 plan | (terminal — only itself) |

- **Stages that must re-run after the above:** none (P-3 is terminal in the cascade). The spec data-contract line edit is a same-pass correction to the DB row, not a P-2 re-derivation — the ACs and contracts.types/api/sdk are unchanged and remain correct.
- **Stages that stay untouched:** P-0 (framing + mvp-thinner ratification stand), P-1 (decomposition + design_gap_flag stand; the LOC estimate is unaffected materially — one added column + FETCH does not move ~2800 below the 2500 floor), P-2 ACs (correct as written).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
