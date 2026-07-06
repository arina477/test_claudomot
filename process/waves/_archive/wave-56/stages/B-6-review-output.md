# B-6 Phase 2 — Production-Bug Review — wave-56 DM candidates LIMIT cap

- **Branch:** `wave-56-dm-candidates-limit` @ `577c452`
- **Diff:** `git diff main...HEAD` — 2 files, +66 / -2
  - `apps/api/src/dm/dm.service.ts`
  - `apps/api/test/integration/dm-candidates.spec.ts`
- **Verdict: CLEAN — no Critical / High / Medium findings.** One Low (pre-existing, informational) + one Nit.

---

## Hunt results

### 1. Correctness of the cap — CLEAN
`.limit(limit)` is chained after `.orderBy(users.id, asc(users.display_name))` on the
`selectDistinctOn([users.id], …)` query. In Postgres the DISTINCT ON dedup + ORDER BY
form the row-producing pipeline; LIMIT is applied as the final step **after** dedup and
sort. Therefore the cap bounds the *deduped* candidate count (one row per user), not raw
join rows, and does not alter dedup or ordering semantics. Correct variable (`limit`
param), no off-by-one — `.limit(n)` returns up to `n` rows inclusive, matching the
intended "≤ cap" contract.

### 2. Injectable param safety — CLEAN
- New `limit: number = DM_CANDIDATES_LIMIT` (500) is an optional 2nd positional arg.
- **Controller (`dm.controller.ts:171`) passes only `callerId`** — no 2nd arg, so the
  default 500 always applies on the HTTP path. `callerId` is read from the session
  (`req.session.getUserId()`), never a client param.
- The `limit` param is therefore **unreachable from untrusted input** — only tests /
  internal callers can set it. `.limit(0)` returning empty, or a negative value, is not
  reachable via any request surface. No validation needed at this layer (would be
  defensive-only; acceptable to omit given internal-only reachability).

### 3. Test genuinely bites (case d) — CLEAN, non-vacuous
- Topology: `SERVER_D_SHARED` holds `CALLER_D` + 3 co-members (`USER_D1/2/3`), all
  inserted via `insertFixtureUser` whose `who_can_dm` defaults to `'everyone'`
  (verified `pg-harness.ts:104`) → all 3 pass the `ne(who_can_dm,'nobody')` predicate.
- `getDmCandidates(CALLER_D, 2)` → asserts `length ≤ 2`. With 3 eligible co-members and
  cap=2 the DB truncates to 2 **before** the in-memory sort. Without `.limit()` the query
  returns 3 → assertion `3 ≤ 2` fails. **The test would fail if the fix were reverted** —
  genuinely bites, not vacuous.
- Second assertion `getDmCandidates(CALLER_D)` → `toHaveLength(3)` confirms the default
  500 cap leaves MVP-scale results intact (no regression to existing behaviour).
- Fresh non-colliding fixture IDs (`0002-…-000005`, `dm-cand-d-*`) — no overlap with
  cases a/b/c. Same `sut = new DmService(emitter)` binding and helper signatures as
  existing cases. `expect(DM_CANDIDATES_LIMIT).toBe(500)` exercises the export.

### 4. No regression / scope creep — CLEAN
Diff touches exactly the query builder (one `.limit()` line + one exported const + widened
signature) and the test file. **Predicate (`and/inArray/ne`), DTO mapping, DmCandidate
shape, schema, and controller are all unchanged.** No unrelated edits.

---

## Findings

### LOW (pre-existing; informational — not introduced by this diff, no action required)
**Truncation order ≠ output order under a biting cap.** The DB truncates in
`(users.id, display_name)` order, then the surviving rows are re-sorted by `displayName`
in memory (`.sort(localeCompare)` at line 730). So when the cap actually bites, the
returned set is "first N by user-id," *then* alphabetised — i.e. it is **not** the
alphabetically-first N candidates. This is inherent to applying LIMIT before an in-memory
re-sort and predates this change. It is harmless at the 500 default for MVP volumes (cap
never bites), and the cap's purpose is a defensive DoS bound, not a paginated/ranked view,
so the arbitrary selection under overflow is acceptable. Flagged only so it's on record if
`getDmCandidates` ever gains real pagination — at that point ordering should move fully
into SQL (add `display_name` to a top-level ORDER BY around the DISTINCT ON, or wrap in a
subquery) so LIMIT and output order agree.

### NIT
`DM_CANDIDATES_LIMIT = 500` is a bare magic number with no unit/rationale in code beyond
the comment. Fine as-is; if a config layer emerges later it could move there. No change
needed for this fix.

---

## Conclusion
The defensive cap is correct, safely bounded to internal callers, backed by a
non-vacuous test, and free of regression or scope creep. **Approve.** The single Low is
pre-existing and does not block.
