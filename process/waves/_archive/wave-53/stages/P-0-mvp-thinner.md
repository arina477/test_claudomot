verdict: THIN
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  A class cohort runs coursework end-to-end in StudyHall without falling back to
  Discord: the teacher side is live (roles, assignment collect/return, scheduling)
  AND students can hold private 1:1 and small-group conversations outside class
  channels — real-time and offline-tolerant. First slice: direct + group messages.
mvp_critical_status: |
  no mvp-critical scope declared for this seed — fb1c367a is a wave-52 T-8 (V-2
  non-blocking, LOW info-disclosure) hardening seed, NOT a metric-advancing feature
  slice. It traces to no ## Scope item and satisfying it is not a precondition of
  the success metric (the metric is satisfiable with or without this leak fixed).
  All 16+ metric-advancing M8 slices (roles, moderation, assignments, scheduling,
  DMs, study-timer, focus-room) are already status=done. The trace test therefore
  cannot mark any AC here "mvp-critical to the metric"; the thinness call is instead
  the intra-seed separability the seed itself already names ("APP-WIDE error-handling
  pattern") — split the unbounded app-wide sweep from the verified single-site fix.

# THIN — proposed sibling split
proposed_split:
  acs_to_keep:
    - ac: "Fix the verified study-room.gateway.ts (~line 372) catch block so a non-UUID serverId in subscribe_server_rooms/create/join no longer forwards the raw Drizzle error verbatim to the client (query text + server_members table/column names + echoed caller userId)."
      rationale: "The ONE site verified live-leaking at wave-52 T-8 by penetration-tester; independently valuable — closes the actually-demonstrated disclosure. Coherent minimum slice on its own."
    - ac: "Introduce the reusable UUID-format guard at the payload/param parse layer (fix option a) AND/OR the generic-client-message-with-server-side-logging mapping (fix option b), applied to the study-room gateway as the first consumer."
      rationale: "The durable, reusable artifact the seed calls for ('a shared guard'); makes the study-room fix a pattern, not a one-off. Building the guard here is what makes the later app-wide sweep cheap and mechanical — keep it with the verified fix so the mechanism ships proven against a real leak."
  acs_to_split:
    - ac: "App-wide sweep: enumerate + remediate EVERY OTHER controller/gateway that casts a client-supplied serverId/roomId to a uuid column without format validation (same class as the wave-23 inherited non-UUID :serverId → 500), applying the shared guard to each."
      rationale: "Traces to NO ## Success-metric item — the metric is satisfiable regardless. It is unbounded hardening DEPTH built ahead of demand: no site other than study-room is verified-leaking (wave-23 was a 500, not a confirmed disclosure), the site count is unknown until an audit runs, and deferring it leaves the verified study-room fix + reusable guard fully shipped and valuable. Peeling it does not break any mvp-critical claim because none exists for this seed. Cleanly separable: it consumes the guard this wave builds rather than blocking on it."
      sibling_task_seed:
        title: "App-wide sweep: apply UUID-format guard to all remaining client-serverId/roomId uuid-cast sites (info-disclosure hardening)"
        description: |
          Follow-up to the wave-53 study-room info-disclosure fix (seed fb1c367a). That
          wave closed the one verified-leaking site (study-room.gateway.ts) and shipped a
          reusable UUID-format guard / generic-error-mapping mechanism. This task applies
          that mechanism app-wide.

          Problem: the same error-handling anti-pattern (controllers + gateways that take a
          client-supplied serverId/roomId and hit a uuid column without validating format,
          leaking raw Drizzle errors on cast failure — same class as the wave-23 inherited
          non-UUID :serverId → 500) may exist at additional, not-yet-verified sites across
          the app.

          Acceptance sketch: audit all controllers + gateways that cast a client-supplied
          id to a uuid column; for each such site, apply the shared guard (payload/param
          format validation) OR map non-Forbidden/unknown errors to a generic client message
          while logging detail server-side; add a negative test per remediated site proving
          a malformed id returns a generic (non-leaking) response and is still denied. Reuses
          the guard/mapping shipped in wave-53 — no new mechanism.

          Orchestrator INSERTs as a tasks row: milestone_id = 84e17739-af5e-4396-beb9-b6f3d6836fc4,
          wave_id = NULL, parent_task_id = fb1c367a-4f63-47a5-8f35-10a8d0fd492a, status = todo.

sibling_visible: false
