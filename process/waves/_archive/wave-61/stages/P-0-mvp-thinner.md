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
  M8 mvp-critical scope is SHIPPED. 40 of 42 M8 tasks are status='done' spanning
  every ## Scope clause: educator role + light moderation, assignment collect/return
  (no grading), class scheduling/calendar, study-group tools (shared/Pomodoro timers,
  focus rooms), direct + group DMs (real-time fan-out + offline-tolerant outbox),
  and info-disclosure hardening. Only 2 todo rows remain: this seed (874bd233, a LOW
  read-path throttle-tuning drainage item) and 999a14d1 (candidate pagination,
  explicitly deferred to a real large-server scaling wave). The success metric is
  already satisfiable — DMs are LIVE, real-time, and offline-tolerant; V-1 jenny
  drove the full DM start+send flow clean (0 console errors, no broken journey).
  This is the intentional low-value M8 tail drain.

ok_rationale: |
  The seed's two named parts — (a) align the /dm/candidates and /dm/conversations
  read-path throttle buckets (server config) and (b) add exponential backoff on
  message-poll 429 (read-path) — are ONE coherent AC, not two splittable ACs. They
  attack a single symptom (429-under-load on legitimate message-poll) and the task
  description itself states they are causally linked: the candidates throttle bucket
  is the "suspected root" of the message-poll 429s. Part (a) fixes the cause; part (b)
  hardens the same read-path against residual/transient 429s. Both live on one module
  (the DM controller), no schema, no contract. There is no "keep vs split" partition
  to draw here — splitting the backoff into a sibling would sever two halves of one
  fix, leaving an incomplete server-only change in this wave and a client-only patch
  that reads as orphaned polish in a sibling. Neither part is individually mvp-critical
  (the trace test returns "yes, still satisfiable" for the whole seed), so there is
  nothing to peel toward the mvp-critical floor either — the entire item is a
  post-metric polish/tuning drainage slice by design.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — no THIN was blocked by a floor. The seed is already an intentionally sub-floor
  single-module drainage item (LOW impact, no schema/contract). Any split would push
  both fragments further below floor and reduce coherence, so a split was never the
  right call on merits, independent of the floor.

sibling_visible: false
