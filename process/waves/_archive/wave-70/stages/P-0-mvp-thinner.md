verdict: OVER-CUT
verdict_source: mvp-thinner
milestone_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
milestone_title: "M14 — Trust & Safety: moderation for public discovery"
milestone_class: product-feature
milestone_success_metric: |
  Before the founder-reserved public launch of the server directory:
  (1) any student can report any publicly-listed server, member, or message;
  (2) a report resolves through a working action loop — in-server takedown
      (remove / timeout / message-delete via `moderate_members`) AND directory-level
      unlist (abusive public server removed from `GET /servers/discover`);
  (3) a user can block another user, hiding the blocked user's DMs and content.
  Measurable gate: 100% of publicly-listed servers are reportable and a
  report → action → resolution path is verified end-to-end. This IS the
  public-launch gate — it MUST be met before public-launch-go.
mvp_critical_status: |
  2 of 3 success-metric clauses shipped. Clause (1) report-any + clause (2)
  report→action loop (in-server takedown + directory unlist) are LIVE across
  wave-69's 3 done tasks (9f2bb017 report substrate + directory unlist,
  d7250881 owner/mod action loop, 96d5ed58 student report UI + owner inbox).
  Clause (3) — user-to-user BLOCK (hide blocked user's DMs + content,
  cross-server, directory-safe) — is UNSHIPPED and has NO task in the milestone
  at all. Block is the single remaining mvp-critical item gating public launch.
  The wave-70 seed (cc783559) is NOT one of the three mvp-critical clauses —
  it is a cosmetic own-row Report-button suppression, explicitly labelled
  "Small UI-polish slice" in its own prose.

over_cut_rationale: |
  The wave as seeded is a single sub-20-LOC-exceeding cosmetic AC (hide the
  Report affordance on the viewer's own member row). Applying the trace test:
  if this AC were absent from M14 entirely, the `## Success metric` is FULLY
  satisfiable — the backend derives reporter_id from session, self-reports are
  inert data (the task itself states "Non-security ... self-reports are inert"),
  and no metric clause requires the own-row button hidden. It is therefore
  nice-to-have, not mvp-critical. There is exactly ONE AC in this wave and it is
  below any coherent slice floor, so there is nothing to split into siblings —
  this is a genuine OVER-CUT: a valuable-slice problem, not a thinness problem.
  Meanwhile the real mvp-critical remaining M14 item — success-metric clause (3),
  user-to-user Block — has no task authored at all, and the milestone's
  `## Class rationale` is unambiguous: "the directory cannot be publicly launched
  without it." Shipping a one-liner cosmetic wave leaves the launch gate exactly
  as far away as it is now while consuming a full wave loop.

  Recommended coherent slice (for head-product / P-1 to action):
  Expand wave-70 to the BLOCK feature — the substantive unshipped mvp-critical
  slice that advances the launch gate — and fold the cosmetic own-row fix
  (cc783559) in as trailing UI polish on the same wave. Concretely, a Block
  slice covers: (a) block substrate — a user_blocks relation (blocker_id,
  blocked_id, UNIQUE pair) + block/unblock endpoints deriving blocker_id
  server-side from session; (b) DM + content hiding — filter blocked users'
  DMs and messages from the blocker's view, cross-server (mirroring the existing
  soft-delete / visibility idioms, reusing message-visibility filtering rather
  than a second permission system per the milestone's "reuse, do not reinvent"
  mandate); (c) a block affordance on the member row / profile surface — which
  is the natural home for the same MemberListPanel/MemberItem prop-threading the
  cosmetic seed already touches, making cc783559 a coherent sub-part of the Block
  UI wave rather than a standalone cosmetic wave.

  NOTE ON AUTHORITY: mvp-thinner does not size waves and does not author bundles.
  Block currently has NO task row under M14, so expansion is a milestone-
  decomposition action (RESCOPE-AUTO-MERGE at P-1, or an N-1 next-bundle author),
  NOT an mvp-thinner sibling-split. This verdict flags the wave as too thin to be
  a valuable milestone-advancing slice and names the coherent target; head-product
  and P-1 own the actual expansion mechanism.

sibling_visible: false
