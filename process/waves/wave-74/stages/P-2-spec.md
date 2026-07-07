# Wave 74 — P-2 Spec (pointer)
**Source of truth:** spec contract in task `53d18d7f`.description (YAML head + prose). Multi-spec.
**claimed_task_ids:** [53d18d7f (subscriptions tier model + free-default migration), e34642ef (shared tier/entitlements Zod contract + EntitlementsService), 2f61a317 (createServer gate wiring + verify-reads test)]. design_gap_flag=false.

## AC summary
- **e34642ef:** shared TierSchema z.enum(['free','server_pro','school'] — founder-tunable placeholders) + EntitlementsSchema; EntitlementsService.resolveForServer → tier (default free) + resolved caps from a single founder-tunable PLACEHOLDER config (caps only, NO prices).
- **53d18d7f:** subscriptions table (server_id FK, tier text no-pgEnum validated vs shared enum, timestamps; NO Stripe/price/quota cols) + migration; server defaults to 'free' (default-when-absent, no backfill); out-of-enum rejected at app boundary.
- **2f61a317:** read-only entitlement check at servers.service createServer (non-restrictive under free); **BINDING verify-reads test** — a stubbed RESTRICTIVE cap BLOCKS createServer (proves the gate reads the entitlement, not dead code), free cap does NOT block; optional thin "Your plan = Free" display.

## Fenced (founder-reserved, non-blocking checkpoint): Stripe SDK/keys, tier prices + real limits, checkout UI, M9 success-metric.
