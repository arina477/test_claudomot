verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Framing is sound on all four axes. (1) The publish write-half is the correct completion
  of M11's directory: wave-67 shipped the READ path + is_public/description/topic columns but
  no WRITE path, so /servers/discover is permanently empty — this is cause-layer, not symptom-layer.
  (2) Owner-authz is correctly required and grounded in existing idiom: the codebase already gates
  owner-only actions via `server.owner_id !== callerId -> ForbiddenException` (servers.service.ts
  lines 368/408 for invite revoke/rotate), and a richer RBAC `manage_server` permission flag exists
  (roles table) used by moderation/message-delete — so an owner-only OR owner+manage_server gate is a
  reuse of established patterns, not a new abstraction. (3) The memberCount:0 fix pairs naturally —
  it is a wrong-test-layer defect (unit test MOCKS memberCount, so the real correlated subquery never
  runs; fix + live-DB test); the live-DB test needs real public servers, which this bundle's publish
  path creates. (4) Moderation deferral is deliberate and documented (product-decisions line 732 defers
  moderation/safety on public join to later M11 bundles) — moderation-before-public-LAUNCH, not before
  this build; not a framing gap for THIS wave.
symptom_vs_cause_check: |
  RAN (mandatory). Both parts are cause-layer, not symptom-layer.
  - Publish write-half: the symptom is "directory always empty"; the cause is "no write path to set
    is_public=true". The task fixes the cause (owner-gated PATCH toggling is_public), not the symptom.
  - memberCount:0: the symptom is "counts show 0 in the UI"; the cause is a Drizzle correlated-subquery
    runtime binding issue masked by a unit test that mocks the value. The task fixes the cause (rework
    the query to LEFT JOIN + GROUP BY) AND closes the masking gap (live-DB test on the real subquery).
    This is the correct layer for both the fix and the test.
authz_confirmation: |
  CONFIRMED. The framing requires server-side owner-gating on the PATCH, and the codebase supplies the
  exact idiom to reuse (owner_id equality check -> ForbiddenException; optionally broadened to the
  manage_server RBAC flag). is_public stays default-false (opt-in). A regular member must NOT be able
  to publish — this is a hard acceptance criterion the spec (P-2) must carry; note for P-2/P-3: the
  owner-gate belongs in the SERVICE layer (authorization is enforced server-side, mirroring
  invite-rotate/revoke), not merely hidden in the UI. Publishing exposes a server to a PUBLIC directory,
  so this gate is load-bearing, not cosmetic.
bundling_check: |
  SOUND to bundle. The two parts are coupled by a real data dependency, not "while we're in there"
  scope creep (not antipattern #5): the publish path is what populates the directory, and the
  memberCount live-DB test requires real published servers to exist. Shipping them together makes the
  counts correct + genuinely tested at the same moment they become user-visible.
proposed_reframe: |
  (none — PROCEED)
escalation_reason: |
  (none — PROCEED)
sibling_visible: false
notes: |
  Endpoint shape (PATCH /servers/:id vs dedicated /publish): PATCH /servers/:id is the right shape —
  it reuses the standard server-mutation surface for is_public + description + topic together, avoiding
  a single-purpose /publish endpoint. No new endpoint exists yet (grep-confirmed: controller has
  Post/Get only, no Patch/Put on :id), so this is a clean addition, not a rename/shim (not antipattern #8).
  design/server-settings.html carries a SUPERSEDED-roles-tab warning (its Roles tab uses a forbidden
  permission matrix); the Overview shell is valid prior art for the settings surface. This is a
  D-block/P-2 implementation note, not a framing defect.
