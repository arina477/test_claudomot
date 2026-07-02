verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): the frame "write regression tests for the M7 privacy
  endpoints" is cause-appropriate at the artifact layer. The security boundary
  (profile-visibility roster hiding, data-export session-scoping) is currently proven
  ONLY by ephemeral T-8 live reproduction, which evaporates after the fixtures are torn
  down — so the missing durable regression protection IS the real gap, and writing the
  tests is the fix that closes it. There is a genuine deeper cause (wave-35 B-block should
  have authored these inline with the implementation, a build-discipline gap), but that
  cause has a SEPARATE fix — a promoted principle, not a reframe — and fixing it does not
  retroactively produce the missing tests. So antipattern #1 (symptom-masking) does NOT
  fire: the symptom-layer action has standalone, load-bearing value. Recommend L-2 capture
  the process observation ("author regression tests inline with the security-boundary code
  that motivates them; do not defer to a follow-up wave") for BUILD-PRINCIPLES promotion if
  it recurs.

  Wrong-layer check (the load-bearing finding): the seed already assigns the correct layer
  to each unit of work, and this must survive into P-2/P-3 intact. Verified against the code
  and the existing test harness:
    - Roster authz filter (servers.service.ts ~:253) → MUST be an integration test against
      real Postgres. The predicate is an in-memory `.filter(r => r.profileVisibility !==
      'nobody' || r.userId === userId)` applied to rows whose `profile_visibility` column and
      membership join come from the DB. A unit test that mocks `db.select()` to return canned
      rows would assert only that a JS array filter works — it proves nothing about the real
      column mapping, the join, or the enforced boundary. The project already has the correct
      harness: `apps/api/test/integration/pg-harness` + siblings (`rbac-assignments-authz.spec.ts`,
      `servers-member-gate.spec.ts`) insert real fixtures, and CI's `test` job runs a
      postgres:16 service container with `DATABASE_URL_TEST`. The new roster test belongs in
      `apps/api/test/integration/`, not as a mocked unit.
    - Data-export IDOR (account-data.service.ts) → the endpoint takes NO id param; userId is
      only ever `req.session.getUserId()`, and the query is scoped by `eq(users.id, userId)` /
      `eq(server_members.user_id, userId)`. The regression property is "response contains only
      the session user's data, and userId is never caller-supplied." Prove it at the
      contract/integration layer where the session supplies userId and the body is asserted to
      leak no other user's rows — NOT a unit test that injects userId directly (that only
      re-asserts the WHERE clause and misses the session-scoping guarantee).
    - toUiVisibility mapping, updatePrivacy, Sentry beforeSend scrub → genuinely pure/unit-level.
      Correct at unit.
    - invalid-enum → 400 → contract level on PrivacyController (Zod `safeParse`
      → BadRequestException). Correct.

  Test-theater / mock-the-SUT (checked, no verdict-changing match, but a live risk to pin):
  the single failure mode that would make this wave worthless is P-2/P-3 speccing the roster
  or export test with a mocked `db` — that would assert mocks and prove nothing about the
  authz boundary. The seed correctly says "integration (roster filter excludes nobody except
  self)"; the constraint below MUST be carried into the spec so it is not silently downgraded
  to a unit-with-mock.

  Bundle coherence (flag for P-1, not a defect): the three rows share a coherent theme
  (wave-35 V-1/V-2 follow-up debt, all under M7 launch-polish) and are already separate
  task rows (1 seed + 2 siblings) — this is the intended bundle shape, so no RESCOPE-AUTO-SPLIT.
  Noted for P-1 sizing: the three are heterogeneous in shape — 622a7bf3 is real ~1-wave
  test-authoring; b7feab30 is a 1-line cosmetic; 73e96a9d is NOT executable build work at all
  (it is a "when the notifications UI is built, apply the 113 states then" future spec-authoring
  note that resolves via a doc write / product-decisions entry or a deferral-acknowledgement,
  not code). P-1/P-2 should route 73e96a9d as a documentation/deferral note, not a build item.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
load_bearing_constraint: |
  Carry into P-2/P-3 spec as a hard AC-shape constraint: the roster-filter regression test
  and the data-export session-scoping test MUST run against real Postgres via the existing
  apps/api/test/integration/pg-harness (insert fixture users/memberships with varying
  profile_visibility; assert the boundary), NOT against a mocked `db`. Unit tests are correct
  ONLY for the pure functions (toUiVisibility, updatePrivacy, beforeSend scrub); the
  invalid-enum→400 is a controller contract test. Downgrading either authz test to a mocked
  unit is mock-the-SUT theater and fails the wave's purpose.
sibling_visible: false
