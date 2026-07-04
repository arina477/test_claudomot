verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  _TBD by founder_
  (M8 ## Success metric prose section is literally "_TBD by founder_" — no
  measurable success target has been authored. Confirmed via
  SELECT description FROM milestones WHERE id='84e17739-…'.)
mvp_critical_status: |
  no mvp-critical scope declared yet — M8 has no defined success metric, so no
  mvp-critical AC floor exists to trace against. Separately: M8's founder-named
  CORE (educator role + light moderation [w41], assignment collect/return [w42],
  class scheduling [w43]) is already SHIPPED. This wave-44 bundle is NOT new
  feature scope — it is 6 pre-triaged V-2/T-6 follow-ups (debt/hardening) on that
  already-shipped core.

ok_rationale: |
  Thinness analysis is not runnable here for two independent reasons, either of
  which alone forces OK:

  (1) METRIC UNDEFINED (contract hard rule). The trace test — "if this AC were
  absent, would the milestone's ## Success metric still be satisfiable?" — has no
  referent because M8's ## Success metric is "_TBD by founder_". Per the
  never-improvise-the-metric hard rule, I cannot manufacture a metric to peel ACs
  against. This is the same posture returned at waves 41/42/43 under this same
  milestone. See flag_metric_undefined below.

  (2) NOT A FEATURE-SCOPE WAVE. All 6 items are already-triaged DEBT (a 1024px
  responsive/a11y defect, UI cosmetics, a stale-comment cleanup, unit + integration
  test-coverage backfill, a muted-indicator padding fix, a two-client E2E, and a
  createdAt/updatedAt DTO addition) against SHIPPED M8 features. There is no new
  user-visible mvp-critical claim to thin. "Which ACs could defer to a sibling
  without breaking the mvp-critical claim" is N/A — there is no such claim in this
  wave. Deferring any of these does not endanger a milestone metric; it only leaves
  known debt un-cleared. That is a P-1 sizing / N-1 sequencing concern, not a
  thinness peel.

  Bundle structure verified in DB: seed 8e54799a (parent NULL) + 5 siblings
  (683fec9b, 8d971bc2, 8828484f, ca43eb12, 0308cdf1) all parent_task_id=8e54799a,
  wave_id=NULL, status=todo, milestone_id=M8 — correctly re-homed per the
  2026-07-04 product-decisions "bundle re-homed" entry. No mis-parenting.

flag_metric_undefined: true

floor_constraint_active: false
floor_constraint_detail: |
  N/A — no THIN was proposed, so no floor pre-check applies. (Floor-awareness is
  moot when the wave carries no thinnable feature ACs.)

# NON-BINDING coherence/dependency note for head-product + P-1 (NOT a thinness split)
coherence_note: |
  Two of the six items carry an EXTERNAL BLOCKER on their test-build path, per
  their DB descriptions. This is a buildability/coherence flag for P-1, NOT a
  thinness re-classification (I am not proposing a sibling split):

  - ca43eb12 (delete-any-message UI E2E + second-client fan-out): its own
    description says "author a Playwright two-client spec once fixture-B is
    usable (see the fixture-B task)." The E2E requires a non-organizer /
    second-client fixture that may not exist yet. Backend behavior is already
    proven at T-4 (real-PG) and T-8 (live pen-test) — this is coverage-only.

  - 8d971bc2 (assignment-submission test coverage): part (1) unit tests are
    buildable now; but part (2) — the attachment presign→upload→submit
    INTEGRATION path — is explicitly blocked: "the CI test env has no S3/Tigris
    creds … Add attachment integration coverage once test-env storage creds
    exist." Text-only submission coverage is buildable now; the attachment
    integration half is credential-blocked.

  Recommendation to head-product / P-1 (their call, not mine): decide at P-1
  whether the fixture-B-blocked E2E (ca43eb12) and the S3-cred-blocked attachment
  integration half of 8d971bc2 are BUILDABLE THIS WAVE. If the fixture / creds are
  not available, those specific ACs should be scoped as "buildable subset now +
  blocked remainder deferred" (or the blocked item held) so wave-44 does not carry
  an un-buildable AC into B-block. This is a dependency/sequencing matter for P-1's
  RESCOPE lane, NOT an mvp-thinness peel — I make no sibling-split proposal.

sibling_visible: false
