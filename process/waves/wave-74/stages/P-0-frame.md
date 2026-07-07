# Wave 74 — P-0 Frame

## Discover
- **wave_db_id:** 9168c5f2-c35f-4ccd-b56b-68ab10f5f608 (wave_number 74; milestone_id M9 set at INSERT).
- **Prior-work:** none (no tier/plan/subscription/entitlement code exists — verified by problem-framer). Net-new.
- **Roadmap milestone:** M9 Monetization: freemium tiers (3e507bc0, in_progress — promoted at the wave-73 resume when the founder called M10 good-enough + pivoted). This is M9's FIRST slice.
- **Spec-contract short-circuit:** no-prior-spec (seed carries prose only) → full P-1..P-3.
- **Product decisions (Action 4):** the 2 founder-reserved M9 asks (Stripe account+keys; tier design+pricing+M9 success-metric) are DEFERRED to the founder as a NON-BLOCKING daily-checkpoint item (`process/session/updates/founder-checkpoint-2026-07-07-m9.md`) per ceo-reviewer — surfaced now so the founder's answer arrives in parallel, unblocking the next (real-charging) M9 slice. Not blocking this substrate wave.

## Reframe
**Original framing:** M9 entitlements substrate — plans/subscriptions tier model (default free) + EntitlementsService (tier→feature caps, founder-tunable placeholders) + read-only gate wiring. Stripe SDK + prices/limits + checkout UI + M9 metric fenced (founder-reserved).

- **problem-framer: PROCEED.** Symptom-vs-cause PASSES; no antipattern. Verified: reports.ts schema idiom real; NO existing tier code (net-new); the gate-wiring has a REAL target (servers.service `createServer` has no per-owner cap → the entitlement check reads against it — defuses the "built but not wired" risk). Not premature-abstraction (tier column + resolver = minimum viable, not a state machine; over-engineering surface explicitly excluded). **Binding refinements:** (1) VERIFY the gate READS the model — a test where a stubbed restrictive cap DOES block while the real free placeholder cap does NOT (reject coverage theater: "free can still create a server" passes even if the check is dead code); (2) enum minimal + founder-tunable placeholder names (zero DB cost to rename later); (3) server-tier as PRIMARY subject (createServer gate + server_pro/school are server-scoped) — add user_id only if a wired gate consumes it this wave, else defer.
- **ceo-reviewer: PROCEED (HOLD-SCOPE).** The maximal slice needing zero founder input — 9/10: single EntitlementsService seam + default-free at the data layer avoids scattered inline `if(tier===...)` debt, so the next slice is "point at Stripe webhooks + swap placeholder caps + add checkout" (one integration point). Not SCOPE-EXPANSION (autonomous expansion = guesses the founder must overwrite). Surface the founder-reserved asks now (done, non-blocking).
- **mvp-thinner: OK.** Metric _TBD_ → no AC reclassification. Coherent minimal substrate: seed (irreducible), EntitlementsService (the resolver half of the substrate — not splittable), gate-wiring (proof-of-read-path, deliberately thin; peeling it would push under the multi-spec floor). server_id+user_id = a P-2 shape call; placeholder caps model the shape not values (minimal). Flag: the metric + real limits/prices MUST be resolved before any M9 ENFORCEMENT/BILLING slice.

**Mediation:** none (ceo HOLD-SCOPE + mvp OK — no expansion/THIN tie).

**Disposition: PROCEED.**

## Final framing for the rest of P-block
Ship the 3-task bundle: (1) 53d18d7f plans/subscriptions tier model (default free) + migration; (2) e34642ef EntitlementsService (tier→caps via founder-tunable placeholder config + shared Zod tier enum ['free','server_pro','school']); (3) 2f61a317 read-only entitlement-check wiring at the servers.service createServer gate (non-restrictive under free). **Binding refinements:** VERIFY-the-gate-reads test (stubbed restrictive cap blocks, free doesn't); server-tier primary subject (user_id only if consumed); enum + caps marked founder-tunable placeholders; NO Stripe/prices/checkout/quotas (fenced). Backend-heavy + a thin optional "Your plan = Free" display → P-1 sets design_gap_flag (likely false).
