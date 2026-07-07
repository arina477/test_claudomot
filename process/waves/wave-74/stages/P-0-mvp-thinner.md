verdict: OK
verdict_source: mvp-thinner
milestone_id: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548
milestone_title: "M9 — Monetization: freemium tiers"
milestone_class: product-feature
milestone_success_metric: |
  _TBD by founder_
  (Quoted verbatim from the active milestone's ## Success metric prose section.
   No founder-authored metric exists. Per product-decisions 2026-07-07 M9 pivot +
   bundle-authoring entry, the metric is explicitly founder-reserved and unset —
   Stripe/pricing/per-tier limits are all founder-money decisions fenced out of this slice.)
mvp_critical_status: |
  no mvp-critical scope declared yet — the milestone's ## Success metric is _TBD by founder_,
  so there is no founder-authored floor against which ACs can be classified keep-vs-split.
  3 of 3 M9 child tasks are pending (all status=todo): seed 53d18d7f + siblings e34642ef, 2f61a317.

ok_rationale: |
  Two independent reasons converge on OK; the first is dispositive.

  (1) METRIC-ABSENT (dispositive, per hard rule). The milestone's ## Success metric is
  _TBD by founder_. The trace test — "if this AC were absent, would the milestone's
  ## Success metric still be satisfiable?" — is unanswerable without a metric, and I am
  forbidden from improvising the founder's metric. A THIN split proposal not traceable to
  the metric would be opinion, not analysis. Therefore no AC can be reclassified as
  nice-to-have on this wave, and the correct verdict is OK + flag. This is the same wall
  that held on the M9/M10/M12 disposition precedents (wave-44/46/55/58; product-decisions).

  (2) COHERENCE (corroborating, offered for head-product signal only — NOT a metric substitute).
  Even against the caller's WORKING mvp-critical claim ("a durable billing-agnostic tier record +
  a way to resolve tier→entitlements exists — the foundation any billing plugs into"), the bundle
  reads as a minimal, non-decomposable substrate, and I would land on OK regardless:
    - Seed 53d18d7f (tier model + free-default migration) is the irreducible core — without a
      persisted tier there is nothing to resolve. Keep.
    - Sibling e34642ef (EntitlementsService: tier→entitlements resolver + shared Zod contract) IS
      the "way to resolve tier→entitlements" half of the working claim. Splitting it would leave a
      data model with no resolver — the substrate would NOT "exist and be usable." Not a thinness
      candidate; it is the other half of the substrate's definition.
    - Sibling 2f61a317 (read-only gate wiring) is the weakest thinness candidate and the one worth
      naming to head-product: under free defaults it is non-restrictive scaffolding and enforces
      nothing today, so on a naive read it looks deferrable to the enforcement slice. But its own AC
      is "prove the read path end-to-end without changing behavior," and it is deliberately sized thin
      (1-2 existing gates, optional display, enforcement branch exercised only by an injected-cap test).
      Splitting it would (a) not meaningfully shrink the wave and (b) risk pushing the residual below
      the multi-spec floor (see floor note). It is a proof-of-read-path, not premature enforcement.

  On the caller's four specific probes:
    - server_id AND user_id tiers: the milestone ## Scope names BOTH "school + server tiers"; modeling
      both subjects is scope-faithful, not gold-plating. The seed already hedges ("and/or user_id"),
      so this is a P-2 spec-shape call, not an AC to split.
    - placeholder feature-caps (storage + call-capacity + educator-admin flag): these three map 1:1 to
      the milestone ## Scope's named unlock levers ("storage expansion, larger call capacity, educator
      admin tools"). Modeling the SHAPE (not values) of exactly the Scope-named capabilities is minimal,
      not speculative; real numbers are correctly fenced as founder-tunable placeholders.
    - gate wiring premature: addressed above — thin proof-of-read-path, not enforcement; splitting is
      not warranted and is likely floor-blocked.

  Net: no genuinely mvp-non-critical AC is bundled, and even if one wavered, the metric wall forbids a
  THIN. This is a coherent minimal substrate. OK.

floor_constraint_active: false
floor_constraint_detail: |
  Not the reason for OK (the metric-absent rule is). Recorded for head-product context:
  this is a multi-spec wave (3 claimed tasks; floor = net LOC > 2,500 OR >= 6 specs).
  The only plausible thinness candidate (2f61a317 gate wiring) is small — peeling it would drop the
  wave to 2 specs of substrate-only work and shrink LOC, plausibly pushing the residual under the
  multi-spec floor and triggering RESCOPE-AUTO-MERGE. So even absent the metric wall, a THIN here would
  likely be floor-blocked. Both constraints point the same way: keep the bundle intact.

# FOUNDER-FACING FLAG (head-product to carry into the P-0 deliverable / mediation notes):
# M9's ## Success metric is _TBD by founder_. mvp-thinner cannot classify ACs keep-vs-split without it.
# The substrate slice is correctly pricing/credential-INDEPENDENT and can proceed WITHOUT the metric
# (per the founder's 2026-07-07 M9-pivot directive + the wave-41/M8 precedent: start without a metric,
# resolve during the milestone). But the metric — and the real per-tier LIMITS/PRICES it depends on —
# must be resolved before any ENFORCEMENT or BILLING slice of M9, since those slices' mvp-critical
# claims are unassessable until then. Surface at the next M9 P-0 that touches real limits or Stripe.

sibling_visible: false
