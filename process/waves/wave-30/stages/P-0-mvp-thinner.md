verdict: OK
verdict_source: mvp-thinner
milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
milestone_title: "M5 — Academic tooling: assignments"
milestone_class: product-feature
milestone_success_metric: |
  An organizer posts an assignment with a due date; members see it alongside
  chat, mark it done, and get a reminder before it is due.
mvp_critical_status: |
  1 of 1 mvp-critical scope items still pending. The assignments feature spine
  (post/CRUD, per-member todo/done, due-date sort, assignments-panel page +
  assignment-card primitive, manage_assignments authz) is DONE (12 done tasks).
  The reminder loop — "get a reminder before it is due" — is M5's SOLE unbuilt
  ## Scope item and the last unsatisfied clause of the success metric. This
  wave's 3 tasks deliver exactly that clause. After 8 consecutive debt
  floor-merges (w16/w23–w29) this is the first wave that IS M5-mvp-critical:
  founder resolved the park-or-key fork to Path A, RESEND_API_KEY_AUTH is set.

# OK — the 3-task bundle IS the minimal coherent set that satisfies the metric.
# Each traces cleanly; none is splittable without breaking the mvp-critical claim.
ok_rationale: |
  All three ACs are load-bearing on the single unsatisfied metric clause "get a
  reminder before it is due," and each is the minimum, not gold-plated:
  (1) seed 4a4c2715 (cron scan + NotificationsModule + send) — the reminder loop
  itself; removing it leaves the metric unsatisfiable. (2) sibling c5c30363
  (assignment_reminder tracking table) — the send-once idempotency substrate;
  remove it and every cron tick re-sends, turning "a reminder" into duplicate
  spam, which fails the metric's spirit (a reminder, not repeated ones). An
  in-memory guard is not a substitute (resets on redeploy → double-send). (3)
  sibling 0ba853e2 (reminder email template + EmailService.sendAssignmentReminder)
  — the message the member actually receives; without a rendered subject/body
  there is no reminder to get. The three are one indivisible send-once-reminder
  slice: cron (when) + tracking table (once) + template (what). Splitting any one
  to a sibling would ship a wave that does NOT deliver the metric — an OVER-CUT,
  not a THIN. Precedence note (below): as the M5-mvp-critical wave, mvp-thinner
  WINS ties vs ceo-reviewer expansion per the mediation rule.
floor_constraint_active: false
floor_constraint_detail: |
  N/A. No THIN was proposed, so no floor pre-check was needed. Note separately:
  this wave will likely still fall UNDER the multi-spec floor (~3 small specs),
  continuing the w23–w29 under-floor pattern — but that is P-1's floor-merge
  concern, not an mvp-thinner re-classification. The correct P-1 disposition here
  differs from prior waves: this is NOT debt-padding a cred-blocked milestone —
  it is the genuine mvp-critical slice, so the floor-merge (if invoked) ships the
  RIGHT scope for the first time in 8 waves.

# ---------------------------------------------------------------------------
# KEEP-OUT LIST (mandatory anti-gold-plating guard for B-block)
# These are NOT ACs in the bundle. mvp-thinner flags them so the build does not
# let them creep in. Each fails the trace test — the metric "get a reminder
# before it is due" is fully satisfiable WITHOUT any of them at 0 users. If any
# appears in the build, it is unrequested scope; route it to a future M5/roadmap
# sibling, do NOT build it in wave-30.
keep_out:
  - item: Per-user reminder preferences / opt-out / unsubscribe management UI
    why_out: "Metric needs the reminder to arrive, not to be configurable. 0 users, single test org. Future M7 (privacy/notifications) territory."
    decomposer_status: "Correctly EXCLUDED — no AC mentions preferences; recipient set is derived purely from server membership + not-done status."
  - item: Configurable reminder-window per assignment (organizer picks 1h/3d/etc.)
    why_out: "A FIXED default window satisfies the metric. Seed AC hard-codes 'due within the next 24h' — this is the correct MVP call, not a gap."
    decomposer_status: "Correctly EXCLUDED — seed AC explicitly fixes the window at ~24h; no config surface authored. See fixed-default flag below."
  - item: Digest / batched reminder emails (one email summarizing N due assignments)
    why_out: "Metric is per-assignment 'a reminder before it is due.' One email per (assignment,member) is simplest and sufficient. Batching = optimization at 0 volume."
    decomposer_status: "Correctly EXCLUDED — send loop is per-recipient-per-assignment; tracking table keyed (assignment_id,user_id)."
  - item: SMS / push / any non-email channel
    why_out: "Metric says 'reminder'; email via the already-chosen Resend SDK is the sole channel in M5 ## Scope ('cron + NotificationsModule via Resend'). Any other channel = new SDK, new bet."
    decomposer_status: "Correctly EXCLUDED — all three tasks are email-only via EmailService/Resend."
  - item: In-app notification center / bell / unread-reminder inbox UI
    why_out: "Metric is satisfied by the email landing. An in-app center is a whole new surface (page + primitive + realtime) unrelated to the due-date reminder clause."
    decomposer_status: "Correctly EXCLUDED — NotificationsModule here is a server-side cron host, NOT a user-facing notifications feature. Watch the NAME does not tempt the build toward an inbox UI."
  - item: Reminder-history UI / 'reminders sent' admin view
    why_out: "The tracking table is an internal idempotency substrate, not a queryable feature. Metric needs no history surface."
    decomposer_status: "Correctly EXCLUDED — c5c30363 AC scopes the table to dedupe only (INSERT ON CONFLICT DO NOTHING); no read-API, no UI."
  - item: Multiple reminders per assignment (e.g. 24h + 1h + overdue nudge)
    why_out: "Metric is 'A reminder' (singular) before it is due. One send-once reminder in the 24h window satisfies it. Multi-stage cadence is polish ahead of demand."
    decomposer_status: "Correctly EXCLUDED — UNIQUE(assignment_id,user_id) enforces exactly ONE reminder per member per assignment. This is a deliberate MVP constraint, not a bug — do NOT 'improve' it to multi-reminder in the build."

# ---------------------------------------------------------------------------
# FIXED-DEFAULT FLAG (single product-decision that must stay a constant, not a feature)
fixed_default_flag:
  decision: "Reminder window = a single hard-coded constant (~24h before due, not-yet-past)."
  ruling: "KEEP HARD-CODED for MVP. This is a fixed default, NOT a configurable feature."
  rationale: |
    The seed AC already hard-codes '24h'. That is correct. Making the window
    per-assignment- or per-org-configurable is the 'configurable reminder-window'
    keep-out item above — a feature the metric does not need at 0 users. B-block
    must NOT surface it as an organizer setting, an env var knob presented to the
    founder, or a DB column. A single named constant in the reminder service (so
    a future wave can lift it to config cheaply if demand appears) is the ceiling.
  flip_trigger: "First real org asks for a different lead time → lift the constant to config then. One constant → trivial later migration; do not pre-build."

# ---------------------------------------------------------------------------
# OVER-CUT SELF-CHECK (is the bundle SO minimal it fails the metric?)
over_cut_self_check: |
  Checked — the bundle is NOT over-cut. The 3 tasks together produce: an hourly
  cron that finds due-soon assignments, resolves server members (respecting
  membership, skipping done), sends each a branded email once, and survives
  redeploy without double-sending. That is end-to-end sufficient for "members get
  a reminder before it is due." No fourth task is required to satisfy the metric —
  the assignments spine, due_date, assignment_status, EmailService, and the
  (server_id,due_date) index all already exist (done). Hard-coding the window is
  fine for MVP (see fixed-default flag). One watch-item for the GATE (not a
  thinness cut, flagged for head-product / T-block): the send-once + non-throwing
  + skip-done contracts are correctness ACs — if any is dropped during build the
  metric degrades (spam / crash / reminding finished members). Those are Build/Test
  concerns, not scope to thin.

# ---------------------------------------------------------------------------
# MEDIATION PRECEDENCE NOTE (per P-0-frame.md § Mediation precedence)
mediation_note: |
  This wave delivers M5's unmet mvp-critical success-metric clause. Under the
  mediation rule, when the milestone has an mvp-critical unmet metric that THIS
  wave delivers, mvp-thinner's minimal-set ruling WINS ties against ceo-reviewer
  SCOPE-EXPANSION. Concretely: if ceo-reviewer proposes adding any keep-out item
  (multi-reminder cadence, opt-out, in-app center, configurable window) to
  "make M5 land stronger," mvp-thinner holds the line — those are post-metric
  polish and belong in a future M5/M7 sibling or roadmap-refresh, not this wave.
  head-product mediates only if ceo-reviewer's expansion is argued to be part of
  the metric itself (it is not — the metric is satisfied by one branded email
  before due). Ship the minimal send-once-reminder slice; close M5 on its metric.

sibling_visible: false
