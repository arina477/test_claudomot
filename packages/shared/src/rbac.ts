import { z } from 'zod';

// ---------------------------------------------------------------------------
// RolePermissions — the 5 fixed RBAC flags (no matrix/builder/hierarchy)
// ---------------------------------------------------------------------------

export const RolePermissionsSchema = z.object({
  manage_server: z.boolean(),
  manage_roles: z.boolean(),
  manage_channels: z.boolean(),
  manage_members: z.boolean(),
  manage_assignments: z.boolean(),
});
export type RolePermissions = z.infer<typeof RolePermissionsSchema>;

// ---------------------------------------------------------------------------
// Role — full role shape returned from the API
// ---------------------------------------------------------------------------

export const RoleSchema = z.object({
  id: z.string().uuid(),
  serverId: z.string().uuid(),
  name: z.string(),
  position: z.number().int(),
  permissions: RolePermissionsSchema,
  isDefault: z.boolean(),
  createdAt: z.string(),
});
export type Role = z.infer<typeof RoleSchema>;

// ---------------------------------------------------------------------------
// ChannelOverride — a channel_permission_overrides row shape
// ---------------------------------------------------------------------------

export const ChannelOverrideSchema = z.object({
  id: z.string().uuid(),
  channelId: z.string().uuid(),
  roleId: z.string().uuid(),
  canView: z.boolean(),
});
export type ChannelOverride = z.infer<typeof ChannelOverrideSchema>;

// ---------------------------------------------------------------------------
// CreateRole — input schema for POST /servers/:id/roles
// ---------------------------------------------------------------------------

export const CreateRoleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  position: z.number().int().min(0).optional(),
  manage_server: z.boolean().optional(),
  manage_roles: z.boolean().optional(),
  manage_channels: z.boolean().optional(),
  manage_members: z.boolean().optional(),
  manage_assignments: z.boolean().optional(),
});
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;

// ---------------------------------------------------------------------------
// UpdateRole — input schema for PATCH /servers/:id/roles/:roleId
// ---------------------------------------------------------------------------

export const UpdateRoleSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
  manage_server: z.boolean().optional(),
  manage_roles: z.boolean().optional(),
  manage_channels: z.boolean().optional(),
  manage_members: z.boolean().optional(),
  manage_assignments: z.boolean().optional(),
});
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;

// ---------------------------------------------------------------------------
// AssignRole — input schema for PATCH /servers/:id/members/:userId/role
// ---------------------------------------------------------------------------

export const AssignRoleSchema = z.object({
  roleId: z.string().uuid().nullable(),
});
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;

// ---------------------------------------------------------------------------
// UpsertChannelOverride — input for POST /servers/:id/channels/:channelId/overrides
// ---------------------------------------------------------------------------

export const UpsertChannelOverrideSchema = z.object({
  roleId: z.string().uuid(),
  canView: z.boolean(),
});
export type UpsertChannelOverrideInput = z.infer<typeof UpsertChannelOverrideSchema>;

// ---------------------------------------------------------------------------
// EffectivePermissions — response contract for GET /servers/:serverId/me/permissions
// Includes the owner superuser flag alongside all 5 RBAC flags.
// ---------------------------------------------------------------------------

export const EffectivePermissionsSchema = z.object({
  owner: z.boolean(),
  manage_server: z.boolean(),
  manage_roles: z.boolean(),
  manage_channels: z.boolean(),
  manage_members: z.boolean(),
  manage_assignments: z.boolean(),
});
export type EffectivePermissions = z.infer<typeof EffectivePermissionsSchema>;
