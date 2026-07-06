```yaml
verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [4]
reasoning: |
  Symptom-vs-cause check (mandatory): the seed's symptom is "unbounded query
  could blow up at large-server scale"; the CAUSE is a missing safety bound on a
  query with no upper limit. Verified getDmCandidates (dm.service.ts:679-723) is
  genuinely unbounded — selectDistinctOn over inArray(server_id, callerServerIds)
  with ne(user_id, caller) and ne(who_can_dm,'nobody'), no .limit(), no cursor,
  final in-memory .sort(). The unbounded query IS a real latent correctness bug
  worth a cheap cap. BUT the seed conflates two very different fixes: (a) a
  defensive LIMIT (cause-layer safety, no UX change, always-safe) and (b) full
  cursor/pagination + a "load more" UI affordance. (b) is antipattern #4 —
  premature abstraction / pagination-UX at zero users, which is precisely what
  the wave-47 scope fence deliberately deferred and which the seed's OWN prose
  says "Do NOT pull into a small fix." Shipping (b) now builds pagination
  machinery for a scale that does not exist; shipping only (a) closes the real
  correctness gap cheaply and leaves the fence intact.
proposed_reframe: |
  Narrow the wave to the cause-layer safety cap only, NOT pagination:

  - Add a defensive server-side LIMIT to getDmCandidates (a bounded cap on
    candidates returned, sized generously above any realistic MVP co-member
    count — e.g. a few hundred). Apply it in-query (.limit(...)) before the
    in-memory sort so the bound is enforced at the DB, not after fetch.
  - Do NOT add a cursor, "load more" affordance, offset param, or any
    pagination UX. Those stay scope-fenced per wave-47 (mvp-thinner /
    counter-thinker "premature-at-zero-users") until a real large-server
    scaling wave lands with actual usage data forcing it.
  - Frame the AC as "candidate list cannot return an unbounded result set"
    (correctness/safety), not "users can page through candidates" (feature).
  - The ceo-reviewer's "high-leverage scale-correctness" read is satisfied by
    the LIMIT alone; the leverage is the unbounded-query cap, not the pagination.

  This is the smallest coherent slice that fixes the genuine defect while
  honoring the deliberate deferral. It is a real (if tiny) build, not a no-op,
  so it does not trip the mvp-thinner floor.
escalation_reason: |
  n/a
sibling_visible: false
```

## Verification notes (evidence)

- Read `apps/api/src/dm/dm.service.ts:679-723`. `getDmCandidates(callerId)` is
  **confirmed unbounded**: Step 1 fetches caller's server IDs; Step 2 runs
  `db.selectDistinctOn([users.id], {...}).from(server_members).innerJoin(users)
  .where(and(inArray(server_id, callerServerIds), ne(user_id, callerId),
  ne(who_can_dm,'nobody'))).orderBy(users.id, asc(display_name))`. There is
  **no `.limit()`, no cursor/offset param, no keyset** anywhere in the method.
  The final `.sort()` is an in-memory pass over the full result set.
- Therefore the seed's factual premise ("no LIMIT or pagination") is TRUE
  (satisfies PRODUCT-PRINCIPLES rules 1 + 2: the named entity is the real
  output boundary and the absence claim is verified).
- The tension is not factual, it is scope: the *defect* (unbounded query) is
  real and cheap to cap; the *proposed fix* (cursor + pagination UI) overshoots
  into fence-deferred territory. REFRAME resolves it by keeping the cheap
  correctness cap and dropping the pagination-UX.

## Note for merge (head-product)

The reframe is deliberately compatible with ceo-reviewer's "high-leverage"
call — it does not reject the wave, it right-sizes it. If ceo-reviewer instead
argues the whole item should stay deferred (no wave at all, pivot to the M9
Monetization decision), that is a strategic-value question in ceo-reviewer's
lane, not mine; head-product mediates. My verdict only asserts: IF this ships,
it ships as a LIMIT-only safety cap, not pagination.
