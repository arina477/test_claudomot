# Wave 55 — B-block Gate Verdict (B-6 Review)

**Block:** B (Build) · **Gate:** B-6 · **Head:** head-builder · **Mode:** automatic
**Task:** 344eabde-bc21-4978-9473-d5b46b7276b1 — who_can_dm='server-members' 2-cell privacy truth-table (integration test, test-only)
**Branch:** wave-55-dm-servermembers-truthtable · **Commit:** 9966465
**Wave type:** single-spec, test-only (no production/schema/migration change)

## Verdict: APPROVED

Independent inspection of the diff (`git diff main...wave-55-dm-servermembers-truthtable`) against the embedded spec confirms the wave ships exactly the 2-cell truth-table it promised, with a genuinely load-bearing negative leg. The integration test cannot run locally (no PG); it runs at C-1 CI. Honesty-by-inspection is therefore the gate, and it passes.

## Judge criteria (from the gate prompt)

### 1. Only the spec file changed — PASS
`git diff --stat main...HEAD` = `apps/api/test/integration/dm-candidates.spec.ts | 75 +++++`, **1 file changed, 75 insertions(+), 0 deletions**. Zero production, schema, migration, or other-test change. `getDmCandidates` (dm.service.ts:679) and its WHERE predicate are untouched. Cases (a)/(b) bodies untouched — the diff is a pure insertion (new const block + one new `it` before the closing `);`).

### 2. Test honesty — PASS (critical, verified line-by-line)
- **Positive (INCLUDED):** `insertFixtureUser(USER_P, …, undefined, 'server-members')`. The 4th param IS `who_can_dm` — verified against `pg-harness.ts:100-104` (`whoCanDm: 'everyone' | 'server-members' | 'nobody'`). USER_P and CALLER are both made members of `SERVER_C_SHARED`. Asserted `expect(ids).toContain(USER_P_SERVERMEMBERS_COMEMBER)`. Genuine positive on the tier.
- **Negative (EXCLUDED — the load-bearing fence):** USER_Q also has `who_can_dm='server-members'` (4th param). USER_Q is a member ONLY of `SERVER_C_DISJOINT`; CALLER is **NOT** added to that server (only `insertFixtureMembership(SERVER_C_DISJOINT, USER_Q)` exists — no CALLER membership). Asserted `expect(ids).not.toContain(USER_Q_SERVERMEMBERS_DISJOINT)`. **Not vacuous:** USER_Q passes the `ne(who_can_dm,'nobody')` predicate (server-members is admitted) and is excluded solely by the `inArray(callerServerIds)` shared-server fence. A future refactor that widened that fence would leak USER_Q and fail this assertion — exactly the tier-specific regression lock the spec's second AC demands.
- **Not redundant with case (b):** case (b)'s disjoint user `USER_Z` carries the DEFAULT `who_can_dm='everyone'`; case (c)'s USER_Q carries `'server-members'`. Different tier — (c) fences a cell (b) does not exercise.
- **Fixture non-collision:** new server UUIDs `…0003`/`…0004` (vs a/b `…0001`/`…0002`), new user ids `dm-cand-p-sm-comember`/`dm-cand-q-sm-disjoint`. No clash. `beforeEach → truncateTables()` additionally isolates each `it`, so cross-case bleed is structurally impossible.

### 3. Mirrors existing patterns — PASS
Reuses `insertFixtureUser` / `insertFixtureServer` / `insertFixtureMembership` identically to (a)/(b); same `sut.getDmCandidates(CALLER)` call; same `.map(c => c.userId)` (matches the `userId` field of the `selectDistinctOn` projection); same self-exclusion sanity assertion. FK discipline correct — `SERVER_C_DISJOINT` is owned by USER_Q so `servers.owner_id` FK is satisfied without adding CALLER. No reinvention.

### 4. No scope creep — PASS
`getDmCandidates` + predicate untouched; cases (a)/(b) untouched; no new helper, no schema, no migration, no production code.

## Stage-exit checklist (test-only wave)
- B-1 Contracts — SKIP (no contract/production/schema change; no Zod/DTO/Drizzle/Dexie surface touched). Justified.
- B-2 Implement — PASS (case (c) added per spec; guard/idempotency/pagination checks N/A — no route or write path added).
- B-3 Frontend — SKIP (no UI). Justified.
- B-4 Wire — SKIP (no runtime wiring; test-only).
- B-5 Verify-integration — Deferred to C-1 CI real-Postgres (no local PG). Acceptable because honesty-by-inspection passed and the deferral is the documented CI path. No new scale infra added.
- B-6 Review — PASS. Reviewed by head-builder independent of the node-specialist author. No over-engineering (single `it`, two assertions + one sanity assert). No debug-by-deploy.

## Anti-patterns scanned — none present
No logic-before-contract (no logic added), no schema drift / auto-migrate (no schema), no Dexie gap, no unguarded door (no route added), no single-client realtime, no idempotency omission, no offset pagination, no offline-contract break, no scale gold-plating, no author-only review (head gated independently), no debug-by-deploy.

## Residual risk
LOW. The only correctness dependency is that CI actually runs the integration job with `DATABASE_URL_TEST` set (the suite `describe.skipIf(SKIP)` silently skips otherwise). C-1 must confirm the (c) test executed and passed — not merely that the suite reported green with the block skipped. Flagged to head-ci-cd as a C-1 watch item.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers:
    head-builder: APPROVED
    author: node-specialist (B-2)
  failed_checks: []
  rationale: >
    Test-only wave adds case (c), the who_can_dm='server-members' 2-cell truth-table, to
    dm-candidates.spec.ts. git diff --stat confirms exactly one file changed, 75 insertions,
    zero deletions — no production, schema, migration, or other-test change; getDmCandidates
    and its predicate untouched; cases (a)/(b) untouched. The positive leg asserts a
    server-members co-member in a shared server is INCLUDED (toContain); the negative leg
    asserts a server-members user in a disjoint server the caller is NOT in is EXCLUDED
    (not.toContain). The negative is genuinely load-bearing and non-vacuous: USER_Q passes
    the ne(who_can_dm,'nobody') predicate and is excluded solely by the inArray shared-server
    fence, and it is tier-distinct from case (b)'s default 'everyone' disjoint user. Fixtures
    use fresh non-colliding ids and reuse the existing insertFixtureUser/Server/Membership
    helpers (4th param who_can_dm verified against pg-harness). Honesty-by-inspection passes;
    integration execution correctly deferred to C-1 CI real-Postgres.
  next_action: PROCEED_TO_C-1
  c1_watch: >
    Confirm the (c) integration test actually EXECUTED under DATABASE_URL_TEST at C-1 —
    describe.skipIf(SKIP) silently skips when the test DB env is absent; green-with-skip is
    not green-with-pass.
```
