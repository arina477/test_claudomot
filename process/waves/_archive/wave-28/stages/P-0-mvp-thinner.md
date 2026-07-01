verdict: OK
verdict_source: mvp-thinner
milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
milestone_title: M5 — Academic tooling: assignments
milestone_class: product-feature
milestone_success_metric: |
  An organizer posts an assignment with a due date; members see it alongside chat,
  mark it done, and get a reminder before it is due.
mvp_critical_status: |
  M5 mvp-critical scope (the assignment module: post/view/mark-done + due-date reminders)
  is PARTIALLY shipped — CRUD + status spine + panel/primitive + tests are done; the
  reminder arc (cron + NotificationsModule + Resend) remains cred-blocked on a founder
  Resend API key (surfaced as a park-or-key founder fork, waves 25–27). This seed task
  (d058283d, invite-code rotation) is NOT part of M5's mvp-critical assignment scope —
  it is re-homed M3-era server-security debt (product-decisions 2026-06-30: "independent
  backlog under M5, NOT the M5 assignments feature scope"). So there is no M5-mvp-critical
  set for this wave's AC to be peeled away from.

ok_rationale: |
  The seed is a single atomic endpoint — POST /servers/:id/invite-code/rotate — whose one
  AC cluster (owner-gate via AuthGuard + RBAC → regenerate CSPRNG servers.invite_code →
  invalidate the old link) is inseparable: a partial rotate is not shippable (regenerating
  without owner-gating is a security hole; owner-gating without invalidating the old code
  does nothing). It reuses the already-shipped locked-CSPRNG + 23505-retry pattern, so
  there is no bundled schema/migration/UI concern to split. Consistent framing since
  wave-9 (product-decisions lines 158–159): never scoped with rate-limiting, audit-logging,
  or a client button. Nothing to re-classify into siblings; the wave is atomic and
  correctly sized as one AC.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — OK was emitted on atomicity grounds, not floor-blockage. (Note: this seed is
  inherently sub-floor at ~120–200 LOC single-spec; the standing wave-16/21/23–27
  floor-exemption precedent for debt/infra-reuse waves applies at P-1. That is P-1's
  authority, not mine — flagged for context only.)

# Keep-OUT recommendations — gold-plating at 0 users; do NOT author as siblings
keep_out:
  - concern: Rate-limit the rotate endpoint
    rationale: |
      Owner-only route, 0 production servers, no abuse surface. Speculative hardening
      ahead of demand. Add if/when abuse is observed — additive, no rework.
  - concern: Audit-log entry for rotations
    rationale: |
      No audit-log surface exists in the product; standing one up for a single
      owner-only action at 0 users is net infrastructure ahead of any compliance or
      forensic demand (M10 Compliance is a future milestone that would own this properly).
  - concern: Client-side "Regenerate link" button + new-link display UI
    rationale: |
      A UI affordance is a genuinely separable concern, BUT at 0 users the endpoint's
      job (making the permanent link revocable before pre-launch link distribution — the
      task's own TRIGGER) is met by the API alone; the owner can rotate operationally.
      This is NOT recommended as a sibling seed now — it is demand-gated polish that
      should surface only when the share-modal is next touched or real external users
      exist. Authoring a sibling seed for it would manufacture backlog ahead of demand,
      which is the opposite of thinness discipline.

# No precedence tie: this seed is NOT M5-mvp-critical scope, so no ceo-reviewer /
# mvp-thinner mediation over M5's assignment floor applies (per task briefing +
# product-decisions 2026-06-30 disposition note).
sibling_visible: false
