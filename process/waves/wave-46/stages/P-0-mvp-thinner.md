verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  "A class cohort runs coursework end-to-end in StudyHall without falling back to
  Discord: the teacher side is live (roles, assignment collect/return, scheduling)
  AND students can hold private 1:1 and small-group conversations outside class
  channels — real-time and offline-tolerant. First slice: direct + group messages."
mvp_critical_status: |
  DM sub-metric first slice: all 4 proposed tasks are mvp-critical and pending
  (a48f1910 seed, 32f5d29e fan-out, 1ceffdc9 UI, d8264800 offline). No DM tasks
  done yet — this is the first M8 DM slice. Broader M8 teacher-side scope
  (roles/moderation, assignment collect/return, scheduling) already shipped in
  prior waves; DM is the remaining success-metric clause this wave opens.

ok_rationale: |
  Every one of the 4 ACs traces to an explicit, non-severable clause of the
  success metric, and the bundle is already the minimum coherent slice for a
  USABLE first DM experience:
    - a48f1910 (schema + participant-gated create/list/send endpoints) is the
      spine — without it nothing exists; it also carries the create-conversation
      endpoint, so the feature is startable (no OVER-CUT gap).
    - 32f5d29e (Socket.IO fan-out) is required by the metric's literal
      "real-time" clause; cut it and DMs only appear on refresh → metric unmet.
    - 1ceffdc9 (minimal DM UI) carries the "start a conversation / pick recipient"
      affordance and who_can_dm respect; without it no student can "hold a
      conversation" at all → metric unmet.
    - d8264800 (offline-tolerant send via existing outbox) is required by the
      metric's "offline-tolerant" clause AND is a load-bearing StudyHall founder
      bet (offline-first is its own milestone, M4; channel messaging already
      ships the outbox). NOT splittable.
  Group-DM-vs-1:1 (the one plausible thinness lever) is a FALSE signal: the
  metric names "small-group conversations" and "First slice: direct + group
  messages" verbatim as first-slice scope, and the seed achieves group at
  near-zero incremental cost (is_group boolean + N-row dm_participants; a 1:1 is
  just a 2-participant conversation). Splitting group out would not remove a
  coherent AC — it would only add an artificial participants==2 restriction and a
  later re-widening wave. No fat to peel. The already-deferred items (DM search,
  read receipts, reactions, typing, attachments, group-DM admin/roles) are
  genuinely post-MVP; none is required to satisfy the first-slice metric, so this
  is not OVER-CUT either.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — OK was emitted on merit (every AC mvp-critical), not because a floor
  blocked a THIN. No split was proposed, so no residual-LOC pre-check applies.

sibling_visible: false
