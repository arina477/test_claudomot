# Wave 75 — P-2 Spec (pointer)

**Source of truth:** `tasks.description` of primary task **4bc40741-146a-4f05-8970-1614eb6b2b43** (YAML head + `---` + prose). This file is a convenience copy.

- **wave_type:** multi-spec (3 blocks)
- **claimed_task_ids:** [4bc40741 (seed), 69765cee, 77665ee5]
- **design_gap_flag:** false

## Acceptance criteria (copy for P-3/P-4 reference)

### Spec 1 — 4bc40741 BillingProvider seam + mock tier endpoint
- Owner POSTs valid targetTier to own server → 200 {serverId,tier,entitlements}, tier persisted.
- Non-owner → 403, unchanged. Unauth → 401. Invalid tier → 400. Unknown serverId → 404.
- After success, resolveForServer returns new tier's entitlements. Upsert: one row per server (UNIQUE server_id).
- Mock path: no real payment; response marks test/mock mode. Interface carries status + optional checkoutUrl (fits future async Stripe).

### Spec 2 — 69765cee real TIER_CAPS + educator-tools enforcement
- Caps: free {2048,10,false} / server_pro {51200,50,false} / school {512000,100,true}.
- Educator-tools endpoint 403 when tier lacks it (free/server_pro), allowed on school. free→school upgrade flips 403→allowed for that server.
- **Non-regression (hard AC):** maxServersPerOwner stays non-restrictive; high-count free owner still creates.

### Spec 3 — 77665ee5 "Your plan" panel + mock upgrade UI
- Owner sees current tier + limits; owner-only upgrade/downgrade affordance; non-owner read-only.
- Confirm → mock change → displayed tier+limits refresh without reload. Failure → inline error, unchanged. Mock-checkout label always visible; Claudomat/StudyHall-branded plain copy.

**Carried to P-3/P-4:** canonical caps pinned; non-regression AC; per-serverId seam; BillingProvider shaped for real-Stripe async/webhook; owner-only no-IDOR → security-scope tightened gate + T-8.
