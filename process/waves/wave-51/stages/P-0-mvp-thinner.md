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
  All mvp-critical M8 tasks are done. The DM/messaging success-metric core is
  fully shipped and LIVE — DM conversations schema + participant-gated backend
  (a48f1910 done), DM UI list/thread/composer (1ceffdc9 done), offline-tolerant
  send via outbox (d8264800 done), Socket.IO fan-out (32f5d29e done), start-picker
  entry (10967558 done), and who_can_dm privacy exclusion (03ccf636 done). The
  seed (39fc1c5e) is a cosmetic, non-blocking layout debt-fix on that already-shipped
  surface (V-2 triage of wave-46 T-6 finding F9). All remaining M8 todo rows
  (f8eb49c1, a1dda389, 5bcbd27f, 874bd233, c5051444, 344eabde) are likewise
  polish/hardening siblings, NOT unmet mvp-critical scope.

ok_rationale: |
  Single-AC atomic wave: the entire scope is one indivisible acceptance criterion
  — "on the DM route, the app shell drops the empty ~260px channel-sidebar column
  (route-aware layout) so the DM surface renders canonical 3-panel (server rail +
  conversation list + thread), the thread pane gets full width, re-verified at
  1024/1280." There is nothing to peel: the route-conditional, the resulting
  full-width thread, and the two-breakpoint re-check are inseparable halves of the
  same fix — split them and neither half satisfies "DM surface looks finished and
  thread no longer cramps at 1024." The AC does not itself trace to the milestone
  success metric (the metric — private 1:1 + group DMs, real-time + offline-tolerant
  — is already MET by the shipped DM core); this is cosmetic debt on a done surface,
  which is precisely why there is no mvp-critical sub-scope to defer. No candidate
  split-out exists, so no THIN. Correctly not OVER-CUT either — this is already the
  minimum coherent slice for a shipped-feature debt-fix, not a gutted feature wave.
floor_constraint_active: true
floor_constraint_detail: |
  current_wave_loc: est. well under 200 net LOC — a single route-aware conditional
    in the app-shell layout (gate the ChannelSidebar column off when the active
    route is the DM route → grid/flex column-count change) plus a responsive
    re-check at 1024/1280 (verification, near-zero production LOC).
  would-have-split LOC sum: 0 — no AC is a defer candidate; the fix is atomic and
    the milestone's mvp-critical DM core is already shipped, so there is no
    nice-to-have depth/polish/extensibility layer to peel off.
  residual after split: unchanged (= current_wave_loc) — a THIN split is not even
    on the table; floor is noted only to flag that this wave is legitimately below
    the single-spec >1,500-LOC floor.
  floor threshold: single-spec > 1,500 LOC (per P-1 § Minimum size floor).
  disposition: this is a reuse-heavy, non-blocking layout debt-fix on a LIVE
    surface — the same sub-floor exemption class recorded at wave-16 (test-infra)
    and wave-50 (feature-completion/regression). The LOC floor is a feature-sizing
    heuristic guarding against thin *feature* waves; it does not apply to a
    single-conditional cosmetic fix. mvp-thinner does not own the floor waiver
    (P-1 does), but flags that emitting anything other than OK here would be
    mis-scoped: there is no THIN to block and no OVER-CUT to invite.

# Scope-creep fences (advisory to P-1/P-2 — keep the wave atomic; do NOT let it grow)
scope_fences: |
  This is a route-aware column-drop, not a DM redesign. Hold the line against:
  - Do NOT redesign the DM layout, restyle, or re-space the 3-panel surface —
    only remove the redundant empty column and let the thread take its width.
  - Do NOT touch the conversation-list panel behavior, the composer, or thread
    internals — geometry only.
  - Do NOT add responsive breakpoints beyond the specified 1024/1280 re-check;
    no new mobile/tablet layout work (out of scope, separate slice if ever needed).
  - Do NOT fold in the sibling DM polish/hardening todos (5bcbd27f off-token
    substitutions, 874bd233 throttle/backoff, c5051444 candidate pagination,
    344eabde privacy positive-control) — they are independent seeds, not this AC.
  - Keep it a pure app-shell route-conditional; do not refactor the shared
    server-channel 4-col layout beyond gating the one column off on the DM route.

sibling_visible: false
