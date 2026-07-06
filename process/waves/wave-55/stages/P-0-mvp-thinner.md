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
  no mvp-critical scope declared for this coverage item — M8's success metric is
  about end-to-end coursework + private DM/group messaging behavior; it is silent
  on which of the three who_can_dm enum values carry a real-Postgres integration
  assertion. This is a LOW-severity coverage-completion item under an already-
  shipped DM privacy fence, not an mvp-critical AC.

ok_rationale: |
  The wave carries exactly ONE acceptance criterion: add a single real-Postgres
  integration assertion proving a who_can_dm='server-members' co-member sharing a
  server IS returned by getDmCandidates. Trace test: if this AC were absent, the
  milestone success metric (cohort runs coursework end-to-end; private 1:1 +
  group messaging real-time and offline-tolerant) is STILL satisfiable — the DM
  privacy fence already ships and the other two enum values ('nobody' exclusion
  with 'everyone' control, plus a disjoint-server exclusion) are already covered
  in dm-candidates.spec.ts. So the AC is nice-to-have coverage, not mvp-critical.
  But there is nothing to split: it is a single positive assertion completing the
  3-value enum truth table. Splitting a single test is the floor's explicit anti-
  goal. Every atom of the wave traces to the same coverage unit; a THIN would
  have to peel an AC off a wave that has only one AC. Verdict OK.

floor_constraint_active: true
floor_constraint_detail: |
  current_wave_loc: ~20-60 LOC (one `it()` block reusing pg-harness +
    insertFixtureUser; no production/schema change).
  would-have-split LOC sum: 0 (there is only one AC — nothing peelable).
  residual_after_split: unchanged (~20-60 LOC).
  floor_threshold: single-spec 1,500 LOC / multi-spec 2,500 LOC OR >=6 specs.
  The wave is already an order of magnitude below the minimum size floor. This is
  a floor-override-ship case by PRODUCT rule 5 (sub-floor test-only coverage
  completion ships as-is; do NOT pad to hit floor, do NOT split below it). The
  floor is not blocking an otherwise-valid THIN — there was no valid THIN to
  block — it independently confirms OK is the only correct verdict.

sibling_visible: false

# --- mvp-thinner note (not a verdict change) ---
# The judge prompt raised whether the single POSITIVE 'server-members' assertion
# is too thin to be a coherent control, and whether it should include a NEGATIVE
# control (a 'server-members' user sharing NO server is EXCLUDED). Assessment:
#   - The single positive assertion IS a coherent, complete unit as scoped. The
#     'server-members'-user-sharing-no-server exclusion is already structurally
#     covered by existing case (b): a disjoint-server user (USER_Z_DISJOINT) is
#     asserted NOT returned, and getDmCandidates is asserted to return length 0.
#     The disjoint-server fence is enum-independent (it filters on shared-server
#     membership before/independent of who_can_dm), so a 'server-members' user
#     with no shared server is already excluded by the same shared-server join —
#     no coverage gap remains that a negative control would newly close.
#   - Therefore adding a negative control would be SCOPE-EXPANSION (ceo-reviewer's
#     lane), not thinning, and would duplicate case (b)'s guarantee. mvp-thinner
#     does not propose new ACs. Flagged here for P-0 merge visibility only; no
#     verdict impact. If the founder/head-product wants the truth table to carry
#     an explicit enum-specific negative twin for symmetry, route it as an
#     expansion decision, not a thinness one.
