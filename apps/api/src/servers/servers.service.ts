import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ServerDetail, ServerResponse, ServerSummary } from '@studyhall/shared';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { categories, channels, server_members, servers } from '../db/schema/index';

@Injectable()
export class ServersService {
  /**
   * Create a server in a single atomic transaction:
   * server → owner server_member → 'General' category → #general channel.
   */
  async createServer(ownerId: string, name: string): Promise<ServerResponse> {
    return await db.transaction(async (tx) => {
      const serverRows = await tx.insert(servers).values({ name, owner_id: ownerId }).returning();
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
}
