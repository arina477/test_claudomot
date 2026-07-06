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
  [Working target set by Claudomat 2026-07-04 on founder delegation; founder can
  adjust anytime.]
mvp_critical_status: |
  All mvp-critical M8 scope is shipped. 39 of 43 M8 tasks are status=done, covering
  every ## Scope clause tied to the success metric: educator role + light moderation,
  assignment collect/return (no grading), class scheduling/calendar, study-group
  timers + focus rooms, and the success-metric "first slice" — direct + group
  messages (DM schema, UI, Socket.IO fan-out, offline-tolerant send) all LIVE.
  The 4 remaining todo tasks are low-value-tail cleanup: 3 DM polish/scaling
  deferrals (off-token surfaces 5bcbd27f, throttle/backoff reconcile 874bd233,
  cursor-pagination 999a14d1) + this wave's seed (buildTypingLabel unit test).
  None of the 4 is load-bearing for the success metric — it was already satisfiable
  before any of them.

# OK — current scope is well-classified
ok_rationale: |
  The wave carries exactly ONE indivisible AC: a table-driven unit test for the pure
  5-branch buildTypingLabel transition table (0/1/2/3/4+ typers) in
  apps/web/src/shell/useTyping.ts. There is nothing to peel into siblings — a single
  AC is the atomic unit, and this one has no depth-on-unshipped-surface, no
  polish-ahead-of-demand, and no extensibility scope to defer. The trace test is
  moot here: the AC does not build toward the success metric at all (the metric was
  already met by the 39 shipped M8 tasks); it is deliberate coverage backfill for an
  already-shipped function (wave-45 V-2 F1, low severity, pre-existing test-debt).
  A coverage-backfill AC on a shipped surface cannot break an already-satisfied
  mvp-critical claim, so THIN (deferral) is not applicable, and per contract I do
  NOT propose expansion into unrelated coverage — this is intentional low-value-tail
  drainage of the M8 cleanup queue, not a feature slice. Note for head-product:
  should the wave read as too-thin-to-be-a-coherent-slice, that is a ceo-reviewer /
  P-1-floor concern, not a thinness re-classification; from the AC-classification
  lens the single AC is correctly scoped and complete.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — OK was emitted because the single AC is well-classified with nothing to split,
  NOT because a floor blocked an otherwise-valid THIN. No peel-off was proposed, so no
  residual-LOC / floor pre-check applies. (Prior art: product-decisions.md wave-16 —
  "Test-coverage waves are exempt from the feature-LOC floor" — confirms test-debt
  waves are legitimately sub-floor and are not a thinness defect.)

sibling_visible: false
