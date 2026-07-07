verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
symptom_vs_cause: |
  Ran (mandatory). Not a symptom-vs-cause case — this is net-new substrate, not a
  fix for a surface symptom. Root need (a durable, billing-agnostic tier record
  BEFORE any Stripe/pricing work) is addressed at the correct layer (data model +
  app-boundary validation + a resolution service), not at a symptom layer. Seed's
  "no representation of tier today" premise VERIFIED: no tier/entitlement/plan/
  subscription code exists in apps/api/src, apps/web/src, or packages/shared/src
  (grep hits were substring false-positives). Per PRODUCT-PRINCIPLES rule 1, the
  false-absent premise was checked and holds.
reasoning: |
  Framing is sound and the sequencing is correct, not premature. Three framing
  claims were verified against the codebase and all hold: (1) the cited schema
  idiom is real and precise — apps/api/src/db/schema/reports.ts uses exactly the
  text-column + NO-pgEnum + app-layer-Zod pattern the seed prescribes, and
  packages/shared/src/ is the established shared-enum home (reports.ts,
  scheduling.ts, etc.); (2) there is no pre-existing tier representation, so this
  is additive not duplicative; (3) a REAL, verifiable gate surface exists —
  apps/api/src/servers/servers.service.ts createServer() currently enforces NO
  cap on servers-per-owner, giving the read-only entitlement check a concrete,
  non-hypothetical place to read the model. That defuses the wave-71/72/73
  "built but not wired" risk: the wiring target is a live method, not speculative
  plumbing.

  Premature-abstraction / YAGNI check: does NOT fire. A tier text column + a
  resolver service is the minimum viable substrate, not a framework/DSL/state
  machine (antipattern #4 not matched). The seed EXCLUDES the over-engineering
  surface explicitly — no Stripe IDs, no price columns, no quota values, no
  billing state machine — which is the correct restraint. Modeling three tier
  names is not the same as committing to those tiers: everything defaults to
  free and the caps are PLACEHOLDER, so the model is inert until the founder
  assigns tiers and sets real limits (both fenced). Config-drift (#6) does not
  fire because placeholder caps have a named real consumer (the createServer
  gate + the 1-2 wired gates), unlike a knob added for no consumer.
proposed_reframe: |
  (n/a — PROCEED)
framing_refinements:
  - >
    Keep the Zod enum minimal AND mark it founder-tunable. ['free','server_pro',
    'school'] is a reasonable minimal set (not itself founder-reserved) because
    'free' is load-bearing now and the two paid names are placeholders the
    founder can rename/add-to later without a migration — the column is plain
    text, so tier-name churn is an app-boundary Zod edit, zero DB cost. Annotate
    the enum in packages/shared as PLACEHOLDER paid-tier names, founder-tunable
    at the M9 pricing slice. Do NOT block P-block waiting on the founder to
    confirm exact tier names — the free-default makes the paid names inert.
  - >
    VERIFY the gate actually reads the model — do not accept "wired" on faith.
    P-2/P-3 must require a test that proves EntitlementsService.resolve() is
    invoked at the wired gate (e.g. at createServer): assert the resolver is
    called with the owner's id and that a stubbed restrictive cap DOES block,
    while the real free-tier placeholder cap does NOT. A test that only asserts
    "free tier can still create a server" is coverage theater — it passes even
    if the check is dead code. The restrictive-stub assertion is what proves the
    plumbing is live. (Aligns with the wave-71/72/73 built-but-not-wired lesson.)
  - >
    Placeholder-caps-as-config is the right restraint (not hardcoding, not
    waiting on founder). Config lets the founder tune limits at the M9 pricing
    slice without a code wave; free-default keeps it non-restrictive today.
    Ensure the placeholder free-tier caps are set permissive enough to be
    provably non-restrictive against the CURRENT unlimited createServer behavior
    (i.e. no existing user's server count regresses to blocked).
  - >
    Confirm subject modeling at P-1/P-2. Seed says server_id 'and/or' user_id.
    Recommend server-tier as the primary subject (the createServer gate and M9
    'server_pro'/'school' framing are server-scoped); user_id modeling is
    optional and should only be added if a wired gate consumes it this wave —
    otherwise defer to avoid an unconsumed column (config-drift-adjacent).
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
