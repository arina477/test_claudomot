```yaml
verdict: THIN
verdict_source: mvp-thinner
milestone_id: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548
milestone_title: "Monetization: freemium tiers"
milestone_class: product-feature
milestone_success_metric: |
  A server can self-upgrade free→server_pro through the (mock) checkout and the
  higher entitlements take effect immediately, verified live in production.
  Business metric (paid-conversion rate) activates when real Stripe lands.
mvp_critical_status: |
  3 of 3 substrate tasks done (data model, EntitlementsService, read-only gate wiring
  — wave-74). Of the 4 charging-slice tasks proposed this wave, 3 are mvp-critical for
  the metric; 1 (db90252a TOCTOU) is not load-bearing at the caps this wave ships.

# THIN — proposed sibling split (defer db90252a only)
proposed_split:
  acs_to_keep:
    - ac: "4bc40741 — BillingProvider seam + MockBillingProvider + owner-only tier-change endpoint"
      rationale: "IS the (mock) checkout. Remove it and no server can self-upgrade — metric directly unsatisfiable."
    - ac: "4bc40741 (sub-AC) — downgrade path alongside upgrade"
      rationale: "Same DI seam + same endpoint + same TierSchema validation as upgrade; splitting it removes ~zero net scope while adding a second endpoint-touching wave. Keep — coupled, not gold-plating."
    - ac: "69765cee — swap TIER_CAPS to real brain-set values + wire ONE enforced entitlement (educator-admin-tools gate)"
      rationale: "Metric requires 'higher entitlements take EFFECT immediately.' Without real caps, server_pro == free (no observable effect); without one enforced gate, entitlements stay decorative and 'take effect' is unprovable. Load-bearing."
    - ac: "69765cee (hard non-regression AC) — maxServersPerOwner stays NON-RESTRICTIVE (no wave-74 free-cap regression)"
      rationale: "Guards the shipped createServer surface; cheap; its presence is precisely what makes the db90252a TOCTOU unreachable this wave. Keep."
    - ac: "77665ee5 — 'Your plan' panel: tier+limits display + owner upgrade affordance + refresh-on-success + test/mock marking"
      rationale: "The upgrade affordance is how a server 'self-upgrades'; the display + refresh is the surface that makes 'take effect immediately, verified live' observable. This IS the verification surface the metric's 'verified live' clause leans on. Keep whole — the limits display is not polish, it's the before/after evidence of entitlement change."
  acs_to_split:
    - ac: "db90252a — Move the createServer entitlement gate inside the transaction (TOCTOU hardening)"
      rationale: |
        Trace test → metric stays satisfiable without it. The task's OWN prose: the gate is
        "UNREACHABLE at the current free placeholder (100_000)" and belongs "BEFORE the next M9
        slice assigns real (low) caps." This wave does NOT ship a restrictive server-count cap —
        sibling 69765cee carries a HARD AC keeping maxServersPerOwner non-restrictive (no wave-74
        regression). So the read-then-insert createServer gate remains provably unreachable AFTER
        this wave too; there is no concurrent-create-at-cap-boundary window to exploit at the caps
        shipped. The success metric (self-upgrade free→server_pro + entitlements take effect,
        verified live) touches the tier-change endpoint + resolveForServer + the educator-tools
        gate — NONE of which is the createServer count path. db90252a hardens a gate the metric
        never traverses, at a cap boundary this wave never approaches. It is correctly deferred to
        the M9 slice that actually assigns a restrictive server-count cap (or the real-Stripe
        low-caps slice) — which is when the fix first becomes reachable and therefore load-bearing.
      sibling_task_seed:
        title: "Make createServer entitlement gate atomic (TOCTOU) — do BEFORE any restrictive server-count cap ships"
        description: |
          The createServer entitlement check is read-then-insert (resolveCreateGateForOwner count,
          then a separate transaction insert) — a TOCTOU window: two concurrent creates by the same
          owner at the cap boundary could both pass and exceed the cap by 1. UNREACHABLE while
          maxServersPerOwner stays non-restrictive (100_000), which remains true through wave-75.
          Acceptance sketch: move the count+check inside the createServer transaction (SELECT ... FOR
          UPDATE or a serializable txn) so the gate is atomic, and add a concurrency test proving two
          simultaneous creates at the boundary cannot both pass. This sibling is a HARD PREREQUISITE
          of — and MUST land in or before — the first M9 slice that assigns a restrictive
          server-count cap (e.g. the real-Stripe low-caps slice). Orchestrator INSERTs with
          milestone_id = 3e507bc0-bce5-4f3b-b22a-d3c887fc0548, wave_id = NULL,
          parent_task_id = 4bc40741-146a-4f05-8970-1614eb6b2b43 (or re-home to the future
          real-caps seed at that slice's decomposition). Ref: apps/api createServer gate +
          resolveCreateGateForOwner.

over_cut_rationale: null

ok_rationale: null
floor_constraint_active: false
floor_constraint_detail: |
  Floor NOT triggered. Wave sizing per decomposition note: ~2,200–3,400 net LOC, ~30–40 files,
  4 specs (multi-spec). Floor for multi-spec: >2,500 LOC OR ≥6 specs. db90252a is a focused
  atomicity fix (move count+check into txn / SELECT FOR UPDATE + one concurrency test),
  estimated ~80–200 LOC. residual_loc after split = ~2,000–3,200 LOC across 3 specs; the LOC
  midpoint stays above the 2,500 threshold and the wave remains a coherent charging slice
  (checkout + real caps + UI). The floor does not block this split.

sibling_visible: false
```

## Analyst note (for P-0 merge)

Single, high-confidence peel: **db90252a defers**. It is the one AC in the wave whose own
prose declares it unreachable at the caps being shipped, and the wave carries a HARD AC
(69765cee) guaranteeing those caps stay non-restrictive — so the TOCTOU gate remains
unreachable through wave-75. Deferring it does not touch the success-metric path
(tier-change endpoint → resolveForServer → educator-tools gate), and re-homes cleanly to
the slice that first ships a restrictive server-count cap, which is when the fix becomes
load-bearing.

The two sub-AC candidates the framing prompt raised were examined and **kept**:
- **Downgrade** — trivially coupled to the same DI seam / endpoint / TierSchema as upgrade;
  splitting removes ~no net scope while spawning a second endpoint-touching wave. Not thinness,
  just fragmentation.
- **Full "Your plan" panel** (vs upgrade affordance only) — the tier-limits display + refresh
  is the observable before/after evidence the metric's "take effect immediately, verified live"
  clause depends on. It is the verification surface, not polish. Kept whole.

I did not propose adding ACs (that is ceo-reviewer's lane) and did not recommend a smaller
wave (that is P-1's authority) — this is a pure keep/split re-classification of one AC into a
pre-authored M9 sibling.
