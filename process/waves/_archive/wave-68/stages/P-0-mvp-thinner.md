verdict: OK
verdict_source: mvp-thinner
milestone_id: 8d88e691-5e39-492f-83a9-73a1a9440af3
milestone_title: "Growth: server discovery"
milestone_class: product-feature
milestone_success_metric: |
  A student can DISCOVER and JOIN public study communities they are not already in —
  browse/search a public directory of study servers, see what each community is about
  (name, description, topic/size), and join with one click — turning StudyHall from
  invite-only into a discoverable network (the network-effect leg toward the
  weekly-active-students north star).
mvp_critical_status: |
  1 of the milestone's mvp-critical scope still pending: the write-half. Wave-67
  shipped the READ path (schema fields, GET /servers/discover, browse/search UI,
  one-click public join) but the directory is permanently EMPTY (no way for an owner
  to publish a server) and memberCount returns 0 for every card. This seed (2bd37c4c)
  is the sole remaining task that makes the shipped read-path deliver its metric.

ok_rationale: |
  Every AC in this bundle traces to a NAMED clause of the milestone success metric, so
  there is no non-mvp-critical heft to peel into a sibling.

  Trace-test per AC:
  - is_public publish toggle -> the metric's "DISCOVER ... public directory of study
    servers" clause. Without it the wave-67 directory is permanently empty and the
    metric is unsatisfiable. KEEP (mvp-critical).
  - UNpublish (toggle back to private) -> the retract half of opt-in visibility. An
    owner who cannot un-publish cannot safely opt in; retract is inseparable from a
    usable, safe publish. KEEP (mvp-critical; do-not-over-cut floor of a publish slice).
  - description/topic editing -> the metric's "see what each community is about (name,
    description, topic/size)" clause names description and topic VERBATIM as the payload
    the discover cards render. Deferring them ships a directory of sparse, null-field
    cards that fails the "see what each community is about" clause. This is the one
    plausible peel candidate and it is DEFEATED by the metric prose. KEEP (mvp-critical).
  - memberCount:0 fix + live-DB test -> the metric's "topic/SIZE" clause. memberCount
    is the size signal, currently 0 on every card, so "see the size" is unsatisfiable.
    The live-DB test needs published servers, which only exist once the publish path
    lands -> the fix and the publish path are one coherent, co-testable bundle, not two
    separable concerns. KEEP (mvp-critical).

  Surface-heft check: the server-settings UI is a minimal addition (publish toggle + 2
  fields) reusing the existing server-settings surface per the seed's own design note,
  NOT a settings redesign -> no splittable polish/extensibility heft. Deliberately-
  deferred future-bundle scope (moderation/safety on public join, ranking, categories,
  trending) is already OUT of this bundle per the M11 first-bundle decision log and is
  correctly absent here. This is the coherent minimal "make discovery publishable +
  correct" slice.

floor_constraint_active: false
floor_constraint_detail: |
  Not applicable. OK was reached on merit (every AC is mvp-critical), not because a
  floor blocked an otherwise-valid THIN. No peel was proposed, so no residual-LOC /
  floor calculation was needed.

sibling_visible: false
