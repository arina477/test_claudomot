# B-6 Phase 2 — Production-bug / test-correctness review

**Branch:** `wave-55-dm-servermembers-truthtable` @ `9966465`
**Scope:** `git diff main...HEAD` — TEST-ONLY (1 file, +75 lines)
**Reviewer:** code-reviewer
**Verdict:** CLEAN — approve.

## Counts
- Critical: 0
- High: 0
- Medium: 0
- Low: 0

## Diff scope confirmation
`git diff --stat` = `apps/api/test/integration/dm-candidates.spec.ts | 75 +++`, single file, 75 insertions, 0 deletions. No production code, no schema, no migration, no config, no fixture-helper change. Hunt item 4 (accidental production/schema change): NONE — clean.

## Hunt findings

### 1. Negative assertion vacuous? — NO, genuinely load-bearing.
- USER_Q (`USER_Q_SERVERMEMBERS_DISJOINT`) is inserted with the 4th param `'server-members'` (spec line 197), so it is NOT a `who_can_dm='nobody'` row. It therefore **survives** the SUT's `ne(users.who_can_dm, 'nobody')` predicate.
- USER_Q's membership is only in `SERVER_C_DISJOINT` (line 212), which the CALLER is NOT a member of (CALLER's only membership is `SERVER_C_SHARED`, line 210). USER_Q is deliberately NOT added to any shared server.
- Cross-checked against the real SUT query (`apps/api/src/dm/dm.service.ts:679` `getDmCandidates`): candidates are gated by `inArray(alias.server_id, callerServerIds)`. USER_Q's exclusion is driven **solely** by this shared-server fence, not by the tier filter. If a refactor widened/removed the shared-server scope, USER_Q would leak (it passes the tier filter). The exclusion is therefore non-trivial and tests the right thing. Matches the case comment's stated intent exactly.

### 2. Positive assertion real? — YES.
- USER_P (`USER_P_SERVERMEMBERS_COMEMBER`) inserted with `'server-members'` (line 191) and given membership in `SERVER_C_SHARED` (line 211), the SAME server CALLER is a member of (line 210). Asserted `toContain` (line 218). Real co-member, real shared server, correct tier. `server-members` behaves like `everyone` under the SUT (only `nobody` is excluded) — assertion aligns with SUT semantics.

### 3. Fixture correctness — OK.
- IDs/UUIDs fresh and non-colliding: `SERVER_C_SHARED` (...0003) and `SERVER_C_DISJOINT` (...0004) extend the existing ...0001/...0002 series; user text-ids `dm-cand-p-sm-comember` / `dm-cand-q-sm-disjoint` are unique. No collision with cases (a)/(b) constants.
- FK order correct: users → servers (owner FK satisfied: `SERVER_C_SHARED` owned by CALLER, `SERVER_C_DISJOINT` owned by USER_Q, both pre-inserted) → memberships. Matches `insertFixtureUser`/`insertFixtureServer`/`insertFixtureMembership` signatures in `pg-harness.ts` (4th user param `whoCanDm` typed `'everyone' | 'server-members' | 'nobody'` — value passed is valid).
- Every fixture call is `await`ed; no missing await; final `await sut.getDmCandidates(CALLER)` awaited.
- Isolation: `beforeEach(truncateTables)` runs before every `it`, so no leakage between cases. CALLER is re-inserted within case (c) (self-contained), consistent with (a)/(b) pattern.
- Self-exclusion re-asserted (line 225), matching sibling cases.

### 4. Accidental production/schema change — NONE. (see Diff scope confirmation)

## Notes
- Head-builder-verified status corroborated: assertions match live SUT WHERE-clause semantics; the `server-members` tier is not separately encoded in the query (only `nobody` is filtered), so positive-leg equivalence to `everyone` is correct and intentional, per the case comment.
