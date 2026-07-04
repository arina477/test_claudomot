verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  A class cohort runs coursework end-to-end in StudyHall without falling back to Discord:
  the teacher side is live (roles, assignment collect/return, scheduling) AND students can
  hold private 1:1 and small-group conversations outside class channels — real-time and
  offline-tolerant. First slice: direct + group messages.
mvp_critical_status: |
  N of M still pending — M8 in_progress; DM slice shipped through waves 45-47 (schema,
  fan-out, UI, offline send, candidate privacy fence live-active). Teacher-side scope
  (roles, assignment collect/return, scheduling), study-group tools, and message search
  remain unbuilt. wave-48 is the first hardening/coverage wave over the just-shipped DM
  slice, not new mvp-critical scope.

ok_rationale: |
  Single test-only task with one indivisible AC — add integration-level negative-case
  coverage that live-exercises the two DM candidate-privacy counter-example controls
  (who_can_dm='nobody' co-member excluded; disjoint non-co-member hidden) against a real
  query, via one fixture (co-member with who_can_dm='nobody' + disjoint non-co-member) and
  two absence assertions on GET /dm/candidates. This AC traces to the milestone success
  metric's "private 1:1 and small-group conversations outside class channels": the candidate
  fence is the trust boundary that keeps DMs restricted to the shared-server academic graph;
  an unverified counter-example control is a latent leak of that boundary. The AC is already
  the smallest coherent slice — a single privacy negative-case (one fixture + two assertions)
  cannot be split into sibling tasks without splitting a single assertion pair, which is not a
  meaningful thinness peel. Nothing here builds depth on an unshipped surface, polish ahead of
  demand, or extensibility ahead of need: the fence shipped wave-47, the harness
  (pg-harness.ts insertFixtureUser/Server/Membership + presence-comembers.spec.ts) already
  exists and is reused as-is, and the only new production-adjacent change is a trivial
  who_can_dm param on insertFixtureUser (test fixture helper, not a feature).
floor_constraint_active: false
floor_constraint_detail: |
  n/a — no THIN was contemplated, so no floor pre-check was needed. Test code is inherently
  sub-floor (wave-16 test-exemption precedent) and P-1 owns floor/size; a test-only
  regression-protection task legitimately sits below the LOC floor and is not an OVER-CUT
  because it closes a provable coverage hole on a live privacy boundary.

scope_fence_confirmed: true
scope_fence_detail: |
  In-scope for this AC (keep): (1) trivial who_can_dm param on insertFixtureUser; (2) one
  fixture with a who_can_dm='nobody' co-member + a disjoint non-co-member on a non-shared
  server; (3) two assertions that BOTH are absent from GET /dm/candidates. Explicitly OUT of
  this AC and correctly NOT pulled in — each is a separately-seedable M8 sibling
  (milestone_id=84e17739, wave_id=NULL) confirmed present in the task table and endorsed as
  independent by wave-47 N-2 / product-decisions:
    - c5051444 — getDmCandidates LIMIT/pagination (flagged premature-at-zero-users by
      realist + counter-thinker; leave independently seedable, do NOT bundle).
    - 5bcbd27f — DM off-token surface substitutions / picker restriction UI (separate task).
    - Not rebuilding the integration harness; not adding unrelated DM tests (typing-label
      f8eb49c1, delete-any E2E a1dda389, throttle 874bd233, sidebar-column 39fc1c5e are all
      distinct siblings, not part of this AC).
  No new ACs proposed (that is ceo-reviewer's lane; ceo-reviewer independently returned
  PROCEED / HOLD-SCOPE). No cross-milestone move. No wave-size change (that is P-1's authority).

sibling_visible: false
