import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AssignRoleInput,
  ChannelOverride,
  CreateRoleInput,
  Role,
  UpdateRoleInput,
  UpsertChannelOverrideInput,
} from '@studyhall/shared';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index';
import {
  channel_permission_overrides,
  channels,
  roles,
  server_members,
  servers,
} from '../db/schema/index';

// ---------------------------------------------------------------------------
// Permission key type — the 4 fixed RBAC flags
// ---------------------------------------------------------------------------

export type Permission = 'manage_server' | 'manage_roles' | 'manage_channels' | 'manage_members';

// ---------------------------------------------------------------------------
// RbacService
// ---------------------------------------------------------------------------

@Injectable()
export class RbacService {
  // -------------------------------------------------------------------------
  // can(userId, serverId, permission) — SERVER-SIDE permission check
  //
  // Superuser rule: server owner_id → true for ALL permissions.
  // Role resolution: server_members.role_id → roles.<flag>.
  // Default-DENY: no membership / null role_id / flag false → false.
  // userId ALWAYS comes from session token (no IDOR).
  // -------------------------------------------------------------------------

  async can(userId: string, serverId: string, permission: Permission): Promise<boolean> {
    // Load server to check ownership (superuser path)
    const [server] = await db
      .select({ owner_id: servers.owner_id })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server) {
      return false; // default-deny: server does not exist
    }

    if (server.owner_id === userId) {
      return true; // owner superuser — all permissions granted
    }

    // Resolve membership + role
    const [member] = await db
      .select({ role_id: server_members.role_id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) {
      return false; // default-deny: not a member
    }

    if (!member.role_id) {
      return false; // default-deny: null role (no role assigned)
    }

    // Load the role and check the specific flag
    const [role] = await db.select().from(roles).where(eq(roles.id, member.role_id)).limit(1);

    if (!role) {
      return false; // default-deny: role row missing (data inconsistency)
    }

    return role[permission] === true;
  }

  // -------------------------------------------------------------------------
  // listRoles — GET /servers/:id/roles
  // -------------------------------------------------------------------------

  async listRoles(serverId: string): Promise<Role[]> {
    const rows = await db
      .select()
      .from(roles)
      .where(eq(roles.server_id, serverId))
      .orderBy(roles.position);

    return rows.map(roleToDto);
  }

  // -------------------------------------------------------------------------
  // createRole — POST /servers/:id/roles
  // Requires: can(manage_roles)
  // -------------------------------------------------------------------------

  async createRole(serverId: string, input: CreateRoleInput): Promise<Role> {
    const [server] = await db
      .select({ id: servers.id })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const inserted = await db
      .insert(roles)
      .values({
        server_id: serverId,
        name: input.name,
        position: input.position ?? 0,
        manage_server: input.manage_server ?? false,
        manage_roles: input.manage_roles ?? false,
        manage_channels: input.manage_channels ?? false,
        manage_members: input.manage_members ?? false,
        is_default: false,
      })
      .returning();

    const role = inserted[0];
    if (!role) throw new Error('Role insert failed unexpectedly');
    return roleToDto(role);
  }

  // -------------------------------------------------------------------------
  // updateRole — PATCH /servers/:id/roles/:roleId
  // Requires: can(manage_roles)
  // -------------------------------------------------------------------------

  async updateRole(serverId: string, roleId: string, input: UpdateRoleInput): Promise<Role> {
    const [existing] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.server_id, serverId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    const patch: Partial<typeof existing> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.position !== undefined) patch.position = input.position;
    if (input.manage_server !== undefined) patch.manage_server = input.manage_server;
    if (input.manage_roles !== undefined) patch.manage_roles = input.manage_roles;
    if (input.manage_channels !== undefined) patch.manage_channels = input.manage_channels;
    if (input.manage_members !== undefined) patch.manage_members = input.manage_members;

    const updated = await db
      .update(roles)
      .set(patch)
      .where(and(eq(roles.id, roleId), eq(roles.server_id, serverId)))
      .returning();

    const role = updated[0];
    if (!role) throw new Error('Role update failed unexpectedly');
    return roleToDto(role);
  }

  // -------------------------------------------------------------------------
  // deleteRole — DELETE /servers/:id/roles/:roleId
  // Requires: can(manage_roles)
  // -------------------------------------------------------------------------

  async deleteRole(serverId: string, roleId: string): Promise<void> {
    const [existing] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.server_id, serverId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    // Guard: cannot delete a role that is still assigned to members
    const [assignedMember] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.role_id, roleId)))
      .limit(1);

    if (assignedMember) {
      throw new ConflictException(
        'Cannot delete a role that is still assigned to members; reassign them first',
      );
    }

    await db.delete(roles).where(and(eq(roles.id, roleId), eq(roles.server_id, serverId)));
  }

  // -------------------------------------------------------------------------
  // assignRole — PATCH /servers/:id/members/:userId/role
  //
  // Security invariants:
  //   1. Caller must have can(manage_members) — checked by the controller guard.
  //   2. No self-promote: a caller without manage_members cannot assign roles
  //      (enforced by the guard layer; service enforces separately as defence-
  //      in-depth via the callerUserId parameter).
  //   3. Target member must belong to the server.
  //   4. If roleId is non-null, the role must belong to the server.
  //
  // Note: owner-lockout invariant is in RbacOwnerLockoutService (task 7a10f13d).
  // -------------------------------------------------------------------------

  async assignRole(
    serverId: string,
    targetUserId: string,
    callerUserId: string,
    input: AssignRoleInput,
  ): Promise<void> {
    // Defence-in-depth: callerUserId must have manage_members
    // (primary check is the controller guard, but we enforce here too)
    const allowed = await this.can(callerUserId, serverId, 'manage_members');
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions: manage_members required');
    }

    // Target must be a member of the server
    const [targetMember] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)))
      .limit(1);

    if (!targetMember) {
      throw new NotFoundException('Member not found in server');
    }

    // If assigning a specific role, validate it belongs to this server
    if (input.roleId !== null) {
      const [role] = await db
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.id, input.roleId), eq(roles.server_id, serverId)))
        .limit(1);

      if (!role) {
        throw new NotFoundException('Role not found in server');
      }
    }

    await db
      .update(server_members)
      .set({ role_id: input.roleId })
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)));
  }

  // -------------------------------------------------------------------------
  // canViewChannel — server-side channel visibility check
  //
  // Rules (P-4 carry-forward):
  //   1. Owner → can always view all channels.
  //   2. Public channel (is_private=false) + no override → visible.
  //   3. Public channel + override.can_view=false → NOT visible.
  //   4. Private channel (is_private=true) + no override → DEFAULT-DENY (false).
  //   5. Private channel + override.can_view=true → visible.
  //   6. No membership → false.
  //   7. No role_id (null role) → treated as default-member for visibility:
  //      public visible (unless explicit deny override), private always deny.
  // -------------------------------------------------------------------------

  async canViewChannel(userId: string, serverId: string, channelId: string): Promise<boolean> {
    // Owner superuser — always visible
    const [server] = await db
      .select({ owner_id: servers.owner_id })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server) return false;
    if (server.owner_id === userId) return true;

    // Membership check
    const [member] = await db
      .select({ role_id: server_members.role_id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) return false;

    // Load the channel
    const [channel] = await db
      .select({ is_private: channels.is_private, server_id: channels.server_id })
      .from(channels)
      .where(and(eq(channels.id, channelId), eq(channels.server_id, serverId)))
      .limit(1);

    if (!channel) return false;

    // Check override for the member's role (if any)
    let overrideCanView: boolean | null = null;
    if (member.role_id) {
      const [override] = await db
        .select({ can_view: channel_permission_overrides.can_view })
        .from(channel_permission_overrides)
        .where(
          and(
            eq(channel_permission_overrides.channel_id, channelId),
            eq(channel_permission_overrides.role_id, member.role_id),
          ),
        )
        .limit(1);

      if (override !== undefined) {
        overrideCanView = override.can_view;
      }
    }

    if (channel.is_private) {
      // Private: default-deny unless override explicitly grants can_view=true
      return overrideCanView === true;
    }

    // Public: visible unless override explicitly denies (can_view=false)
    if (overrideCanView === false) return false;
    return true;
  }

  // -------------------------------------------------------------------------
  // canViewChannelById — channel-id-only visibility check (wave-12)
  //
  // Used by ChannelMessageGuard where the route has NO :serverId param
  // (e.g. POST/GET /channels/:channelId/messages).
  //
  // Resolves server_id from channels.server_id (notNull — always present),
  // then delegates to the existing canViewChannel() logic.
  // Returns false (default-deny) when the channel does not exist → caller
  // should throw 404 for missing channel or 403 for permission failure.
  // -------------------------------------------------------------------------

  async canViewChannelById(userId: string, channelId: string): Promise<boolean> {
    const [channel] = await db
      .select({ server_id: channels.server_id })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) return false; // channel missing → default-deny (guard → 403/404)

    return this.canViewChannel(userId, channel.server_id, channelId);
  }

  // -------------------------------------------------------------------------
  // getVisibleChannelIds — return the set of channel IDs visible to the user
  // Used by findServerDetail to filter channels server-side.
  //
  // If userId is owner → return all channelIds (null = all).
  // Otherwise compute per-channel visibility for this member's role.
  // -------------------------------------------------------------------------

  async getVisibleChannelIds(
    userId: string,
    serverId: string,
    allChannelIds: string[],
  ): Promise<Set<string> | null> {
    // Owner sees everything
    const [server] = await db
      .select({ owner_id: servers.owner_id })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server) return new Set();
    if (server.owner_id === userId) return null; // null = all channels

    // Get membership + role
    const [member] = await db
      .select({ role_id: server_members.role_id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) return new Set(); // not a member → no channels visible

    // Load overrides for this role across all channels in the server (if role set)
    const overrideMap = new Map<string, boolean>(); // channel_id → can_view
    if (member.role_id) {
      const overrideRows = await db
        .select({
          channel_id: channel_permission_overrides.channel_id,
          can_view: channel_permission_overrides.can_view,
        })
        .from(channel_permission_overrides)
        .where(eq(channel_permission_overrides.role_id, member.role_id));

      for (const row of overrideRows) {
        overrideMap.set(row.channel_id, row.can_view);
      }
    }

    // Load channel privacy flags for all channels in this server
    const channelRows = await db
      .select({ id: channels.id, is_private: channels.is_private })
      .from(channels)
      .where(eq(channels.server_id, serverId));

    const visibleIds = new Set<string>();
    for (const ch of channelRows) {
      if (!allChannelIds.includes(ch.id)) continue; // only consider requested channels
      const overrideCanView = overrideMap.get(ch.id) ?? null;
      if (ch.is_private) {
        if (overrideCanView === true) visibleIds.add(ch.id);
      } else {
        if (overrideCanView !== false) visibleIds.add(ch.id);
      }
    }

    return visibleIds;
  }

  // -------------------------------------------------------------------------
  // channel_permission_overrides CRUD
  // Requires: can(manage_channels)
  // -------------------------------------------------------------------------

  /** List all overrides for a channel */
  async listChannelOverrides(serverId: string, channelId: string): Promise<ChannelOverride[]> {
    const [channel] = await db
      .select({ id: channels.id })
      .from(channels)
      .where(and(eq(channels.id, channelId), eq(channels.server_id, serverId)))
      .limit(1);

    if (!channel) throw new NotFoundException('Channel not found');

    const rows = await db
      .select()
      .from(channel_permission_overrides)
      .where(eq(channel_permission_overrides.channel_id, channelId));

    return rows.map(overrideToDto);
  }

  /** Upsert (insert or update) a channel override */
  async upsertChannelOverride(
    serverId: string,
    channelId: string,
    input: UpsertChannelOverrideInput,
  ): Promise<ChannelOverride> {
    const [channel] = await db
      .select({ id: channels.id })
      .from(channels)
      .where(and(eq(channels.id, channelId), eq(channels.server_id, serverId)))
      .limit(1);

    if (!channel) throw new NotFoundException('Channel not found');

    // Verify role belongs to this server
    const [role] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.id, input.roleId), eq(roles.server_id, serverId)))
      .limit(1);

    if (!role) throw new NotFoundException('Role not found in server');

    // Upsert: insert or update on UNIQUE(channel_id, role_id)
    const result = await db
      .insert(channel_permission_overrides)
      .values({
        channel_id: channelId,
        role_id: input.roleId,
        can_view: input.canView,
      })
      .onConflictDoUpdate({
        target: [channel_permission_overrides.channel_id, channel_permission_overrides.role_id],
        set: { can_view: input.canView },
      })
      .returning();

    const row = result[0];
    if (!row) throw new Error('Channel override upsert failed unexpectedly');
    return overrideToDto(row);
  }

  /** Delete a channel override */
  async deleteChannelOverride(serverId: string, channelId: string, roleId: string): Promise<void> {
    const [channel] = await db
      .select({ id: channels.id })
      .from(channels)
      .where(and(eq(channels.id, channelId), eq(channels.server_id, serverId)))
      .limit(1);

    if (!channel) throw new NotFoundException('Channel not found');

    const [existing] = await db
      .select({ id: channel_permission_overrides.id })
      .from(channel_permission_overrides)
      .where(
        and(
          eq(channel_permission_overrides.channel_id, channelId),
          eq(channel_permission_overrides.role_id, roleId),
        ),
      )
      .limit(1);

    if (!existing) throw new NotFoundException('Override not found');

    await db
      .delete(channel_permission_overrides)
      .where(
        and(
          eq(channel_permission_overrides.channel_id, channelId),
          eq(channel_permission_overrides.role_id, roleId),
        ),
      );
  }
}

// ---------------------------------------------------------------------------
// Mapper: DB row → ChannelOverride DTO
// ---------------------------------------------------------------------------

function overrideToDto(row: {
  id: string;
  channel_id: string;
  role_id: string;
  can_view: boolean;
}): ChannelOverride {
  return {
    id: row.id,
    channelId: row.channel_id,
    roleId: row.role_id,
    canView: row.can_view,
  };
}

// ---------------------------------------------------------------------------
// Mapper: DB row → Role DTO
// ---------------------------------------------------------------------------

function roleToDto(row: {
  id: string;
  server_id: string;
  name: string;
  position: number;
  manage_server: boolean;
  manage_roles: boolean;
  manage_channels: boolean;
  manage_members: boolean;
  is_default: boolean;
  created_at: Date;
}): Role {
  return {
    id: row.id,
    serverId: row.server_id,
    name: row.name,
    position: row.position,
    permissions: {
      manage_server: row.manage_server,
      manage_roles: row.manage_roles,
      manage_channels: row.manage_channels,
      manage_members: row.manage_members,
    },
    isDefault: row.is_default,
    createdAt: row.created_at.toISOString(),
  };
}
