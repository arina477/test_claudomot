verdict: OK
verdict_source: mvp-thinner
milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
milestone_title: M5 — Academic tooling: assignments
milestone_class: product-feature
milestone_success_metric: |
  An organizer posts an assignment with a due date; members see it alongside
  chat, mark it done, and get a reminder before it is due.
mvp_critical_status: |
  All M5 mvp-critical (assignments) scope is DONE. The assignment module spine is
  shipped + LIVE: 01fcefb8 (CRUD + per-member status spine), 916ecff7
  (assignments-panel page + assignment-card primitive), a5f25f9b (integration + E2E
  tests), 8aa67564 (dedicated manage_assignments permission), edbdea8f (organizer
  CTA). The success metric is satisfiable from the shipped work. The seed task
  d23a0740 is re-homed wave-14 V-2 presence/members code-debt — it is NOT part of
  M5's ## Scope (assignments) and traces to NONE of the success-metric clauses.

ok_rationale: |
  Neither of the two sub-fixes in d23a0740 traces to M5's ## Success metric — this
  is carried presence/members tech-debt re-homed under the active milestone, not
  assignments scope. There is therefore no mvp-critical "keep" set from which a
  "nice-to-have" AC could be peeled: both fixes are equally non-critical cleanup
  from the same wave-14 V-2 source (M-3/M-4, KI-2/KI-3). A THIN split requires
  tracing a deferrable AC against the success metric; that trace does not exist here,
  so a sibling split would be pipeline ceremony, not thinness analysis.

  On the atomic-vs-separable question actually posed: the two fixes ARE technically
  separable (fix 1 = runtime displayName empty-guard in presence gateway +
  servers.service; fix 2 = ServerMembersResponseSchema wire-shape alignment — a
  Zod/contract fix, explicitly latent with no live mismatch today; different files,
  different concerns). But separability alone does not mandate a split. Both are
  tiny (~10-30 LOC each), share one provenance (the same wave-14 V-2 cleanup pass),
  and sit in the same presence/members subsystem. Bundling them is a coherent
  single micro-wave. Splitting fix 2 into its own sub-30-LOC single-concern sibling
  adds a task-lifecycle round-trip without changing what ships or de-risking
  anything: fix 2 is latent (no live mismatch → no correctness urgency) and additive
  (no rework risk whether shipped now or later). Keep the 2-part cleanup as one wave.

  I do NOT recommend a smaller wave (P-1's authority) and I explicitly do NOT
  force-expand into M5's assignment scope: assignments are done, so there is no
  precedence-tie with ceo-reviewer over unmet assignment scope, and dragging
  unrelated assignment follow-ups (4b397de0 / 6f257c82 / 3ad35a42 / 72cb6ebb /
  226c7e42) into this bundle would be scope-invention, not thinning.

floor_constraint_active: false
floor_constraint_detail: |
  Not applicable. This is a tech-debt / cleanup wave, not a feature wave — it is
  exempt from the single-spec feature-LOC floor per the wave-16 P-1 precedent
  (product-decisions.md line 215: "Test-coverage / test-infra tech-debt waves are
  permitted below the >1500-LOC floor; the LOC floor guards thin *feature* waves,
  and the decomposer cannot author feature-siblings for a tech-debt seed"). The same
  exemption applies to this presence/members code-debt seed. No floor blocks or
  forces any call here.

keep_out_flags:
  - flag: "Fix 2 — DELETE the dead wrapper, do not align it (less code beats aligned dead code)"
    detail: |
      ServerMembersResponseSchema is a declared-but-UNUSED wrapper whose wire shape
      is a bare array. The task frames fix 2 as "align the schema to the wire." The
      thinner call: if the wrapper schema is genuinely dead (no import/reference
      consuming it as a wrapper — verify at P-2/B-block), the leaner fix is to DELETE
      the unused wrapper and let the bare-array type stand, NOT to spend LOC aligning
      a schema nothing validates against. Aligning dead code preserves a latent trap
      in a slightly different shape; deleting it removes the trap. Recommend P-2 spec
      the AC as "delete-if-dead, align-only-if-a-live-consumer-exists" rather than an
      unconditional align. This is the one gold-plating guard on this wave.
  - flag: "Scope-freeze the bundle to exactly these two fixes"
    detail: |
      Do not let B-block opportunistically fold in adjacent presence/members refactors
      (e.g. presence subscription internals, member-list data-source reshaping). The
      wave is two named cleanups; anything beyond them is unrequested depth on a
      non-mvp-critical surface.

sibling_visible: false
