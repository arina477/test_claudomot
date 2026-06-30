verdict: OK
verdict_source: mvp-thinner
milestone_id: M3
milestone_title: Real-time messaging
milestone_class: product-feature
milestone_success_metric: |
  Two students in a channel exchange messages in real time (<1s delivery),
  with reactions, threads, and attachments working.
mvp_critical_status: |
  Attachments is the LAST unmet success-metric clause. Reactions (waves 12-13),
  threads (wave-18), and realtime send/receive (<1s, waves 11-13) are all shipped
  + LIVE. This 3-task bundle (seed 20db0c16 + siblings 7c39c9e3, cf1ae370) is the
  final M3 feature; on its delivery the success metric is fully MET. All 3 tasks
  are status='todo'.

ok_rationale: |
  Every AC in the wave traces cleanly to the metric's mvp-critical floor. The bundle
  is the indivisible core of "attachments working": upload+store (seed) -> send
  (composer) -> render (message-row). Drop any one and the metric fails (store with
  no render = invisible; render with no upload = empty; no composer = nothing to send).
  No AC builds depth on an unshipped surface or polish ahead of demand. The two
  thinness candidates were examined and both keep:
    1. content-type allowlist (seed) — NOT polish. An unrestricted authenticated
       upload endpoint is an active T-8 security vuln, not a deferrable nice-to-have;
       this milestone flags T-8 live-probe authz. Keep on the security floor.
    2. 0-N multi-attachment (seed contract + composer multi-select + render loop) —
       the only genuinely metric-optional AC (the metric is provable with a single
       attachment per message). But it is NON-SEPARABLE depth, not a peelable AC:
       the FK is already one-message-to-N, the contract metadata is already array-
       shaped, and collapsing to single-attach then widening later means re-touching
       the same schema + contract array + composer + render loop across two waves.
       The array is the natural shape — cheaper to build once than scalar-then-widen.
       A split here would ADD rework, not remove scope. Keep.
  Render (cf1ae370) keeps BOTH image-preview AND file-chip: for a study app,
  screenshots are the dominant attachment case, so file-chip-only would show a
  download chip for a screenshot and fail the FELT "attachments working" metric.
  The object-storage SDK is a hard P-block dependency, not a cuttable AC.
floor_constraint_active: false

sibling_visible: false
