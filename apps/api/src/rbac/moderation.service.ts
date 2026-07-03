import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { roles, server_members, servers } from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from './rbac.service';

// ---------------------------------------------------------------------------
// ModerationService — wave-41 (tasks 6cf06f99 + 6ddddc2d)
//
// Powers two moderation actions gated on can(moderate_members):
//   1. setMemberTimeout  — POST /servers/:serverId/members/:userId/timeout
//      Sets server_members.muted_until = now() + durationMinutes.
//      Rank guard: moderator cannot timeout a server owner, manage_server
//      holder, or manage_roles holder above them (403).
//   2. clearMemberTimeout — DELETE /servers/:serverId/members/:userId/timeout
//      Clears server_members.muted_until back to NULL (removes the timeout).
//      Same rank guard applies.
//
// Security invariants:
//   - callerUserId always comes from req.session.getUserId() (no IDOR).
//   - targetUserId from route param (validated against server membership).
//   - serverId from route param (validated for server existence).
//   - Rank guard: can't moderate a target who is the server owner, or holds
//     manage_server or manage_roles. These three conditions cover "above you".
// ---------------------------------------------------------------------------

@Injectable()
export class ModerationService {
  constructor(private readonly rbacService: RbacService) {}

  // -------------------------------------------------------------------------
  // setMemberTimeout — POST /servers/:serverId/members/:userId/timeout
  //
  // Requires: can(callerUserId, serverId, 'moderate_members')
  // Rank guard: 403 if target is owner / has manage_server / has manage_roles
  // Sets server_members.muted_until = now() + durationMinutes minutes.
  // -------------------------------------------------------------------------

  async setMemberTimeout(
    serverId: string,
    callerUserId: string,
    targetUserId: string,
    durationMinutes: number,
  ): Promise<{ mutedUntil: string }> {
    // Verify caller has moderate_members
    const canModerate = await this.rbacService.can(callerUserId, serverId, 'moderate_members');
    if (!canModerate) {
      throw new ForbiddenException('Insufficient permissions: moderate_members required');
    }

    // Rank guard
    await this.assertRankGuard(serverId, callerUserId, targetUserId);

    // Target must be a member of the server
    const [targetMember] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)))
      .limit(1);

    if (!targetMember) {
      throw new NotFoundException('Member not found in server');
    }

    const mutedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    await db
      .update(server_members)
      .set({ muted_until: mutedUntil })
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)));

    return { mutedUntil: mutedUntil.toISOString() };
  }

  // -------------------------------------------------------------------------
  // clearMemberTimeout — DELETE /servers/:serverId/members/:userId/timeout
  //
  // Requires: can(callerUserId, serverId, 'moderate_members')
  // Rank guard: same as setMemberTimeout.
  // Clears server_members.muted_until → NULL.
  // -------------------------------------------------------------------------

  async clearMemberTimeout(
    serverId: string,
    callerUserId: string,
    targetUserId: string,
  ): Promise<void> {
    // Verify caller has moderate_members
    const canModerate = await this.rbacService.can(callerUserId, serverId, 'moderate_members');
    if (!canModerate) {
      throw new ForbiddenException('Insufficient permissions: moderate_members required');
    }

    // Rank guard
    await this.assertRankGuard(serverId, callerUserId, targetUserId);

    // Target must be a member of the server
    const [targetMember] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)))
      .limit(1);

    if (!targetMember) {
      throw new NotFoundException('Member not found in server');
    }

    await db
      .update(server_members)
      .set({ muted_until: null })
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)));
  }

  // -------------------------------------------------------------------------
  // assertRankGuard — shared rank check for all moderation actions.
  //
  // A moderator CANNOT act on:
  //   1. The server owner (servers.owner_id === targetUserId)
  //   2. A member holding manage_server on their role
  //   3. A member holding manage_roles on their role
  //
  // These three cases cover "target is above you" for any realistic server
  // hierarchy. The can() path already grants the owner superuser access to
  // all flags, so conditions 2+3 transitively include the owner — but we
  // check owner_id separately for clarity and to avoid an extra role lookup.
  //
  // Returns void (throws ForbiddenException if guard fails).
  // -------------------------------------------------------------------------

  private async assertRankGuard(
    serverId: string,
    callerUserId: string,
    targetUserId: string,
  ): Promise<void> {
    // Self-moderation: moderator cannot timeout themselves (corner case)
    if (callerUserId === targetUserId) {
      throw new ForbiddenException('Cannot moderate yourself');
    }

    // Load server to check ownership
    const [server] = await db
      .select({ owner_id: servers.owner_id })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Guard 1: cannot moderate the server owner
    if (server.owner_id === targetUserId) {
      throw new ForbiddenException('Cannot moderate the server owner');
    }

    // Guards 2+3: load target's role and check manage_server / manage_roles
    const [targetMember] = await db
      .select({ role_id: server_members.role_id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)))
      .limit(1);

    if (!targetMember?.role_id) {
      // No role → no elevated permissions → rank guard passes
      return;
    }

    const [targetRole] = await db
      .select({ manage_server: roles.manage_server, manage_roles: roles.manage_roles })
      .from(roles)
      .where(eq(roles.id, targetMember.role_id))
      .limit(1);

    if (!targetRole) {
      // Role row missing (data inconsistency) — treat as no perms, guard passes
      return;
    }

    if (targetRole.manage_server || targetRole.manage_roles) {
      throw new ForbiddenException(
        'Cannot moderate a member with manage_server or manage_roles permissions',
      );
    }
  }
}
