# P-0 — ceo-reviewer verdict (wave-74)

```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The proposed first M9 slice — a credential-independent entitlements substrate (plans/subscriptions
  tier model default-free + EntitlementsService with founder-tunable placeholder caps + read-only gate
  wiring) — is the correct-sized first monetization move, so HOLD-SCOPE, not the other three modes.
  NOT scope-expansion: the two things that would make this disproportionately valuable (actual charging
  = Stripe SDK, and real prices/limits) are both founder-reserved (Stripe API keys + money decisions),
  so expanding scope autonomously would only manufacture guesses the founder must then overwrite —
  negative leverage, not positive. NOT selective-expansion: no single cheap addition clears the
  cheap-but-disproportionate bar while the charging path is key-blocked; the highest-leverage "addition"
  is not code at all but surfacing the founder-reserved asks (handled as a note below, not a scope change).
  NOT scope-reduction / DROP: the substrate is not gold-plating and not a real-bug-that-doesn't-matter —
  it is the honest, load-bearing prerequisite every subsequent revenue slice depends on, and it is the
  MOST valuable monetization work that needs zero founder input. It traces cleanly to the live business-model
  bet and the active M9 milestone, so the bar here is execution quality, not scope change.
bet_traced_to: "Academic tools + offline-first win students from Discord (status='live') — M9 is the business-model / monetization arm of this bet; the milestone's own `## Bet source` reads 'Founder-bet — the business model.'"
milestone_traced_to: "3e507bc0-bce5-4f3b-b22a-d3c887fc0548 — M9 — Monetization: freemium tiers (status='in_progress', the sole active milestone)"
proposed_scope_change: |
  None. Scope held as framed.
drop_rationale: |
  N/A
escalation_reason: |
  N/A — no strategic conflict beyond ceo-reviewer authority. See founder-reserved note below; it is a
  surface-now recommendation (checkpoint/digest item), NOT a block and NOT an ESCALATE.
sibling_visible: false
```

## What "9/10 first monetization slice" looks like — and why the substrate is it

The tempting critique is: "an inert substrate produces $0 and validates nothing — that's a 3/10 that
just moves a `tier` column around." That critique is wrong here, for a specific reason:

**You cannot build a revenue path without two founder-reserved inputs**: (a) the Stripe API keys
(account-issued credentials — always founder, per always-on rule 6), and (b) the actual tier prices +
real feature limits (money + product-taste decisions — always founder, per rule 17). Neither is
autonomously fillable. Given that hard constraint, the question is not "substrate vs. real charging" —
real charging is not on the table this wave. The question is "substrate vs. nothing (pause for keys)."

Against that real choice, the substrate is the 9/10:

- **A 3/10 version** would hard-code a `tier` enum onto `users`, scatter `if (user.tier === 'free')`
  checks inline across feature call-sites, and bake placeholder numbers as magic constants. That creates
  exactly the debt that makes the *next* (real-charging) slice expensive — every gate has to be re-found
  and re-wired once Stripe lands.
- **The 9/10 version is what's proposed**: a normalized plans/subscriptions model (default free), a
  single `EntitlementsService` that maps tier → feature caps behind one seam, and read-only gate wiring
  that reads through that service. When the founder returns with keys + prices, the remaining work is
  "point subscriptions at Stripe webhooks" + "replace placeholder caps with real numbers" + "add the
  checkout UI" — all of which now have exactly one integration point instead of N scattered ones. The
  substrate is what makes the revenue slice cheap *and* correct.

The explicit deferrals (Stripe SDK, real prices/limits, checkout UI, M9 success metric) are the RIGHT
fence — each is either founder-reserved or downstream of a founder decision. Deferring them is honesty,
not timidity. Every deferred item is fenced because it genuinely cannot be done well autonomously right
now, not to dodge work.

## Sequencing verdict: build the substrate now, surface the founder asks in parallel

This is the highest-leverage autonomous move, on two conditions that the frame already satisfies:

1. **Build the substrate now** — it is real, testable (tier→cap resolution, default-free assignment,
   gate read-through), reuses existing authz idioms, and unblocks the revenue slice. It is not
   speculative plumbing; it is the load-bearing floor.
2. **Do NOT pause the wave to wait for the founder.** Pausing would trade a shippable, de-risking wave
   for idle time. The substrate is precisely the work that needs zero founder input, so it is the correct
   thing to run while the founder-reserved asks are outstanding.

## Founder-reserved note — SURFACE NOW (not a block)

The two blockers on *real revenue* are founder-reserved and should be surfaced this wave as a
checkpoint/digest item so the NEXT M9 slice can actually charge — this is a recommendation to the
orchestrator (Action 4 Tier-3 signal / daily-checkpoint deferral), NOT a ceo-reviewer block or ESCALATE:

- **Stripe account + API keys** (account-issued credential — only the founder can create the Stripe
  account and issue keys; generate-it-yourself does not apply).
- **Tier design + pricing** (money + product decision): how many paid tiers, what each unlocks (the
  real feature caps this substrate currently placeholders), and the price points. Also the **M9 success
  metric**, which the milestone still carries as `_TBD by founder_` — monetization is the one milestone
  where a metric-free ship is genuinely risky, because "did it make money / convert" is the whole point
  and cannot be inferred from a green test suite.

Framing for the founder (plain-language, per rule 16): *"We've built the plumbing that lets StudyHall
tell free users apart from paid ones and cap features by plan — all defaulting to free, so nothing
changes for anyone yet. To actually turn on paid plans and take payment, we need two things only you can
give: your Stripe account keys, and your call on how many paid tiers there are, what each unlocks, and
what they cost. Whenever you have those, the next update can start charging."*

Surfacing now (vs. after this wave ships) means the founder's answer can arrive in parallel with the
build, so the revenue-capable slice can open immediately after, with no dead wait.

## Ambition calibration summary

- **Too timid?** No — it is the maximal autonomous slice; the only "bigger" version requires founder
  inputs that don't exist yet.
- **Too grandiose?** No — it builds exactly the seam needed and fences everything downstream of a
  founder decision. No speculative Stripe scaffolding, no guessed prices, no checkout UI built against
  unknown tiers.
- **Right thing now?** Yes — de-risks the entire monetization milestone at the one moment it is cheap
  to do, while the honest revenue blockers get raised to the founder in the same wave.

**Mode: HOLD-SCOPE. Verdict: PROCEED.** Bar for downstream stages is execution quality: verify the
entitlements seam is single-point (no scattered inline tier checks), verify default-free is enforced at
the data layer (not just app layer), and verify the placeholder caps are founder-tunable config (not
magic constants) so the real-numbers swap is a one-line change.
```
