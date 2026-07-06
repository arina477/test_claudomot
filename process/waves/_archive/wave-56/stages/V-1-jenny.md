# V-1 Semantic-Spec Verification — jenny (wave-56)

**Task:** c5051444-318f-4a90-a79a-947b4452e42f — getDmCandidates defensive LIMIT
**Deployed:** efc1a47 (ancestor of HEAD 4ac7010, verified via `git merge-base --is-ancestor`)
**Mode:** automatic
**Verdict: APPROVE**

Spec-vs-implementation traced independently against the DB spec-contract (SoT) and the shipped code at `apps/api/src/dm/dm.service.ts`. All four ACs met; no spec drift; privacy fence and DM-candidates contract intact.

---

## AC-by-AC

### AC1 — server-side LIMIT in-query, after orderBy, before in-memory sort — MET
`dm.service.ts:703-721`: the Drizzle query chain is `.selectDistinctOn(...) → .innerJoin → .where(...) → .orderBy(users.id, asc(users.display_name)) → .limit(limit)`. The `.limit()` is applied to the DB query (bounded server-side), positioned **after** `.orderBy` and **before** the in-memory `.sort()` at `dm.service.ts:730`. Named constant `DM_CANDIDATES_LIMIT = 500` exported at `dm.service.ts:83`. Injectable via optional 2nd param `limit: number = DM_CANDIDATES_LIMIT` (`dm.service.ts:685-688`). The fetched set can never be unbounded regardless of server size. Case (d) on CI real-Postgres (run 28763433748, 69ms) proves the cap fires.

### AC2 — MVP-scale (< CAP) identical to today; cases (a)/(b)/(c) stay green — MET
Controller call site `dm.controller.ts:171` invokes `getDmCandidates(callerId)` with **no limit arg** → production always uses the 500 default. At MVP volumes (co-members << 500) the returned list is byte-identical to prior behavior (all eligible co-members, name-sorted). Case (d) default-cap leg asserts `uncapped` returns all 3 (`dm-candidates.spec.ts:273-274`). Cases (a) nobody-exclusion, (b) disjoint-isolation, (c) server-members truth-table remain in the suite unchanged (`dm-candidates.spec.ts:112-235`) — no regression.

### AC3 — bound proven by a non-vacuous test — MET
Case (d) (`dm-candidates.spec.ts:252-280`) is a genuine bite, not a vacuous query-shape assertion: 3 eligible co-members (all `who_can_dm='everyone'`), injected cap=2. `getDmCandidates(CALLER_D, 2)` asserts `length ≤ 2` AND `length > 0` — if `.limit()` were absent the DB returns 3 and the ≤2 assertion fails. The truncation happens in-DB before the in-memory sort sees the rows. Confirmed EXECUTED+PASSED on CI real-Postgres (`(d) injected cap of 2 truncates 3 eligible co-members; default cap leaves all 3 intact`).

### AC4 — who_can_dm predicate + DmCandidate DTO UNCHANGED; no cursor/pagination/UX — MET
- **DTO unchanged:** `git show efc1a47 -- packages/shared/src/dm.ts` returns empty — `DmCandidateSchema` (`dm.ts:171-176`: `{userId, displayName, avatarUrl}`) untouched.
- **Predicate unchanged:** `ne(users.who_can_dm, 'nobody')` at `dm.service.ts:717` is on the unchanged side of the diff; only the trailing `.limit(limit)` was appended after it (`dm.service.ts:721`). The WHERE fence (`inArray(callerServerIds)` + `ne(user_id, callerId)` + `ne(who_can_dm, 'nobody')`) is identical.
- **No cursor/pagination/load-more/typeahead/ranking:** production diff is a single exported constant + one optional param + one `.limit()` call. Nothing added toward the deferred seed 999a14d1.

---

## Spec-drift check (AC5 of the verify prompt)
None. The cap is a pure upper bound on row-count. It does not touch:
- **Privacy fence:** the three WHERE predicates (server-scope, self-exclusion, nobody-exclusion) are byte-identical; cases (a)/(b)/(c) still enforce them against real rows.
- **DM-candidates contract:** signature `getDmCandidates(callerId)` from the controller's view is unchanged (limit is an optional server-internal param the controller does not pass); response remains bare `DmCandidate[]`; DTO shape identical.

The only theoretical behavioral change is at >500 eligible co-members (impossible at StudyHall's current zero-user scale, and correctly deferred to 999a14d1 for the real scaling wave per the P-0 reframe). Ranking-under-truncation is explicitly deferred (AC-B), consistent with the spec's edge-case note "> CAP eligible: at most CAP returned (bounded; ranking deferred to AC-B)".

**Production diff footprint (efc1a47):** `dm.service.ts` +14/-5 (constant + param + limit call only), `dm-candidates.spec.ts` +54 (case d), zero changes to controller / DTO / schema / privacy service. Scope discipline is exemplary — matches the LOW correctness-hygiene reframe exactly.

**Verdict: APPROVE** — all 4 ACs met with independent code evidence; no spec drift; privacy fence and contract preserved.
