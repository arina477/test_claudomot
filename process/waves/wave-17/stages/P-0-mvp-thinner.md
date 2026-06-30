verdict: OK
verdict_source: mvp-thinner
milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
milestone_title: M3 — Real-time messaging
milestone_class: product-feature
milestone_success_metric: |
  Two students in a channel exchange messages in real time (<1s delivery),
  with reactions, threads, and attachments working.
mvp_critical_status: |
  M3 messaging feature scope is largely shipped (waves 11-15: send/list REST + /messaging
  gateway + composer/list UI + reactions + edit/delete + presence/typing/member-list + @mentions).
  Wave-17's single task (25523fb0) is NOT a milestone-feature seed — it is carried M2
  server-management tech-debt (create-server transaction-rollback proof), reassigned to M3
  at the wave-10 close-out as a top-level seed candidate. It does not advance any clause of
  M3's success metric; it hardens an already-shipped create-server path.

ok_rationale: |
  Wave-17 is a single test-infra/tech-debt task with exactly one indivisible AC: stand up a
  real-Postgres (or in-process PG) test harness AND assert the create-server atomic transaction
  rolls back cleanly (no orphan server/role/member/category/channel rows) on a forced mid-txn
  failure. The harness and the rollback test are one coherent deliverable — a rollback test
  without a real-PG harness cannot exist (the current db.transaction stub is precisely why the
  rollback path is unproven), and a harness with no test proves nothing. There is no AC to peel
  into a sibling: the only larger scope on offer ("test ALL db.transaction call-sites" — e.g.
  also owner-lockout) would be scope EXPANSION, not thinning, and is out of my lane. Keeping it
  to create-server rollback is right-sized. Per the wave-16 precedent logged in product-decisions,
  test-infra waves carry little AC-thinness signal — there are no feature-depth, polish, or
  extensibility ACs to defer here. Note also: this task does not trace to M3's success metric at
  all (it hardens a shipped M2 path), so the trace test is moot — there is nothing to defer
  against a metric it never claimed to satisfy.
floor_constraint_active: false
floor_constraint_detail: |
  Not applicable. No THIN was proposed, so no floor pre-check was needed. (For the record, the
  wave-16 P-1 decision exempts single-task test-infra tech-debt waves from the single-spec
  >1500-LOC feature floor; that exemption governs P-1 sizing, not AC-thinness, and does not
  change this OK.)

sibling_visible: false
