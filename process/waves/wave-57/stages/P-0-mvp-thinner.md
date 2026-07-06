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
  All mvp-critical M8 scope is done. Per wave-55 N-1 disposition, the substantive
  M8 scope is SHIPPED (36 done tasks: educator role + light moderation, assignment
  collect/return, scheduling, study-group tools, DMs + group DMs); the success
  metric is substantively met. The 6 open M8 tasks — including this seed — are
  debt/polish, NOT headline scope. This wave therefore contributes no mvp-critical
  AC; the milestone metric is already satisfiable without it.

# OK — current scope is well-classified (single coherent unit, nothing to split);
# floor did NOT block a THIN (there was no valid THIN to block).
ok_rationale: |
  The seed is a single-root-cause UI papercut fix: on the DM surface, both the
  ServerRail selectServer path and the Home button fail to clear dmHomeActive, so
  returning to a server/channel takes a swallowed first click + a second click. The
  fix (setDmHomeActive(false) on both handlers, or lifting the reset into the
  server-select handler in AppShell) + one test is one indivisible coherent unit —
  both handlers share the same missing-reset cause in the same file. There is no AC
  to shift into a sibling: fixing only one path (e.g. selectServer, deferring Home)
  would ship a half-fix that leaves the papercut live on the un-fixed path, and any
  sibling would touch the identical state + file. That is the minimum-size floor's
  anti-goal, not a legitimate thinness split. The wave traces to zero mvp-critical
  ACs (the M8 metric is silent on this papercut and already substantively met), so
  there is nothing to peel off. Not OVER-CUT: fixing both handlers together IS the
  right coherent unit, and removing a deterministic desktop double-click papercut is
  independently valuable. Sub-floor (~a few LOC + a test) is expected here and is a
  P-1 concern (floor-override-ship by rule, matching the established M8
  hardening-tail pattern — every prior straggler shipped sub-floor by rule); it is
  NOT a thinness signal and I do not recommend reducing or padding the wave.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — no THIN was proposed, so the floor did not block anything. (For the record:
  the wave is sub-floor at ~a few LOC, but that is because the seed is a genuinely
  minimal single-root-cause fix, not because a split was suppressed. P-1 owns the
  floor-override-ship decision.)

sibling_visible: false
