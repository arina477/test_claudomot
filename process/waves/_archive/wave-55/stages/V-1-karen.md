# V-1 Karen — source-claim verification (wave-55)

**Verdict: APPROVE**

Test-only wave. Merge `2565f43` (squash, PR #70) is an ancestor of `main`. All six load-bearing claims verified against the merged tree + CI log + live deploy. No production/schema change; the added integration case genuinely locks the `who_can_dm='server-members'` privacy fence.

---

## Claim-by-claim findings

### 1. Case (c) present with positive + negative assertions — TRUE
`apps/api/test/integration/dm-candidates.spec.ts:173` — `it('(c) who_can_dm=server-members: co-member in shared server is included, disjoint user is excluded', ...)`.
- Positive: `apps/api/test/integration/dm-candidates.spec.ts:213` — `expect(ids).toContain(USER_P_SERVERMEMBERS_COMEMBER)` (co-member with `who_can_dm='server-members'` in the shared server `SERVER_C_SHARED`).
- Negative: `apps/api/test/integration/dm-candidates.spec.ts:217` — `expect(ids).not.toContain(USER_Q_SERVERMEMBERS_DISJOINT)` (disjoint `server-members` user in `SERVER_C_DISJOINT`, no shared membership).
- Bonus self-exclusion assertion at `:220`. Both legs of the truth-table cell are present as specified.

### 2. Zero production/schema change in the merge — TRUE
`git show 2565f43 --stat`: the ONLY non-`process/` change is `apps/api/test/integration/dm-candidates.spec.ts` (+75). Every other path is `process/waves/...` (wave-54 archive move + wave-55 transcripts). No `src/`, no migration, no schema file touched. Spec-file-only, as claimed.

### 3. Negative fixture is non-vacuous — TRUE
The fixture helper `insertFixtureUser` (`apps/api/test/integration/pg-harness.ts:100-112`) has signature `(id, email, username?, whoCanDm='everyone')` and INSERTs `who_can_dm = $4`.
- `apps/api/test/integration/dm-candidates.spec.ts:193-198` — USER_Q is created with the 4th positional arg `'server-members'` → its `who_can_dm` is genuinely `'server-members'`, not the `'everyone'` default. Non-vacuous.
- Membership wiring (`:207-209`): CALLER + USER_P share `SERVER_C_SHARED`; USER_Q is a member ONLY of `SERVER_C_DISJOINT` (owned by USER_Q for FK satisfaction). The caller is never added to `SERVER_C_DISJOINT` — so the exclusion is caused by disjoint membership, not by a missing/wrong policy. The test would genuinely fail if the `inArray(callerServerIds)` fence were widened to skip the tier check.

### 4. Case (c) executed + passed on CI, deploy serves 2565f43 — TRUE
- CI run `28761913177` conclusion=`success` (7/7 jobs). CI log line: `✓ test/integration/dm-candidates.spec.ts > ... > (c) who_can_dm=server-members: co-member in shared server is included, disjoint user is excluded 78ms` — ran on real Postgres, 78ms, NOT skipped. Matches the C-1 deliverable claim exactly.
- Note (benign): run `28761913177` headSha is `75a0f81` (PR-branch head, pre-squash), not the merge SHA `2565f43` — expected for a squash-merge flow. Verified the branch tree carries identical case-(c) content (`git show 75a0f81:...spec.ts` grep-hits the case), so the CI-green artifact is the same code that merged.
- Live deploy: independent `curl https://api-production-b93e.up.railway.app/health` → **HTTP 200**, body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. C-2 deliverable pins both api+web at commit `2565f43` (SUCCESS). Test-only change → runtime identical; deploy is provenance/parity only.

### 5. `getDmCandidates` predicate unchanged — TRUE
`apps/api/src/dm/dm.service.ts:679-723` is the current predicate. Last commit touching `dm.service.ts` is `3835100` (wave prior); `2565f43` does NOT appear in that file's history → unchanged in the merge. The `where` clause (`:704-710`) fences on `inArray(server_members.server_id, callerServerIds)` + `ne(user_id, callerId)` + `ne(users.who_can_dm, 'nobody')`. This is exactly the behavior case (c) asserts: `'server-members'` is NOT in the excluded set (only `'nobody'` is), so a `server-members` user is included iff a server is shared — positive leg — and excluded iff disjoint — negative leg. Test and predicate are consistent; the test is a real lock, not a tautology.

### 6. node-specialist in AGENTS.md — TRUE
`command-center/AGENTS.md:84` — `| node-specialist | Node.js backend (NestJS) APIs, services, runtime | node / nestjs work | (pre-built — VoltAgent) |`. Registered; B-2 author is a legitimate catalog agent.

---

## Bullshit check
No red flags. This is an honest test-only wave: the reframe (positive-only → add the load-bearing negative) is real — the disjoint `server-members` exclusion was the untested cell, and the fixture proves it non-vacuously. Positive leg is arguably redundant with the existing `everyone` control, but it is harmless and makes the truth-table self-documenting. No coverage theater, no mock-the-SUT (real Postgres), no skip. APPROVE.

## Agent collaboration
- @jenny (V-1 parallel): confirm the spec's acceptance criteria (2-cell truth-table: co-member INCLUDED + disjoint EXCLUDED) map to the two assertions.
- @head-verifier (V-block gate): fold this APPROVE into the V-3 verdict; nothing to triage (V-2) — zero findings.
