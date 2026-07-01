verdict: SELECTIVE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SELECTIVE-EXPANSION
mode_rationale: |
  Not HOLD-SCOPE: the seed in isolation is correct plumbing with a ~nil user-facing
  delta at 0 users with no non-owner roles — shipping it alone burns a full P→N loop
  on an over-grant correctness fix that nobody perceives, and the wave-22 decision log
  (product-decisions.md ll.297-298) already ruled the split immaterial until "the first
  non-owner assignment-organizer role" exists. Not SCOPE-REDUCTION/REJECT: the split is
  genuinely worth doing — it is the prerequisite migration for delegating assignment-posting
  to a non-owner (a TA), which is a real academic-tooling capability and traces to the
  Differentiation bet. Not SCOPE-EXPANSION: I am not proposing a wider milestone or a
  horizon jump; I am cherry-picking exactly ONE cheap, already-scoped wave-22 follow-on
  (edbdea8f, /me-roles CTA) that converts this half-wired permission into an end-to-end
  capability. One addition, disproportionate value — that is SELECTIVE-EXPANSION.
bet_traced_to: Differentiation — academic tooling Discord lacks (M5 assignments wedge)
milestone_traced_to: M5 — Academic tooling: assignments (in_progress)
proposed_scope_change: |
  Bundle the seed (8aa67564 — split manage_assignments out of manage_channels: Permission
  union 4→5, roles flag, DTOs, roleToDto, single can() call-site swap) WITH the wave-22 V-2
  follow-on edbdea8f (/me-roles endpoint surfacing the organizer/create-assignment CTA to
  non-owner permission holders).

  Rationale — the two are halves of one capability, not two waves:
  - 8aa67564 alone lets you GRANT a non-owner the assignment-organizer right but they can
    never SEE the create-assignment CTA → the permission is structurally present, user-dead.
  - edbdea8f alone surfaces the CTA but, without the split, a TA can only be made an
    organizer by granting full manage_channels → the exact over-grant the split exists to
    remove. Shipping edbdea8f first re-entrenches the conflation.
  - Together they deliver the first perceivable end-to-end slice: "delegate assignment-posting
    to a TA without handing them channel-management rights." That is the precise MATERIAL
    trigger the wave-22 decision named (product-decisions.md l.298) — this wave is where it fires.

  Both units are additive, risk-free (no data migration; no existing non-owner roles to
  migrate), already-decomposed M5 backlog rows, and fully autonomous (no Resend credential).
  This keeps the loop shipping a coherent user-facing increment while due-date reminders waits
  on the founder's Resend key out-of-band — strictly better than shipping invisible plumbing.

  Boundary (against bundle bloat / for mvp-thinner mediation): bundle EXACTLY these two. Do
  NOT also pull the 6 re-homed M3/M4 presence/mention debt rows or the other 3 V-2 follow-ons
  into this wave — they are independent surfaces and would bloat past the size rubric. If
  head-product's sizing finds even this pair over the bundle ceiling, fall back to the seed
  alone as PROCEED (HOLD-SCOPE) rather than dropping edbdea8f for a different addition — no
  other single addition matches edbdea8f's cheap-but-disproportionate leverage here.
drop_rationale: |
  n/a
escalation_reason: |
  n/a
sibling_visible: false
