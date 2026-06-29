import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { server_members, servers } from '../db/schema/index';

// ---------------------------------------------------------------------------
// OwnerLockoutService — last-owner invariant (task 7a10f13d)
//
// Problem: server must always retain at least one owner (servers.owner_id).
// If the owner demotes themselves (role-change that sets role to non-owner),
// removes themselves (member-remove), or leaves — and no other owner exists —
// we must block the action with 409 ConflictException.
//
// Implementation:
//   Three service methods map to the three mutating paths:
//     1. demoteOwner      — owner_id would lose server ownership (role change)
//     2. removeMember     — member with owner_id is removed
//     3. leaveServer      — owner calls leave
//
//   All checks run inside a transaction with a SELECT FOR UPDATE row-lock on
//   the server row so that concurrent demote+leave races cannot simultaneously
//   succeed and zero ownership.
//
//   "Last-owner": servers.owner_id is the single owner; we check
//   servers.owner_id === targetUserId / callerId. The server row lock
//   serialises concurrent operations on the same server.
// ---------------------------------------------------------------------------

@Injectable()
export class OwnerLockoutService {
  // -------------------------------------------------------------------------
  // demoteOwner — called when a role-change would affect the server owner.
  //
  // If userId === servers.owner_id and newOwnerId is null or unset (no
  // handover), block. Pass newOwnerId to transfer ownership atomically.
  //
  // Usage: call BEFORE processing the role-change. The method throws 409 if
  // the last-owner invariant would be violated; otherwise it optionally
  // transfers ownership if newOwnerId is provided.
  // -------------------------------------------------------------------------

  async demoteOwner(serverId: string, userId: string, newOwnerId?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Row-lock the server for the duration of this check
      const serverRows = await tx
        .select()
        .from(servers)
        .where(eq(servers.id, serverId))
        .for('update')
        .limit(1);

      const server = serverRows[0];
      if (!server) throw new NotFoundException('Server not found');

      // If the user is NOT the owner, no lockout check needed
      if (server.owner_id !== userId) return;

      // The user IS the owner — must transfer to someone else or block
      if (!newOwnerId) {
        throw new ConflictException('Cannot demote the last owner — transfer ownership first');
      }

      // Verify newOwnerId is a member of the server
      const [newOwnerMember] = await tx
        .select({ id: server_members.id })
        .from(server_members)
        .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, newOwnerId)))
        .limit(1);

      if (!newOwnerMember) {
        throw new NotFoundException('New owner must be a member of the server');
      }

      // Transfer ownership atomically
      await tx.update(servers).set({ owner_id: newOwnerId }).where(eq(servers.id, serverId));
    });
  }

  // -------------------------------------------------------------------------
  // removeMember — called when a member is to be removed from a server.
  //
  // If userId === servers.owner_id (the server owner is being removed),
  // block with 409. The owner must transfer ownership before leaving/removal.
  //
  // Pass forceIfTransfer=true to allow removal after ownership has already
  // been transferred in the same request context.
  // -------------------------------------------------------------------------

  async removeMember(serverId: string, targetUserId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Row-lock the server
      const serverRows = await tx
        .select()
        .from(servers)
        .where(eq(servers.id, serverId))
        .for('update')
        .limit(1);

      const server = serverRows[0];
      if (!server) throw new NotFoundException('Server not found');

      if (server.owner_id === targetUserId) {
        throw new ConflictException('Cannot remove the server owner — transfer ownership first');
      }

      // Perform the actual removal
      await tx
        .delete(server_members)
        .where(
          and(eq(server_members.server_id, serverId), eq(server_members.user_id, targetUserId)),
        );
    });
  }

  // -------------------------------------------------------------------------
  // leaveServer — called when a user leaves a server.
  //
  // If userId === servers.owner_id, block with 409.
  // The owner must transfer ownership before leaving.
  //
  // Concurrent demote+leave safety: row-lock on servers ensures that two
  // concurrent operations cannot simultaneously see themselves as non-owner
  // and proceed — only one can hold the row lock at a time.
  // -------------------------------------------------------------------------

  async leaveServer(serverId: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Row-lock the server row — serialises concurrent demote+leave
      const serverRows = await tx
        .select()
        .from(servers)
        .where(eq(servers.id, serverId))
        .for('update')
        .limit(1);

      const server = serverRows[0];
      if (!server) throw new NotFoundException('Server not found');

      if (server.owner_id === userId) {
        throw new ConflictException(
          'Cannot leave — you are the server owner. Transfer ownership first',
        );
      }

      // Verify the user is actually a member (give 404 not silent no-op)
      const [member] = await tx
        .select({ id: server_members.id })
        .from(server_members)
        .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
        .limit(1);

      if (!member) {
        throw new NotFoundException('Not a member of this server');
      }

      await tx
        .delete(server_members)
        .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)));
    });
  }

  // -------------------------------------------------------------------------
  // transferOwnership — atomic ownership transfer
  //
  // Validates new owner is a member; updates servers.owner_id inside txn.
  // Called by RbacController when an owner explicitly transfers ownership.
  // -------------------------------------------------------------------------

  async transferOwnership(
    serverId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const serverRows = await tx
        .select()
        .from(servers)
        .where(eq(servers.id, serverId))
        .for('update')
        .limit(1);

      const server = serverRows[0];
      if (!server) throw new NotFoundException('Server not found');

      if (server.owner_id !== currentOwnerId) {
        throw new ForbiddenException('Only the current owner can transfer ownership');
      }

      const [newOwnerMember] = await tx
        .select({ id: server_members.id })
        .from(server_members)
        .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, newOwnerId)))
        .limit(1);

      if (!newOwnerMember) {
        throw new NotFoundException('New owner must be a member of the server');
      }

      await tx.update(servers).set({ owner_id: newOwnerId }).where(eq(servers.id, serverId));
    });
  }
}
