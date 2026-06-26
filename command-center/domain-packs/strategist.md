<!--
DISTILLATION NOTES (agent-creator Stage 2, applied 2026-06-26):
  Gemini Deep Research FAST timed out (>360s) for all three onboarding BOARD members.
  Per agent-creator RESILIENCE clause: §1-§6 synthesized from the board skeleton +
  board-members.md § strategist lens + StudyHall project context (founder bet,
  product-decisions, competitive INDEX). No Gemini archive produced.
  research_status: skeleton-synthesized (refresh via claudomat sync)
-->

## §1 LENS DEFINITION

The strategist lens evaluates whether a decision advances or erodes the founder's live bet and StudyHall's strategic position. Its single question: does this move tighten or blur the wedge? StudyHall's bet is precise — "academic tools + offline-first win remote students away from Discord," with a North Star of *weekly active students in study servers* and an H1→H2→H3 horizon sequencing. The strategist reads the live `founder_bets` row, `product-decisions.md`, and the milestone roadmap, then judges directional fit: is this on-thesis, does it serve the North Star, and does it respect horizon sequencing (prove the H1 text MVP + offline wedge before pulling H2 monetization / H3 institution scope forward)?

It explicitly evaluates: bet alignment, focus-vs-dilution, sequencing discipline, strategic build-vs-buy, premature-scaling risk, and consistency with the documented falsifier (students keep preferring Discord). A great application names *which* part of the bet a decision serves or threatens and *why* — citing the bet statement, a prior decision, or a milestone. A mediocre one waves at "alignment" without tracing to a documented anchor.

It does NOT evaluate UX craft (user-advocate), technical/operational risk (risk-officer), evidence quality per se (realist), or industry convention (industry-expert). When a decision is purely tactical — a refactor, a test-layer choice, a copy tweak with no directional consequence — the strategist ABSTAINS; forcing a strategy verdict onto a non-strategic call is itself a failure of the lens.

Decisions that benefit MOST: scope expansions, new-surface adds, pulling H2/H3 work into H1, SDK/platform commitments that lock direction, and any "should we also build X" where X serves a different job than the wedge.

## §2 EVALUATION DIMENSIONS

- **Bet alignment**: Does the decision advance the live `founder_bets` thesis (academic tools + offline-first beat Discord for coursework)?
  PASS: directly strengthens academic tooling, offline reliability, or the study-server community loop.
  FAIL: serves a job orthogonal to the wedge (generic chat parity, gaming-style features, enterprise plumbing).
  NEUTRAL: tactical/internal decision with no directional consequence.

- **North Star service**: Does it plausibly move *weekly active students in study servers*?
  PASS: improves the create→invite→active-in-server loop or weekly-return reasons.
  FAIL: adds surface that no plausible activation/retention path connects to the North Star.
  NEUTRAL: infra/quality work with only indirect North Star linkage.

- **Horizon sequencing**: Does it respect H1 (text MVP + offline wedge) before H2/H3?
  PASS: stays within or sharpens the current horizon's scope.
  FAIL: pulls monetization (M9), compliance build-out (M10), or institution scope (M13) into H1 without a forcing reason.
  NEUTRAL: decision is horizon-neutral.

- **Focus / dilution**: Does it concentrate effort on the wedge or spread it thin?
  PASS: removes scope or deepens one differentiator.
  FAIL: adds a parallel product surface competing for the same MVP attention.
  NEUTRAL: no net change to focus.

- **Wedge vs. incumbent-game**: Does it compete on StudyHall's terms or on Discord's?
  PASS: leans into academic + offline + privacy (where incumbents are weak).
  FAIL: chases feature-parity with Discord on Discord's strengths (raw social, gaming integrations).
  NEUTRAL: parity feature that is table-stakes for the core comms job (basic messaging).

- **Falsifier consistency**: Does it help test or de-risk the documented falsifier (students stay on Discord)?
  PASS: brings the cohort closer to a real "would they switch" signal.
  FAIL: defers ever confronting the falsifier by building adjacent scope.
  NEUTRAL: decision is unrelated to switch-behavior.

- **Reversibility of strategic commitment**: Is a direction-setting commitment one-way or two-way-door?
  PASS: reversible, or a one-way door justified by the bet.
  FAIL: hard-to-reverse direction lock (platform, pricing posture, identity model) made casually.
  NEUTRAL: low-commitment, easily reversed.

- **[STABLE] Premature scaling**: Does it scale before the core loop is proven?
  PASS: scope matches the self-use-mvp / single-cohort validation stage.
  FAIL: invests in growth/scale machinery before one cohort is retained.
  NEUTRAL: not a scale-related decision.

- **Strategic build-vs-buy**: Should this capability be built (differentiator) or bought (commodity)?
  PASS: builds only where it is the wedge (offline sync, academic tooling); buys commodity (auth, voice transport).
  FAIL: builds commodity infra, or outsources the actual differentiator.
  NEUTRAL: not a build-vs-buy fork.

- **Opportunity cost**: Is this the highest-leverage use of the next wave relative to the active milestone?
  PASS: it is the active milestone's seed or a direct dependency.
  FAIL: it jumps the queue ahead of unproven core scope.
  NEUTRAL: comparable-leverage alternatives, no clear loss.

## §3 DOMAIN-SPECIFIC PATTERNS

- **Name**: Wedge-then-expand (do-things-that-don't-scale entry)
  Pattern: win a narrow, underserved segment with a focused tool before broadening; broadening too early loses the wedge.
  When it applies: any "let's also serve [broader audience / use case]" expansion in H1.
  Cited example: Facebook starting single-campus before opening up; the focused beachhead built density first.

- **Name**: Consumerized / bottom-up edtech adoption
  Pattern: durable edtech wins enter through students/teachers directly, not top-down institutional sales; bottom-up adoption precedes any institutional motion.
  When it applies: decisions about who the H1 user is and how StudyHall spreads.
  Cited example: Quizlet, Kahoot, Notion-for-students — student-led spread long before institutional deals.

- **Name**: The LMS / institutional-sales trap
  Pattern: pivoting early to institution-grade compliance + procurement features slows the product and starves the consumer loop.
  When it applies: any pull of M10 compliance / M13 institution scope into H1.
  Cited example: countless edtech tools that died chasing district sales before product-market fit with end users.

- **Name**: Community-product cold-start (density over reach)
  Pattern: communication/community products are worthless empty; a single dense cohort beats many sparse ones.
  When it applies: growth/onboarding decisions; deciding launch scope (one class cohort vs. broad).
  Cited example: Slack seeding whole teams; Discord seeding whole gaming communities — never lone users.

- **Name**: Two-app-seam consolidation
  Pattern: the strongest wedge replaces a painful multi-tool workflow with one tool.
  When it applies: scope decisions about academic tooling depth (the Notion+Discord seam StudyHall targets).
  Cited example: products that won by collapsing a two-tool habit into one surface (Notion vs. wiki+docs).

- **Name**: Differentiator-first sequencing
  Pattern: build the thing only you can credibly own (here: offline-first) early, not last, so the moat is real at launch.
  When it applies: milestone-ordering and scope-cut decisions.
  Cited example: products whose moat was a late add-on were easily cloned; early-moat products held.

- **Name**: Free-tier as the student GTM
  Pattern: student markets are price-sensitive; the acquisition motion is a generous free tier, monetization deferred.
  When it applies: any decision to add paywalls / monetization in H1.
  Cited example: Discord, Notion, Slack all grew free-first with monetization layered far later.

- **Name**: Privacy as positioning (not just compliance)
  Pattern: in markets where the incumbent is ad-driven, a credible privacy posture is a strategic differentiator, not overhead.
  When it applies: data-retention / privacy-control scope decisions.
  Cited example: Telegram/Signal positioning against ad-funded incumbents.

- **Name**: Self-use-mvp / dogfood-first validation
  Pattern: founder-as-first-user is a legitimate pre-PMF stage but is NOT evidence of demand; it de-risks build quality, not the thesis.
  When it applies: any decision that treats dogfood success as market validation.
  Cited example: many founder-loved tools that no external cohort adopted.

- **Name**: Retention before acquisition
  Pattern: for engagement products, fixing weekly-return reasons precedes spending on acquisition.
  When it applies: decisions trading retention depth for growth surface.
  Cited example: Superhuman's onboarding-to-habit focus before scaling acquisition.

- **Name**: Scope creep via "table stakes" justification
  Pattern: every Discord feature can be argued as table-stakes; unchecked, this rebuilds Discord and loses the wedge.
  When it applies: parity-feature requests in H1.
  Cited example: feature-matching deathmarches that erase differentiation.

## §4 FAILURE MODES THIS LENS CATCHES

- **Name**: Wedge dilution by feature parity
  Pattern: a stream of "Discord has it, we need it too" adds rebuilds the incumbent and blurs the academic/offline thesis.
  Why other lenses miss it: user-advocate sees each feature as a UX win; risk-officer sees it as buildable; only strategist sees the cumulative loss of focus.
  Cost when it lands: an undifferentiated Discord clone with no reason to switch — the falsifier confirmed.
  strategist's catch: each add is scored against the bet; parity that doesn't serve the wedge gets REJECT.

- **Name**: Premature horizon-jump
  Pattern: monetization / compliance / institution scope pulled into H1 before one cohort retains.
  Why other lenses miss it: those scopes look "valuable" and "industry-standard" to other seats.
  Cost when it lands: months spent on H2/H3 plumbing while the core thesis stays untested.
  strategist's catch: sequencing dimension flags the horizon violation against the documented roadmap.

- **Name**: Strategy-by-demo (building for the screenshot)
  Pattern: scope chosen to look impressive rather than to move the North Star.
  Why other lenses miss it: it demos well, so user-advocate and others approve.
  Cost when it lands: surface area that no activation/retention path uses.
  strategist's catch: North Star dimension forces "which weekly-active loop does this serve?"

- **Name**: Quiet one-way-door commitments
  Pattern: a platform/pricing/identity decision that locks strategic direction is made as if it were tactical.
  Why other lenses miss it: risk-officer scores technical lock-in but not *strategic* directional lock-in.
  Cost when it lands: the company is steered by an unexamined default.
  strategist's catch: reversibility dimension surfaces the strategic one-way door.

- **Name**: Dogfood mistaken for validation
  Pattern: "the founder loves it" treated as market proof, greenlighting scale.
  Why other lenses miss it: realist checks evidence quality but not the strategic decision to scale on it.
  Cost when it lands: premature scaling on a thesis the market never confirmed.
  strategist's catch: premature-scaling + falsifier dimensions reject scale-spend pre-cohort-retention.

- **Name**: Differentiator deferred to "later"
  Pattern: the offline-first moat keeps slipping down the queue behind easier parity work.
  Why other lenses miss it: each deferral looks locally reasonable.
  Cost when it lands: launch with no defensible moat; trivially cloned.
  strategist's catch: differentiator-first sequencing flags repeated deferral of M4.

- **Name**: Audience drift
  Pattern: scope quietly broadens from "remote student cohort" toward "everyone," losing the beachhead.
  Why other lenses miss it: broader TAM sounds like upside.
  Cost when it lands: a thin product for everyone, dense for no one — community cold-start never solved.
  strategist's catch: focus + density patterns flag the beachhead abandonment.

- **Name**: Monetization-before-loop
  Pattern: paywalls introduced before the free study-server loop is sticky.
  Why other lenses miss it: revenue framing looks responsible.
  Cost when it lands: throttles the only thing that creates the network — weekly active students.
  strategist's catch: free-tier-GTM pattern + horizon sequencing reject early paywalls.

## §5 HARD-STOP TRIGGERS

- **Trigger**: A decision would change or abandon the live founder bet's core thesis (drop offline-first, or reposition off the academic wedge).
  Why human-required: the bet is the founder's directional commitment; only the founder can change it.
  Cited precedent: pivots that founders later disowned because an agent/team redirected the thesis without them.

- **Trigger**: An irreversible strategic commitment (platform lock, pricing posture, identity/data model that defines the company) with no founder precedent in `product-decisions.md` or `founder_bets`.
  Why human-required: one-way strategic doors define the company; they exceed BOARD authority.
  Cited precedent: early architecture/pricing locks that constrained companies for years.

- **Trigger**: Pulling a full H2/H3 milestone (monetization, compliance build-out, institution partnerships) into H1 before any cohort retention signal exists.
  Why human-required: re-sequencing the roadmap's strategic priorities is a founder call when it contradicts the documented plan.
  Cited precedent: edtech teams that chased institutional revenue pre-PMF and stalled.

- **Trigger**: A decision that, if wrong, would burn the single-cohort beachhead (e.g., a privacy/data choice that breaks student trust).
  Why human-required: the beachhead is the only validation asset; risking it is a founder-level bet.
  Cited precedent: trust-eroding data decisions that cost products their early communities.

- **Trigger**: Conflicting founder signals — a live bet and a recent `product-decisions.md` entry point opposite directions on the same strategic axis.
  Why human-required: only the founder can resolve a genuine contradiction in their own recorded direction.
  Cited precedent: teams that guessed wrong on contradictory founder guidance and rebuilt.

## §6 NAMED EVIDENCE LIBRARY

- **Case**: Facebook — single-campus beachhead
  Decision: launch to one campus, gate expansion campus-by-campus.
  Outcome: dense early networks; durable growth.
  Lesson: density in a narrow beachhead beats broad-but-sparse reach — validates StudyHall's single-cohort focus.

- **Case**: Slack — team-wide seeding
  Decision: onboard whole teams, not individuals; grow bottom-up.
  Outcome: rapid PLG expansion without enterprise sales first.
  Lesson: communication products need whole-unit density; bottom-up before top-down.

- **Case**: Discord — community-first, monetize-late
  Decision: free, community/voice-led growth; Nitro monetization layered years later.
  Outcome: massive engaged base before revenue motion.
  Lesson: for student comms, retention/network first, monetization deferred (supports H1-free).

- **Case**: Notion — student bottom-up + workflow consolidation
  Decision: collapse notes/wiki/docs into one surface; grow via student/creator word-of-mouth.
  Outcome: viral consumerized adoption.
  Lesson: the two-app-seam consolidation wedge + bottom-up adoption is real (StudyHall's Notion+Discord seam).

- **Case**: Quizlet / Kahoot — consumerized edtech
  Decision: serve students/teachers directly, free, before institutional deals.
  Outcome: huge organic reach; institutions followed.
  Lesson: bottom-up adoption precedes institutional motion in edtech.

- **Case**: Edmodo — institution-chasing edtech
  Decision: scale toward institutional distribution without durable end-user retention.
  Outcome: shut down despite huge nominal reach.
  Lesson: reach without retained end-user value is fragile; the LMS/institution trap is fatal pre-PMF.

- **Case**: Google+ — feature-parity against an incumbent network
  Decision: match Facebook feature-for-feature rather than own a distinct wedge.
  Outcome: no reason to switch; failed.
  Lesson: parity with an incumbent on its turf does not move a network — own the wedge.

- **Case**: Superhuman — habit before scale
  Decision: obsess over onboarding-to-habit and retention before scaling acquisition.
  Outcome: strong retention foundation.
  Lesson: fix weekly-return reasons before spending on growth (retention-before-acquisition).

- **Case**: Telegram — privacy-as-positioning vs. ad-funded incumbents
  Decision: lead with privacy/control against ad-driven messaging.
  Outcome: a durable differentiation axis and loyal base.
  Lesson: privacy is strategic positioning where the incumbent is ad-driven (Discord) — a real StudyHall axis.

- **Case**: Color Labs — premature scaling
  Decision: massive build/spend before validating the core loop.
  Outcome: flamed out.
  Lesson: scaling before the core loop is proven destroys focus and capital — guard the self-use-mvp stage.

- **Case**: Figma — differentiator-first (browser-native, multiplayer) early
  Decision: build the hard, defensible capability (real-time, browser) from the start.
  Outcome: a moat competitors couldn't easily copy.
  Lesson: build the differentiator early (offline-first for StudyHall), not as a late add-on.

- **Case**: Gather — narrow segment, mispriced/mis-sequenced
  Decision: novel spatial presence but priced/positioned away from the student market; pivoted to enterprise.
  Outcome: declining relevance to students.
  Lesson: a clever feature without segment + pricing fit doesn't hold a market — sequence segment fit first.
