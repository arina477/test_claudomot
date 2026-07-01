```yaml
verdict: SELECTIVE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SELECTIVE-EXPANSION
mode_rationale: |
  Not HOLD-SCOPE: the seed as written is a genuine 3/10 slice — a single server-side query
  optimization for scale that has not arrived (0 prod users), justified by a "before multi-server
  scale" premise that is not yet true. Shipping it alone is a defensible-but-timid wave.
  Not SCOPE-REDUCTION/DROP: the work is real (wave-14 V-2 flagged it; wave-26's author-avatar dots
  made presence measurably hotter) and it is cheap + verifiable, so draining it is not waste — but
  it is too thin to justify a whole wave on its own.
  Not SCOPE-EXPANSION (milestone-level): expanding M5's ambition is the wrong move while the
  milestone's bet-load-bearing headline (assignment reminders) is founder-blocked — a wider M5 slice
  cannot be authored around the actual differentiator right now.
  SELECTIVE-EXPANSION is correct: there is exactly one cheap, disproportionate addition — the
  client-side presence-perf sibling (07361daf, per-row→single subscription lift in MessageList.tsx).
  It is the same hot path, the same wave-26-introduced regression, shares all context, and turns a
  half-fix ("we optimized the server query but left the O(rows) client subscriptions") into one
  coherent, defensible "presence performance" slice. Pairing them is the highest-leverage single move.

bet_traced_to: "Academic tools + offline-first win students from Discord (status='live')"
milestone_traced_to: "a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d — M5 — Academic tooling: assignments"

proposed_scope_change: |
  Bundle the client-side presence-perf sibling 07361daf ("lift per-row AuthorPresenceDot
  subscription to a single message-list subscription") into this wave alongside the server-side
  seed 6a546c7b, forming one "presence performance" slice.

  Why this ONE addition and not others:
  - Same hot path, same regression source. Both defects were introduced/worsened by wave-26's
    author-avatar presence dots. 6a546c7b is O(members) server work per connect; 07361daf is
    O(rendered rows) client subscriptions per channel view. Fixing one without the other ships a
    half-optimized path and invites a 7th presence-debt wave later.
  - Near-zero marginal cost. 07361daf shares 100% of the reviewer/verify context with the seed;
    P-1 can size them as one bundle without a second D-block or new auth surface.
  - Coherence, not gold-plating. This is NOT "make presence fast for scale that hasn't arrived"
    gold-plating — it is "close the wave-26 regression completely in one pass." The client-side lift
    also removes a real correctness/perf smell that shows up at *single-user* dev scale (per-row
    useEffect churn), so it earns its place independent of the multi-server premise.
  - It is the only candidate that clears the cheap-AND-disproportionate bar. The other open M5 rows
    (invite rotation d058283d, presence code-debt d23a0740, assignment-hardening 3ad35a42/6f257c82/
    4b397de0/226c7e42) are each their own separable slice with a different surface — bundling any of
    them would be scope-drift, not selective expansion.

  Mechanical note for P-1: 07361daf currently has milestone_id NULL (unassigned queue) and a
  non-null wave_id stamp from the wave that SURFACED it. If the bundle is adopted, P-1/N-2 must
  re-home it (UPDATE milestone_id = M5) and re-parent it under the seed (parent_task_id = 6a546c7b)
  to fit the single-seed bundle shape — same reconciliation pattern used for the wave-5 hardening
  bundle and wave-9 invite bundle.

escalation_reason: |
  (Not an ESCALATE verdict — the wave itself is worth doing at the expanded scope. But the
  ceo-reviewer chair is raising a strategic-drift flag LOUD, per the meta-question, that head-product
  must carry into the P-4 gate and the founder digest.)

  THE META-CONCERN — 6 consecutive waves of low-value debt while the bet-load-bearing M5 headline
  sits founder-blocked on a single clearable key:

  This is the 6th straight under-floor M5-debt slice (w23 authz sweep, w24 test-tier, w25 mention
  parity, w26 presence dots, and now w27 presence perf). Every one of these is verifiable, correct,
  and individually defensible — and NONE of them advances the live bet's North Star (weekly active
  students) or M5's actual differentiator. M5's HEADLINE — assignment due-date reminders via
  cron + Resend — IS the "academic tooling Discord lacks" that the bet is staked on, and it is the
  single M5-close blocker. It is blocked on ONE founder-clearable action: providing the Resend API
  key (an account-issued credential that rule 6 forbids the studio from self-generating).

  Honest strategic read (three parts):

  1. Draining verifiable debt while blocked is a REASONABLE holding pattern — NOT a failure. The
     studio cannot manufacture the Resend key, cannot ship the headline without it, and idling the
     loop is worse than draining real, tested backlog. So "keep shipping small correct things" is
     the right *default* behavior for a blocked milestone. This wave is fine.

  2. BUT the holding pattern is quietly becoming the strategy, and that IS the failure mode. Six
     waves is no longer "waiting a day for a key" — it is a multi-wave pattern of motion without
     bet-progress. The risk is not this wave; it is the studio looking busy (green wave after green
     wave) while the one thing that would actually validate the academic-tooling bet never ships.
     A pre-launch product with 0 users burning its build loop on 0-user perf optimizations is the
     textbook "polishing a thing nobody is using yet" trap — the studio is optimizing a path before
     confirming anyone will walk it.

  3. The escalation must get LOUDER and more consequential, not just repeat. The founder digest
     already carries the Resend ask, and it has now been ignored/unactioned across ~6 waves. That
     means the current escalation *channel* is not working — restating it a 7th time changes nothing.
     Recommended sharpening for head-product to route:
       - Reframe the ask from a passive digest line into a BLOCKING decision surfaced with its
         opportunity cost made explicit: "M5's headline feature — the academic differentiator the
         whole product is bet on — has been shippable-except-for-one-key for 6 build cycles. Every
         cycle since has gone to low-value cleanup because it's the only M5 work we can finish
         without you. Provide the Resend key OR tell us to formally park M5 and pivot the active
         milestone to something we CAN move end-to-end (e.g. promote the next planned milestone)."
       - Make the alternative concrete: if the key won't come, the correct strategic move is NOT a
         7th debt wave — it is to STOP treating M5 as active. Either park M5 (blocked) and promote a
         milestone the studio can drive to a shippable outcome without founder credentials, or
         consolidate the remaining M5 debt into ONE final cleanup wave and then pivot. Continuing to
         nibble M5 debt indefinitely is the drift.
     This wave PROCEEDS (the expanded presence-perf slice), but head-product should treat the
     "escalate harder + present the park-or-key fork" recommendation as a first-class P-4 output, not
     a footnote.

sibling_visible: false
```

## Narrative summary (for head-product merge)

**Verdict: SELECTIVE-EXPANSION — proceed with the presence-perf slice, expanded to include the client-side sibling.**

**On "is this the right thing at ~0 users?"** — On its own merits, marginal. A server-query optimization justified by scale that hasn't arrived is close to premature. It survives only because (a) wave-26 genuinely made presence hotter, (b) it's cheap and verifiable, and (c) M5's real work is founder-blocked so the alternatives are all also low-urgency debt. It is *acceptable* as a holding-pattern wave, not *compelling*.

**On ambition** — The single-query seed is too thin (correctly not gold-plated, but genuinely a 3/10). The right-sized version is the coherent "presence performance" pair: server scan (6a546c7b) + client per-row subscription lift (07361daf). Same hot path, same wave-26 regression, shared context, one clean pass. That is the SELECTIVE-EXPANSION. I explicitly did NOT expand further into invite-rotation or assignment-hardening — those are separate slices and bundling them would be drift.

**On the meta-question (LOUD)** — This is the 6th consecutive under-floor M5-debt wave while the bet-load-bearing headline (assignment reminders) sits blocked on one founder-clearable Resend key. Draining verifiable debt while blocked is a reasonable *default*, but at 6 waves it has become the de-facto strategy, and that is the real strategic risk: a 0-user pre-launch product spending its build loop optimizing paths nobody walks yet, while the one feature that would validate the academic-tooling bet never ships. The escalation channel is demonstrably not working (ignored across ~6 waves), so restating it verbatim is useless. head-product should sharpen it into a **blocking park-or-key fork** with the opportunity cost made explicit, and treat that as a first-class P-4 output.
