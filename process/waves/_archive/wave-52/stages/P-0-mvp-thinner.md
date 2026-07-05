verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: "M8 — Educator role, assignment collect/return, scheduling, study-group tools, DMs + group DMs, message search"
milestone_class: product-feature
milestone_success_metric: |
  A class cohort runs coursework end-to-end in StudyHall without falling back to Discord:
  the teacher side is live (roles, assignment collect/return, scheduling) AND students can
  hold private 1:1 and small-group conversations outside class channels — real-time and
  offline-tolerant. First slice: direct + group messages. [Working target set by Claudomat
  2026-07-04 on founder delegation; founder can adjust anytime.]
mvp_critical_status: |
  All mvp-critical tasks NAMED IN THE SUCCESS METRIC are already done: roles
  (6cf06f99), assignment collect/return (db8e082a, 1746f72a, b859984b),
  scheduling (535bdb8c, cdf81427, 1216146e), DMs + group DMs (a48f1910, 1ceffdc9,
  32f5d29e, d8264800) are all status='done'. The wave-52 focus-room bundle
  (d123d9e0 + aad849ac + ef84b378) traces to M8's ## Scope study-group-tools /
  "study sessions" line — founder-authorized scope — but NOT to the quoted
  ## Success metric. It is a scope-legitimate, success-metric-optional slice.

ok_rationale: |
  A THIN split would have been arguable — the decomposer itself pre-flagged ef84b378
  (room-scoped synchronized Pomodoro) as the natural split point, and the body-doubling
  co-working loop is coherent at "join a room + see who is focusing together" (d123d9e0 +
  aad849ac) with the shared room timer as a defensible follow-on. BUT the decomposer's split
  condition was explicitly conditional: "IF room-scoping the existing timer proves to expand
  the wave past its floor/ceiling." At ~2,200 LOC across 3 tasks the wave is running UNDER
  the multi-spec floor (2,500 LOC OR >= 6 tasks), not over its ceiling — so the named split
  trigger has NOT fired. Peeling ef84b378 would push an already-sub-floor wave further below
  floor (see floor_constraint_detail). Every remaining AC traces cleanly to the study-group-
  tools / study-sessions ## Scope line, and the 3-task bundle is the smallest coherent slice
  that clears — the join surface, the visible roster, and the shared room timer together are
  the "active co-working session" draw; join+roster alone is a passive presence list, which is
  a weaker (not thinner-but-complete) slice. Scope fence confirmed clean: voice/video,
  persisted attendance/history, scheduled/reservable rooms, and multi-room moderation are all
  explicitly deferred in the seed prose — none leaked in. No intra-task peel warranted:
  create/name + open-rooms LIST are the affordance that makes multiple concurrent rooms
  legible (a single default room per server would collapse the product surface, not thin it).
floor_constraint_active: true
floor_constraint_detail: |
  current_wave_loc: ~2,200 (multi-spec, 3 tasks) — already below the multi-spec floor of
    2,500 net LOC OR claimed_task_ids.length >= 6 (this bundle is 3 tasks / ~2,200 LOC).
  would_have_split: ef84b378 (Scope shared study timer to focus room — per-room synchronized
    Pomodoro: service/gateway room-scoping + reconnect reconciliation + wave-50 custom-duration
    reuse), the heaviest of the three tasks, est ~700-900 LOC.
  residual_after_split: d123d9e0 (join-presence backend) + aad849ac (focus-room UI) ≈
    ~1,300-1,500 LOC across 2 tasks.
  floor_threshold: multi-spec floor is 2,500 LOC OR >= 6 tasks. Residual (~1,300-1,500 LOC /
    2 tasks) fails the multi-spec floor AND would even fail the single-spec floor (>1,500 LOC).
  conclusion: A THIN split-out of ef84b378 pushes an already-sub-floor wave FURTHER below
    floor. Per mvp-thinner floor-awareness (refuse THIN when residual would drop below the
    applicable floor), OK is emitted with floor_constraint_active: true. If P-1 decides the
    bundle is too thin overall, that is P-1's RESCOPE-AUTO-MERGE authority (add scope up),
    not mvp-thinner's — mvp-thinner never recommends a smaller wave, and here the floor blocks
    the only THIN move on the table. The decomposer's over-ceiling split trigger did not fire.

sibling_visible: false
