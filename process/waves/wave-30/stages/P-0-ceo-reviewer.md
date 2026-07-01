verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  This wave builds the sole unbuilt clause of M5's success metric — the assignment
  due-date reminder — after the post/view/mark-done clauses already shipped (tasks
  01fcefb8 + siblings + 916ecff7 all `done`). The 3-task bundle traces exactly to
  "get a reminder before it is due" with nothing missing and nothing gold-plated, so
  neither EXPANSION nor REDUCTION applies. Not SCOPE-EXPANSION: the obvious "more"
  (an in-app notification surface) is explicitly M7 scope ("Privacy controls,
  notifications & launch polish"), not M5's — expanding here would blur the milestone
  boundary the roadmap author already drew. Not SELECTIVE-EXPANSION: no cheap addition
  meets the disproportionate-value bar (the 24h window + email channel already make the
  reminder land). Not SCOPE-REDUCTION: all three tasks are load-bearing — tracking table
  is the idempotency substrate (an in-memory guard double-sends on redeploy), template
  is the testable-in-isolation send shape, cron is the loop itself.

bet_traced_to: Academic tools + offline-first win students from Discord
milestone_traced_to: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d — M5 — Academic tooling: assignments

# --- Strategic reasoning (four questions from the P-0 directive) ---

strategic_value: |
  THE right thing to build now — highest-conviction PROCEED in the milestone's arc.
  This is the direct execution of the founder's Path A decision (build reminders; Resend
  key now set) after 8 waves of M5/M3-tech-debt drain. The reminder is the bet-load-bearing
  headline: M5 ## Bet source reads "the academic tooling Discord lacks and Teams locks
  behind institutional provisioning" — a due-date reminder before an assignment is due is
  the single most concretely "school-aware" thing StudyHall does that Discord does not.
  Building it directly advances the live bet's differentiation thesis.

scope_hits_the_metric: YES
scope_hits_the_metric_detail: |
  M5 ## Success metric: "An organizer posts an assignment with a due date; members see it
  alongside chat, mark it done, and get a reminder before it is due." Clauses 1-2 (post +
  see + mark done) are SHIPPED. This wave delivers clause 3. And it delivers a reminder that
  actually LANDS, per the seed's ACs:
    - 24h reminder window ahead of now (timely — "due soon", not a stale ping)
    - recipients scoped to server_members (right audience, respects membership)
    - skips members whose assignment_status.state='done' (does not nag people who finished —
      this is what makes it feel useful rather than spammy)
    - idempotent send-once via UNIQUE(assignment_id,user_id) + ON CONFLICT DO NOTHING
      (a second cron tick never double-sends — the failure mode that would make students
      mute the feature)
    - non-throwing send + per-server guard (one bad recipient/server can't abort the sweep)
  This is a genuinely useful, timely reminder — not a checkbox. Scope hits the metric.

ambition_calibration: |
  Ambitious ENOUGH and not over-built. ~1,800 LOC across cron + tracking table + template
  reusing the already-Resend-wired EmailService is the right size to close the metric.
  Not too thin: the tracking table + idempotency is the non-negotiable substrate that
  separates a real reminder system from a demo that double-sends on redeploy — this bundle
  correctly includes it rather than punting durability. Not too grandiose: no retry queue,
  no per-user reminder-preference settings, no digest batching, no multi-window (7d/24h/1h)
  escalation — all of which would be gold-plating for a self-use-mvp with zero real users.

email_only_vs_in_app: SAFE MVP DEFAULT — not a founder-flag
email_only_vs_in_app_detail: |
  M5 ## Scope names the channel explicitly: "due-date reminder notifications (cron +
  NotificationsModule via Resend)." Resend = email. In-app notification is NOT in M5 scope,
  and M7 ("Privacy controls, notifications & launch polish") is the roadmap author's own
  designated home for a notification surface. So email-only is the correct MVP to close M5,
  and in-app is legitimately deferred to M7 by the roadmap's own structuring — the call was
  already made when M5 was authored. This does NOT need a founder poll (rule 17): the founder
  already chose Path A knowing the M5 scope, the channel is pre-decided in scope prose, and
  re-polling a settled scope decision would violate rule 16/17. Note for the record only.

closes_m5: YES — this is the milestone-closing wave for the success metric
closes_m5_detail: |
  If this ships + verifies, all three success-metric clauses are met and M5's differentiator
  feature is complete → M5 eligible to close → N-block promotes the next milestone. A genuine
  inflection after 8 debt waves.
  CAVEAT for N-block (not a P-0 scope concern): M5 has 6 open non-seed tasks at review time —
  5 assignments tech-debt/test-hardening (3ad35a42, 4b397de0, 6f257c82, 72cb6ebb, 226c7e42)
  + 1 re-homed presence-dots follow-up (fdb444fc, from M3). Per roadmap-lifecycle Invariant #3
  (all WHERE milestone_id=M5 children terminal before close) and the wave-19 M3-closure
  precedent, N-1 must DISPOSE of these (re-home forward or cancel) before flipping M5 → done.
  NONE is unshipped success-metric scope, so they do not block metric-completion — but they
  do block the mechanical close. Flagging so N-block plans the disposition rather than
  discovering it. This is the ONLY open item between this wave and M5 closure.

proposed_scope_change: |
  None. HOLD-SCOPE — the 3-task bundle is exactly the metric-closing slice at the right size.

sibling_visible: false
