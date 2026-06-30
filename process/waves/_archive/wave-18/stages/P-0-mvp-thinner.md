verdict: THIN
verdict_source: mvp-thinner
milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
milestone_title: M3 — Real-time messaging
milestone_class: product-feature
milestone_success_metric: |
  Two students in a channel exchange messages in real time (<1s delivery),
  with reactions, threads, and attachments working.
mvp_critical_status: |
  threads sub-clause still pending — this wave delivers it. Of the bundle's 3 tasks,
  the data plane (497c2ae6) + thread-view panel (6c008dd6) are the mvp-critical
  threads slice; outbox-parity (0b728319) is a forward-consistency item for M4,
  not required for the threads sub-clause to be satisfiable this wave.

proposed_split:
  acs_to_keep:
    - ac: "497c2ae6 — thread-reply data plane (thread_parent_id one-level, reject reply-of-reply/cross-channel parent; GET replies oldest-first; parent reply_count+last_reply_at transactional; thread-scoped realtime over /messaging; idempotency reuse)"
      rationale: "Indivisible core. The success metric's 'threads working' is unsatisfiable with no reply data plane — there is nothing to read or write. Keep."
    - ac: "6c008dd6 — thread-view side panel + in-list affordance (reply count + last-reply when reply_count>0; click → panel with parent pinned + replies + composer)"
      rationale: "Threads with no panel/affordance are invisible: two students cannot SEE or open a thread, so 'threads working' is not demonstrable. The affordance is what makes threads discoverable; it is the user-facing half of the same indivisible core. Keep."
  acs_to_split:
    - ac: "0b728319 — outbox parity: thread-reply sends use the same optimistic outbox (pending/failed/idempotency) as top-level"
      rationale: >
        Trace test against the success metric: if this AC were absent, can two students still
        exchange thread replies in real time with 'threads working'? Yes. The seed (497c2ae6)
        already delivers idempotency-keyed reply create + thread-scoped realtime fan-out, and the
        panel (6c008dd6) already specifies an optimistic append + live convergence on the thread
        event. A reply therefore sends, appears for both students in real time, and reconciles —
        the success metric is met. Outbox PARITY (a pending-row + retryable-failed-state model
        matching top-level) is robustness, not threads-usability. Its OWN stated rationale is
        forward-looking — "M4 (offline builds on the messaging path) will have an inconsistent
        send model to build on" — a consistency argument for the NEXT milestone, not a
        threads-working argument for THIS one. That is the signature of a nice-to-have relative
        to M3's success metric: it serves M4's foundation, not M3's metric. Split to a sibling
        under M3; it is naturally claimable before or alongside M4's first wave.
      sibling_task_seed:
        title: "Extend optimistic-send outbox parity to thread replies"
        description: |
          Top-level messages send through an optimistic outbox with pending/failed row states;
          thread replies should reach the same parity so the M4 offline build inherits one
          consistent send model. Bring thread-reply sends to outbox parity: a reply shows
          pending immediately, reconciles on server ack via idempotency_key, and surfaces a
          retryable failed state on error, with no duplicate on retried connectivity.
          Acceptance: a thread reply enqueues into the same optimistic outbox as a top-level
          message, renders pending instantly, reconciles (replacing the optimistic row) when
          the server thread event/ack matches the idempotency_key, and shows failed-with-retry
          on error; retried reply does not duplicate. No new outbox mechanism — extend the
          existing one to carry thread_parent_id. Consumes the wave-18 seed's idempotency-keyed
          reply create + thread realtime event and the panel's optimistic-append surface.
          (Orchestrator INSERTs as a tasks row: milestone_id = 6198650e-f4e0-44dc-9b0a-6550f01f9f82,
          wave_id = NULL, parent_task_id = 497c2ae6-844b-4910-9f21-677a536d2dc2.)

over_cut_rationale: ""

ok_rationale: ""
floor_constraint_active: false
floor_constraint_detail: |
  FLOOR PRE-CHECK (mandatory). wave_type = multi-spec (3 claimed tasks). Applicable floor:
  net LOC > 2,500 OR claimed_task_ids.length >= 6.
    - current_wave_loc_estimate: ~2,800 LOC
    - LOC of AC proposed to split (0b728319 outbox parity): ~500–700 LOC
    - residual_loc after split: ~2,100–2,300 LOC
    - residual task count: 2
  THE SPLIT WOULD PUSH THE WAVE BELOW THE 2,500-LOC FLOOR AND TO 2 SPECS (< 6).
  This is a genuine floor tension. However, per P-1 § Minimum size floor, RESCOPE-AUTO-MERGE
  is P-1's authority, not mine, and the project has an established precedent (wave-16
  product-decision) that floor handling is a P-1/BOARD call with documented override paths
  (§2b resolutions a/b/c). I therefore emit THIN — the correct AC-level classification — and
  flag the floor tension explicitly for head-product / P-1 to resolve. Resolution options at
  P-1, in preference order:
    1. Accept the split AND let P-1 decompose ONE adjacent M3 ## Scope sibling into this wave
       to restore the floor (attachments or the deferred member-list/polish items remain in
       ## Scope) — keeps the wave above floor without forcing in non-mvp-critical thread polish.
    2. If no clean adjacent sibling, P-1 may keep 0b728319 in-wave under §2b override-ship,
       logging that the floor blocked an otherwise-valid thinness split (the wave-16 exemption
       precedent applies the same reasoning inverted).
  I do NOT set floor_constraint_active:true here because that field is reserved for an OK
  verdict where the floor BLOCKED the split outright. My read is that the split is the right
  call and the floor is resolvable at P-1 (option 1), so the verdict stays THIN with this
  flag rather than collapsing to OK. If head-product judges option 1 infeasible, downgrade to
  OK + floor_constraint_active:true at merge.

sibling_visible: false
