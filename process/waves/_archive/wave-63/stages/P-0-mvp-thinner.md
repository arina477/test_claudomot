verdict: OK
verdict_source: mvp-thinner
milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
milestone_title: M12 — Offline-first moat
milestone_class: product-feature
milestone_success_metric: |
  A student working fully offline can access ALL their StudyHall content — not just recent
  channel messages (the shipped M4 wedge) but assignments, study-group data, and
  previously-loaded media — and when the same item is edited from two places while offline,
  a clear conflict-resolution UI reconciles on reconnect with zero data loss. Deepens the
  offline wedge into a moat: coverage extends from messages to the full content surface.
mvp_critical_status: |
  3 of the metric's named offline-content surfaces still pending. The metric enumerates four
  required surfaces — messages (SHIPPED: M4 wedge + bundle #1 DMs, Dexie v2), assignments,
  study-group data, previously-loaded media — plus a conflict-resolution UI clause. This
  bundle (moat bundle #2) covers exactly two of the remaining named surfaces: assignments
  (35c57942) and study-group/schedule data (42e0a265). Media + conflict-resolution UI are
  explicitly deferred to later M12 bundles by the seed itself.

ok_rationale: |
  Every AC in this 3-task bundle traces cleanly to a distinct, explicitly-named surface in
  M12's success metric — no nice-to-have padding, no gold-plating, no deferrable AC.

  Trace test per task:
  - Seed c5689dc5 (v3 substrate: cachedAssignments + cachedScheduledSessions tables +
    Cached* types + read-through helpers + v2→v3 verbatim-restate migration + preservation
    test): both siblings import its tables/helpers — if absent, neither wire-in is possible.
    mvp-critical. NOT over-scoped: it adds exactly two tables, one consumed by each sibling.
    Zero unused surface built. The verbatim-restate migration + data-loss-guard test is not
    polish — it is the load-bearing correctness guard for a schema bump that mutates a LIVE
    user DB.
  - Assignments sibling 35c57942: the metric names "assignments" as the FIRST enumerated
    academic surface. Remove it → metric explicitly unsatisfiable. mvp-critical. Keep.
  - Schedule sibling 42e0a265: the metric names "study-group data" as a required surface;
    scheduled-sessions (ClassCalendar) is the genuinely-persisted study-group-data leg
    (ephemeral socket-only study-timer/focus-room state is correctly excluded — not a
    read-cache fit). Remove it → a named surface goes uncovered → metric's mvp-critical
    claim ("ALL their StudyHall content ... assignments, study-group data") breaks. Keep.

  On the specific splittability question (could schedule become a later bundle, since
  assignments + schedule are two INDEPENDENT surfaces — unlike bundle #1's list+thread which
  were two halves of ONE DM outcome): the two surfaces ARE structurally more independent than
  list+thread (distinct panels, distinct endpoints, no data dependency). BUT independence is
  not the thinness criterion — the trace test is. Both surfaces are separately named in the
  metric, so BOTH must land for the mvp-critical claim to hold; neither is a nice-to-have
  that the metric would tolerate cutting. Independence would justify a split only if one leg
  failed the trace test, and neither does.

  Splitting schedule to a later bundle would also be actively WASTEFUL, not thinner: both new
  tables ride the SAME v3 verbatim-restate migration — the single highest-risk element of the
  seed (omitting any prior table silently drops it → user data loss). Peeling schedule out
  would force a separate v4 migration bump for one table, re-paying that exact
  restate-all-prior-tables risk a second time for a single-table gain. The shared-substrate
  bundling is the correct, risk-minimizing shape.

  This is a tight, coherent "offline academic-content read" slice mirroring bundle #1's proven
  substrate+two-read-wire-ins structure, scoped to precisely the two remaining metric-named
  academic surfaces and nothing beyond. No AC re-classification warranted.

floor_constraint_active: false
floor_constraint_detail: |
  N/A — verdict is OK on merits (tight coherent slice), not floor-blocked. No THIN split was
  proposed, so no residual-LOC floor pre-check was triggered.

sibling_visible: false
