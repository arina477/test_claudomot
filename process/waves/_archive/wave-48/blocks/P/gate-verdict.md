# Wave 48 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-w48-p4)
**Reviewed against:** process/waves/wave-48/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is a test-only privacy-fence regression-hardening wave that closes a real V-2 coverage gap: the wave-46/47 unit tests for GET /dm/candidates use mocks whose `where()` is a no-op, so the two counter-example controls — a `who_can_dm='nobody'` co-member being excluded, and a disjoint non-co-member being hidden — were never live-proven against a real query. The problem is a genuine root cause (coverage theater by construction on a privacy boundary where a candidate leak exposes non-co-members), not a symptom, and it ladders to a live milestone (M8, 84e17739, in_progress). All four acceptance criteria are falsifiable and observable: each names a concrete real-Postgres assertion tied to an exact predicate. I verified the load-bearing claims against the codebase — `apps/api/test/integration/pg-harness.ts` exists with `insertFixtureUser` at line 96 (current signature `(id, email, username?)`, so the proposed `who_can_dm` param is a clean backward-compatible addition), `presence-comembers.spec.ts` is a real-PG integration spec, and `DmService.getDmCandidates` in `apps/api/src/dm/dm.service.ts` applies exactly the predicates the tests must exercise: `inArray(server_id, callerServerIds)`, `ne(user_id, callerId)`, and `ne(users.who_can_dm, 'nobody')` on a `users.who_can_dm` column that exists. The scope is correctly fenced to the fixture param + 2 assertions (explicitly NOT pagination c5051444, NOT picker-UI 5bcbd27f), design_gap_flag=false is correct (backend test-only, no D-block), and there is no production/schema/UI change. The sub-floor RESCOPE-AUTO-MERGE override to ship is acceptable: test-only hardening is inherently sub-floor, the wave-16 test-exemption precedent plus standing 9th-instance precedent plus ceo-reviewer HOLD-SCOPE and mvp-thinner OK ratify it, and expanding would pull the founder-reserved feature fork that is deliberately deferred — so no redundant BOARD is warranted. No security-scope tightened gate applies (no auth/session/cookie/rate-limit surface is added; this only reads existing rows). Guardrail carried forward: wave-49 P-0 MUST re-escalate the study-groups-vs-search founder fork (no 2nd consecutive debt wave).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---
## Phase 2 — Karen + jenny + Gemini
- **karen APPROVE**: 6/6 VERIFIED. Confirmed dm.service.spec.ts getDmCandidates tests are mock-pre-filtered coverage-theater (where() no-op passthrough; comment admits "mock simulates the DB already having filtered"); getDmCandidates has real ne(who_can_dm,'nobody')+inArray+ne(user_id,caller); test-only; harness reusable; node-specialist valid. **NON-BLOCKING FLAG**: the new integration spec uses describe.skipIf(!DATABASE_URL_TEST) — T-3 must confirm it RAN green in CI (not skipped), else theater moves mock-noop→skip-noop.
- **jenny APPROVE**: 10/10 spec items MATCH (BOARD wave-48 direction, wave-47 candidate-source, wave-35 who_can_dm enum, scope-fence c5051444/5bcbd27f, wave-49 guardrail). 0 drift. Flag: @task-completion-validator at B-6/T to confirm real-DB execution (nonzero query time).
- **Gemini UNAVAILABLE** (429) — degradable.
## Gate result: PASS → design_gap_flag=false → skip D → B.
CARRY TO B-2/T-3: the integration spec MUST actually run against real PG in CI (DATABASE_URL_TEST present) — verify it does NOT skip; nonzero query execution.
