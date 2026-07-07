import { Injectable } from '@nestjs/common';
import type { Tier } from '@studyhall/shared';
import { sql } from 'drizzle-orm';
import { db } from '../db/index';
import { subscriptions } from '../db/schema/index';
import type { BillingProvider, TierChangeResult } from './billing-provider.interface';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EntitlementsService } from './entitlements.service';

// ---------------------------------------------------------------------------
// MockBillingProvider — wave-75 M9 mock freemium upgrade path.
//
// TEST / MOCK MODE ONLY. NO real payment is taken. The `checkoutUrl: null` in
// every result is the marker that no hosted checkout occurred — a real Stripe
// provider would return a redirect URL here instead.
//
// startTierChange upserts the server's subscription row directly:
//   INSERT ... ON CONFLICT (server_id) DO UPDATE SET tier = $, updated_at = now()
// then re-resolves the canonical entitlements via EntitlementsService so the
// returned entitlements always reflect the freshly-persisted tier.
//
// Idempotent by construction: the UNIQUE(server_id) index guarantees exactly
// one row per server; a same-tier change simply rewrites tier to itself and
// bumps updated_at (a harmless no-op change).
// ---------------------------------------------------------------------------

@Injectable()
export class MockBillingProvider implements BillingProvider {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  async startTierChange(
    serverId: string,
    targetTier: Tier,
    _actorUserId: string,
  ): Promise<TierChangeResult> {
    // Upsert the subscription row — one row per server (UNIQUE(server_id)).
    await db
      .insert(subscriptions)
      .values({ server_id: serverId, tier: targetTier })
      .onConflictDoUpdate({
        target: subscriptions.server_id,
        set: { tier: targetTier, updated_at: sql`now()` },
      });

    // Re-resolve canonical entitlements from the just-persisted tier so the
    // response reflects exactly what resolveForServer will return going forward.
    const { tier, entitlements } = await this.entitlementsService.resolveForServer(serverId);

    return {
      status: 'ok',
      tier,
      entitlements,
      checkoutUrl: null, // MOCK MODE marker — no real payment / hosted checkout.
    };
  }
}
