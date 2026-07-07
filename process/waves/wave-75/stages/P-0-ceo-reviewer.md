```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The 4-task slice (BillingProvider seam + MockBillingProvider + one enforced
  entitlement + owner-only tier-change endpoint + "Your plan"/upgrade UI + TOCTOU
  hardening) is exactly the minimum coherent slice that PROVES the founder's stated
  success metric end-to-end: a server self-upgrades free→server_pro via mock checkout
  and higher limits take effect immediately, verified live. Not SCOPE-EXPANSION —
  every candidate expansion (more enforced limits, more tiers, real Stripe) either
  needs a founder-gated credential (fenced) or adds enforcement surface that does NOT
  change whether the mechanism is proven; expanding now buys no additional strategic
  signal. Not SCOPE-REDUCTION — dropping the seam, the UI, or TOCTOU would each break
  the "drop-in-later + verified-live" property that is the entire point of shipping a
  mock. Not SELECTIVE-EXPANSION — see the storage-enforcement analysis below; the one
  candidate cheap addition does not clear the disproportionate-value bar because the
  success metric already exercises the tier-change → entitlement-takes-effect path via
  educator-tools, and storage/voice enforcement are their own future slices with real
  quota-metering cost, not a cheap bolt-on.
bet_traced_to: "Academic tools + offline-first win students from Discord (status='live') — via the milestone's own '## Bet source: Founder-bet — the business model.' The freemium tiers monetize the academic wedge (educator admin tools gated to the school tier; storage/voice headroom to server_pro), so the pricing surface is the revenue expression of the same bet, not a divergent one."
milestone_traced_to: "3e507bc0-bce5-4f3b-b22a-d3c887fc0548 — M9 Monetization (freemium tiers). status='in_progress'. Class=product-feature, Tier=T5, Horizon=H2."
proposed_scope_change: |
  None. HOLD-SCOPE.
drop_rationale: |
  n/a
escalation_reason: |
  n/a
sibling_visible: false
```

---

## Strategic assessment (narrative, for the P-0 merge + head-product gate)

### (a) Strategic value — is a MOCK upgrade path progress, or motion without revenue?

**It is real progress, and the sequencing is correct.** Three grounded reasons:

1. **The mock proves the mechanism, which is the risky/expensive part; the credential is the cheap part.** The founder has fenced ONLY the Stripe API keys (an account-issued credential per rule 6). Everything mechanically hard — the provider seam, owner-authz on the tier-change endpoint, entitlement re-derivation server-side, the createServer TOCTOU window, the UI, and the live free→pro→limits-take-effect loop — is exactly what this wave de-risks. When real keys arrive, the remaining work is a `StripeBillingProvider` swapped in behind the already-verified `BillingProvider` seam. This matches the milestone prose verbatim ("real Stripe Checkout/webhooks drop into the same seam LATER"). Shipping the seam now is the highest-leverage ordering: it collapses the real-Stripe wave to a provider implementation against a contract already proven live.

2. **The founder explicitly delegated and set the success metric.** Per the 2026-07-07 standing delegation (recorded in the directive + milestone prose), the brain owns prices, limits, the mock flow, and the upgrade UI; the success metric is "a server self-upgrades free→server_pro via mock checkout, higher limits take effect immediately, verified live." This wave's ACs map 1:1 onto that metric. There is no strategic ambiguity to escalate — this is executing an explicit, pre-authorized direction.

3. **It advances the business-model bet without over-committing.** No real charges, no PCI surface, no webhook infra, no customer-portal — all correctly deferred behind the credential fence. The wave buys the mechanism and the confidence that entitlements flip correctly on tier change, without paying the cost or assuming the risk of live payments before the founder is ready. That is disciplined sequencing, not motion-without-progress.

**Should the wave wait for real keys instead?** No. Waiting inverts the risk profile: it would couple the mechanism-proving work to a credential the founder controls the timing of, stalling M9 indefinitely, and would force the seam + UI + TOCTOU + enforcement to be built and verified in the same wave as live-payment integration — a larger, riskier, harder-to-verify bundle. Decoupling the mechanism (now) from the credential (later) is the correct call.

### (b) Ambition calibration — is 4 tasks right, thin, or bloated?

**Right-sized (HOLD-SCOPE).** The slice is the minimum coherent unit that closes the success metric:
- **Seam + MockBillingProvider** — the drop-in property; load-bearing for the whole "later Stripe is easy" thesis. Cannot drop.
- **Owner-only tier-change endpoint** — the self-upgrade action; the metric's verb. Cannot drop. (Security-flagged: owner-authz re-derived server-side, consistent with the RBAC/moderation precedent in product-decisions where every authz-critical endpoint re-derives from route-param context, never client trust.)
- **Real TIER_CAPS + educator-tools enforcement** — proves "higher entitlements take effect immediately." This is the observable half of the metric. Cannot drop.
- **"Your plan" + mock upgrade UI** — the surface the metric is verified through. Cannot drop.
- **createServer TOCTOU hardening** — this was surfaced as a wave-74 V-2 follow-up (per commit history: "TOCTOU→M9 follow-up") and the milestone bundle's 4th task ("Move the createServer entitlement gate inside the transaction"). Folding it into the wave that first enforces real caps is correct: an entitlement gate with a check-then-act race is a real correctness bug on the exact code path this wave makes load-bearing. Not gold-plating — it hardens the primitive being shipped.

Nothing here is grandiose; nothing is a 3/10 stand-in for a cheap 9/10.

### (c) Does enforcing exactly ONE entitlement (educator-tools) prove enough?

**Yes — and this is the crux, so I address it directly.** The concern is "3/10 when a 9/10 was cheap": should the wave also enforce storage and voice caps, since TIER_CAPS already defines them?

I judge **one enforced entitlement is sufficient to prove the mechanism**, and adding storage/voice enforcement is NOT the cheap-but-disproportionate addition that would trip SELECTIVE-EXPANSION:

- **What the success metric requires** is that a tier change causes an entitlement to flip and *take effect immediately, observably*. Educator-tools is a clean binary (OFF for free/server_pro, ON for school) — it's the cheapest, most unambiguous way to demonstrate "entitlement flipped on tier change." It fully exercises the tier-change → EntitlementsService → gate path end-to-end.
- **Storage and voice enforcement are not cheap bolt-ons.** Enforcing a storage cap requires quota *metering* (tracking cumulative usage per server, deciding what happens at the boundary, handling the over-limit UX) — a genuine feature slice with its own edge cases, not a one-line gate. Voice-concurrency enforcement requires wiring into the LiveKit room-join path with real-time participant counting. Bundling either would balloon the wave well past the ~2200–3400 LOC estimate and past the "mock flow" ambition, and would risk the wave on enforcement surface that doesn't change whether the *mechanism* is proven.
- **Prior-art precedent supports thin-first.** The M11 discovery close (product-decisions 2026-07-06) and the M3 messaging first-bundle (2026-06-30) both established the house pattern: cut the foundational slice, prove the primitive, defer the breadth to subsequent same-milestone bundles. Enforcing the full cap matrix belongs to a later M9 bundle (storage-quota enforcement + voice-cap enforcement), decomposed once the seam + mechanism are live — exactly as messaging deferred reactions/threads/presence to later M3 waves.

So: educator-tools proves the *mechanism* (9/10 on the metric that matters this wave); storage/voice enforcement is *breadth* that is correctly a future slice, not a cheap addition being timidly skipped.

### Binding note carried into the gate (not a scope change)
The strategic value of this entire wave is contingent on the seam being a *genuine* drop-in — i.e., the `BillingProvider` interface must be shaped so a real `StripeBillingProvider` (async checkout redirect + webhook-driven state, NOT synchronous mock return) fits without re-plumbing callers. If P-3's seam is modeled on the mock's synchronous shape only, the "later Stripe is easy" thesis silently breaks and the wave's strategic payoff evaporates. This is a HOLD-SCOPE observation for P-3/head-builder, not an expansion: verify the interface accommodates the async/webhook reality of the real provider. (industry-expert lens: Stripe Checkout is redirect + webhook, not a blocking call — the seam must not assume otherwise.)

**Disposition: PROCEED — mode HOLD-SCOPE. Traces cleanly to M9 (in_progress) and the live business-model bet. Success metric is measurable and live-verifiable. No scope change proposed.**
