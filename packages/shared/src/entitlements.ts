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

// ---------------------------------------------------------------------------
// TierChangeRequestSchema — request body for POST /billing/tier.
//
// Carries the single field the client must supply when requesting a tier
// upgrade or downgrade: the desired target tier. Validated at the boundary
// via TierSchema so invalid tier strings are rejected before they reach the
// service layer.
// ---------------------------------------------------------------------------

export const TierChangeRequestSchema = z.object({ targetTier: TierSchema });
export type TierChangeRequest = z.infer<typeof TierChangeRequestSchema>;

// ---------------------------------------------------------------------------
// ServerPlanSchema — canonical response shape for both billing endpoints:
//   • GET  /billing/plan          — returns the server's current plan.
//   • POST /billing/tier (200)    — returns the updated plan after a tier
//                                   change succeeds.
//
// serverId      — the server whose plan this describes.
// tier          — the current subscription tier (validated by TierSchema).
// entitlements  — the resolved capability object for that tier; shape
//                 defined by EntitlementsSchema.
//
// TierChangeResponse is a semantic alias kept for call-site clarity; it
// resolves to the same runtime schema as ServerPlan.
// ---------------------------------------------------------------------------

export const ServerPlanSchema = z.object({
  serverId: z.string(),
  tier: TierSchema,
  entitlements: EntitlementsSchema,
});
export type ServerPlan = z.infer<typeof ServerPlanSchema>;
export type TierChangeResponse = ServerPlan;
