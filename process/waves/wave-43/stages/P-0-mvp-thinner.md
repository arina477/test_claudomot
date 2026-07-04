verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  _TBD by founder_
  (Quoted verbatim from M8 `## Success metric`. No metric is defined — the section
  is an unresolved founder placeholder, identical to the wave-41 and wave-42 state.)
mvp_critical_status: |
  no mvp-critical scope declared yet — M8 `## Success metric` is `_TBD by founder_`,
  so no mvp-critical AC floor can be computed. M8 `## Scope` lists "class
  scheduling/calendar integration" among six educator-tool clauses; this wave
  (seed 535bdb8c + siblings cdf81427, 1216146e) is the first scheduling slice.
  Prior M8 slices shipped: educator role + moderation (wave-41), assignment
  collect/return (wave-42).

ok_rationale: |
  M8's `## Success metric` is `_TBD by founder_`. Per the mvp-thinner hard rule
  ("Never improvise the founder's success metric; `_TBD` → verdict OK and flag —
  you cannot do thinness analysis without a metric"), the trace test cannot be
  run: the trace test asks "if this AC were absent, would the `## Success metric`
  still be satisfiable?", and with no metric there is no referent to trace against.
  Any split I proposed would be opinion, not analysis. This matches the wave-41 and
  wave-42 dispositions on the same undefined-metric milestone. The bundle is also
  already AC-thinned at authoring (seed + 2 read-side siblings, tight CREATE/VIEW/
  EDIT-only scope fence excluding reminders/RSVP/timezone/ICS), so no thinness
  concern is visible even at the descriptive level.
flag_metric_undefined: true
floor_constraint_active: false
floor_constraint_detail: |
  n/a — verdict is OK due to undefined metric, not a floor-blocked THIN. No LOC
  residual computed (no split proposed).

# Non-binding context for head-product (NOT a THIN proposal — metric bars analysis)
non_binding_notes: |
  Had a metric existed, three candidates would have been weighed. Recording the
  reasoning as context only; head-product may act or dismiss. None is emitted as a
  THIN split.

  (a) "simple recurring" — the strongest split candidate. A v1 could ship one-off
      sessions only and defer recurrence (recurrence descriptor + recurrence_until
      column, recurrence UI in the authoring modal, recurring-instance expansion in
      the calendar read view) to a later M8 sub-slice. Recurrence is depth on the
      scheduling surface rather than the surface itself; "class scheduling/calendar
      integration" scope is satisfied by one-off CREATE/VIEW/EDIT alone. Counter-
      weight: recurrence is cheap here because it is a single nullable-column pair +
      an enum on a table that must be authored either way, and weekly-recurring
      classes are arguably the common case for an educator's *class* schedule (vs a
      one-off event) — so deferring it may cut the more representative path, not the
      edge. This is a genuine judgment call that only a defined metric could settle;
      I am NOT proposing the split.

  (b) session-detail drill-in view (sibling 1216146e) — NOT a clean split candidate.
      It is the role-gated edit/delete entry point (the drill-in is where an
      educator reaches the edit/delete affordance authored in the seed). Deferring
      it would strand seed-built edit/delete behind no UI surface, or force that
      affordance into the calendar list view instead — a rework, not a clean peel.
      Reads as intrinsic to the CRUD slice.

  (c) calendar view (sibling cdf81427) — NOT a split candidate. It is the read side
      of "scheduling" (member-visible session list, assertMember). A scheduling
      feature that no member can view is not a coherent slice; this is the surface's
      first-pass render, not polish ahead of demand.

sibling_visible: false
