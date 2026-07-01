verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
# Considered-but-averted (latent in stale wave-14 head prose, neutralized by the
# wave-17/18 self-corrections already in the DB description): #1 symptom-vs-cause,
# #2 wrong-layer, #4 premature-abstraction/gold-plating. None FIRE as defects
# because the operative framing is already correct — see reasoning.

reasoning: |
  Symptom-vs-cause (mandatory): the seed's stated symptom is "integration tests
  mock the DB so co-member resolution + member-gate are not exercised against real
  Postgres." Candidate cause A ("no real-PG test tier exists") is FALSE — verified
  the tier exists. Candidate cause B ("the integration tier is THIN — only
  create-server-rollback consumes the harness; presence co-member, servers
  member-gate, message_mentions, and wave-23 rbac/assignments have no real-DB
  spec") is TRUE. Correct layer = add new integration SPECS consuming the existing
  wave-17 harness; wrong layer = build a new docker/testcontainers tier.

  Critically, the full DB description ALREADY carries the correct framing. The
  premise-verification premise (that this might be framed as a greenfield rebuild)
  does NOT hold against the operative task: the wave-17 V-2 appendix in the same
  description reads verbatim "PARTIALLY MITIGATED: wave-17 built a reusable real-PG
  test harness (apps/api/test/integration/pg-harness.ts ...). This task becomes a
  THIN CONSUMER of that harness (extend it to cover presence/services methods)
  rather than a from-scratch build." Only the stale wave-14 HEAD paragraph still
  reads "Suggested: a docker/ephemeral Postgres test tier (or testcontainers)."
  Because the operative framing self-corrects, this is PROCEED-with-restated-frame,
  not REFRAME (REFRAME would apply only if the operative task said "build greenfield"
  — it does not). Antipatterns #1/#2/#4 are latent in the stale head prose but
  neutralized; the only residual risk is a downstream P-2/P-3 reader anchoring on
  the first paragraph and rebuilding the tier — the restated framing below closes
  that.

  Harness verified in repo (all three pieces exist AND explicitly name this task as
  their intended second consumer):
  - apps/api/test/integration/pg-harness.ts — reusable real-PG harness; CF-2
    DATABASE_URL→DATABASE_URL_TEST redirect at module-eval, drizzle migrate,
    truncate/fixture/countRows/teardown helpers, separate harness pool. Docstring
    line 14 names "Additional integration specs (task 02fa8011, wave-17+)".
  - apps/api/test/integration/create-server-rollback.spec.ts — the first and only
    consumer (commit-all + mid-txn-rollback + first-insert-rollback via
    pool.connect fault injection).
  - apps/api/vitest.integration.config.ts — fileParallelism:false + singleFork
    serial; docstring explicitly built to stay safe "the moment a second
    integration spec lands (task 02fa8011+)".

  Value lens (ceo-reviewer owns the call; no framing objection from me): 0 users, so
  this is regression-safety/confidence, not user-facing value — but it recurs across
  waves 14/15/17/18/23, marginal cost is low (thin consumer; CI already runs a
  postgres:16 service), and it hardens AUTHZ surfaces (member-gate, rbac/assignments)
  where mock-the-DB integration tests give false confidence. No framing reason to
  block.

proposed_reframe: |
  (Not a REFRAME verdict — the operative DB framing is already correct. Restated
  here so downstream P-1/P-2/P-3 do NOT anchor on the stale wave-14 head paragraph.)

  Do NOT build a new test tier. Do NOT add docker-compose or testcontainers. The
  real-PG integration tier already exists (pg-harness.ts + vitest.integration.config.ts,
  wave-17; CI runs it against a postgres:16 service). This wave EXTENDS that harness
  with new *.spec.ts files under apps/api/test/integration/ that exercise the
  currently-thin surfaces against real Postgres:
    - presence.service co-member resolution queries
    - servers.service member-gate (GET /servers/:id/members)
    - (candidates, subject to P-1 sizing) message_mentions resolution / my-mentions
      authz; createReply atomicity/rollback (thread reply_count++ + last_reply_at
      in-txn, idempotent-retry no-double-count); wave-23 F23-T-4 rbac/assignments
      authz surface.
  Follow the harness contract when adding specs: pg-harness MUST be the first import
  (CF-2 side effect), keep describe.skipIf(!DATABASE_URL_TEST) so local-without-PG
  skips-with-reason, and rely on truncate-between-cases (serial config already
  guarantees isolation).

# --- Scope note for P-1 (NOT a RESCOPE-AUTO-SPLIT verdict) ---
# The description has accreted 4-5 distinct integration-spec surfaces across waves
# (F-3 presence co-member + member-gate; wave-15 message_mentions/my-mentions;
# wave-18 createReply atomicity; prompt adds wave-23 rbac/assignments). This is a
# SIZING question, not a coupling defect: every surface is the SAME kind of change
# (add one real-PG spec to the SAME existing harness) — cohesive, not
# coupled-unrelated, so antipattern #5 does NOT fire. P-1 owns deciding how many
# specs fit one wave vs. sibling-out. Framing recommendation: the original F-3 pair
# (presence co-member + servers member-gate) is the mvp-critical core; rbac/
# assignments (F23-T-4) and the wave-18 createReply spec are natural but
# independently-sliceable follow-ons. P-1 to size.

escalation_reason: |
  (n/a — not an ESCALATE verdict)

sibling_visible: false
