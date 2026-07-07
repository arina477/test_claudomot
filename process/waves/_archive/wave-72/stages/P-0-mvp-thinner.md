verdict: OK
verdict_source: mvp-thinner
milestone_id: 97d65b49-2585-47f8-aacc-510469fdc58a
milestone_title: M10 — Compliance & data rights
milestone_class: product-feature
milestone_success_metric: |
  _TBD by founder_
  (Quoted verbatim from M10's `## Success metric` prose section. No metric is
  declared yet — M10 is a fresh milestone, this is its first bundle, and the
  founder has not set the success bar. This is the `_TBD_` case named in the
  mvp-thinner hard rules.)
mvp_critical_status: |
  no mvp-critical scope declared yet — M10's mvp-critical set cannot be derived
  because `## Success metric` = `_TBD by founder_`. The 3-task account-erasure
  bundle is M10's first-ever bundle (seed 9658fb0b + siblings e11f8746, 898490b1),
  all status=todo, wave_id stamped for wave-72. Nothing in M10 is done yet.

# OK rationale (with the mandatory _TBD flag)
ok_rationale: |
  BLOCKED-ON-METRIC → OK by hard rule. The trace test ("if this AC were absent,
  would the milestone's `## Success metric` still be satisfiable?") is unrunnable:
  M10's `## Success metric` is `_TBD by founder_`. mvp-thinner's hard rules are
  explicit — "Never improvise the founder's success metric. `_TBD_` → verdict OK
  and flag — you cannot do thinness analysis without a metric" and "Every THIN
  proposal MUST cite the milestone's `## Success metric` prose; a split not
  tracing to the metric is opinion, not analysis." With no metric, any peel-off I
  proposed would be unbacked opinion, so I emit OK and flag the gap rather than
  manufacture a cut.

  Independent of the metric gap, the 3-task bundle also reads as a coherent,
  single-capability slice — one user-facing verb ("delete my account") delivered
  as its three inseparable layers (shared DTO contract → backend erasure service +
  guarded endpoint → Danger-Zone confirm UI). This is the same
  contract→backend→UI triad shape as the already-shipped right-to-access half
  (GET /profile/data + export). It is NOT depth-on-unshipped-surface, NOT
  polish-ahead-of-demand, and NOT extensibility gold-plating — the three thinness
  smells I catch. So even if a metric existed, my prior would be that this slice is
  at or near its minimum coherent size, not fat. (No THIN cut identified.)

floor_constraint_active: false
floor_constraint_detail: |
  N/A. OK was emitted because the success metric is `_TBD` (no metric to trace to),
  NOT because a floor blocked an otherwise-valid THIN. No LOC/floor computation was
  performed — a THIN was never reachable without a metric.

# ---------------------------------------------------------------------------
# FLAGS for head-product / P-0 merge (informational; NOT mvp-thinner verdicts)
# ---------------------------------------------------------------------------
flags:

  - flag: MISSING_SUCCESS_METRIC  (blocks thinness analysis)
    detail: |
      M10 `## Success metric` = `_TBD by founder_`. AC-level thinness classification
      is not possible until a metric exists — the mvp-critical set is defined AS the
      smallest AC subset that satisfies the metric. This is a founder-facing item.
      Recommend head-product / P-0 route the metric-setting to the founder (or, under
      automatic/degenerate, the BOARD/ceo-agent per mode) BEFORE any future M10 bundle
      claims to be "the mvp slice." For THIS wave the bundle is coherent enough to
      proceed on its own merits, but the milestone cannot be judged metric-complete
      later without the bar being set.

  - flag: COMPLIANCE_REGIME_CHANGES_THE_AC_SET  (founder-facing; not mine to decide)
    detail: |
      The seed task itself surfaces (and the P-block review-artifacts records at
      P-0 Action 4) a hard-vs-soft delete choice: HARD-delete (GDPR/CCPA strict
      purge) vs SOFT-delete + PII-scrub + session-revoke (FERPA audit-friendly,
      reversible, matches the shipped message soft-delete convention). The decomposer
      DEFAULTS to soft-delete, non-blocking.

      Materiality note (for head-product, NOT a mvp-thinner cut): this choice does
      change the AC set materially. A strict HARD-delete regime would likely pull the
      "audit-log entry for the deletion" item IN (regulators expect a tamper-evident
      record that erasure occurred) and change the referential-integrity handling
      (cascade-purge vs anonymize). The soft-delete default keeps audit-log OUT (seed
      explicitly defers "full audit-log infrastructure" to later M10 bundles). Both
      the regime pick and the "fold in a minimal deletion audit-log entry for the
      institutional-credibility bet?" question are founder-facing product/compliance
      decisions — I flag them, I do not decide them, and I do NOT propose folding the
      audit-log in as a mvp-thinner action (that would be a ceo-reviewer
      SCOPE-EXPANSION lane item, not mine).

  - flag: NO_CROSS_MILESTONE_MOVE, NO_NEW_AC
    detail: |
      Confirmed I am proposing zero AC moves across milestones and zero new ACs.
      All three tasks correctly sit under milestone_id = 97d65b49… (M10). Nothing to
      re-home; nothing to add. Purely observational.

sibling_visible: false
