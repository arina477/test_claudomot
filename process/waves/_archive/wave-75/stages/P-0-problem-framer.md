verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
symptom_vs_cause_check: |
  MANDATORY CHECK — PASS (cause-level).
  This wave is not a symptom-masking fix. The underlying cause it targets is:
  "tiers exist in the substrate but are not yet CHANGEABLE, and no entitlement is
  yet ENFORCED, so the freemium value proposition is inert." The 4-task bundle
  attacks that cause directly: a real tier-change mechanism (mock endpoint on the
  DI seam), real caps replacing placeholders, ONE observable enforcement, and
  atomicity hardening ahead of real low caps. No surface-layer patch over a
  deeper defect was found.
reasoning: |
  Verified against code (not decomposer prose, per PRODUCT-PRINCIPLES rules 1/2/4):
  wave-74 substrate exists exactly as claimed — subscriptions table (per-server
  tier, UNIQUE(server_id)), EntitlementsService.resolveForServer +
  resolveCreateGateForOwner, TIER_CAPS placeholder with a documented
  non-restrictive free maxServersPerOwner=100_000. Every seed premise is true:
  caps ARE placeholders to swap (69765cee), the createServer gate IS a genuine
  read-then-count/insert TOCTOU that only becomes reachable once a real low cap
  ships (db90252a), and the per-server subscription model aligns with the mock
  endpoint changing subscriptions.tier by serverId and with the success metric
  ("a server self-upgrades free->server_pro"). Framing is at the right layer
  (app/API + schema-atomicity, not frontend); no wrong-layer, no demo-path tunnel
  vision, no scope-creep-through-coupling — the 4 tasks are one coherent slice
  (change tiers + prove one limit + harden the gate that the change makes live).
  The four red-team questions posed resolve cleanly: (a) mock flow does NOT
  masquerade as a charge — task 77665ee5 mandates it be "clearly marked test/mock
  checkout (no real charge)"; that is the correct guard against the only real risk
  here and it is already in-frame; (b) the BillingProvider seam is NOT premature
  abstraction (antipattern #4) — it has a NAMED second consumer (real Stripe,
  founder-fenced) that is certain to land, and a DI-token swap is the minimum seam
  that lets mock+real coexist without rework, not a speculative framework; (c)
  enforcing exactly ONE entitlement (educator-admin-tools) is the right
  proof-of-live, not symptom-level — it is a boolean, observably flips on
  upgrade-to-school, and satisfies the success metric without gold-plating all
  three dimensions; (d) no config-drift/validation-theater/backwcompat-shim
  smells. PROCEED with two non-blocking notes for P-1/P-2 to carry (below).
non_blocking_notes: |
  1. Caps DRIFT to reconcile at P-2 spec (not a framing defect — the task already
     says "swap placeholder->real"): current code has free callCapacity=50,
     server_pro storageMb=20_480/callCapacity=200, school storageMb=102_400/
     callCapacity=1_000. M9 brain-set targets are free voice=10, server_pro
     50GB/50, school 500GB/100. The spec must pin the M9 milestone numbers as
     canonical so the swap is unambiguous. (Money/pricing not re-litigated —
     standing founder delegation covers it.)
  2. maxServersPerOwner NON-RESTRICTIVE guarantee is load-bearing and already
     regressed once (wave-74 free-cap). Task 69765cee explicitly preserves it;
     P-2 must make "no maxServersPerOwner regression" an explicit AC, and
     db90252a's TOCTOU move-into-transaction must NOT silently tighten it.
  3. Mock-vs-real seam boundary: verify at B-block that MockBillingProvider
     mutates subscriptions.tier by serverId (matching resolveForServer's
     per-server key) and NOT an owner-level row — the create-gate resolver's
     owner-as-free assumption is a separate, still-valid deferral and must not be
     conflated with the per-server upgrade path.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
