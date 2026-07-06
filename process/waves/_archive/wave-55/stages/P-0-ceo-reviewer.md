verdict: SELECTIVE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SELECTIVE-EXPANSION
mode_rationale: |
  The seed scope (one positive-control integration assertion for who_can_dm='server-members'
  on getDmCandidates) is sound and traces to a named differentiator, so this is NOT scope-reduction
  or drop. It is not HOLD-SCOPE either: a single cheap addition — the matching NEGATIVE control
  (a NON-co-member with who_can_dm='server-members' is EXCLUDED from getDmCandidates) — multiplies
  the value disproportionately, converting "we proved the list returns the right person" into
  "we proved the list blocks the wrong person," which is what actually certifies a privacy fence.
  It is not full SCOPE-EXPANSION because it adds no new wave/milestone scope and no new surface —
  it is one assertion in the same pg-harness, same topology, same wave. Exactly the SELECTIVE-EXPANSION
  bar: one highest-leverage cheap-but-disproportionate addition, not several.
bet_traced_to: "Academic tools + offline-first win students from Discord (ad1a3685) — the bet names Discord's 'weak privacy posture' as a wedge; who-can-DM is the privacy-control differentiator surface. The falsifier turns on students not moving off Discord for the academic/privacy wedge; a proven privacy boundary is load-bearing to that wedge's credibility."
milestone_traced_to: "84e17739-af5e-4396-beb9-b6f3d6836fc4 — M8 Educator tools & deeper academics (in_progress). Seed task carries this milestone_id; the DM/privacy scope is in M8's ## Scope ('direct messages + group DMs') and success metric ('students hold private 1:1 conversations')."
proposed_scope_change: |
  Hold the seed's positive-control assertion (co-member with who_can_dm='server-members' sharing a
  server IS returned by getDmCandidates) AND add ONE sibling assertion in the same integration spec:
  a user with who_can_dm='server-members' who does NOT share a server with the caller is EXCLUDED
  from getDmCandidates. Rationale for this specific addition over any other:
    - The unit layer already proves BOTH sides for createConversation (included at
      dm.service.spec.ts:203, excluded/403 at :238) + a wave-47 T-8 pen-test. The getDmCandidates
      READ path (the candidate-list surface a student actually sees) has NEITHER side at the
      integration layer for this enum value. Shipping only the positive control leaves the READ path
      asymmetric with the fence it is supposed to express — it proves inclusion but never proves
      exclusion on the exact code path (dm.service.ts:706 predicate) the task cites.
    - Cost is near-zero: same real-Postgres harness, same insertFixtureUser 4th-param mechanic,
      one additional fixture user with no shared-server row + one negative assertion. No production
      code, no schema change, no new wave.
    - Value is disproportionate: a privacy control's worth is entirely in what it BLOCKS. The negative
      integration control is the assertion that would catch a future regression widening the
      candidate predicate (e.g. someone loosening the shared-server join) — the positive control alone
      would stay green through exactly that leak.
  This is a SELECTIVE addition, not a rewrite: do NOT expand into re-testing 'nobody'/'everyone' at
  new layers, LMS/grading, group-DM privacy matrices, or a wave-wide truth-table sweep — those are
  over-scoping a LOW-tier coverage item. One negative sibling assertion is the whole recommendation.
strategic_risk: |
  1. RIGHT USE OF A WAVE — yes, marginally, WITH the expansion; borderline without it. As a lone
     single positive-control assertion this is a genuine 'real item that barely matters' candidate
     (LOW, non-blocking, the boundary is already proven at the unit + pen-test layers). What rescues
     it from near-DROP is that (a) I flagged it HIGH at wave-54 for a real reason — it is the last
     uncovered enum corner on a NAMED differentiator surface — and (b) the negative-control addition
     turns a cosmetic coverage-corner into an actual regression fence on the privacy predicate. Ship
     it as the SELECTIVE-EXPANSION version, not the timid single-assertion version.
  2. M8-TAIL vs M9 — the more important strategic signal: the M8 tail (7 open) contains ZERO unshipped
     M8 FEATURE scope. It is 2 pure test-debt items (typing-label unit test f8eb49c1, delete-message
     E2E hardening a1dda389) + 4 DM-polish items (off-token surfaces 5bcbd27f, throttle/backoff
     reconcile 874bd233, large-server pagination c5051444, nav-return fix ff09c4c9) + this coverage
     corner. The M8 success metric (teacher side live + private 1:1/group DMs, real-time + offline-
     tolerant) is substantively MET — DMs, educator roles, assignment collect/return, scheduling,
     study-group tools all shipped across waves 46–54. Grinding the full DM-coverage/polish tail to
     zero before M9 is NOT clearly the right focus; it risks the exact 'polished version of something
     nobody needed' failure mode. Recommendation carried forward (not this wave's verdict to execute):
     the loop should drain only the HIGH-leverage tail items (this privacy fence; the large-server
     pagination c5051444 has real correctness value at scale) and treat the remaining low-tier polish
     (off-token cosmetics, typing-label unit test) as fold-in debt, then let N-1 weigh promoting M9
     (Monetization) soon — the differentiator wedge is proven enough that continued DM-micro-polish
     has sharply diminishing bet value. Flagging for head-product / N-1 milestone-disposition, not
     for action inside this test-only wave.
  No strategic conflict beyond my authority — not an ESCALATE.
sibling_visible: false
