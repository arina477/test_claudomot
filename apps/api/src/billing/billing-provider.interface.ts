import type { Entitlements, Tier } from '@studyhall/shared';

// ---------------------------------------------------------------------------
// BillingProvider — the payment-provider seam (wave-75 M9).
//
// This interface is the single boundary between the billing controller and
// whatever actually effects a tier change. Wave-75 ships ONE implementation:
// MockBillingProvider (no real money moves — see mock-billing.provider.ts).
//
// The shape deliberately accommodates a future async Stripe provider:
//   • `status` — 'ok' now; a real provider may later surface pending/redirect
//     states without changing the return type.
//   • `checkoutUrl` — null for the mock (nothing to redirect to). A real Stripe
//     provider returns a hosted-checkout URL here and the caller redirects.
//
// A real Stripe provider drops in behind the SAME BILLING_PROVIDER token later
// with zero controller changes.
// ---------------------------------------------------------------------------

export interface TierChangeResult {
  status: 'ok';
  tier: Tier;
  entitlements: Entitlements;
  /** null for the mock provider (no hosted checkout); a Stripe provider returns a redirect URL. */
  checkoutUrl: string | null;
}

export interface BillingProvider {
  /**
   * Effect a tier change for a server.
   *
   * @param serverId    the server whose tier is changing (already owner-checked
   *                    by the controller — the provider does NOT re-authorize).
   * @param targetTier  the desired tier (already Zod-validated at the boundary).
   * @param actorUserId the opaque userId of the owner who initiated the change
   *                    (for audit / future provider metadata; not a username).
   */
  startTierChange(
    serverId: string,
    targetTier: Tier,
    actorUserId: string,
  ): Promise<TierChangeResult>;
}

/** DI token for the active BillingProvider implementation. */
export const BILLING_PROVIDER = Symbol('BILLING_PROVIDER');
