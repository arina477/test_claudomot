verdict: OK
verdict_source: mvp-thinner
milestone_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
milestone_title: M4 — Offline-first reliability (the wedge)
milestone_class: product-feature
milestone_success_metric: |
  A student loses connectivity mid-session, keeps reading cached channels and
  composing messages, and on reconnect every queued message sends exactly once
  in order with no data loss. THIS is the bet's offline-first leg made real.
mvp_critical_status: |
  no done tasks under M4 yet — this is the FIRST M4 bundle (the exactly-once
  send-path spine). 4 of 4 bundle tasks still todo; all 4 trace to the success
  metric. The milestone's remaining mvp-critical scope (reconnect bulk-replay,
  connection-state indicator, pending/failed UI, ?after= catch-up pagination)
  is correctly deferred to a SECOND M4 bundle — not orphaned, not in this wave.

ok_rationale: |
  Every AC in this 4-task bundle traces cleanly to the milestone success metric,
  and the spine/UI split the decomposer authored is clean — nothing to peel off.

  Trace test, per AC:
  - 92d85e0e (idempotent message-send contract): remove it and exactly-once is
    unprovable — a replayed queued send double-posts; metric clause 2 ("sends
    exactly once ... no data loss") fails. mvp-critical AND the dependency root
    of the bundle (the client outbox is only safe once the server is exactly-once).
    KEEP.
  - 7332a4b8 (IndexedDB local store: cached reads + outbox table): bundles two
    concerns, but BOTH trace to the metric. The outbox table is required by
    9a4ab31d (clause 2 fails without it). Cached channel/message reads serve
    clause 1 verbatim ("keeps reading cached channels") — the metric conjoins
    both clauses with AND, so read-cache is mvp-critical, NOT nice-to-have. The
    two stores are one coherent lib (same apps/web/src/features/sync slice, same
    Dexie wrapper, same versioned IndexedDB schema, single SDK-research item);
    splitting outbox-only-now / read-cache-later would stand up the store
    infrastructure twice for no metric benefit. KEEP whole.
  - 9a4ab31d (outbox enqueue + optimistic-send integration): remove it and
    nothing is queued offline and nothing drains on send; clause 2 fails and the
    composer cannot stay enabled offline. mvp-critical. KEEP.
  - e29f6566 (offline send-path test harness): milestone ## Scope explicitly
    reads "heavily tested (fake-indexeddb unit + integration)" and the metric
    demands "no data loss" — the exactly-once core must be PROVEN, not asserted.
    Explicitly mvp-critical; over-cutting it would leave the highest-risk surface
    in the milestone unverified. KEEP.

  On the deferred surfaces (the over-cut guard): connection-state indicator,
  pending/failed message UI, ?after= keyset catch-up pagination, and
  reconnect-driven bulk-replay reconciliation are in M4 ## Scope but were already
  left OUT of this bundle by the decomposer for a second M4 wave. That split is
  clean: this wave is the indivisible exactly-once-send dependency root
  (idempotent server + store + single-attempt-drain outbox + tests). The metric
  is not fully satisfiable end-to-end until the reconnect-replay/UI bundle lands,
  but that is the NEXT M4 wave's job, not an over-cut of this one — this slice is
  the smallest coherent foundation everything downstream depends on.

  Net: no AC is nice-to-have, no AC can be split into a sibling without breaking
  the mvp-critical claim, and the wave is not too thin to be valuable. OK.

floor_constraint_active: false
floor_constraint_detail: |
  not applicable — OK was reached on the merits (every AC traces to the metric),
  not because a floor blocked a split. For reference: this is a multi-spec wave
  (4 tasks, est ~2800-3800 LOC) above the multi-spec floor (>2500 LOC or >=6
  specs), so a THIN split was never floor-blocked — it simply wasn't warranted.

sibling_visible: false
