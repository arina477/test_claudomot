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

---

# Wave 18 — P-4 Verdict (ATTEMPT 2 — post-rework)

**Reviewer:** head-product (fresh spawn, agentId head-product-wave18-p4-a2)
**Reviewed against:** corrected spec (tasks.description of 497c2ae6, seed 497c2ae6), process/waves/wave-18/stages/P-3-plan.md, process/waves/wave-18/stages/P-2-spec.md
**Attempt:** 2  (post-rework re-gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
The single load-bearing factual error that triggered the attempt-1 REWORK — every stage falsely asserting the `thread_parent_id` self-FK was "already declared" — is now surgically corrected and verified against the live codebase. I re-ran the absence check independently: `grep` for `thread_parent` / `threadParent` across `apps/api/src/db/schema/messages.ts`, all migrations `0000`–`0007`, and `packages/` returns zero occurrences, while `messages.id` (uuid PK, schema line 14) exists as a valid self-FK target and the migration directory tops out at `0007` (so `0008` is the correct next number, no collision).

Migration 0008 is now correctly THREE-PART across all three artifacts: (1) the spec `contracts.data` line reads "messages += thread_parent_id uuid NULL self-FK REFERENCES messages.id (NOTE: verified ABSENT, not previously declared) + reply_count int NOT NULL default 0 + last_reply_at timestamptz NULL; index on (thread_parent_id, created_at)"; (2) P-3 § Data model + the B-1 schema-table rows specify the column add + self-FK + both counters + index, and the drizzle schema step (messages.ts) adds all three columns plus the self-relation; (3) the P-2 pointer matches ("Schema 0008 THREE-PART (thread_parent_id self-FK [ABSENT] + reply_count + last_reply_at + index)"). The false "already declared" premise is gone from P-3's architecture-deltas, replaced by an explicit "VERIFIED ABSENT" correction note. A builder following B-1 verbatim now authors the column the entire feature depends on rather than indexing a non-existent column.

The self-FK shape is sound: `thread_parent_id uuid NULL REFERENCES messages.id` is nullable (top-level messages carry NULL — correct), references a real PK, and stays additive (nullable/defaulted, no data backfill — the "additive / no backfill" framing remains valid). The one-level (`parent.thread_parent_id IS NULL`) and same-channel (`parent.channel_id == request.channel_id`) constraints are enforced at the SERVICE layer in the createReply transaction, NOT via a DB CHECK — which is correct and not a gap: "the parent must not itself be a reply" is a cross-row predicate a CHECK cannot express, and same-channel is a join condition; service-layer validation in the same txn as the insert is the only sound enforcement and matches AC-2 + the edge-case list.

Everything I ratified at attempt 1 still stands and is unchanged by this fix: framing (one-level thread replies is a literal M3 success-metric feature, BOARD-endorsed 7/7, threads-first); the mvp-thinner THIN-split rejection (outbox parity 0b728319 is the deliberate M3→M4 send-path handoff, coherent-slice judgment from problem-framer + ceo-reviewer); one-level enforcement (reject reply-of-reply + cross-channel parent); transactional reply_count/last_reply_at (same-txn increment, decrement + MAX(created_at) recompute on soft-delete, no double-count on idempotent retry); thread-scoped realtime as an event distinct from message.created over the existing /messaging namespace; idempotency reuse (ON CONFLICT); and no gold-plating (nested threads, thread-following/notifications, per-user unread all explicitly OUT; attachments deferred to the next M3 wave). design_gap_flag remains TRUE (thread panel + affordance are a D-block surface against design/server-channel-view.html) — the D-block handoff is correct.

No stage-exit checkbox fails. The cap-remaining note from attempt 1 (2) is preserved; this approval consumes none of it.

## Failed checks
(none)

## Handoff
- design_gap_flag: TRUE → D-block runs before B-block (thread panel + in-list affordance are UI gaps).
- Phase 2 may proceed: karen (load-bearing-claim verification) + jenny (spec-vs-bet / spec-vs-journey drift) + gemini.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2  (unchanged — APPROVED, no rework consumed)

---

# Wave 18 — P-4 Phase-2 Triage (Gemini cross-review CONCERN)

**Reviewer:** head-product (fresh spawn, agentId head-product-wave18-p4-phase2-triage)
**Reviewed against:** corrected spec (tasks.description of 497c2ae6), process/waves/wave-18/stages/P-3-plan.md
**Phase:** 2 (cross-review triage). Phase-1 head-product APPROVED (attempt 2); karen + jenny APPROVED Phase 2.
**Source:** Gemini cross-review CONCERN (single).

## Concern (verbatim)
"The strategy for maintaining the denormalized `last_reply_at` timestamp upon reply deletion is inefficient. It forces a potentially expensive re-computation on every delete, even when the deleted reply is not the most recent one, creating a performance bottleneck for threads with many replies."

## Decision
**MATERIAL → small P-3 annotation (not a rework).**

## Rationale
The concern is technically correct. `last_reply_at` is defined as `MAX(created_at)` over live replies, so it only CHANGES when the deleted reply was the tail (the most-recent live reply). Soft-deleting any non-latest reply leaves the MAX unchanged, making the unconditional recompute provably wasted work in that branch. `reply_count`, by contrast, must decrement on every delete regardless. The P-3/spec text writes the recompute as UNCONDITIONAL — so the diagnosis holds at the code level.

It does NOT fire at current scale: self-use-MVP (founder is sole user), few replies per thread, and the existing `(thread_parent_id, created_at)` index makes even the unconditional MAX a cheap index lookup. There is no live bottleneck today, so this is not a correctness or stability defect that would block the gate.

I nonetheless triage it MATERIAL because it is a correctness-shaped efficiency improvement — the same class and the same disposition as the wave-17 parallel-safe annotation precedent: forward-looking, the plan author is already in the P-3 file, and baking the guard in now is a single-conditional annotation rather than a deferred ticket against a transaction we would otherwise have to re-open later. Triaging a structurally identical concern as NOT-MATERIAL here would be inconsistent with that precedent. The guard is also a precision win independent of perf: it makes the invariant "last_reply_at only moves when the thread tail moves" explicit in the code rather than implicit. The change is cheap, correct, terminal at P-3, and consumes no rework cap.

Scope discipline (anti gold-plating): this is a one-conditional annotation to an EXISTING transaction step — not a new index, not a trigger, not a materialized counter, not a rework. It stays inside the "small annotation" lane.

## P-3 annotation to apply (exact)
In P-3 § Plan (the `deleteReply` / soft-delete transaction step) and the mirrored spec `contracts` deletion-behavior line, change the `last_reply_at` maintenance from unconditional to conditional:

- `reply_count`: **always** decrement by 1 within the soft-delete transaction (unchanged — fires on every delete).
- `last_reply_at`: recompute `MAX(created_at)` over remaining live replies **only when the soft-deleted reply was the thread tail** — i.e. when `deletedReply.created_at == parent.last_reply_at` (the deleted reply is the current most-recent live reply). When the deleted reply is NOT the tail, leave `last_reply_at` unchanged (skip the MAX entirely). The recompute, when it runs, still yields `MAX(created_at)` of remaining live replies, or NULL when none remain.
- All within the same `deleteReply` transaction; no new index, no trigger, no schema change. The `(thread_parent_id, created_at)` index already serves the conditional MAX.
- Re-run P-3's self-consistency sweep item 1 to confirm the deletion step still maps to the soft-delete AC cleanly after the edit.

## Disposition
- **Verdict unchanged: APPROVED.** This triage is a small forward-looking P-3 annotation layered onto the already-APPROVED plan; it does not reopen framing, decomposition, ACs, architecture, or the design_gap handoff.
- **Cascade:** none (terminal at P-3). reply_count semantics, contracts.types/api/sdk, and all ACs are unchanged.
- **rework_attempt_cap_remaining: 2** (unchanged — annotation, not rework).
- Phase-2 cross-review CONCERN resolved. P-block exits APPROVED; design_gap_flag TRUE → D-block before B-block.

## Footer
- verdict_complete: true
- triage_complete: true

---
## Phase 2 final (appended by orchestrator)
| Reviewer | Verdict |
|---|---|
| karen | APPROVE — 6 claims VERIFIED (thread_parent_id ABSENT confirmed, idempotency reuse, soft-delete/tombstone reuse, /messaging room-emit no-new-namespace, 0008 next, rowToDto sole DTO site). B-3 CARRY: createMessage is NOT transactional → use createServer's db.transaction as the txn template for createReply/deleteReply. |
| jenny | APPROVE — no drift. 3-block spec MATCHES M3 Scope "thread replies (thread_parent_id)" + success-metric; BOARD-authored (threads-first); 2-namespace lock honored; one-level hard-AC; nested/notifications/unread OUT; M3 correctly not closed (attachments remain). |
| Gemini | CONCERN (unconditional last_reply_at recompute on delete) → head-product MATERIAL → small P-3 annotation (conditional recompute, tail-only). Gate stays APPROVED. |

## Gate result: PASSED → D-block (design_gap_flag true → thread-view panel + affordance)
- B-block carries: (1) conditional last_reply_at recompute (tail-only); reply_count always decrements; (2) use createServer's db.transaction pattern (NOT createMessage) for the reply txn boundary; (3) migration 0008 THREE-PART (thread_parent_id self-FK + reply_count + last_reply_at + index).
- Next: D-1 Brief (thread-view panel + in-list thread affordance).
