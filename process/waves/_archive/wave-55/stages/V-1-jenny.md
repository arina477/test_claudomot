# V-1 Semantic-Spec Verification — jenny — wave-55

**Task:** `344eabde-bc21-4978-9473-d5b46b7276b1` — DM privacy `who_can_dm='server-members'` 2-cell truth-table integration coverage (test-only, M8 tail)
**Deployed head:** `2565f43` (merge #70) — HEAD `036fae3`
**Mode:** automatic
**Verdict: APPROVE**

---

## What "deployed" means for this wave

Test-only wave — no production or schema change. "Deployed behavior" for a real-Postgres integration test = the test **executing and passing on CI against the real Postgres 16 service**. That is the authoritative artifact here, and it is confirmed: run **28761913177**, `test` job `success`, case (c) ran **78ms green** (NOT skipped).

CI-log evidence (run 28761913177, `test` job):
```
✓ test/integration/dm-candidates.spec.ts > (a) excludes a co-member whose who_can_dm is "nobody"; includes the control everyone-user  78ms
✓ test/integration/dm-candidates.spec.ts > (b) does not expose a user who shares no server with the caller  92ms
✓ test/integration/dm-candidates.spec.ts > (c) who_can_dm=server-members: co-member in shared server is included, disjoint user is excluded  78ms
```
All 7 CI jobs green (secret-scan / lint / boot-probe / test / build / e2e / typecheck).

---

## AC-by-AC findings

**AC1 — positive: server-members co-member sharing SERVER_C_SHARED IS returned.** MET.
`dm-candidates.spec.ts` case (c) inserts `USER_P_SERVERMEMBERS_COMEMBER` with `who_can_dm='server-members'`, both CALLER and P as members of `SERVER_C_SHARED`, asserts `expect(ids).toContain(USER_P_SERVERMEMBERS_COMEMBER)`. Green on CI real-Postgres. The production predicate (`dm.service.ts:704-711`) is `ne(users.who_can_dm,'nobody')` under `inArray(server_id, callerServerIds)` — 'server-members' is admitted identically to 'everyone' when a server is shared. Assertion exercises exactly that.

**AC2 — negative: server-members user sharing NO server is EXCLUDED (load-bearing privacy fence).** MET.
Case (c) inserts `USER_Q_SERVERMEMBERS_DISJOINT` (`who_can_dm='server-members'`) as sole member of `SERVER_C_DISJOINT` (owned by Q, FK satisfied; caller not a member), asserts `expect(ids).not.toContain(USER_Q_SERVERMEMBERS_DISJOINT)`. This is the genuinely-untested cell: it locks the `inArray(callerServerIds)` scope for the `server-members` tier specifically. A future widening of the shared-server predicate that skipped the scope check would flip this assertion red. Green on CI. Self-exclusion (`not.toContain(CALLER)`) also asserted.

**AC3 — reuse pg-harness + insertFixtureUser 4th param; test-only, no prod/schema change.** MET.
Test imports `./pg-harness` first (CF-2 side-effect ordering) and reuses `insertFixtureUser`. Signature confirmed at `pg-harness.ts:100-110`: 4th param `whoCanDm: 'everyone' | 'server-members' | 'nobody' = 'everyone'`, INSERTed into `who_can_dm`. Case (c) calls `insertFixtureUser(id, email, undefined, 'server-members')` for both P and Q. Merge-commit diff is a single file, **`apps/api/test/integration/dm-candidates.spec.ts +75`** lines; zero non-test files under `apps/`, no migration, no schema edit. Production `getDmCandidates` + predicate unchanged.

**AC4 — existing cases (a)/(b) stay green; full suite green.** MET.
Cases (a) nobody-exclusion/everyone-control and (b) disjoint-isolation both green on the same CI run (78ms / 92ms). Full suite + all 7 CI jobs green. No regression.

---

## Semantics / spec-drift check (AC5 of the ask)

**No drift.** The tested semantics — `'server-members'` = DMable only by a member who shares at least one server — matches the shipped model exactly:
- Production query filters solely on `ne(who_can_dm,'nobody')` AND the shared-server scope. So for a caller who shares a server, `'server-members'` and `'everyone'` are behaviorally identical at the getDmCandidates layer; the differentiation for `'server-members'` is enforced by the shared-server scope itself. The test encodes precisely this: positive (shared → included) + negative (disjoint → excluded).
- Cross-checked against the sibling unit layer (`dm.service.spec.ts`, same CI run): "allows createConversation when target who_can_dm=server-members and they share a server" + "rejects ... NO shared server (403)" — consistent model.
- UI layer (`SettingsPrivacyPage.test.tsx`) maps `'server-members' → 'everyone'` for display ("absorbed into Visible"), consistent with the backend treating them identically for shared-server callers. No contradiction.

The P-0 REFRAME judgment holds: the negative cell is the load-bearing, previously-uncovered one; the positive cell is redundant with the existing 'everyone' control but harmless and completes the truth-table. Coverage now genuinely closes the documented gap — the third `who_can_dm` enum value (`'server-members'`) was the only tier with no real-Postgres integration assertion; it now has both legs.

---

## Verdict

**APPROVE.** All 6 ACs met against deployed (CI-green) behavior. Test-only scope confirmed (single +75-line test file, no production/schema change). Tested semantics match the shipped `who_can_dm` model with no drift. The `server-members` integration-layer gap is genuinely closed, including the load-bearing privacy-fence negative. No REJECT findings; no blocking issues for V-2.
