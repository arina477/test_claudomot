verdict: THIN
verdict_source: mvp-thinner
milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
milestone_title: M3 — Real-time messaging
milestone_class: product-feature
milestone_success_metric: |
  Two students in a channel exchange messages in real time (<1s delivery),
  with reactions, threads, and attachments working.
mvp_critical_status: |
  Success-metric realtime core (send/receive <1s + reactions) already MET across waves 11-13
  (MessagingModule + send/list REST + /messaging gateway + composer/list UI + reactions + edit/delete).
  Threads + mentions + attachments remain unshipped under M3 ## Scope but are NOT in this wave's bundle.
  Presence + typing + member-list are ## Scope items, NOT in the literal success-metric sentence.

proposed_split:
  acs_to_keep:
    - ac: "Seed d1c4693d — /presence Socket.IO namespace (WS-upgrade auth reuse, ref-counted online/offline, membership-scoped fan-out, snapshot-on-join)"
      rationale: "Foundational data plane all visible surfaces render against; presence with no surface is invisible, so the seed only earns its value paired with a consumer. Keep."
    - ac: "058984c5 — member-list panel with live presence on server-channel-view"
      rationale: "The load-bearing visible surface for presence — the first and primary consumer that makes the seed's state perceivable. Cutting it would leave the seed invisible. Keep (ships with the seed)."
    - ac: "58633934 — typing indicators over /presence"
      rationale: "Genuine M3 ## Scope primitive ('presence + typing'), not polish; rides the same namespace so bundling avoids a second realtime build-out. Trace to metric is weak (not named in success metric), but it is kept this wave by the minimum-size floor (see floor note in OVER-CUT-avoidance below) and is a defensible same-namespace co-build, not a depth-on-unshipped-surface or premature-extensibility case."
  acs_to_split:
    - ac: "10b9d18e — presence dots on message-row author avatars + member affordances"
      rationale: "Pure polish AC. The success metric ('exchange messages in real time, with reactions/threads/attachments') is fully satisfiable without it. The presence wedge's visible value is already delivered by the member-list panel (058984c5); author-row dots are a SECOND rendering of presence state the member-list already exposes — depth/polish on a surface whose first-pass (member-list) is what carries the value. Deferring it does not break the presence+member-list slice or any success-metric clause."
      sibling_task_seed:
        title: "Add presence dots to message author rows in server-channel-view"
        description: |
          Render the shared presence-dot primitive on message-row author avatars in
          server-channel-view, driven by the same live /presence subscription/store the
          member-list panel established, so a reader can tell at a glance whether a message
          author is currently online.

          Acceptance sketch: message-row author avatars show a presence dot reflecting the
          author's current online/offline state, updating live; uses the shared presence-dot
          primitive/token set (no second styling source); degrades gracefully when an author's
          presence is unknown (not a current co-member); opens NO additional /presence socket
          connection — reuses the member-list panel's presence client/store.

          Deferred because the presence+member-list slice (seed d1c4693d + 058984c5) already
          delivers the visible presence surface; author-row dots are an additive second
          rendering with zero rework risk to that slice. Pick up in a follow-up M3 presence-polish
          wave (or fold alongside threads/mentions/attachments).
          The orchestrator INSERTs this as a tasks row with
          milestone_id = 6198650e-f4e0-44dc-9b0a-6550f01f9f82, wave_id = NULL,
          parent_task_id = d1c4693d-b793-4960-8adf-f561aad20677.

ok_rationale: |
  n/a — verdict is THIN. (Floor permits exactly one cut; see note below.)
floor_constraint_active: false
floor_constraint_detail: |
  FLOOR-AWARENESS NOTE (why only ONE AC is split, not two):
  Current wave LOC estimate ≈ 2,800. Applicable floor = multi-spec (> 2,500 LOC OR >= 6 specs).
  - Splitting author-row dots (10b9d18e ≈ 150 LOC): residual ≈ 2,650 LOC across 3 specs — ABOVE floor. PERMITTED.
  - ALSO splitting typing (58633934 ≈ 400 LOC): residual ≈ 2,250 LOC across 2 specs — BELOW the 2,500 multi-spec floor. REFUSED.
  Typing is therefore kept in-wave. It is also a defensible keep on merit (real ## Scope primitive,
  same-namespace co-build), so this is not the floor blocking an otherwise-clean cut — it is the floor
  confirming the right boundary. The single author-row-dots split is the correct thinning move and clears the floor.

sibling_visible: false
