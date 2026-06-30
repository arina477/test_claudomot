# Wave 20 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, agentId head-verifier-v3-phase1)
**Reviewed against:** process/waves/wave-20/blocks/V/review-artifacts.md
**Attempt:** 1

## Verdict
APPROVED

## Rationale
Both reviewers ran independently and emitted evidence-backed verdicts — Karen APPROVE (7/7 load-bearing claims verified, 0 wrong, 2 Low notes) and jenny APPROVE (every AC MATCHES except the AC4 client catch-up leg, logged as one Medium drift). I did not accept these at face value: I independently spot-checked the two highest-leverage claims against the codebase. The gating wedge (exactly-once + in-order, task e29f6566 AC2) is demonstrably met, not asserted — the stop-on-failure test (`outbox.test.ts:189-301`) drains three times and asserts `key2PostCount === 0` across all drains (line 301), a mutation-sensitive condition that would fail the instant a later message could send ahead of an earlier un-sent one; the `return` inside the catch at `outbox.ts:198` genuinely halts the loop, so the in-order guarantee is real. This clears the acceptance-by-assertion guard. The single Medium (cursor-format-drift) is also verified as diagnosed: the client seeds `lastSeenCursorRef` with a raw `createdAt` ISO string (`useMessages.ts:146`) while the server `decodeCursor` requires a base64url-encoded `created_at|id` with a `|` separator (`messages.service.ts:55-67`, returns null at line 59 when the separator is absent) → `?after=` 400s and is silently swallowed by the client `try/catch` (`:150-152`), with the socket `message:new` stream as a working fallback. This is a client bug against a CORRECT, symmetric server contract — it passes the spec-gap test as a bug, not an ambiguous/missing acceptance criterion — so V-2's routing to V-3 fast-fix (frontend, <20 LOC: seed from the opaque `result.nextCursor` + a real-cursor round-trip test) is correct, not ESCALATE. Triage classification quality is sound: every finding carries severity + disposition, the one blocking-class item is bounded and in-wave fixable, the gating AC is unaffected, and all T-block carryover findings are triaged non-blocking (accepted/future) with no B-block re-entry. The fast-fix queue is non-empty, so the block proceeds to Phase 2 fast-fix under the declared <20 LOC / 3-round bound; it does NOT meet the bar for REWORK (the gating AC is proven and the only open item has a working fallback and a trivial in-wave fix).

## Fast-fix queue (proceeds to Phase 2)
- cursor-format-drift (Medium): client seeds lastSeenCursorRef from raw createdAt instead of opaque nextCursor; <20 LOC frontend fix + round-trip test.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
