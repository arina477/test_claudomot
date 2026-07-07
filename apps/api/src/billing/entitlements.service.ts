import { Injectable, Logger } from '@nestjs/common';
import { type Entitlements, type Tier, TierSchema } from '@studyhall/shared';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { servers, subscriptions } from '../db/schema/index';

// ---------------------------------------------------------------------------
// FOUNDER-TUNABLE PLACEHOLDER caps — capability limits only, NOT prices.
// Founder sets real numbers at the M9 pricing slice.
//
// Gate dimension chosen: servers-per-owner.
//
// Rationale: the subscriptions table records a tier per-server. At create
// time there is no server yet, so there is no server-level subscription to
// read. Owner-level tier is not modelled this wave. We therefore treat every
// creating owner as implicitly 'free'-tier and gate on how many servers they
// already own against the free cap. Once paid owner tiers land, this
// resolver can be upgraded to read an owner-level subscription row.
//
// NON-RESTRICTIVE GUARANTEE: maxServersPerOwner for the free tier MUST exceed
// the largest existing per-owner server count so the gate is non-restrictive
// until the founder assigns real tier limits. As of wave-74 verification, the
// highest observed owner has 646 servers (a test fixture inflated across e2e
// runs). The placeholder is set to 100_000 — well above that — so NO existing
// owner is blocked. Lower this number only after the paid tier upgrade flow ships.
//
// The public EntitlementsSchema ({storageMb, callCapacity, educatorAdminTools})
// is defined in the shared package. maxServersPerOwner is a create-gate-specific
// cap that does not belong in the public shape — it is kept internal here.
// ---------------------------------------------------------------------------

/** Internal-only create-gate cap; not part of the shared EntitlementsSchema. */
export interface CreateGateCaps extends Entitlements {
  maxServersPerOwner: number;
}

// ---------------------------------------------------------------------------
// CANONICAL brain-set caps (wave-75 M9). storageMb / callCapacity /
// educatorAdminTools are now the real freemium values; only maxServersPerOwner
// remains a non-restrictive create-gate placeholder.
//
// HARD NON-REGRESSION: free.maxServersPerOwner stays 100_000 — it MUST exceed
// the largest existing per-owner server count (646 as of wave-74). Lowering it
// would recreate the wave-74 free-cap regression. Do NOT lower it here; the
// lower cap only lands with the paid-tier upgrade flow.
// ---------------------------------------------------------------------------
const TIER_CAPS: Record<Tier, CreateGateCaps> = {
  free: {
    storageMb: 2_048, // 2 GB
    callCapacity: 10, // free-tier concurrent call participants
    educatorAdminTools: false,
    maxServersPerOwner: 100_000, // NON-REGRESSION: must exceed largest existing owner count (646 as of wave-74); do NOT lower until the upgrade flow ships
  },
  server_pro: {
    storageMb: 51_200, // 50 GB
    callCapacity: 50,
    educatorAdminTools: false,
    maxServersPerOwner: 200_000, // kept >= free (non-restrictive); founder-tunable at the pricing slice
  },
  school: {
    storageMb: 512_000, // 500 GB
    callCapacity: 100,
    educatorAdminTools: true,
    maxServersPerOwner: 500_000, // kept >= free (non-restrictive); founder-tunable at the pricing slice
  },
};

@Injectable()
export class EntitlementsService {
  private readonly logger = new Logger(EntitlementsService.name);

  /**
   * Resolve the tier and entitlements for an existing server.
   *
   * Tier-resolution semantics:
   *   1. SELECT from subscriptions WHERE server_id = serverId.
   *   2. No row → tier 'free' (default-when-absent per schema comment).
   *   3. Row present → validate against TierSchema.
   *      Out-of-enum value → safe-default to 'free', logged as warning.
   *   4. Return {tier, entitlements} from the placeholder caps config.
   */
  async resolveForServer(serverId: string): Promise<{ tier: Tier; entitlements: Entitlements }> {
    const rows = await db
      .select({ tier: subscriptions.tier })
      .from(subscriptions)
      .where(eq(subscriptions.server_id, serverId))
      .limit(1);

    const raw = rows[0]?.tier ?? 'free';

    const parsed = TierSchema.safeParse(raw);
    let tier: Tier;
    if (parsed.success) {
      tier = parsed.data;
    } else {
      this.logger.warn(
        `EntitlementsService.resolveForServer: server ${serverId} has unrecognised tier '${raw}'; safe-defaulting to 'free'`,
      );
      tier = 'free';
    }

    const caps = TIER_CAPS[tier];
    const entitlements: Entitlements = {
      storageMb: caps.storageMb,
      callCapacity: caps.callCapacity,
      educatorAdminTools: caps.educatorAdminTools,
    };

    return { tier, entitlements };
  }

  /**
   * Resolve create-gate caps for an owner about to create a new server.
   *
   * Owner-level tier resolution (this wave):
   *   Owner-level subscriptions are not modelled yet — every owner is treated
   *   as 'free'-tier. The free cap (maxServersPerOwner=100_000) is permissive
   *   enough that no existing owner is blocked (max observed: 646 servers).
   *   When owner-level tiers ship, replace with a subscriptions lookup keyed on owner_id.
   *
   * Returns the resolved caps and the owner's current server count so the
   * caller can compare against caps.maxServersPerOwner.
   */
  async resolveCreateGateForOwner(
    ownerId: string,
  ): Promise<{ tier: Tier; caps: CreateGateCaps; currentServerCount: number }> {
    // Owner treated as free-tier at create-gate (documented above).
    const tier: Tier = 'free';
    const caps = TIER_CAPS[tier];

    // Count how many servers this owner already has.
    const countRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(servers)
      .where(eq(servers.owner_id, ownerId));

    const currentServerCount = countRows[0]?.count ?? 0;

    return { tier, caps, currentServerCount };
  }
}
