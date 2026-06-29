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
  ServerResponse,
  ServerSummary,
} from '@studyhall/shared';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { categories, channels, invites, server_members, servers } from '../db/schema/index';

// ---------------------------------------------------------------------------
// CSPRNG code generator — ~128-bit entropy, URL-safe base64url (no +/=)
// ---------------------------------------------------------------------------

function generateCode(): string {
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

    return {
      server: {
        id: server.id,
        name: server.name,
        ownerId: server.owner_id,
      },
      categories: catRows.map((cat) => ({
        id: cat.id,
        name: cat.name,
        position: cat.position,
        channels: chanRows
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

      if (adHocInvite) {
        // Validate again inside txn (prevents TOCTOU)
        validateInviteActive(adHocInvite);
        serverId = adHocInvite.server_id;
        isAdHoc = true;
        inviteId = adHocInvite.id;
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
      // Max-uses guard: re-checked inside txn so a race between two concurrent joins
      // on a max_uses=1 invite is safe — the second writer sees uses=1 and the
      // validateInviteActive check above (re-read inside txn) rejects it.
      if (newMemberJoined && isAdHoc && inviteId) {
        await tx
          .update(invites)
          .set({ uses: sql`${invites.uses} + 1` })
          .where(eq(invites.id, inviteId));
      }

      return { serverId };
    });
  }
}
