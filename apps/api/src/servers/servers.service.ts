import { randomBytes } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  InvitePreview,
  InviteResponse,
  JoinResult,
  ServerDetail,
  ServerMember,
  ServerResponse,
  ServerSummary,
} from '@studyhall/shared';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index';
import {
  categories,
  channels,
  invites,
  roles,
  server_members,
  servers,
  users,
} from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// CSPRNG code generator — ~128-bit entropy, URL-safe base64url (no +/=)
// ---------------------------------------------------------------------------

export function generateCode(): string {
  return randomBytes(16).toString('base64url');
}

// ---------------------------------------------------------------------------
// Invite validation errors — unified shape for preview + join
// ---------------------------------------------------------------------------

function validateInviteActive(invite: {
  revoked: boolean;
  expires_at: Date | null;
  max_uses: number | null;
  uses: number;
}): void {
  if (invite.revoked) {
    throw new NotFoundException('Invite not found or invalid');
  }
  if (invite.expires_at !== null && invite.expires_at < new Date()) {
    throw new NotFoundException('Invite not found or invalid');
  }
  if (invite.max_uses !== null && invite.uses >= invite.max_uses) {
    throw new NotFoundException('Invite not found or invalid');
  }
}

@Injectable()
export class ServersService {
  constructor(private readonly rbacService: RbacService) {}
  /**
   * Create a server in a single atomic transaction:
   * server (with CSPRNG invite_code) → owner server_member → 'General' category → #general channel.
   */
  async createServer(ownerId: string, name: string): Promise<ServerResponse> {
    return await db.transaction(async (tx) => {
      const inviteCode = generateCode();

      const serverRows = await tx
        .insert(servers)
        .values({ name, owner_id: ownerId, invite_code: inviteCode })
        .returning();
      const server = serverRows[0];
      if (!server) throw new Error('Server insert failed unexpectedly');

      await tx.insert(roles).values({
        server_id: server.id,
        name: 'Member',
        position: 0,
        manage_server: false,
        manage_roles: false,
        manage_channels: false,
        manage_members: false,
        is_default: true,
      });

      await tx.insert(server_members).values({
        server_id: server.id,
        user_id: ownerId,
      });

      const categoryRows = await tx
        .insert(categories)
        .values({ server_id: server.id, name: 'General', position: 0 })
        .returning();
      const category = categoryRows[0];
      if (!category) throw new Error('Category insert failed unexpectedly');

      await tx.insert(channels).values({
        server_id: server.id,
        category_id: category.id,
        name: 'general',
        type: 'text',
        is_private: false,
        position: 0,
      });

      return {
        id: server.id,
        name: server.name,
        ownerId: server.owner_id,
        createdAt: server.created_at.toISOString(),
      };
    });
  }

  /** Return all servers the calling user is a member of. */
  async findMyServers(userId: string): Promise<ServerSummary[]> {
    const rows = await db
      .select({
        id: servers.id,
        name: servers.name,
        owner_id: servers.owner_id,
      })
      .from(servers)
      .innerJoin(server_members, eq(server_members.server_id, servers.id))
      .where(eq(server_members.user_id, userId));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
    }));
  }

  /**
   * Return full server detail including categories + channels.
   * Throws 404 if server does not exist.
   * Throws 403 if the calling user is not a member.
   *
   * Security (P-4 carry-forward): channels are filtered server-side by
   * visibility. Channels not visible to the caller's role are ABSENT from
   * the response — they are not included at all, preventing enumeration of
   * private channels (no hidden-channel enumeration via UI suppression alone).
   *
   * Visibility rules (delegated to RbacService.getVisibleChannelIds):
   *   - Owner → all channels
   *   - Public channel → visible unless override.can_view=false
   *   - Private channel → default-deny unless override.can_view=true
   */
  async findServerDetail(userId: string, serverId: string): Promise<ServerDetail> {
    const [server] = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const [member] = await db
      .select()
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) {
      throw new ForbiddenException('Not a member of this server');
    }

    const catRows = await db
      .select()
      .from(categories)
      .where(eq(categories.server_id, serverId))
      .orderBy(categories.position);

    const chanRows = await db
      .select()
      .from(channels)
      .where(eq(channels.server_id, serverId))
      .orderBy(channels.position);

    // Server-side channel visibility filtering — no enumeration leak
    const allChannelIds = chanRows.map((ch) => ch.id);
    const visibleIds = await this.rbacService.getVisibleChannelIds(userId, serverId, allChannelIds);
    // visibleIds === null means owner (all visible); otherwise filter to set
    const visibleChanRows =
      visibleIds === null ? chanRows : chanRows.filter((ch) => visibleIds.has(ch.id));

    return {
      server: {
        id: server.id,
        name: server.name,
        ownerId: server.owner_id,
        inviteCode: server.invite_code ?? null,
      },
      categories: catRows.map((cat) => ({
        id: cat.id,
        name: cat.name,
        position: cat.position,
        channels: visibleChanRows
          .filter((ch) => ch.category_id === cat.id)
          .map((ch) => ({
            id: ch.id,
            name: ch.name,
            type: ch.type,
            isPrivate: ch.is_private,
            position: ch.position,
          })),
      })),
    };
  }

  // -------------------------------------------------------------------------
  // Member list — GET /servers/:id/members (wave-14)
  // -------------------------------------------------------------------------

  /**
   * Return the public member roster for a server.
   * Caller must be a member of the server (403 otherwise).
   * Returns [{userId, displayName, avatarUrl}] for all members.
   * displayName falls back to email prefix if display_name is null.
   */
  async listServerMembers(userId: string, serverId: string): Promise<ServerMember[]> {
    // Member gate: caller must belong to this server
    const [callerMembership] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!callerMembership) {
      throw new ForbiddenException('Not a member of this server');
    }

    const rows = await db
      .select({
        userId: users.id,
        displayName: users.display_name,
        email: users.email,
        avatarUrl: users.avatar_url,
        username: users.username,
        profileVisibility: users.profile_visibility,
        // wave-41 M8: public mute state — all viewers see mutedUntil so the
        // amber indicator renders for everyone regardless of permissions.
        mutedUntil: server_members.muted_until,
      })
      .from(server_members)
      .innerJoin(users, eq(users.id, server_members.user_id))
      .where(eq(server_members.server_id, serverId));

    // Enforce profile_visibility: exclude 'nobody' members unless they are the
    // caller (a student always sees themselves in the roster regardless of their
    // own visibility setting). 'everyone' and 'server-members' are both visible
    // here because the viewer is already a verified co-member.
    return rows
      .filter((r) => r.profileVisibility !== 'nobody' || r.userId === userId)
      .map((r) => ({
        userId: r.userId,
        displayName: r.displayName || r.email.split('@')[0] || r.userId,
        avatarUrl: r.avatarUrl ?? null,
        username: r.username ?? null,
        mutedUntil: r.mutedUntil ? r.mutedUntil.toISOString() : null,
      }));
  }

  // -------------------------------------------------------------------------
  // Invite: create ad-hoc invite (task c7443638)
  // -------------------------------------------------------------------------

  /**
   * Create an ad-hoc invite for a server.
   * Caller must be a member of the server (403 otherwise).
   * Retries on CSPRNG code collision (unique constraint violation).
   */
  async createInvite(
    serverId: string,
    userId: string,
    options: { maxUses?: number | null | undefined; expiresAt?: string | null | undefined },
  ): Promise<InviteResponse> {
    // Member gate: caller must be a member of the server
    const [member] = await db
      .select()
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) {
      throw new ForbiddenException('Not a member of this server');
    }

    // Verify server exists (gives clearer 404 vs silent 403-with-no-server)
    const [server] = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);
    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Retry loop for CSPRNG code uniqueness (collision is astronomically rare
    // but we follow the spec requirement to retry on unique constraint violation)
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const code = generateCode();
      const expiresAt = options.expiresAt ? new Date(options.expiresAt) : null;

      try {
        await db.insert(invites).values({
          server_id: serverId,
          code,
          created_by: userId,
          max_uses: options.maxUses ?? null,
          uses: 0,
          expires_at: expiresAt,
          revoked: false,
        });

        return { code };
      } catch (err: unknown) {
        // Postgres unique_violation code = '23505'
        const pgErr = err as { code?: string };
        if (pgErr.code === '23505' && attempt < MAX_RETRIES - 1) {
          continue;
        }
        throw err;
      }
    }

    // Should never reach here — makes TypeScript happy
    throw new ConflictException('Failed to generate unique invite code');
  }

  // -------------------------------------------------------------------------
  // Invite revoke — authenticated + owner/creator-gated (task 863c10ef)
  // -------------------------------------------------------------------------

  /**
   * Revoke an ad-hoc invite by code.
   *
   * Authorization: caller must be the server owner (servers.owner_id) OR the
   * invite creator (invites.created_by).  Anyone else → 403.
   *
   * Permanent codes (servers.invite_code) are not stored in the invites table
   * and therefore return 404 — rotation of the permanent code is deferred.
   *
   * Idempotent: revoking an already-revoked invite returns 200 (no error).
   */
  async revokeInvite(code: string, callerId: string): Promise<void> {
    // Resolve the ad-hoc invite by code
    const [invite] = await db.select().from(invites).where(eq(invites.code, code)).limit(1);

    if (!invite) {
      throw new NotFoundException('Invite not found or invalid');
    }

    // Load the server to determine ownership
    const [server] = await db
      .select()
      .from(servers)
      .where(eq(servers.id, invite.server_id))
      .limit(1);

    if (!server) {
      throw new NotFoundException('Invite not found or invalid');
    }

    // Authorization: caller must be owner OR creator
    if (server.owner_id !== callerId && invite.created_by !== callerId) {
      throw new ForbiddenException('Not authorized to revoke this invite');
    }

    // Idempotent: set revoked=true regardless of current state
    await db.update(invites).set({ revoked: true }).where(eq(invites.id, invite.id));
  }

  // -------------------------------------------------------------------------
  // Invite-code rotate — owner-only (task d058283d)
  // -------------------------------------------------------------------------

  /**
   * Rotate the permanent invite code for a server.
   * Only the server owner may rotate (NOT owner-or-creator — no creator on a
   * permanent code). Regenerates servers.invite_code using CSPRNG; retries up
   * to 5 times on unique-constraint collision (23505); 409 after exhaustion.
   *
   * Known limitations (accepted at current scale):
   *
   * Rotate-vs-join race: the regeneration is a single non-transactional UPDATE.
   * A `joinViaInvite` transaction that snapshotted the OLD `invite_code` before
   * this UPDATE commits may still admit the member for the duration of that
   * in-flight join (READ COMMITTED isolation). Strict invalidation would require
   * a `SELECT ... FOR UPDATE` on the server row inside the join path to serialize
   * against the rotate UPDATE — deferred, out of this wave's scope.
   *
   * Retry scope: the 23505-retry loop guards only `servers.invite_code`
   * self-collisions. It does NOT guard the astronomically improbable (~2^-128)
   * case of a regenerated code colliding with an existing ad-hoc `invites.code`
   * in the separate resolution namespace. Documented as a known non-issue,
   * not guarded.
   */
  async rotateInviteCode(serverId: string, callerId: string): Promise<{ invite_code: string }> {
    const [server] = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    if (server.owner_id !== callerId) {
      throw new ForbiddenException("Not authorized to rotate this server's invite code");
    }

    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const code = generateCode();

      try {
        await db.update(servers).set({ invite_code: code }).where(eq(servers.id, serverId));
        return { invite_code: code };
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '23505' && attempt < MAX_RETRIES - 1) {
          continue;
        }
        throw err;
      }
    }

    throw new ConflictException('Failed to generate unique invite code');
  }

  // -------------------------------------------------------------------------
  // Invite preview — public (task 77e2041a)
  // -------------------------------------------------------------------------

  /**
   * Resolve an invite code (ad-hoc OR permanent servers.invite_code) and return
   * minimal server preview: {server: {id, name, memberCount}}.
   * NO members list, NO channels, NO categories.
   * Returns 404 for invalid / revoked / expired / maxed invites.
   */
  async getInvitePreview(code: string): Promise<InvitePreview> {
    // Try ad-hoc invite first
    const [adHocInvite] = await db.select().from(invites).where(eq(invites.code, code)).limit(1);

    if (adHocInvite) {
      validateInviteActive(adHocInvite);

      const [server] = await db
        .select()
        .from(servers)
        .where(eq(servers.id, adHocInvite.server_id))
        .limit(1);
      if (!server) throw new NotFoundException('Invite not found or invalid');

      const countRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(server_members)
        .where(eq(server_members.server_id, server.id));
      const memberCount = countRows[0]?.count ?? 0;

      return {
        server: {
          id: server.id,
          name: server.name,
          memberCount,
        },
      };
    }

    // Try permanent invite (servers.invite_code)
    const [server] = await db.select().from(servers).where(eq(servers.invite_code, code)).limit(1);

    if (!server) {
      throw new NotFoundException('Invite not found or invalid');
    }

    const countRows2 = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(server_members)
      .where(eq(server_members.server_id, server.id));
    const memberCount2 = countRows2[0]?.count ?? 0;

    return {
      server: {
        id: server.id,
        name: server.name,
        memberCount: memberCount2,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Invite join — authenticated + verified (task 77e2041a)
  // -------------------------------------------------------------------------

  /**
   * Join a server via invite code (ad-hoc or permanent).
   *
   * Atomicity contract (carry-forward B):
   *   1. Resolve + validate code inside the transaction.
   *   2. INSERT server_members ON CONFLICT (server_id, user_id) DO NOTHING RETURNING.
   *   3. Increment invite.uses ONLY when a new row was inserted (RETURNING returned a row)
   *      AND the code is an ad-hoc invite.
   *   4. Re-check max_uses inside the txn (prevents TOCTOU between validate + increment).
   *
   * An existing member re-joining returns 200 {serverId} without incrementing uses.
   */
  async joinViaInvite(code: string, userId: string): Promise<JoinResult> {
    return await db.transaction(async (tx) => {
      // Resolve code inside transaction — ad-hoc first, then permanent
      const [adHocInvite] = await tx.select().from(invites).where(eq(invites.code, code)).limit(1);

      let serverId: string;
      let isAdHoc: boolean;
      let inviteId: string | undefined;
      let adHocMaxUses: number | null = null;

      if (adHocInvite) {
        // Validate again inside txn (prevents TOCTOU)
        validateInviteActive(adHocInvite);
        serverId = adHocInvite.server_id;
        isAdHoc = true;
        inviteId = adHocInvite.id;
        adHocMaxUses = adHocInvite.max_uses;
      } else {
        // Try permanent invite
        const [server] = await tx
          .select()
          .from(servers)
          .where(eq(servers.invite_code, code))
          .limit(1);

        if (!server) {
          throw new NotFoundException('Invite not found or invalid');
        }
        serverId = server.id;
        isAdHoc = false;
      }

      // INSERT server_members ON CONFLICT DO NOTHING RETURNING
      // If the user is already a member, RETURNING yields an empty array.
      const inserted = await tx
        .insert(server_members)
        .values({ server_id: serverId, user_id: userId })
        .onConflictDoNothing()
        .returning();

      const newMemberJoined = inserted.length > 0;

      // Increment uses ONLY for ad-hoc invites AND only when a new row was inserted.
      // Atomic conditional consume (TOCTOU-safe):
      //   - For capped invites (max_uses != null): the WHERE clause includes
      //     `uses < max_uses` so the UPDATE acquires a per-row lock and only
      //     succeeds if a slot is still available.  If two concurrent joiners race
      //     on the last slot, exactly one wins (the other sees 0 rows returned) and
      //     we throw here → the whole transaction (including the INSERT above) rolls back.
      //   - For unlimited invites (max_uses == null): increment unconditionally.
      //   - Re-join (newMemberJoined=false): do NOT increment (carry-forward B).
      if (newMemberJoined && isAdHoc && inviteId) {
        const maxUses = adHocMaxUses;

        if (maxUses !== null) {
          // Atomic conditional: only succeeds if uses < max_uses at UPDATE time.
          const consumed = await tx
            .update(invites)
            .set({ uses: sql`${invites.uses} + 1` })
            .where(
              sql`${invites.id} = ${inviteId}
                  AND NOT ${invites.revoked}
                  AND (${invites.expires_at} IS NULL OR ${invites.expires_at} > now())
                  AND ${invites.uses} < ${maxUses}`,
            )
            .returning();

          if (consumed.length === 0) {
            // A concurrent joiner consumed the last slot between our SELECT and this UPDATE.
            // Throwing here causes the entire transaction (including the INSERT above) to roll back.
            throw new NotFoundException('Invite not found or invalid');
          }
        } else {
          // Unlimited invite — no cap to enforce, increment unconditionally.
          await tx
            .update(invites)
            .set({ uses: sql`${invites.uses} + 1` })
            .where(eq(invites.id, inviteId));
        }
      }

      return { serverId };
    });
  }
}
