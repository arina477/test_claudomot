verdict: THIN
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  "A class cohort runs coursework end-to-end in StudyHall without falling back to
  Discord: the teacher side is live (roles, assignment collect/return, scheduling)
  AND students can hold private 1:1 and small-group conversations outside class
  channels — real-time and offline-tolerant. First slice: direct + group messages.
  [Working target set by Claudomat 2026-07-04 on founder delegation; founder can
  adjust anytime.]"
mvp_critical_status: |
  The success-metric's literally-named deliverables (roles; assignment collect/return;
  scheduling; direct + group messages) ALL map to done tasks in M8 (6cf06f99, db8e082a/
  b859984b/1746f72a, 535bdb8c et al., a48f1910/32f5d29e/1ceffdc9/d8264800/10967558).
  The study-timer is NOT named in the success-metric prose — it is a ## Scope line-item
  ("study-group tools (shared timers/Pomodoro, study sessions, whiteboard)") advancing
  the same "study together, real-time" wedge, founder-chosen as the next slice. This
  wave's mvp-critical claim = a USABLE shared study timer (start a 25/5, everyone sees
  it counting, it auto-advances phases). Trace target for this verdict is that Scope
  line + the metric's "real-time" collaboration clause. Note for head-product: because
  the timer is Scope-not-metric, ceo-reviewer's ambition lens (not mine) owns whether
  this wave is the right next bet at all; mine is purely intra-wave AC thinness.

proposed_split:
  acs_to_keep:
    - ac: "Seed 1387d845 — persisted per-server timer row (phase, run state, started_at/ends_at) + membership-gated start/pause/reset control endpoints; non-members rejected"
      rationale: "Backend spine of a usable shared timer; nothing counts without persistence + start/reset. Pause/reset are the canonical Pomodoro control set — coherent primitive, cheap, keep whole."
    - ac: "Fan-out cb81bf03 — Socket.IO server-room broadcast of timer state on start/pause/reset/reconfigure/phase-change"
      rationale: "Without fan-out the timer is not SHARED — directly breaks the 'everyone sees the same running timer' mvp-critical claim + the metric's 'real-time' clause."
    - ac: "Widget c3daf6d3 — server-view timer widget: phase + live countdown + start/pause/reset controls, subscribes to fan-out"
      rationale: "The only member-facing surface; without it there is no usable timer. (Narrowed: drops any custom-duration config control per the configure split below.)"
    - ac: "Auto-advance + reconcile 832b83b7 — compute-on-read remaining, work->break->work auto-advance, reconnect/late-join reconciliation, paused-frozen"
      rationale: "Two load-bearing pieces fused on one compute-on-read substrate: (a) auto-advance IS the Pomodoro (a countdown that stalls at 0:00 and needs manual re-arm is not a Pomodoro; auto-advance is in the smallest-usable definition); (b) reconnect reconciliation is what makes a late joiner see the SAME timer — remove it and 'shared' breaks. Cannot cleanly split without fragmenting one correctness mechanism. Keep whole."
  acs_to_split:
    - ac: "Configure / custom work-break durations — the 'configure' control endpoint in seed 1387d845 + the 'durations are configurable' requirement + the widget's duration-config affordance"
      rationale: "Extensibility ahead of demand. The classic Pomodoro is 25/5 — hardcoding it delivers a fully usable shared timer that traces to the Scope line + 'real-time' metric clause unchanged. No cohort signal for custom durations in v1. Deferring it removes one endpoint + a validation surface + a widget config control + one D-block design affordance, while start/pause/reset + fan-out + auto-advance + reconcile all still deliver 'start a 25/5, everyone sees it counting, it advances phases.' Trace test: absent configure, is 'a class cohort studies together on a shared 25/5 Pomodoro, real-time' still satisfiable? Yes."
      sibling_task_seed:
        title: "Add configurable study-timer durations (custom work/break beyond the 25/5 default)"
        description: |
          The v1 shared study timer ships with hardcoded classic-Pomodoro durations
          (25 min work / 5 min break). This task adds member-configurable work/break
          durations: a membership-gated `configure` control endpoint that updates the
          per-server timer's stored durations, validation bounds, fan-out of the new
          config over the existing Socket.IO server-room event, and a duration-config
          affordance in the timer widget (reusing the shipped widget + gateway from
          the seed/fan-out siblings — do NOT stand up new surfaces).
          Acceptance sketch: a server member sets custom work/break durations via the
          API; the row persists them; the next start uses the configured values;
          other members see the updated config within realtime latency; invalid
          durations are rejected.
          Orchestrator INSERTs as a tasks row with milestone_id =
          84e17739-af5e-4396-beb9-b6f3d6836fc4, wave_id = NULL,
          parent_task_id = 1387d845-b8db-40cc-b6cb-a83d508ce3fe.

ok_rationale: |
  n/a — verdict is THIN.
floor_constraint_active: false
floor_constraint_detail: |
  The peeled AC (configure/custom-durations) is a small fraction of the wave — one
  endpoint + DTO/validation + one widget control + one design affordance (est.
  ~80-150 LOC). The residual wave (new persisted schema + Drizzle migration + timer
  service + start/pause/reset endpoints + RBAC + realtime gateway event + a new
  designed member-facing widget with live countdown + compute-on-read + reconnect
  reconciliation + phase auto-advance, spanning schema/service/realtime/widget across
  api + web) remains a coherent multi-surface multi-spec build. Removing ~100 LOC does
  not move the wave relative to its applicable floor. P-1 owns authoritative LOC sizing;
  if P-1 finds the residual genuinely under the multi-spec floor, its RESCOPE-AUTO-MERGE
  (merge more M8 Scope in) — not a reversal of this thinness call — is the correct fix.

sibling_visible: false
