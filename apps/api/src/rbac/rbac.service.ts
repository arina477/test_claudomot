import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AssignRoleInput,
  CreateRoleInput,
  Role,
  UpdateRoleInput,
} from '@studyhall/shared';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { roles, server_members, servers } from '../db/schema/index';

// ---------------------------------------------------------------------------
// Permission key type — the 4 fixed RBAC flags
// ---------------------------------------------------------------------------

export type Permission =
  | 'manage_server'
  | 'manage_roles'
  | 'manage_channels'
  | 'manage_members';

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
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, member.role_id))
      .limit(1);

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
      .where(
        and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)),
      )
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
      .where(
        and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)),
      );
  }
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
