# P-4 Phase-2 Spec-Drift Check — wave-74 (M9 entitlements substrate)

**Reviewer:** jenny (spec-compliance auditor)
**Date:** 2026-07-07
**Verdict: APPROVE**

The substrate spec aligns with the M9 milestone scope, the recorded 2026-07-07 M10→M9 pivot decision, and the M9 first-bundle decomposition. It builds the pricing/credential-independent substrate leg (not a phantom), the founder-reserved fence is airtight (no Stripe / price / quota columns, no checkout), the tier enum matches the milestone framing with founder-tunable placeholder names, and the M10-done→M9-in_progress trace is correct. No spec-drift or spec-gap of Critical/High severity found; two Low-severity notes for B-2 attention.

Sources cross-referenced:
- Spec: `tasks.description` YAML head, task `53d18d7f…` (3-spec bundle: `e34642ef` contract/service, `53d18d7f` data model, `2f61a317` gate wiring).
- Plan: `process/waves/wave-74/stages/P-3-plan.md`.
- Milestone M9 `3e507bc0-bce5-4f3b-b22a-d3c887fc0548` (verified `status=in_progress`, sole in-progress; M10 `97d65b49…` verified `status=done`).
- `command-center/product/product-decisions.md:812-823` (pivot entry + M9 decomposition entry).
- `process/session/updates/founder-checkpoint-2026-07-07-m9.md` (fenced founder asks).
- Code facts: `apps/api/src/db/schema/reports.ts` (idiom confirmed), `apps/api/src/servers/servers.service.ts:71` (createServer has no per-owner cap — confirmed).

---

## Per-item findings

### Item 1 — Substrate alignment with M9 scope + pivot decision — MATCHES

The milestone scope is "Stripe billing (Checkout), freemium model … Billing module + entitlements." The pivot decision (`product-decisions.md:814`) explicitly carves the FIRST slice as "pricing/credential-INDEPENDENT: the entitlements SUBSTRATE (plan/subscription data model + entitlements-check service + gate wiring, defaulting to the free tier)."

The three specs build exactly that substrate leg and nothing beyond:
- `53d18d7f`: `subscriptions` table (server_id + tier text + timestamps), free-when-absent default. No Stripe/price/quota columns (AC states this explicitly).
- `e34642ef`: shared Zod contract + `EntitlementsService.resolveForServer` reading a placeholder caps config (caps only, no prices).
- `2f61a317`: read-only entitlement check at the real `createServer` gate, non-restrictive under free.

This is the substrate, not a phantom. The spec's Problem statement matches the pivot rationale near-verbatim ("one integration point, not N scattered inline tier checks"). ceo-reviewer 9/10 + problem-framer PROCEED recorded.

### Item 2 — Founder-reserved / fenced scope leakage — MATCHES (fence airtight)

Every fenced item from the checkpoint (`founder-checkpoint-2026-07-07-m9.md`) and the decomposition entry (`product-decisions.md:821-822`) is explicitly excluded in the spec:

| Fenced item | Spec treatment | Airtight? |
|---|---|---|
| Stripe SDK / Checkout / webhooks / customer-portal | `53d18d7f` AC: "Explicitly EXCLUDES Stripe customer/subscription IDs"; plan "New deps: None (NO Stripe this wave — fenced)" | Yes |
| PRICE columns | `53d18d7f` AC + `data` contract: "No Stripe/price/quota columns" | Yes |
| Real feature LIMITS/quotas | `e34642ef` AC: "capability caps ONLY — NO prices … founder-tunable placeholder"; `53d18d7f`: "quota values (later M9 slices, founder-reserved)" | Yes |
| checkout/upgrade UI | `2f61a317` AC: "do NOT build the upgrade/assignment flow … NO pricing page, NO checkout, NO upgrade button" | Yes |
| M9 success-metric | FENCED block: "the M9 success-metric (_TBD by founder_ — must be set before any M9 enforcement/billing slice)" | Yes |
| educator-admin-tools build-out | FENCED: "models only the entitlement FLAG" | Yes |

Schema carries **no** Stripe/price/quota columns; the only tier signal is a `text tier` column validated at the app boundary. No checkout surface anywhere. Fence is airtight.

### Item 3 — Tier enum + paid-tier naming — MATCHES

Enum `['free','server_pro','school']` maps cleanly to the milestone's "free tier for individual study groups; paid school + server tiers":
- `free` ← "free tier for individual study groups"
- `school` ← "paid school … tier"
- `server_pro` ← "paid … server tier"

The two paid names are correctly framed as founder-tunable placeholders, not a committed pricing decision. `e34642ef` AC: "PLACEHOLDER paid-tier names — founder-tunable, zero DB cost to rename." Because `tier` is `text` (no pgEnum), renaming is a zero-migration app-boundary change — the placeholder framing is structurally honest, not just a comment. Pricing itself remains fenced (Item 2). No drift against the founder-reserved pricing decision.

### Item 4 — M10-done / M9-pivot trace — MATCHES

- DB confirms M10 `status=done`, M9 `status=in_progress` (sole in-progress milestone). This wave's spec + all 3 tasks trace to M9.
- `product-decisions.md:812-814` records the founder disposition: "M10 → done … good-enough-for-now" with deferred-compliance items listed and the promote-to-H1 trigger noted; "Promote M9 … → in_progress. First slice (autonomous, pricing/credential-INDEPENDENT): the entitlements SUBSTRATE."
- The spec's Problem line matches: "M9 … the founder pivoted here from M10 (privacy, good-enough) at the wave-73 resume." Trace is correct and consistent across DB + decision log + spec.

### Item 5 — New semantic divergence / spec-gap — MATCHES (no material gap)

- **Placeholder caps founder-tunable-not-final:** `e34642ef` AC requires the caps config be "clearly commented as founder-tunable placeholder values, set free-tier caps permissive enough that no existing server regresses." Plan self-consistency sweep item 6 explicitly distinguishes placeholder-caps from TBD-in-code ("placeholder caps are intentionally founder-tunable, not TBD-in-code"). Framing is sound.
- **Substrate genuinely enables the future charging slice without rework:** the single `EntitlementsService` seam + default-free-at-data-layer means the next slice is "point subscriptions at Stripe webhooks + swap placeholder caps for real numbers + add checkout" — one integration point. The `subscriptions` table is additively extensible (Stripe IDs / price refs become new columns; no rewrite of the tier resolution path). No architectural dead-end.
- **Non-dead-code enforcement:** the problem-framer BINDING refinement is carried into `2f61a317` AC (stubbed restrictive cap MUST make createServer BLOCK) and re-asserted in P-3 plan line 35. This prevents the substrate from shipping as inert plumbing — a genuine spec-strengthening, no gap.

---

## Low-severity notes (B-2 attention; NOT drift, do not block APPROVE)

1. **Gate-subject ambiguity (Low, spec-gap-adjacent):** `2f61a317` AC phrases the resolved subject as "the owner's/server-context tier" and "a servers-per-owner or storage cap," while the `subscriptions` schema is **server_id-scoped** (per-server, not per-owner) and `servers.owner_id` is the owner field. A servers-per-owner cap at `createServer` would need to resolve tier for an owner who may have no server yet (no subscriptions row → free default, which resolves cleanly). The spec already hedges ("e.g. a servers-per-owner or storage cap") and defers to the free default, so this is non-blocking — but B-2 should pick ONE concrete cap dimension and document how tier is resolved at create-time (owner-context vs. server-context) so the verify-gate-reads test targets the real path. `53d18d7f` correctly defers `user_id` unless a gate consumes it; this note is the reason it might.

2. **Optional "Your plan" display + optional GET endpoint (Low):** `2f61a317` marks both the thin display and its GET as OPTIONAL "only if cheap," and P-3 B-3 records a valid skip path. No drift — flagged only so T-9 Journey / the journey map aren't surprised by a conditionally-present surface. If the GET ships, it is a read-only tier display, still leaking no fenced scope.

---

## Recommendation

APPROVE for P-4 gate. The substrate spec is a faithful, fenced-airtight realization of the M9 first slice per the pivot decision and milestone scope. Route the two Low-severity notes to B-2 (backend-developer) as implementation-time clarifications, not spec rework. Suggest @task-completion-validator at V-block confirm the verify-gate-reads test actually asserts the restrictive-cap-BLOCKS path (the load-bearing anti-dead-code guarantee).
