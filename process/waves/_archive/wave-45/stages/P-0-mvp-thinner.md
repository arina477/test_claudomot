verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  _TBD by founder_
  (M8 ## Success metric section is an unresolved placeholder — no founder metric authored yet.)
mvp_critical_status: |
  no mvp-critical scope declared yet — M8's ## Success metric is "_TBD by founder_", so the
  milestone has no metric-bar against which an mvp-critical AC floor can be computed. Neither
  wave-45 task advances M8's PRODUCT ## Scope (educator role/moderation, assignment collect/return,
  scheduling, study-group tools, DMs, message search); both are metric-independent maintenance.

ok_rationale: |
  The thinness lens does not apply to this wave. Wave-45 is a tech-debt / hygiene wave — two
  pre-existing-debt items surfaced by prior waves' V-2 stages, NOT a product-feature slice — even
  though parent milestone M8 is class product-feature. There are no product ACs to re-classify:
  (1) seed 67881a58 = a single infra/test-harness config change (make bundled-chromium the default
  Playwright MCP channel; from wave-15 V-2 T5-F1); (2) sibling 4e994e96 = a single lint-cleanup item
  (9 biome warnings: useTyping.ts noNonNullAssertion x6 + ServerRolesPage.tsx dead suppressions x3;
  from wave-16 V-2 T-1/B-5). Each task is one coherent, atomic debt item with no internally
  splittable AC surface — there is nothing to peel into a sibling. Both are already minimal.

  The trace test cannot be run: M8's ## Success metric is "_TBD by founder_", so there is no
  mvp-critical floor to trace ACs against, AND neither task touches M8 product scope in the first
  place. Per mvp-thinner hard rules, an absent/_TBD_ metric forces OK + flag (thinness analysis is
  undefined without a metric). This is that case, doubly so (metric TBD *and* non-product scope).

  Not OVER-CUT: although the wave is small, the BOARD already ruled 6/7 that this hygiene wave keeps
  the loop flowing on metric-independent work while the founder metric is pending. Draining surfaced
  infra/lint debt with no product-metric dependency is a legitimate, coherent minimal slice — not a
  wave "too thin to be worth running." OVER-CUT would contradict that standing BOARD decision and is
  not warranted: the wave is doing exactly what a debt-drain wave should. (P-1 owns any LOC-floor
  disposition for a test/infra wave — see the wave-16 precedent exempting test/infra waves from the
  feature-LOC floor; that is P-1's call, not mine.)

floor_constraint_active: false
floor_constraint_detail: |
  n/a — no THIN was contemplated, so no floor pre-check was needed. (No residual-LOC calculation
  applies: there are zero ACs proposed for split.)

# FLAG — metric TBD (mandated by mvp-thinner hard rules):
# M8 ## Success metric is "_TBD by founder_". mvp-thinner cannot perform thinness analysis without a
# declared metric. This is surfaced for head-product / P-0 merge awareness. It does NOT block wave-45
# (a metric-independent hygiene wave), but M8's metric SHOULD be resolved by the founder before any
# genuine M8 product-feature slice (educator tools / DMs / search / study-group tools) is framed —
# a future product-feature wave under M8 will have no mvp-critical floor to thin against until then.
# Not routed by me (read-only); flagged for the orchestrator's P-0 merge.

sibling_visible: false
