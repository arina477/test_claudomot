verdict: OK
verdict_source: mvp-thinner
milestone_id: b7400254-9c16-4b97-a898-2619b949fc5e
milestone_title: "Institution partnerships & portable identity"
milestone_class: product-feature
milestone_success_metric: |
  _TBD by founder_ (strategic product metric — outside the pricing-only
  2026-07-07 standing delegation; FENCED, founder-reserved).
  Quoted verbatim from M13 ## Success metric prose section.
mvp_critical_status: |
  no mvp-critical scope declared yet — the founder's success metric is _TBD_ and
  explicitly fenced. The 4-task bundle is M13's FIRST slice; no M13 child task is
  done. Absent a metric, the mvp-critical set cannot be computed by the trace test.

ok_rationale: |
  Cannot perform AC-level thinness analysis: M13's ## Success metric is "_TBD by
  founder_" and is explicitly FENCED (founder-reserved, outside the standing
  pricing delegation). The trace test asks "if this AC were absent, would the
  milestone's success metric still be satisfiable?" — with no metric, every trace
  is unanswerable, and my in-doubt rule keeps the AC by default. Per hard rule
  ("_TBD_ → verdict OK and flag — you cannot do thinness analysis without a
  metric") the verdict is OK.

  Secondary grounding (why the bundle is ALSO a coherent minimum even against the
  best available proxy): the P-0 mvp-critical CLAIM is "M13's educator-admin
  engineering foundation exists + is access-controlled + has a usable console,"
  and M13's ## Approach defines leg (1) verbatim as "educator admin console +
  analytics (real UI + API over shipped server/member/entitlement data)." Traced
  against that leg-(1) scope, all four ACs are load-bearing for a coherent first
  slice — none is depth-ahead-of-surface or polish-ahead-of-demand:
    - 682e0912 (SEED, API foundation + owner/educator gate): irreducible core.
      The access-controlled surface is the substrate both analytics and the
      console consume; nothing ships without it.
    - ecf79f4a (owner/member authz check): the access-control clause of the
      claim itself ("is access-controlled"). Reparented in as the load-bearing
      foundation, NOT duplicated work. Cutting it removes the word
      "access-controlled" from the mvp-critical claim.
    - 80505bb1 (analytics aggregates API): "analytics" is named in the leg-(1)
      Approach scope verbatim and is what the console renders. It reuses the
      seed's authz layer ("no new auth path") — cheap, credential-independent,
      pure read-only aggregation over already-shipped data. Deferring it would
      leave the console with an empty body (the console AC's core render target
      is "the analytics aggregates"); leg (1) would be definitionally
      "console + analytics" minus the analytics.
    - d81e266d (Console web UI): "usable console" is the third clause of the
      mvp-critical claim; an API-only slice does not satisfy "has a usable
      console." It reuses shipped settings-panel/shell DS patterns (no new
      surface invented) — no polish-ahead-of-demand.
  A defer of analytics (80505bb1) or the console UI (d81e266d) into a later M13
  bundle would break the coherence of the FIRST slice as the founder's Approach
  defines it (leg 1 = console + analytics), not just trim breadth. That is a
  cut of load-bearing scope, not thinning — so even on the proxy, no THIN.

floor_constraint_active: false
floor_constraint_detail: |
  Not the reason for OK. OK is driven by the fenced _TBD_ success metric, not by a
  floor blocking an otherwise-valid THIN. (For reference only: P-1 estimated the
  bundle at ~2,500–3,500 net LOC / ≤40 files across 4 tasks; as a multi-spec wave
  it clears the multi-spec floor on the ≥6-specs? no / >2,500 LOC path — but no
  split was proposed, so the floor never gated a decision here.)

# FLAG TO head-product / P-0 merge:
#   M13's success metric is _TBD by founder_ and FENCED. mvp-thinner cannot
#   authoritatively classify mvp-critical vs nice-to-have without it. This is the
#   same _TBD_ posture M9/M10/M8 carried (wave-41 precedent) and per M13's own
#   ## Fenced clause it is "surface non-blocking; do not block the engineering
#   core." Recommendation: PROCEED on the engineering core (the bundle is a
#   coherent leg-(1) slice per the Approach prose), and surface the _TBD_ metric
#   to the founder non-blocking. Should the founder later author a narrower
#   metric, re-run mvp-thinner against M13's REMAINING (unbuilt) legs (2)
#   portable identity + (3) privacy/E2E — not this already-coherent first slice.

sibling_visible: false
