verdict: OK
verdict_source: mvp-thinner
milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
milestone_title: M5 — Academic tooling: assignments
milestone_class: product-feature
milestone_success_metric: |
  An organizer posts an assignment with a due date; members see it alongside chat,
  mark it done, and get a reminder before it is due.
mvp_critical_status: |
  Post/view/mark-done core is DONE (916ecff7 panel+card, 01fcefb8 CRUD+status spine,
  a5f25f9b tests — all status=done). The "reminder before it is due" clause of the
  success metric is still pending (lives in ## Scope, not in this seed, not yet shipped).
  This seed (8aa67564 manage_assignments split) is NOT itself a success-metric clause —
  it is an authz correctness refinement on top of the already-LIVE feature.

ok_rationale: |
  This wave is already at minimal coherent size — a single atomic authz-correctness unit,
  not a feature bundle, and there is no gold-plating to cut. The 4 work items (extend the
  Permission union 4→5, add the roles-table flag column + migration, thread the flag through
  role create/update DTOs + roleToDto, swap the one assignments controller can() call site
  from manage_channels → manage_assignments) are a single indivisible change: a permission
  that exists in the union but has no roles-table column, no DTO surface, and no call-site
  consumer is a dead, incoherent permission. Splitting along those seams (e.g. "add the union
  value now, wire the call-site next wave") would ship exactly that dead permission — that is
  OVER-CUT territory, not THIN. No AC traces to a deferrable nice-to-have: there is no
  role-management toggle UI in scope (correctly out — see flag below), no backfill needed
  (zero non-owner organizer roles exist to migrate, per the seed), and no exhaustive
  per-permission test sprawl beyond the swapped call site. Every work item is load-bearing for
  the one outcome (a dedicated, wired, enforced manage_assignments permission), so the whole
  unit either ships coherently or not at all. Verdict OK: keep all four work items in this wave.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — OK was not floor-driven. This is a single-spec backend unit well under any floor; the
  question P-1 must answer is whether it clears the single-spec MINIMUM floor on its own (it is
  a ~4-file additive change). That is a wave-SIZE question owned by P-1/ceo-reviewer, not an
  AC-thinness question — flagged below, not actioned here.

# Notes for head-product merge (not part of the verdict schema; advisory)
advisory_flags:
  out_of_scope_correctly_excluded:
    - "No role-management UI for toggling the new manage_assignments flag is bundled here.
       Correct exclusion: this seed is the permission spine only; a toggle surface is a
       separate, demand-gated concern (no admin role-editor exists yet)."
  size_not_thinness_observation: |
    This is a deliberately small single-purpose backend unit (head-next picked it as a minimal
    autonomous step). It is NOT too thin on AC-classification grounds — it is exactly one
    coherent change. But if ceo-reviewer / P-1 judge the wave too SMALL to be worth a loop on
    its own, the natural end-to-end pairing is the wave-22 follow-on edbdea8f
    ("surface organizer CTA to manage_channels non-owners via /me/roles"): together,
    manage_assignments (server-side dedicated permission) + the /me/roles client CTA gate would
    make delegated-organizer authz end-to-end valuable (a non-owner can both BE granted and SEE
    the organizer affordance). That is a wave-SIZING / bundling call (P-1 authority + ceo-reviewer
    ambition lens), NOT an mvp-thinner split — mvp-thinner never recommends reducing wave size,
    and never proposes adding ACs (ceo-reviewer's SCOPE-EXPANSION lane). Recorded here only so
    head-product has it at merge.

sibling_visible: false
