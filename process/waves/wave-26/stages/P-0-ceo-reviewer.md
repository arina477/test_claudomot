verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The task is a small, correctly-sized completion of a presence surface shipped in
  wave-14 — extending the ONE existing /presence subscription and the shared presence-dot
  primitive to message-row author avatars. It is not timid (SCOPE-EXPANSION would be wrong:
  a bigger presence treatment — study-status, hover cards, DM affordances — is premature at
  ~0 users and does not advance either live-bet pillar). It is not grandiose (SCOPE-REDUCTION
  would be wrong: this is already the minimal slice — one row-render change against an existing
  socket + primitive, no new data plane). And it is genuinely worth doing (DROP would be wrong:
  it closes a visible inconsistency in the shipped chat surface and is the highest user-visible,
  now-verifiable slice of the workable M5 backlog while the M5 headline is cred-blocked). The
  bar here is execution quality, not scope change — HOLD-SCOPE.
bet_traced_to: "Academic tools + offline-first win students from Discord (live)"
milestone_traced_to: "a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d — M5 — Academic tooling: assignments (active; this task is re-homed M3 presence debt worked while the M5 headline is Resend-key-blocked)"
proposed_scope_change: |
  None. Explicitly HOLD at the seeded scope:
    - Render the live presence dot on message-row author avatars, from the existing single
      /presence subscription + the shared presence-dot primitive.
    - Graceful degrade on unknown/absent presence (no dot, no error) — this is the load-bearing
      quality bar, since message history includes authors who may be offline or no longer members.
    - No second socket / no new subscription (reuse the wave-14 presence store).
  Boundary I explicitly decline to expand: the seed's "any member-mention/hover affordance
  already present" clause stays MINIMAL — reuse whatever hover/mention affordance already exists;
  do NOT author new hover cards, study-status, or DM-presence affordances this wave. Those are
  a separate, deferrable slice with real design surface, and at ~0 users they are gold-plating
  that competes with bet-load-bearing work (assignments, offline-first) for wave budget.

reconsider_reasoning: n/a

strategic_notes: |
  1. RIGHT THING vs the other M5 workable candidates (invite-rotation d058283d, presence-perf
     6a546c7b, cleanup d23a0740): AGREE with N-2's pick. Of the four re-homed-debt candidates,
     this is the only USER-VISIBLE one, and the wave-25 bundled-chromium (T-5) fix just made its
     UI verification unblocked — so it is both the most valuable AND the most now-shippable. The
     other three are correct-but-invisible (perf, cleanup) or a security-hardening task
     (invite-rotation) that carries zero current exposure at 0 prod servers and is additive/no-rework
     — safe to keep tracked and sequence later. No reason to reorder.

  2. AMBITION CALIBRATION: correctly sized (a message-row dot, no more). NOT too thin — a "more
     complete presence treatment" (hover cards, DM affordances) would add design + data surface
     with no user to reward it and would blur into gold-plating (case (b) of the judge). NOT too
     thick — this is the minimum slice that closes the visible inconsistency (member panel shows
     presence; message authors don't). The presence-dot primitive + single subscription already
     exist, so the marginal cost is genuinely low and the marginal value (surface consistency in
     the core chat view students live in) is real. This is a HOLD, not an expansion.

  3. WEDGE ALIGNMENT — the honest strategic read: presence is Discord-PARITY table-stakes, not
     the differentiating wedge. The live bet's two pillars are (a) academic tooling and
     (b) offline-first reliability; "who's online now" is neither. It supports the
     real-time-study-together feel but does not, by itself, move the displace-Discord needle —
     Discord already has presence. So I am NOT crediting this wave with advancing the bet's
     falsifier; I am crediting it with completing a shipped surface to production grade and
     draining the highest-visibility workable-debt slice while the bet-load-bearing M5 headline
     is externally blocked. That framing is why the answer is PROCEED-at-minimal, not EXPAND.

     The MORE ambitious presence play the prompt floats — study-status ("in a study room",
     "focusing", course tags) — IS genuinely wedge-differentiating (it is academic-aware presence,
     which Discord lacks). But it is premature here: it needs its own design brief, a status data
     model, and real users to tune against. At ~0 users, shipping a full academic-status system now
     is exactly the "9/10 when a 3/10 was sufficient" trap. I recommend it be captured as a
     TRACKED future idea (a candidate for an M-later academic-presence slice or a roadmap-refresh
     item), NOT folded into this wave. Recording it here so it is not lost — but it does not change
     this wave's disposition.

  4. RESEND-KEY ESCALATION — LOUD, unchanged: The M5 HEADLINE (assignment due-date reminders via
     cron + Resend, the literal success-metric clause "get a reminder before it is due") remains
     cred-blocked on the founder's Resend API key and is the SOLE M5-close blocker. This wave does
     NOT touch it and does NOT resolve it. M5 cannot close on presence-polish + invite-rotation +
     perf + cleanup alone — the reminder path is bet-load-bearing (it is the academic-tooling
     differentiator Discord lacks). The Resend cred-ask must stay surfaced to the founder every
     checkpoint until answered; this presence wave is workable-debt drainage AROUND the blocker,
     not progress THROUGH it. If the founder key does not arrive, M5 will exhaust its user-visible
     workable backlog and stall on the headline — that is a founder-action dependency, not a
     scoping problem this wave can fix.

  Mediation note (ceo-reviewer vs mvp-thinner): milestone ## Class is `product-feature`, so
  mvp-thinner is also spawned. I am NOT proposing SCOPE-EXPANSION or SELECTIVE-EXPANSION, so the
  P-0 mediation-precedence rule does not engage — HOLD-SCOPE does not compete with a THIN verdict.
  If mvp-thinner returns THIN on a task this small (a single row-render change against an existing
  primitive), head-product should note that a further AC-split would leave a non-shippable sliver;
  I would defer to head-product but flag that this task is already at the atomic floor.

sibling_visible: false
