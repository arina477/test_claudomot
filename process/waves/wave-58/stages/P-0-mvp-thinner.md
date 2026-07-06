verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  A class cohort runs coursework end-to-end in StudyHall without falling back to
  Discord: the teacher side is live (roles, assignment collect/return, scheduling)
  AND students can hold private 1:1 and small-group conversations outside class
  channels — real-time and offline-tolerant. First slice: direct + group messages.
mvp_critical_status: |
  M8 feature spine is effectively shipped: roles/RBAC + educator light moderation,
  assignment submission collect/return (no grading), class scheduling + calendar,
  study-group timers/focus rooms, and direct + group DMs (schema, UI, Socket.IO
  fan-out, offline outbox) are all status=done. Remaining open rows are hardening /
  polish / deferred-scale items — none is a mvp-critical feature gap for the metric.
  This wave adds no product AC; it is a single test-honesty conversion.

ok_rationale: |
  This wave carries exactly ONE AC (seed a1dda389): convert the pass-regardless
  soft-check of cross-client message:deleted fan-out in
  apps/web/e2e/delete-any-message.spec.ts:146-162 into a deterministic hard
  assertion (~20-40 LOC edit to a single E2E block). There is nothing to
  re-classify or peel off — a single test-assertion conversion is a coherent,
  indivisible unit and splitting it is the floor's explicit anti-goal. The AC does
  not itself trace to the milestone's success metric (which is silent on
  test-honesty debt; the fan-out feature was separately proven at wave-41 T-4/T-8
  and the RBAC portions of this same spec are already hard-asserted), so it is not
  mvp-critical — but it is also non-splittable. Correct call is OK, not THIN.
floor_constraint_active: true
floor_constraint_detail: |
  current_wave_loc: ~20-40 (one E2E test block edit, single spec, single file)
  would-have-split_loc_sum: 0 (only one AC exists; no nice-to-have AC available to
    move into a sibling)
  residual_after_split: ~20-40 unchanged — a split cannot reduce a one-AC wave; a
    zero-AC wave is degenerate
  floor_threshold: single-spec floor is 1,500 LOC. This wave is already a
    sub-floor test-hardening task. Per stage contract, a sub-floor single-AC wave
    is exempt from the size floor (it is a legitimate targeted debt-paydown, not a
    thin product wave), and no THIN is possible regardless. floor override by rule.

sibling_visible: false
