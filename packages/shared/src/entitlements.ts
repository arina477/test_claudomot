import { z } from 'zod';

// ---------------------------------------------------------------------------
// TierSchema — enumeration of the subscription tiers available on the
// platform.
//
// FOUNDER-TUNABLE PLACEHOLDERS: 'server_pro' and 'school' are working names
// for the two paid tiers. The marketing labels (and any rename) are
// decided by the founder — update this enum to match when the names are
// finalised. The string values here are what the backend stores in the DB
// and checks at runtime.
// ---------------------------------------------------------------------------

export const TierSchema = z.enum(['free', 'server_pro', 'school']);
export type Tier = z.infer<typeof TierSchema>;

// ---------------------------------------------------------------------------
// EntitlementsSchema — the resolved capability shape for a given tier.
//
// This schema defines the DIMENSIONS of entitlements, not the VALUES. The
// concrete limits (e.g. how many MB, how many concurrent calls) are set in
// the backend's founder-tunable placeholder config and injected at runtime;
// this contract only describes the shape that the resolved object must
// satisfy.
//
// storageMb          — maximum file storage available to the tier, in MB.
// callCapacity       — maximum concurrent call participants allowed.
// educatorAdminTools — whether educator / admin tooling is unlocked for
//                      this tier (e.g. assignment management, roster access).
// ---------------------------------------------------------------------------

export const EntitlementsSchema = z.object({
  storageMb: z.number(),
  callCapacity: z.number(),
  educatorAdminTools: z.boolean(),
});
export type Entitlements = z.infer<typeof EntitlementsSchema>;
