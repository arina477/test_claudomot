verdict: OK
verdict_source: mvp-thinner
milestone_id: 8d88e691-5e39-492f-83a9-73a1a9440af3
milestone_title: "M11 — Growth: server discovery"
milestone_class: product-feature
milestone_success_metric: |
  A student can DISCOVER and JOIN public study communities they are not already in —
  browse/search a public directory of study servers, see what each community is about
  (name, description, topic/size), and join with one click — turning StudyHall from
  invite-only into a discoverable network (the network-effect leg toward the
  weekly-active-students north star). [Working target set by Claudomat 2026-07-06 on
  founder Option-A directive "move to the next roadmap theme, your pick"; founder can
  adjust anytime.]
mvp_critical_status: |
  no mvp-critical scope declared yet as a separate list — M11's first bundle (3 tasks:
  609c9bdd seed + 37b78777 + e363dac2 siblings) is the seed decomposition of the
  milestone's single ## Success metric; all 3 are todo, none done. Every AC in the
  bundle traces to a clause the founder's success metric names verbatim.

# OK — the 3-task bundle is the coherent minimal discover -> see -> join slice.
# Every candidate peel axis probed below maps to a clause the success metric names
# explicitly, so nothing is peelable without breaking the mvp-critical claim.
ok_rationale: |
  This is a well-classified minimal discover -> see -> join slice; no non-mvp-critical
  heft to split. The founder's success metric is unusually explicit and every AC traces
  to a clause it names verbatim:
  (1) SEARCH — the metric says "browse/SEARCH a public directory of study servers."
      Search is named in the metric, not inferred. Under the hard rule "never improvise
      the founder's success metric," search in the discover endpoint (seed) + UI (37b78777)
      is mvp-critical by the letter of the metric — not a deferrable follow-up. The
      "low server counts -> plain list works" argument is a plausible thinness case in the
      abstract, but it contradicts the metric's explicit wording, so it does not survive
      the trace test here.
  (2) TOPIC + MEMBER COUNT — the metric says "see what each community is about (name,
      DESCRIPTION, TOPIC/SIZE)." description, topic, and member_count (size) are each
      named in the metric prose. They are the "see what a community is about" substance,
      not polish-sibling richness. Peeling topic or member-count would leave the metric's
      "topic/size" clause unsatisfiable. Kept.
  (3) PAGINATION (seed) — not named in the metric, but scoped as "basic pagination
      (limit + offset)" = a defensive bound on an otherwise-unbounded directory query,
      not a load-more UX build-ahead. An unbounded directory list is a real correctness
      problem even at low counts, and this project already settled the always-safe
      defensive-LIMIT posture at wave-56 (getDmCandidates). It is cheap correctness on
      the seed's own query, not splittable heft.
  (4) ONE-CLICK JOIN (e363dac2) — the metric says "join with ONE CLICK." Discovery
      without join is a dead end (browse -> see with no join does not satisfy the metric).
      mvp-critical; reuses joinViaInvite core (no second membership abstraction). Kept.
  The bundle also already fences the genuinely deferrable M11 heft OUT of this wave in
  the seed/sibling prose: moderation/safety on public join, ranking/recommendation,
  categories browsing, and trending are explicitly assigned to LATER M11 bundles. That
  is the nice-to-have set for this milestone, and it is correctly already excluded — so
  there is nothing left inside the proposed scope to peel. Splitting further would push
  below a usable discover -> join slice (OVER-CUT territory), which I am not recommending.
floor_constraint_active: false
floor_constraint_detail: |
  n/a — OK is on the merits (every AC traces to a metric clause), NOT floor-blocked.
  No THIN was suppressed by the minimum-size floor; the ~2200 LOC estimate is not a
  factor in this verdict.

sibling_visible: false
