verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [3]
reasoning: |
  Symptom-vs-cause check: the seed frames this as "missing integration COVERAGE
  of a proven fence" but verification against dm.service.ts:704-711 and
  dm-candidates.spec.ts shows the real gap is an unverified BEHAVIOR, not a
  coverage corner. The predicate is and(inArray(callerServerIds), ne(user_id,
  caller), ne(who_can_dm,'nobody')) — it treats 'server-members' and 'everyone'
  IDENTICALLY. The seed's proposed single positive-control assertion (co-member
  with 'server-members' IS returned) proves nothing beyond what test (a)'s
  existing everyone-control already proves about that same predicate; it is a
  demo-path/happy-path assertion (antipattern #3). The behavior that is actually
  the differentiator of the 'server-members' privacy tier — a 'server-members'
  user who shares NO server MUST be excluded — is exercised today only
  incidentally by test (b), and (b) uses a DEFAULT who_can_dm user, not a
  'server-members' user, so the 'server-members'-specific negative is untested.
  Secondary factual correction: the seed's provenance ("wave-46/47 proved it,
  last corner", "closes coverage") is inaccurate — the live suite is wave-48
  (task 03ccf636) and already covers nobody-exclusion + disjoint-isolation, not
  wave-46/47. The gap is real; the framing of what it is and why it matters is
  wrong. Right size is the full 'server-members' truth-table, not one assertion.
proposed_reframe: |
  Reframe from "add one positive-control assertion that a 'server-members'
  co-member is included" to "assert the 'server-members' privacy-tier truth-table
  at the integration layer, both cells":
    (c1) POSITIVE: a co-member with who_can_dm='server-members' sharing a server
         with the caller IS returned by getDmCandidates(caller).
    (c2) NEGATIVE (the load-bearing one): a user with who_can_dm='server-members'
         who shares NO server with the caller is NOT returned — proving the tier
         is scoped to shared-server membership and not leaking to the whole app.
  Both reuse the existing pg-harness (insertFixtureUser with who_can_dm=
  'server-members', insertFixtureServer/Membership) and the disjoint-server
  topology already established in test (b). Still test-only, no production or
  schema change. This closes the tier's behavior contract rather than restating
  the predicate the everyone-control already covers. Sizing stays a single
  bundle (2 assertions in one spec block); does NOT trigger RESCOPE-AUTO-SPLIT.
escalation_reason: |
  n/a
sibling_visible: false
